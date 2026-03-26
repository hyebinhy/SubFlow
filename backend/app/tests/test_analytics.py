"""Tests for the analytics endpoints (/api/v1/analytics)."""

from datetime import date, timedelta

import httpx


# ---------------------------------------------------------------------------
# Helper: create a subscription via the API so analytics have data to report
# ---------------------------------------------------------------------------

SUBSCRIPTION_PAYLOAD = {
    "service_name": "Netflix",
    "cost": 13500,
    "currency": "KRW",
    "billing_cycle": "monthly",
    "start_date": str(date.today() - timedelta(days=30)),
    "next_billing_date": str(date.today() + timedelta(days=1)),
}


async def _create_subscription(
    client: httpx.AsyncClient,
    headers: dict,
    **overrides,
) -> dict:
    payload = {**SUBSCRIPTION_PAYLOAD, **overrides}
    resp = await client.post("/api/v1/subscriptions", json=payload, headers=headers)
    assert resp.status_code == 201, f"Failed to create subscription: {resp.text}"
    return resp.json()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


async def test_overview_empty(test_client: httpx.AsyncClient, auth_headers: dict):
    """GET /api/v1/analytics/overview with no subscriptions returns zeros."""
    resp = await test_client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert data["total_active_subscriptions"] == 0
    assert float(data["total_monthly_cost"]) == 0
    assert float(data["total_yearly_cost"]) == 0
    assert data["next_renewal"] is None
    assert data["most_expensive"] is None


async def test_overview_with_data(test_client: httpx.AsyncClient, auth_headers: dict):
    """After creating a subscription the overview should reflect correct totals."""
    await _create_subscription(test_client, auth_headers)

    resp = await test_client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert data["total_active_subscriptions"] == 1
    assert float(data["total_monthly_cost"]) > 0
    assert float(data["total_yearly_cost"]) > 0
    # Most expensive should be present with a single subscription
    assert data["most_expensive"] is not None
    assert data["most_expensive"]["service_name"] == "Netflix"


async def test_category_breakdown(test_client: httpx.AsyncClient, auth_headers: dict):
    """GET /api/v1/analytics/category-breakdown returns 200."""
    resp = await test_client.get(
        "/api/v1/analytics/category-breakdown", headers=auth_headers
    )
    assert resp.status_code == 200

    data = resp.json()
    assert "breakdown" in data
    assert "total" in data
    assert "year" in data
    assert "month" in data


async def test_spending_trend(test_client: httpx.AsyncClient, auth_headers: dict):
    """GET /api/v1/analytics/spending-trend returns 200 with a list of months."""
    resp = await test_client.get(
        "/api/v1/analytics/spending-trend", headers=auth_headers
    )
    assert resp.status_code == 200

    data = resp.json()
    assert "data" in data
    assert isinstance(data["data"], list)
    # Default is 6 months
    assert len(data["data"]) == 6
    for item in data["data"]:
        assert "year" in item
        assert "month" in item
        assert "total" in item
