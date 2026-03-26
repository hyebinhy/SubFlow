# 구독 관리 앱 - 카탈로그 기반 시스템으로 전환

## Context
현재: 사용자가 구독 서비스를 수동 입력하는 방식
변경: 시스템이 서비스 카탈로그(Netflix, Spotify 등)를 제공 → 사용자가 선택 → 요금제 선택 → 자동 관리

기존 코드(인증, 분석, 캘린더, 알림 등)는 그대로 유지하고, **서비스 카탈로그 + 요금제** 개념을 추가하여 구독 추가 플로우를 변경.

---

## 변경 범위 요약

### 추가할 것 (NEW)
1. `services` 테이블 + 모델 — 서비스 카탈로그 (Netflix, Spotify, GitHub Copilot 등)
2. `service_plans` 테이블 + 모델 — 서비스별 요금제 (Netflix 베이직/스탠다드/프리미엄)
3. 서비스 시드 데이터 — 인기 구독 서비스 30개+ 사전 등록
4. `/api/v1/services` 라우터 — 카탈로그 조회, 검색, 인기 서비스
5. 프론트엔드 서비스 탐색 페이지 — 카탈로그 검색/브라우징 UI
6. 구독 추가 플로우 변경 — 카탈로그에서 선택 → 요금제 선택 → 구독 등록

### 수정할 것 (MODIFY)
1. `subscriptions` 모델 — `service_id`, `plan_id` FK 추가 (service_name 유지하되 서비스 연결)
2. 구독 스키마 — service_id, plan_id 필드 추가
3. SubscriptionService — 서비스/요금제 기반 구독 생성 로직
4. 프론트엔드 SubscriptionsPage — 카탈로그 선택 플로우로 변경
5. Sidebar — "서비스 탐색" 메뉴 추가
6. seed_data.py — 서비스 + 요금제 시드 데이터 추가

### 유지 (KEEP)
- Auth 시스템 전체
- Analytics 시스템 전체
- Notifications 시스템 전체
- Calendar 페이지
- Settings 페이지
- categories 테이블 (서비스 분류에 그대로 사용)

---

## 새로운 DB 스키마

### services (NEW)
| Column | Type | Note |
|--------|------|------|
| id | SERIAL | PK |
| name | VARCHAR(200) | UNIQUE, 서비스명 |
| description | TEXT | 서비스 설명 |
| category_id | INTEGER | FK → categories |
| logo_url | VARCHAR(500) | 로고 이미지 URL |
| website_url | VARCHAR(500) | 공식 사이트 |
| is_popular | BOOLEAN | 인기 서비스 표시 |
| created_at | TIMESTAMPTZ | |

### service_plans (NEW)
| Column | Type | Note |
|--------|------|------|
| id | SERIAL | PK |
| service_id | INTEGER | FK → services |
| name | VARCHAR(100) | 요금제 이름 (베이직, 프리미엄 등) |
| price | DECIMAL(10,2) | 가격 |
| currency | VARCHAR(3) | DEFAULT 'KRW' |
| billing_cycle | ENUM | monthly/yearly/weekly/quarterly |
| description | TEXT | 요금제 설명 |
| is_active | BOOLEAN | DEFAULT true |

### subscriptions (MODIFY — 필드 추가)
| Column | Type | Note |
|--------|------|------|
| service_id | INTEGER | FK → services (NEW, nullable) |
| plan_id | INTEGER | FK → service_plans (NEW, nullable) |
| *(기존 컬럼 모두 유지)* | | |

---

## 새로운 API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/services` | 서비스 카탈로그 (카테고리 필터, 검색, 인기순) |
| GET | `/services/popular` | 인기 서비스 목록 |
| GET | `/services/search?q=넷플릭스` | 서비스 검색 |
| GET | `/services/{id}` | 서비스 상세 + 요금제 목록 |

기존 `POST /subscriptions` 수정:
```json
{
  "service_id": 1,
  "plan_id": 3,
  "start_date": "2026-03-01",
  "next_billing_date": "2026-04-01"
}
```
→ service_id, plan_id로 서비스명/비용/주기 자동 채움

---

## 시드 데이터 (서비스 카탈로그)

### 엔터테인먼트
- Netflix (베이직 5,500원, 스탠다드 13,500원, 프리미엄 17,000원)
- YouTube Premium (개인 14,900원, 가족 23,900원)
- Disney+ (스탠다드 9,900원, 프리미엄 13,900원)
- Wavve (베이직 7,900원, 스탠다드 10,900원, 프리미엄 13,900원)
- Tving (베이직 5,500원, 스탠다드 10,900원, 프리미엄 13,900원)
- Watcha (베이직 7,900원, 프리미엄 12,900원)
- Apple TV+ (6,500원)
- Coupang Play (7,890원)

### 음악
- Spotify (개인 10,900원, 듀오 14,900원, 가족 16,900원)
- Apple Music (개인 11,000원, 가족 16,900원)
- Melon (개인 10,900원)
- Genie Music (개인 8,500원)
- FLO (개인 10,900원)
- YouTube Music (개인 10,900원, 가족 16,900원)

### 개발자 도구
- GitHub Copilot (개인 $10/월, 비즈니스 $19/월)
- JetBrains All Products (개인 $24.90/월)
- ChatGPT Plus ($20/월)
- Claude Pro ($20/월)
- Notion (Plus $10/월, Business $18/월)
- Figma (프로 $15/월)

### 클라우드/인프라
- AWS (사용량 기반)
- Google Cloud (사용량 기반)
- Vercel (Pro $20/월)
- Netlify (Pro $19/월)

### 생산성
- Microsoft 365 (개인 8,900원/월)
- Google One (100GB 2,400원/월, 200GB 3,700원/월, 2TB 11,900원/월)
- Dropbox (Plus $11.99/월)
- Adobe Creative Cloud (전체 62,000원/월)

### 기타
- Duolingo Plus (개인 7,900원/월)
- LinkedIn Premium ($29.99/월)

---

## 구현 순서

### Step 1: 백엔드 — 서비스 카탈로그 모델 + 마이그레이션
**수정 파일:**
- `backend/app/models/service.py` (NEW)
- `backend/app/models/service_plan.py` (NEW)
- `backend/app/models/__init__.py` (수정)
- `backend/app/models/subscription.py` (수정 — service_id, plan_id 추가)
- Alembic 마이그레이션 생성/적용

### Step 2: 백엔드 — 시드 데이터
**수정 파일:**
- `backend/app/utils/seed_data.py` (수정 — 서비스 + 요금제 시드 추가)

### Step 3: 백엔드 — 서비스 카탈로그 API
**새 파일:**
- `backend/app/schemas/service.py` (NEW)
- `backend/app/routers/services.py` (NEW)
- `backend/app/main.py` (수정 — services 라우터 등록)

**수정 파일:**
- `backend/app/schemas/subscription.py` (수정 — service_id, plan_id 추가)
- `backend/app/services/subscription_service.py` (수정 — 서비스 기반 생성 로직)
- `backend/app/routers/subscriptions.py` (수정)

### Step 4: 프론트엔드 — 서비스 탐색 페이지
**새 파일:**
- `frontend/src/types/service.ts` (NEW)
- `frontend/src/api/services.ts` (NEW)
- `frontend/src/pages/ServicesPage.tsx` (NEW)
- `frontend/src/components/service/ServiceCard.tsx` (NEW)
- `frontend/src/components/service/ServiceDetail.tsx` (NEW)
- `frontend/src/components/service/PlanSelector.tsx` (NEW)

**수정 파일:**
- `frontend/src/App.tsx` (라우트 추가)
- `frontend/src/components/layout/Sidebar.tsx` (메뉴 추가)
- `frontend/src/pages/SubscriptionsPage.tsx` (카탈로그 연결)
- `frontend/src/components/subscription/SubscriptionCard.tsx` (서비스 정보 표시)
- `frontend/src/types/subscription.ts` (service, plan 필드 추가)

### Step 5: 사용자 플로우 연결
- 서비스 탐색 → 서비스 선택 → 요금제 선택 → 구독 등록
- 구독 관리 페이지에서 서비스 로고/정보 자동 표시
- 대시보드에 서비스 로고 반영

---

## 사용자 플로우 (변경 후)

```
[서비스 탐색] 카테고리별 브라우징, 검색
       ↓
[서비스 선택] Netflix 선택 → 상세 정보 표시
       ↓
[요금제 선택] 베이직/스탠다드/프리미엄 중 선택
       ↓
[구독 등록] 시작일, 결제일 입력 → 나머지 자동 채움
       ↓
[내 구독] 등록된 구독 목록 관리
       ↓
[대시보드/분석] 지출 분석, 갱신 알림
```

---

## 검증 방법
1. 백엔드 재시작 → 시드 데이터 자동 생성 확인
2. `http://localhost:8000/docs`에서 `/services` API 테스트
3. 프론트엔드에서 서비스 탐색 → 요금제 선택 → 구독 등록 플로우 테스트
4. 대시보드에서 등록된 구독 정보 표시 확인
