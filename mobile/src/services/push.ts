import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationAPI } from './api';

// 포그라운드에서도 알림 배너/사운드 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * 기기 푸시 권한 요청 → Expo 푸시 토큰 발급 → 백엔드에 등록.
 * 시뮬레이터·권한 거부·Expo Go(SDK 53+ 원격 푸시 미지원) 등에서는 조용히 no-op.
 * 실제 푸시 수신은 dev build(또는 프로덕션 빌드)에서 동작합니다.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return; // 에뮬레이터/시뮬레이터는 원격 푸시 불가

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      // DEFAULT는 알림함에만 쌓이고 화면에 뜨지 않는다. 결제일처럼 때를 놓치면
      // 의미가 없는 알림이라 HIGH로 올려 배너가 바로 보이게 한다.
      await Notifications.setNotificationChannelAsync('default', {
        name: '구독 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90D9',
      });
    }

    const projectId =
      (Constants.expoConfig?.extra as any)?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    if (tokenData?.data) {
      await notificationAPI.registerPushToken(tokenData.data).catch(() => {});
    }
  } catch {
    // Expo Go 원격 푸시 미지원 등 → 무시 (앱 흐름에 영향 없음)
  }
}
