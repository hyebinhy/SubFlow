from collections import defaultdict
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.subscription import BillingCycle, Subscription, SubscriptionStatus
from app.schemas.analytics import (
    CategoryBreakdown,
    CategoryBreakdownItem,
    DashboardOverview,
    MonthlyTotal,
    MostExpensiveInfo,
    NextRenewalInfo,
    SpendingTrend,
)


def to_monthly_cost(cost: Decimal, cycle: BillingCycle) -> Decimal:
    match cycle:
        case BillingCycle.WEEKLY:
            return cost * Decimal("4.33")
        case BillingCycle.MONTHLY:
            return cost
        case BillingCycle.QUARTERLY:
            return cost / 3
        case BillingCycle.YEARLY:
            return cost / 12


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_active_subscriptions(self, user_id: UUID) -> list[Subscription]:
        result = await self.db.execute(
            select(Subscription)
            .options(selectinload(Subscription.category))
            .where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
            )
        )
        return list(result.scalars().all())

    async def get_overview(self, user_id: UUID) -> DashboardOverview:
        subs = await self._get_active_subscriptions(user_id)

        if not subs:
            return DashboardOverview(
                total_active_subscriptions=0,
                total_monthly_cost=Decimal("0"),
                total_yearly_cost=Decimal("0"),
            )

        total_monthly = sum(to_monthly_cost(Decimal(str(s.cost)), s.billing_cycle) for s in subs)
        total_yearly = total_monthly * 12

        today = date.today()
        upcoming = [s for s in subs if s.next_billing_date >= today]
        upcoming.sort(key=lambda s: s.next_billing_date)

        next_renewal = None
        if upcoming:
            s = upcoming[0]
            next_renewal = NextRenewalInfo(
                service_name=s.service_name,
                next_billing_date=s.next_billing_date.isoformat(),
                cost=Decimal(str(s.cost)),
            )

        monthly_costs = [(s, to_monthly_cost(Decimal(str(s.cost)), s.billing_cycle)) for s in subs]
        monthly_costs.sort(key=lambda x: x[1], reverse=True)
        most_expensive = MostExpensiveInfo(
            service_name=monthly_costs[0][0].service_name,
            monthly_cost=monthly_costs[0][1].quantize(Decimal("1")),
        )

        return DashboardOverview(
            total_active_subscriptions=len(subs),
            total_monthly_cost=total_monthly.quantize(Decimal("1")),
            total_yearly_cost=total_yearly.quantize(Decimal("1")),
            next_renewal=next_renewal,
            most_expensive=most_expensive,
        )

    async def get_category_breakdown(self, user_id: UUID, year: int, month: int) -> CategoryBreakdown:
        subs = await self._get_active_subscriptions(user_id)

        by_category: dict[str, dict] = defaultdict(lambda: {"total": Decimal("0"), "count": 0})
        for s in subs:
            cat_name = s.category.name if s.category else "미분류"
            monthly = to_monthly_cost(Decimal(str(s.cost)), s.billing_cycle)
            by_category[cat_name]["total"] += monthly
            by_category[cat_name]["count"] += 1

        total = sum(v["total"] for v in by_category.values())
        breakdown = []
        for cat, data in sorted(by_category.items(), key=lambda x: x[1]["total"], reverse=True):
            pct = float(data["total"] / total * 100) if total > 0 else 0.0
            breakdown.append(CategoryBreakdownItem(
                category=cat,
                total=data["total"].quantize(Decimal("1")),
                count=data["count"],
                percentage=round(pct, 1),
            ))

        return CategoryBreakdown(
            year=year, month=month, breakdown=breakdown, total=total.quantize(Decimal("1"))
        )

    async def get_spending_trend(self, user_id: UUID, months: int = 6) -> SpendingTrend:
        subs = await self._get_active_subscriptions(user_id)
        total_monthly = sum(to_monthly_cost(Decimal(str(s.cost)), s.billing_cycle) for s in subs)

        today = date.today()
        data = []
        for i in range(months - 1, -1, -1):
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            data.append(MonthlyTotal(year=y, month=m, total=total_monthly.quantize(Decimal("1"))))

        return SpendingTrend(data=data)
