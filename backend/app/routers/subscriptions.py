from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.subscription import BillingCycle, SubscriptionStatus
from app.models.user import User
from app.schemas.subscription import (
    CalendarEvent,
    CalendarEventsResponse,
    SubscriptionCreateRequest,
    SubscriptionFromCatalogRequest,
    SubscriptionResponse,
    SubscriptionUpdateRequest,
)
from app.services.subscription_service import SubscriptionService

router = APIRouter()


@router.get("", response_model=list[SubscriptionResponse])
async def list_subscriptions(
    status_filter: SubscriptionStatus | None = Query(None, alias="status"),
    category_id: int | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SubscriptionService(db)
    return await service.get_all(current_user.id, status_filter, category_id, sort_by, order)


@router.post("/from-catalog", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_from_catalog(
    data: SubscriptionFromCatalogRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SubscriptionService(db)
    return await service.create_from_catalog(current_user.id, data)


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    data: SubscriptionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SubscriptionService(db)
    return await service.create(current_user.id, data)


@router.get("/upcoming", response_model=list[SubscriptionResponse])
async def upcoming_subscriptions(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SubscriptionService(db)
    return await service.get_upcoming(current_user.id, days)


@router.get("/calendar-events", response_model=CalendarEventsResponse)
async def get_calendar_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all billing dates (past and future) for the current user's subscriptions."""
    service = SubscriptionService(db)
    # Get all subscriptions except cancelled
    all_subs = await service.get_all(current_user.id)
    today = date.today()
    events: list[CalendarEvent] = []

    for sub in all_subs:
        if sub.status == SubscriptionStatus.CANCELLED:
            continue

        category_name = sub.category.name if sub.category else None
        category_color = sub.category.color if sub.category else None

        # Generate past billing dates from start_date up to today
        current = sub.start_date
        while current <= today:
            events.append(
                CalendarEvent(
                    subscription_id=str(sub.id),
                    service_name=sub.service_name,
                    logo_url=sub.logo_url,
                    cost=Decimal(str(sub.cost)),
                    currency=sub.currency,
                    category_name=category_name,
                    category_color=category_color,
                    date=current.isoformat(),
                    is_past=True,
                    is_recurring=sub.is_recurring,
                )
            )
            if sub.billing_cycle == BillingCycle.MONTHLY:
                current += relativedelta(months=1)
            elif sub.billing_cycle == BillingCycle.YEARLY:
                current += relativedelta(years=1)
            elif sub.billing_cycle == BillingCycle.WEEKLY:
                current += timedelta(weeks=1)
            elif sub.billing_cycle == BillingCycle.QUARTERLY:
                current += relativedelta(months=3)
            else:
                break

        # Add next_billing_date as upcoming event (if it's in the future)
        if sub.next_billing_date and sub.next_billing_date > today:
            events.append(
                CalendarEvent(
                    subscription_id=str(sub.id),
                    service_name=sub.service_name,
                    logo_url=sub.logo_url,
                    cost=Decimal(str(sub.cost)),
                    currency=sub.currency,
                    category_name=category_name,
                    category_color=category_color,
                    date=sub.next_billing_date.isoformat(),
                    is_past=False,
                    is_recurring=sub.is_recurring,
                )
            )

    # Sort events by date
    events.sort(key=lambda e: e.date)
    return CalendarEventsResponse(events=events)


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SubscriptionService(db)
    return await service.get_by_id(subscription_id, current_user.id)


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: UUID,
    data: SubscriptionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SubscriptionService(db)
    return await service.update(subscription_id, current_user.id, data)


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription(
    subscription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SubscriptionService(db)
    await service.delete(subscription_id, current_user.id)
