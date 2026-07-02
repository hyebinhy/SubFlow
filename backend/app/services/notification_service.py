from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification import Notification, NotificationType
from app.models.notification_setting import NotificationSetting
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.notification import NotificationSettingsUpdateRequest


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── 인박스 ─────────────────────────────────────────────
    async def list_inbox(
        self, user_id: UUID, unread_only: bool = False, limit: int = 50
    ) -> tuple[list[Notification], int]:
        """파생 알림을 최신화한 뒤 인박스 목록 + 안읽음 개수를 반환."""
        await self.sync_all_derived(user_id)

        stmt = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_archived.is_(False),
        )
        if unread_only:
            stmt = stmt.where(Notification.is_read.is_(False))
        stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)

        items = list((await self.db.execute(stmt)).scalars().all())
        unread = await self.get_unread_count(user_id)
        return items, unread

    async def get_unread_count(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_archived.is_(False),
                Notification.is_read.is_(False),
            )
        )
        return int(result.scalar_one())

    async def mark_read(self, user_id: UUID, notification_id: UUID) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
        return result.rowcount or 0

    async def mark_all_read(self, user_id: UUID) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_archived.is_(False),
                Notification.is_read.is_(False),
            )
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        await self.db.commit()
        return result.rowcount or 0

    async def archive(self, user_id: UUID, notification_id: UUID) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.is_archived.is_(False),
            )
            .values(is_archived=True)
        )
        await self.db.commit()
        return result.rowcount or 0

    async def sync_overlap_notifications(self, user_id: UUID) -> None:
        """카테고리 중복 탐지 결과를 알림으로 승격.
        - 새 중복 → 알림 생성 (dedup_key로 중복 삽입 방지)
        - 기존 중복 지속 → 내용 갱신 (사용자가 닫은 알림은 건드리지 않음)
        - 해소된 중복 → 자동 보관(archive)
        """
        # 순환 import 방지: 메서드 내부에서 import
        from app.services.analytics_service import AnalyticsService

        overlaps = (await AnalyticsService(self.db).detect_overlaps(user_id)).overlaps
        current_keys = {f"overlap:{o.category}" for o in overlaps}

        # 기존 overlap 알림 로드
        existing = list(
            (
                await self.db.execute(
                    select(Notification).where(
                        Notification.user_id == user_id,
                        Notification.type == NotificationType.OVERLAP.value,
                    )
                )
            )
            .scalars()
            .all()
        )
        by_key = {n.dedup_key: n for n in existing}

        for o in overlaps:
            key = f"overlap:{o.category}"
            title = f"'{o.category}' 카테고리에 구독 {len(o.services)}개가 겹칩니다"
            body = f"{', '.join(o.services)} · 월 약 {int(o.total_monthly_cost):,}원. 통합을 고려해보세요."
            note = by_key.get(key)
            if note is None:
                self.db.add(
                    Notification(
                        user_id=user_id,
                        type=NotificationType.OVERLAP.value,
                        title=title,
                        body=body,
                        category="구독 알림",
                        link="/analytics",
                        dedup_key=key,
                    )
                )
            elif not note.is_archived:
                # 사용자가 닫지 않은 알림만 최신 내용으로 갱신
                note.title = title
                note.body = body

        # 더 이상 겹치지 않는 항목은 자동 보관
        for note in existing:
            if note.dedup_key not in current_keys and not note.is_archived:
                note.is_archived = True

        await self.db.commit()

    async def sync_price_change_notifications(self, user_id: UUID) -> None:
        """내 구독 요금제의 가격 변동을 개인화 알림으로 승격.
        가격 변동은 '이벤트'이므로 dedup_key에 발효일을 포함해 새 변동만 추가하고,
        지난 알림은 히스토리로 남긴다(자동 보관하지 않음).
        """
        from app.services.analytics_service import AnalyticsService

        alerts = (await AnalyticsService(self.db).get_price_change_alerts(user_id)).alerts
        if not alerts:
            return

        existing_keys = set(
            (
                await self.db.execute(
                    select(Notification.dedup_key).where(
                        Notification.user_id == user_id,
                        Notification.type == NotificationType.PRICE_CHANGE.value,
                    )
                )
            )
            .scalars()
            .all()
        )

        cancel_urls = await self._cancel_urls(user_id)

        def _fmt(amount, currency: str) -> str:
            n = float(amount)
            if currency in ("KRW", "JPY"):
                return f"{round(n):,}{'원' if currency == 'KRW' else '엔'}"
            symbol = {"USD": "$", "EUR": "€", "GBP": "£"}.get(currency, currency + " ")
            return f"{symbol}{n:,.2f}"

        for a in alerts:
            key = f"price_change:{a.subscription_id}:{a.effective_date}"
            if key in existing_keys:
                continue
            up = a.change_amount > 0
            pct = f"{'+' if up else ''}{a.change_percentage:.1f}%"
            title = f"{a.service_name} 요금이 {'인상' if up else '인하'}됐어요"
            body = (
                f"{a.plan_name} · {_fmt(a.old_price, a.currency)} → "
                f"{_fmt(a.new_price, a.currency)} ({pct})"
            )
            cancel_url = cancel_urls.get(a.subscription_id)
            self.db.add(
                Notification(
                    user_id=user_id,
                    type=NotificationType.PRICE_CHANGE.value,
                    title=title,
                    body=body,
                    category="구독 알림",
                    link="/subscriptions",
                    action_url=cancel_url,
                    action_label="해지 가이드" if cancel_url else None,
                    dedup_key=key,
                )
            )

        await self.db.commit()

    async def sync_all_derived(self, user_id: UUID) -> None:
        """분석 결과를 인박스 알림으로 일괄 승격 (인박스 조회·발송 공통 진입점)."""
        await self.sync_overlap_notifications(user_id)
        await self.sync_price_change_notifications(user_id)
        await self.sync_trial_notifications(user_id)
        await self.sync_budget_notifications(user_id)
        await self.sync_exchange_rate_notifications(user_id)

    async def _cancel_urls(self, user_id: UUID) -> dict[str, str]:
        """구독ID → 서비스 해지 URL (cancel_url 있는 것만)."""
        from app.models.service import Service

        rows = (
            await self.db.execute(
                select(Subscription.id, Service.cancel_url)
                .join(Service, Subscription.service_id == Service.id)
                .where(
                    Subscription.user_id == user_id,
                    Service.cancel_url.isnot(None),
                )
            )
        ).all()
        return {str(sid): url for sid, url in rows if url}

    async def _existing_keys(self, user_id: UUID, ntype: NotificationType) -> set[str]:
        rows = (
            await self.db.execute(
                select(Notification.dedup_key).where(
                    Notification.user_id == user_id,
                    Notification.type == ntype.value,
                )
            )
        ).scalars().all()
        return set(rows)

    async def sync_trial_notifications(self, user_id: UUID) -> None:
        """무료 체험 만료 임박(D-7 이내) 알림."""
        from app.services.analytics_service import AnalyticsService

        trials = (await AnalyticsService(self.db).get_trial_subscriptions(user_id)).trials
        existing = await self._existing_keys(user_id, NotificationType.TRIAL_EXPIRY)
        cancel_urls = await self._cancel_urls(user_id)

        for t in trials:
            if t.days_remaining < 0 or t.days_remaining > 7:
                continue
            key = f"trial:{t.id}:{t.trial_end_date}"
            if key in existing:
                continue
            dday = "오늘" if t.days_remaining == 0 else f"D-{t.days_remaining}"
            cancel_url = cancel_urls.get(t.id)
            self.db.add(
                Notification(
                    user_id=user_id,
                    type=NotificationType.TRIAL_EXPIRY.value,
                    title=f"{t.service_name} 무료체험이 곧 끝나요 ({dday})",
                    body=f"{t.trial_end_date} 이후 월 {int(t.cost_after_trial_krw):,}원이 청구돼요.",
                    category="구독 알림",
                    link="/subscriptions",
                    action_url=cancel_url,
                    action_label="해지 가이드" if cancel_url else None,
                    dedup_key=key,
                )
            )
        await self.db.commit()

    async def sync_budget_notifications(self, user_id: UUID) -> None:
        """월 예산 초과 알림 (월 1회)."""
        from app.services.analytics_service import AnalyticsService

        status_ = await AnalyticsService(self.db).get_budget_status(user_id)
        if not status_.is_over_budget or status_.budget_monthly is None:
            return

        key = f"budget:{date.today():%Y-%m}"
        existing = await self._existing_keys(user_id, NotificationType.BUDGET)
        if key in existing:
            return

        self.db.add(
            Notification(
                user_id=user_id,
                type=NotificationType.BUDGET.value,
                title="이번 달 예산을 초과했어요",
                body=(
                    f"지출 {int(status_.current_spending):,}원 / 예산 "
                    f"{int(status_.budget_monthly):,}원 ({status_.percentage_used:.0f}%)"
                ),
                category="구독 알림",
                link="/analytics",
                dedup_key=key,
            )
        )
        await self.db.commit()

    async def sync_exchange_rate_notifications(self, user_id: UUID) -> None:
        """외화 구독 환율 급등 알림 (구독별 월 1회)."""
        from app.services.analytics_service import AnalyticsService

        alerts = (await AnalyticsService(self.db).get_exchange_rate_alerts(user_id)).alerts
        if not alerts:
            return

        existing = await self._existing_keys(user_id, NotificationType.EXCHANGE_RATE)
        month = f"{date.today():%Y-%m}"

        for a in alerts:
            key = f"fx:{a.subscription_id}:{month}"
            if key in existing:
                continue
            self.db.add(
                Notification(
                    user_id=user_id,
                    type=NotificationType.EXCHANGE_RATE.value,
                    title=f"{a.service_name} 환율이 올랐어요",
                    body=(
                        f"{a.currency} +{a.change_percentage:.1f}% · "
                        f"월 약 {int(a.extra_cost_krw):,}원 더 나가요."
                    ),
                    category="구독 알림",
                    link="/analytics",
                    dedup_key=key,
                )
            )
        await self.db.commit()

    # ── 설정 ───────────────────────────────────────────────

    async def get_settings(self, user_id: UUID) -> NotificationSetting:
        result = await self.db.execute(
            select(NotificationSetting).where(NotificationSetting.user_id == user_id)
        )
        settings = result.scalar_one_or_none()
        if not settings:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification settings not found")
        return settings

    async def set_push_token(self, user_id: UUID, token: str | None) -> NotificationSetting:
        """Expo 푸시 토큰 저장 (설정이 없으면 생성)."""
        result = await self.db.execute(
            select(NotificationSetting).where(NotificationSetting.user_id == user_id)
        )
        settings_row = result.scalar_one_or_none()
        if settings_row is None:
            settings_row = NotificationSetting(user_id=user_id)
            self.db.add(settings_row)
        settings_row.push_token = token
        # 토큰을 등록하면 푸시 알림을 켠다
        if token:
            settings_row.push_notifications = True
        await self.db.commit()
        await self.db.refresh(settings_row)
        return settings_row

    async def update_settings(self, user_id: UUID, data: NotificationSettingsUpdateRequest) -> NotificationSetting:
        settings = await self.get_settings(user_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(settings, key, value)
        await self.db.commit()
        await self.db.refresh(settings)
        return settings

    async def get_upcoming_renewals(self, user_id: UUID) -> list[Subscription]:
        settings = await self.get_settings(user_id)
        today = date.today()
        end_date = today + timedelta(days=settings.notify_days_before)

        result = await self.db.execute(
            select(Subscription)
            .options(selectinload(Subscription.category))
            .where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.next_billing_date >= today,
                Subscription.next_billing_date <= end_date,
            )
            .order_by(Subscription.next_billing_date.asc())
        )
        return list(result.scalars().all())
