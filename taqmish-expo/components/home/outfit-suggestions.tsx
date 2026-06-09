import { useMemo } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LuxuryTheme } from '@/constants/theme';
import type { HomeItem, SelectedOutfit, SuggestedOutfit } from '@/types/home';

export type OutfitSuggestionsProps = {
  suggestions: SuggestedOutfit[];
  visible: boolean;
  getDisplayUri: (item?: HomeItem | null) => string | undefined;
  onApply: (outfit: SelectedOutfit) => void;
  onClose: () => void;
  onSaveToCloset: (outfit: SelectedOutfit) => void;
  onSchedule: (outfit: SelectedOutfit) => void;
};

function createSwipeDismissResponder(onDismiss: () => void) {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 64 && gestureState.vy > 0.15) {
        onDismiss();
      }
    },
    onPanResponderTerminate: (_, gestureState) => {
      if (gestureState.dy > 64) {
        onDismiss();
      }
    },
  });
}

export function OutfitSuggestions({
  suggestions,
  visible,
  getDisplayUri,
  onApply,
  onClose,
  onSaveToCloset,
  onSchedule,
}: OutfitSuggestionsProps) {
  const insets = useSafeAreaInsets();
  const dismissResponder = useMemo(() => createSwipeDismissResponder(onClose), [onClose]);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={[styles.screen, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 }]}>
        <View style={styles.swipeZone} {...dismissResponder.panHandlers}>
          <View style={styles.swipeHandle} />
        </View>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={styles.title}>Suggested Outfits</Text>
          </View>
          <Pressable
            accessibilityLabel="Close suggested outfits"
            onPress={onClose}
            style={styles.closeButton}>
            <Ionicons color={LuxuryTheme.accent} name="close" size={18} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {suggestions.map((suggestion, index) => (
            <View key={suggestion.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{suggestion.label}</Text>
                  <Text style={styles.meta}>Match score: {suggestion.score}</Text>
                  <Text style={styles.meta}>
                    Items: {
                      [
                        suggestion.outfit.Tops,
                        suggestion.outfit.Bottoms,
                        suggestion.outfit.Shoes,
                        suggestion.outfit.Accessories,
                        suggestion.outfit.Bags,
                        suggestion.outfit.Hat,
                        suggestion.outfit.Watch,
                      ].filter(Boolean).length
                    }
                  </Text>
                </View>
                <Text style={styles.badge}>#{index + 1}</Text>
              </View>

              <View style={styles.colorsRow}>
                {suggestion.colorSummary.length ? (
                  suggestion.colorSummary.map((color, colorIndex) => (
                    <View key={`${suggestion.id}-${color}-${colorIndex}`} style={[styles.colorChip, { backgroundColor: color }]} />
                  ))
                ) : (
                  <Text style={styles.meta}>No saved colors</Text>
                )}
              </View>

              <View style={styles.preview}>
                {([
                  suggestion.outfit.Tops,
                  suggestion.outfit.Bottoms,
                  suggestion.outfit.Shoes,
                  suggestion.outfit.Accessories,
                ] as (HomeItem | null | undefined)[]).map((item, itemIndex) => (
                  <View key={`${suggestion.id}-${itemIndex}`} style={styles.previewTile}>
                    {getDisplayUri(item) ? (
                      <Image source={{ uri: getDisplayUri(item)! }} style={styles.previewImage} contentFit="cover" />
                    ) : null}
                  </View>
                ))}
              </View>

              <View style={styles.actions}>
                <Pressable onPress={() => onApply(suggestion.outfit)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Use</Text>
                </Pressable>
                <Pressable onPress={() => onSaveToCloset(suggestion.outfit)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Save</Text>
                </Pressable>
                <Pressable onPress={() => onSchedule(suggestion.outfit)} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Calendar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
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
  badge: {
    backgroundColor: LuxuryTheme.chipActive,
    borderRadius: 999,
    color: LuxuryTheme.accentSoft,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  card: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  colorChip: {
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 22,
    marginRight: 8,
    width: 22,
  },
  colorsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    minHeight: 24,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  meta: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  preview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  previewImage: {
    borderRadius: 16,
    height: '100%',
    width: '100%',
  },
  previewTile: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    flex: 1,
    height: 116,
    overflow: 'hidden',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 6,
  },
  primaryButtonText: {
    color: '#120F0D',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  screen: {
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.accent,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 6,
  },
  secondaryButtonText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  swipeHandle: {
    backgroundColor: LuxuryTheme.border,
    borderRadius: 999,
    height: 5,
    width: 44,
  },
  swipeZone: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 2,
  },
  title: {
    color: LuxuryTheme.textStrong,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
});
