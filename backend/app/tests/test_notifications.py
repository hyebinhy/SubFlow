"""Tests for the notification endpoints (/api/v1/notifications).

Notification settings are created automatically during user registration
(see auth_service.py), so the ``auth_headers`` fixture is sufficient to
guarantee a settings row exists.
"""

import httpx


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


async def test_get_settings(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
):
    """GET /api/v1/notifications/settings returns 200 with default settings."""
    resp = await test_client.get(
        "/api/v1/notifications/settings", headers=auth_headers
    )
    assert resp.status_code == 200

    data = resp.json()
    assert "notify_days_before" in data
    assert "email_notifications" in data
    assert "push_notifications" in data
    # Defaults from the model
    assert data["notify_days_before"] == 3
    assert data["email_notifications"] is True
    assert data["push_notifications"] is False


async def test_update_settings(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
):
    """PUT /api/v1/notifications/settings updates and returns new values."""
    payload = {
        "notify_days_before": 7,
        "email_notifications": False,
        "push_notifications": True,
    }
    resp = await test_client.put(
        "/api/v1/notifications/settings", json=payload, headers=auth_headers
    )
    assert resp.status_code == 200

    data = resp.json()
    assert data["notify_days_before"] == 7
    assert data["email_notifications"] is False
    assert data["push_notifications"] is True

    # Verify the change persists by fetching again
    resp2 = await test_client.get(
        "/api/v1/notifications/settings", headers=auth_headers
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["notify_days_before"] == 7


async def test_upcoming_renewals(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
):
    """GET /api/v1/notifications/upcoming returns 200 with a list."""
    resp = await test_client.get(
        "/api/v1/notifications/upcoming", headers=auth_headers
    )
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
