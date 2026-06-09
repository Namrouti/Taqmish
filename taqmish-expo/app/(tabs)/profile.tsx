import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { LuxuryTheme } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const { authUser, isLoading, profile } = useAuth();

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
    <AppShell subtitle="Matches the Android profile tab destination." title="Profile">
      <View style={styles.card}>
        <Text style={styles.title}>{profile?.fullName || 'Profile information'}</Text>
        <Text style={styles.row}>Email: {authUser.email ?? 'Unknown'}</Text>
        <Text style={styles.row}>First name: {profile?.firstName || 'Not set yet'}</Text>
        <Text style={styles.row}>Last name: {profile?.lastName || 'Not set yet'}</Text>
        <Text style={styles.row}>Gender: {profile?.gender || 'Not set yet'}</Text>
        <Text style={styles.row}>Age: {profile?.age || 'Not set yet'}</Text>
        <Text style={styles.row}>Height: {profile?.height || 'Not set yet'}</Text>
        <Text style={styles.row}>Weight: {profile?.weight || 'Not set yet'}</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 10,
  },
  title: {
    color: LuxuryTheme.textStrong,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
});
