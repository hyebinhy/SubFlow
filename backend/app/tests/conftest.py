"""
Test configuration and fixtures for the subscription system backend.

Requirements (add to requirements.txt if missing):
    pytest==8.3.4
    pytest-asyncio==0.24.0
    httpx==0.28.1

The test suite uses a separate PostgreSQL database (subscription_test_db)
to avoid interfering with development data. PostgreSQL is required because
the models use PostgreSQL-specific types (UUID, ENUM).

Make sure PostgreSQL is running on localhost:5432 with user/password postgres/postgres,
or set the TEST_DATABASE_URL environment variable.
"""

import asyncio
import os
from collections.abc import AsyncGenerator

import httpx
import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.database import Base

# Import all models so they are registered on Base.metadata before create_all.
from app.models import *  # noqa: F401, F403

from app.core.deps import get_db
from app.main import create_app

# ---------------------------------------------------------------------------
# Database URLs
# ---------------------------------------------------------------------------

# The main DB URL used by the application (for creating the test database).
_MAIN_DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres",
)

# The test database URL.  Override with the TEST_DATABASE_URL env var if needed.
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/subscription_test_db",
)

TEST_DB_NAME = "subscription_test_db"

# ---------------------------------------------------------------------------
# Event-loop scope — one loop for the whole test session
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# Engine / session fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture(scope="session")
async def _ensure_test_database():
    """Create the test database if it does not exist yet.

    Connects to the default ``postgres`` database to issue the CREATE DATABASE
    statement, because you cannot create a database while connected to it.
    """
    engine = create_async_engine(
        _MAIN_DB_URL,
        isolation_level="AUTOCOMMIT",
    )
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                "SELECT 1 FROM pg_database WHERE datname = :dbname"
            ),
            {"dbname": TEST_DB_NAME},
        )
        if not result.scalar():
            await conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def test_engine(_ensure_test_database):
    """Create an async SQLAlchemy engine pointing at the test database."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def test_db(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean database session for every test.

    Before each test all tables are created (if they don't already exist).
    After each test all tables are dropped so the next test starts fresh.
    """
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Build a session factory bound to the test engine
    session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        yield session

    # Drop tables after the test to guarantee isolation
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ---------------------------------------------------------------------------
# Application / client fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def test_app(test_db: AsyncSession):
    """Return a FastAPI application with the ``get_db`` dependency overridden
    so that all routes use the test database session.
    """
    app = create_app()

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield test_db

    app.dependency_overrides[get_db] = _override_get_db
    return app


@pytest_asyncio.fixture
async def test_client(test_app) -> AsyncGenerator[httpx.AsyncClient, None]:
    """Provide an ``httpx.AsyncClient`` wired to the test application."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app),
        base_url="http://testserver",
    ) as client:
        yield client


# ---------------------------------------------------------------------------
# User / auth helper fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def test_user_data() -> dict:
    """Return a dictionary with test user registration data."""
    return {
        "email": "testuser@example.com",
        "password": "securepassword123",
        "username": "testuser",
    }


@pytest_asyncio.fixture
async def auth_headers(test_client: httpx.AsyncClient, test_user_data: dict) -> dict:
    """Register a test user and return authorization headers.

    Returns a dict like ``{"Authorization": "Bearer <access_token>"}``.
    """
    # Register the user
    register_response = await test_client.post(
        "/api/v1/auth/register",
        json=test_user_data,
    )
    assert register_response.status_code == 201, (
        f"Registration failed: {register_response.text}"
    )

    # Log in to obtain tokens
    login_response = await test_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        },
    )
    assert login_response.status_code == 200, (
        f"Login failed: {login_response.text}"
    )

    tokens = login_response.json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}
