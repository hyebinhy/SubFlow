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


class SpendingTrend(BaseModel):
    data: list[MonthlyTotal]
