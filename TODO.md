# SubFlow TODO

## 보안/인프라
- [x] SECRET_KEY 환경변수로 분리 (.env + 기본값 사용 시 기동 경고, .env.example 문서화)
- [x] 회원가입 비밀번호 강도 검증 (최소 8자 + 영문 + 숫자)
- [x] 로그인 Rate limiting (slowapi: 로그인 10/분, 회원가입 5/분)
- [x] 로그인 실패 응답 401 통일 + 타이밍 완화 (사용자 열거 방지)
- [x] 리버스 프록시 X-Forwarded-For 설정 (TRUST_PROXY, 기본 off로 스푸핑 방지)
- [x] 운영 배포 구성 (웹 nginx 컨테이너 + CORS/DB 비번 환경변수화)

## 기능 추가
- [x] 실제 알림 발송 — 이메일(SMTP/aiosmtplib) + Expo 푸시, 10분 주기 deliver_pending 스케줄러
- [x] 뉴스 AI 요약 (뉴스 캐시 6시간 갱신 + 요약 모달)
- [x] 주간 다이제스트 발송 (매주 월요일 스케줄러)
- [x] 구독 자동 갱신 스케줄러 — 매일 지난 결제일 구독을 주기만큼 자동 전진 (renewal_service, 말일 보정)
- [x] 결제 내역 자동 기록 로직 — 자동 갱신 시 경과 주기마다 PaymentHistory 기록
- [ ] 소셜 로그인 (Google/Kakao) — 보류 (Google/Kakao 개발자 앱 자격증명 필요)
- [x] 공유/가족 구독 비용 분담 기능 — member_count 분담 인원, 대시보드/분석에 1인당 몫 반영, 폼·카드 표시
- [x] 구독 목록 CSV/엑셀 내보내기 — /subscriptions/export (UTF-8 BOM, Excel 호환) + 구독 페이지 내보내기 버튼

## UX/프론트엔드
- [x] 다크모드 토글 (Header: localStorage + prefers-color-scheme + dark 클래스)
- [x] 구독/서비스 텍스트 검색 (ServicesPage 카탈로그 검색)
- [x] 브랜드 로고 + 앱 아이콘 세트 (iOS/Android 전 크기)
- [x] 랜딩 페이지 + 법률(약관/개인정보) 페이지
- [x] 모바일 앱 화면 구현 (RN/Expo — 캘린더·분석·구독 관리 등)
- [x] 첫 가입 온보딩 플로우 — 첫 방문 시 4단계 환영 모달(대시보드), localStorage로 1회 노출

## 데이터/분석
- [x] 구독 서비스 가격 변동 알림 (대시보드에서 인상/인하 알림)
- [x] 환율 API fallback 추가 (Frankfurter 장애 시 _FALLBACK_RATES 사용)
- [x] 분석 기간 커스텀 선택 — 분석 화면에 3/6/12/24개월 토글 (백엔드 months 파라미터 연동)
