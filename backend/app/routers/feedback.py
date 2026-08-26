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

    return "\n".join(lines)


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
    sent = await send_email(settings.FEEDBACK_EMAIL, subject, body)
    if not sent:
        logger.warning("[feedback] 메일 발송 실패 — 위 로그로만 남는다 (to=%s)", settings.FEEDBACK_EMAIL)
    return FeedbackResponse(sent=sent)
