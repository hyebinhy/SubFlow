"""오류 신고 엔드포인트(/api/v1/feedback) 테스트.

실제로 메일을 보내면 안 되므로 send_email을 monkeypatch로 가로채고,
그 자리에 넘어온 수신자·제목·본문을 검사한다.
"""

import httpx
import pytest

from app.routers import feedback as feedback_router


@pytest.fixture
def captured_mail(monkeypatch) -> list[dict]:
    """send_email 호출을 가로채 목록에 쌓는다. 발송은 성공한 것으로 친다."""
    sent: list[dict] = []

    async def fake_send_email(to: str, subject: str, body: str) -> bool:
        sent.append({"to": to, "subject": subject, "body": body})
        return True

    monkeypatch.setattr(feedback_router, "send_email", fake_send_email)
    return sent


async def test_requires_auth(test_client: httpx.AsyncClient):
    """로그인 없이는 신고할 수 없다 (스팸 차단)."""
    resp = await test_client.post("/api/v1/feedback", json={"message": "구독이 안 담겨요"})
    assert resp.status_code == 401


async def test_sends_mail_with_reporter_and_context(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    captured_mail: list[dict],
):
    """본문에 신고 내용, 보낸 사람, 클라이언트가 준 진단 정보가 함께 담긴다."""
    resp = await test_client.post(
        "/api/v1/feedback",
        headers=auth_headers,
        json={
            "type": "bug",
            "message": "구독을 추가하면 금액이 0원으로 저장됩니다",
            "client": {"platform": "android", "version": "1.0.0", "screen": "catalog"},
        },
    )

    assert resp.status_code == 200
    assert resp.json() == {"sent": True}

    assert len(captured_mail) == 1
    mail = captured_mail[0]
    assert mail["to"] == "yge0307@gmail.com"
    assert "testuser@example.com" in mail["subject"]

    body = mail["body"]
    assert "금액이 0원으로 저장됩니다" in body
    assert "testuser@example.com" in body
    assert "오류 신고" in body
    # 클라이언트가 보낸 진단 정보
    assert "android" in body and "1.0.0" in body and "catalog" in body


async def test_short_message_is_rejected(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    captured_mail: list[dict],
):
    """한두 글자짜리 신고는 받지 않는다 — 오발송이 대부분이다."""
    resp = await test_client.post(
        "/api/v1/feedback",
        headers=auth_headers,
        json={"message": "음"},
    )
    assert resp.status_code == 422
    assert captured_mail == []


async def test_client_context_is_capped(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    captured_mail: list[dict],
):
    """client가 아무리 커도 메일 본문이 터지지 않게 잘라 낸다."""
    resp = await test_client.post(
        "/api/v1/feedback",
        headers=auth_headers,
        json={
            "message": "화면이 하얗게 뜹니다",
            "client": {f"key{i}": "x" * 500 for i in range(40)},
        },
    )

    assert resp.status_code == 200
    body = captured_mail[0]["body"]
    assert "x" * 201 not in body          # 값 하나가 200자를 넘지 않는다
    assert body.count("key") <= 12        # 키는 12개까지만


async def test_mail_failure_still_returns_ok(
    test_client: httpx.AsyncClient,
    auth_headers: dict,
    monkeypatch,
):
    """메일이 실패해도 200을 준다.

    사용자가 손쓸 수 있는 게 없는데 에러를 띄우면 같은 신고를 반복해 보내게 된다.
    내용은 서버 로그에 남는다.
    """

    async def failing_send_email(to: str, subject: str, body: str) -> bool:
        return False

    monkeypatch.setattr(feedback_router, "send_email", failing_send_email)

    resp = await test_client.post(
        "/api/v1/feedback",
        headers=auth_headers,
        json={"message": "알림이 두 번씩 옵니다"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"sent": False}
