from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/subscription_db"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ANTHROPIC_API_KEY: str = ""  # 설정 시 AI 뉴스 제목을 Claude로 요약 (미설정이면 원문 유지)

    # 이메일 발송 (SMTP) — 미설정 시 이메일 발송은 no-op
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "SubFlow <no-reply@subflow.app>"
    SMTP_TLS: bool = True
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://172.30.1.44:8081",
    ]
    APP_NAME: str = "Subscription Manager"
    DEBUG: bool = False
    # 리버스 프록시 뒤에 배포할 때만 True. rate limit이 X-Forwarded-For의 실제 클라이언트 IP를 사용.
    TRUST_PROXY: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
