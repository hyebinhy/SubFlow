import uuid

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        # 기본 카탈로그는 이름이 유일해야 시드가 같은 행을 다시 찾는다.
        Index(
            "ux_categories_default_name",
            "name",
            unique=True,
            postgresql_where=text("user_id IS NULL"),
        ),
        # 사용자가 만든 것은 사람마다 따로다 — 남이 "운동"을 만들었다고
        # 내가 같은 이름을 못 쓰면 안 된다.
        Index(
            "ux_categories_user_name",
            "user_id",
            "name",
            unique=True,
            postgresql_where=text("user_id IS NOT NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    # NULL = 모두에게 보이는 기본 카탈로그. 값이 있으면 그 사람만 보는 항목이다.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )

    subscriptions = relationship("Subscription", back_populates="category")

    @property
    def is_custom(self) -> bool:
        return self.user_id is not None
