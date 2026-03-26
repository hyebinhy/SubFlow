from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.analytics import (
    BudgetStatusResponse,
    CategoryBreakdown,
    DashboardOverview,
    ExchangeRateAlertResponse,
    OverlapDetectionResponse,
    SavingsSuggestionsResponse,
    SpendingTrend,
    TrialTrackingResponse,
)
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


@router.get("/overlaps", response_model=OverlapDetectionResponse)
async def detect_overlaps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.detect_overlaps(current_user.id)


@router.get("/exchange-rate-alerts", response_model=ExchangeRateAlertResponse)
async def get_exchange_rate_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_exchange_rate_alerts(current_user.id)


@router.get("/trials", response_model=TrialTrackingResponse)
async def get_trial_subscriptions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_trial_subscriptions(current_user.id)


@router.get("/savings-suggestions", response_model=SavingsSuggestionsResponse)
async def get_savings_suggestions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_savings_suggestions(current_user.id)


@router.get("/budget-status", response_model=BudgetStatusResponse)
async def get_budget_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    return await service.get_budget_status(current_user.id)
