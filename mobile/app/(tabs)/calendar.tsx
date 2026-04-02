import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ServiceLogo } from '../../src/components/ServiceLogo';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCalendarEvents, useTimeline } from '../../src/hooks/useApi';
import { Colors, Spacing, FontSize, FontWeight, Shadow } from '../../src/constants/theme';

const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen() {
  const { t, language } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [activeTab, setActiveTab] = useState<'calendar' | 'timeline'>('calendar');

  const calendarEvents = useCalendarEvents(year, month + 1);
  const timeline = useTimeline();

  // Mock fallback 결제 이벤트
  const MOCK_EVENTS = [
    { service_name: 'Netflix', billing_amount: 17000, billing_date: `${year}-${String(month+1).padStart(2,'0')}-07` },
    { service_name: 'Spotify', billing_amount: 10900, billing_date: `${year}-${String(month+1).padStart(2,'0')}-12` },
    { service_name: 'YouTube Premium', billing_amount: 14900, billing_date: `${year}-${String(month+1).padStart(2,'0')}-15` },
    { service_name: 'iCloud+', billing_amount: 3900, billing_date: `${year}-${String(month+1).padStart(2,'0')}-20` },
    { service_name: 'ChatGPT Plus', billing_amount: 26000, billing_date: `${year}-${String(month+1).padStart(2,'0')}-22` },
  ];

  // Mock timeline
  const MOCK_TIMELINE = [
    { id: '1', service_name: 'Netflix', action: 'created', description: 'Netflix 구독 시작', created_at: '2024-12-01T09:00:00Z' },
    { id: '2', service_name: 'Netflix', action: 'plan_changed', description: 'Standard → Premium 플랜 변경', created_at: '2025-02-15T14:30:00Z' },
    { id: '3', service_name: 'Spotify', action: 'created', description: 'Spotify Premium 구독 시작', created_at: '2025-01-10T11:00:00Z' },
    { id: '4', service_name: 'YouTube Premium', action: 'cancelled', description: 'YouTube Premium 해지', created_at: '2025-03-20T16:00:00Z' },
    { id: '5', service_name: 'ChatGPT Plus', action: 'created', description: 'ChatGPT Plus 구독 시작', created_at: '2025-03-01T10:00:00Z' },
  ];

  const timelineData = ((timeline.data as any)?.timeline ?? (timeline.data as any) ?? []).length > 0
    ? ((timeline.data as any)?.timeline ?? (timeline.data as any))
    : (timeline.error ? MOCK_TIMELINE : []);

  const apiEvents = (calendarEvents.data as any)?.events ?? [];
  const events = apiEvents.length > 0 ? apiEvents : (calendarEvents.error ? MOCK_EVENTS : apiEvents);

  const todayDay = (year === now.getFullYear() && month === now.getMonth()) ? now.getDate() : -1;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = language === 'ko' ? DAYS_KO : DAYS_EN;
  const monthName = language === 'ko' ? `${year}년 ${MONTHS_KO[month]}` : `${MONTHS_EN[month]} ${year}`;

  // 결제일 맵 (day → events[])
  const paymentMap = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (const ev of events) {
      const d = new Date(ev.billing_date ?? ev.next_billing_date).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(ev);
    }
    return map;
  }, [events]);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const monthTotal = events.reduce((s: number, e: any) => s + (e.billing_amount ?? e.amount ?? 0), 0);

  // 다가오는 결제 (오늘 이후)
  const upcoming = events
    .filter((e: any) => {
      const d = new Date(e.billing_date ?? e.next_billing_date).getDate();
      return d >= todayDay;
    })
    .sort((a: any, b: any) => new Date(a.billing_date ?? a.next_billing_date).getTime() - new Date(b.billing_date ?? b.next_billing_date).getTime());

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <LinearGradient colors={[Colors.primaryBg, Colors.background]} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoMark}>
              <Ionicons name="contract" size={20} color={Colors.textWhite} />
            </View>
            <Text style={styles.headerTitle}>SubFlow</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/(tabs)/settings')}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textWhite} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <Text style={styles.subTitle}>{t('calendar.title')}</Text>
            <Text style={styles.mainTitle}>{monthName}</Text>
            <View style={styles.summaryPills}>
              <View style={styles.pill}>
                <Text style={styles.pillLabel}>{t('home.budget')}:</Text>
                <Text style={styles.pillValue}>₩100K</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                <Text style={styles.pillLabel}>{t('calendar.thisMonth')}:</Text>
                <Text style={styles.pillValue}>₩{monthTotal.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* ── 탭 전환 버튼 ── */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'calendar' && styles.tabBtnActive]}
              onPress={() => setActiveTab('calendar')}
            >
              <Ionicons name="calendar" size={16} color={activeTab === 'calendar' ? Colors.primary : Colors.textTertiary} />
              <Text style={[styles.tabBtnText, activeTab === 'calendar' && styles.tabBtnTextActive]}>
                {t('calendar.calendarTab')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'timeline' && styles.tabBtnActive]}
              onPress={() => setActiveTab('timeline')}
            >
              <Ionicons name="git-commit" size={16} color={activeTab === 'timeline' ? Colors.primary : Colors.textTertiary} />
              <Text style={[styles.tabBtnText, activeTab === 'timeline' && styles.tabBtnTextActive]}>
                {t('calendar.timelineTab')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.mainWhiteCard}>
              {activeTab === 'calendar' ? (
                <>
                  {/* 월 네비게이션 */}
                  <View style={styles.monthNav}>
                    <TouchableOpacity onPress={prevMonth}>
                      <Ionicons name="chevron-back" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                      {language === 'ko' ? MONTHS_KO[month] : MONTHS_EN[month]}
                    </Text>
                    <TouchableOpacity onPress={nextMonth}>
                      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weekRow}>
                    {days.map((d, i) => <Text key={i} style={styles.weekDay}>{d}</Text>)}
                  </View>

                  {calendarEvents.loading ? (
                    <ActivityIndicator style={{ padding: 40 }} color={Colors.primary} />
                  ) : (
                    <View style={styles.calGrid}>
                      {calendarDays.map((day, i) => {
                        const hasPayment = day ? paymentMap[day] : null;
                        const isToday = day === todayDay;
                        return (
                          <View key={i} style={styles.calCell}>
                            {day && (
                              <View style={[styles.dayWrap, isToday && styles.todayWrap]}>
                                <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                                {hasPayment && (
                                  <View style={styles.dotRow}>
                                    {hasPayment.map((p: any, j: number) => (
                                      <View key={j} style={[styles.payDot, { backgroundColor: Colors.danger }]} />
                                    ))}
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>{t('calendar.upcoming')}</Text>
                  {upcoming.length > 0 ? upcoming.map((ev: any, i: number) => {
                    const d = new Date(ev.billing_date ?? ev.next_billing_date);
                    const dateStr = language === 'ko'
                      ? `${d.getMonth() + 1}월 ${d.getDate()}일`
                      : `${MONTHS_EN[d.getMonth()]} ${d.getDate()}`;
                    return (
                      <View key={i} style={styles.upcomingItem}>
                        <ServiceLogo name={ev.service_name} size={40} />
                        <View style={styles.upcomingInfo}>
                          <Text style={styles.upcomingName}>{ev.service_name}</Text>
                          <Text style={styles.upcomingDate}>{dateStr}</Text>
                        </View>
                        <Text style={styles.upcomingAmount}>₩{(ev.billing_amount ?? ev.amount ?? 0).toLocaleString()}</Text>
                      </View>
                    );
                  }) : (
                    <Text style={styles.emptyText}>{t('common.noData')}</Text>
                  )}
                </>
              ) : (
                /* ── 타임라인 뷰 ── */
                <>
                  {timeline.loading ? (
                    <ActivityIndicator style={{ padding: 40 }} color={Colors.primary} />
                  ) : timelineData.length > 0 ? (
                    timelineData
                      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((item: any, i: number) => {
                        const date = new Date(item.created_at);
                        const dateStr = language === 'ko'
                          ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
                          : `${MONTHS_EN[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                        const actionIcon = item.action === 'created' ? 'add-circle'
                          : item.action === 'cancelled' ? 'close-circle'
                          : item.action === 'plan_changed' ? 'swap-horizontal-circle' as any
                          : 'ellipse';
                        const actionColor = item.action === 'created' ? Colors.success
                          : item.action === 'cancelled' ? Colors.danger
                          : '#FF9500';
                        return (
                          <View key={item.id ?? i} style={styles.timelineItem}>
                            <View style={styles.timelineLine}>
                              <Ionicons name={actionIcon} size={20} color={actionColor} />
                              {i < timelineData.length - 1 && <View style={styles.timelineConnector} />}
                            </View>
                            <View style={styles.timelineContent}>
                              <View style={styles.timelineRow}>
                                <ServiceLogo name={item.service_name} size={32} />
                                <View style={styles.timelineInfo}>
                                  <Text style={styles.timelineName}>{item.service_name}</Text>
                                  <Text style={styles.timelineDesc}>{item.description ?? item.action}</Text>
                                  <Text style={styles.timelineDate}>{dateStr}</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })
                  ) : (
                    <Text style={styles.emptyText}>{t('calendar.timelineEmpty')}</Text>
                  )}
                </>
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
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textWhite },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  pageHeader: { paddingHorizontal: Spacing.sm, marginBottom: Spacing.xl },
  subTitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium, marginBottom: 4 },
  mainTitle: { fontSize: 42, fontWeight: FontWeight.heavy, color: '#FFF', letterSpacing: -1 },
  summaryPills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  pillValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  cardContainer: { marginTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  mainWhiteCard: { backgroundColor: '#FFF', borderRadius: 40, padding: Spacing.xxl, ...Shadow.md },
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
  upcomingAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.xxl },
  // Tabs
  tabContainer: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBtnActive: {
    backgroundColor: Colors.surface, ...Shadow.sm,
  },
  tabBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textTertiary },
  tabBtnTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  // Timeline
  timelineItem: { flexDirection: 'row', minHeight: 70 },
  timelineLine: { width: 30, alignItems: 'center' },
  timelineConnector: { flex: 1, width: 2, backgroundColor: Colors.borderLight, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: Spacing.lg, paddingLeft: Spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timelineInfo: { flex: 1 },
  timelineName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  timelineDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  timelineDate: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
});
