import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { authUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#A9463C" />
      </View>
    );
  }

  if (!authUser) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: '#F7F1EA',
    flex: 1,
    justifyContent: 'center',
  },
});
