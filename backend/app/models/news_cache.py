from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class NewsCache(Base):
    """전역(사용자 무관) 뉴스 캐시. 스케줄러가 주기적으로 갱신한다."""

    __tablename__ = "news_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    link: Mapped[str] = mapped_column(String(1000), nullable=False, unique=True)  # dedup 키
    pub_date: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source: Mapped[str] = mapped_column(String(200), nullable=False, default="Google News")
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # "AI Updates" | "Price Alerts"
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
