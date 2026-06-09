import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

export default function OrdersScreen() {
  const { authUser } = useAuth();

  if (!authUser) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Orders</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ready for the next step</Text>
        <Text style={styles.cardText}>
          This screen is reserved for store orders. The data model can use `StoreOrders/{'{ownerId}'}` while keeping order details tied to the saved product ids.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF9F4',
    borderRadius: 24,
    marginTop: 16,
    padding: 18,
  },
  cardText: {
    color: '#6F584A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  cardTitle: {
    color: '#A9463C',
    fontSize: 17,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: '#F3E6DB',
    flex: 1,
    padding: 18,
  },
  title: {
    color: '#2F241D',
    fontSize: 26,
    fontWeight: '900',
  },
});
