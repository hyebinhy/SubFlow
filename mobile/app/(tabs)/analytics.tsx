import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useAnalyticsOverview, useCategoryBreakdown, useSpendingTrend, useSavingsSuggestions, useBudgetStatus, useOverlaps } from '../../src/hooks/useApi';
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
    { message: 'Netflix와 YouTube Premium 동시 사용 중 — YouTube 해지 시 월 ₩14,900 절약' },
    { message: 'ChatGPT Plus를 연간 결제로 전환 시 약 20% 할인 가능' },
  ];
  const MOCK_OVERLAPS = [
    { category: 'Entertainment', services: ['Netflix', 'YouTube Premium'], message: 'Netflix와 YouTube Premium이 엔터테인먼트 카테고리에서 중복됩니다' },
    { category: 'Developer Tools', services: ['GitHub Copilot', 'ChatGPT Plus'], message: 'GitHub Copilot과 ChatGPT Plus가 AI 코딩 기능이 겹칩니다' },
  ];

  // 백엔드 필드명 → 모바일 필드명 매핑
  const rawOv = overview.data as any;
  const ov = rawOv ? {
    total_monthly_krw: Number(rawOv.total_monthly_cost ?? rawOv.total_monthly_krw ?? 0),
    total_yearly_krw: Number(rawOv.total_yearly_cost ?? rawOv.total_yearly_krw ?? 0),
    active_count: rawOv.total_active_subscriptions ?? rawOv.active_count ?? 0,
    paused_count: rawOv.paused_count ?? 0,
    trial_count: rawOv.trial_count ?? 0,
  } : (overview.error ? MOCK_OVERVIEW : null);

  const rawCats = (categories.data as any)?.breakdown ?? (categories.data as any)?.categories ?? [];
  const cats = rawCats.length > 0
    ? rawCats.map((c: any) => ({
        category_name: c.category ?? c.category_name ?? '',
        total_krw: Number(c.total ?? c.total_krw ?? 0),
        percentage: c.percentage ?? 0,
        color: c.color ?? Colors.primary,
      }))
    : (categories.error ? MOCK_CATEGORIES : []);

  const rawTrend = (trend.data as any)?.data ?? (trend.data as any)?.months ?? [];
  const trendData = rawTrend.length > 0
    ? rawTrend.map((t: any) => ({
        month: t.month_name ?? `${t.month ?? ''}`,
        amount: Number(t.total ?? t.amount ?? 0),
      }))
    : (trend.error ? MOCK_TREND : []);

  const rawSavings = (savings.data as any)?.suggestions ?? [];
  const savingsList = rawSavings.length > 0
    ? rawSavings.map((s: any) => ({ message: s.suggestion_text ?? s.message ?? '' }))
    : (savings.error ? MOCK_SAVINGS : []);

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
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/calendar')}>
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
                  <TouchableOpacity style={styles.roundArrowBtn} onPress={() => router.push('/(tabs)/subscriptions')}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </TouchableOpacity>
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
                  <TouchableOpacity style={styles.roundArrowBtn} onPress={() => router.push('/(tabs)/subscriptions')}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </TouchableOpacity>
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
                    <Ionicons name="bulb" size={20} color={Colors.textPrimary} />
                    <Text style={styles.cardTitle}>{t('analytics.savingInsight')}</Text>
                  </View>
                </View>

                {savingsList.map((s: any, i: number) => (
                  <View key={i} style={styles.suggestionRow}>
                    <Ionicons name="arrow-down-circle" size={16} color={Colors.success} />
                    <Text style={styles.suggestionText}>{s.message}</Text>
                  </View>
                ))}

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
                  <Text style={styles.emptyText}>{t('common.noData')}</Text>
                )}
              </View>

              {/* ── 예산 현황 ── */}
              {((budget.data as any)?.budget_monthly > 0 || (budget.data as any)?.monthly_budget > 0 || budget.error) && (() => {
                const bd = budget.data as any;
                const budgetAmount = Number(bd?.budget_monthly ?? bd?.monthly_budget ?? 0);
                const spent = Number(bd?.current_spending ?? bd?.total_spent ?? 0);
                const pct = Number(bd?.percentage_used ?? bd?.usage_percentage ?? 0);
                return (
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
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: pct > 80 ? Colors.danger : Colors.success,
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.budgetLabels}>
                      <Text style={styles.budgetText}>
                        ₩{spent.toLocaleString()}
                      </Text>
                      <Text style={styles.budgetText}>
                        / ₩{budgetAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </>
          )}

          <View style={{ height: 160 }} />
        </ScrollView>
      </SafeAreaView>
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
  // Suggestions
  suggestionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.md },
  suggestionText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
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
});
