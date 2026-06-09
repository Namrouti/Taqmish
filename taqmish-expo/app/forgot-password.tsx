import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/providers/auth-provider';

function validateEmail(email: string) {
  const trimmedEmail = email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmedEmail) {
    return 'This field is required!';
  }

  if (!emailPattern.test(trimmedEmail)) {
    return 'Please Enter Valid Email Address !..';
  }

  return null;
}

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      Alert.alert('Reset password', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email.trim());
      Alert.alert('Reset password', "Enter your email and we'll send you a link to reset your password");
    } catch (error) {
      Alert.alert(
        'Reset password failed',
        error instanceof Error ? error.message : 'Unable to send reset email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.container}>
        <View style={styles.panel}>
          <View style={styles.iconWrap}>
            <Ionicons color="#B54B3B" name="mail-open-outline" size={28} />
          </View>
          <Text style={styles.title}>Reset your password to regain access</Text>
          <Text style={styles.subtitle}>
            Enter your email and we&apos;ll send you a link to reset your password
          </Text>

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

          <Pressable
            disabled={isSubmitting}
            onPress={handleReset}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !isSubmitting ? styles.primaryButtonPressed : null,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFF7F1" />
            ) : (
              <Text style={styles.primaryButtonText}>Send reset link</Text>
            )}
          </Pressable>

          <Link asChild href="/login">
            <Pressable style={styles.backLink}>
              <Text style={styles.backLinkText}>Remember your password?</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    alignSelf: 'center',
    marginTop: 6,
  },
  backLinkText: {
    color: '#D96F32',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#F6EADF',
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    marginBottom: 10,
    width: 64,
  },
  input: {
    color: '#2F241D',
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  panel: {
    backgroundColor: '#FFF9F4',
    borderRadius: 30,
    gap: 14,
    padding: 24,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#D96F32',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFF7F1',
    fontSize: 16,
    fontWeight: '800',
  },
  safeArea: {
    backgroundColor: '#F2E2D6',
    flex: 1,
  },
  subtitle: {
    color: '#8A7260',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  title: {
    color: '#2F241D',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
  },
});
