import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useAnalyticsOverview, useCategoryBreakdown, useSpendingTrend, useSavingsSuggestions, useBudgetStatus, useOverlaps } from '../../src/hooks/useApi';
import { ServiceLogo } from '../../src/components/ServiceLogo';
import { GradientButton } from '../../src/components/GradientButton';
import { subscriptionAPI } from '../../src/services/api';
import { Colors, Spacing, FontSize, FontWeight, Shadow } from '../../src/constants/theme';

// ── 월별 추이 바 차트 (디자인 유지) ──
function TrendBarChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <View style={chartStyles.container}>
      {data.map((bar, i) => {
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={chartStyles.barWrap}>
            <View
              style={[
                chartStyles.bar,
                {
                  height: (bar.amount / max) * 100,
                  backgroundColor: isLast ? Colors.success : '#AEEA00',
                  opacity: isLast ? 1 : 0.6,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-end', height: 120,
    marginTop: Spacing.xl, paddingHorizontal: Spacing.sm,
  },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 3, borderRadius: 2 },
});

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const overview = useAnalyticsOverview();
  const categories = useCategoryBreakdown();
  const trend = useSpendingTrend();
  const savings = useSavingsSuggestions();
  const budget = useBudgetStatus();
  const overlaps = useOverlaps();

  const isLoading = overview.loading;
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [confirmSub, setConfirmSub] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const toastAnim = React.useRef(new Animated.Value(0)).current;

  // 토스트 자동 닫힘
  useEffect(() => {
    if (!toast) return;
    Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setToast(null);
      });
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refreshAfterApply = async () => {
    await Promise.all([savings.refetch(), overview.refetch(), categories.refetch(), budget.refetch()]);
  };

  const handleApplySuggestion = (s: any) => {
    if (!s.subscription_id || !s.action_type) {
      setToast({ type: 'info', text: '이 제안은 자동 적용할 수 없어요.' });
      return;
    }
    setConfirmSub(s);
  };

  const cancelConfirm = () => setConfirmSub(null);

  const runApply = async () => {
    const s = confirmSub;
    if (!s) return;

    // 외부 페이지는 사용자 클릭 직후 동기적으로 열어야 웹 팝업 차단을 피할 수 있음
    if (s.action_url) {
      try { Linking.openURL(s.action_url); } catch { /* ignore */ }
    }

    setConfirmSub(null);
    setApplyingId(s.subscription_id);

    try {
      await subscriptionAPI.applySuggestion(s.subscription_id, {
        action_type: s.action_type,
        target_plan_id: s.target_plan_id,
      });
      await refreshAfterApply();
      const cheapest = s.cheaper_plans?.[0];
      const targetText = cheapest ? cheapest.plan_name : '추천 플랜';
      setToast({ type: 'success', text: `${s.service_name} → ${targetText} 으로 갱신됨` });
    } catch (e: any) {
      setToast({ type: 'error', text: e?.response?.data?.detail ?? e?.message ?? '적용에 실패했어요.' });
    } finally {
      setApplyingId(null);
    }
  };

  // API 데이터 없으면 mock fallback
  const MOCK_OVERVIEW = {
    total_monthly_krw: 72700, total_yearly_krw: 872400,
    active_count: 5, paused_count: 1, trial_count: 0,
  };
  const MOCK_CATEGORIES = [
    { category_name: 'Entertainment', total_krw: 31900, percentage: 43.9, color: '#E50914' },
    { category_name: 'Music', total_krw: 10900, percentage: 15.0, color: '#1DB954' },
    { category_name: 'Developer Tools', total_krw: 26000, percentage: 35.8, color: '#10A37F' },
    { category_name: 'Cloud', total_krw: 3900, percentage: 5.4, color: '#3693F5' },
  ];
  const MOCK_TREND = [
    { month: 'Nov', amount: 62000 }, { month: 'Dec', amount: 58000 },
    { month: 'Jan', amount: 61000 }, { month: 'Feb', amount: 57900 },
    { month: 'Mar', amount: 72700 }, { month: 'Apr', amount: 72700 },
  ];
  const MOCK_SAVINGS = [
    {
      service_name: 'Netflix',
      current_plan_name: '프리미엄',
      suggestion_text: '스탠다드 플랜으로 변경 시 월 ₩3,500 절약 가능',
      max_savings_krw: 3500,
    },
    {
      service_name: 'ChatGPT Plus',
      current_plan_name: 'Plus',
      suggestion_text: '연간 결제로 전환 시 약 20% 할인',
      max_savings_krw: 5200,
    },
  ];
  const MOCK_OVERLAPS = [
    { category: 'Entertainment', services: ['Netflix', 'YouTube Premium'], message: 'Netflix와 YouTube Premium이 엔터테인먼트 카테고리에서 중복됩니다' },
    { category: 'Developer Tools', services: ['GitHub Copilot', 'ChatGPT Plus'], message: 'GitHub Copilot과 ChatGPT Plus가 AI 코딩 기능이 겹칩니다' },
  ];

  const ov = (overview.data as any) ?? (overview.error ? MOCK_OVERVIEW : null);
  const cats = ((categories.data as any)?.categories ?? []).length > 0
    ? (categories.data as any).categories : (categories.error ? MOCK_CATEGORIES : []);
  const trendData = ((trend.data as any)?.months ?? []).length > 0
    ? (trend.data as any).months : (trend.error ? MOCK_TREND : []);
  const savingsList = ((savings.data as any)?.suggestions ?? []).length > 0
    ? (savings.data as any).suggestions : (savings.error ? MOCK_SAVINGS : []);
  const overlapsList = ((overlaps.data as any)?.overlaps ?? []).length > 0
    ? (overlaps.data as any).overlaps : (overlaps.error ? MOCK_OVERLAPS : []);

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMark}>
              <Ionicons name="contract" size={20} color={Colors.textWhite} />
            </View>
            <Text style={styles.headerTitle}>SubFlow</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/settings')}>
              <Ionicons name="notifications-outline" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/settings')}>
              <Ionicons name="settings-outline" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={{ paddingTop: 100, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {/* ── 지출 현황 카드 (기존 On-Time 위치) ── */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Ionicons name="pie-chart" size={20} color={Colors.textPrimary} />
                    <Text style={styles.cardTitle}>{t('analytics.title')}</Text>
                  </View>
                  <View style={styles.roundArrowBtn}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </View>
                </View>

                <Text style={styles.subText}>{t('analytics.monthly')}</Text>
                <Text style={styles.largePercent}>
                  ₩{(ov?.total_monthly_krw ?? 0).toLocaleString()}
                </Text>

                {/* 월별 추이 차트 */}
                {trendData.length > 0 && (
                  <TrendBarChart data={trendData} />
                )}

                {/* 통계 요약 */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {ov?.active_count ?? 0}{' '}
                      <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                    </Text>
                    <Text style={styles.statLabel}>{t('common.active')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {ov?.paused_count ?? 0}{' '}
                      <Ionicons name="pause-circle" size={12} color="#FFD54F" />
                    </Text>
                    <Text style={styles.statLabel}>{t('common.paused')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {ov?.trial_count ?? 0}{' '}
                      <Ionicons name="time" size={12} color="#5AC8FA" />
                    </Text>
                    <Text style={styles.statLabel}>Trial</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      ₩{((ov?.total_yearly_krw ?? 0) / 1000).toFixed(0)}K
                    </Text>
                    <Text style={styles.statLabel}>{t('analytics.yearly')}</Text>
                  </View>
                </View>
              </View>

              {/* ── 카테고리별 지출 (기존 AI Assistant 위치) ── */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Ionicons name="grid" size={20} color={Colors.textPrimary} />
                    <Text style={styles.cardTitle}>{t('analytics.byCategory')}</Text>
                  </View>
                  <View style={styles.roundArrowBtn}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </View>
                </View>

                {cats.map((cat: any, i: number) => (
                  <View key={i} style={styles.catRow}>
                    <View style={[styles.catDot, { backgroundColor: cat.color || Colors.primary }]} />
                    <Text style={styles.catName}>{cat.category_name}</Text>
                    <Text style={styles.catPercent}>{cat.percentage?.toFixed(0)}%</Text>
                    <Text style={styles.catAmount}>₩{(cat.total_krw ?? 0).toLocaleString()}</Text>
                  </View>
                ))}

                {cats.length === 0 && (
                  <Text style={styles.emptyText}>{t('common.noData')}</Text>
                )}
              </View>

              {/* ── 절약 제안 카드 ── */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <View style={styles.savingIconCircle}>
                      <Ionicons name="bulb" size={18} color="#F59E0B" />
                    </View>
                    <Text style={styles.cardTitle}>{t('analytics.savingInsight')}</Text>
                  </View>
                </View>

                {savingsList.length > 0 && (() => {
                  const totalSavings = savingsList.reduce(
                    (sum: number, s: any) => sum + Number(s.max_savings_krw ?? 0),
                    0,
                  );
                  return totalSavings > 0 ? (
                    <View style={styles.savingHero}>
                      <Text style={styles.savingHeroLabel}>월 최대 절감 가능</Text>
                      <Text style={styles.savingHeroAmount}>₩{totalSavings.toLocaleString()}</Text>
                    </View>
                  ) : null;
                })()}

                {savingsList.map((s: any, i: number) => {
                  const text = s.suggestion_text ?? s.message ?? '';
                  const saving = Number(s.max_savings_krw ?? 0);
                  const canApply = !!s.subscription_id && !!s.action_type;
                  const isApplying = applyingId === s.subscription_id;
                  return (
                    <View key={i} style={styles.savingItem}>
                      <View style={styles.savingTop}>
                        {s.service_name ? (
                          <ServiceLogo name={s.service_name} size={36} />
                        ) : (
                          <View style={styles.savingFallbackIcon}>
                            <Ionicons name="trending-down" size={18} color={Colors.success} />
                          </View>
                        )}
                        <View style={styles.savingBody}>
                          {s.service_name && (
                            <View style={styles.savingTitleRow}>
                              <Text style={styles.savingService}>{s.service_name}</Text>
                              {s.current_plan_name && (
                                <View style={styles.savingPlanBadge}>
                                  <Text style={styles.savingPlanText}>{s.current_plan_name}</Text>
                                </View>
                              )}
                            </View>
                          )}
                          <Text style={styles.savingDesc}>{text}</Text>
                        </View>
                        {saving > 0 && (
                          <View style={styles.savingPill}>
                            <Ionicons name="arrow-down" size={11} color={Colors.success} />
                            <Text style={styles.savingPillText}>₩{saving.toLocaleString()}</Text>
                          </View>
                        )}
                      </View>

                      {canApply && (
                        <GradientButton
                          label="지금 적용"
                          icon="flash"
                          variant="glass"
                          size="md"
                          loading={isApplying}
                          onPress={() => handleApplySuggestion(s)}
                          style={{ marginTop: Spacing.sm }}
                        />
                      )}
                    </View>
                  );
                })}

                {/* 중복 감지 섹션 */}
                {overlapsList.length > 0 && (
                  <>
                    <View style={styles.overlapDivider} />
                    <View style={styles.overlapHeader}>
                      <Ionicons name="copy" size={16} color={Colors.danger} />
                      <Text style={styles.overlapTitle}>{t('analytics.overlapDetected')}</Text>
                    </View>
                    <Text style={styles.overlapHint}>{t('analytics.overlapHint')}</Text>
                    {overlapsList.map((o: any, i: number) => (
                      <View key={`overlap-${i}`} style={styles.overlapRow}>
                        <View style={styles.overlapBadge}>
                          <Text style={styles.overlapBadgeText}>{o.category}</Text>
                        </View>
                        <Text style={styles.overlapMessage}>{o.message}</Text>
                      </View>
                    ))}
                  </>
                )}

                {savingsList.length === 0 && overlapsList.length === 0 && (
                  <View style={styles.emptySaving}>
                    <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                    <Text style={styles.emptySavingText}>현재 가장 합리적인 플랜을 사용 중이에요</Text>
                  </View>
                )}
              </View>

              {/* ── 예산 현황 ── */}
              {((budget.data as any)?.monthly_budget > 0 || budget.error) && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Ionicons name="wallet" size={20} color={Colors.textPrimary} />
                      <Text style={styles.cardTitle}>{t('settings.monthlyBudget')}</Text>
                    </View>
                  </View>
                  <View style={styles.budgetBar}>
                    <View
                      style={[
                        styles.budgetFill,
                        {
                          width: `${Math.min(((budget.data as any)?.usage_percentage ?? 0), 100)}%`,
                          backgroundColor: ((budget.data as any)?.usage_percentage ?? 0) > 80 ? Colors.danger : Colors.success,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.budgetLabels}>
                    <Text style={styles.budgetText}>
                      ₩{((budget.data as any)?.total_spent ?? 0).toLocaleString()}
                    </Text>
                    <Text style={styles.budgetText}>
                      / ₩{((budget.data as any)?.monthly_budget ?? 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: 160 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── 적용 확인 모달 ── */}
      <Modal visible={!!confirmSub} transparent animationType="fade" onRequestClose={cancelConfirm}>
        <Pressable style={styles.confirmOverlay} onPress={cancelConfirm}>
          <Pressable style={styles.confirmSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="flash" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>플랜 변경 적용</Text>
            {confirmSub && (
              <>
                <Text style={styles.confirmBody}>
                  <Text style={{ fontWeight: FontWeight.heavy }}>{confirmSub.service_name}</Text>
                  {' → '}
                  <Text style={{ fontWeight: FontWeight.heavy, color: Colors.primary }}>
                    {confirmSub.cheaper_plans?.[0]?.plan_name ?? '추천 플랜'}
                  </Text>
                </Text>
                {Number(confirmSub.max_savings_krw ?? 0) > 0 && (
                  <View style={styles.confirmSavingPill}>
                    <Ionicons name="arrow-down" size={11} color={Colors.success} />
                    <Text style={styles.confirmSavingText}>
                      월 ₩{Number(confirmSub.max_savings_krw).toLocaleString()} 절약
                    </Text>
                  </View>
                )}
                <Text style={styles.confirmHint}>
                  ① {confirmSub.service_name} 관리 페이지를 새 창으로 열어드려요{'\n'}
                  ② SubFlow에 새 플랜을 자동 반영합니다
                </Text>
              </>
            )}
            <View style={styles.confirmActions}>
              <View style={{ flex: 1 }}>
                <GradientButton
                  label="취소"
                  variant="neutral"
                  size="md"
                  onPress={cancelConfirm}
                />
              </View>
              <View style={{ flex: 1 }}>
                <GradientButton
                  label="열고 적용"
                  icon="open-outline"
                  variant="primary"
                  size="md"
                  onPress={runApply}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 토스트 ── */}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            toast.type === 'error' && styles.toastError,
            toast.type === 'info' && styles.toastInfo,
            {
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <Ionicons
            name={toast.type === 'success' ? 'checkmark-circle' : toast.type === 'error' ? 'alert-circle' : 'information-circle'}
            size={18}
            color="#FFF"
          />
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textWhite },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: 40, padding: Spacing.xxl,
    marginBottom: Spacing.lg, ...Shadow.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  roundArrowBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  subText: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.lg },
  largePercent: { fontSize: 48, fontWeight: FontWeight.heavy, color: Colors.textPrimary, letterSpacing: -1.5, marginTop: -4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xl },
  statItem: { alignItems: 'flex-start' },
  statNumber: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  // Category
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  catName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  catPercent: { fontSize: FontSize.sm, color: Colors.textTertiary, marginRight: Spacing.md },
  catAmount: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  // Saving Insights
  savingIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center', alignItems: 'center',
  },
  savingHero: {
    marginTop: Spacing.lg,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  savingHeroLabel: { fontSize: FontSize.xs, color: '#047857', fontWeight: FontWeight.semibold, marginBottom: 2 },
  savingHeroAmount: { fontSize: 28, fontWeight: FontWeight.heavy, color: '#065F46', letterSpacing: -0.5 },
  savingItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  savingTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  savingFallbackIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center', alignItems: 'center',
  },
  savingBody: { flex: 1 },
  savingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  savingService: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  savingPlanBadge: { backgroundColor: Colors.borderLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  savingPlanText: { fontSize: 9, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
  savingDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  savingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  savingPillText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.success },
  emptySaving: {
    alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm,
  },
  emptySavingText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  // Budget
  budgetBar: { height: 8, borderRadius: 4, backgroundColor: Colors.borderLight, marginTop: Spacing.lg, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 4 },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  budgetText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.lg, textAlign: 'center' },
  // Overlaps
  overlapDivider: { height: 1, backgroundColor: Colors.borderLight, marginTop: Spacing.xl, marginBottom: Spacing.lg },
  overlapHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  overlapTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.danger },
  overlapHint: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4, marginBottom: Spacing.md },
  overlapRow: { marginTop: Spacing.sm },
  overlapBadge: { backgroundColor: Colors.danger + '15', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 4 },
  overlapBadgeText: { fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.bold },
  overlapMessage: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  // ── 적용 확인 모달 ──
  confirmOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', paddingHorizontal: 32,
  },
  confirmSheet: {
    backgroundColor: '#FFF', borderRadius: 28, padding: 28,
    alignItems: 'center', gap: 12,
  },
  confirmIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(74,144,217,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  confirmTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  confirmBody: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  confirmSavingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    marginTop: 4,
  },
  confirmSavingText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success },
  confirmHint: {
    fontSize: FontSize.xs, color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 18, marginTop: 4,
  },
  confirmActions: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg,
    alignSelf: 'stretch',
  },
  // ── 토스트 ──
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20,
    backgroundColor: Colors.success,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  toastError: { backgroundColor: Colors.danger },
  toastInfo: { backgroundColor: Colors.textSecondary },
  toastText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFF' },
});
