"""Tests for the service catalog endpoints (/api/v1/services).

The lifespan seeding uses the production session maker, so seeded data is NOT
available in the test database.  Each test that requires catalog data inserts
Category / Service / ServicePlan records directly into the test session.
"""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.service import Service
from app.models.service_plan import ServicePlan
from app.models.subscription import BillingCycle


# ---------------------------------------------------------------------------
# Helper: seed a minimal catalog into the test database
# ---------------------------------------------------------------------------


async def _seed_catalog(db: AsyncSession) -> dict:
    """Insert a category, two services (one popular), and plans.

    Returns a dict with the created IDs for use in assertions.
    """
    cat = Category(name="Entertainment", icon="film", color="#E50914", is_default=True)
    db.add(cat)
    await db.flush()

    svc_popular = Service(
        name="Netflix",
        description="Streaming service",
        category_id=cat.id,
        logo_url="/logos/netflix.png",
        website_url="https://www.netflix.com",
        is_popular=True,
    )
    svc_other = Service(
        name="Hulu",
        description="Another streaming service",
        category_id=cat.id,
        logo_url="/logos/hulu.png",
        website_url="https://www.hulu.com",
        is_popular=False,
    )
    db.add_all([svc_popular, svc_other])
    await db.flush()

    plan1 = ServicePlan(
        service_id=svc_popular.id,
        name="Standard",
        price=13500,
        currency="KRW",
        billing_cycle=BillingCycle.MONTHLY,
    )
    plan2 = ServicePlan(
        service_id=svc_popular.id,
        name="Premium",
        price=17000,
        currency="KRW",
        billing_cycle=BillingCycle.MONTHLY,
    )
    plan3 = ServicePlan(
        service_id=svc_other.id,
        name="Basic",
        price=7900,
        currency="KRW",
        billing_cycle=BillingCycle.MONTHLY,
    )
    db.add_all([plan1, plan2, plan3])
    await db.commit()

    return {
        "category_id": cat.id,
        "popular_service_id": svc_popular.id,
        "other_service_id": svc_other.id,
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


async def test_list_services(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    test_db: AsyncSession,
):
    """GET /api/v1/services returns 200 and lists seeded services."""
    await _seed_catalog(test_db)

    resp = await test_client.get("/api/v1/services", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    names = {s["name"] for s in data}
    assert "Netflix" in names
    assert "Hulu" in names


async def test_popular_services(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    test_db: AsyncSession,
):
    """GET /api/v1/services/popular returns only popular services."""
    await _seed_catalog(test_db)

    resp = await test_client.get("/api/v1/services/popular", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    for svc in data:
        assert svc["is_popular"] is True


async def test_search_services(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    test_db: AsyncSession,
):
    """GET /api/v1/services/search?q=Netflix returns matching results."""
    await _seed_catalog(test_db)

    resp = await test_client.get(
        "/api/v1/services/search", params={"q": "Netflix"}, headers=auth_headers
    )
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(s["name"] == "Netflix" for s in data)


async def test_get_service_detail(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    test_db: AsyncSession,
):
    """GET /api/v1/services/{id} returns 200 and includes plans."""
    ids = await _seed_catalog(test_db)

    resp = await test_client.get(
        f"/api/v1/services/{ids['popular_service_id']}", headers=auth_headers
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["name"] == "Netflix"
    assert "plans" in data
    assert isinstance(data["plans"], list)
    assert len(data["plans"]) == 2


async def test_get_service_not_found(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
):
    """GET /api/v1/services/99999 returns 404."""
    resp = await test_client.get("/api/v1/services/99999", headers=auth_headers)
    assert resp.status_code == 404
