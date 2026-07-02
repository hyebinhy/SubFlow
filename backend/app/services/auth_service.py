from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.notification_setting import NotificationSetting
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

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
        return user

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
