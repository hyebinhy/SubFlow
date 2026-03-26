from decimal import Decimal

from pydantic import BaseModel


class NextRenewalInfo(BaseModel):
    service_name: str
    next_billing_date: str
    cost: Decimal


class MostExpensiveInfo(BaseModel):
    service_name: str
    monthly_cost: Decimal


class DashboardOverview(BaseModel):
    total_active_subscriptions: int
    total_monthly_cost: Decimal
    total_yearly_cost: Decimal
    currency: str = "KRW"
    next_renewal: NextRenewalInfo | None = None
    most_expensive: MostExpensiveInfo | None = None


class CategoryBreakdownItem(BaseModel):
    category: str
    total: Decimal
    count: int
    percentage: float


class CategoryBreakdown(BaseModel):
    year: int
    month: int
    breakdown: list[CategoryBreakdownItem]
    total: Decimal


class MonthlyTotal(BaseModel):
    year: int
    month: int
    total: Decimal
    is_forecast: bool = False


class SpendingTrend(BaseModel):
    data: list[MonthlyTotal]


# Feature 1: Overlap Detection
class OverlapItem(BaseModel):
    category: str
    category_icon: str | None = None
    services: list[str]
    total_monthly_cost: Decimal
    message: str


class OverlapDetectionResponse(BaseModel):
    overlaps: list[OverlapItem]


# Feature 2: Exchange Rate Alert
class ExchangeRateAlertItem(BaseModel):
    subscription_id: str
    service_name: str
    currency: str
    initial_rate: Decimal
    current_rate: Decimal
    change_percentage: float
    initial_monthly_krw: Decimal
    current_monthly_krw: Decimal
    extra_cost_krw: Decimal


class ExchangeRateAlertResponse(BaseModel):
    alerts: list[ExchangeRateAlertItem]
    current_usd_krw: Decimal | None = None


# Feature 3: Trial Tracking
class TrialSubscriptionItem(BaseModel):
    id: str
    service_name: str
    logo_url: str | None = None
    category_name: str | None = None
    trial_end_date: str
    days_remaining: int
    cost_after_trial: Decimal
    currency: str
    cost_after_trial_krw: Decimal


class TrialTrackingResponse(BaseModel):
    trials: list[TrialSubscriptionItem]
    total_count: int


# Feature 4: Savings Suggestions
class CheaperPlanInfo(BaseModel):
    plan_id: int
    plan_name: str
    price: Decimal
    currency: str
    billing_cycle: str
    monthly_cost_krw: Decimal


class SavingSuggestionItem(BaseModel):
    subscription_id: str
    service_name: str
    logo_url: str | None = None
    current_plan_name: str | None = None
    current_monthly_krw: Decimal
    cheaper_plans: list[CheaperPlanInfo]
    max_savings_krw: Decimal
    suggestion_text: str


class SavingsSuggestionsResponse(BaseModel):
    suggestions: list[SavingSuggestionItem]
    total_potential_savings_krw: Decimal


# Feature 5: Budget Status
class BudgetStatusResponse(BaseModel):
    budget_monthly: int | None = None
    current_spending: Decimal
    remaining: Decimal | None = None
    percentage_used: float | None = None  # 0-100+
    is_over_budget: bool = False
