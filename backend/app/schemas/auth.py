from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    username: str = Field(min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isalpha() for c in v):
            raise ValueError("비밀번호에 영문자를 최소 1자 포함해야 합니다.")
        if not any(c.isdigit() for c in v):
            raise ValueError("비밀번호에 숫자를 최소 1자 포함해야 합니다.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=100)

    # 가입 때와 같은 강도 규칙을 쓴다 — 재설정으로 우회되면 의미가 없다
    _check = field_validator("new_password")(
        RegisterRequest.validate_password_strength.__func__
    )


class VerifyEmailRequest(BaseModel):
    token: str


class SimpleMessage(BaseModel):
    message: str
