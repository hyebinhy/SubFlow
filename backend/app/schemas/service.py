from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.subscription import BillingCycle
from app.schemas.category import CategoryResponse


class PlanPriceHistoryResponse(BaseModel):
    price: Decimal
    currency: str
    effective_date: date

    model_config = {"from_attributes": True}


class ServicePlanResponse(BaseModel):
    id: int
    service_id: int
    name: str
    price: Decimal
    currency: str
    billing_cycle: BillingCycle
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class ServiceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    category_id: int | None
    category: CategoryResponse | None = None
    logo_url: str | None
    website_url: str | None
    is_popular: bool
    created_at: datetime
    plans: list[ServicePlanResponse] = []

    model_config = {"from_attributes": True}


class ServiceListResponse(BaseModel):
    id: int
    name: str
    description: str | None
    category_id: int | None
    category: CategoryResponse | None = None
    logo_url: str | None
    is_popular: bool
    plan_count: int = 0
    min_price: Decimal | None = None
    currency: str | None = None

    model_config = {"from_attributes": True}
