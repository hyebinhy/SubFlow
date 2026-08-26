"""결제 임박 알림(sync_renewal_notifications) 테스트.

'결제 N일 전 알림' 설정이 실제로 알림을 만들어 내는지, 그리고 결제 주기마다
한 번씩만 나가는지를 고정한다.
"""

from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType
from app.models.notification_setting import NotificationSetting
from app.models.subscription import BillingCycle, Subscription, SubscriptionStatus
from app.models.user import User
from app.services.notification_service import NotificationService


async def _make_user(
    db: AsyncSession, email: str = "renewal@example.com", *, notify_days_before: int | None = None
) -> User:
    """사용자 + 알림 설정을 만든다. 실제 가입 흐름에서도 둘은 같이 생긴다."""
    user = User(email=email, hashed_password="x", username="renewal")
    db.add(user)
    await db.flush()
    if notify_days_before is not None:
        db.add(NotificationSetting(user_id=user.id, notify_days_before=notify_days_before))
        await db.flush()
    return user


async def _make_sub(
    db: AsyncSession,
    user_id: UUID,
    *,
    name: str,
    days_ahead: int,
    cost: str = "13500",
    currency: str = "KRW",
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
    member_count: int = 1,
) -> Subscription:
    sub = Subscription(
        user_id=user_id,
        service_name=name,
        cost=Decimal(cost),
        currency=currency,
        billing_cycle=BillingCycle.MONTHLY,
        start_date=date.today() - timedelta(days=60),
        next_billing_date=date.today() + timedelta(days=days_ahead),
        status=status,
        member_count=member_count,
    )
    db.add(sub)
    await db.flush()
    return sub


async def _renewal_notes(db: AsyncSession, user_id: UUID) -> list[Notification]:
    rows = await db.execute(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.type == NotificationType.RENEWAL.value,
        )
    )
    return list(rows.scalars().all())


async def test_creates_notification_within_notify_window(test_db: AsyncSession):
    """설정한 일수 안에 결제일이 있으면 알림이 만들어진다."""
    user = await _make_user(test_db, notify_days_before=3)
    await _make_sub(test_db, user.id, name="Netflix", days_ahead=2)

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(user.id)

    notes = await _renewal_notes(test_db, user.id)
    assert len(notes) == 1
    assert "Netflix" in notes[0].title
    assert "2일 뒤" in notes[0].title
    assert "13,500원" in notes[0].body


async def test_ignores_subscriptions_beyond_the_window(test_db: AsyncSession):
    """설정 범위 밖(먼 미래)의 결제는 알리지 않는다."""
    user = await _make_user(test_db, "faraway@example.com", notify_days_before=3)
    await _make_sub(test_db, user.id, name="Spotify", days_ahead=20)

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(user.id)
    assert await _renewal_notes(test_db, user.id) == []


async def test_ignores_cancelled_subscriptions(test_db: AsyncSession):
    """해지한 구독은 결제되지 않으므로 알리지 않는다."""
    user = await _make_user(test_db, "cancelled@example.com")
    await _make_sub(
        test_db, user.id, name="Watcha", days_ahead=1,
        status=SubscriptionStatus.CANCELLED,
    )

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(user.id)
    assert await _renewal_notes(test_db, user.id) == []


async def test_does_not_duplicate_within_same_cycle(test_db: AsyncSession):
    """스케줄러가 10분마다 돌아도 같은 결제일로는 한 번만 알린다."""
    user = await _make_user(test_db, "dedup@example.com")
    await _make_sub(test_db, user.id, name="Melon", days_ahead=1)

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(user.id)
    await svc.sync_renewal_notifications(user.id)
    await svc.sync_renewal_notifications(user.id)

    assert len(await _renewal_notes(test_db, user.id)) == 1


async def test_next_cycle_gets_a_new_notification(test_db: AsyncSession):
    """결제일이 다음 주기로 밀리면 그 주기의 알림이 새로 나간다."""
    user = await _make_user(test_db, "nextcycle@example.com")
    sub = await _make_sub(test_db, user.id, name="Disney+", days_ahead=1)

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(user.id)

    sub.next_billing_date = date.today() + timedelta(days=2)
    await test_db.commit()
    await svc.sync_renewal_notifications(user.id)

    assert len(await _renewal_notes(test_db, user.id)) == 2


async def test_only_the_owner_is_notified(test_db: AsyncSession):
    """남의 구독은 알리지 않는다."""
    owner = await _make_user(test_db, "owner@example.com")
    other = await _make_user(test_db, "other@example.com")
    await _make_sub(test_db, owner.id, name="Tving", days_ahead=1)

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(other.id)

    assert await _renewal_notes(test_db, other.id) == []


async def test_shared_subscription_shows_personal_share(test_db: AsyncSession):
    """분담 구독은 청구 총액과 내 몫을 같이 보여준다."""
    user = await _make_user(test_db, "shared@example.com")
    await _make_sub(test_db, user.id, name="YouTube Premium", days_ahead=0,
                    cost="23900", member_count=4)

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(user.id)

    notes = await _renewal_notes(test_db, user.id)
    assert len(notes) == 1
    assert "오늘" in notes[0].title
    assert "23,900원" in notes[0].body
    assert "내 몫 5,975원" in notes[0].body


@pytest.mark.parametrize(
    "days_ahead,expected",
    [(0, "오늘"), (1, "내일"), (5, "5일 뒤")],
)
async def test_day_wording(test_db: AsyncSession, days_ahead: int, expected: str):
    """오늘·내일은 날짜 수 대신 말로 적는다."""
    user = await _make_user(test_db, f"wording{days_ahead}@example.com", notify_days_before=7)
    await _make_sub(test_db, user.id, name="Wavve", days_ahead=days_ahead)

    svc = NotificationService(test_db)
    await svc.sync_renewal_notifications(user.id)

    notes = await _renewal_notes(test_db, user.id)
    assert expected in notes[0].title
