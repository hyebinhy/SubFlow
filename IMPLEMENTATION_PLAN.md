# 구독 관리 앱 (Subscription Manager) - 구현 계획

## Context
개인 구독 서비스(넷플릭스, 유튜브 프리미엄 등)를 관리/추적하고, 만료일 알림과 월별 지출 분석을 제공하는 풀스택 웹 앱. API-first 설계로 향후 모바일 앱 확장 가능.

## 기술 스택
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Zustand + Recharts
- **Backend**: FastAPI (async) + SQLAlchemy 2.0 + Alembic
- **Database**: PostgreSQL 16 + asyncpg
- **Auth**: JWT (access + refresh token) + bcrypt
- **Infra**: Docker Compose

---

## 프로젝트 구조

```
subscription_system/
├── docker-compose.yml
├── .gitignore
├── .env.example
├── backend/
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   └── app/
│       ├── main.py              # FastAPI 앱 팩토리, CORS, 라우터 등록
│       ├── config.py            # pydantic-settings 환경변수 관리
│       ├── database.py          # Async SQLAlchemy 엔진/세션
│       ├── models/              # ORM 모델 (user, subscription, category, payment_history, notification_setting)
│       ├── schemas/             # Pydantic 요청/응답 스키마
│       ├── routers/             # API 라우트 (auth, subscriptions, categories, analytics, notifications)
│       ├── services/            # 비즈니스 로직 레이어
│       ├── core/
│       │   ├── security.py      # JWT 생성/검증, 비밀번호 해싱
│       │   └── deps.py          # 의존성 주입 (get_db, get_current_user)
│       └── utils/
│           └── seed_data.py     # 기본 카테고리 시드
├── frontend/
│   ├── package.json
│   └── src/
│       ├── api/                 # Axios 클라이언트 + API 함수
│       ├── store/               # Zustand (authStore, subscriptionStore)
│       ├── pages/               # 페이지 컴포넌트 (Dashboard, Subscriptions, Analytics, Calendar, Settings)
│       ├── components/          # UI 컴포넌트 (layout, subscription, analytics, calendar, common)
│       ├── hooks/               # 커스텀 훅
│       └── types/               # TypeScript 타입 정의
```

---

## DB 스키마 (5개 테이블)

### users
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE |
| hashed_password | VARCHAR(255) | bcrypt |
| username | VARCHAR(100) | |
| is_active | BOOLEAN | DEFAULT true |
| created_at / updated_at | TIMESTAMPTZ | |

### categories
| Column | Type | Note |
|--------|------|------|
| id | SERIAL | PK |
| name | VARCHAR(100) | UNIQUE |
| icon | VARCHAR(50) | emoji/아이콘명 |
| color | VARCHAR(7) | hex 컬러 |
| is_default | BOOLEAN | 시드 데이터 여부 |

### subscriptions
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| category_id | INTEGER | FK → categories |
| service_name | VARCHAR(200) | |
| cost | DECIMAL(10,2) | |
| currency | VARCHAR(3) | DEFAULT 'KRW' |
| billing_cycle | ENUM | monthly/yearly/weekly/quarterly |
| next_billing_date | DATE | |
| status | ENUM | active/paused/cancelled/trial |
| auto_renew | BOOLEAN | |

### payment_history
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| subscription_id | UUID | FK → subscriptions |
| user_id | UUID | FK → users (비정규화) |
| amount | DECIMAL(10,2) | |
| paid_at | DATE | |

### notification_settings
| Column | Type | Note |
|--------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users (1:1) |
| notify_days_before | INTEGER | DEFAULT 3 |
| email_notifications | BOOLEAN | DEFAULT true |

---

## API 엔드포인트 (`/api/v1`)

| 그룹 | Method | Path | 설명 |
|------|--------|------|------|
| Auth | POST | `/auth/register` | 회원가입 |
| Auth | POST | `/auth/login` | 로그인 → access + refresh token |
| Auth | POST | `/auth/refresh` | 토큰 갱신 |
| Auth | GET | `/auth/me` | 내 프로필 |
| Auth | PUT | `/auth/me` | 프로필 수정 |
| Subs | GET | `/subscriptions` | 구독 목록 (필터/정렬) |
| Subs | POST | `/subscriptions` | 구독 추가 |
| Subs | GET | `/subscriptions/upcoming` | 갱신 예정 구독 |
| Subs | GET | `/subscriptions/{id}` | 구독 상세 |
| Subs | PUT | `/subscriptions/{id}` | 구독 수정 |
| Subs | DELETE | `/subscriptions/{id}` | 구독 삭제 |
| Cat | GET | `/categories` | 카테고리 목록 |
| Cat | POST | `/categories` | 카테고리 추가 |
| Analytics | GET | `/analytics/overview` | 대시보드 요약 |
| Analytics | GET | `/analytics/category-breakdown` | 카테고리별 분석 |
| Analytics | GET | `/analytics/spending-trend` | 지출 추이 |
| Notif | GET | `/notifications/settings` | 알림 설정 조회 |
| Notif | PUT | `/notifications/settings` | 알림 설정 수정 |
| Notif | GET | `/notifications/upcoming` | 다가오는 갱신 알림 |

---

## 구현 순서

### Phase 1: 기반 구축
1. 프로젝트 스캐폴딩 (디렉토리, .gitignore, docker-compose, requirements.txt)
2. DB 설정 (config.py, database.py, 모든 ORM 모델)
3. Alembic 마이그레이션 설정 + 초기 마이그레이션
4. 보안 모듈 (security.py, deps.py)
5. FastAPI 앱 팩토리 (main.py)

### Phase 2: 인증 시스템
6. Auth 스키마 + 서비스 + 라우터 (백엔드)
7. React 프로젝트 초기화 (Vite + Tailwind + React Router)
8. Axios 클라이언트 + Auth Store + 로그인/회원가입 페이지

### Phase 3: 핵심 CRUD
9. Subscriptions 스키마 + 서비스 + 라우터
10. Categories 라우터 + 시드 데이터
11. 프론트엔드 레이아웃 (Header, Sidebar, Layout)
12. 구독 관리 UI (카드, 리스트, 폼, 모달)

### Phase 4: 분석 & 대시보드
13. Analytics 서비스 + 라우터
14. 대시보드 페이지 (요약 카드, 차트)
15. 분석 페이지 (지출 추이, 카테고리 파이차트)

### Phase 5: 알림 & 캘린더
16. Notifications 서비스 + 라우터
17. 캘린더 페이지 (갱신 일정)
18. 설정 페이지

### Phase 6: 마무리
19. 에러 처리, 로딩 상태, 반응형 디자인
20. 백엔드 테스트

---

## 검증 방법
1. `docker-compose up db`로 PostgreSQL 실행
2. `alembic upgrade head`로 마이그레이션 적용
3. `uvicorn app.main:app --reload`로 백엔드 실행 → `http://localhost:8000/docs`에서 API 테스트
4. `npm run dev`로 프론트엔드 실행 → `http://localhost:5173`에서 UI 확인
5. 회원가입 → 로그인 → 구독 추가 → 대시보드 확인 → 분석 페이지 확인 순서로 E2E 검증
