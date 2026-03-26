from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import async_session_maker
from app.utils.seed_data import seed_categories, seed_services


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with async_session_maker() as session:
        await seed_categories(session)
        await seed_services(session)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.routers import auth, subscriptions, categories, analytics, notifications, services

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(services.router, prefix="/api/v1/services", tags=["services"])
    app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["subscriptions"])
    app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
    app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])

    return app


app = create_app()
