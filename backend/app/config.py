from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/subscription_db"

    # Railway/Heroku 등은 DATABASE_URL을 'postgresql://' 또는 'postgres://'(psycopg2 형식)로 준다.
    # 이 앱은 asyncpg 드라이버를 쓰므로 드라이버를 명시하고, asyncpg가 못 읽는 sslmode 쿼리는 제거한다.
    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_db_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[len("postgres://"):]
        elif v.startswith("postgresql://"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]
        # asyncpg는 URL의 sslmode 쿼리 파라미터를 인식하지 못한다 → 제거
        if "?" in v:
            base, query = v.split("?", 1)
            kept = [p for p in query.split("&") if p and not p.startswith("sslmode=")]
            v = base + ("?" + "&".join(kept) if kept else "")
        return v
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ANTHROPIC_API_KEY: str = ""  # (미사용) 과거 Claude 요약용 슬롯
    OPENAI_API_KEY: str = ""  # 설정 시 AI 뉴스 제목·기사 요약을 OpenAI로 생성 (미설정이면 원문/폴백 유지)

    # 이메일 발송 (SMTP) — 미설정 시 이메일 발송은 no-op
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "SubFlow <no-reply@mysubflow.app>"
    SMTP_TLS: bool = True
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # 콤마 구분 문자열 (pydantic-settings의 list-env JSON 파싱 함정을 피하기 위해 str로 둠)
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:8082,http://127.0.0.1:8082"
    )
    APP_NAME: str = "Subscription Manager"
    DEBUG: bool = False
    # 리버스 프록시 뒤에 배포할 때만 True. rate limit이 X-Forwarded-For의 실제 클라이언트 IP를 사용.
    TRUST_PROXY: bool = False

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
