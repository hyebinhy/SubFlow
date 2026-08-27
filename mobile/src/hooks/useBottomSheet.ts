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
/** 이만큼 끌어내렸거나 이 속도보다 빠르면 닫는다. 모든 시트가 같은 값을 쓴다. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;
/** 이만큼 움직이면 끌기로 본다. 너무 크면 손잡이를 잡아도 안 걸린 것처럼 느껴진다. */
const MOVE_THRESHOLD = 3;
/**
 * 시트 안의 버튼에서 끌기 시작했을 때 시트가 responder를 되찾아 오는 기준.
 * 누르기(dy≈0)를 뺏지 않도록 그냥 끌기보다 넉넉하게 잡는다.
 */
const CAPTURE_THRESHOLD = 10;

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
 *       <View style={styles.handleZone} {...sheet.handlePanHandlers} />
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

  /** 손을 뗐을 때 제자리로 돌려놓는다. */
  const snapBack = () => {
    Animated.spring(translateY, {
      toValue: 0, damping: 25, stiffness: 300, useNativeDriver: true,
    }).start();
  };

  /** 아래로 곧게 끌고 있는가. 가로로 더 많이 움직였으면 끌기로 보지 않는다. */
  const isDraggingDown = (dy: number, dx: number, threshold: number) =>
    scrollY.current <= 0 && dy > threshold && Math.abs(dy) > Math.abs(dx);

  const panResponder = useRef(
    PanResponder.create({
      // 시트 안의 버튼·카드는 터치가 닿는 순간 responder를 가져간다. 그러면
      // 부모인 시트의 onMoveShouldSetPanResponder는 아예 불리지 않아서, 버튼
      // 위에서 끌기 시작하면 시트가 꿈쩍도 하지 않는다. 분명히 아래로 끌고
      // 있을 때는 capture 단계에서 되찾아 온다.
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        isDraggingDown(g.dy, g.dx, CAPTURE_THRESHOLD),
      onMoveShouldSetPanResponder: (_e, g) =>
        isDraggingDown(g.dy, g.dx, MOVE_THRESHOLD),
      onPanResponderMove: (_e, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          closeRef.current();
        } else {
          snapBack();
        }
      },
      // 끌기 시작한 뒤에 부모(ScrollView·Modal 등)가 responder를 달라고 하면
      // 기본값은 넘겨주는 것이라, 끌던 시트가 중간에 멈춰 버린다. 넘기지 않는다.
      onPanResponderTerminationRequest: () => false,
      // 안드로이드에서 네이티브 쪽 제스처가 가로채는 것도 막는다.
      onShouldBlockNativeResponder: () => true,
      // 그래도 뺏겼다면 어정쩡하게 걸쳐 있지 않도록 제자리로 돌린다.
      onPanResponderTerminate: snapBack,
    })
  ).current;

  // 손잡이 전용. 안쪽 목록이 얼마나 스크롤돼 있든 손잡이를 잡으면 항상 끌려야
  // 한다 — 그러라고 있는 막대다. 그래서 scrollY 조건을 걸지 않는다.
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_e, g) => g.dy > MOVE_THRESHOLD,
      onMoveShouldSetPanResponder: (_e, g) => g.dy > MOVE_THRESHOLD,
      onPanResponderMove: (_e, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          closeRef.current();
        } else {
          snapBack();
        }
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminate: snapBack,
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
    /** 손잡이에 붙인다. 안쪽 스크롤 위치와 무관하게 항상 끌린다. */
    handlePanHandlers: handlePanResponder.panHandlers,
    onScroll,
    scrollEventThrottle: 16,
  };
}
