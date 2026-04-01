import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';

interface HeaderProps {
  title?: string;
  showNotification?: boolean;
  showSettings?: boolean;
  showAvatar?: boolean;
}

export function Header({ title = 'SubFlow', showNotification = true, showSettings = true, showAvatar = true }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Ionicons name="water-outline" size={22} color={Colors.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>
        {showNotification && (
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        {showSettings && (
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        {showAvatar && (
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={Colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
