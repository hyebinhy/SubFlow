import base64
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.config import settings
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.models.user import User
from app.schemas.feedback import FeedbackRequest, FeedbackResponse, FeedbackType
from app.services.delivery_service import send_email

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

_TYPE_LABEL = {
    FeedbackType.BUG: "오류 신고",
    FeedbackType.SUGGESTION: "개선 의견",
    FeedbackType.OTHER: "기타 문의",
}

# 메일 본문이 감당할 만큼만 받는다. 넘치는 건 조용히 버린다 —
# 신고 자체를 거절해서 사용자가 쓴 글을 날리는 것보다 낫다.
_MAX_CLIENT_KEYS = 12
_MAX_CLIENT_VALUE = 200

# 첨부 이미지 상한(디코드 후 실제 바이트). 클라이언트가 미리 줄여 보내지만
# 그걸 믿고 서버에서 안 재면 큰 파일 하나로 메일 발송이 통째로 막힌다.
_MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024


def _build_body(user: User, data: FeedbackRequest, request: Request) -> str:
    lines = [
        data.message.strip(),
        "",
        "─" * 40,
        f"종류    : {_TYPE_LABEL.get(data.type, data.type.value)}",
        f"보낸이  : {user.username} <{user.email}>",
        f"사용자ID: {user.id}",
        f"시각    : {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
    ]

    for key, value in list(data.client.items())[:_MAX_CLIENT_KEYS]:
        lines.append(f"{key:<8}: {str(value)[:_MAX_CLIENT_VALUE]}")

    # 클라이언트가 안 보내줘도 서버가 아는 것들
    agent = request.headers.get("user-agent")
    if agent:
        lines.append(f"UA      : {agent[:_MAX_CLIENT_VALUE]}")
    if data.screenshot:
        lines.append(f"첨부    : {data.screenshot.filename}")

    return "\n".join(lines)


def _build_attachments(data: FeedbackRequest) -> list[dict] | None:
    """첨부 이미지를 메일 첨부 형식으로 옮긴다.

    깨졌거나 너무 크면 조용히 버리고 본문만 보낸다. 첨부 하나 때문에 신고
    자체가 실패하면 사용자는 왜 안 갔는지도 모른 채 쓴 글을 날린다.
    """
    shot = data.screenshot
    if not shot or not shot.content_base64:
        return None
    try:
        raw = base64.b64decode(shot.content_base64, validate=True)
    except Exception:
        logger.warning("[feedback] 첨부 base64 해석 실패 — 본문만 보낸다")
        return None
    if len(raw) > _MAX_SCREENSHOT_BYTES:
        logger.warning("[feedback] 첨부가 너무 큼(%s바이트) — 본문만 보낸다", len(raw))
        return None
    return [{"filename": shot.filename or "screenshot.jpg", "content": shot.content_base64}]


@router.post("", response_model=FeedbackResponse)
@limiter.limit("3/minute")
async def send_feedback(
    request: Request,
    data: FeedbackRequest,
    current_user: User = Depends(get_current_user),
):
    """오류 신고·의견을 운영자 메일로 보낸다.

    별도 테이블을 두지 않는다. 대신 발송 성공 여부와 무관하게 본문을 로그에
    남겨, 메일이 실패해도 신고 내용이 사라지지 않게 한다.

    응답은 발송 실패에도 200이다. 사용자가 할 수 있는 일이 없는데 에러를
    띄우면 같은 신고를 반복해서 보내게 된다.
    """
    body = _build_body(current_user, data, request)
    logger.info("[feedback] from=%s type=%s\n%s", current_user.email, data.type.value, body)

    subject = f"[SubFlow] {_TYPE_LABEL.get(data.type, '문의')} - {current_user.email}"
    sent = await send_email(settings.FEEDBACK_EMAIL, subject, body, _build_attachments(data))
    if not sent:
        logger.warning("[feedback] 메일 발송 실패 — 위 로그로만 남는다 (to=%s)", settings.FEEDBACK_EMAIL)
    return FeedbackResponse(sent=sent)
