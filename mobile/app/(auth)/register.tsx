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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../../src/constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
    // TODO: 실제 회원가입 API 연결
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* 뒤로가기 */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>
            SubFlow와 함께 구독을 관리하세요
          </Text>

          {/* 입력 폼 */}
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="사용자 이름"
                placeholderTextColor={Colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
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
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
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
                  size={20}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                placeholderTextColor={Colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
              <Text style={styles.registerBtnText}>가입하기</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.textWhite} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
              <Text style={styles.loginText}>
                이미 계정이 있으신가요? <Text style={styles.loginBold}>로그인</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    ...Shadow.sm,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  form: {
    gap: Spacing.lg,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  registerBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textWhite,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  loginText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  loginBold: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
