import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '../constants/theme';

interface BadgeProps {
  label: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const colorMap = {
  primary: { bg: Colors.primaryLight, text: Colors.primary },
  success: { bg: '#E8F8ED', text: Colors.success },
  warning: { bg: '#FFF3E0', text: Colors.warning },
  danger: { bg: '#FFEBEE', text: Colors.danger },
  info: { bg: '#E3F6FC', text: Colors.info },
};

export function Badge({ label, color = 'primary' }: BadgeProps) {
  const scheme = colorMap[color];
  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg }]}>
      <Text style={[styles.text, { color: scheme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
