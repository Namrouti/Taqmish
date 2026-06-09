import { Redirect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { LuxuryTheme } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsScreen() {
  const { authUser, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={LuxuryTheme.accent} />
      </View>
    );
  }

  if (!authUser) {
    return <Redirect href="/login" />;
  }

  return (
    <AppShell subtitle="Matches the Android settings tab destination." title="Settings">
      <View style={styles.card}>
        <Text style={styles.title}>App actions</Text>
        <Text style={styles.row}>Manage clothing classes</Text>
        <Text style={styles.row}>Color analysis</Text>
        <Text style={styles.row}>Closet tools</Text>

        <Pressable onPress={logout} style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}>
          <Text style={styles.buttonText}>Log out</Text>
        </Pressable>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: '#120F0D',
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    color: LuxuryTheme.textMuted,
    fontSize: 15,
    marginTop: 12,
  },
  title: {
    color: LuxuryTheme.textStrong,
    fontSize: 24,
    fontWeight: '800',
  },
});
