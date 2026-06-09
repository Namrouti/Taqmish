import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LuxuryTheme } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

const socialProviders = [
  { icon: 'logo-google', key: 'google', label: 'Google' },
  { icon: 'logo-facebook', key: 'facebook', label: 'Facebook' },
  { icon: 'call-outline', key: 'phone', label: 'Phone' },
  { icon: 'logo-twitter', key: 'twitter', label: 'Twitter' },
  { icon: 'logo-github', key: 'github', label: 'GitHub' },
] as const;

function validateLogin(email: string, password: string) {
  const trimmedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail) {
    return 'Please Enter the email Address';
  }

  if (!emailPattern.test(trimmedEmail)) {
    return 'Please Enter valid email address!..';
  }

  if (!password) {
    return 'Please Enter thr password!..';
  }

  if (password.length < 6) {
    return 'minimum password length 6 characters !';
  }

  return null;
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const validationError = validateLogin(email, password);
    if (validationError) {
      Alert.alert('Login', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const profile = await login(email.trim(), password);
      Alert.alert('Login', 'User has been logged in Successfully');

      if (profile?.profileComplete) {
        router.replace('/(tabs)');
        return;
      }

      router.replace('/profile-setup');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnavailableProvider = (label: string) => {
    Alert.alert(
      label,
      'Email/password login is ready. Social sign-in in Expo still needs provider-specific client setup.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
          style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.glow, styles.glowRight]} />
            <View style={[styles.glow, styles.glowLeft]} />
            <View style={styles.brandBlock}>
              <View style={styles.logoMonogramWrap}>
                <View style={styles.logoRing} />
                <Text style={styles.logoMonogramTop}>T</Text>
                <Text style={styles.logoMonogramBottom}>M</Text>
              </View>
              <Text style={styles.brand}>TUQ MISH</Text>
              <Text style={styles.brandCaption}>OUTFIT COORDINATOR</Text>
            </View>
            <Text style={styles.heroSubtitle}>
              Sign in to build outfits based on color harmony
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your credentials to continue</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputShell}>
                <Ionicons color="#A58D78" name="mail-outline" size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#A58D78"
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputShell}>
                <Ionicons color="#A58D78" name="lock-closed-outline" size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#A58D78"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                />
                <Pressable onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons
                    color="#A58D78"
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                  />
                </Pressable>
              </View>
            </View>

            <Link asChild href="/forgot-password">
              <Pressable style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </Pressable>
            </Link>

            <Pressable
              disabled={isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !isSubmitting ? styles.primaryButtonPressed : null,
                isSubmitting ? styles.primaryButtonDisabled : null,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF7F1" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              {socialProviders.map((provider) => (
                <Pressable
                  key={provider.key}
                  onPress={() => handleUnavailableProvider(provider.label)}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.socialButtonPressed : null]}>
                  <Ionicons color="#7F6755" name={provider.icon} size={20} />
                </Pressable>
              ))}
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <Link asChild href="/signup">
                <Pressable>
                  <Text style={styles.footerLink}>Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: LuxuryTheme.textStrong,
    fontFamily: 'serif',
    fontSize: 34,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  brandBlock: {
    alignItems: 'center',
  },
  brandCaption: {
    color: LuxuryTheme.accent,
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 6,
  },
  card: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    gap: 14,
    marginTop: -14,
    paddingBottom: 28,
    paddingHorizontal: 26,
    paddingTop: 34,
  },
  dividerLine: {
    backgroundColor: LuxuryTheme.border,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  dividerText: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
  },
  flex: {
    flex: 1,
  },
  footerLink: {
    color: LuxuryTheme.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: LuxuryTheme.textMuted,
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },
  forgotPasswordText: {
    color: LuxuryTheme.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  glow: {
    backgroundColor: LuxuryTheme.glow,
    borderRadius: 999,
    opacity: 1,
    position: 'absolute',
  },
  glowLeft: {
    height: 82,
    left: 24,
    top: 20,
    width: 82,
  },
  glowRight: {
    height: 120,
    right: 28,
    top: -8,
    width: 120,
  },
  hero: {
    backgroundColor: LuxuryTheme.backgroundAlt,
    borderBottomColor: LuxuryTheme.borderSoft,
    borderBottomWidth: 1,
    overflow: 'hidden',
    paddingBottom: 44,
    paddingHorizontal: 28,
    paddingTop: 58,
  },
  heroSubtitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 18,
    maxWidth: 260,
    textAlign: 'center',
  },
  input: {
    color: LuxuryTheme.textStrong,
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  inputGroup: {
    gap: 8,
    marginTop: 2,
  },
  inputLabel: {
    color: LuxuryTheme.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  logoMonogramBottom: {
    color: LuxuryTheme.accent,
    fontFamily: 'serif',
    fontSize: 44,
    left: 24,
    position: 'absolute',
    top: 26,
  },
  logoMonogramTop: {
    color: LuxuryTheme.accent,
    fontFamily: 'serif',
    fontSize: 42,
    left: 16,
    position: 'absolute',
    top: 4,
  },
  logoMonogramWrap: {
    alignItems: 'center',
    height: 96,
    justifyContent: 'center',
    position: 'relative',
    width: 92,
  },
  logoRing: {
    borderColor: 'rgba(213, 174, 99, 0.5)',
    borderRadius: 999,
    borderWidth: 1,
    height: 58,
    marginTop: 16,
    width: 58,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: LuxuryTheme.backgroundAlt,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  socialButtonPressed: {
    backgroundColor: LuxuryTheme.backgroundMuted,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subtitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  title: {
    color: LuxuryTheme.textStrong,
    fontSize: 28,
    fontWeight: '800',
  },
});
