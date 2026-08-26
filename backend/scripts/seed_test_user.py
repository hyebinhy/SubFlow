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
TEST_USERNAME = "지우"
# 스토어 스크린샷용 데모 데이터다. 월 지출 합계가 102,190원이므로 예산을
# 130,000원으로 두면 약 79%가 되어 "예산 안에서 관리 중"으로 보인다.
# (70,000원이면 146% 초과라 화면이 빨간 경고로 뒤덮인다)
MONTHLY_BUDGET = 130_000

# (서비스명, 플랜명, 월 비용 KRW, 통화, billing_day, 가입 시작 일자(개월 전))
#
# 지출 추이 차트는 start_date로만 각 달의 포함 여부를 정한다(analytics_service.get_spending_trend).
# 전부 6개월 이전에 시작하면 막대가 전부 같은 높이로 나와 가짜 티가 나므로,
# 최근 6개월 구간에 시작 시점을 흩어 계단이 생기게 둔다. 아래 구성의 월별 합계는
# 56,890 / 56,890 / 71,790 / 71,790 / 97,790 / 102,190 (+ 다음 달 예상 102,190).
TEST_SUBSCRIPTIONS = [
    # 6개월 구간 내내 유지된 기본 구독
    ("Netflix",         "프리미엄",   17_000, "KRW", 7,  39),  # 3y 3m subscribed (홈 화면 매칭)
    ("Spotify",         "개인",       11_990, "KRW", 12, 18),
    ("Disney+",         "프리미엄",   13_900, "KRW", 25, 12),
    ("Notion",          "Plus",       14_000, "KRW", 5,  10),
    # 최근에 하나씩 늘어난 구독 — 차트의 계단을 만든다
    ("YouTube Premium", "개인",       14_900, "KRW", 15, 3),
    ("ChatGPT Plus",    "Plus",       26_000, "KRW", 22, 1),
    ("iCloud+",         "200GB",       4_400, "KRW", 2,  0),
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
        # 표시 이름은 스크린샷에 그대로 노출되므로 재시드 때마다 맞춰 준다
        if user.username != TEST_USERNAME:
            print(f"[user] rename: {user.username} -> {TEST_USERNAME}")
            user.username = TEST_USERNAME
        else:
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
    existing = {s.service_name: s for s in existing_result.scalars().all()}

    created = 0
    for service_name, plan_name, cost, currency, billing_day, months_ago in TEST_SUBSCRIPTIONS:
        start = (today - relativedelta(months=months_ago)).replace(day=min(billing_day, 28))
        next_billing = next_billing_from(today, billing_day)

        # 이미 있으면 위 표를 정답으로 보고 맞춰 준다. 표를 고친 뒤 다시 돌리면
        # 그대로 반영돼야 시드 스크립트가 데이터의 단일 출처로 남는다.
        sub = existing.get(service_name)
        if sub is not None:
            sub.cost = cost
            sub.currency = currency
            sub.billing_day = billing_day
            sub.start_date = start
            sub.next_billing_date = next_billing
            print(f"  ~ update: {service_name} start={start} next={next_billing} KRW {cost:,}")
            continue

        service = svc_map.get(service_name)
        if not service:
            print(f"  ! not in catalog, skip: {service_name}")
            continue
        plan = plan_map.get((service.id, plan_name))

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
