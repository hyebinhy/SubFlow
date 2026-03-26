"""Tests for authentication endpoints (/api/v1/auth)."""

import pytest
import httpx


pytestmark = pytest.mark.asyncio


class TestRegister:
    async def test_register_success(self, test_client: httpx.AsyncClient):
        payload = {
            "email": "newuser@example.com",
            "password": "strongpassword1",
            "username": "newuser",
        }
        resp = await test_client.post("/api/v1/auth/register", json=payload)

        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == payload["email"]
        assert data["username"] == payload["username"]
        assert "id" in data
        assert data["is_active"] is True

    async def test_register_duplicate_email(self, test_client: httpx.AsyncClient):
        payload = {
            "email": "duplicate@example.com",
            "password": "strongpassword1",
            "username": "user1",
        }
        resp1 = await test_client.post("/api/v1/auth/register", json=payload)
        assert resp1.status_code == 201

        payload2 = {
            "email": "duplicate@example.com",
            "password": "anotherpassword1",
            "username": "user2",
        }
        resp2 = await test_client.post("/api/v1/auth/register", json=payload2)
        assert resp2.status_code == 400
        assert "already registered" in resp2.json()["detail"].lower()


class TestLogin:
    async def test_login_success(self, test_client: httpx.AsyncClient):
        # Register first
        register_payload = {
            "email": "loginuser@example.com",
            "password": "securepassword1",
            "username": "loginuser",
        }
        await test_client.post("/api/v1/auth/register", json=register_payload)

        # Login
        login_payload = {
            "email": "loginuser@example.com",
            "password": "securepassword1",
        }
        resp = await test_client.post("/api/v1/auth/login", json=login_payload)

        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, test_client: httpx.AsyncClient):
        # Register first
        register_payload = {
            "email": "wrongpw@example.com",
            "password": "correctpassword1",
            "username": "wrongpwuser",
        }
        await test_client.post("/api/v1/auth/register", json=register_payload)

        # Login with wrong password
        login_payload = {
            "email": "wrongpw@example.com",
            "password": "incorrectpassword",
        }
        resp = await test_client.post("/api/v1/auth/login", json=login_payload)

        assert resp.status_code == 401
        assert "invalid password" in resp.json()["detail"].lower()

    async def test_login_nonexistent_user(self, test_client: httpx.AsyncClient):
        login_payload = {
            "email": "nobody@example.com",
            "password": "doesnotmatter1",
        }
        resp = await test_client.post("/api/v1/auth/login", json=login_payload)

        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()


class TestMe:
    async def test_get_me(
        self,
        test_client: httpx.AsyncClient,
        auth_headers: dict,
        test_user_data: dict,
    ):
        resp = await test_client.get("/api/v1/auth/me", headers=auth_headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_user_data["email"]
        assert data["username"] == test_user_data["username"]
        assert data["is_active"] is True

    async def test_get_me_unauthorized(self, test_client: httpx.AsyncClient):
        resp = await test_client.get("/api/v1/auth/me")

        assert resp.status_code in (401, 403)

    async def test_update_me(
        self,
        test_client: httpx.AsyncClient,
        auth_headers: dict,
    ):
        update_payload = {"username": "updatedname"}
        resp = await test_client.put(
            "/api/v1/auth/me",
            json=update_payload,
            headers=auth_headers,
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "updatedname"


class TestRefreshToken:
    async def test_refresh_token(self, test_client: httpx.AsyncClient):
        # Register
        register_payload = {
            "email": "refreshuser@example.com",
            "password": "securepassword1",
            "username": "refreshuser",
        }
        await test_client.post("/api/v1/auth/register", json=register_payload)

        # Login to get tokens
        login_payload = {
            "email": "refreshuser@example.com",
            "password": "securepassword1",
        }
        login_resp = await test_client.post("/api/v1/auth/login", json=login_payload)
        assert login_resp.status_code == 200
        tokens = login_resp.json()

        # Refresh
        refresh_payload = {"refresh_token": tokens["refresh_token"]}
        resp = await test_client.post("/api/v1/auth/refresh", json=refresh_payload)

        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        # New tokens should be issued (they may or may not differ depending on timing,
        # but the important thing is that the endpoint returns valid tokens).
