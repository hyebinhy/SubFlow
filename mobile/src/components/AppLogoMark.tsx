import React from 'react';
import { Image, useColorScheme, StyleProp, ImageStyle } from 'react-native';

/** word: 굵은 워드마크(앱 내부 헤더) / pen: 손글씨 아웃라인(로그인·회원가입) */
type Variant = 'word' | 'pen';
/** auto는 시스템 테마를 따르고, 나머지는 배경에 맞춰 직접 고정한다. */
type Tone = 'auto' | 'black' | 'white' | 'point';

const LOGO: Record<Variant, Record<Exclude<Tone, 'auto'>, number>> = {
  word: {
    black: require('../../assets/brand/subflow-logo-black.png'),
    white: require('../../assets/brand/subflow-logo-white.png'),
    point: require('../../assets/brand/subflow-logo-point.png'),
  },
  pen: {
    black: require('../../assets/brand/subflow-logo-pen-black.png'),
    white: require('../../assets/brand/subflow-logo-pen-white.png'),
    point: require('../../assets/brand/subflow-logo-pen-point.png'),
  },
};

// 원본 픽셀 비율 — 폭만 주면 높이는 여기서 맞춘다.
const ASPECT: Record<Variant, number> = {
  word: 970 / 198,
  pen: 1330 / 276,
};

type Props = {
  width?: number;
  variant?: Variant;
  tone?: Tone;
  style?: StyleProp<ImageStyle>;
};

export function AppLogoMark({ width = 92, variant = 'word', tone = 'auto', style }: Props) {
  const scheme = useColorScheme();
  const resolved = tone === 'auto' ? (scheme === 'dark' ? 'white' : 'black') : tone;

  return (
    <Image
      source={LOGO[variant][resolved]}
      style={[{ width, height: width / ASPECT[variant] }, style]}
      resizeMode="contain"
    />
  );
}
