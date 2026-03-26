from datetime import date, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.notification_setting import NotificationSetting
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.notification import NotificationSettingsUpdateRequest


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_settings(self, user_id: UUID) -> NotificationSetting:
        result = await self.db.execute(
            select(NotificationSetting).where(NotificationSetting.user_id == user_id)
        )
        settings = result.scalar_one_or_none()
        if not settings:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification settings not found")
        return settings

    async def update_settings(self, user_id: UUID, data: NotificationSettingsUpdateRequest) -> NotificationSetting:
        settings = await self.get_settings(user_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(settings, key, value)
        await self.db.commit()
        await self.db.refresh(settings)
        return settings

    async def get_upcoming_renewals(self, user_id: UUID) -> list[Subscription]:
        settings = await self.get_settings(user_id)
        today = date.today()
        end_date = today + timedelta(days=settings.notify_days_before)

        result = await self.db.execute(
            select(Subscription)
            .options(selectinload(Subscription.category))
            .where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.next_billing_date >= today,
                Subscription.next_billing_date <= end_date,
            )
            .order_by(Subscription.next_billing_date.asc())
        )
        return list(result.scalars().all())
