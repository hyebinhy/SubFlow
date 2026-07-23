import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from './GradientButton';
import { useTranslation } from '../hooks/useTranslation';
import { Colors, Spacing, FontSize, FontWeight } from '../constants/theme';

type Step = { icon: keyof typeof Ionicons.glyphMap; titleKo: string; titleEn: string; descKo: string; descEn: string };

const STEPS: Step[] = [
  {
    icon: 'card',
    titleKo: '구독을 한곳에 모아보세요',
    titleEn: 'All your subscriptions in one place',
    descKo: '넷플릭스, 유튜브, 스포티파이처럼 흩어진 정기 결제를 한 화면에서 관리해요. 카탈로그에서 고르거나 직접 추가할 수 있어요.',
    descEn: 'Manage scattered recurring payments like Netflix, YouTube and Spotify in one screen. Pick from the catalog or add your own.',
  },
  {
    icon: 'bar-chart',
    titleKo: '지출을 분석하고 절약하세요',
    titleEn: 'Analyze spending and save',
    descKo: '월·연 지출과 카테고리별 비중을 자동 집계하고, 더 저렴한 요금제나 중복 구독을 찾아 절약 힌트를 드려요.',
    descEn: 'We total your monthly/yearly spend, break it down by category, and surface cheaper plans and overlaps.',
  },
  {
    icon: 'people',
    titleKo: '가족과 나눠 쓰면 내 몫만',
    titleEn: 'Split with family, pay your share',
    descKo: '함께 쓰는 인원을 입력하면 1인당 비용으로 계산돼요. 대시보드·분석에는 내가 실제 부담하는 금액만 반영됩니다.',
    descEn: 'Set how many people share a subscription and we compute your per-person cost. Dashboards reflect only your share.',
  },
  {
    icon: 'notifications',
    titleKo: '결제 전에 미리 알려드려요',
    titleEn: 'Reminders before you are charged',
    descKo: '다가오는 결제일과 체험 만료, 가격 변동을 알림으로 확인하세요. 자동 갱신도 알아서 처리돼요.',
    descEn: 'Get notified about upcoming payments, trial expiries and price changes. Renewals are handled automatically.',
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
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.skip} onPress={onClose}>
            <Text style={styles.skipText}>{isKo ? '건너뛰기' : 'Skip'}</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[Colors.primary, Colors.primaryBg]}
            style={styles.iconCircle}
          >
            <Ionicons name={current.icon} size={38} color="#FFF" />
          </LinearGradient>

          <Text style={styles.title}>{isKo ? current.titleKo : current.titleEn}</Text>
          <Text style={styles.desc}>{isKo ? current.descKo : current.descEn}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setStep(i)}>
                <View style={[styles.dot, i === step && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>

          <GradientButton
            label={isLast ? (isKo ? '구독 추가하러 가기' : 'Add a subscription') : (isKo ? '다음' : 'Next')}
            icon={isLast ? 'add' : 'arrow-forward'}
            variant="primary"
            size="lg"
            onPress={handleNext}
          />
          {step > 0 && (
            <TouchableOpacity style={styles.prev} onPress={() => setStep((s) => Math.max(0, s - 1))}>
              <Text style={styles.prevText}>{isKo ? '이전' : 'Back'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  sheet: { backgroundColor: '#FFF', borderRadius: 28, padding: Spacing.xxl, alignItems: 'center' },
  skip: { alignSelf: 'flex-end', padding: 4 },
  skipText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  iconCircle: { width: 76, height: 76, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.textPrimary, textAlign: 'center', marginTop: Spacing.xl },
  desc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: Spacing.md },
  dots: { flexDirection: 'row', gap: 6, marginVertical: Spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.borderLight },
  dotActive: { width: 22, backgroundColor: Colors.primary },
  prev: { marginTop: Spacing.md, padding: 8 },
  prevText: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
});
