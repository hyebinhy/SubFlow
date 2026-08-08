FROM python:3.13-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 의존성 먼저 설치 (레이어 캐시)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 소스 복사 (.dockerignore로 venv/.env/log 제외)
COPY . .

EXPOSE 8000

# 마이그레이션 → 서버 기동. 포트는 배포 플랫폼이 주입하는 $PORT 우선(없으면 8000).
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
