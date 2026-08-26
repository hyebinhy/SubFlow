import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { authAPI } from '../../src/services/api';
import { GradientButton } from '../../src/components/GradientButton';
import { AppLogoMark } from '../../src/components/AppLogoMark';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  // ── 비밀번호 재설정 ──
  // 앱에만 계정이 있는 사람은 비밀번호를 잊으면 되찾을 길이 아예 없었다.
  // 재설정 링크는 메일로 가고, 링크를 열면 웹앱에서 새 비밀번호를 정한다.
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);

  const openReset = () => {
    setResetEmail(email);   // 위에 이미 적어 둔 주소가 있으면 그대로 채운다
    setResetOpen(true);
  };

  const handleReset = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(resetEmail.trim())) {
      Alert.alert('이메일을 정확히 입력해주세요');
      return;
    }
    setResetSending(true);
    try {
      await authAPI.forgotPassword(resetEmail.trim());
    } catch {
      // 서버는 가입 여부와 무관하게 성공으로 답한다. 네트워크 오류도
      // 굳이 구분해 알리지 않는다 — 가입된 주소인지 여기서 새 나가면 안 된다.
    } finally {
      setResetSending(false);
      setResetOpen(false);
      Alert.alert(
        '메일을 보냈어요',
        '가입된 주소라면 재설정 링크가 도착합니다. 메일함을 확인해주세요.',
      );
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('오류', '로그인에 실패했습니다. 정보를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#E9EFFD', '#F8FAFF', '#E9EFFD']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <AppLogoMark width={148} variant="pen" tone="point" style={styles.logo} />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor={Colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <GradientButton
              label="로그인"
              icon="log-in-outline"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: Spacing.md }}
            />

            <TouchableOpacity onPress={openReset} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>계정이 없으신가요? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent animationType="fade" visible={resetOpen} onRequestClose={() => setResetOpen(false)}>
        <Pressable style={resetStyles.overlay} onPress={() => setResetOpen(false)}>
          <Pressable style={resetStyles.box} onPress={() => {}}>
            <Text style={resetStyles.title}>비밀번호 재설정</Text>
            <Text style={resetStyles.subtitle}>
              가입한 이메일로 재설정 링크를 보내드립니다.
            </Text>
            <TextInput
              style={resetStyles.input}
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="me@example.com"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            <View style={resetStyles.btnRow}>
              <TouchableOpacity style={[resetStyles.btn, resetStyles.btnCancel]} onPress={() => setResetOpen(false)}>
                <Text style={resetStyles.btnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[resetStyles.btn, resetStyles.btnSend, resetSending && { opacity: 0.6 }]}
                onPress={handleReset}
                disabled={resetSending}
              >
                <Text style={resetStyles.btnSendText}>{resetSending ? '보내는 중...' : '링크 받기'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const resetStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  box: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '85%' },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.sm, color: Colors.textTertiary, marginBottom: Spacing.lg },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.lg,
  },
  btnRow: { flexDirection: 'row', gap: Spacing.sm },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  btnCancel: { backgroundColor: Colors.background },
  btnCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.medium },
  btnSend: { backgroundColor: Colors.primary },
  btnSendText: { color: Colors.textWhite, fontWeight: FontWeight.bold },
});

const styles = StyleSheet.create({
  forgotBtn: { alignSelf: 'center', marginTop: Spacing.md, paddingVertical: 4 },
  forgotText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: Spacing.xl,
  },
  formCard: { 
    backgroundColor: Colors.surface, 
    borderRadius: 24, 
    padding: Spacing.xxl, 
    gap: Spacing.lg, 
    ...Shadow.md,
    marginVertical: 40,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EDF2FF',
    borderRadius: 12, 
    paddingHorizontal: Spacing.lg, 
    height: 52,
  },
  input: { 
    flex: 1, 
    fontSize: FontSize.md, 
    color: Colors.textPrimary,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  footerText: { 
    fontSize: FontSize.sm, 
    color: Colors.textTertiary,
  },
  footerLink: { 
    fontSize: FontSize.sm, 
    color: '#737DFF', 
    fontWeight: FontWeight.bold,
  },
});
