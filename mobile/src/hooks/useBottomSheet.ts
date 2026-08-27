import { useEffect, useRef } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, PanResponder } from 'react-native';

/**
 * 시트가 화면 밖으로 나가는 거리와 걸리는 시간.
 * 카탈로그·구독 상세 시트가 쓰던 값과 같게 맞춘다 — 시트마다 속도가 다르면
 * 같은 동작인데 다른 화면처럼 느껴진다.
 */
const TRAVEL = 600;
const OPEN_FADE_MS = 200;
const CLOSE_FADE_MS = 200;
const CLOSE_SLIDE_MS = 250;
/** 이만큼 끌어내렸거나 이 속도보다 빠르면 닫는다. 세 시트가 같은 값을 쓴다. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;

/**
 * 아래에서 올라오는 시트의 열기·닫기 애니메이션과 쓸어 닫기 제스처.
 *
 * 앱 안에 시트가 여덟 개인데 손잡이만 그려 놓고 못 잡는 것들이 있었다. 잡히는
 * 것과 안 잡히는 것이 섞이면 "이 시트는 되나?" 를 매번 시험하게 된다. 값과
 * 동작을 한곳에 모아 전부 같게 만든다.
 *
 * 시트 안이 스크롤 영역이면 `onScroll`을 넘겨야 한다. 스크롤이 맨 위일 때만
 * 제스처를 가로채야 목록 스크롤과 싸우지 않는다.
 *
 *   const sheet = useBottomSheet(visible, onClose);
 *   <Modal visible={visible} transparent animationType="none" onRequestClose={sheet.close}>
 *     <Animated.View style={[styles.overlay, { opacity: sheet.backdrop }]}>
 *       <Pressable style={StyleSheet.absoluteFill} onPress={sheet.close} />
 *     </Animated.View>
 *     <Animated.View style={[styles.sheet, sheet.style]} {...sheet.panHandlers}>
 */
export function useBottomSheet(visible: boolean, onClose: () => void) {
  const translateY = useRef(new Animated.Value(TRAVEL)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(0);

  // PanResponder는 한 번만 만들어지므로 최신 onClose를 ref로 넘긴다.
  const closeRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!visible) return;
    scrollY.current = 0;
    backdrop.setValue(0);
    translateY.setValue(TRAVEL);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: OPEN_FADE_MS, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 25, stiffness: 300, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  /** 내려가는 애니메이션을 끝낸 뒤에 닫는다. 바로 닫으면 툭 끊긴다. */
  const close = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: CLOSE_FADE_MS, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: TRAVEL, duration: CLOSE_SLIDE_MS, useNativeDriver: true }),
    ]).start(() => onClose());
  };
  closeRef.current = close;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        scrollY.current <= 0 && g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          closeRef.current();
        } else {
          Animated.spring(translateY, { toValue: 0, damping: 25, stiffness: 300, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  };

  return {
    close,
    backdrop,
    style: { transform: [{ translateY }] },
    panHandlers: panResponder.panHandlers,
    onScroll,
    scrollEventThrottle: 16,
  };
}
