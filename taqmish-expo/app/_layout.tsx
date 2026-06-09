import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LuxuryTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/providers/auth-provider';

const luxuryNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: LuxuryTheme.background,
    border: LuxuryTheme.border,
    card: LuxuryTheme.surface,
    notification: LuxuryTheme.accent,
    primary: LuxuryTheme.accent,
    text: LuxuryTheme.textPrimary,
  },
};

const luxuryNavigationThemeLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F1E7',
    border: '#E5D4BF',
    card: '#FFF8F0',
    notification: LuxuryTheme.accent,
    primary: LuxuryTheme.accent,
    text: '#251C15',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? luxuryNavigationTheme : luxuryNavigationThemeLight}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="profile-setup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
