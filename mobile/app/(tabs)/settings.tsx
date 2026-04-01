import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../src/components/Card';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../../src/constants/theme';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({ icon, iconColor = Colors.primary, title, subtitle, rightElement, onPress }: SettingRowProps) {
  return (
    <TouchableOpacity style={settingRowStyles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[settingRowStyles.iconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={settingRowStyles.info}>
        <Text style={settingRowStyles.title}>{title}</Text>
        {subtitle && <Text style={settingRowStyles.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement ?? (
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const settingRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>설정</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 카드 */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={28} color={Colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>사용자</Text>
              <Text style={styles.profileEmail}>user@example.com</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* 알림 설정 */}
        <Text style={styles.sectionTitle}>알림</Text>
        <Card>
          <SettingRow
            icon="notifications"
            title="푸시 알림"
            subtitle="결제일 전 알림 받기"
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.surface}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="mail"
            iconColor="#FF9500"
            title="이메일 알림"
            subtitle="이메일로 결제 요약 받기"
            rightElement={
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.surface}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="time"
            iconColor="#5AC8FA"
            title="결제 알림 시점"
            subtitle="결제 3일 전"
          />
        </Card>

        {/* 예산 */}
        <Text style={styles.sectionTitle}>예산 관리</Text>
        <Card>
          <SettingRow
            icon="wallet"
            iconColor="#34C759"
            title="월 예산"
            subtitle="₩70,000"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="alert-circle"
            iconColor="#FF3B30"
            title="예산 초과 알림"
            subtitle="예산의 80% 도달 시 알림"
          />
        </Card>

        {/* 일반 설정 */}
        <Text style={styles.sectionTitle}>일반</Text>
        <Card>
          <SettingRow
            icon="cash"
            title="기본 통화"
            subtitle="KRW (₩)"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="swap-horizontal"
            iconColor="#FF9500"
            title="환율 알림"
            subtitle="외화 구독 환율 변동 알림"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-checkmark"
            iconColor="#5AC8FA"
            title="개인정보 처리방침"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="document-text"
            iconColor="#6B7D8E"
            title="이용약관"
          />
        </Card>

        {/* 로그아웃 */}
        <Card style={styles.logoutCard}>
          <TouchableOpacity style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.version}>SubFlow v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textWhite,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  profileCard: {
    marginBottom: Spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  logoutCard: {
    marginTop: Spacing.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});
