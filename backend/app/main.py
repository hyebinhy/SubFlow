import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import settings
from app.core.limiter import limiter
from app.database import async_session_maker
from app.scheduler import shutdown_scheduler, start_scheduler
from app.utils.seed_data import seed_categories, seed_services

logger = logging.getLogger("uvicorn.error")

_DEFAULT_SECRET = "your-secret-key-change-in-production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.SECRET_KEY == _DEFAULT_SECRET:
        logger.warning(
            "⚠️  기본 SECRET_KEY를 사용 중입니다. 운영 환경에서는 반드시 SECRET_KEY 환경변수를 "
            "안전한 값으로 설정하세요. (예: python -c \"import secrets; print(secrets.token_urlsafe(48))\")"
        )
    async with async_session_maker() as session:
        await seed_categories(session)
        await seed_services(session)
    start_scheduler()  # 뉴스 캐시 백그라운드 수집 시작
    yield
    shutdown_scheduler()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        lifespan=lifespan,
    )

    # Rate limiting (무차별 대입 방지)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.routers import auth, subscriptions, categories, analytics, notifications, services, news

    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(services.router, prefix="/api/v1/services", tags=["services"])
    app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["subscriptions"])
    app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
    app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
    app.include_router(news.router, prefix="/api/v1/news", tags=["news"])

    return app


app = create_app()
