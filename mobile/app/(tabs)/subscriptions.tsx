import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Pressable, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from '../../src/hooks/useTranslation';
import { ServiceLogo } from '../../src/components/ServiceLogo';
import { useSubscriptions } from '../../src/hooks/useApi';
import { subscriptionAPI, servicesAPI } from '../../src/services/api';
import { Colors, Spacing, FontSize, FontWeight, Shadow } from '../../src/constants/theme';

type FilterType = 'all' | 'active' | 'paused' | 'cancelled';

const MOCK_SUBSCRIPTIONS = [
  { id: '1', name: 'Netflix', plan: 'Premium', amount: 17000, cycle: 'monthly', nextDate: '2026-04-07', status: 'active' as const, category: 'Entertainment', cancelUrl: 'https://www.netflix.com/cancelplan' },
  { id: '2', name: 'Spotify', plan: 'Individual', amount: 10900, cycle: 'monthly', nextDate: '2026-04-12', status: 'active' as const, category: 'Music', cancelUrl: 'https://www.spotify.com/account/subscription/' },
  { id: '3', name: 'YouTube Premium', plan: 'Family', amount: 14900, cycle: 'monthly', nextDate: '2026-04-15', status: 'active' as const, category: 'Entertainment', cancelUrl: 'https://myaccount.google.com/subscriptions' },
  { id: '4', name: 'iCloud+', plan: '200GB', amount: 3900, cycle: 'monthly', nextDate: '2026-04-20', status: 'active' as const, category: 'Cloud', cancelUrl: 'https://support.apple.com/ko-kr/118428' },
  { id: '5', name: 'ChatGPT Plus', plan: 'Plus', amount: 26000, cycle: 'monthly', nextDate: '2026-04-22', status: 'paused' as const, category: 'AI', cancelUrl: 'https://chatgpt.com/settings/subscription' },
  { id: '6', name: 'Adobe CC', plan: 'Photography', amount: 13200, cycle: 'monthly', nextDate: '—', status: 'cancelled' as const, category: 'Design', cancelUrl: 'https://account.adobe.com/plans' },
];

const statusKeys: Record<string, { labelKey: 'common.active' | 'common.paused' | 'common.cancelled'; color: string }> = {
  active: { labelKey: 'common.active', color: Colors.success },
  paused: { labelKey: 'common.paused', color: '#FF9500' },
  cancelled: { labelKey: 'common.cancelled', color: Colors.danger },
};

type Sub = typeof MOCK_SUBSCRIPTIONS[0];

// 서비스별 플랜 목록 (Mock fallback)
const MOCK_SERVICE_PLANS: Record<string, { name: string; price: number; cycle: string }[]> = {
  'Netflix': [
    { name: '광고형 스탠다드', price: 7000, cycle: 'monthly' },
    { name: '스탠다드', price: 13500, cycle: 'monthly' },
    { name: '프리미엄', price: 17000, cycle: 'monthly' },
  ],
  'Spotify': [
    { name: 'Individual', price: 10900, cycle: 'monthly' },
    { name: 'Duo', price: 14900, cycle: 'monthly' },
    { name: 'Family', price: 16900, cycle: 'monthly' },
    { name: 'Student', price: 5900, cycle: 'monthly' },
  ],
  'YouTube Premium': [
    { name: 'Lite', price: 8500, cycle: 'monthly' },
    { name: '개인', price: 14900, cycle: 'monthly' },
    { name: '가족', price: 23900, cycle: 'monthly' },
  ],
  'iCloud+': [
    { name: '50GB', price: 1300, cycle: 'monthly' },
    { name: '200GB', price: 3900, cycle: 'monthly' },
    { name: '2TB', price: 13000, cycle: 'monthly' },
    { name: '6TB', price: 39000, cycle: 'monthly' },
    { name: '12TB', price: 78000, cycle: 'monthly' },
  ],
  'ChatGPT Plus': [
    { name: 'Free', price: 0, cycle: 'monthly' },
    { name: 'Plus', price: 26000, cycle: 'monthly' },
    { name: 'Pro', price: 260000, cycle: 'monthly' },
  ],
  'Adobe CC': [
    { name: 'Photography', price: 13200, cycle: 'monthly' },
    { name: 'Single App', price: 30800, cycle: 'monthly' },
    { name: 'All Apps', price: 75900, cycle: 'monthly' },
  ],
};

// 캘린더 헬퍼
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
const CAL_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const CAL_DAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SubscriptionsScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { t, language } = useTranslation();
  const subsQuery = useSubscriptions();

  // 모달 상태
  const [selectedSub, setSelectedSub] = useState<Sub | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editDate, setEditDate] = useState('');
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 플랜 선택 모달 상태
  const [planPickerVisible, setPlanPickerVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; cycle: string } | null>(null);
  const [servicePlans, setServicePlans] = useState<{ name: string; price: number; cycle: string }[]>([]);

  // 날짜 선택 캘린더 상태
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const apiSubs = (subsQuery.data as any[]) ?? [];
  const allSubs: Sub[] = apiSubs.length > 0
    ? apiSubs.map((s: any) => ({
        id: String(s.id), name: s.service_name ?? s.name ?? 'Unknown',
        plan: s.plan_name ?? '-', amount: s.billing_amount ?? s.amount ?? 0,
        cycle: s.billing_cycle ?? 'monthly', nextDate: s.next_billing_date ?? '—',
        status: (s.status ?? 'active') as any, category: s.category_name ?? '',
        cancelUrl: s.cancel_url ?? '',
      }))
    : MOCK_SUBSCRIPTIONS;

  const filtered = filter === 'all' ? allSubs : allSubs.filter(s => s.status === filter);
  const total = allSubs.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);

  const openModal = (sub: Sub) => {
    setSelectedSub(sub);
    setEditDate(sub.nextDate);
    setSelectedPlan(null);
    setPlanPickerVisible(false);
    setDatePickerVisible(false);
    setModalVisible(true);

    // 날짜 파싱하여 캘린더 초기화
    if (sub.nextDate && sub.nextDate !== '—') {
      const d = new Date(sub.nextDate);
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    } else {
      const now = new Date();
      setCalYear(now.getFullYear());
      setCalMonth(now.getMonth());
    }

    // 서비스 플랜 로드 (API 시도 → Mock fallback)
    const mockPlans = MOCK_SERVICE_PLANS[sub.name] ?? [];
    setServicePlans(mockPlans);
    // API에서 서비스 플랜 가져오기 시도
    servicesAPI.search(sub.name).then(res => {
      const services = res.data?.services ?? res.data ?? [];
      const matched = services.find?.((s: any) => s.name === sub.name);
      if (matched?.plans?.length > 0) {
        setServicePlans(matched.plans.map((p: any) => ({
          name: p.name, price: Number(p.price), cycle: p.billing_cycle?.toLowerCase() ?? 'monthly',
        })));
      }
    }).catch(() => {});

    fadeAnim.setValue(0);
    slideAnim.setValue(600);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }),
    ]).start(() => { setModalVisible(false); setSelectedSub(null); setPlanPickerVisible(false); setDatePickerVisible(false); });
  };

  // 캘린더 데이터
  const calDaysInMonth = getDaysInMonth(calYear, calMonth);
  const calFirstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarCells: (number | null)[] = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < calFirstDay; i++) cells.push(null);
    for (let i = 1; i <= calDaysInMonth; i++) cells.push(i);
    return cells;
  }, [calYear, calMonth, calDaysInMonth, calFirstDay]);

  const calPrevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const calNextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  // 선택된 날짜의 day 파싱
  const selectedDay = useMemo(() => {
    if (!editDate || editDate === '—') return -1;
    const d = new Date(editDate);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) return d.getDate();
    return -1;
  }, [editDate, calYear, calMonth]);

  const handleDateSelect = (day: number) => {
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setEditDate(`${calYear}-${mm}-${dd}`);
    setDatePickerVisible(false);
  };

  const handleCancel = () => {
    if (!selectedSub) return;
    const msg = language === 'ko' ? `${selectedSub.name} 구독을 해지할까요?` : `Cancel ${selectedSub.name} subscription?`;
    Alert.alert(language === 'ko' ? '구독 해지' : 'Cancel Subscription', msg, [
      { text: language === 'ko' ? '취소' : 'No', style: 'cancel' },
      { text: language === 'ko' ? '해지' : 'Yes', style: 'destructive', onPress: async () => {
        try { await subscriptionAPI.cancel(selectedSub.id); } catch {}
        closeModal();
        subsQuery.refetch();
      }},
    ]);
  };

  const handleDelete = () => {
    if (!selectedSub) return;
    const msg = language === 'ko' ? `${selectedSub.name}을(를) 삭제할까요?` : `Delete ${selectedSub.name}?`;
    Alert.alert(language === 'ko' ? '삭제' : 'Delete', msg, [
      { text: language === 'ko' ? '취소' : 'No', style: 'cancel' },
      { text: language === 'ko' ? '삭제' : 'Delete', style: 'destructive', onPress: async () => {
        try { await subscriptionAPI.cancel(selectedSub.id); } catch {}
        closeModal();
        subsQuery.refetch();
      }},
    ]);
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
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/catalog')}>
              <Ionicons name="add" size={24} color={Colors.textWhite} />
            </TouchableOpacity>
            <View style={styles.headerAvatar}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <Text style={styles.subTitle}>{t('subs.subtitle')}</Text>
            <Text style={styles.mainTitle}>{t('subs.title')}</Text>
            <View style={styles.summaryPills}>
              <View style={styles.pill}>
                <Text style={styles.pillLabel}>Active:</Text>
                <Text style={styles.pillValue}>{allSubs.filter(s => s.status === 'active').length}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                <Text style={styles.pillLabel}>Monthly Total:</Text>
                <Text style={styles.pillValue}>₩{total.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {(['all', 'active', 'paused', 'cancelled'] as FilterType[]).map(f => (
                <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                    {f === 'all' ? t('common.all') : t(statusKeys[f]?.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.mainWhiteCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{t('subs.title')}</Text>
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textTertiary} />
              </View>

              {filtered.map((sub, i) => (
                <TouchableOpacity key={sub.id} style={[styles.subItem, i > 0 && styles.itemBorder]} onPress={() => openModal(sub)} activeOpacity={0.6}>
                  <ServiceLogo name={sub.name} size={48} />
                  <View style={styles.subInfo}>
                    <Text style={styles.subName}>{sub.name}</Text>
                    <Text style={styles.subDetail}>{sub.plan} · {sub.category}</Text>
                  </View>
                  <View style={styles.subRight}>
                    <Text style={styles.subAmount}>₩{sub.amount.toLocaleString()}</Text>
                    <Text style={styles.subDate}>{sub.nextDate}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {filtered.length === 0 && (
                <Text style={styles.emptyText}>{t('common.noData')}</Text>
              )}
            </View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── 구독 상세 모달 ── */}
      {modalVisible && selectedSub && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          </Animated.View>
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ maxHeight: 600 }}>

            {/* 서비스 정보 */}
            <View style={styles.modalHeader}>
              <ServiceLogo name={selectedSub.name} size={56} />
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalName}>{selectedSub.name}</Text>
                <Text style={styles.modalDetail}>{selectedSub.plan} · {selectedSub.category}</Text>
                <View style={[styles.modalStatusBadge, { backgroundColor: statusKeys[selectedSub.status]?.color + '20' }]}>
                  <Text style={[styles.modalStatusText, { color: statusKeys[selectedSub.status]?.color }]}>
                    {t(statusKeys[selectedSub.status]?.labelKey)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 결제 정보 - 월 비용 클릭 시 플랜 선택 */}
            <View style={styles.modalInfoRow}>
              <TouchableOpacity
                style={[styles.modalInfoItem, servicePlans.length > 0 && styles.modalInfoItemTappable]}
                onPress={() => { if (servicePlans.length > 0) setPlanPickerVisible(!planPickerVisible); }}
                activeOpacity={servicePlans.length > 0 ? 0.6 : 1}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.modalInfoLabel}>{language === 'ko' ? '월 비용' : 'Monthly'}</Text>
                  {servicePlans.length > 0 && (
                    <Ionicons name={planPickerVisible ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.primary} />
                  )}
                </View>
                <Text style={styles.modalInfoValue}>
                  ₩{(selectedPlan ? selectedPlan.price : selectedSub.amount).toLocaleString()}
                </Text>
                {selectedPlan && (
                  <Text style={{ fontSize: FontSize.xs, color: Colors.primary, marginTop: 2 }}>{selectedPlan.name}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.modalInfoItem}>
                <Text style={styles.modalInfoLabel}>{language === 'ko' ? '결제 주기' : 'Cycle'}</Text>
                <Text style={styles.modalInfoValue}>{selectedPlan?.cycle ?? selectedSub.cycle}</Text>
              </View>
            </View>

            {/* 플랜 선택 드롭다운 */}
            {planPickerVisible && servicePlans.length > 0 && (
              <View style={styles.planPicker}>
                <Text style={styles.planPickerTitle}>
                  {language === 'ko' ? `${selectedSub.name} 구독 플랜` : `${selectedSub.name} Plans`}
                </Text>
                {servicePlans.map((plan, i) => {
                  const isCurrentPlan = !selectedPlan
                    ? (plan.price === selectedSub.amount && (plan.name === selectedSub.plan || plan.cycle === selectedSub.cycle))
                    : plan.name === selectedPlan.name;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.planItem, isCurrentPlan && styles.planItemActive]}
                      onPress={() => {
                        setSelectedPlan(plan);
                        setPlanPickerVisible(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.planName, isCurrentPlan && { color: Colors.primary }]}>{plan.name}</Text>
                        <Text style={styles.planCycle}>{plan.cycle}</Text>
                      </View>
                      <Text style={[styles.planPrice, isCurrentPlan && { color: Colors.primary }]}>
                        ₩{plan.price.toLocaleString()}
                      </Text>
                      {isCurrentPlan && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 결제일 수정 - 날짜 클릭 시 캘린더 표시 */}
            <View style={styles.modalEditRow}>
              <Text style={styles.modalEditLabel}>{language === 'ko' ? '다음 결제일' : 'Next Payment'}</Text>
              <TouchableOpacity
                style={styles.modalEditInput}
                onPress={() => setDatePickerVisible(!datePickerVisible)}
                activeOpacity={0.6}
              >
                <Text style={{ fontSize: FontSize.md, color: editDate && editDate !== '—' ? Colors.textPrimary : Colors.textTertiary }}>
                  {editDate && editDate !== '—' ? editDate : 'YYYY-MM-DD'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* 인라인 캘린더 날짜 선택기 */}
            {datePickerVisible && (
              <View style={styles.calendarPicker}>
                <View style={styles.calNav}>
                  <TouchableOpacity onPress={calPrevMonth}>
                    <Ionicons name="chevron-back" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                  <Text style={styles.calNavTitle}>
                    {language === 'ko' ? `${calYear}년 ${MONTHS_KO[calMonth]}` : `${MONTHS_EN[calMonth]} ${calYear}`}
                  </Text>
                  <TouchableOpacity onPress={calNextMonth}>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.calWeekRow}>
                  {(language === 'ko' ? CAL_DAYS_KO : CAL_DAYS_EN).map((d, i) => (
                    <Text key={i} style={styles.calWeekDay}>{d}</Text>
                  ))}
                </View>
                <View style={styles.calGrid}>
                  {calendarCells.map((day, i) => {
                    const isSelected = day === selectedDay;
                    const today = new Date();
                    const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                    return (
                      <View key={i} style={styles.calCell}>
                        {day && (
                          <TouchableOpacity
                            style={[styles.calDayBtn, isSelected && styles.calDaySelected, isToday && !isSelected && styles.calDayToday]}
                            onPress={() => handleDateSelect(day)}
                          >
                            <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected, isToday && !isSelected && { color: Colors.primary }]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 액션 버튼들 */}
            <View style={styles.modalActions}>
              {selectedSub.status === 'active' && (
                <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#FF9500' }]} onPress={() => {
                  if (selectedSub.cancelUrl) Linking.openURL(selectedSub.cancelUrl);
                  else handleCancel();
                }}>
                  <Ionicons name="open-outline" size={18} color="#FFF" />
                  <Text style={[styles.modalActionText, { color: '#FFF' }]}>
                    {language === 'ko' ? '구독 해지' : 'Cancel Sub'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: Colors.danger }]} onPress={handleDelete}>
                <Ionicons name="trash" size={18} color="#FFF" />
                <Text style={[styles.modalActionText, { color: '#FFF' }]}>
                  {language === 'ko' ? '삭제' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 저장 버튼 */}
            <TouchableOpacity style={styles.modalSaveBtn} onPress={async () => {
              try {
                const updateData: Record<string, unknown> = {};
                if (editDate && editDate !== '—' && editDate !== selectedSub.nextDate) {
                  updateData.next_billing_date = editDate;
                }
                if (selectedPlan) {
                  updateData.cost = selectedPlan.price;
                  updateData.billing_cycle = selectedPlan.cycle;
                  updateData.plan_name = selectedPlan.name;
                }
                if (Object.keys(updateData).length > 0) {
                  await subscriptionAPI.update(selectedSub.id, updateData);
                }
              } catch {}
              closeModal();
              subsQuery.refetch();
            }}>
              <Text style={styles.modalSaveBtnText}>{language === 'ko' ? '저장' : 'Save'}</Text>
            </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textWhite },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  pageHeader: { paddingHorizontal: Spacing.sm, marginBottom: Spacing.xl },
  subTitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium, marginBottom: 4 },
  mainTitle: { fontSize: 42, fontWeight: FontWeight.heavy, color: Colors.textWhite, letterSpacing: -1 },
  summaryPills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  pillValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.bold },
  filterContainer: { marginBottom: Spacing.lg },
  filterScroll: { paddingHorizontal: Spacing.sm, gap: Spacing.sm },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  filterPillActive: { backgroundColor: Colors.surface, borderColor: Colors.surface },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textWhite },
  filterTextActive: { color: Colors.textPrimary },
  cardContainer: { marginTop: Spacing.sm, paddingHorizontal: Spacing.sm },
  mainWhiteCard: { backgroundColor: Colors.surface, borderRadius: 40, padding: Spacing.xxl, ...Shadow.md, minHeight: 300 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg },
  itemBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  subInfo: { flex: 1, marginLeft: Spacing.md },
  subName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subDetail: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  subRight: { alignItems: 'flex-end' },
  subAmount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subDate: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.textTertiary, fontSize: FontSize.sm },
  // ── Modal ──
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: Spacing.xxl, paddingBottom: 100 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, alignSelf: 'center', marginTop: 12, marginBottom: Spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xl },
  modalHeaderInfo: { flex: 1 },
  modalName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalDetail: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  modalStatusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
  modalStatusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  modalInfoRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  modalInfoItem: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: 14 },
  modalInfoLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 4 },
  modalInfoValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalEditRow: { marginBottom: Spacing.lg },
  modalEditLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: 8 },
  modalEditInput: { backgroundColor: Colors.surfaceLight, borderRadius: 12, paddingHorizontal: 16, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalInfoItemTappable: { borderWidth: 1.5, borderColor: Colors.primaryLight },
  // 플랜 선택
  planPicker: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: 14, marginBottom: Spacing.lg },
  planPickerTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: Spacing.md },
  planItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  planItemActive: { backgroundColor: Colors.primaryLight },
  planName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  planCycle: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  planPrice: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  // 캘린더 날짜 선택
  calendarPicker: { backgroundColor: Colors.surfaceLight, borderRadius: 16, padding: 14, marginBottom: Spacing.lg },
  calNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: Spacing.md },
  calNavTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  calWeekRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: FontWeight.heavy, color: Colors.textTertiary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calDayBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  calDaySelected: { backgroundColor: Colors.primary },
  calDayToday: { backgroundColor: Colors.primarySoft },
  calDayText: { fontSize: 13, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  calDayTextSelected: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  modalActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  modalActionText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  modalSaveBtn: { backgroundColor: Colors.primary, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', ...Shadow.sm },
  modalSaveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
});
