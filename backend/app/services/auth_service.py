from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import (
    EMAIL_VERIFY_EXPIRE_HOURS,
    PASSWORD_RESET_EXPIRE_MINUTES,
    create_access_token,
    create_email_verify_token,
    create_password_reset_token,
    create_refresh_token,
    decode_email_verify_token,
    decode_password_reset_token,
    decode_token,
    hash_password,
    peek_token_subject,
    verify_password,
)
from app.models.notification_setting import NotificationSetting
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.delivery_service import send_email

# 존재하지 않는 이메일에도 동일한 시간을 소요시켜 타이밍 기반 사용자 열거를 막는다
_DUMMY_HASH = hash_password("timing_attack_mitigation_dummy")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> User:
        result = await self.db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            username=data.username,
        )
        self.db.add(user)
        await self.db.flush()

        notification_setting = NotificationSetting(user_id=user.id)
        self.db.add(notification_setting)
        await self.db.commit()
        await self.db.refresh(user)

        # 인증 메일은 가입을 막지 않는다 — 실패해도 계정은 이미 만들어졌다.
        await self.send_verification_email(user)
        return user

    # ── 이메일 인증 ──────────────────────────────────────────────────
    async def send_verification_email(self, user: User) -> None:
        if user.email_verified:
            return
        token = create_email_verify_token(str(user.id), user.email)
        link = f"{settings.APP_BASE_URL.rstrip('/')}/verify-email?token={token}"
        body = (
            f"{user.username}님, SubFlow 가입을 환영합니다.\n\n"
            f"아래 링크를 열면 이메일 주소 확인이 끝납니다.\n"
            f"{link}\n\n"
            f"이 링크는 {EMAIL_VERIFY_EXPIRE_HOURS}시간 뒤 만료됩니다.\n"
            f"확인 전에도 SubFlow는 그대로 쓸 수 있지만, 결제일 알림 메일은 "
            f"확인 후부터 발송됩니다.\n"
        )
        sent = await send_email(user.email, "[SubFlow] 이메일 주소를 확인해주세요", body)
        if not sent:
            print(f"[auth] SMTP 미설정 — 인증 링크: {link}")

    async def verify_email(self, token: str) -> None:
        invalid = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="링크가 만료되었거나 유효하지 않습니다. 인증 메일을 다시 보내주세요.",
        )
        user_id = peek_token_subject(token)
        if not user_id:
            raise invalid
        try:
            uid = UUID(user_id)
        except ValueError:
            raise invalid

        result = await self.db.execute(select(User).where(User.id == uid))
        user = result.scalar_one_or_none()
        if not user:
            raise invalid
        # 이미 인증된 계정에 같은 링크를 다시 열면 조용히 성공 처리한다
        # (메일 클라이언트가 링크를 미리 여는 경우가 있다)
        if user.email_verified:
            return
        if decode_email_verify_token(token, user.email) is None:
            raise invalid

        user.email_verified = True
        await self.db.commit()

    async def login(self, data: LoginRequest) -> TokenResponse:
        result = await self.db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()

        # 이메일 없음/비번 오류를 동일한 401·메시지로 통일 (사용자 열거 방지)
        invalid = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )
        if not user:
            verify_password(data.password, _DUMMY_HASH)  # 응답 시간 균일화
            raise invalid
        if not verify_password(data.password, user.hashed_password):
            raise invalid

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        user_id = payload.get("sub")
        result = await self.db.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        new_access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)

    # ── 비밀번호 재설정 ──────────────────────────────────────────────
    async def request_password_reset(self, email: str) -> None:
        """가입 여부와 무관하게 조용히 끝낸다.

        '없는 이메일입니다'를 알려주면 가입자 명단을 캐낼 수 있다(사용자 열거).
        라우터는 어느 경우든 같은 메시지·상태코드를 돌려준다.
        """
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            return

        token = create_password_reset_token(str(user.id), user.hashed_password)
        link = f"{settings.APP_BASE_URL.rstrip('/')}/reset-password?token={token}"
        body = (
            f"{user.username}님,\n\n"
            f"SubFlow 비밀번호를 재설정하려면 아래 링크를 여세요.\n"
            f"{link}\n\n"
            f"이 링크는 {PASSWORD_RESET_EXPIRE_MINUTES}분 뒤 만료되며, 한 번만 쓸 수 있습니다.\n"
            f"본인이 요청한 게 아니라면 이 메일을 무시하세요. 비밀번호는 그대로입니다.\n"
        )
        sent = await send_email(user.email, "[SubFlow] 비밀번호 재설정", body)
        if not sent:
            # SMTP 미설정(개발 환경)에서는 링크를 로그로 남겨 흐름을 확인할 수 있게 한다.
            print(f"[auth] SMTP 미설정 — 재설정 링크: {link}")

    async def reset_password(self, token: str, new_password: str) -> None:
        invalid = HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="링크가 만료되었거나 이미 사용되었습니다. 다시 요청해주세요.",
        )

        # 서명 검증에 사용자의 현재 비밀번호 해시가 필요하므로 sub를 먼저 들여다본다.
        # (이 값 자체는 신뢰하지 않는다 — 아래 decode에서 서명이 실제로 검증된다)
        user_id = peek_token_subject(token)
        if not user_id:
            raise invalid
        try:
            uid = UUID(user_id)
        except ValueError:
            raise invalid

        result = await self.db.execute(select(User).where(User.id == uid))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise invalid
        if decode_password_reset_token(token, user.hashed_password) is None:
            raise invalid

        user.hashed_password = hash_password(new_password)
        await self.db.commit()
