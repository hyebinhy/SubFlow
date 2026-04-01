# SubFlow - 구독 관리 플랫폼

개인 구독 서비스(Netflix, Spotify, YouTube Premium 등)를 한곳에서 관리하고, 월별 지출을 분석하며, 결제일 알림을 받을 수 있는 풀스택 웹 애플리케이션입니다.

## 주요 기능

- **구독 관리** - 30개 이상의 서비스 카탈로그에서 구독 추가, 커스텀 구독 직접 입력
- **대시보드** - 월/연간 총 지출, 활성 구독 수, 다음 결제일 요약
- **지출 분석** - 카테고리별 지출 비중, 월별 지출 추이 차트
- **캘린더** - 과거/미래 결제일을 캘린더에서 한눈에 확인
- **타임라인** - 구독 변경 이력 추적 (생성, 플랜 변경, 해지 등)
- **예산 관리** - 월 예산 설정 및 초과 알림
- **환율 추적** - 외화 구독의 환율 변동 알림 (KRW 자동 변환)
- **중복 감지** - 같은 카테고리 내 겹치는 서비스 탐지
- **절약 제안** - 비용 절감 추천
- **알림 설정** - 결제 N일 전 알림, 이메일/푸시 알림 토글

## 기술 스택

### Frontend
| 기술 | 용도 |
|------|------|
| React 19 + TypeScript | UI 프레임워크 |
| Vite | 빌드 도구 |
| Zustand | 상태 관리 |
| React Router DOM | 라우팅 |
| Axios | HTTP 클라이언트 (JWT 인터셉터 포함) |
| Recharts | 차트/그래프 |
| Tailwind CSS | 스타일링 |
| Lucide Icons | 아이콘 |

### Backend
| 기술 | 용도 |
|------|------|
| FastAPI | 비동기 API 프레임워크 |
| SQLAlchemy 2.0 (async) | ORM |
| Alembic | DB 마이그레이션 |
| PostgreSQL 16 | 데이터베이스 |
| JWT + bcrypt | 인증/보안 |
| Pydantic | 데이터 검증 |

### 인프라
| 기술 | 용도 |
|------|------|
| Docker Compose | PostgreSQL 컨테이너 |

## 시작하기

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- Docker Desktop (PostgreSQL용)

### 1. PostgreSQL 데이터베이스 실행

```bash
docker compose up db -d
```

### 2. 백엔드 실행

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# 의존성 설치
pip install -r requirements.txt

# DB 마이그레이션 실행
alembic upgrade head

# 서버 시작
uvicorn app.main:app --reload
```

- API 서버: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs

### 3. 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

- 프론트엔드: http://localhost:5173

## 프로젝트 구조

```
SubFlow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 앱 진입점
│   │   ├── config.py            # 환경 설정
│   │   ├── database.py          # DB 연결 (async)
│   │   ├── core/
│   │   │   ├── security.py      # JWT 토큰, 비밀번호 해싱
│   │   │   └── deps.py          # 의존성 주입 (DB 세션, 현재 유저)
│   │   ├── models/              # SQLAlchemy ORM 모델
│   │   ├── schemas/             # Pydantic 요청/응답 스키마
│   │   ├── services/            # 비즈니스 로직
│   │   ├── routers/             # API 엔드포인트
│   │   └── utils/
│   │       ├── seed_data.py     # 서비스 카탈로그 시드 데이터 (30+ 서비스)
│   │       └── exchange_rate.py # 환율 API (Frankfurter)
│   ├── alembic/                 # DB 마이그레이션
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                 # API 클라이언트 모듈
│   │   ├── store/               # Zustand 상태 관리
│   │   ├── pages/               # 페이지 컴포넌트
│   │   ├── components/          # 재사용 UI 컴포넌트
│   │   ├── hooks/               # 커스텀 훅
│   │   └── types/               # TypeScript 타입 정의
│   └── package.json
└── docker-compose.yml
```

## API 엔드포인트 요약

모든 API는 `/api/v1` 프리픽스를 사용합니다.

| 그룹 | 주요 엔드포인트 | 설명 |
|------|----------------|------|
| **Auth** | `POST /auth/register`, `POST /auth/login` | 회원가입, 로그인 (JWT) |
| **Services** | `GET /services`, `GET /services/popular` | 서비스 카탈로그 조회 |
| **Subscriptions** | `GET /subscriptions`, `POST /subscriptions/from-catalog` | 구독 CRUD |
| **Categories** | `GET /categories` | 카테고리 목록 |
| **Analytics** | `GET /analytics/overview`, `GET /analytics/spending-trend` | 지출 분석 |
| **Notifications** | `GET /notifications/settings` | 알림 설정 |

## 데이터베이스 스키마

주요 테이블 7개:

- **users** - 사용자 계정 (UUID, email, password)
- **categories** - 서비스 카테고리 (영상, 음악, 클라우드 등)
- **services** - 서비스 카탈로그 (Netflix, Spotify 등 30+)
- **service_plans** - 서비스별 요금제 (Basic, Standard, Premium 등)
- **subscriptions** - 사용자의 활성 구독 (상태: active/paused/cancelled/trial)
- **payment_history** - 결제 이력
- **subscription_history** - 구독 변경 이력 (생성, 플랜변경, 해지 등)
- **notification_settings** - 알림 설정 (결제 N일 전 알림, 월 예산)

