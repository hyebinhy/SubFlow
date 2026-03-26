from collections import defaultdict
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.subscription import BillingCycle, Subscription, SubscriptionStatus
from app.models.service import Service
from app.models.service_plan import ServicePlan
from app.schemas.analytics import (
    CategoryBreakdown,
    CategoryBreakdownItem,
    CheaperPlanInfo,
    DashboardOverview,
    ExchangeRateAlertItem,
    ExchangeRateAlertResponse,
    MonthlyTotal,
    MostExpensiveInfo,
    NextRenewalInfo,
    OverlapDetectionResponse,
    OverlapItem,
    SavingSuggestionItem,
    SavingsSuggestionsResponse,
    SpendingTrend,
    TrialSubscriptionItem,
    TrialTrackingResponse,
)
from app.utils.exchange_rate import get_exchange_rates, to_krw


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


async def to_monthly_cost_krw(cost: Decimal, cycle: BillingCycle, currency: str) -> Decimal:
    """Convert cost to monthly KRW amount."""
    monthly = to_monthly_cost(cost, cycle)
    return await to_krw(monthly, currency)


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

        monthly_krw_list = [await to_monthly_cost_krw(Decimal(str(s.cost)), s.billing_cycle, s.currency) for s in subs]
        total_monthly = sum(monthly_krw_list, Decimal("0"))
        total_yearly = total_monthly * 12

        today = date.today()
        upcoming = [s for s in subs if s.next_billing_date >= today]
        upcoming.sort(key=lambda s: s.next_billing_date)

        next_renewal = None
        if upcoming:
            s = upcoming[0]
            cost_krw = await to_krw(Decimal(str(s.cost)), s.currency)
            next_renewal = NextRenewalInfo(
                service_name=s.service_name,
                next_billing_date=s.next_billing_date.isoformat(),
                cost=cost_krw,
            )

        monthly_costs = list(zip(subs, monthly_krw_list))
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
            monthly = await to_monthly_cost_krw(Decimal(str(s.cost)), s.billing_cycle, s.currency)
            by_category[cat_name]["total"] += monthly
            by_category[cat_name]["count"] += 1

        total = sum((v["total"] for v in by_category.values()), Decimal("0"))
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
        monthly_krw = [await to_monthly_cost_krw(Decimal(str(s.cost)), s.billing_cycle, s.currency) for s in subs]
        total_monthly = sum(monthly_krw, Decimal("0"))

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

    async def detect_overlaps(self, user_id: UUID) -> OverlapDetectionResponse:
        subs = await self._get_active_subscriptions(user_id)

        by_category: dict[int, list[Subscription]] = defaultdict(list)
        for s in subs:
            if s.category_id is not None:
                by_category[s.category_id].append(s)

        overlaps: list[OverlapItem] = []
        for cat_id, cat_subs in by_category.items():
            if len(cat_subs) < 2:
                continue

            cat_name = cat_subs[0].category.name if cat_subs[0].category else "미분류"
            cat_icon = cat_subs[0].category.icon if cat_subs[0].category else None
            service_names = [s.service_name for s in cat_subs]

            total_monthly = Decimal("0")
            for s in cat_subs:
                monthly_krw = await to_monthly_cost_krw(Decimal(str(s.cost)), s.billing_cycle, s.currency)
                total_monthly += monthly_krw

            overlaps.append(OverlapItem(
                category=cat_name,
                category_icon=cat_icon,
                services=service_names,
                total_monthly_cost=total_monthly.quantize(Decimal("1")),
                message=f"'{cat_name}' 카테고리에 {len(cat_subs)}개의 구독이 있습니다. 통합을 고려해보세요.",
            ))

        return OverlapDetectionResponse(overlaps=overlaps)

    async def get_exchange_rate_alerts(self, user_id: UUID) -> ExchangeRateAlertResponse:
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.currency != "KRW",
                Subscription.initial_exchange_rate.isnot(None),
            )
        )
        subs = list(result.scalars().all())

        rates = await get_exchange_rates()
        alerts: list[ExchangeRateAlertItem] = []

        for s in subs:
            current_rate = rates.get(s.currency)
            if current_rate is None:
                continue

            initial_rate = Decimal(str(s.initial_exchange_rate))
            change_pct = float((current_rate - initial_rate) / initial_rate * 100)

            if change_pct > 5.0:
                monthly_cost = to_monthly_cost(Decimal(str(s.cost)), s.billing_cycle)
                initial_monthly_krw = (monthly_cost * initial_rate).quantize(Decimal("1"))
                current_monthly_krw = (monthly_cost * current_rate).quantize(Decimal("1"))
                extra_cost = current_monthly_krw - initial_monthly_krw

                alerts.append(ExchangeRateAlertItem(
                    subscription_id=str(s.id),
                    service_name=s.service_name,
                    currency=s.currency,
                    initial_rate=initial_rate,
                    current_rate=current_rate,
                    change_percentage=round(change_pct, 2),
                    initial_monthly_krw=initial_monthly_krw,
                    current_monthly_krw=current_monthly_krw,
                    extra_cost_krw=extra_cost,
                ))

        return ExchangeRateAlertResponse(
            alerts=alerts,
            current_usd_krw=rates.get("USD"),
        )

    async def get_trial_subscriptions(self, user_id: UUID) -> TrialTrackingResponse:
        result = await self.db.execute(
            select(Subscription)
            .options(selectinload(Subscription.category))
            .where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.TRIAL,
            )
        )
        subs = list(result.scalars().all())

        today = date.today()
        trials: list[TrialSubscriptionItem] = []

        for s in subs:
            days_remaining = (s.next_billing_date - today).days
            cost_krw = await to_krw(Decimal(str(s.cost)), s.currency)
            category_name = s.category.name if s.category else None

            trials.append(TrialSubscriptionItem(
                id=str(s.id),
                service_name=s.service_name,
                logo_url=s.logo_url,
                category_name=category_name,
                trial_end_date=s.next_billing_date.isoformat(),
                days_remaining=days_remaining,
                cost_after_trial=Decimal(str(s.cost)),
                currency=s.currency,
                cost_after_trial_krw=cost_krw,
            ))

        trials.sort(key=lambda t: t.days_remaining)

        return TrialTrackingResponse(
            trials=trials,
            total_count=len(trials),
        )

    async def get_savings_suggestions(self, user_id: UUID) -> SavingsSuggestionsResponse:
        result = await self.db.execute(
            select(Subscription)
            .options(
                selectinload(Subscription.service).selectinload(Service.plans),
                selectinload(Subscription.plan),
            )
            .where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.service_id.isnot(None),
                Subscription.plan_id.isnot(None),
            )
        )
        subs = list(result.scalars().all())

        suggestions: list[SavingSuggestionItem] = []

        for s in subs:
            if not s.plan or not s.service:
                continue

            current_monthly_krw = await to_monthly_cost_krw(
                Decimal(str(s.cost)), s.billing_cycle, s.currency
            )

            cheaper_plans: list[CheaperPlanInfo] = []
            for plan in s.service.plans:
                if not plan.is_active or plan.id == s.plan_id:
                    continue

                plan_monthly_krw = await to_monthly_cost_krw(
                    Decimal(str(plan.price)), plan.billing_cycle, plan.currency
                )

                if plan_monthly_krw < current_monthly_krw:
                    cheaper_plans.append(CheaperPlanInfo(
                        plan_id=plan.id,
                        plan_name=plan.name,
                        price=Decimal(str(plan.price)),
                        currency=plan.currency,
                        billing_cycle=plan.billing_cycle.value,
                        monthly_cost_krw=plan_monthly_krw.quantize(Decimal("1")),
                    ))

            if cheaper_plans:
                cheaper_plans.sort(key=lambda p: p.monthly_cost_krw)
                max_savings = current_monthly_krw - cheaper_plans[0].monthly_cost_krw

                suggestions.append(SavingSuggestionItem(
                    subscription_id=str(s.id),
                    service_name=s.service_name,
                    logo_url=s.logo_url,
                    current_plan_name=s.plan.name,
                    current_monthly_krw=current_monthly_krw.quantize(Decimal("1")),
                    cheaper_plans=cheaper_plans,
                    max_savings_krw=max_savings.quantize(Decimal("1")),
                    suggestion_text=f"'{s.service_name}'을(를) '{cheaper_plans[0].plan_name}' 플랜으로 변경하면 월 {max_savings.quantize(Decimal('1')):,}원을 절약할 수 있습니다.",
                ))

        suggestions.sort(key=lambda x: x.max_savings_krw, reverse=True)

        total_potential_savings = sum(
            (sg.max_savings_krw for sg in suggestions), Decimal("0")
        )

        return SavingsSuggestionsResponse(
            suggestions=suggestions,
            total_potential_savings_krw=total_potential_savings,
        )
