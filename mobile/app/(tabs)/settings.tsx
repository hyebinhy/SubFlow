import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Card } from '../../src/components/Card';
import { notificationAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useTranslation } from '../../src/hooks/useTranslation';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';

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
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[rowStyles.iconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.title}>{title}</Text>
        {subtitle && <Text style={rowStyles.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement ?? <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: Spacing.md },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
});

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { language, setLanguage, pushEnabled, setPushEnabled, emailEnabled, setEmailEnabled, daysBefore, monthlyBudget } = useSettingsStore();
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ko' : 'en');
  };

  const syncPush = (v: boolean) => {
    setPushEnabled(v);
    notificationAPI.updateSettings({ push_enabled: v }).catch(() => {});
  };
  const syncEmail = (v: boolean) => {
    setEmailEnabled(v);
    notificationAPI.updateSettings({ email_enabled: v }).catch(() => {});
  };

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>{t('settings.title')}</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 프로필 */}
          <Card variant="elevated" style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={28} color={Colors.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.username ?? 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email ?? 'user@example.com'}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* 알림 */}
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <Card>
            <SettingRow
              icon="notifications"
              title={t('settings.pushNotif')}
              subtitle={t('settings.pushDesc')}
              rightElement={
                <Switch value={pushEnabled} onValueChange={syncPush}
                  trackColor={{ true: Colors.primary, false: Colors.border }} thumbColor={Colors.surface} />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon="mail" iconColor="#FF9500"
              title={t('settings.emailNotif')}
              subtitle={t('settings.emailDesc')}
              rightElement={
                <Switch value={emailEnabled} onValueChange={syncEmail}
                  trackColor={{ true: Colors.primary, false: Colors.border }} thumbColor={Colors.surface} />
              }
            />
            <View style={styles.divider} />
            <SettingRow icon="time" iconColor="#5AC8FA" title={t('settings.alertTiming')} subtitle={t('settings.daysBefore', { n: daysBefore })} />
          </Card>

          {/* 예산 */}
          <Text style={styles.sectionTitle}>{t('settings.budget')}</Text>
          <Card>
            <SettingRow icon="wallet" iconColor="#34C759" title={t('settings.monthlyBudget')}
              subtitle={monthlyBudget ? `₩${monthlyBudget.toLocaleString()}` : '-'} />
            <View style={styles.divider} />
            <SettingRow icon="alert-circle" iconColor="#FF3B30" title={t('settings.budgetAlert')} subtitle={t('settings.budgetAlertDesc')} />
          </Card>

          {/* 일반 */}
          <Text style={styles.sectionTitle}>{t('settings.general')}</Text>
          <Card>
            <SettingRow
              icon="language" iconColor="#5856D6"
              title={t('settings.language')}
              subtitle={t('settings.languageValue')}
              onPress={handleLanguageToggle}
              rightElement={
                <View style={styles.langToggle}>
                  <Text style={[styles.langOption, language === 'en' && styles.langActive]}>EN</Text>
                  <Text style={styles.langSep}>|</Text>
                  <Text style={[styles.langOption, language === 'ko' && styles.langActive]}>KR</Text>
                </View>
              }
            />
            <View style={styles.divider} />
            <SettingRow icon="cash" title={t('settings.currency')} subtitle="KRW (₩)" />
            <View style={styles.divider} />
            <SettingRow icon="swap-horizontal" iconColor="#FF9500" title={t('settings.exchangeRate')} subtitle={t('settings.exchangeDesc')} />
            <View style={styles.divider} />
            <SettingRow icon="shield-checkmark" iconColor="#5AC8FA" title={t('settings.privacy')} />
            <View style={styles.divider} />
            <SettingRow icon="document-text" iconColor="#6B7D8E" title={t('settings.terms')} />
          </Card>

          {/* 로그아웃 */}
          <Card style={styles.logoutCard}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={styles.logoutText}>{t('settings.logout')}</Text>
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
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.textWhite },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  profileCard: { marginBottom: Spacing.sm },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: Spacing.lg },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.borderLight },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  langOption: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textTertiary },
  langActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  langSep: { color: Colors.borderLight },
  logoutCard: { marginTop: Spacing.sm },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.danger },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: Spacing.sm },
});
