import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LuxuryTheme } from '@/constants/theme';
import type { OutfitRecord } from '@/hooks/use-outfits';
import { getOutfitColors, getOutfitItems, getOutfitSourceFilter, resolveImageUri } from '@/utils/closet-helpers';

export type OutfitDetailModalProps = {
  outfit: OutfitRecord | null;
  onClose: () => void;
};

export function OutfitDetailModal({ outfit, onClose }: OutfitDetailModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      visible={outfit !== null}
      onRequestClose={onClose}>
      <View
        style={[
          styles.screen,
          { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 },
        ]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Outfit Details</Text>
        </View>
        {outfit ? (
          <ScrollView contentContainerStyle={styles.list}>
            <View style={styles.card}>
              <Text style={styles.name}>Saved outfit</Text>
              <Text style={styles.meta}>Source: {getOutfitSourceFilter(outfit)}</Text>
              <Text style={styles.meta}>Color summary</Text>
              <View style={styles.colorsRow}>
                {getOutfitColors(outfit).length ? (
                  getOutfitColors(outfit).map((color, colorIndex) => (
                    <View
                      key={`${outfit.id ?? 'outfit'}-${color}-${colorIndex}`}
                      style={[styles.colorSwatch, { backgroundColor: color }]}
                    />
                  ))
                ) : (
                  <Text style={styles.meta}>No saved colors</Text>
                )}
              </View>
            </View>
            {getOutfitItems(outfit).map(({ item, label }) => (
              <View key={`${outfit.id}-${label}`} style={styles.itemCard}>
                {resolveImageUri(item?.filePath) ? (
                  <Image
                    source={{ uri: resolveImageUri(item?.filePath)! }}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.itemFallback}>
                    <Text style={styles.fallbackText}>{label}</Text>
                  </View>
                )}
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle}>{label}</Text>
                  <Text style={styles.meta}>{item?.subParts || item?.bodyPart || 'Unnamed item'}</Text>
                  <Text style={styles.meta}>{item?.bodyPart || 'Unknown body part'}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: LuxuryTheme.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  colorSwatch: {
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 26,
    marginRight: 8,
    width: 26,
  },
  colorsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  fallbackText: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  itemCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
  },
  itemFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 220,
    justifyContent: 'center',
    width: '100%',
  },
  itemImage: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 220,
    width: '100%',
  },
  itemTextWrap: {
    marginTop: 12,
  },
  itemTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  meta: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    marginTop: 6,
  },
  name: {
    color: LuxuryTheme.textStrong,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },
  screen: {
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  title: {
    color: LuxuryTheme.textStrong,
    fontSize: 20,
    fontWeight: '800',
  },
});
