# SubFlow 출시 체크리스트 (도메인 → 웹 배포 → 스토어)

> 순서대로 따라가면 됩니다. 각 단계는 이전 단계가 끝나야 다음이 의미 있어요.

---

## 0단계. 지금 만들어진 것 (완료)
- [x] 개인정보처리방침 (`legal/PRIVACY.md`, `landing/privacy.html`)
- [x] 이용약관 (`legal/TERMS.md`, `landing/terms.html`)
- [x] 랜딩 페이지 (`landing/index.html`) — 로고·서비스 로고 자산 포함
- [ ] **대괄호 `[ ]` 항목 채우기** — 운영자명, 연락처 이메일, 시행일자 (배포 전 필수)

---

## 1단계. 도메인 구매
- [ ] 도메인 등록업체에서 구매 (가비아·후이즈·Cloudflare·Namecheap 등)
  - `.com` 기준 연 1~2만원. `subflow.app`은 매력적이지만 `.app`은 조금 더 비싸고 **HTTPS 강제**.
  - 후보: `subflow.kr`, `subflowapp.com`, `getsubflow.com` 등 (원하는 이름 여러 개 확보 추천)
- [ ] 구매 후 **DNS 관리**는 Cloudflare로 넘기면 편함(무료, HTTPS·CDN 자동)

---

## 2단계. 웹 배포

### 옵션 A — 랜딩 페이지만 먼저 (가장 빠름, 무료)
`landing/` 폴더는 정적 파일이라 아래 어디든 즉시 올라갑니다.
- [ ] **Cloudflare Pages / Netlify / Vercel** 중 하나에 `landing/` 폴더 연결
- [ ] 커스텀 도메인 연결 → HTTPS 자동 발급
- [ ] 결과 URL 확인: `https://도메인/`, `/privacy.html`, `/terms.html`
- [ ] **이 방침 URL이 스토어 심사에 필요**하니 꼭 접속 가능한 상태로 유지

### 옵션 B — 실제 앱(React+FastAPI)까지 배포
이미 `docker-compose.yml` + nginx 구성이 되어 있으니:
- [ ] 클라우드 서버 준비 (AWS Lightsail / Oracle Cloud 무료티어 / 가비아 클라우드 등)
- [ ] 도메인 A레코드를 서버 IP로 연결
- [ ] 서버에서 `docker-compose up -d --build`
- [ ] **HTTPS 적용**: nginx에 Let's Encrypt(certbot) 또는 Cloudflare 프록시
- [ ] 운영용 환경변수 세팅 (배포 전 아래 "보안 점검" 참고)
- [ ] 랜딩 페이지의 `TODO` 링크(`#start`, `웹으로 시작` 등)를 **실제 앱 주소로 교체**

> 추천 흐름: **랜딩(옵션 A)을 먼저 띄워 방침 URL 확보 → 이후 앱(옵션 B) 배포.**

### 배포 전 보안 점검 (운영 환경변수)
- [ ] `SECRET_KEY` — 기본값 절대 금지, 랜덤 강한 값으로
- [ ] `DATABASE_URL` DB 비밀번호 — 강한 값 (⚠️ 기존 PostgreSQL 볼륨 있으면 초기화 필요, PORTFOLIO 트러블슈팅 참고)
- [ ] `ALLOWED_ORIGINS` — 실제 도메인만 허용
- [ ] `TRUST_PROXY=true` (nginx 뒤에 둘 때)
- [ ] `DEBUG=false`
- [ ] `SMTP_*` — 실제 발송 계정 (Gmail 앱 비밀번호 or AWS SES)
- [ ] `OPENAI_API_KEY` — 뉴스 요약 쓸 경우 (선택)

---

## 3단계. 앱 스토어 출시 준비 (웹 배포 이후)

### 공통 준비물
- [ ] 개인정보처리방침 **URL** (2단계에서 확보) ← 필수
- [ ] 앱 아이콘 (이미 `app_icons/`에 iOS/Android 세트 있음 ✅)
- [ ] 스크린샷 (기기별 규격) — 실제 앱 화면 캡처
- [ ] 앱 설명 문구 (랜딩 페이지 카피 재활용 가능)
- [ ] Expo 앱을 **프로덕션 API 주소**로 빌드하도록 설정 확인

### Google Play (먼저 — 추천)
- [ ] Google Play Console 개발자 등록 (**$25, 최초 1회만**)
- [ ] `eas build -p android` 로 AAB 빌드 (Expo EAS)
- [ ] 스토어 등록정보 + 데이터 보안 설문 작성
- [ ] 내부 테스트 → 프로덕션 심사 제출

### Apple App Store (나중에)
- [ ] Apple Developer Program 등록 (**$99/년**)
- [ ] `eas build -p ios` 로 빌드
- [ ] App Store Connect 등록 + 심사 제출 (심사 까다로움 — 시간 여유 두기)

---

## 4단계. 출시 후
- [ ] 인스타그램 등 홍보 시작 (카드뉴스)
- [ ] 실사용자 피드백 수집 → 개선
- [ ] 간단한 접속 분석(예: Cloudflare Web Analytics, 무료) 붙이기

---

### 예상 비용 요약
| 항목 | 비용 | 주기 |
|------|------|------|
| 도메인 | 1~2만원 | 연 |
| 랜딩/정적 호스팅 | 0원 | (무료티어) |
| 앱 서버 | 0~1만원대 | 월 (무료티어 활용 시 0원) |
| Google Play | $25(약 3.5만원) | **1회** |
| Apple Developer | $99(약 14만원) | 연 |

> 최소 시작 비용: **도메인 + Google Play = 약 5만원 내외**로 안드로이드까지 출시 가능. Apple은 여력 될 때.
