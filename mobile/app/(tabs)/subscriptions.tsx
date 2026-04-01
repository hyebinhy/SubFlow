import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { ServiceLogo } from '../../src/components/ServiceLogo';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../src/constants/theme';

type FilterType = 'all' | 'active' | 'paused' | 'cancelled';

const MOCK_SUBSCRIPTIONS = [
  { id: '1', name: 'Netflix', plan: 'Premium', amount: 17000, cycle: '월간', nextDate: '2026-04-07', status: 'active' as const, category: '영상' },
  { id: '2', name: 'Spotify', plan: 'Individual', amount: 10900, cycle: '월간', nextDate: '2026-04-12', status: 'active' as const, category: '음악' },
  { id: '3', name: 'YouTube Premium', plan: 'Family', amount: 14900, cycle: '월간', nextDate: '2026-04-15', status: 'active' as const, category: '영상' },
  { id: '4', name: 'iCloud+', plan: '200GB', amount: 3900, cycle: '월간', nextDate: '2026-04-20', status: 'active' as const, category: '클라우드' },
  { id: '5', name: 'ChatGPT Plus', plan: 'Plus', amount: 26000, cycle: '월간', nextDate: '2026-04-22', status: 'paused' as const, category: 'AI' },
  { id: '6', name: 'Adobe CC', plan: 'Photography', amount: 13200, cycle: '월간', nextDate: '—', status: 'cancelled' as const, category: '디자인' },
];

const statusBadge: Record<string, { label: string; color: 'success' | 'warning' | 'danger' }> = {
  active: { label: '활성', color: 'success' },
  paused: { label: '일시정지', color: 'warning' },
  cancelled: { label: '해지', color: 'danger' },
};

export default function SubscriptionsScreen() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all'
    ? MOCK_SUBSCRIPTIONS
    : MOCK_SUBSCRIPTIONS.filter((s) => s.status === filter);

  const total = MOCK_SUBSCRIPTIONS
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* 헤더 (Clerio 스타일) */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMark}>
              <Ionicons name="contract" size={20} color={Colors.textWhite} />
            </View>
            <Text style={styles.headerTitle}>Clerio</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={24} color={Colors.textWhite} />
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
           {/* 타이틀 및 요약 정보 (Pills) */}
           <View style={styles.pageHeader}>
             <Text style={styles.subTitle}>Subscription Management</Text>
             <Text style={styles.mainTitle}>My List</Text>
             
             <View style={styles.summaryPills}>
               <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Active:</Text>
                  <Text style={styles.pillValue}>{MOCK_SUBSCRIPTIONS.filter(s => s.status === 'active').length}</Text>
               </View>
               <View style={[styles.pill, {backgroundColor: 'rgba(255,255,255,0.7)'}]}>
                  <Text style={styles.pillLabel}>Monthly Total:</Text>
                  <Text style={styles.pillValue}>₩{total.toLocaleString()}</Text>
               </View>
             </View>
           </View>

           {/* 필터 탭 (Pill 형태) */}
           <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {(['all', 'active', 'paused', 'cancelled'] as FilterType[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, filter === f && styles.filterPillActive]}
                    onPress={() => setFilter(f)}
                  >
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                      {f === 'all' ? '전체' : statusBadge[f]?.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
           </View>

           {/* 구독 카드 리스트 */}
           <View style={styles.cardContainer}>
              <View style={styles.mainWhiteCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Subscriptions</Text>
                  <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textTertiary} />
                </View>

                {filtered.map((sub, i) => (
                  <View key={sub.id} style={[styles.subItem, i > 0 && styles.itemBorder]}>
                    <ServiceLogo name={sub.name} size={48} />
                    <View style={styles.subInfo}>
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Text style={styles.subDetail}>{sub.plan} · {sub.category}</Text>
                    </View>
                    <View style={styles.subRight}>
                      <Text style={styles.subAmount}>₩{sub.amount.toLocaleString()}</Text>
                      <Text style={styles.subDate}>{sub.nextDate}</Text>
                    </View>
                  </View>
                ))}

                {filtered.length === 0 && (
                  <Text style={styles.emptyText}>구독 내역이 없습니다.</Text>
                )}
              </View>
           </View>

           <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textWhite },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  // Scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  // Page Header
  pageHeader: { paddingHorizontal: Spacing.sm, marginBottom: Spacing.xl },
  subTitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium, marginBottom: 4 },
  mainTitle: { fontSize: 42, fontWeight: FontWeight.heavy, color: Colors.textWhite, letterSpacing: -1 },
  summaryPills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20
  },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  pillValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  // Filters
  filterContainer: { marginBottom: Spacing.lg },
  filterScroll: { paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  filterPillActive: { backgroundColor: Colors.surface, borderColor: Colors.surface },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textWhite },
  filterTextActive: { color: Colors.textPrimary },
  // Card Container
  cardContainer: { marginTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  mainWhiteCard: {
    backgroundColor: Colors.surface, borderRadius: 40, padding: Spacing.xxl, ...Shadow.md, minHeight: 300
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  // Sub Items
  subItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg },
  itemBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  subInfo: { flex: 1, marginLeft: Spacing.md },
  subName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subDetail: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  subRight: { alignItems: 'flex-end' },
  subAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subDate: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.textTertiary, fontSize: FontSize.sm }
});
