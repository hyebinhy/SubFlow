from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.analytics import CategoryBreakdown, DashboardOverview, SpendingTrend
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/overview", response_model=DashboardOverview)
async def get_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_overview(current_user.id)


@router.get("/category-breakdown", response_model=CategoryBreakdown)
async def get_category_breakdown(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_category_breakdown(current_user.id, year, month)


@router.get("/spending-trend", response_model=SpendingTrend)
async def get_spending_trend(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_spending_trend(current_user.id, months)
