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

import { useAuth } from '@/providers/auth-provider';

const STORE_TYPES = ['clothing', 'shoes', 'accessories', 'mixed'] as const;

export default function RegisterScreen() {
  const router = useRouter();
  const { registerStore } = useAuth();
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeType, setStoreType] = useState<(typeof STORE_TYPES)[number]>('clothing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!ownerName.trim() || !storeName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Store registration', 'Please complete owner name, store name, email, and password.');
      return;
    }

    if (password.trim().length < 6) {
      Alert.alert('Store registration', 'Password should be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerStore({
        email,
        ownerName,
        password,
        phone,
        storeName,
        storeType,
      });
      router.replace('/(tabs)/store');
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Unable to create the store account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.brand}>Create Store</Text>
          <Text style={styles.subtitle}>Open your store account, then continue to complete the public store profile.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputShell}>
            <Ionicons color="#A58D78" name="person-outline" size={18} />
            <TextInput
              onChangeText={setOwnerName}
              placeholder="Owner name"
              placeholderTextColor="#A58D78"
              style={styles.input}
              value={ownerName}
            />
          </View>

          <View style={styles.inputShell}>
            <Ionicons color="#A58D78" name="storefront-outline" size={18} />
            <TextInput
              onChangeText={setStoreName}
              placeholder="Store name"
              placeholderTextColor="#A58D78"
              style={styles.input}
              value={storeName}
            />
          </View>

          <View style={styles.inputShell}>
            <Ionicons color="#A58D78" name="mail-outline" size={18} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Store email"
              placeholderTextColor="#A58D78"
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.inputShell}>
            <Ionicons color="#A58D78" name="call-outline" size={18} />
            <TextInput
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor="#A58D78"
              style={styles.input}
              value={phone}
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

          <ScrollView contentContainerStyle={styles.typeRow} horizontal showsHorizontalScrollIndicator={false}>
            {STORE_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setStoreType(type)}
                style={[styles.typeChip, storeType === type ? styles.typeChipSelected : null]}>
                <Text style={[styles.typeChipText, storeType === type ? styles.typeChipTextSelected : null]}>{type}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            disabled={isSubmitting}
            onPress={handleRegister}
            style={({ pressed }) => [styles.button, pressed && !isSubmitting ? styles.buttonPressed : null]}>
            {isSubmitting ? <ActivityIndicator color="#FFF7F1" /> : <Text style={styles.buttonText}>Create store account</Text>}
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have a store account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 28,
  },
  subtitle: {
    color: '#FFDCC3',
    fontSize: 14,
    marginTop: 8,
  },
  typeChip: {
    backgroundColor: '#F6EADF',
    borderColor: '#E7D5C4',
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  typeChipSelected: {
    backgroundColor: '#A9463C',
    borderColor: '#A9463C',
  },
  typeChipText: {
    color: '#5C4638',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  typeChipTextSelected: {
    color: '#FFF7F1',
  },
  typeRow: {
    paddingTop: 4,
  },
});
