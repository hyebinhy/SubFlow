"""푸시 설정이 웹과 앱 사이에서 어긋나지 않는지 고정한다.

웹에서 '앱 연동'을 켜면 앱에서도 켜져 있어야 하고, 웹에서 끈 것을 앱이
한 번 열렸다는 이유로 되살려서는 안 된다.
"""

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_setting import NotificationSetting
from app.models.user import User
from app.services.notification_service import NotificationService


async def _make_user(db: AsyncSession, email: str) -> User:
    user = User(email=email, hashed_password="x", username="pushtest")
    db.add(user)
    await db.flush()
    db.add(NotificationSetting(user_id=user.id))
    await db.flush()
    return user


async def test_first_token_turns_push_on(test_db: AsyncSession):
    """처음 토큰을 받은 기기는 푸시를 켜 준다.

    OS 알림 권한을 허용해서 여기까지 온 것이라 켜는 쪽이 기대에 맞다.
    """
    user = await _make_user(test_db, "first@example.com")
    svc = NotificationService(test_db)

    row = await svc.set_push_token(user.id, "ExponentPushToken[aaa]")

    assert row.push_token == "ExponentPushToken[aaa]"
    assert row.push_notifications is True


async def test_relaunch_does_not_revive_a_disabled_setting(test_db: AsyncSession):
    """앱을 다시 열어도 웹에서 꺼 둔 설정이 되살아나지 않는다.

    앱은 실행할 때마다 토큰을 다시 등록한다. 그때마다 켜 버리면 사용자가
    끈 설정이 앱을 한 번 열었다는 이유로 뒤집힌다.
    """
    user = await _make_user(test_db, "relaunch@example.com")
    svc = NotificationService(test_db)

    await svc.set_push_token(user.id, "ExponentPushToken[bbb]")   # 최초 등록 → 켜짐

    row = await svc.get_settings(user.id)
    row.push_notifications = False                                 # 웹에서 껐다
    await test_db.commit()

    await svc.set_push_token(user.id, "ExponentPushToken[bbb]")   # 앱 재실행

    row = await svc.get_settings(user.id)
    assert row.push_notifications is False


async def test_settings_report_whether_a_device_is_connected(
    test_client: httpx.AsyncClient, auth_headers: dict
):
    """켜 두어도 기기가 없으면 알림이 못 간다 — 웹이 그 상태를 알 수 있어야 한다."""
    before = await test_client.get("/api/v1/notifications/settings", headers=auth_headers)
    assert before.status_code == 200
    assert before.json()["push_device_connected"] is False

    await test_client.put(
        "/api/v1/notifications/push-token",
        headers=auth_headers,
        json={"push_token": "ExponentPushToken[ccc]"},
    )

    after = await test_client.get("/api/v1/notifications/settings", headers=auth_headers)
    assert after.json()["push_device_connected"] is True
    # 토큰 자체는 밖으로 내보내지 않는다
    assert "push_token" not in after.json()


@pytest.mark.parametrize(
    "field,value",
    [
        ("push_notifications", True),
        ("email_notifications", False),
        ("notify_days_before", 7),
        ("budget_monthly", 150000),
    ],
)
async def test_settings_update_accepts_the_field_names_clients_send(
    test_client: httpx.AsyncClient, auth_headers: dict, field: str, value
):
    """클라이언트가 보내는 키 이름이 서버와 맞는지 확인한다.

    모바일이 push_enabled / days_before 같은 다른 이름으로 보내고 있어서
    설정이 저장되지 않은 채 화면만 바뀌던 적이 있다. 알 수 없는 키는 조용히
    무시되므로 오류도 나지 않아 눈에 띄지 않는다.
    """
    resp = await test_client.put(
        "/api/v1/notifications/settings", headers=auth_headers, json={field: value}
    )
    assert resp.status_code == 200
    assert resp.json()[field] == value
