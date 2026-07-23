"""구독 자동 갱신 + 결제 내역 자동 기록.

매일 스케줄러가 호출한다. next_billing_date가 지난 auto_renew 구독을 찾아
경과한 각 결제 주기마다 PaymentHistory를 남기고, next_billing_date를
오늘 이후로 밀어준다.
"""

import calendar
import logging
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment_history import PaymentHistory
from app.models.subscription import BillingCycle, Subscription, SubscriptionStatus
from app.models.subscription_history import HistoryEventType, SubscriptionHistory

logger = logging.getLogger("uvicorn.error")

# 데이터가 크게 밀렸을 때 무한 루프/폭주 방지 (한 구독당 최대 갱신 횟수)
_MAX_ADVANCES = 120


def _add_months(d: date, months: int) -> date:
    """말일 보정을 포함해 date에 개월 수를 더한다 (예: 1/31 + 1개월 = 2/28)."""
    m = d.month - 1 + months
    y = d.year + m // 12
    m = m % 12 + 1
    day = min(d.day, calendar.monthrange(y, m)[1])
    return date(y, m, day)


def _advance(d: date, cycle: BillingCycle) -> date:
    if cycle == BillingCycle.WEEKLY:
        return d + timedelta(days=7)
    if cycle == BillingCycle.MONTHLY:
        return _add_months(d, 1)
    if cycle == BillingCycle.QUARTERLY:
        return _add_months(d, 3)
    if cycle == BillingCycle.YEARLY:
        return _add_months(d, 12)
    # 알 수 없는 주기는 월간으로 취급
    return _add_months(d, 1)


async def renew_due_subscriptions(db: AsyncSession) -> int:
    """결제일이 지난 자동 갱신 구독을 갱신하고 결제 내역을 기록한다.

    반환값은 새로 기록된 결제 건수.
    """
    today = date.today()

    due = (
        await db.execute(
            select(Subscription).where(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.auto_renew.is_(True),
                Subscription.is_recurring.is_(True),
                Subscription.next_billing_date < today,
            )
        )
    ).scalars().all()

    payments_recorded = 0

    for sub in due:
        next_date = sub.next_billing_date
        advances = 0

        # 경과한 각 주기마다 결제 1건씩 기록하며 오늘 이후로 밀어준다
        while next_date < today and advances < _MAX_ADVANCES:
            db.add(
                PaymentHistory(
                    subscription_id=sub.id,
                    user_id=sub.user_id,
                    amount=sub.cost,
                    currency=sub.currency,
                    paid_at=next_date,
                )
            )
            payments_recorded += 1
            next_date = _advance(next_date, sub.billing_cycle)
            advances += 1

        if advances == 0:
            continue

        old_date = sub.next_billing_date
        sub.next_billing_date = next_date

        db.add(
            SubscriptionHistory(
                subscription_id=sub.id,
                user_id=sub.user_id,
                event_type=HistoryEventType.RENEWED,
                description=f"자동 갱신 ({advances}회): {old_date} → {next_date}",
                old_value=str(old_date),
                new_value=str(next_date),
            )
        )

    if payments_recorded:
        await db.commit()
        logger.info("[renewal] renewed %s subscriptions, %s payments recorded", len(due), payments_recorded)

    return payments_recorded
