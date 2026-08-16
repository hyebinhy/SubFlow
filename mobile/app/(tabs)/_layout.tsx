import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius } from '../../src/constants/theme';

export default function TabLayout() {
  // 하단 여백을 기기에서 실측한다. 고정값(iOS 32)으로 두면 홈 인디케이터
  // 영역이 다른 기기(예: iPhone 13 mini는 인셋 34)에서 탭바가 그 위에
  // 걸치거나 화면 끝에 너무 붙는다.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { bottom: Math.max(insets.bottom, 12) + 8 }],
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarShowLabel: false,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={styles.blurContainer} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconActive]}>
              <Ionicons name="home" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconActive]}>
              <Ionicons name="card" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconActive]}>
              <Ionicons name="search" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconActive]}>
              <Ionicons name="bar-chart" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconActive]}>
              <Ionicons name="calendar" size={24} color={color} />
            </View>
          ),
        }}
      />
      {/* 설정은 탭에서 숨기고 헤더 아이콘으로 접근 */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    // bottom은 안전영역 실측값으로 위에서 덮어쓴다.
    // 좌우 여백은 left/right가 아니라 margin으로 준다 — react-navigation이
    // 탭바에 자기 위치값(left/right: 0)을 tabBarStyle '뒤에' 덮어써서
    // left/right로는 알약이 화면 끝까지 늘어나 모서리가 잘린다.
    // 16pt: iPhone 13 mini에서 칸당 68.6pt, 아이콘(44pt) 사이 24.6pt.
    // (40pt면 칸당 59pt라 간격이 15pt뿐이라 빽빽하다)
    marginHorizontal: 16,
    height: 68,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.xxxxl || 40, // extremely round
    borderTopWidth: 0,
    paddingBottom: 0,
    shadowColor: Colors.shadowTint,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xxxxl || 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  tabBarItem: {
    // 위아래 합은 20으로 두되 아래쪽을 10pt 덜 준다 = 아이콘이 5pt 내려간다.
    // react-navigation이 탭바에 자기 하단 패딩을 tabBarStyle 뒤에 덮어써서
    // (우리가 준 paddingBottom: 0이 무시된다) 아이콘 줄이 바 중심보다
    // 5.1pt 위로 밀려 있었다 — 실기기 캡처 픽셀 측정값.
    paddingTop: 15,
    paddingBottom: 5,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // 아이콘을 1.5pt 위로 올린다. 글리프는 사각 경계 기준으로는 정중앙이지만
    // 실제 픽셀 무게가 아래에 몰려 있어(집 1.15pt, 막대그래프 2.3pt) 원만
    // 위로 뜬 것처럼 보인다. 아래 패딩을 주면 가운데 정렬이 그만큼 위로 밀린다.
    // 활성/비활성 모두에 걸어야 탭할 때 아이콘이 튀지 않는다.
    paddingBottom: 3,
  },
  iconActive: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
