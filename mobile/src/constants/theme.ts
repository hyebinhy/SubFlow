export const Colors = {
  // Primary
  primary: '#4A90D9',
  primaryLight: '#D6E6F2',
  primaryBg: '#BBDCF3',    // Light blue gradient start like reference
  primarySoft: '#D6E8F7',  // Light blue gradient end
  
  // Background
  background: '#C7E0F5',   // More solid light blue like reference
  surface: '#FFFFFF',
  surfaceLight: '#F8FBFD',

  // Text
  textPrimary: '#374B5C',   // Dark but slightly blueish
  textSecondary: '#6B7D8E',
  textTertiary: '#A2B4C5',
  textWhite: '#FFFFFF',

  // Status — OKLCH 등명도 팔레트 (L≈0.70 고정: 색을 바꿔도 밝기가 일정)
  success: '#53BE70',
  warning: '#EEB154',
  danger: '#E8605B',
  info: '#09B7DC',

  // Status — 연한 배경 tint (L≈0.955) / 위에 얹는 진한 텍스트 (L≈0.48)
  successSoft: '#E0F7E4', successText: '#067132',
  warningSoft: '#FEEDD7', warningText: '#874F00',
  dangerSoft: '#FFE8E4',  dangerText: '#9A3936',
  infoSoft: '#D7F6FF',    infoText: '#006C90',
  primarySoftBg: '#DFF3FF', primaryText: '#0C60A3',

  // Accent
  accent: '#8A81EF',      // 등명도 보라 accent
  accentSoft: '#EDEDFF',
  accentText: '#584FA3',
  accentLight: '#E8F1FA',

  // Border & Shadow — 컬러 섀도우(primary 틴트) 기반, 저채도 검정은 최소화
  border: '#E8EFF5',
  borderLight: '#F2F6F9',
  shadow: 'rgba(55, 75, 92, 0.05)',
  shadowDark: 'rgba(26, 43, 60, 0.1)',
  shadowTint: '#3275B4',   // primary 계열 컬러 섀도우 색

  // Tab bar (Light, floating, glassmorphic)
  tabBarBg: 'rgba(255, 255, 255, 0.65)',
  tabBarActive: '#374B5C',    // Active icon color (dark)
  tabBarInactive: '#9FB3C3',  // Inactive icon color (light gray/blue)

  // Card
  cardBg: '#FFFFFF',
  cardBorder: '#F0F4F8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,     // New rounder cards
  xxxxl: 40,    // Very round cards
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 32,
  hero: 38,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// 컬러 섀도우: 검정 대신 primary 틴트를 낮은 불투명도로 → 카드가 가볍고 세련되게 뜬다
// (초보=검정 그림자 / 고수=색깔 그림자 원칙)
export const Shadow = {
  sm: {
    shadowColor: Colors.shadowTint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.shadowTint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.shadowTint,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 10,
  },
};

// 특정 색상으로 물든 컬러 섀도우가 필요할 때 (예: 상태 카드, 강조 버튼)
export function coloredShadow(color: string, level: 'sm' | 'md' | 'lg' = 'md') {
  return { ...Shadow[level], shadowColor: color };
}
