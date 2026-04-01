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
import { ServiceLogo } from '../../src/components/ServiceLogo';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../src/constants/theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PAYMENT_DAYS: Record<number, { name: string; amount: number; color: string }[]> = {
  7: [{ name: 'Netflix', amount: 17000, color: '#E50914' }],
  12: [{ name: 'Spotify', amount: 10900, color: '#1DB954' }],
  15: [{ name: 'YouTube', amount: 14900, color: '#FF0000' }],
  20: [{ name: 'iCloud+', amount: 3900, color: '#007AFF' }],
};

export default function CalendarScreen() {
  const [currentDate] = useState(new Date(2026, 3, 1));
  const today = 2;

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < 3; i++) calendarDays.push(null); // Wed start
  for (let i = 1; i <= 30; i++) calendarDays.push(i);

  const monthTotal = Object.values(PAYMENT_DAYS).flat().reduce((sum, p) => sum + p.amount, 0);

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* 헤더 */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.logoMark}>
                <Ionicons name="contract" size={20} color={Colors.textWhite} />
                </View>
                <Text style={styles.headerTitle}>Clerio</Text>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerIconBtn}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textWhite} />
                </TouchableOpacity>
                <View style={styles.headerAvatar}>
                   <Ionicons name="person" size={16} color={Colors.primary} />
                </View>
            </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
             <Text style={styles.subTitle}>Payment Schedule</Text>
             <Text style={styles.mainTitle}>April 2026</Text>
             
             <View style={styles.summaryPills}>
               <View style={styles.pill}>
                  <Text style={styles.pillLabel}>Budget:</Text>
                  <Text style={styles.pillValue}>₩100K</Text>
               </View>
               <View style={[styles.pill, {backgroundColor: 'rgba(255,255,255,0.7)'}]}>
                  <Text style={styles.pillLabel}>To Pay:</Text>
                  <Text style={styles.pillValue}>₩{monthTotal.toLocaleString()}</Text>
               </View>
             </View>
          </View>

          <View style={styles.cardContainer}>
             <View style={styles.mainWhiteCard}>
                <View style={styles.monthNav}>
                   <TouchableOpacity><Ionicons name="chevron-back" size={20} color={Colors.textTertiary} /></TouchableOpacity>
                   <Text style={styles.monthTitle}>April</Text>
                   <TouchableOpacity><Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} /></TouchableOpacity>
                </View>

                {/* 요일 */}
                <View style={styles.weekRow}>
                   {DAYS.map((d, i) => <Text key={i} style={styles.weekDay}>{d}</Text>)}
                </View>

                {/* 날짜 그리드 */}
                <View style={styles.calGrid}>
                   {calendarDays.map((day, i) => {
                      const hasPayment = day ? PAYMENT_DAYS[day] : null;
                      const isToday = day === today;
                      return (
                         <View key={i} style={styles.calCell}>
                            {day && (
                               <View style={[styles.dayWrap, isToday && styles.todayWrap]}>
                                  <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                                  {hasPayment && <View style={styles.dotRow}>{hasPayment.map((p, j) => <View key={j} style={[styles.payDot, {backgroundColor: p.color}]} />)}</View>}
                               </View>
                            )}
                         </View>
                      );
                   })}
                </View>

                <View style={styles.divider} />
                
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {Object.entries(PAYMENT_DAYS).map(([day, payments]) => 
                  payments.map((p, i) => (
                    <View key={`${day}-${i}`} style={styles.upcomingItem}>
                      <ServiceLogo name={p.name} size={40} />
                      <View style={styles.upcomingInfo}>
                        <Text style={styles.upcomingName}>{p.name}</Text>
                        <Text style={styles.upcomingDate}>April {day}</Text>
                      </View>
                      <Text style={styles.upcomingAmount}>₩{p.amount.toLocaleString()}</Text>
                    </View>
                  ))
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center'
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textWhite },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center'
  },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  pageHeader: { paddingHorizontal: Spacing.sm, marginBottom: Spacing.xl },
  subTitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium, marginBottom: 4 },
  mainTitle: { fontSize: 42, fontWeight: FontWeight.heavy, color: '#FFF', letterSpacing: -1 },
  summaryPills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20
  },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  pillValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  cardContainer: { marginTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  mainWhiteCard: {
    backgroundColor: '#FFF', borderRadius: 40, padding: Spacing.xxl, ...Shadow.md
  },
  monthNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: Spacing.xl },
  monthTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  weekRow: { flexDirection: 'row', marginBottom: Spacing.md },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: FontWeight.heavy, color: Colors.textTertiary, textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayWrap: { width: 34, height: 34, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  todayWrap: { backgroundColor: Colors.primarySoft },
  dayText: { fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  todayText: { color: Colors.primary },
  dotRow: { flexDirection: 'row', gap: 2, position: 'absolute', bottom: 4 },
  payDot: { width: 3, height: 3, borderRadius: 1.5 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  upcomingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  upcomingInfo: { flex: 1, marginLeft: Spacing.md },
  upcomingName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  upcomingDate: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  upcomingAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary }
});
