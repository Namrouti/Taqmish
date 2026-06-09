import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useStoreItems } from '@/hooks/use-store-items';
import { useStoreProfile } from '@/hooks/use-store-profile';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardScreen() {
  const { authUser } = useAuth();
  const { profile } = useStoreProfile(authUser?.uid);
  const { items, publishedCount } = useStoreItems(authUser?.uid);

  if (!authUser) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Store dashboard</Text>
      <Text style={styles.subtitle}>
        {profile?.storeName ? `Welcome back, ${profile.storeName}.` : 'Start by completing your store profile.'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Published products</Text>
        <Text style={styles.cardValue}>{publishedCount}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>All products</Text>
        <Text style={styles.cardValue}>{items.length}</Text>
      </View>
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Integration ready</Text>
        <Text style={styles.noteText}>
          Products saved here go to `StoreItems/{'{ownerId}'}` and can be consumed by `taqmish-expo` search and outfit building.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF9F4',
    borderRadius: 24,
    marginTop: 12,
    padding: 18,
  },
  cardLabel: {
    color: '#8A7260',
    fontSize: 13,
    fontWeight: '700',
  },
  cardValue: {
    color: '#2F241D',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: '#FDF0E8',
    borderColor: '#E8CDB8',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  noteText: {
    color: '#6F584A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  noteTitle: {
    color: '#A9463C',
    fontSize: 16,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: '#F3E6DB',
    flex: 1,
    padding: 18,
  },
  subtitle: {
    color: '#7F6755',
    fontSize: 14,
    marginTop: 8,
  },
  title: {
    color: '#2F241D',
    fontSize: 26,
    fontWeight: '900',
  },
});
