import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useBottomSheet } from '../hooks/useBottomSheet';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useNews, NewsItem } from '../hooks/useApi';
import { newsAPI } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

function isAiItem(item: NewsItem) {
  return item.category === 'AI Updates';
}

function formatDate(raw: string, locale: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── 전체폭 뉴스 카드 (모달 리스트용) ──
function NewsCard({ item, onPress }: { item: NewsItem; onPress: () => void }) {
  const { t } = useTranslation();
  const ai = isAiItem(item);
  const label = ai ? t('news.aiLabel') : t('news.priceLabel');

  const Inner = (
    <>
      <View style={styles.cardTop}>
        <View style={[styles.chip, ai ? styles.chipAi : styles.chipPrice]}>
          <Ionicons
            name={ai ? 'sparkles' : 'trending-up'}
            size={11}
            color={ai ? '#FFFFFF' : Colors.primaryText}
          />
          <Text style={[styles.chipText, { color: ai ? '#FFFFFF' : Colors.primaryText }]}>
            {label}
          </Text>
        </View>
        {item.matched && (
          <View style={styles.matchedChip}>
            <Text style={styles.matchedText}>{t('news.mine')}</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.cardTitle, { color: ai ? '#FFFFFF' : Colors.textPrimary }]}
        numberOfLines={3}
      >
        {item.title}
      </Text>

      <View style={styles.cardFooter}>
        <Text
          style={[styles.cardSource, { color: ai ? 'rgba(255,255,255,0.7)' : Colors.textTertiary }]}
          numberOfLines={1}
        >
          {item.source}
        </Text>
        <View style={[styles.openDot, { backgroundColor: ai ? 'rgba(255,255,255,0.2)' : Colors.surfaceLight }]}>
          <Ionicons name="chevron-forward" size={13} color={ai ? '#FFFFFF' : Colors.textSecondary} />
        </View>
      </View>
    </>
  );

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.cardShadow}>
      {ai ? (
        <LinearGradient
          colors={['#3730A3', '#1E293B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {Inner}
        </LinearGradient>
      ) : (
        <View style={[styles.card, styles.cardPrice]}>{Inner}</View>
      )}
    </TouchableOpacity>
  );
}

// ── AI 요약 바텀시트 ──
function NewsSheet({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const { t, language } = useTranslation();
  // 이 시트는 열릴 때만 그려지므로(부모가 조건부 렌더) visible은 항상 true다.
  const detailSheet = useBottomSheet(true, onClose);
  const ai = isAiItem(item);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<'loading' | 'ai' | 'unavailable'>('loading');

  React.useEffect(() => {
    let alive = true;
    setMode('loading');
    newsAPI
      .getSummary(item)
      .then((res) => {
        if (!alive) return;
        const data = res.data as { summary?: string | null; mode?: string };
        if (data.mode === 'ai' && data.summary) {
          setSummary(data.summary);
          setMode('ai');
        } else {
          setMode('unavailable');
        }
      })
      .catch(() => {
        if (alive) setMode('unavailable');
      });
    return () => {
      alive = false;
    };
  }, [item]);

  // 부모(카드뉴스 목록 시트) 안에 Modal을 또 띄우면, 이 시트를 끌 때 목록 시트의
  // PanResponder까지 같이 걸려 뒤에 있는 목록이 함께 내려간다. 어차피 부모가
  // 이미 Modal 안이므로 여기서는 화면을 덮는 보통 View로 그린다.
  return (
    <View style={[StyleSheet.absoluteFill, sheet.overlay]}>
      <Animated.View style={[sheet.backdrop, { opacity: detailSheet.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={detailSheet.close} />
      </Animated.View>
      <Animated.View style={[sheet.container, detailSheet.style]} {...detailSheet.panHandlers}>
        <View style={sheet.handle} />

        <View style={sheet.headerRow}>
          <View style={[sheet.labelChip, ai ? sheet.labelChipAi : sheet.labelChipPrice]}>
            <Ionicons
              name={ai ? 'sparkles' : 'trending-up'}
              size={12}
              color={ai ? '#FFFFFF' : Colors.primaryText}
            />
            <Text style={[sheet.labelText, { color: ai ? '#FFFFFF' : Colors.primaryText }]}>
              {ai ? t('news.aiLabel') : t('news.priceLabel')}
            </Text>
          </View>
          {item.matched && (
            <View style={styles.matchedChip}>
              <Text style={styles.matchedText}>{t('news.mine')}</Text>
            </View>
          )}
        </View>

        <Text style={sheet.title}>{item.title}</Text>
        <Text style={sheet.meta}>
          {item.source}
          {formatDate(item.pub_date, language) ? ` · ${formatDate(item.pub_date, language)}` : ''}
        </Text>

        <View style={sheet.summaryBox}>
          {mode === 'loading' && (
            <View style={sheet.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={sheet.loadingText}>{t('news.summarizing')}</Text>
            </View>
          )}
          {mode === 'ai' && (
            <>
              <View style={sheet.aiBadge}>
                <Text style={sheet.aiBadgeText}>{t('news.aiSummary')}</Text>
              </View>
              <Text style={sheet.summaryText}>{summary}</Text>
            </>
          )}
          {mode === 'unavailable' && (
            <Text style={sheet.summaryText}>
              {ai ? t('news.unavailableAi') : t('news.unavailablePrice')}
            </Text>
          )}
        </View>

        <View style={sheet.footer}>
          <Text style={sheet.footerSource}>
            {t('news.source')} · {item.source}
          </Text>
          <TouchableOpacity
            style={sheet.readBtn}
            activeOpacity={0.85}
            onPress={() => {
              Linking.openURL(item.link).catch(() => {});
            }}
          >
            <Text style={sheet.readBtnText}>{t('news.readOriginal')}</Text>
            <Ionicons name="open-outline" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ── 카드뉴스 전체 모달 (제목 옆 아이콘으로 오픈) ──
export function NewsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useNews();
  const [selected, setSelected] = React.useState<NewsItem | null>(null);

  const items = data?.items ?? [];

  // 모달을 열 때마다 최신 소식으로 갱신
  React.useEffect(() => {
    if (visible) refetch();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // 이 시트는 오른쪽 위 X로만 닫는다. 쓸어 닫기를 붙였더니 안에서 연 AI 요약
    // 시트를 내릴 때 이쪽 제스처까지 걸려 목록이 함께 사라졌다.
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      // 안드로이드 뒤로가기: 상세가 열려 있으면 상세만 닫는다
      onRequestClose={() => (selected ? setSelected(null) : onClose())}
    >
      <View style={styles.modalShell}>
        <View style={styles.modalShell}>
          <BlurView intensity={38} tint="light" style={styles.modalRoot}>
        {/* 가독성 확보용 옅은 틴트 (배경 홈이 비쳐 보이도록 반투명) */}
        <View style={styles.modalTint} />
        <SafeAreaView edges={['top']} style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Image
                source={require('../../assets/brand/subflow-mark-black.png')}
                style={styles.modalTitleMark}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>{t('news.section')}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading && !data ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={30} color={Colors.textTertiary} />
              <Text style={styles.stateText}>{t('news.error')}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.stateBox}>
              <Ionicons name="newspaper-outline" size={30} color={Colors.textTertiary} />
              <Text style={styles.stateText}>{t('news.empty')}</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item, idx) => (
                <NewsCard key={`${item.title}-${idx}`} item={item} onPress={() => setSelected(item)} />
              ))}
            </ScrollView>
          )}

          </SafeAreaView>
          </BlurView>
        </View>

        {/* 상세 시트는 목록 껍데기 바깥에 둔다 — 안에 두면 목록의 변형을 물려받는다 */}
        {selected && <NewsSheet item={selected} onClose={() => setSelected(null)} />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 제스처와 애니메이션을 받는 바깥 껍데기. BlurView에 transform을 직접 걸면
  // 안드로이드에서 블러가 어긋나므로 한 겹 감싼다.
  modalShell: { flex: 1 },
  // ── Modal shell (frosted glass) ──
  // 아래에서 올라오는 시트라 윗모서리만 둥글게 깎는다.
  modalRoot: {
    flex: 1,
    marginTop: 44,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(226,239,250,0.30)',
  },
  modalSafe: { flex: 1 },
  modalTitleMark: { width: 21, height: 22 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  stateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  // ── Card ──
  cardShadow: {
    ...Shadow.md,
    borderRadius: BorderRadius.xxxl,
  },
  card: {
    width: '100%',
    borderRadius: BorderRadius.xxxl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardPrice: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  chipAi: { backgroundColor: 'rgba(255,255,255,0.18)' },
  chipPrice: { backgroundColor: Colors.primarySoftBg },
  chipText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  matchedChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
  },
  matchedText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSource: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    flex: 1,
    marginRight: 8,
  },
  openDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.xxl,
    paddingBottom: Spacing.xxxl + Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  labelChipAi: { backgroundColor: Colors.textPrimary },
  labelChipPrice: { backgroundColor: Colors.primarySoftBg },
  labelText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 8,
    fontWeight: FontWeight.medium,
  },
  summaryBox: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySoftBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.primaryText,
  },
  summaryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerSource: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    flex: 1,
    marginRight: Spacing.md,
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  readBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
});
