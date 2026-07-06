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
import { AppLogoMark } from '../../src/components/AppLogoMark';
import { GradientButton } from '../../src/components/GradientButton';
import { subscriptionAPI } from '../../src/services/api';
import { Colors, Spacing, FontSize, FontWeight, Shadow } from '../../src/constants/theme';

// ── 월별 추이 바 차트 (실제 데이터 + 이번 달 강조 + 라벨) ──
function TrendBarChart({ data }: { data: { month: string; amount: number; isForecast?: boolean }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <View style={chartStyles.container}>
      {data.map((bar, i) => {
        const isLast = i === data.length - 1;
        const heightPx = Math.max((bar.amount / max) * 100, 4);
        return (
          <View key={i} style={chartStyles.barWrap}>
            <View
              style={[
                chartStyles.bar,
                {
                  height: heightPx,
                  backgroundColor: isLast ? Colors.primary : '#B7D4F0',
                  opacity: bar.isForecast ? 0.5 : 1,
                },
              ]}
            />
            <Text style={[chartStyles.barLabel, isLast && { color: Colors.primary, fontWeight: '800' }]}>
              {bar.month}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-end', height: 130,
    marginTop: Spacing.xl, paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%', minWidth: 6, borderRadius: 4 },
  barLabel: { fontSize: 10, color: Colors.textTertiary, marginTop: 6, fontWeight: '600' },
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

  // 상세 바텀시트 상태
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [trendDetailOpen, setTrendDetailOpen] = useState(false);
  const [categoryListOpen, setCategoryListOpen] = useState(false);

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
      setToast({
        type: 'info',
        text: '데모 데이터예요. 백엔드 연결 시 자동 적용됩니다.',
      });
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

  // 백엔드 필드명 → 모바일 필드명 매핑 (실데이터만)
  const rawOv = overview.data as any;
  const ov = rawOv ? {
    total_monthly_krw: Number(rawOv.total_monthly_cost ?? rawOv.total_monthly_krw ?? 0),
    total_yearly_krw: Number(rawOv.total_yearly_cost ?? rawOv.total_yearly_krw ?? 0),
    active_count: rawOv.total_active_subscriptions ?? rawOv.active_count ?? 0,
    paused_count: rawOv.paused_count ?? 0,
    trial_count: rawOv.trial_count ?? 0,
  } : null;

  const rawCats = (categories.data as any)?.breakdown ?? (categories.data as any)?.categories ?? [];
  const cats = rawCats.map((c: any) => ({
    category_name: c.category ?? c.category_name ?? '',
    total_krw: Number(c.total ?? c.total_krw ?? 0),
    percentage: c.percentage ?? 0,
    color: c.color ?? Colors.primary,
    icon: c.icon ?? null,
    count: c.count ?? 0,
  }));

  const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rawTrend = (trend.data as any)?.data ?? (trend.data as any)?.months ?? [];
  const trendData = rawTrend.map((t: any) => ({
    month: t.month_name ?? (typeof t.month === 'number' ? MONTH_ABBR[t.month - 1] : `${t.month ?? ''}`),
    amount: Number(t.total ?? t.amount ?? 0),
    isForecast: !!t.is_forecast,
  }));

  // 지난달 대비 변화량
  const lastMonth = trendData.length >= 2 ? trendData[trendData.length - 2] : null;
  const thisMonth = trendData.length >= 1 ? trendData[trendData.length - 1] : null;
  const momChange = lastMonth && thisMonth && lastMonth.amount > 0
    ? ((thisMonth.amount - lastMonth.amount) / lastMonth.amount) * 100
    : 0;
  const momDelta = thisMonth && lastMonth ? thisMonth.amount - lastMonth.amount : 0;

  const rawSavings = (savings.data as any)?.suggestions ?? [];
  const savingsList = rawSavings.map((s: any) => ({ message: s.suggestion_text ?? s.message ?? '' }));

  const overlapsList = (overlaps.data as any)?.overlaps ?? [];

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AppLogoMark />
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
                  <TouchableOpacity style={styles.roundArrowBtn} onPress={() => setTrendDetailOpen(true)}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.subText}>{t('analytics.monthly')}</Text>
                <View style={styles.totalRow}>
                  <Text style={styles.largePercent}>
                    ₩{(ov?.total_monthly_krw ?? 0).toLocaleString()}
                  </Text>
                  {lastMonth && thisMonth && (
                    <View style={[
                      styles.momPill,
                      { backgroundColor: momChange >= 0 ? Colors.danger + '15' : Colors.success + '15' },
                    ]}>
                      <Ionicons
                        name={momChange >= 0 ? 'trending-up' : 'trending-down'}
                        size={11}
                        color={momChange >= 0 ? Colors.danger : Colors.success}
                      />
                      <Text style={[
                        styles.momPillText,
                        { color: momChange >= 0 ? Colors.danger : Colors.success },
                      ]}>
                        {momChange >= 0 ? '+' : ''}{momChange.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>

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

              {/* ── 카테고리별 지출 ── */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrap}>
                    <Ionicons name="grid" size={20} color={Colors.textPrimary} />
                    <Text style={styles.cardTitle}>{t('analytics.byCategory')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.roundArrowBtn}
                    onPress={() => setCategoryListOpen(true)}
                  >
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {cats.length > 0 && (
                  <View style={styles.stackedBar}>
                    {cats.map((cat: any, i: number) => (
                      <View
                        key={i}
                        style={{
                          flex: cat.percentage || 1,
                          backgroundColor: cat.color || Colors.primary,
                          opacity: 0.9,
                        }}
                      />
                    ))}
                  </View>
                )}

                {cats.map((cat: any, i: number) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.catRow}
                    activeOpacity={0.6}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <View style={[styles.catDot, { backgroundColor: cat.color || Colors.primary }]} />
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.category_name}</Text>
                      {cat.count > 0 && (
                        <Text style={styles.catSubText}>구독 {cat.count}개</Text>
                      )}
                    </View>
                    <View style={styles.catRight}>
                      <Text style={styles.catAmount}>₩{(cat.total_krw ?? 0).toLocaleString()}</Text>
                      <Text style={styles.catPercent}>{cat.percentage?.toFixed(0)}%</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
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

                      <GradientButton
                        label="지금 적용"
                        icon="flash"
                        variant="glass"
                        size="md"
                        loading={isApplying}
                        onPress={() => handleApplySuggestion(s)}
                        style={{ marginTop: Spacing.sm }}
                      />
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

      {/* ── 지출 추이 상세 바텀시트 ── */}
      <Modal visible={trendDetailOpen} transparent animationType="slide" onRequestClose={() => setTrendDetailOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setTrendDetailOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>월별 지출 추이</Text>
            <Text style={styles.sheetSubtitle}>최근 {trendData.length}개월</Text>

            {trendData.length > 0 && <TrendBarChart data={trendData} />}

            <View style={styles.sheetStatsRow}>
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>이번 달</Text>
                <Text style={styles.sheetStatValue}>
                  ₩{Number(thisMonth?.amount ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>지난 달</Text>
                <Text style={styles.sheetStatValue}>
                  ₩{Number(lastMonth?.amount ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatLabel}>변동</Text>
                <Text style={[
                  styles.sheetStatValue,
                  { color: momDelta >= 0 ? Colors.danger : Colors.success },
                ]}>
                  {momDelta >= 0 ? '+' : ''}₩{Math.abs(momDelta).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.sheetMonthList}>
              {trendData.slice().reverse().map((m: any, i: number) => (
                <View key={i} style={styles.sheetMonthRow}>
                  <Text style={styles.sheetMonthLabel}>{m.month}</Text>
                  <Text style={styles.sheetMonthAmount}>₩{Number(m.amount).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: Spacing.xl }}>
              <GradientButton
                label="닫기"
                variant="neutral"
                size="md"
                onPress={() => setTrendDetailOpen(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 카테고리 풀 리스트 시트 ── */}
      <Modal visible={categoryListOpen} transparent animationType="slide" onRequestClose={() => setCategoryListOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setCategoryListOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>카테고리별 지출</Text>
            <Text style={styles.sheetSubtitle}>총 {cats.length}개 카테고리</Text>

            {cats.length > 0 && (
              <View style={[styles.stackedBar, { height: 14, marginTop: Spacing.lg }]}>
                {cats.map((cat: any, i: number) => (
                  <View
                    key={i}
                    style={{ flex: cat.percentage || 1, backgroundColor: cat.color || Colors.primary }}
                  />
                ))}
              </View>
            )}

            <ScrollView style={{ maxHeight: 380, marginTop: Spacing.md }}>
              {cats.map((cat: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={styles.catRow}
                  activeOpacity={0.6}
                  onPress={() => {
                    setCategoryListOpen(false);
                    setSelectedCategory(cat);
                  }}
                >
                  <View style={[styles.catDot, { backgroundColor: cat.color || Colors.primary }]} />
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat.category_name}</Text>
                    <Text style={styles.catSubText}>구독 {cat.count ?? 0}개 · {cat.percentage?.toFixed(0)}%</Text>
                  </View>
                  <Text style={styles.catAmount}>₩{(cat.total_krw ?? 0).toLocaleString()}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ marginTop: Spacing.lg }}>
              <GradientButton
                label="닫기"
                variant="neutral"
                size="md"
                onPress={() => setCategoryListOpen(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 카테고리 상세 시트 ── */}
      <Modal visible={!!selectedCategory} transparent animationType="slide" onRequestClose={() => setSelectedCategory(null)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setSelectedCategory(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            {selectedCategory && (
              <>
                <View style={styles.catDetailHeader}>
                  <View style={[styles.catDetailDot, { backgroundColor: selectedCategory.color || Colors.primary }]}>
                    <Text style={styles.catDetailEmoji}>{selectedCategory.icon ?? '📦'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>{selectedCategory.category_name}</Text>
                    <Text style={styles.sheetSubtitle}>
                      구독 {selectedCategory.count ?? 0}개 · 전체의 {selectedCategory.percentage?.toFixed(0)}%
                    </Text>
                  </View>
                </View>

                <View style={[styles.savingHero, { marginTop: Spacing.lg }]}>
                  <Text style={styles.savingHeroLabel}>월 지출</Text>
                  <Text style={styles.savingHeroAmount}>
                    ₩{Number(selectedCategory.total_krw ?? 0).toLocaleString()}
                  </Text>
                </View>

                <Text style={[styles.sheetSubtitle, { marginTop: Spacing.xl, marginBottom: Spacing.sm }]}>
                  💡 더 자세한 구독 목록은 [내 구독] 탭에서 확인할 수 있어요.
                </Text>

                <View style={{ marginTop: Spacing.lg }}>
                  <GradientButton
                    label="구독 보기"
                    icon="list"
                    variant="primary"
                    size="md"
                    onPress={() => {
                      setSelectedCategory(null);
                      router.push('/(tabs)/subscriptions');
                    }}
                  />
                </View>
                <View style={{ marginTop: Spacing.sm }}>
                  <GradientButton
                    label="닫기"
                    variant="neutral"
                    size="md"
                    onPress={() => setSelectedCategory(null)}
                  />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: 4 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  catInfo: { flex: 1 },
  catName: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  catSubText: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  catRight: { alignItems: 'flex-end', marginRight: Spacing.sm },
  catPercent: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  catAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  stackedBar: {
    flexDirection: 'row', height: 10, borderRadius: 5,
    overflow: 'hidden', marginTop: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.borderLight,
  },
  // 지출 분석 변동 핀
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: -4 },
  momPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  momPillText: { fontSize: 11, fontWeight: FontWeight.heavy },
  // 바텀시트 공통
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderLight, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  sheetSubtitle: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4 },
  sheetStatsRow: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl,
  },
  sheetStat: {
    flex: 1, backgroundColor: Colors.surfaceLight,
    borderRadius: 14, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  sheetStatLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 2 },
  sheetStatValue: { fontSize: FontSize.md, fontWeight: FontWeight.heavy, color: Colors.textPrimary },
  sheetMonthList: { marginTop: Spacing.lg },
  sheetMonthRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  sheetMonthLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  sheetMonthAmount: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  catDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  catDetailDot: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  catDetailEmoji: { fontSize: 24 },
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
    shadowColor: Colors.shadowTint, shadowOpacity: 0.22, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  toastError: { backgroundColor: Colors.danger },
  toastInfo: { backgroundColor: Colors.textSecondary },
  toastText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFF' },
});
