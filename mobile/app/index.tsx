import { Redirect } from 'expo-router';

export default function Index() {
  // TODO: 인증 상태에 따라 분기
  // const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  // if (isLoggedIn) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
