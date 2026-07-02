import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import async_session_maker
from app.services.delivery_service import deliver_pending
from app.services.digest_service import send_weekly_digest
from app.services.news_service import refresh_news_cache

logger = logging.getLogger("uvicorn.error")

_scheduler: AsyncIOScheduler | None = None


async def _refresh_news_job() -> None:
    try:
        async with async_session_maker() as session:
            n = await refresh_news_cache(session)
            logger.info("[scheduler] news cache refreshed: %s items", n)
    except Exception as exc:  # 잡 실패가 앱을 죽이지 않도록
        logger.warning("[scheduler] news refresh failed: %s", exc)


async def _deliver_job() -> None:
    try:
        async with async_session_maker() as session:
            n = await deliver_pending(session)
            if n:
                logger.info("[scheduler] delivered %s notifications", n)
    except Exception as exc:
        logger.warning("[scheduler] delivery failed: %s", exc)


async def _weekly_digest_job() -> None:
    try:
        async with async_session_maker() as session:
            n = await send_weekly_digest(session)
            logger.info("[scheduler] weekly digest sent to %s users", n)
    except Exception as exc:
        logger.warning("[scheduler] weekly digest failed: %s", exc)


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.add_job(_refresh_news_job, "interval", hours=6, id="news_refresh")
    _scheduler.add_job(_refresh_news_job, "date", id="news_refresh_initial")  # 시작 직후 1회
    _scheduler.add_job(_deliver_job, "interval", minutes=10, id="deliver")  # 미배송 알림 발송
    # 주간 다이제스트: 매주 월요일 00:00 UTC (≈ 월 09:00 KST)
    _scheduler.add_job(_weekly_digest_job, "cron", day_of_week="mon", hour=0, minute=0, id="weekly_digest")
    _scheduler.start()
    logger.info("[scheduler] started")


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
