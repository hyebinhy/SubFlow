import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { GradientButton } from '../../src/components/GradientButton';
import { AppLogoMark } from '../../src/components/AppLogoMark';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../../src/constants/theme';

// 웹 회원가입과 같은 목록·순서. daum.net과 hanmail.net은 같은 메일함이지만
// 가입 시기에 따라 주소가 달라 둘 다 둔다.
const EMAIL_DOMAINS = [
  'naver.com', 'gmail.com', 'daum.net', 'hanmail.net',
  'kakao.com', 'nate.com', 'outlook.com', 'hotmail.com',
  'icloud.com', 'yahoo.com', 'korea.com', 'empas.com',
];

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  // 이메일은 앞부분과 도메인을 나눠 받는다(도메인은 드롭다운, 없으면 직접 입력)
  const [emailLocal, setEmailLocal] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [domainPickerVisible, setDomainPickerVisible] = useState(false);
  const [customDomain, setCustomDomain] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const email = emailLocal && emailDomain ? `${emailLocal}@${emailDomain}` : '';

  // 앞칸에 'me@naver.com'을 통째로 붙여넣는 경우가 흔하다 — 알아서 쪼갠다.
  const handleLocalChange = (value: string) => {
    if (value.includes('@')) {
      const [local, ...rest] = value.split('@');
      const domain = rest.join('@');
      setEmailLocal(local);
      setEmailDomain(domain);
      if (domain && !EMAIL_DOMAINS.includes(domain)) setCustomDomain(true);
      return;
    }
    setEmailLocal(value);
  };

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
              <AppLogoMark width={132} variant="pen" tone="point" style={styles.logo} />
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
                <View style={styles.emailRow}>
                  <View style={[styles.inputWrap, styles.emailLocalWrap]}>
                    <TextInput
                      style={styles.input}
                      placeholder="email"
                      placeholderTextColor={Colors.textTertiary}
                      value={emailLocal}
                      onChangeText={handleLocalChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <Text style={styles.emailAt}>@</Text>
                  {customDomain ? (
                    <View style={[styles.inputWrap, styles.emailDomainWrap]}>
                      <TextInput
                        style={styles.input}
                        placeholder="직접 입력"
                        placeholderTextColor={Colors.textTertiary}
                        value={emailDomain}
                        onChangeText={(v) => setEmailDomain(v.replace('@', ''))}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoFocus
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.inputWrap, styles.emailDomainWrap]}
                      onPress={() => setDomainPickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.input,
                          !emailDomain && { color: Colors.textTertiary },
                        ]}
                        numberOfLines={1}
                      >
                        {emailDomain || '선택'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  )}
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

              <GradientButton
                label="가입하기"
                icon="person-add-outline"
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleRegister}
                style={{ marginTop: Spacing.md }}
              />

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

      {/* 도메인 선택 시트 */}
      <Modal
        visible={domainPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDomainPickerVisible(false)}
      >
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setDomainPickerVisible(false)}
        >
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>이메일 도메인</Text>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {EMAIL_DOMAINS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.pickerRow}
                  onPress={() => {
                    setEmailDomain(d);
                    setCustomDomain(false);
                    setDomainPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerRowText,
                      emailDomain === d && { color: Colors.primary, fontWeight: FontWeight.bold },
                    ]}
                  >
                    @{d}
                  </Text>
                  {emailDomain === d && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {/* 목록에 없는 주소용 */}
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => {
                  setEmailDomain('');
                  setCustomDomain(true);
                  setDomainPickerVisible(false);
                }}
              >
                <Text style={[styles.pickerRowText, { color: Colors.primary }]}>
                  직접 입력
                </Text>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  logo: {
    alignSelf: 'center',
    marginBottom: Spacing.sm,
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
  // ── 이메일: 앞부분 입력 + @ + 도메인 드롭다운 ──
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emailLocalWrap: { flex: 1, minWidth: 0 },
  emailDomainWrap: { flex: 1, minWidth: 0 },
  emailAt: { fontSize: FontSize.md, color: Colors.textTertiary },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: BorderRadius.xxxl, borderTopRightRadius: BorderRadius.xxxl,
    paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl, maxHeight: '70%',
  },
  pickerHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, marginTop: Spacing.md, marginBottom: Spacing.lg,
  },
  pickerTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold,
    color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  pickerList: { flexGrow: 0 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerRowText: { fontSize: FontSize.md, color: Colors.textPrimary },
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
