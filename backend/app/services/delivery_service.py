from datetime import datetime, timezone
from email.message import EmailMessage

import httpx
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.notification import Notification
from app.models.notification_setting import NotificationSetting
from app.models.user import User

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_expo_push(token: str, title: str, body: str) -> bool:
    """Expo Push API로 발송. 성공적으로 접수(HTTP 200)되면 True.
    Expo 푸시는 별도 자격증명 없이 기기 토큰만으로 발송 가능하다.
    """
    if not token:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                EXPO_PUSH_URL,
                json={"to": token, "title": title, "body": body, "sound": "default"},
                headers={"Accept": "application/json", "Content-Type": "application/json"},
            )
            resp.raise_for_status()
        return True
    except Exception as exc:
        print(f"[delivery] expo push failed: {exc}")
        return False


async def send_email(to: str, subject: str, body: str) -> bool:
    """SMTP로 이메일 발송. SMTP 미설정 시 False(no-op)."""
    if not settings.SMTP_HOST or not to:
        return False
    try:
        import aiosmtplib

        msg = EmailMessage()
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=settings.SMTP_TLS,
        )
        return True
    except Exception as exc:
        print(f"[delivery] email failed: {exc}")
        return False


def _build_message(pending: list[Notification]) -> tuple[str, str]:
    if len(pending) == 1:
        return pending[0].title, (pending[0].body or "")
    title = f"{len(pending)}개의 새 알림이 있어요"
    body = pending[0].title + f" 외 {len(pending) - 1}건"
    return title, body


def _email_body(pending: list[Notification]) -> str:
    lines = ["SubFlow 새 알림", ""]
    for n in pending:
        lines.append(f"• {n.title}")
        if n.body:
            lines.append(f"  {n.body}")
    lines += ["", "앱에서 자세히 확인하세요 — SubFlow"]
    return "\n".join(lines)


async def deliver_pending(db: AsyncSession) -> int:
    """미읽음·미배송 알림을 사용자 설정에 따라 푸시/이메일로 발송하고 delivered_at 마킹.
    발송 채널이 하나도 없으면(토큰/ SMTP 미설정) 마킹하지 않아 나중에 재시도된다.
    반환값은 발송 처리된 알림 수.
    """
    # 순환 import 방지
    from app.services.notification_service import NotificationService

    channels = (
        await db.execute(
            select(NotificationSetting).where(
                or_(
                    NotificationSetting.push_notifications.is_(True),
                    NotificationSetting.email_notifications.is_(True),
                )
            )
        )
    ).scalars().all()

    delivered_count = 0
    svc = NotificationService(db)

    for ns in channels:
        # 최신 파생 알림 생성 (중복/가격/체험/예산/환율)
        await svc.sync_all_derived(ns.user_id)

        pending = (
            await db.execute(
                select(Notification)
                .where(
                    Notification.user_id == ns.user_id,
                    Notification.is_read.is_(False),
                    Notification.is_archived.is_(False),
                    Notification.delivered_at.is_(None),
                )
                .order_by(Notification.created_at.desc())
            )
        ).scalars().all()
        if not pending:
            continue

        title, body = _build_message(pending)
        attempted = False

        if ns.push_notifications and ns.push_token:
            if await send_expo_push(ns.push_token, title, body):
                attempted = True

        if ns.email_notifications and settings.SMTP_HOST:
            user = await db.get(User, ns.user_id)
            if user and user.email:
                if await send_email(user.email, f"[SubFlow] {title}", _email_body(pending)):
                    attempted = True

        # 실제로 시도한 채널이 있을 때만 배송 완료로 표시 (없으면 다음 실행에서 재시도)
        if attempted:
            now = datetime.now(timezone.utc)
            for n in pending:
                n.delivered_at = now
            delivered_count += len(pending)

    await db.commit()
    return delivered_count
