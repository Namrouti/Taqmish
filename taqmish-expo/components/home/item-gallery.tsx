import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { LuxuryTheme } from '@/constants/theme';
import type { DisplayHomeItem } from '@/types/home';

export type ItemGalleryProps = {
  isLoading: boolean;
  items: DisplayHomeItem[];
  outfitCanvasBounds: { height: number; width: number; x: number; y: number };
  selectedSuggestionItemIds: string[];
  onDropActiveChange: (active: boolean) => void;
  onDraggedItemChange: (item: DisplayHomeItem | null) => void;
  onDragPositionChange: (position: { x: number; y: number }) => void;
  onItemDrop: (item: DisplayHomeItem) => void;
  onItemPress: (item: DisplayHomeItem) => void;
  onSeedToggle: (item: DisplayHomeItem) => void;
};

export function ItemGallery({
  isLoading,
  items,
  outfitCanvasBounds,
  selectedSuggestionItemIds,
  onDropActiveChange,
  onDraggedItemChange,
  onDragPositionChange,
  onItemDrop,
  onItemPress,
  onSeedToggle,
}: ItemGalleryProps) {
  const createItemDragResponder = (item: DisplayHomeItem) => {
    const isInsideOutfitBounds = (pageX: number, pageY: number) =>
      pageX >= outfitCanvasBounds.x &&
      pageX <= outfitCanvasBounds.x + outfitCanvasBounds.width &&
      pageY >= outfitCanvasBounds.y &&
      pageY <= outfitCanvasBounds.y + outfitCanvasBounds.height;

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: (event) => {
        onDraggedItemChange(item);
        onDragPositionChange({
          x: event.nativeEvent.pageX - 42,
          y: event.nativeEvent.pageY - 42,
        });
      },
      onPanResponderMove: (event) => {
        onDragPositionChange({
          x: event.nativeEvent.pageX - 42,
          y: event.nativeEvent.pageY - 42,
        });
        onDropActiveChange(isInsideOutfitBounds(event.nativeEvent.pageX, event.nativeEvent.pageY));
      },
      onPanResponderRelease: (event) => {
        const droppedInside = isInsideOutfitBounds(event.nativeEvent.pageX, event.nativeEvent.pageY);
        if (droppedInside) {
          onItemDrop(item);
        }
        onDraggedItemChange(null);
        onDropActiveChange(false);
      },
      onPanResponderTerminate: () => {
        onDraggedItemChange(null);
        onDropActiveChange(false);
      },
    });
  };

  return (
    <>
      <View style={styles.itemsHeader}>
        <View>
          <Text style={styles.itemsHeaderTitle}>Closet Items</Text>
          <Text style={styles.itemsHeaderSubtitle}>Tap to preview, or drag an item into the outfit board.</Text>
        </View>
        <View style={styles.dragHintChip}>
          <Ionicons color={LuxuryTheme.accent} name="move-outline" size={14} />
          <Text style={styles.dragHintText}>Drag</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Loading items...</Text>
        </View>
      ) : items.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalItemsContent}
          style={styles.itemsStrip}>
          {items.map((item, index) => {
            const dragResponder = createItemDragResponder(item);
            return (
              <Pressable
                key={item.id ?? `${item.subParts}-${index}`}
                onPress={() => onItemPress(item)}
                style={styles.itemCard}
                {...dragResponder.panHandlers}>
                <Pressable
                  onPress={() => onSeedToggle(item)}
                  style={[
                    styles.seedToggle,
                    item.id && selectedSuggestionItemIds.includes(item.id) ? styles.seedToggleSelected : null,
                  ]}>
                  <Text
                    style={[
                      styles.seedToggleText,
                      item.id && selectedSuggestionItemIds.includes(item.id) ? styles.seedToggleTextSelected : null,
                    ]}>
                    {item.id && selectedSuggestionItemIds.includes(item.id) ? 'Picked' : 'Pick'}
                  </Text>
                </Pressable>
                {item.displayUri ? (
                  <Image source={{ uri: item.displayUri }} style={styles.itemImage} contentFit="cover" />
                ) : (
                  <View style={styles.itemFallback}>
                    <Text style={styles.itemFallbackText}>{item.subParts || item.bodyPart || 'Item'}</Text>
                  </View>
                )}
                <View style={styles.itemCardFooter}>
                  <Text numberOfLines={1} style={styles.itemCardTitle}>
                    {item.subParts || item.bodyPart || 'Item'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No items match this filter.</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dragHintChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dragHintText: {
    color: LuxuryTheme.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  emptyText: {
    color: LuxuryTheme.textMuted,
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 132,
    padding: 24,
  },
  horizontalItemsContent: {
    paddingLeft: 2,
    paddingBottom: 8,
    paddingRight: 6,
  },
  itemCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    height: 132,
    marginRight: 10,
    overflow: 'hidden',
    padding: 4,
    width: 126,
  },
  itemCardFooter: {
    backgroundColor: 'rgba(255,253,252,0.94)',
    borderTopColor: LuxuryTheme.borderSoft,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: 'absolute',
    right: 0,
  },
  itemCardTitle: {
    color: LuxuryTheme.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  itemFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    padding: 8,
  },
  itemFallbackText: {
    color: LuxuryTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  itemImage: {
    borderRadius: 14,
    height: '100%',
    width: '100%',
  },
  itemsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 2,
  },
  itemsHeaderSubtitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  itemsHeaderTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  itemsStrip: {
    flexGrow: 0,
  },
  seedToggle: {
    backgroundColor: 'rgba(28, 23, 18, 0.94)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 2,
  },
  seedToggleSelected: {
    backgroundColor: LuxuryTheme.chipActive,
  },
  seedToggleText: {
    color: LuxuryTheme.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  seedToggleTextSelected: {
    color: LuxuryTheme.accentSoft,
  },
});
