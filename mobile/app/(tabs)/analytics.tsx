import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../src/constants/theme';

// 밀집된 바 차트 컴포넌트
function DensityBarChart() {
  const data = Array.from({ length: 40 }, (_, i) => {
    let type = 'normal';
    // 몇몇 바는 약간 붉은색(open/warning)
    if (i === 12 || i === 18) type = 'warning';
    
    return {
      height: Math.random() * 60 + 10,
      type,
    };
  });

  return (
    <View style={chartStyles.container}>
      {data.map((bar, i) => (
        <View key={i} style={chartStyles.barWrap}>
          <View
            style={[
              chartStyles.bar,
              { 
                height: bar.height, 
                backgroundColor: bar.type === 'warning' ? '#FFA07A' : '#AEEA00',
                opacity: bar.type === 'normal' ? 0.6 : 1
              },
            ]}
          />
        </View>
      ))}
      <View style={chartStyles.baseline} />
      {/* 둥근 아이콘 마커들 (대략적인 위치) */}
      <View style={[chartStyles.marker, { left: '15%', bottom: 20 }]}>
        <Ionicons name="arrow-up-circle" size={14} color="#AEEA00" />
      </View>
      <View style={[chartStyles.marker, { left: '45%', bottom: 30 }]}>
        <Ionicons name="alert-circle" size={14} color="#FFA07A" />
      </View>
      <View style={[chartStyles.marker, { right: '20%', bottom: 40 }]}>
        <Ionicons name="arrow-up-circle" size={14} color="#AEEA00" />
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
    position: 'relative'
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 2,
    borderRadius: 1,
  },
  baseline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  marker: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 7,
  }
});

export default function AnalyticsScreen() {
  return (
    <LinearGradient
      colors={[Colors.primaryBg, Colors.background]}
      style={styles.container}
    >
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
          {/* 상단 그래프 카드 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Ionicons name="briefcase" size={20} color={Colors.textPrimary} />
                <Text style={styles.cardTitle}>On-Time Month Closures</Text>
              </View>
              <View style={styles.roundArrowBtn}>
                <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
              </View>
            </View>

            <Text style={styles.subText}>Typical Account Metrics</Text>
            <Text style={styles.largePercent}>77,24%</Text>

            <DensityBarChart />

            {/* 통계 요약 */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>88 <Ionicons name="checkmark-circle" size={12} color="#AEEA00" /></Text>
                <Text style={styles.statLabel}>Closed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>19 <Ionicons name="warning" size={12} color="#FFA07A" /></Text>
                <Text style={styles.statLabel}>Open</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>19/5 <Ionicons name="close-circle" size={12} color="#FFD54F" /></Text>
                <Text style={styles.statLabel}>Timely</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>84/0 <Ionicons name="ellipse" size={12} color="#AEEA00" /></Text>
                <Text style={styles.statLabel}>On Time</Text>
              </View>
            </View>
          </View>

          {/* AI Assistant 구역 */}
          <View style={styles.aiCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Ionicons name="sparkles" size={20} color={Colors.textPrimary} />
                <Text style={styles.cardTitle}>AI Assistant</Text>
              </View>
              <View style={{flexDirection: 'row', gap: 8}}>
                <View style={styles.roundArrowBtn}>
                  <Ionicons name="document-text" size={16} color={Colors.textPrimary} />
                </View>
                <View style={styles.roundArrowBtn}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                </View>
              </View>
            </View>

            {/* AI 채팅 내용 */}
            <View style={styles.chatContainer}>
              {/* AI의 메세지 */}
              <View style={styles.messageRow}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="color-wand" size={16} color={Colors.textWhite} />
                </View>
                <View style={styles.aiBubble}>
                  <Text style={styles.chatText}>Please upload a PDF for data processing.</Text>
                </View>
                <Text style={styles.chatTime}>10:57</Text>
              </View>

              {/* 내 메세지 */}
              <View style={[styles.messageRow, { justifyContent: 'flex-end', marginTop: Spacing.xl }]}>
                <Text style={styles.chatTime}>10:59</Text>
                <View style={styles.myBubble}>
                  <Text style={[styles.chatText, { color: Colors.textPrimary }]}>
                    Sure, I'm uploading the document now. Let me know...
                  </Text>
                </View>
                <View style={styles.myAvatar}>
                  <Ionicons name="person" size={16} color={Colors.textWhite} />
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 160 }} />
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  
  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 40,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  roundArrowBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  subText: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.lg },
  largePercent: { fontSize: 48, fontWeight: FontWeight.heavy, color: Colors.textPrimary, letterSpacing: -1.5, marginTop: -4 },
  
  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
  },
  statItem: { alignItems: 'flex-start' },
  statNumber: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },

  // AI Card
  aiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 40,
    padding: Spacing.xxl,
    ...Shadow.md,
    minHeight: 250,
  },
  chatContainer: {
    marginTop: Spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#C5D6E6',
    justifyContent: 'center', alignItems: 'center',
  },
  aiBubble: {
    flex: 1,
  },
  myAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFB8A1',
    justifyContent: 'center', alignItems: 'center',
  },
  myBubble: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '70%',
  },
  chatText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  chatTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
});
