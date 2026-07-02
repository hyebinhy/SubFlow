from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import (
    InboxResponse,
    MarkReadResponse,
    NotificationSettingsResponse,
    NotificationSettingsUpdateRequest,
    PushTokenRequest,
)
from app.schemas.subscription import SubscriptionResponse
from app.services.delivery_service import deliver_pending
from app.services.digest_service import send_weekly_digest
from app.services.notification_service import NotificationService

router = APIRouter()


# ── 인박스 ────────────────────────────────────────────────
@router.get("/inbox", response_model=InboxResponse)
async def get_inbox(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    items, unread = await service.list_inbox(current_user.id, unread_only=unread_only, limit=limit)
    return InboxResponse(items=items, unread_count=unread)


@router.post("/inbox/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    updated = await service.mark_read(current_user.id, notification_id)
    if updated == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found or already read")
    return MarkReadResponse(updated=updated)


@router.put("/push-token", response_model=NotificationSettingsResponse)
async def register_push_token(
    data: PushTokenRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return await service.set_push_token(current_user.id, data.push_token)


@router.post("/deliver", response_model=MarkReadResponse)
async def trigger_delivery(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """미배송 알림을 즉시 발송 (스케줄러가 자동으로도 수행). 개발/수동 트리거용."""
    return MarkReadResponse(updated=await deliver_pending(db))


@router.post("/digest", response_model=MarkReadResponse)
async def trigger_digest(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """주간 다이제스트를 즉시 발송 (스케줄러가 매주 자동 수행). 개발/수동 트리거용."""
    return MarkReadResponse(updated=await send_weekly_digest(db))


@router.post("/inbox/read-all", response_model=MarkReadResponse)
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return MarkReadResponse(updated=await service.mark_all_read(current_user.id))


@router.delete("/inbox/{notification_id}", response_model=MarkReadResponse)
async def dismiss_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    updated = await service.archive(current_user.id, notification_id)
    if updated == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return MarkReadResponse(updated=updated)


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
