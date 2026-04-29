import React, { useState } from 'react';
import {
  Pressable, View, Text, StyleSheet, ActivityIndicator, ViewStyle, StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing } from '../constants/theme';

export type GradientVariant = 'primary' | 'warning' | 'danger' | 'success' | 'neutral' | 'glass';
export type GradientSize = 'md' | 'lg';

const VARIANTS: Record<GradientVariant, { colors: readonly [string, ...string[]]; shadow: string }> = {
  primary: { colors: ['#7B7BFF', Colors.primary, '#5856D6'] as const, shadow: Colors.primary },
  warning: { colors: ['#FFB347', '#FF8A00'] as const, shadow: '#FF8A00' },
  danger:  { colors: ['#FF7B7B', '#E03131'] as const, shadow: '#E03131' },
  success: { colors: ['#4ADE80', '#059669'] as const, shadow: '#059669' },
  neutral: { colors: ['#9CA3AF', '#4B5563'] as const, shadow: '#4B5563' },
  glass:   { colors: ['rgba(255,255,255,0.9)', 'rgba(235,243,255,0.7)', 'rgba(214,232,247,0.55)'] as const, shadow: Colors.primary },
};

interface Props {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: GradientVariant;
  size?: GradientSize;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
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
  const height = isLg ? 52 : 44;
  const iconCircleSize = isLg ? 24 : 22;
  const innerIconSize = isLg ? 14 : 13;
  // 모든 버튼 동일한 글꼴: 작고 통일된 사이즈
  const fontSize = 13;
  const letterSpacing = 0.3;
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
          borderRadius: radius,
          shadowColor: v.shadow,
          shadowOpacity: isInactive ? 0 : (pressed ? (isGlass ? 0.08 : 0.2) : (isGlass ? 0.18 : (isLg ? 0.45 : 0.35))),
          shadowRadius: isGlass ? 14 : (isLg ? 18 : 12),
          shadowOffset: { width: 0, height: pressed ? 2 : (isGlass ? 4 : (isLg ? 10 : 6)) },
          elevation: isInactive ? 0 : (pressed ? 2 : (isGlass ? 3 : (isLg ? 10 : 6))),
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
          { borderRadius: radius, height },
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
                <Ionicons name={icon} size={innerIconSize} color={textColor} />
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
    fontWeight: FontWeight.heavy,
  },
});
