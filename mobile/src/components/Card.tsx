import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadow } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, variants[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
});

const variants: Record<string, ViewStyle> = {
  default: {
    ...Shadow.sm,
  },
  elevated: {
    ...Shadow.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
};
