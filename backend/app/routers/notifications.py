from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import NotificationSettingsResponse, NotificationSettingsUpdateRequest
from app.schemas.subscription import SubscriptionResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return await service.get_settings(current_user.id)


@router.put("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    data: NotificationSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return await service.update_settings(current_user.id, data)


@router.get("/upcoming", response_model=list[SubscriptionResponse])
async def get_upcoming_renewals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return await service.get_upcoming_renewals(current_user.id)
