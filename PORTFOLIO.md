# SubFlow — 구독 관리 플랫폼

> 개인 구독(Netflix, Spotify, ChatGPT 등)을 한곳에서 관리하고, 지출을 분석하고, 결제일·요금 인상·환율 변동을 알림으로 받는 **풀스택 크로스플랫폼 서비스**.
> **Web(React) · Mobile(iOS/Android) · API(FastAPI)** 를 하나의 백엔드로 통합.

---

## 한눈에 보기

| 구분 | 내용 |
|------|------|
| **역할** | 기획 · 설계 · 프론트엔드 · 백엔드 · 인프라 (개인 풀스택 프로젝트) |
| **플랫폼** | 반응형 웹 + iOS/Android 네이티브 앱 (동일 백엔드 · 계정 공유) |
| **백엔드** | FastAPI(async) · SQLAlchemy 2.0 · PostgreSQL 16 · Alembic |
| **프론트** | React 19 + TypeScript + Vite + Zustand + Recharts + Tailwind |
| **모바일** | Expo + React Native + Expo Router + Zustand + AsyncStorage |
| **인프라** | Docker Compose(3-tier) · nginx 리버스 프록시 · APScheduler |
| **외부 연동** | OpenAI(뉴스 AI 요약) · SMTP(이메일 알림) · 환율 API · 뉴스 수집 |

### 프로젝트 규모

| 지표 | 수치 |
|------|------|
| 개발 기간 | 약 3.5개월 (2026.03 ~ 07) |
| 커밋 수 | 49 |
| 코드 라인 | 약 17,000줄 (백엔드 6.2K · 웹 5.1K · 모바일 6.1K) |
| 소스 파일 | 139개 |
| API 엔드포인트 | 45개 (7개 도메인 라우터) |
| DB 테이블 | 11개 |
| 서비스 카탈로그 | 80여 개 (요금제 포함) |

---

## 핵심 기능 (데모 영상 순서 기준)

### 1. 구독 관리
- **80여 개 서비스 카탈로그**에서 선택 추가 — 서비스별 요금제(Basic/Standard/Premium)·로고·해지 링크 내장
- 카탈로그에 없는 서비스는 **커스텀 구독**으로 직접 입력
- 상태 관리: **활성 / 일시정지 / 해지 / 체험** — 상태 전환 시 이력 자동 기록
- 월/연/주/분기 등 **다양한 결제 주기** 지원

### 2. 대시보드
- 월간·연간 **총 지출**, 활성 구독 수, **다음 결제일**을 한 화면에 요약
- **7일 내 결제 예정** 위젯으로 임박한 결제 강조

### 3. 지출 분석
- **카테고리별 지출 비중** 도넛 차트 (영상/음악/AI/클라우드 …)
- **월별 지출 추이** 라인 차트 — 구독 시작일 기준으로 과거 지출을 재구성
- **절약 인사이트**: 요금제 다운그레이드·해지·결제주기 전환 제안, 원클릭 적용

### 4. 캘린더 · 타임라인
- **캘린더 뷰**: 과거/미래 결제일을 달력에 시각화 (반복 결제 자동 전개)
- **타임라인 뷰**: 구독 생성·플랜 변경·해지 등 **변경 이력** 추적

### 5. 예산 · 알림
- **월 예산 설정** + 초과 시 알림
- **결제 N일 전 알림** — 이메일(SMTP)·푸시 실제 발송
- 인박스(알림함)에서 요금 인상·중복·환율·체험 만료·예산 초과 알림 통합 관리

### 6. 고급 인사이트
- **중복 구독 감지** — 같은 카테고리 내 겹치는 서비스 탐지
- **환율 추적** — 외화($) 구독의 환율 변동을 감지해 KRW 환산·알림
- **요금 인상 추적** — 요금제 가격 변동 이력(`plan_price_history`) 관리

### 7. 뉴스 위젯 + AI 요약
- 구독 서비스 관련 뉴스를 백그라운드로 수집·캐시
- 로그인 시 **내 구독 서비스 기준으로 뉴스 개인화 정렬**
- 기사 카드 탭 → **OpenAI(gpt-4o-mini) 기반 AI 요약 모달** (키 미설정 시 원문 폴백)

---

## 기술적으로 신경 쓴 부분 (엔지니어링 포인트)

### 아키텍처
- **3-tier Docker Compose**: `PostgreSQL → FastAPI → nginx(정적 웹 + /api 프록시)` 한 번에 기동
- **same-origin 프록시**: nginx가 `/api`를 백엔드로 프록시해 **CORS 없이** 웹 서빙
- **프론트 멀티스테이지 빌드**: node로 빌드 → nginx alpine으로 정적 서빙 (경량 이미지)
- 컨테이너 기동 시 **Alembic 마이그레이션 자동 실행** + 카탈로그 시드

### 백엔드 설계
- **완전 async 스택**: FastAPI + SQLAlchemy 2.0 async ORM + asyncpg
- 계층 분리: `router → service(비즈니스 로직) → model` — 라우터는 얇게 유지
- **APScheduler**로 뉴스 수집·알림 발송 등 백그라운드 작업 스케줄링
- Pydantic 스키마로 요청/응답 검증 (비밀번호 강도 검증 등 커스텀 validator)

### 보안
- **JWT access + refresh 토큰** + bcrypt 비밀번호 해싱
- **Rate limiting** (slowapi): 로그인 10회/분, 회원가입 5회/분 — 무차별 대입 방지
- **사용자 열거 방지**: 로그인 실패 응답 401 통일
- **시크릿 환경변수화**: `SECRET_KEY`·DB 비번 등 분리, 기본값 사용 시 기동 경고
- **프록시 스푸핑 대비**: `X-Forwarded-For` 신뢰를 `TRUST_PROXY` 플래그로 제어

### 크로스플랫폼
- 웹·모바일이 **동일 백엔드 = 동일 DB**를 공유해 계정·데이터 일관성 유지
- 모바일 API 클라이언트가 **개발 서버(Metro) 호스트 IP를 자동 추론** → 환경 변경에도 하드코딩 불필요
- **다국어(i18n) 한/영** 지원

---

## 트러블슈팅 / 문제 해결 경험

### 1. PostgreSQL 볼륨 비밀번호 불일치로 인한 컨테이너 크래시 루프
- **증상**: 운영용 강한 DB 비밀번호로 교체 후 배포하니 백엔드가 `password authentication failed`로 재시작 무한 반복
- **원인**: PostgreSQL은 **데이터 볼륨을 처음 생성할 때 한 번만** 비밀번호를 초기화한다. 기존 볼륨(개발용 기본 비번)이 남아 있어 새 비번과 불일치
- **해결**: 볼륨을 재생성해 새 자격증명으로 초기화. 배포 문서에 "비번 변경 시 볼륨 초기화 필요" 명시
- **배운 점**: 컨테이너 환경변수 ≠ 이미 초기화된 상태. 스테이트풀 서비스의 초기화 시점을 이해해야 함

### 2. CORS 없이 웹 서빙 — same-origin 리버스 프록시
- **문제**: 프론트/백엔드 분리 배포 시 CORS 설정·프리플라이트 관리 부담
- **해결**: nginx가 정적 웹을 서빙하면서 `/api`를 백엔드로 프록시 → 브라우저 입장에선 **동일 출처**라 CORS 자체가 불필요
- **효과**: CORS 설정 표면 축소(보안·유지보수 이점), 배포 구성 단순화

### 3. 모바일 개발 서버 IP 하드코딩 문제
- **문제**: 네이티브 앱은 `localhost`가 기기 자신을 가리켜 PC 백엔드에 접근 불가. IP를 하드코딩하면 와이파이/네트워크 변경 시마다 수정 필요
- **해결**: Expo 개발 서버(Metro) 호스트 IP를 런타임에 자동 추론해 백엔드 주소로 사용 → **환경이 바뀌어도 코드 수정 불필요**

### 4. pydantic-settings의 리스트 환경변수 파싱 함정
- **문제**: `ALLOWED_ORIGINS`를 `list[str]`로 두면 pydantic-settings가 JSON으로 파싱하려다 콤마 구분 문자열에서 에러
- **해결**: 콤마 구분 **문자열**로 받고 `@property`에서 리스트로 변환 → 환경변수 입력 형식을 단순하게 유지

---

## 시스템 아키텍처

```
                ┌─────────────┐        ┌─────────────┐
   사용자 ────► │  Web (React) │        │ Mobile (RN) │
                └──────┬──────┘        └──────┬──────┘
                       │  /api (same-origin)  │  Bearer JWT
                       ▼                       ▼
                ┌───────────────────────────────────┐
                │        FastAPI (async)            │
                │  Auth · Subscriptions · Analytics │
                │  Notifications · News · Services  │
                └──────────────┬────────────────────┘
                               │  SQLAlchemy 2.0 async
                               ▼
                    ┌────────────────────┐
                    │   PostgreSQL 16    │  (11개 테이블)
                    └────────────────────┘
   외부: OpenAI(AI요약) · SMTP(이메일) · 환율 API · 뉴스 수집
```

---

## 데이터 모델 (11개 테이블)

`users` · `categories` · `services` · `service_plans` · `plan_price_history` ·
`subscriptions` · `payment_history` · `subscription_history` ·
`notification_settings` · `notifications` · `news_cache`

- UUID 기반 사용자·구독 식별
- 요금제 가격 변동, 구독 변경, 결제 이력을 **별도 이력 테이블**로 추적해 타임라인·인상 감지 구현

---

## 기술 스택 상세

**Frontend (Web):** React 19 · TypeScript · Vite · Zustand · React Router · Axios(JWT 인터셉터) · Recharts · Tailwind CSS · Lucide

**Backend:** FastAPI · SQLAlchemy 2.0(async) · Alembic · PostgreSQL 16 · Pydantic · JWT + bcrypt · slowapi · APScheduler · httpx · aiosmtplib · OpenAI

**Mobile:** Expo · React Native · Expo Router · Zustand + AsyncStorage · Axios · i18n(한/영)

**Infra:** Docker Compose · nginx · 멀티스테이지 빌드

---

## 데모 계정

```
이메일: demo@subflow.app
비밀번호: demo1234
```
활성 구독 6건 · 월 지출 ₩62,739 · 외화 구독(환율 기능) · 일시정지/해지 상태 예시 · 월 예산 ₩80,000 포함
