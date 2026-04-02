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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
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
            <Text style={styles.formTitle}>구독 관리 서비스</Text>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="ykgstar37@gmail.com"
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

            <TouchableOpacity 
              style={styles.loginBtn} 
              onPress={handleLogin} 
              activeOpacity={0.8} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>로그인</Text>
              )}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  formTitle: { 
    fontSize: FontSize.xl, 
    fontWeight: FontWeight.bold, 
    color: Colors.textPrimary, 
    textAlign: 'center',
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
  loginBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#737DFF', 
    height: 52, 
    borderRadius: 12, 
    marginTop: Spacing.md,
    ...Shadow.sm,
  },
  loginBtnText: { 
    fontSize: FontSize.lg, 
    fontWeight: FontWeight.bold, 
    color: Colors.textWhite,
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
