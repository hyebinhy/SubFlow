import React, { useState } from 'react';
import {
  Pressable, View, Text, StyleSheet, ActivityIndicator, ViewStyle, StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors, FontSize, FontWeight, Spacing } from '../constants/theme';

export type GradientVariant = 'primary' | 'warning' | 'danger' | 'success' | 'neutral' | 'glass';
export type GradientSize = 'md' | 'lg';

// 모든 솔리드 변형은 alpha 0.78~0.82로 살짝 투명하게 — 배경이 비치는 부드러운 톤
const VARIANTS: Record<GradientVariant, { colors: readonly [string, ...string[]]; shadow: string }> = {
  primary: { colors: ['rgba(123,123,255,0.78)', 'rgba(74,144,217,0.78)', 'rgba(88,86,214,0.82)'] as const, shadow: Colors.primary },
  warning: { colors: ['rgba(255,179,71,0.78)', 'rgba(255,138,0,0.82)'] as const, shadow: '#FF8A00' },
  danger:  { colors: ['rgba(255,123,123,0.78)', 'rgba(224,49,49,0.82)'] as const, shadow: '#E03131' },
  success: { colors: ['rgba(74,222,128,0.78)', 'rgba(5,150,105,0.82)'] as const, shadow: '#059669' },
  neutral: { colors: ['rgba(156,163,175,0.78)', 'rgba(75,85,99,0.82)'] as const, shadow: '#4B5563' },
  glass:   { colors: ['rgba(255,255,255,0.9)', 'rgba(235,243,255,0.7)', 'rgba(214,232,247,0.55)'] as const, shadow: Colors.primary },
};

interface Props {
  label: string;
  icon?: string;
  variant?: GradientVariant;
  size?: GradientSize;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

function ButtonIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const common = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  const normalized = name.replace(/-outline$/, '');

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {normalized === 'log-in' && (
        <>
          <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" {...common} />
          <Path d="M10 17l5-5-5-5" {...common} />
          <Path d="M15 12H3" {...common} />
        </>
      )}
      {normalized === 'open' && (
        <>
          <Path d="M14 3h7v7" {...common} />
          <Path d="M21 3l-9 9" {...common} />
          <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" {...common} />
        </>
      )}
      {normalized === 'trash' && (
        <>
          <Path d="M3 6h18" {...common} />
          <Path d="M8 6V4h8v2" {...common} />
          <Path d="M19 6l-1 15H6L5 6" {...common} />
          <Path d="M10 11v6" {...common} />
          <Path d="M14 11v6" {...common} />
        </>
      )}
      {normalized === 'checkmark' && <Path d="M20 6L9 17l-5-5" {...common} />}
      {normalized === 'add-circle' && (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M12 8v8" {...common} />
          <Path d="M8 12h8" {...common} />
        </>
      )}
      {normalized === 'flash' && <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" {...common} />}
      {normalized === 'list' && (
        <>
          <Path d="M8 6h13" {...common} />
          <Path d="M8 12h13" {...common} />
          <Path d="M8 18h13" {...common} />
          <Path d="M3 6h.01" {...common} />
          <Path d="M3 12h.01" {...common} />
          <Path d="M3 18h.01" {...common} />
        </>
      )}
      {normalized === 'person-add' && (
        <>
          <Path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...common} />
          <Path d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" {...common} />
          <Path d="M19 8v6" {...common} />
          <Path d="M16 11h6" {...common} />
        </>
      )}
      {!['log-in', 'open', 'trash', 'checkmark', 'add-circle', 'flash', 'list', 'person-add'].includes(normalized) && (
        <Path d="M20 6L9 17l-5-5" {...common} />
      )}
    </Svg>
  );
}

export function GradientButton({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
}: Props) {
  const v = VARIANTS[variant];
  const isLg = size === 'lg';
  const isGlass = variant === 'glass';
  const radius = isLg ? 22 : 18;
  // 모든 버튼 높이 동일하게 통일
  const height = 48;
  const iconCircleSize = isLg ? 24 : 22;
  const innerIconSize = isLg ? 14 : 13;
  // 모든 버튼 동일한 글꼴: 작고 통일된 사이즈
  const fontSize = 13;
  const letterSpacing = 0;
  const isInactive = disabled || loading;
  // glass 변형은 텍스트/아이콘이 어두운 색으로
  const textColor = isGlass ? Colors.primary : '#FFF';
  const iconCircleBg = isGlass ? 'rgba(74,144,217,0.18)' : 'rgba(255,255,255,0.25)';
  // 누를 때 진해지는 오버레이 색 (glass는 primary 틴트, 솔리드는 검정)
  const pressOverlayColor = isGlass ? 'rgba(74,144,217,0.18)' : 'rgba(0,0,0,0.22)';

  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      disabled={isInactive}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          height,
          borderRadius: radius,
          shadowColor: v.shadow,
          // 중간 톤 그림자: 입체감은 충분히, 인접 UI 침범은 최소화
          shadowOpacity: isInactive ? 0 : (pressed ? 0.15 : (isGlass ? 0.14 : 0.3)),
          shadowRadius: isGlass ? 10 : (isLg ? 14 : 12),
          shadowOffset: { width: 0, height: pressed ? 2 : (isGlass ? 3 : (isLg ? 6 : 5)) },
          elevation: isInactive ? 0 : (pressed ? 2 : (isGlass ? 3 : (isLg ? 6 : 5))),
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <LinearGradient
        colors={v.colors as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { borderRadius: radius, flex: 1 },
          isGlass && {
            borderWidth: 1.2,
            borderColor: 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        {/* 프레스 시 어두워지는 오버레이 */}
        {pressed && !isInactive && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: pressOverlayColor, borderRadius: radius },
            ]}
          />
        )}
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && (
              <View
                style={[
                  styles.iconCircle,
                  {
                    width: iconCircleSize,
                    height: iconCircleSize,
                    borderRadius: iconCircleSize / 2,
                    backgroundColor: iconCircleBg,
                  },
                ]}
              >
                <ButtonIcon name={icon} size={innerIconSize} color={textColor} />
              </View>
            )}
            <Text style={[styles.label, { fontSize, letterSpacing, color: textColor }]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: FontWeight.semibold,
  },
});
