from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db
from app.models.plan_price_history import PlanPriceHistory
from app.models.service import Service
from app.models.service_plan import ServicePlan
from app.models.user import User
from app.schemas.service import PlanPriceHistoryResponse, ServiceListResponse, ServiceResponse

router = APIRouter()


@router.get("", response_model=list[ServiceListResponse])
async def list_services(
    category_id: int | None = None,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Service).options(
        selectinload(Service.category),
        selectinload(Service.plans),
    )
    if category_id:
        query = query.where(Service.category_id == category_id)
    query = query.order_by(Service.is_popular.desc(), Service.name)

    result = await db.execute(query)
    services = result.scalars().all()

    return [
        ServiceListResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            category_id=s.category_id,
            category=s.category,
            logo_url=s.logo_url,
            is_popular=s.is_popular,
            plan_count=len(s.plans),
            min_price=min((p.price for p in s.plans), default=None),
            currency=s.plans[0].currency if s.plans else None,
        )
        for s in services
    ]


@router.get("/popular", response_model=list[ServiceListResponse])
async def popular_services(
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.category), selectinload(Service.plans))
        .where(Service.is_popular.is_(True))
        .order_by(Service.name)
    )
    services = result.scalars().all()

    return [
        ServiceListResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            category_id=s.category_id,
            category=s.category,
            logo_url=s.logo_url,
            is_popular=s.is_popular,
            plan_count=len(s.plans),
            min_price=min((p.price for p in s.plans), default=None),
            currency=s.plans[0].currency if s.plans else None,
        )
        for s in services
    ]


@router.get("/search", response_model=list[ServiceListResponse])
async def search_services(
    q: str = Query(min_length=1),
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.category), selectinload(Service.plans))
        .where(Service.name.ilike(f"%{q}%"))
        .order_by(Service.name)
    )
    services = result.scalars().all()

    return [
        ServiceListResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            category_id=s.category_id,
            category=s.category,
            logo_url=s.logo_url,
            is_popular=s.is_popular,
            plan_count=len(s.plans),
            min_price=min((p.price for p in s.plans), default=None),
            currency=s.plans[0].currency if s.plans else None,
        )
        for s in services
    ]


@router.get("/{service_id}/price-history", response_model=dict[int, list[PlanPriceHistoryResponse]])
async def get_price_history(
    service_id: int,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """서비스의 모든 요금제 가격 변동 이력을 반환합니다."""
    result = await db.execute(
        select(PlanPriceHistory)
        .join(ServicePlan)
        .where(ServicePlan.service_id == service_id)
        .order_by(PlanPriceHistory.effective_date)
    )
    rows = result.scalars().all()

    history: dict[int, list[PlanPriceHistoryResponse]] = {}
    for row in rows:
        history.setdefault(row.plan_id, []).append(
            PlanPriceHistoryResponse.model_validate(row)
        )
    return history


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: int,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException, status

    result = await db.execute(
        select(Service)
        .options(selectinload(Service.category), selectinload(Service.plans))
        .where(Service.id == service_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service
