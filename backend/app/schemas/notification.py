from uuid import UUID

from pydantic import BaseModel, Field


class NotificationSettingsResponse(BaseModel):
    id: UUID
    user_id: UUID
    notify_days_before: int
    email_notifications: bool
    push_notifications: bool
    budget_monthly: int | None = None

    model_config = {"from_attributes": True}


class NotificationSettingsUpdateRequest(BaseModel):
    notify_days_before: int | None = Field(default=None, ge=1, le=30)
    email_notifications: bool | None = None
    push_notifications: bool | None = None
    budget_monthly: int | None = None
