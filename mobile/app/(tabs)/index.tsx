import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
// 부모 ScrollView에 Spacing.lg(16) 패딩이 있으므로 가용 너비(CW)를 계산
const CW = width - Spacing.lg * 2;
const ITEM_WIDTH = CW * 0.8; // 가용 너비의 80%를 카드 너비로 설정
const GAP = Spacing.md;
const SPACER = (CW - ITEM_WIDTH) / 2;
const SNAP_INTERVAL = ITEM_WIDTH + GAP;

// ── 데이터 타입 및 헬퍼 ──
interface Subscription {
  id: string;
  name: string;
  amount: number;
  startDate: string; // YYYY-MM-DD
  priceNews?: string;
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: '1', name: 'Netflix', amount: 17000, startDate: '2023-01-15', priceNews: 'Next month price increase expected' },
  { id: '2', name: 'Spotify', amount: 10900, startDate: '2024-05-10' },
  { id: '3', name: 'YouTube Premium', amount: 14900, startDate: '2022-11-20', priceNews: 'Family plan update available' },
  { id: '4', name: 'iCloud+', amount: 3900, startDate: '2021-08-05' },
  { id: '5', name: 'ChatGPT Plus', amount: 26000, startDate: '2023-07-22' },
];

function getDurationText(startDateStr: string) {
  const start = new Date(startDateStr);
  const now = new Date();
  
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years > 0) {
    return `Subscribed for ${years}y ${months}m`;
  }
  return `Subscribed for ${months}m`;
}

// ── 바코드 스타일 진행 바 (Payment 카드용) ──
function BarcodeProgress() {
  const data = Array.from({ length: 45 }, (_, i) => ({
    height: Math.random() * 20 + 10 + (i % 3 === 0 ? 5 : 0),
    color: i < 28 ? Colors.success : Colors.borderLight, // 초록색(완료) vs 옅은 회색(대기)
  }));
  return (
    <View style={progressStyles.container}>
      {data.map((bar, i) => (
        <View key={i} style={progressStyles.barWrap}>
          <View
            style={[
              progressStyles.bar,
              { height: bar.height, backgroundColor: bar.color },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
    height: 40,
    gap: 2,
    marginTop: Spacing.sm,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 1,
    minHeight: 10,
  },
});

import { ServiceLogo } from '../../src/components/ServiceLogo';

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const totalMonthlySpend = MOCK_SUBSCRIPTIONS.reduce((sum, s) => sum + s.amount, 0);
  const activeSub = MOCK_SUBSCRIPTIONS[activeIndex];
  const spendPercent = ((activeSub.amount / totalMonthlySpend) * 100).toFixed(1);

  return (
    <LinearGradient
      colors={[Colors.primaryBg, Colors.background]}
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* ── 헤더 (Clerio 스타일) ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMark}>
              <Ionicons name="contract" size={20} color={Colors.textWhite} />
            </View>
            <Text style={styles.headerTitle}>Clerio</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="settings-outline" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 타이틀 영역 */}
          <View style={styles.titleArea}>
            <Text style={styles.subTitle}>Subscription Analytics</Text>
            <Text style={styles.mainTitle}>All Client Data</Text>

            {/* 상태 뱃지 영역 (Glass) */}
            <View style={styles.statusPills}>
              <View style={[styles.pillContainer, styles.glassPill]}>
                <Text style={styles.pillLabel}>Budget:</Text>
                <Text style={styles.pillValue}>₩{totalMonthlySpend.toLocaleString()}</Text>
              </View>
              <View style={[styles.pillContainer, styles.glassPill]}>
                <Text style={styles.pillLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: Colors.success + '20' }]}>
                  <Text style={[styles.statusText, { color: Colors.success }]}>In focus</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 중앙 서비스 페이저 (Horizontal Selector) ── */}
          <View style={styles.pagerContainer}>
            <ScrollView
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              disableIntervalMomentum={true}
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingHorizontal: SPACER }}
              style={styles.pagerScroll}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
                if (index !== activeIndex && index >= 0 && index < MOCK_SUBSCRIPTIONS.length) {
                  setActiveIndex(index);
                }
              }}
            >
              {MOCK_SUBSCRIPTIONS.map((item, index) => {
                const isFocused = activeIndex === index;
                return (
                  <View 
                    key={item.id} 
                    style={[
                      styles.pagerItem, 
                      { width: ITEM_WIDTH, marginRight: index === MOCK_SUBSCRIPTIONS.length - 1 ? 0 : GAP },
                      !isFocused && { opacity: 0.5, transform: [{ scale: 0.95 }] }
                    ]}
                  >
                    {/* 서비스 로고 카드 */}
                    <View style={styles.floatingTopCard}>
                      <View style={styles.fCardLeft}>
                        <ServiceLogo name={item.name} size={42} />
                        <View>
                          <Text style={styles.fName}>{item.name}</Text>
                          <Text style={styles.fId}>ID: {1000 + Number(item.id)}</Text>
                        </View>
                      </View>
                      <View style={styles.rotateBtn}>
                        <Ionicons name="refresh-outline" size={20} color={Colors.textPrimary} />
                      </View>
                    </View>

                    {/* 가격 지표 (레퍼런스처럼 카드에 밀착) */}
                    <View style={styles.revenueWrapper}>
                      <View style={[styles.floatingRevenue, styles.glassPill]}>
                        <Text style={styles.revenueLabel}>Monthly Price</Text>
                        <Text style={styles.revenueValue}>₩{item.amount.toLocaleString()}</Text>
                        <Ionicons name="arrow-up-circle" size={14} color={Colors.success} style={{ marginLeft: 4 }} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* ── 상세 분석 카드 (Glassmorphism) ── */}
          <View style={styles.mainCardStack}>
            <View style={[styles.mainWhiteCard, styles.glassBackground]}>
              <View style={styles.paymentWrap}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentHeaderTitle}>
                    <Ionicons name="pie-chart" size={20} color={Colors.textPrimary} />
                    <Text style={styles.paymentTitle}>Usage Metrics</Text>
                  </View>
                  <View style={styles.roundArrowBtn}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </View>
                </View>
                
                <Text style={styles.durationText}>{getDurationText(activeSub.startDate)}</Text>

                <View style={styles.percentRow}>
                  <Text style={styles.largePercent}>{spendPercent}%</Text>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>of Total Spend</Text>
                  </View>
                </View>

                {/* 가격 뉴스 (있을 경우만) */}
                {activeSub.priceNews && (
                  <View style={styles.newsBox}>
                    <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                    <Text style={styles.newsText}>{activeSub.priceNews}</Text>
                  </View>
                )}

                {/* 바코드 섹션 */}
                <View style={[styles.barcodeSection, { marginTop: Spacing.xl }]}>
                  <View style={styles.barcodeLabels}>
                    <Text style={styles.bLabelText}>Payment Consistency</Text>
                    <Text style={styles.bLabelText}>98%</Text>
                  </View>
                  <BarcodeProgress />
                </View>
              </View>

              <View style={[styles.paymentHeader, { marginTop: Spacing.xl }]}>
                <View style={styles.paymentHeaderTitle}>
                  <Ionicons name="document-text" size={20} color={Colors.textPrimary} />
                  <Text style={styles.paymentTitle}>Billing Overview</Text>
                </View>
                <View style={styles.roundArrowBtn}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                </View>
              </View>
            </View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textWhite,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  // ── Title Area ──
  titleArea: {
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  subTitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    fontWeight: FontWeight.medium,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: FontWeight.heavy,
    color: Colors.textWhite,
    letterSpacing: -1,
    lineHeight: 48,
  },
  statusPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    position: 'relative'
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  pillLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  pillValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  // ── Main Cards ──
  // ── Glassmorphism Styles (Refined Opacity) ──
  glassPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // ── Pager ──
  pagerContainer: {
    marginTop: Spacing.md,
    height: 135,
    zIndex: 20,
  },
  pagerScroll: {
    flex: 1,
  },
  pagerItem: {
    alignItems: 'center',
    width: ITEM_WIDTH,
  },
  revenueWrapper: {
    alignItems: 'center',
    marginTop: -8,
    zIndex: 5,
  },
  // ── Main Card Refinement ──
  durationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginTop: 6,
  },
  percentBadge: {
    backgroundColor: Colors.success + '25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  percentBadgeText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: FontWeight.bold,
  },
  newsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.danger + '10',
    padding: 12,
    borderRadius: 16,
    marginTop: Spacing.lg,
  },
  newsText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  // ── Original Styles ──
  mainCardStack: {
    marginTop: 0,
    paddingHorizontal: Spacing.sm,
  },
  floatingTopCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...Shadow.sm,
  },
  fCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  fId: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  rotateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingRevenue: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  revenueLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  revenueValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  mainWhiteCard: {
    borderRadius: 40,
    padding: Spacing.xxl,
    marginTop: -85,
    zIndex: 1,
    ...Shadow.md,
    minHeight: 400,
  },
  // ── Sections ──
  paymentWrap: {
    marginTop: 60,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paymentTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  roundArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  largePercent: {
    fontSize: 48,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    letterSpacing: -1.5,
  },
  barcodeSection: {
    marginTop: Spacing.xl,
  },
  barcodeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bLabelText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: FontWeight.heavy,
    textTransform: 'uppercase',
  },
});
