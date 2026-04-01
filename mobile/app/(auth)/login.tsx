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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={['#D6E6F2', '#E2EEF6', '#EDF3F8', '#F4F8FB']}
      locations={[0, 0.3, 0.6, 1]}
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
          {/* 로고 영역 */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrap}>
              <Ionicons name="water" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>SubFlow</Text>
            <Text style={styles.tagline}>
              스마트한 구독 관리,{'\n'}현명한 지출 습관
            </Text>
          </View>

          {/* 입력 폼 카드 */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>로그인</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
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

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.loginBtnText}>로그인</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.textWhite} />
            </TouchableOpacity>
          </View>

          {/* 하단 링크 */}
          <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerText}>
              계정이 없으신가요? <Text style={styles.registerBold}>회원가입</Text>
            </Text>
          </TouchableOpacity>

          {/* 하단 버전 */}
          <Text style={styles.version}>SubFlow v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 60,
  },
  // ── 로고 영역 ──
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl + 8,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // ── 폼 카드 ──
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    gap: Spacing.lg,
    ...Shadow.md,
  },
  formTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
  },
  forgotText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  loginBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textWhite,
  },
  // ── 하단 ──
  registerLink: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  registerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  registerBold: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xxl,
  },
});
