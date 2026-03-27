from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.service import Service
from app.models.service_plan import ServicePlan
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.subscription_history import HistoryEventType, SubscriptionHistory
from app.schemas.subscription import SubscriptionCreateRequest, SubscriptionFromCatalogRequest, SubscriptionUpdateRequest
from app.utils.exchange_rate import get_exchange_rates

EAGER_LOADS = [
    selectinload(Subscription.category),
    selectinload(Subscription.service).selectinload(Service.category),
    selectinload(Subscription.service).selectinload(Service.plans),
    selectinload(Subscription.plan),
]


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _record_history(
        self,
        subscription_id: UUID,
        user_id: UUID,
        event_type: HistoryEventType,
        description: str,
        old_value: str | None = None,
        new_value: str | None = None,
    ) -> None:
        history = SubscriptionHistory(
            subscription_id=subscription_id,
            user_id=user_id,
            event_type=event_type,
            description=description,
            old_value=old_value,
            new_value=new_value,
        )
        self.db.add(history)

    async def get_all(
        self,
        user_id: UUID,
        status_filter: SubscriptionStatus | None = None,
        category_id: int | None = None,
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> list[Subscription]:
        query = select(Subscription).options(*EAGER_LOADS).where(Subscription.user_id == user_id)

        if status_filter:
            query = query.where(Subscription.status == status_filter)
        if category_id:
            query = query.where(Subscription.category_id == category_id)

        sort_column = getattr(Subscription, sort_by, Subscription.created_at)
        if order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, subscription_id: UUID, user_id: UUID) -> Subscription:
        result = await self.db.execute(
            select(Subscription).options(*EAGER_LOADS)
            .where(Subscription.id == subscription_id, Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        if not subscription:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
        return subscription

    async def create_from_catalog(self, user_id: UUID, data: SubscriptionFromCatalogRequest) -> Subscription:
        # Fetch service and plan
        svc_result = await self.db.execute(
            select(Service).options(selectinload(Service.plans)).where(Service.id == data.service_id)
        )
        service = svc_result.scalar_one_or_none()
        if not service:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

        plan_result = await self.db.execute(
            select(ServicePlan).where(ServicePlan.id == data.plan_id, ServicePlan.service_id == data.service_id)
        )
        plan = plan_result.scalar_one_or_none()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

        subscription = Subscription(
            user_id=user_id,
            service_id=service.id,
            plan_id=plan.id,
            service_name=service.name,
            description=f"{service.name} - {plan.name}",
            cost=plan.price,
            currency=plan.currency,
            billing_cycle=plan.billing_cycle,
            category_id=service.category_id,
            start_date=data.start_date,
            next_billing_date=data.next_billing_date,
            status=data.status,
            auto_renew=data.auto_renew,
            logo_url=service.logo_url,
            notes=data.notes,
            is_recurring=data.is_recurring,
            cancel_reminder=data.cancel_reminder,
        )
        if subscription.currency != "KRW":
            rates = await get_exchange_rates()
            subscription.initial_exchange_rate = rates.get(subscription.currency)
        self.db.add(subscription)
        await self.db.flush()

        await self._record_history(
            subscription_id=subscription.id,
            user_id=user_id,
            event_type=HistoryEventType.CREATED,
            description=f"{service.name} ({plan.name}) 구독을 시작했습니다",
        )
        await self.db.commit()

        result = await self.db.execute(
            select(Subscription).options(*EAGER_LOADS).where(Subscription.id == subscription.id)
        )
        return result.scalar_one()

    async def create(self, user_id: UUID, data: SubscriptionCreateRequest) -> Subscription:
        subscription = Subscription(user_id=user_id, **data.model_dump())
        if subscription.currency != "KRW":
            rates = await get_exchange_rates()
            subscription.initial_exchange_rate = rates.get(subscription.currency)
        self.db.add(subscription)
        await self.db.flush()

        await self._record_history(
            subscription_id=subscription.id,
            user_id=user_id,
            event_type=HistoryEventType.CREATED,
            description=f"{subscription.service_name} 구독을 시작했습니다",
        )
        await self.db.commit()

        result = await self.db.execute(
            select(Subscription).options(*EAGER_LOADS).where(Subscription.id == subscription.id)
        )
        return result.scalar_one()

    async def update(self, subscription_id: UUID, user_id: UUID, data: SubscriptionUpdateRequest) -> Subscription:
        subscription = await self.get_by_id(subscription_id, user_id)
        update_data = data.model_dump(exclude_unset=True)

        # Detect changes and record history before applying updates
        if "status" in update_data and update_data["status"] != subscription.status:
            old_status = subscription.status.value if subscription.status else None
            new_status = update_data["status"].value if isinstance(update_data["status"], SubscriptionStatus) else update_data["status"]
            await self._record_history(
                subscription_id=subscription.id,
                user_id=user_id,
                event_type=HistoryEventType.STATUS_CHANGED,
                description=f"{old_status} → {new_status}",
                old_value=old_status,
                new_value=new_status,
            )

        if "cost" in update_data and Decimal(str(update_data["cost"])) != Decimal(str(subscription.cost)):
            old_cost = f"{subscription.cost:,.0f}원"
            new_cost = f"{Decimal(str(update_data['cost'])):,.0f}원"
            await self._record_history(
                subscription_id=subscription.id,
                user_id=user_id,
                event_type=HistoryEventType.PRICE_CHANGED,
                description=f"{old_cost} → {new_cost}",
                old_value=str(subscription.cost),
                new_value=str(update_data["cost"]),
            )

        if "plan_id" in update_data and update_data["plan_id"] != subscription.plan_id:
            old_plan_name = subscription.plan.name if subscription.plan else str(subscription.plan_id)
            # Fetch new plan name
            new_plan_name = str(update_data["plan_id"])
            if update_data["plan_id"] is not None:
                plan_result = await self.db.execute(
                    select(ServicePlan).where(ServicePlan.id == update_data["plan_id"])
                )
                new_plan = plan_result.scalar_one_or_none()
                if new_plan:
                    new_plan_name = new_plan.name
            await self._record_history(
                subscription_id=subscription.id,
                user_id=user_id,
                event_type=HistoryEventType.PLAN_CHANGED,
                description=f"{old_plan_name} → {new_plan_name}",
                old_value=old_plan_name,
                new_value=new_plan_name,
            )

        for key, value in update_data.items():
            setattr(subscription, key, value)
        await self.db.commit()

        result = await self.db.execute(
            select(Subscription).options(*EAGER_LOADS).where(Subscription.id == subscription.id)
        )
        return result.scalar_one()

    async def delete(self, subscription_id: UUID, user_id: UUID) -> None:
        subscription = await self.get_by_id(subscription_id, user_id)

        await self._record_history(
            subscription_id=subscription.id,
            user_id=user_id,
            event_type=HistoryEventType.STATUS_CHANGED,
            description=f"{subscription.service_name} 구독을 해지했습니다",
            old_value=subscription.status.value if subscription.status else None,
            new_value="cancelled",
        )
        await self.db.flush()

        await self.db.delete(subscription)
        await self.db.commit()

    async def get_upcoming(self, user_id: UUID, days: int = 7) -> list[Subscription]:
        from datetime import timedelta
        today = date.today()
        end_date = today + timedelta(days=days)
        result = await self.db.execute(
            select(Subscription).options(*EAGER_LOADS)
            .where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.next_billing_date >= today,
                Subscription.next_billing_date <= end_date,
            )
            .order_by(Subscription.next_billing_date.asc())
        )
        return list(result.scalars().all())
