import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from './GradientButton';
import { useTranslation } from '../hooks/useTranslation';
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';

type Step = {
  icon: keyof typeof Ionicons.glyphMap;
  /** 단계마다 다른 강조색 — 진행하고 있다는 감각을 준다. theme의 등명도 팔레트에서 고름. */
  accent: [string, string];
  titleKo: string;
  titleEn: string;
  /** 설명은 문장 단위로 줄을 나눈다. 한국어는 어절 중간에서 접히면 읽기 나빠서. */
  descKo: string;
  descEn: string;
};

const STEPS: Step[] = [
  {
    icon: 'card',
    accent: [Colors.primary, '#7FB6E6'],
    titleKo: '구독을 한곳에 모아보세요',
    titleEn: 'All your subscriptions in one place',
    descKo: '넷플릭스, 유튜브, 스포티파이처럼\n흩어진 정기 결제를 한 화면에서 관리해요.\n카탈로그에서 고르거나 직접 추가할 수 있어요.',
    descEn: 'Netflix, YouTube, Spotify —\nevery recurring payment on one screen.\nPick from the catalog or add your own.',
  },
  {
    icon: 'bar-chart',
    accent: [Colors.success, '#8AD9A0'],
    titleKo: '지출을 분석하고 절약하세요',
    titleEn: 'Analyse spending and save',
    descKo: '월·연 지출과 카테고리별 비중을\n자동으로 집계해드려요.\n더 저렴한 요금제와 중복 구독도 찾아냅니다.',
    descEn: 'We total your monthly and yearly spend\nand break it down by category.\nThen surface cheaper plans and overlaps.',
  },
  {
    icon: 'people',
    accent: [Colors.accent, '#B3ADF5'],
    titleKo: '가족과 나눠 쓰면 내 몫만',
    titleEn: 'Split with family, pay your share',
    descKo: '함께 쓰는 인원을 입력하면\n1인당 비용으로 계산돼요.\n대시보드에는 내가 실제 내는 금액만 반영됩니다.',
    descEn: 'Tell us how many people share it\nand we split the cost.\nYour dashboard shows only what you pay.',
  },
  {
    icon: 'notifications',
    accent: [Colors.warning, '#F5CE8E'],
    titleKo: '결제 전에 미리 알려드려요',
    titleEn: 'Reminders before you are charged',
    descKo: '다가오는 결제일과 체험 만료,\n가격 변동을 미리 알려드려요.\n자동 갱신도 알아서 처리돼요.',
    descEn: 'Upcoming charges, trial expiries\nand price changes — all ahead of time.\nRenewals are handled for you.',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

export function OnboardingModal({ visible, onClose, onFinish }: Props) {
  const { language } = useTranslation();
  const [step, setStep] = useState(0);
  const isKo = language === 'ko';
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  // 단계가 바뀔 때 내용만 살짝 떠오르게 — 카드는 고정이라 시선이 튀지 않는다.
  const fade = useRef(new Animated.Value(1)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0);
    rise.setValue(10);
    pop.setValue(0.86);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [step, fade, rise, pop]);

  const handleNext = () => {
    if (isLast) {
      onFinish?.();
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={38} tint="light" style={styles.sheet}>
          {/* 유리판 위에 얹은 옅은 흰 막 — 글자 대비를 확보하면서 뒤가 비친다 */}
          <View style={styles.sheetTint} pointerEvents="none" />

          <View style={styles.topRow}>
            <Text style={styles.counter}>
              {step + 1} / {STEPS.length}
            </Text>
            <TouchableOpacity style={styles.skip} onPress={onClose} hitSlop={10}>
              <Text style={styles.skipText}>{isKo ? '건너뛰기' : 'Skip'}</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: pop }] }}>
              <LinearGradient colors={current.accent} style={styles.iconCircle}>
                <Ionicons name={current.icon} size={36} color="#FFF" />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title}>{isKo ? current.titleKo : current.titleEn}</Text>
            <Text style={styles.desc}>{isKo ? current.descKo : current.descEn}</Text>
          </Animated.View>

          <View style={styles.dots}>
            {STEPS.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => setStep(i)} hitSlop={8}>
                <View
                  style={[
                    styles.dot,
                    i === step && [styles.dotActive, { backgroundColor: s.accent[0] }],
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <GradientButton
            label={isLast ? (isKo ? '구독 추가하러 가기' : 'Add a subscription') : isKo ? '다음' : 'Next'}
            icon={isLast ? 'add' : 'arrow-forward'}
            variant="primary"
            size="lg"
            onPress={handleNext}
          />

          <TouchableOpacity
            style={[styles.prev, step === 0 && styles.prevHidden]}
            onPress={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            hitSlop={8}
          >
            <Text style={styles.prevText}>{isKo ? '이전' : 'Back'}</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18,32,50,0.42)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheet: {
    borderRadius: 30,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.60)' },

  topRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.4,
  },
  skip: { padding: 4 },
  skipText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },

  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  desc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: Spacing.md,
    maxWidth: 320,
  },

  dots: { flexDirection: 'row', gap: 6, marginVertical: Spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(55,75,92,0.16)' },
  dotActive: { width: 22 },

  prev: { marginTop: Spacing.md, padding: 8 },
  prevHidden: { opacity: 0 },
  prevText: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
});
