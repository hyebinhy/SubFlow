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

  // Status
  success: '#93E2B6',      // Lighter, mintier green like reference
  warning: '#FFC75F',
  danger: '#FF6B6B',
  info: '#5AC8FA',

  // Accent
  accent: '#7AA3D4',      // Soft blue accent
  accentLight: '#E8F1FA',

  // Border & Shadow
  border: '#E8EFF5',
  borderLight: '#F2F6F9',
  shadow: 'rgba(55, 75, 92, 0.05)',
  shadowDark: 'rgba(26, 43, 60, 0.1)',

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

export const Shadow = {
  sm: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  md: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  lg: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 12,
  },
};
