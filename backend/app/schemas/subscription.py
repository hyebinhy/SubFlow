from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.subscription import BillingCycle, SubscriptionStatus
from app.schemas.category import CategoryResponse
from app.schemas.service import ServicePlanResponse, ServiceResponse


class CalendarEvent(BaseModel):
    subscription_id: str
    service_name: str
    logo_url: str | None = None
    cost: Decimal
    currency: str
    category_name: str | None = None
    category_color: str | None = None
    date: str  # ISO date
    is_past: bool
    is_recurring: bool


class CalendarEventsResponse(BaseModel):
    events: list[CalendarEvent]


class SubscriptionFromCatalogRequest(BaseModel):
    """카탈로그에서 서비스 선택으로 구독 생성"""
    service_id: int
    plan_id: int
    start_date: date
    next_billing_date: date
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    auto_renew: bool = True
    notes: str | None = None
    is_recurring: bool = True
    cancel_reminder: bool = False


class SubscriptionCreateRequest(BaseModel):
    """수동 구독 생성 (커스텀)"""
    service_name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    cost: Decimal = Field(gt=0)
    currency: str = "KRW"
    billing_cycle: BillingCycle
    billing_day: int | None = Field(default=None, ge=1, le=31)
    start_date: date
    next_billing_date: date
    category_id: int | None = None
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    auto_renew: bool = True
    logo_url: str | None = None
    notes: str | None = None
    is_recurring: bool = True
    cancel_reminder: bool = False


class SubscriptionUpdateRequest(BaseModel):
    service_name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    cost: Decimal | None = Field(default=None, gt=0)
    currency: str | None = None
    billing_cycle: BillingCycle | None = None
    billing_day: int | None = Field(default=None, ge=1, le=31)
    start_date: date | None = None
    next_billing_date: date | None = None
    category_id: int | None = None
    status: SubscriptionStatus | None = None
    auto_renew: bool | None = None
    logo_url: str | None = None
    notes: str | None = None
    plan_id: int | None = None
    is_recurring: bool | None = None
    cancel_reminder: bool | None = None


class SubscriptionResponse(BaseModel):
    id: UUID
    user_id: UUID
    service_name: str
    description: str | None
    cost: Decimal
    currency: str
    billing_cycle: BillingCycle
    billing_day: int | None
    start_date: date
    next_billing_date: date
    status: SubscriptionStatus
    auto_renew: bool
    is_recurring: bool
    cancel_reminder: bool
    category_id: int | None
    category: CategoryResponse | None = None
    service_id: int | None = None
    plan_id: int | None = None
    service: ServiceResponse | None = None
    plan: ServicePlanResponse | None = None
    logo_url: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
