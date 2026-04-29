"""mobile@test.com 계정에 데모 구독 데이터를 시딩한다.

실행:
    cd backend
    venv\\Scripts\\activate
    python -m scripts.seed_test_user
"""
import asyncio
from datetime import date, timedelta

from dateutil.relativedelta import relativedelta
from sqlalchemy import select

from app.core.security import hash_password
from app.database import async_session_maker
from app.models.notification_setting import NotificationSetting
from app.models.service import Service
from app.models.service_plan import ServicePlan
from app.models.subscription import BillingCycle, Subscription, SubscriptionStatus
from app.models.user import User

TEST_EMAIL = "mobile@test.com"
TEST_PASSWORD = "test1234"
TEST_USERNAME = "Mobile Tester"
MONTHLY_BUDGET = 70_000

# (서비스명, 플랜명, 월 비용 KRW, 통화, billing_day, 가입 시작 일자(개월 전))
TEST_SUBSCRIPTIONS = [
    ("Notion",          "Plus",       14_000, "KRW", 5,  10),
    ("Netflix",         "프리미엄",   17_000, "KRW", 7,  39),  # 3y 3m subscribed (홈 화면 매칭)
    ("Spotify",         "개인",       11_990, "KRW", 12, 18),
    ("YouTube Premium", "개인",       14_900, "KRW", 15, 14),
    ("iCloud+",         "200GB",       4_400, "KRW", 20, 8),
    ("ChatGPT Plus",    "Plus",       26_000, "KRW", 22, 6),
    ("Disney+",         "프리미엄",   13_900, "KRW", 25, 12),
]


def next_billing_from(today: date, billing_day: int) -> date:
    """today 이후로 도래하는 가장 가까운 billing_day 날짜를 반환."""
    candidate = today.replace(day=min(billing_day, 28))
    if candidate <= today:
        candidate = (candidate + relativedelta(months=1)).replace(day=min(billing_day, 28))
    return candidate


async def upsert_test_user(db) -> User:
    result = await db.execute(select(User).where(User.email == TEST_EMAIL))
    user = result.scalar_one_or_none()
    if user:
        print(f"[user] reuse existing: {user.email}")
        return user
    user = User(
        email=TEST_EMAIL,
        hashed_password=hash_password(TEST_PASSWORD),
        username=TEST_USERNAME,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    print(f"[user] created: {TEST_EMAIL} / {TEST_PASSWORD}")
    return user


async def upsert_notification_setting(db, user: User) -> None:
    result = await db.execute(
        select(NotificationSetting).where(NotificationSetting.user_id == user.id)
    )
    setting = result.scalar_one_or_none()
    if setting:
        setting.budget_monthly = MONTHLY_BUDGET
        return
    db.add(NotificationSetting(
        user_id=user.id,
        budget_monthly=MONTHLY_BUDGET,
        notify_days_before=3,
        email_notifications=True,
        push_notifications=False,
    ))


async def seed_subscriptions(db, user: User) -> int:
    today = date.today()

    # 서비스/플랜 맵핑
    svc_result = await db.execute(select(Service))
    svc_map = {s.name: s for s in svc_result.scalars().all()}
    plan_result = await db.execute(select(ServicePlan))
    plan_map: dict[tuple[int, str], ServicePlan] = {(p.service_id, p.name): p for p in plan_result.scalars().all()}

    # 기존 구독 (재시드 시 중복 방지) — 서비스명 기준
    existing_result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    existing = {s.service_name for s in existing_result.scalars().all()}

    created = 0
    for service_name, plan_name, cost, currency, billing_day, months_ago in TEST_SUBSCRIPTIONS:
        if service_name in existing:
            print(f"  - skip (exists): {service_name}")
            continue

        service = svc_map.get(service_name)
        if not service:
            print(f"  ! not in catalog, skip: {service_name}")
            continue
        plan = plan_map.get((service.id, plan_name))

        start = today - relativedelta(months=months_ago)
        # billing_day에 맞춰 start_date 보정
        start = start.replace(day=min(billing_day, 28))
        next_billing = next_billing_from(today, billing_day)

        sub = Subscription(
            user_id=user.id,
            category_id=service.category_id,
            service_id=service.id,
            plan_id=plan.id if plan else None,
            service_name=service.name,
            description=service.description,
            cost=cost,
            currency=currency,
            billing_cycle=BillingCycle.MONTHLY,
            billing_day=billing_day,
            start_date=start,
            next_billing_date=next_billing,
            status=SubscriptionStatus.ACTIVE,
            auto_renew=True,
            logo_url=service.logo_url,
            is_recurring=True,
        )
        db.add(sub)
        created += 1
        print(f"  + {service_name} ({plan_name}) KRW {cost:,} / {billing_day}d billing -> next {next_billing}")

    return created


async def main() -> None:
    async with async_session_maker() as db:
        user = await upsert_test_user(db)
        await upsert_notification_setting(db, user)
        created = await seed_subscriptions(db, user)
        await db.commit()
        print(f"\nDone: {created} new subscriptions added")
        print(f"Login: {TEST_EMAIL} / {TEST_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
