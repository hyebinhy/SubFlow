import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
    bottom: Platform.OS === 'ios' ? 32 : 20,
    left: 40,
    right: 40,
    height: 68,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.xxxxl || 40, // extremely round
    borderTopWidth: 0,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
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
    paddingVertical: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
