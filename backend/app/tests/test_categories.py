"""Tests for the category endpoints (/api/v1/categories).

Since the lifespan seeder writes to the production DB (not the test session),
categories are seeded manually in tests that require them.
"""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


# ---------------------------------------------------------------------------
# Helper: seed default categories into the test database
# ---------------------------------------------------------------------------


async def _seed_categories(db: AsyncSession) -> None:
    categories = [
        Category(name="Entertainment", icon="film", color="#E50914", is_default=True),
        Category(name="Music", icon="music", color="#1DB954", is_default=True),
        Category(name="Developer Tools", icon="code", color="#6E40C9", is_default=True),
    ]
    db.add_all(categories)
    await db.commit()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


async def test_list_categories(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    test_db: AsyncSession,
):
    """GET /api/v1/categories returns 200 and the seeded categories."""
    await _seed_categories(test_db)

    resp = await test_client.get("/api/v1/categories", headers=auth_headers)
    assert resp.status_code == 200

    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    names = {c["name"] for c in data}
    assert "Entertainment" in names
    assert "Music" in names
    assert "Developer Tools" in names


async def test_create_category(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
):
    """POST /api/v1/categories with a new category returns 201."""
    payload = {
        "name": "Custom Category",
        "icon": "star",
        "color": "#FF5733",
    }
    resp = await test_client.post(
        "/api/v1/categories", json=payload, headers=auth_headers
    )
    assert resp.status_code == 201

    data = resp.json()
    assert data["name"] == "Custom Category"
    assert data["icon"] == "star"
    assert data["color"] == "#FF5733"
    assert data["is_default"] is False
    assert "id" in data
