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

function validateSignup(email: string, password: string, confirmPassword: string) {
  const trimmedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail) {
    return 'Please enter an email address.';
  }

  if (!emailPattern.test(trimmedEmail)) {
    return 'Please enter a valid email address.';
  }

  if (!password) {
    return 'Please enter a password.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
}

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    const validationError = validateSignup(email, password, confirmPassword);
    if (validationError) {
      Alert.alert('Sign up', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email.trim(), password);
      Alert.alert('Sign up', 'Account created successfully.');
      router.replace('/profile-setup');
    } catch (error) {
      Alert.alert(
        'Sign up failed',
        error instanceof Error ? error.message : 'Unable to create your account.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.heroSubtitle}>Create your account to start building outfits</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Use your email and password to get started</Text>

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
                  placeholder="Create a password"
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputShell}>
                <Ionicons color="#A58D78" name="shield-checkmark-outline" size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#A58D78"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  value={confirmPassword}
                />
                <Pressable onPress={() => setShowConfirmPassword((value) => !value)}>
                  <Ionicons
                    color="#A58D78"
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleSignup}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !isSubmitting ? styles.primaryButtonPressed : null,
                isSubmitting ? styles.primaryButtonDisabled : null,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF7F1" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link asChild href="/login">
                <Pressable>
                  <Text style={styles.footerLink}>Sign In</Text>
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
