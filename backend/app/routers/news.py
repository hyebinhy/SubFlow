from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user_optional, get_db
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.user import User
from app.schemas.news import NewsItem, NewsResponse
from app.services.news_service import get_cached_news, personalize_news, refresh_news_cache

router = APIRouter()


async def _subscribed_service_names(db: AsyncSession, user_id) -> list[str]:
    result = await db.execute(
        select(Subscription.service_name).where(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE,
        )
    )
    return [n for n in result.scalars().all() if n]


@router.get("/", response_model=NewsResponse)
async def get_news(
    only_matched: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    """캐시에서 서빙. 로그인 상태면 내 구독 서비스 관련 뉴스를 우선 정렬(개인화)."""
    # 개인화 여지를 위해 넉넉히 가져온 뒤 상위 6개만 반환
    items = await get_cached_news(db, limit=12)
    if user:
        names = await _subscribed_service_names(db, user.id)
        if names:
            items = personalize_news(items, names, only_matched=only_matched)
    return NewsResponse(items=[NewsItem(**item) for item in items[:6]])


@router.post("/refresh", response_model=NewsResponse)
async def refresh_news(db: AsyncSession = Depends(get_db)):
    """수동 갱신 트리거 (개발/디버깅용)."""
    await refresh_news_cache(db)
    items = await get_cached_news(db, limit=6)
    return NewsResponse(items=[NewsItem(**item) for item in items])
