"""카테고리·서비스의 사용자 소유 규칙 (/api/v1/categories, /api/v1/services).

카탈로그는 원래 전역 공유 테이블이었다. 누가 카테고리를 하나 만들면 모든
사용자의 드롭다운에 나타났다. 지금은 user_id가 NULL이면 기본 카탈로그,
값이 있으면 만든 사람에게만 보인다. 이 파일은 그 경계가 새지 않는지 본다.
"""

from datetime import date

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.plan_price_history import PlanPriceHistory
from app.models.service import Service
from app.models.service_plan import ServicePlan
from app.models.subscription import BillingCycle
from app.utils.seed_data import seed_categories, seed_services

OTHER_USER = {
    "email": "otheruser@example.com",
    "password": "securepassword123",
    "username": "otheruser",
}


async def _other_headers(client: httpx.AsyncClient) -> dict:
    """두 번째 사용자를 등록하고 인증 헤더를 돌려준다."""
    resp = await client.post("/api/v1/auth/register", json=OTHER_USER)
    assert resp.status_code == 201, resp.text
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": OTHER_USER["email"], "password": OTHER_USER["password"]},
    )
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _sub_payload(**overrides) -> dict:
    payload = {
        "service_name": "동네 헬스장",
        "cost": 50000,
        "currency": "KRW",
        "billing_cycle": "monthly",
        "start_date": "2026-01-01",
        "next_billing_date": "2026-02-01",
    }
    payload.update(overrides)
    return payload


def _basic_plan() -> dict:
    return {"name": "기본", "price": 50000, "currency": "KRW", "billing_cycle": "monthly"}


# ---------------------------------------------------------------------------
# 카테고리
# ---------------------------------------------------------------------------


async def test_created_category_is_invisible_to_others(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    other = await _other_headers(test_client)

    created = await test_client.post(
        "/api/v1/categories", json={"name": "운동", "icon": "💪"}, headers=auth_headers
    )
    assert created.status_code == 201
    assert created.json()["is_custom"] is True

    mine = await test_client.get("/api/v1/categories", headers=auth_headers)
    assert "운동" in {c["name"] for c in mine.json()}

    theirs = await test_client.get("/api/v1/categories", headers=other)
    assert "운동" not in {c["name"] for c in theirs.json()}


async def test_default_categories_stay_shared(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    test_db.add(Category(name="Entertainment", icon="🎬", is_default=True))
    await test_db.commit()

    other = await _other_headers(test_client)
    for headers in (auth_headers, other):
        resp = await test_client.get("/api/v1/categories", headers=headers)
        shared = [c for c in resp.json() if c["name"] == "Entertainment"]
        assert len(shared) == 1
        assert shared[0]["is_custom"] is False


async def test_same_category_name_for_two_users(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    """남이 "운동"을 먼저 만들었다고 내가 못 만들면 안 된다."""
    other = await _other_headers(test_client)

    first = await test_client.post(
        "/api/v1/categories", json={"name": "운동"}, headers=auth_headers
    )
    second = await test_client.post(
        "/api/v1/categories", json={"name": "운동"}, headers=other
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] != second.json()["id"]


async def test_duplicate_category_name_for_same_user_rejected(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    await test_client.post("/api/v1/categories", json={"name": "운동"}, headers=auth_headers)
    again = await test_client.post(
        "/api/v1/categories", json={"name": "운동"}, headers=auth_headers
    )
    assert again.status_code == 400


async def test_delete_category_keeps_subscription(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    """카테고리를 지워도 그 카테고리를 쓰던 구독은 분류만 떨어진다."""
    cat = await test_client.post(
        "/api/v1/categories", json={"name": "운동"}, headers=auth_headers
    )
    cat_id = cat.json()["id"]

    sub = await test_client.post(
        "/api/v1/subscriptions",
        json=_sub_payload(category_id=cat_id),
        headers=auth_headers,
    )
    assert sub.status_code == 201, sub.text
    sub_id = sub.json()["id"]

    deleted = await test_client.delete(f"/api/v1/categories/{cat_id}", headers=auth_headers)
    assert deleted.status_code == 204

    after = await test_client.get(f"/api/v1/subscriptions/{sub_id}", headers=auth_headers)
    assert after.status_code == 200
    assert after.json()["category_id"] is None


async def test_cannot_delete_default_or_others_category(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    default = Category(name="Entertainment", icon="🎬", is_default=True)
    test_db.add(default)
    await test_db.commit()
    await test_db.refresh(default)

    other = await _other_headers(test_client)
    theirs = await test_client.post("/api/v1/categories", json={"name": "운동"}, headers=other)
    their_id = theirs.json()["id"]

    on_default = await test_client.delete(
        f"/api/v1/categories/{default.id}", headers=auth_headers
    )
    on_theirs = await test_client.delete(
        f"/api/v1/categories/{their_id}", headers=auth_headers
    )
    assert on_default.status_code == 404
    assert on_theirs.status_code == 404


async def test_cannot_attach_someone_elses_category_to_subscription(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    """구독 응답에는 카테고리 이름이 실린다. 막지 않으면 id로 남의 이름을 읽는다."""
    other = await _other_headers(test_client)
    theirs = await test_client.post(
        "/api/v1/categories", json={"name": "비밀 카테고리"}, headers=other
    )

    resp = await test_client.post(
        "/api/v1/subscriptions",
        json=_sub_payload(category_id=theirs.json()["id"]),
        headers=auth_headers,
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# 서비스
# ---------------------------------------------------------------------------


async def test_created_service_is_invisible_to_others(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    other = await _other_headers(test_client)

    created = await test_client.post(
        "/api/v1/services",
        json={"name": "동네 헬스장", "plans": [_basic_plan()]},
        headers=auth_headers,
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["is_custom"] is True
    assert len(body["plans"]) == 1
    svc_id = body["id"]

    mine = await test_client.get("/api/v1/services", headers=auth_headers)
    assert "동네 헬스장" in {s["name"] for s in mine.json()}

    theirs = await test_client.get("/api/v1/services", headers=other)
    assert "동네 헬스장" not in {s["name"] for s in theirs.json()}

    # 검색과 상세도 같은 경계를 지켜야 한다
    found = await test_client.get("/api/v1/services/search?q=헬스", headers=other)
    assert found.json() == []

    their_detail = await test_client.get(f"/api/v1/services/{svc_id}", headers=other)
    my_detail = await test_client.get(f"/api/v1/services/{svc_id}", headers=auth_headers)
    assert their_detail.status_code == 404
    assert my_detail.status_code == 200


async def test_subscribe_to_own_service_then_delete_it(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    """서비스를 지워도 그 서비스로 등록해 둔 구독은 남는다."""
    created = await test_client.post(
        "/api/v1/services",
        json={"name": "동네 헬스장", "plans": [_basic_plan()]},
        headers=auth_headers,
    )
    svc = created.json()

    sub = await test_client.post(
        "/api/v1/subscriptions/from-catalog",
        json={
            "service_id": svc["id"],
            "plan_id": svc["plans"][0]["id"],
            "start_date": "2026-01-01",
            "next_billing_date": "2026-02-01",
        },
        headers=auth_headers,
    )
    assert sub.status_code == 201, sub.text
    sub_id = sub.json()["id"]

    deleted = await test_client.delete(f"/api/v1/services/{svc['id']}", headers=auth_headers)
    assert deleted.status_code == 204

    after = await test_client.get(f"/api/v1/subscriptions/{sub_id}", headers=auth_headers)
    assert after.status_code == 200
    assert after.json()["service_name"] == "동네 헬스장"
    assert after.json()["service_id"] is None


async def test_cannot_subscribe_to_someone_elses_service(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    other = await _other_headers(test_client)
    created = await test_client.post(
        "/api/v1/services",
        json={"name": "남의 헬스장", "plans": [_basic_plan()]},
        headers=other,
    )
    svc = created.json()

    resp = await test_client.post(
        "/api/v1/subscriptions/from-catalog",
        json={
            "service_id": svc["id"],
            "plan_id": svc["plans"][0]["id"],
            "start_date": "2026-01-01",
            "next_billing_date": "2026-02-01",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_cannot_delete_default_service(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    svc = Service(name="Netflix", is_popular=True)
    test_db.add(svc)
    await test_db.commit()
    await test_db.refresh(svc)

    resp = await test_client.delete(f"/api/v1/services/{svc.id}", headers=auth_headers)
    assert resp.status_code == 404


async def test_service_in_someone_elses_category_is_rejected(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    other = await _other_headers(test_client)
    theirs = await test_client.post("/api/v1/categories", json={"name": "운동"}, headers=other)

    resp = await test_client.post(
        "/api/v1/services",
        json={"name": "동네 헬스장", "category_id": theirs.json()["id"]},
        headers=auth_headers,
    )
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# 시드가 사용자 항목을 건드리지 않는지
# ---------------------------------------------------------------------------


async def test_seed_leaves_user_categories_alone(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    """시드는 이름으로 행을 찾는다. 사용자가 같은 이름을 쓰면 덮어쓸 위험이 있다."""
    mine = await test_client.post(
        "/api/v1/categories",
        json={"name": "Music", "icon": "🏋️", "color": "#000000"},
        headers=auth_headers,
    )
    my_id = mine.json()["id"]

    await seed_categories(test_db)

    result = await test_db.execute(select(Category).where(Category.id == my_id))
    after = result.scalar_one()
    assert after.icon == "🏋️", "사용자가 만든 Music이 시드 값으로 덮어써졌다"
    assert after.color == "#000000"

    # 기본 Music은 따로 만들어졌어야 한다
    defaults = await test_db.execute(
        select(Category).where(Category.name == "Music", Category.user_id.is_(None))
    )
    assert defaults.scalar_one().icon == "🎵"


async def test_seed_does_not_prune_user_plans(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    """요금제 정리(prune)가 사용자 서비스의 요금제까지 지우면 안 된다."""
    created = await test_client.post(
        "/api/v1/services",
        json={
            "name": "Netflix",  # 기본 카탈로그와 같은 이름을 일부러 쓴다
            "plans": [{"name": "내 요금제", "price": 1000, "currency": "KRW", "billing_cycle": "monthly"}],
        },
        headers=auth_headers,
    )
    assert created.status_code == 201, created.text
    svc_id = created.json()["id"]

    await seed_categories(test_db)
    await seed_services(test_db)

    kept = await test_db.execute(select(ServicePlan).where(ServicePlan.service_id == svc_id))
    names = {p.name for p in kept.scalars().all()}
    assert names == {"내 요금제"}, f"사용자 요금제가 시드에 지워졌다: {names}"

    # 기본 Netflix는 별도의 행으로 들어와야 한다
    defaults = await test_db.execute(
        select(Service).where(Service.name == "Netflix", Service.user_id.is_(None))
    )
    assert defaults.scalar_one() is not None


async def test_price_history_respects_ownership(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    """가격 이력도 목록·상세와 같은 경계를 지켜야 한다."""
    default = Service(name="Netflix")
    test_db.add(default)
    await test_db.flush()
    plan = ServicePlan(
        service_id=default.id, name="스탠다드", price=13500, currency="KRW",
        billing_cycle=BillingCycle.MONTHLY,
    )
    test_db.add(plan)
    await test_db.flush()
    test_db.add(
        PlanPriceHistory(
            plan_id=plan.id, price=12000, currency="KRW",
            effective_date=date(2024, 10, 1),
        )
    )
    await test_db.commit()

    shared = await test_client.get(
        f"/api/v1/services/{default.id}/price-history", headers=auth_headers
    )
    assert shared.status_code == 200
    assert shared.json()[str(plan.id)][0]["price"] == "12000.00"

    # 남이 등록한 서비스의 이력은 비어서 나온다
    other = await _other_headers(test_client)
    theirs = await test_client.post(
        "/api/v1/services",
        json={"name": "남의 헬스장", "plans": [_basic_plan()]},
        headers=other,
    )
    mine_view = await test_client.get(
        f"/api/v1/services/{theirs.json()['id']}/price-history", headers=auth_headers
    )
    assert mine_view.status_code == 200
    assert mine_view.json() == {}


# ---------------------------------------------------------------------------
# 구독 분류 기본값
# ---------------------------------------------------------------------------


async def test_manual_subscription_inherits_catalog_category(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    """분류를 안 고르면 같은 이름의 카탈로그 서비스 카테고리를 따른다."""
    cat = Category(name="Entertainment", icon="🎬", is_default=True)
    test_db.add(cat)
    await test_db.flush()
    test_db.add(Service(name="Netflix", category_id=cat.id))
    await test_db.commit()

    sub = await test_client.post(
        "/api/v1/subscriptions",
        json=_sub_payload(service_name="Netflix"),
        headers=auth_headers,
    )
    assert sub.status_code == 201, sub.text
    assert sub.json()["category_id"] == cat.id


async def test_explicit_category_wins_over_catalog(
    test_client: httpx.AsyncClient, auth_headers: dict, test_db: AsyncSession
):
    """직접 고른 분류가 있으면 카탈로그 값으로 덮어쓰지 않는다."""
    cat = Category(name="Entertainment", icon="🎬", is_default=True)
    test_db.add(cat)
    await test_db.flush()
    test_db.add(Service(name="Netflix", category_id=cat.id))
    await test_db.commit()

    mine = await test_client.post(
        "/api/v1/categories", json={"name": "가족 공유"}, headers=auth_headers
    )
    sub = await test_client.post(
        "/api/v1/subscriptions",
        json=_sub_payload(service_name="Netflix", category_id=mine.json()["id"]),
        headers=auth_headers,
    )
    assert sub.json()["category_id"] == mine.json()["id"]


async def test_unknown_service_stays_uncategorised(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    """카탈로그에 없는 이름이면 미분류 그대로 둔다."""
    sub = await test_client.post(
        "/api/v1/subscriptions",
        json=_sub_payload(service_name="동네 헬스장"),
        headers=auth_headers,
    )
    assert sub.status_code == 201
    assert sub.json()["category_id"] is None
