실행 방법

  # 1. PostgreSQL 시작
  docker-compose up db -d

  # 2. 백엔드 실행
  cd backend
  source venv/bin/activate
  alembic upgrade head
  uvicorn app.main:app --reload

  # 3. 프론트엔드 실행
  cd frontend
  npm run dev

  - 백엔드 API 문서: http://localhost:8000/docs
  - 프론트엔드: http://localhost:5173