from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.subscription import SubscriptionStatus
from app.models.user import User
from app.schemas.subscription import (
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
