export type Language = 'en' | 'ko';

const translations = {
  // ── Common ──
  'app.name': { en: 'SubFlow', ko: 'SubFlow' },
  'common.active': { en: 'Active', ko: '활성' },
  'common.paused': { en: 'Paused', ko: '일시정지' },
  'common.cancelled': { en: 'Cancelled', ko: '해지' },
  'common.all': { en: 'All', ko: '전체' },
  'common.seeAll': { en: 'See All', ko: '전체보기' },
  'common.monthly': { en: 'monthly', ko: '월간' },
  'common.yearly': { en: 'yearly', ko: '연간' },
  'common.search': { en: 'Search', ko: '검색' },
  'common.close': { en: 'Close', ko: '닫기' },
  'common.save': { en: 'Save', ko: '저장' },
  'common.cancel': { en: 'Cancel', ko: '취소' },
  'common.loading': { en: 'Loading...', ko: '로딩 중...' },
  'common.error': { en: 'An error occurred', ko: '오류가 발생했습니다' },
  'common.retry': { en: 'Retry', ko: '재시도' },
  'common.noData': { en: 'No data available', ko: '데이터가 없습니다' },

  // ── Auth ──
  'auth.login': { en: 'Login', ko: '로그인' },
  'auth.register': { en: 'Sign Up', ko: '회원가입' },
  'auth.email': { en: 'Email', ko: '이메일' },
  'auth.password': { en: 'Password', ko: '비밀번호' },
  'auth.confirmPassword': { en: 'Confirm Password', ko: '비밀번호 확인' },
  'auth.username': { en: 'Username', ko: '사용자 이름' },
  'auth.forgotPassword': { en: 'Forgot your password?', ko: '비밀번호를 잊으셨나요?' },
  'auth.noAccount': { en: "Don't have an account?", ko: '계정이 없으신가요?' },
  'auth.hasAccount': { en: 'Already have an account?', ko: '이미 계정이 있으신가요?' },
  'auth.tagline': { en: 'Smart subscription management,\nsmarter spending habits', ko: '스마트한 구독 관리,\n현명한 지출 습관' },
  'auth.joinTagline': { en: 'Manage your subscriptions with SubFlow', ko: 'SubFlow와 함께 구독을 관리하세요' },
  'auth.loginFailed': { en: 'Login failed. Check your credentials.', ko: '로그인 실패. 이메일과 비밀번호를 확인하세요.' },
  'auth.registerFailed': { en: 'Registration failed. Try again.', ko: '회원가입 실패. 다시 시도해주세요.' },

  // ── Home ──
  'home.subtitle': { en: 'Subscription Dashboard', ko: '구독 관리 대시보드' },
  'home.title': { en: 'My Subscriptions', ko: '내 구독 현황' },
  'home.budget': { en: 'Budget', ko: '월 예산' },
  'home.status': { en: 'Status', ko: '상태' },
  'home.statusActive': { en: 'Active', ko: '관리중' },
  'home.monthlyPrice': { en: 'Monthly Price', ko: '월 구독료' },
  'home.spendingAnalysis': { en: 'Spending Analysis', ko: '지출 분석' },
  'home.subscribedFor': { en: 'Subscribed for', ko: '구독 기간' },
  'home.ofMonthlyCost': { en: 'of Monthly Cost', ko: '월 비용 비중' },
  'home.paymentHistory': { en: 'Payment History', ko: '결제 이력' },
  'home.billingSchedule': { en: 'Billing Schedule', ko: '결제 일정' },
  'home.priceIncrease': { en: 'Price increase expected next month', ko: '다음 달 가격 인상 예정' },

  // ── Subscriptions ──
  'subs.subtitle': { en: 'Subscription Management', ko: '구독 관리' },
  'subs.title': { en: 'My Subscriptions', ko: '내 구독' },
  'subs.monthlyCost': { en: 'Active Monthly Cost', ko: '활성 구독 월 비용' },
  'subs.activeCount': { en: '{n} active', ko: '{n}개 활성' },
  'subs.nextPayment': { en: 'Next Payment', ko: '다음 결제' },
  'subs.monthlyCostLabel': { en: 'Monthly', ko: '월 비용' },

  // ── Catalog ──
  'catalog.subtitle': { en: 'Service Catalog', ko: '서비스 카탈로그' },
  'catalog.title': { en: 'Explore Hub', ko: '서비스 탐색' },
  'catalog.searchPlaceholder': { en: 'Find your subscriptions...', ko: '구독 서비스 검색...' },
  'catalog.allServices': { en: 'All Services', ko: '전체 서비스' },
  'catalog.services': { en: 'services', ko: '개' },
  'catalog.noResults': { en: 'No results found', ko: '검색 결과가 없습니다' },
  'catalog.priceRange': { en: 'Price Range', ko: '가격 범위' },
  'catalog.availablePlans': { en: 'Available Plans', ko: '이용 가능한 요금제' },
  'catalog.visitWebsite': { en: 'Visit Website', ko: '공식 사이트 방문' },
  'catalog.addSubscription': { en: 'Add Subscription', ko: '구독 추가' },

  // ── Analytics ──
  'analytics.title': { en: 'Spending Analysis', ko: '지출 분석' },
  'analytics.monthly': { en: 'Monthly', ko: '월간' },
  'analytics.yearly': { en: 'Yearly (est.)', ko: '연간 (추정)' },
  'analytics.byCategory': { en: 'By Category', ko: '카테고리별 지출' },
  'analytics.monthlyTrend': { en: 'Monthly Trend', ko: '월별 추이' },
  'analytics.savingInsight': { en: 'Saving Insight', ko: '절약 인사이트' },

  // ── Calendar ──
  'calendar.title': { en: 'Payment Calendar', ko: '결제 캘린더' },
  'calendar.thisMonth': { en: 'Payments this month', ko: '이번 달 결제 예정' },
  'calendar.upcoming': { en: 'Upcoming Payments', ko: '예정된 결제' },

  // ── Settings ──
  'settings.title': { en: 'Settings', ko: '설정' },
  'settings.profile': { en: 'Profile', ko: '프로필' },
  'settings.notifications': { en: 'Notifications', ko: '알림' },
  'settings.pushNotif': { en: 'Push Notifications', ko: '푸시 알림' },
  'settings.pushDesc': { en: 'Get alerts before payments', ko: '결제일 전 알림 받기' },
  'settings.emailNotif': { en: 'Email Notifications', ko: '이메일 알림' },
  'settings.emailDesc': { en: 'Receive payment summaries', ko: '이메일로 결제 요약 받기' },
  'settings.alertTiming': { en: 'Alert Timing', ko: '결제 알림 시점' },
  'settings.daysBefore': { en: '{n} days before', ko: '결제 {n}일 전' },
  'settings.budget': { en: 'Budget Management', ko: '예산 관리' },
  'settings.monthlyBudget': { en: 'Monthly Budget', ko: '월 예산' },
  'settings.budgetAlert': { en: 'Budget Alert', ko: '예산 초과 알림' },
  'settings.budgetAlertDesc': { en: 'Alert at 80% of budget', ko: '예산의 80% 도달 시 알림' },
  'settings.general': { en: 'General', ko: '일반' },
  'settings.language': { en: 'Language', ko: '언어' },
  'settings.languageValue': { en: 'English', ko: '한국어' },
  'settings.currency': { en: 'Default Currency', ko: '기본 통화' },
  'settings.exchangeRate': { en: 'Exchange Rate Alert', ko: '환율 알림' },
  'settings.exchangeDesc': { en: 'Foreign subscription alerts', ko: '외화 구독 환율 변동 알림' },
  'settings.privacy': { en: 'Privacy Policy', ko: '개인정보 처리방침' },
  'settings.terms': { en: 'Terms of Service', ko: '이용약관' },
  'settings.logout': { en: 'Logout', ko: '로그아웃' },

  // ── Categories ──
  'category.Entertainment': { en: 'Entertainment', ko: '엔터테인먼트' },
  'category.Music': { en: 'Music', ko: '음악' },
  'category.Developer Tools': { en: 'Developer Tools', ko: '개발 도구' },
  'category.Cloud/Infrastructure': { en: 'Cloud/Infrastructure', ko: '클라우드/인프라' },
  'category.Productivity': { en: 'Productivity', ko: '생산성' },
  'category.Education': { en: 'Education', ko: '교육' },
  'category.Gaming': { en: 'Gaming', ko: '게임' },
  'category.Health & Fitness': { en: 'Health & Fitness', ko: '건강/피트니스' },
  'category.News & Media': { en: 'News & Media', ko: '뉴스/미디어' },
  'category.Storage': { en: 'Storage', ko: '저장소' },
  'category.Security & VPN': { en: 'Security & VPN', ko: '보안/VPN' },
  'category.Lifestyle': { en: 'Lifestyle', ko: '라이프스타일' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language, params?: Record<string, string | number>): string {
  const entry = translations[key];
  let text: string = entry?.[lang] ?? entry?.['en'] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }

  return text;
}

export default translations;
