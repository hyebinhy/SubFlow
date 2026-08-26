from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db
from app.models.plan_price_history import PlanPriceHistory
from app.models.service import Service
from app.models.service_plan import ServicePlan
from app.models.subscription import BillingCycle
from app.models.user import User
from app.schemas.service import PlanPriceHistoryResponse, ServiceListResponse, ServiceResponse

router = APIRouter()


def _to_list_item(service: Service) -> ServiceListResponse:
    """서비스 한 건을 목록 응답으로 옮긴다.

    목록·인기·검색 세 엔드포인트가 같은 모양을 만들어야 해서 한곳에 모았다.
    카드에 찍히는 가격 범위는 서로 비교되는 값이어야 한다. 통화가 섞이면 뜻이
    없으니 첫 요금제의 통화로 맞추고(지금 카탈로그는 서비스별로 통화가 하나),
    월간 요금제가 하나라도 있으면 그것만 쓴다. 월간과 연간을 한 범위에 넣으면
    "11,900~119,000원" 같은 값이 나와 읽는 사람이 열 배 비싼 요금제로 오해한다.
    연간 요금제는 시트를 열면 주기와 함께 그대로 보인다.
    """
    plans = service.plans
    currency = plans[0].currency if plans else None
    same_currency = [p for p in plans if p.currency == currency]
    monthly = [p.price for p in same_currency if p.billing_cycle == BillingCycle.MONTHLY]
    comparable = monthly or [p.price for p in same_currency]

    return ServiceListResponse(
        id=service.id,
        name=service.name,
        description=service.description,
        category_id=service.category_id,
        category=service.category,
        logo_url=service.logo_url,
        website_url=service.website_url,
        cancel_url=service.cancel_url,
        is_popular=service.is_popular,
        plan_count=len(plans),
        min_price=min(comparable, default=None),
        max_price=max(comparable, default=None),
        currency=currency,
        plans=plans,
    )


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
    return [_to_list_item(s) for s in result.scalars().all()]


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
    return [_to_list_item(s) for s in result.scalars().all()]


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
    return [_to_list_item(s) for s in result.scalars().all()]


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
