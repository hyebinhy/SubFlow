import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
  Modal, TextInput, Pressable, Linking,
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

const CURRENCIES = [
  { code: 'KRW', symbol: '₩', label: '한국 원 (KRW)' },
  { code: 'USD', symbol: '$', label: '미국 달러 (USD)' },
  { code: 'EUR', symbol: '€', label: '유로 (EUR)' },
  { code: 'JPY', symbol: '¥', label: '일본 엔 (JPY)' },
  { code: 'GBP', symbol: '£', label: '영국 파운드 (GBP)' },
];

const DAYS_OPTIONS = [1, 2, 3, 5, 7];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const {
    language, setLanguage,
    pushEnabled, setPushEnabled,
    emailEnabled, setEmailEnabled,
    daysBefore, setDaysBefore,
    monthlyBudget, setMonthlyBudget,
    currency, setCurrency,
  } = useSettingsStore();
  const { t } = useTranslation();

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

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

  const openBudgetModal = () => {
    setBudgetInput(monthlyBudget ? monthlyBudget.toLocaleString() : '');
    setBudgetModalVisible(true);
  };

  const saveBudget = () => {
    const val = parseInt(budgetInput.replace(/[^0-9]/g, ''), 10);
    if (val > 0) {
      setMonthlyBudget(val);
      notificationAPI.updateSettings({ monthly_budget: val }).catch(() => {});
    }
    setBudgetModalVisible(false);
  };

  const handleAlertTiming = () => {
    const options = DAYS_OPTIONS.map(d =>
      language === 'ko' ? `결제 ${d}일 전` : `${d} days before`
    );
    options.push(language === 'ko' ? '취소' : 'Cancel');
    Alert.alert(
      language === 'ko' ? '결제 알림 시점' : 'Alert Timing',
      language === 'ko' ? '언제 알림을 받으시겠어요?' : 'When would you like to be notified?',
      [
        ...DAYS_OPTIONS.map(d => ({
          text: language === 'ko' ? `결제 ${d}일 전` : `${d} day${d > 1 ? 's' : ''} before`,
          onPress: () => {
            setDaysBefore(d);
            notificationAPI.updateSettings({ days_before: d }).catch(() => {});
          },
          style: d === daysBefore ? 'default' as const : 'default' as const,
        })),
        { text: language === 'ko' ? '취소' : 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleBudgetInput = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    if (!num) { setBudgetInput(''); return; }
    setBudgetInput(Number(num).toLocaleString());
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
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => Alert.alert(
                  language === 'ko' ? '프로필 편집' : 'Edit Profile',
                  language === 'ko'
                    ? `이름: ${user?.username ?? '-'}\n이메일: ${user?.email ?? '-'}`
                    : `Name: ${user?.username ?? '-'}\nEmail: ${user?.email ?? '-'}`,
                  [{ text: language === 'ko' ? '확인' : 'OK' }]
                )}
              >
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
            <SettingRow
              icon="time" iconColor="#5AC8FA"
              title={t('settings.alertTiming')}
              subtitle={t('settings.daysBefore', { n: daysBefore })}
              onPress={handleAlertTiming}
            />
          </Card>

          {/* 예산 */}
          <Text style={styles.sectionTitle}>{t('settings.budget')}</Text>
          <Card>
            <SettingRow
              icon="wallet" iconColor="#34C759"
              title={t('settings.monthlyBudget')}
              subtitle={monthlyBudget ? `₩${monthlyBudget.toLocaleString()}` : '-'}
              onPress={openBudgetModal}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="alert-circle" iconColor="#FF3B30"
              title={t('settings.budgetAlert')}
              subtitle={t('settings.budgetAlertDesc')}
              onPress={() => Alert.alert(
                language === 'ko' ? '예산 초과 알림' : 'Budget Alert',
                language === 'ko'
                  ? `월 예산의 80% 도달 시 알림이 발송됩니다.\n현재 예산: ${monthlyBudget ? `₩${monthlyBudget.toLocaleString()}` : '미설정'}`
                  : `You'll be notified when you reach 80% of your budget.\nCurrent budget: ${monthlyBudget ? `₩${monthlyBudget.toLocaleString()}` : 'Not set'}`,
                [{ text: language === 'ko' ? '확인' : 'OK' }]
              )}
            />
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
            <SettingRow
              icon="cash"
              title={t('settings.currency')}
              subtitle={`${currency} (${CURRENCIES.find(c => c.code === currency)?.symbol ?? currency})`}
              onPress={() => setCurrencyModalVisible(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="swap-horizontal" iconColor="#FF9500"
              title={t('settings.exchangeRate')}
              subtitle={t('settings.exchangeDesc')}
              onPress={() => router.push('/(tabs)/analytics')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="shield-checkmark" iconColor="#5AC8FA"
              title={t('settings.privacy')}
              onPress={() => Linking.openURL('https://subflow.app/privacy').catch(() => {})}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="document-text" iconColor="#6B7D8E"
              title={t('settings.terms')}
              onPress={() => Linking.openURL('https://subflow.app/terms').catch(() => {})}
            />
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

      {/* 예산 설정 모달 */}
      <Modal transparent animationType="fade" visible={budgetModalVisible} onRequestClose={() => setBudgetModalVisible(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setBudgetModalVisible(false)}>
          <Pressable style={modalStyles.box} onPress={() => {}}>
            <Text style={modalStyles.title}>
              {language === 'ko' ? '월 예산 설정' : 'Set Monthly Budget'}
            </Text>
            <Text style={modalStyles.subtitle}>
              {language === 'ko' ? '월 구독 지출 목표 금액을 입력하세요' : 'Enter your monthly subscription spending goal'}
            </Text>
            <View style={modalStyles.inputRow}>
              <Text style={modalStyles.currencySymbol}>₩</Text>
              <TextInput
                style={modalStyles.input}
                value={budgetInput}
                onChangeText={handleBudgetInput}
                keyboardType="numeric"
                placeholder="100,000"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
              />
            </View>
            <View style={modalStyles.btnRow}>
              <TouchableOpacity style={[modalStyles.btn, modalStyles.btnCancel]} onPress={() => setBudgetModalVisible(false)}>
                <Text style={modalStyles.btnCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.btn, modalStyles.btnSave]} onPress={saveBudget}>
                <Text style={modalStyles.btnSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 통화 선택 모달 */}
      <Modal transparent animationType="slide" visible={currencyModalVisible} onRequestClose={() => setCurrencyModalVisible(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setCurrencyModalVisible(false)}>
          <Pressable style={[modalStyles.box, { paddingBottom: Spacing.lg }]} onPress={() => {}}>
            <Text style={modalStyles.title}>
              {language === 'ko' ? '기본 통화 선택' : 'Select Default Currency'}
            </Text>
            {CURRENCIES.map((cur) => (
              <TouchableOpacity
                key={cur.code}
                style={[modalStyles.currencyRow, currency === cur.code && modalStyles.currencyRowActive]}
                onPress={() => { setCurrency(cur.code); setCurrencyModalVisible(false); }}
              >
                <Text style={[modalStyles.currencySymbolItem, currency === cur.code && { color: Colors.primary }]}>
                  {cur.symbol}
                </Text>
                <Text style={[modalStyles.currencyLabel, currency === cur.code && { color: Colors.primary, fontWeight: FontWeight.bold }]}>
                  {cur.label}
                </Text>
                {currency === cur.code && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '85%',
  },
  title: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm, color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  currencySymbol: {
    fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.primary, marginRight: Spacing.sm,
  },
  input: {
    flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, paddingVertical: Spacing.md,
  },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  btnCancel: { backgroundColor: Colors.borderLight },
  btnSave: { backgroundColor: Colors.primary },
  btnCancelText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  btnSaveText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textWhite },
  currencyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md, marginBottom: Spacing.xs,
  },
  currencyRowActive: { backgroundColor: Colors.primaryLight },
  currencySymbolItem: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    color: Colors.textTertiary, width: 32,
  },
  currencyLabel: {
    flex: 1, fontSize: FontSize.md,
    color: Colors.textPrimary, marginLeft: Spacing.sm,
  },
});
