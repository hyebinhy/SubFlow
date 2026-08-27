import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Service(Base):
    __tablename__ = "services"
    __table_args__ = (
        # 카테고리와 같은 규칙 — 기본 카탈로그는 이름이 유일하고,
        # 사용자가 만든 것은 사람별로만 유일하다.
        Index(
            "ux_services_default_name",
            "name",
            unique=True,
            postgresql_where=text("user_id IS NULL"),
        ),
        Index(
            "ux_services_user_name",
            "user_id",
            "name",
            unique=True,
            postgresql_where=text("user_id IS NOT NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cancel_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # NULL = 기본 카탈로그(시드), 값이 있으면 그 사람이 직접 등록한 서비스.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )

    category = relationship("Category")
    plans = relationship("ServicePlan", back_populates="service", cascade="all, delete-orphan")

    @property
    def is_custom(self) -> bool:
        return self.user_id is not None
