import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../src/constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!username || !email || !password) return;
    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, username);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('오류', '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#E9EFFD', '#F8FAFF', '#E9EFFD']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>회원가입</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>사용자명</Text>
                <View style={styles.inputWrap}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Username" 
                    placeholderTextColor={Colors.textTertiary}
                    value={username} 
                    onChangeText={setUsername} 
                    autoCapitalize="none" 
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>이메일</Text>
                <View style={styles.inputWrap}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="example@mail.com" 
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
                    placeholder="Password" 
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

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>비밀번호 확인</Text>
                <View style={styles.inputWrap}>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Confirm Password" 
                    placeholderTextColor={Colors.textTertiary}
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                    secureTextEntry={!showPassword} 
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.registerBtn} 
                onPress={handleRegister} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.registerBtnText}>가입하기</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.footerLink}>로그인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: Spacing.xl, 
    justifyContent: 'center',
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
  registerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#737DFF', 
    height: 52, 
    borderRadius: 12, 
    marginTop: Spacing.md,
    ...Shadow.sm,
  },
  registerBtnText: { 
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
