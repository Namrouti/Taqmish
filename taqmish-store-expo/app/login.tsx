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
import { Link, useRouter } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Store login', 'Enter your email and password first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Taqmish Store</Text>
        <Text style={styles.subtitle}>Manage your store, products, and incoming orders.</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.inputShell}>
          <Ionicons color="#A58D78" name="mail-outline" size={18} />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Store owner email"
            placeholderTextColor="#A58D78"
            style={styles.input}
            value={email}
          />
        </View>
        <View style={styles.inputShell}>
          <Ionicons color="#A58D78" name="lock-closed-outline" size={18} />
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#A58D78"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>
        <Pressable
          disabled={isSubmitting}
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.button,
            pressed && !isSubmitting ? styles.buttonPressed : null,
          ]}>
          {isSubmitting ? <ActivityIndicator color="#FFF7F1" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don&apos;t have a store account? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Register</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: '#FFF7F1',
    fontSize: 34,
    fontWeight: '900',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#A9463C',
    borderRadius: 18,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: '#FFF7F1',
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#FFF9F4',
    borderRadius: 28,
    gap: 14,
    marginHorizontal: 18,
    marginTop: -24,
    padding: 22,
  },
  footerLink: {
    color: '#A9463C',
    fontSize: 14,
    fontWeight: '800',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#7F6755',
    fontSize: 14,
  },
  hero: {
    backgroundColor: '#A9463C',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 52,
    paddingHorizontal: 20,
    paddingTop: 82,
  },
  input: {
    color: '#2F241D',
    flex: 1,
    fontSize: 15,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  screen: {
    backgroundColor: '#F3E6DB',
    flex: 1,
  },
  subtitle: {
    color: '#FFDCC3',
    fontSize: 14,
    marginTop: 8,
  },
});
