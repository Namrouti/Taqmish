import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LuxuryTheme } from '@/constants/theme';
import type { CanvasBounds, HomeItem, OutfitPlacement, OutfitSlot, SelectedOutfit } from '@/types/home';

const OUTFIT_CANVAS_MIN_HEIGHT = 380;
const OUTFIT_CANVAS_MIN_WIDTH = 320;

function fitPlacementInsideCanvas(
  placement: OutfitPlacement,
  canvasWidth: number,
  canvasHeight: number
): OutfitPlacement {
  return {
    ...placement,
    x: Math.max(0, Math.min(placement.x, Math.max(0, canvasWidth - placement.width))),
    y: Math.max(0, Math.min(placement.y, Math.max(0, canvasHeight - placement.height))),
  };
}

function getDefaultOutfitPlacements(
  canvasWidth: number = OUTFIT_CANVAS_MIN_WIDTH,
  canvasHeight: number = OUTFIT_CANVAS_MIN_HEIGHT
): Record<OutfitSlot, OutfitPlacement> {
  const safeWidth = Math.max(OUTFIT_CANVAS_MIN_WIDTH, canvasWidth);
  const safeHeight = Math.max(OUTFIT_CANVAS_MIN_HEIGHT, canvasHeight);
  const mainColumnX = 22;
  const mainColumnWidth = Math.min(Math.round(safeWidth * 0.47), 176);
  const topHeight = Math.min(Math.round(safeHeight * 0.32), 186);
  const bottomWidth = Math.max(132, Math.min(Math.round(mainColumnWidth * 0.78), 144));
  const bottomHeight = Math.min(Math.round(safeHeight * 0.36), 208);
  const bottomX = mainColumnX + Math.round((mainColumnWidth - bottomWidth) / 2);
  const rightTile = Math.min(Math.round(safeWidth * 0.24), 84);
  const rightColumnX = safeWidth - rightTile - 20;
  const hatWidth = Math.min(Math.round(safeWidth * 0.33), 114);
  const hatX = safeWidth - hatWidth - 18;
  const shoesWidth = Math.min(Math.round(safeWidth * 0.39), 152);
  const shoesHeight = 88;
  const shoesX = safeWidth - shoesWidth - 16;

  return {
    Tops: fitPlacementInsideCanvas({ height: topHeight, width: mainColumnWidth, x: mainColumnX, y: 24 }, safeWidth, safeHeight),
    Bottoms: fitPlacementInsideCanvas({ height: bottomHeight, width: bottomWidth, x: bottomX, y: topHeight + 54 }, safeWidth, safeHeight),
    Shoes: fitPlacementInsideCanvas({ height: shoesHeight, width: shoesWidth, x: shoesX, y: safeHeight - 108 }, safeWidth, safeHeight),
    Accessories: fitPlacementInsideCanvas({ height: rightTile, width: rightTile, x: rightColumnX, y: Math.round(safeHeight * 0.31) }, safeWidth, safeHeight),
    Bags: fitPlacementInsideCanvas({ height: rightTile + 8, width: rightTile + 10, x: Math.max(12, rightColumnX - 2), y: Math.round(safeHeight * 0.56) }, safeWidth, safeHeight),
    Watch: fitPlacementInsideCanvas({ height: Math.max(rightTile - 6, 66), width: Math.max(rightTile - 6, 66), x: rightColumnX + 6, y: Math.round(safeHeight * 0.45) }, safeWidth, safeHeight),
    Hat: fitPlacementInsideCanvas({ height: 76, width: hatWidth, x: hatX, y: 18 }, safeWidth, safeHeight),
  };
}

function clampPlacement(
  placement: OutfitPlacement,
  canvasWidth: number,
  canvasHeight: number
): OutfitPlacement {
  const width = Math.min(Math.max(60, placement.width), Math.max(60, canvasWidth));
  const height = Math.min(Math.max(60, placement.height), Math.max(60, canvasHeight));
  return {
    width,
    height,
    x: Math.max(0, Math.min(placement.x, Math.max(0, canvasWidth - width))),
    y: Math.max(0, Math.min(placement.y, Math.max(0, canvasHeight - height))),
  };
}

function getSuggestedPlacement(
  item: HomeItem,
  slot: OutfitSlot,
  canvasWidth: number = OUTFIT_CANVAS_MIN_WIDTH,
  canvasHeight: number = OUTFIT_CANVAS_MIN_HEIGHT
): OutfitPlacement {
  const base = getDefaultOutfitPlacements(canvasWidth, canvasHeight)[slot];
  const descriptor = `${item.subParts ?? ''} ${item.title ?? ''} ${item.subType ?? ''}`.toLowerCase();

  if (slot === 'Tops' && (descriptor.includes('dress') || descriptor.includes('abaya') || descriptor.includes('gown'))) {
    return { ...base, height: base.height + 62, width: base.width + 18, x: Math.max(8, base.x - 8), y: Math.max(16, base.y - 2) };
  }
  if (slot === 'Shoes') {
    return { ...base, height: Math.max(84, base.height), width: Math.max(136, base.width) };
  }
  return base;
}

export type OutfitCanvasProps = {
  canSave: boolean;
  getDisplayUri: (item?: HomeItem | null) => string | undefined;
  isDropActive: boolean;
  outfit: SelectedOutfit;
  onBoundsChange: (bounds: CanvasBounds) => void;
  onClear: () => void;
  onEmptyPress: () => void;
  onOpenDetail: () => void;
  onSaveToCalendar: () => void;
  onSaveToCloset: () => void;
  onSlotRemove: (slot: OutfitSlot) => void;
  onSuggest: () => void;
};

export function OutfitCanvas({
  canSave,
  getDisplayUri,
  isDropActive,
  outfit,
  onBoundsChange,
  onClear,
  onEmptyPress,
  onOpenDetail,
  onSaveToCalendar,
  onSaveToCloset,
  onSlotRemove,
  onSuggest,
}: OutfitCanvasProps) {
  const [outfitPlacements, setOutfitPlacements] = useState<Record<OutfitSlot, OutfitPlacement>>(
    () => getDefaultOutfitPlacements()
  );
  const [canvasSize, setCanvasSize] = useState({ height: OUTFIT_CANVAS_MIN_HEIGHT, width: OUTFIT_CANVAS_MIN_WIDTH });
  const [selectedSlot, setSelectedSlot] = useState<OutfitSlot | null>(null);
  const canvasRef = useRef<View>(null);
  const prevOutfitRef = useRef<SelectedOutfit>(outfit);

  const hasSelectedItem = Object.values(outfit).some(Boolean);

  const syncBounds = useCallback(() => {
    if (!canvasRef.current?.measureInWindow) return;
    canvasRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      onBoundsChange({ height, width, x, y });
    });
  }, [onBoundsChange]);

  const autoArrange = useCallback(
    (outfitToArrange: SelectedOutfit) => {
      setOutfitPlacements((current) => {
        const next = { ...current };
        (Object.entries(outfitToArrange) as [OutfitSlot, HomeItem | null | undefined][]).forEach(
          ([slot, item]) => {
            if (item) {
              next[slot] = clampPlacement(
                getSuggestedPlacement(item, slot, canvasSize.width, canvasSize.height),
                canvasSize.width,
                canvasSize.height
              );
            }
          }
        );
        return next;
      });
    },
    [canvasSize.height, canvasSize.width]
  );

  // Auto-select newly added slot; clear selection when its item is removed
  useEffect(() => {
    const prev = prevOutfitRef.current;
    const newSlot = (Object.keys(outfit) as OutfitSlot[]).find(
      (slot) => Boolean(outfit[slot]) && !prev[slot]
    );
    if (newSlot) {
      setSelectedSlot(newSlot);
    } else if (selectedSlot && !outfit[selectedSlot]) {
      setSelectedSlot(null);
    }
    prevOutfitRef.current = outfit;
  }, [outfit, selectedSlot]);

  // Sync canvas bounds and auto-arrange when canvas size or outfit changes
  useEffect(() => {
    syncBounds();
  }, [syncBounds, canvasSize.height, canvasSize.width]);

  useEffect(() => {
    if (!hasSelectedItem) {
      setOutfitPlacements(getDefaultOutfitPlacements(canvasSize.width, canvasSize.height));
      return;
    }
    autoArrange(outfit);
  }, [autoArrange, hasSelectedItem, canvasSize.height, canvasSize.width, outfit]);

  return (
    <View style={styles.outfitSection}>
      <View style={styles.galleryCard}>
        <View
          onLayout={(event) => {
            setCanvasSize({
              height: Math.max(OUTFIT_CANVAS_MIN_HEIGHT, event.nativeEvent.layout.height),
              width: Math.max(OUTFIT_CANVAS_MIN_WIDTH, event.nativeEvent.layout.width),
            });
            syncBounds();
          }}
          ref={canvasRef}
          style={[styles.outfitCanvas, isDropActive ? styles.outfitCanvasDropActive : null]}>

          {hasSelectedItem ? <Pressable onPress={onOpenDetail} style={styles.canvasTapLayer} /> : null}

          {!hasSelectedItem ? (
            <Pressable onPress={onEmptyPress} style={styles.emptyCanvasState}>
              <View style={styles.emptyCanvasArtwork}>
                <View style={styles.emptyCanvasBlobPrimary} />
                <View style={styles.emptyCanvasBlobSecondary} />
                <Ionicons color="#C58B66" name="images-outline" size={38} />
              </View>
              <Text style={styles.emptyCanvasTitle}>Start your outfit board</Text>
              <Text style={styles.emptyCanvasText}>
                Pick pieces to place them here. The colors and suggestions will keep following your selected range and harmony rules.
              </Text>
            </Pressable>
          ) : null}

          {(Object.entries(outfit) as [OutfitSlot, HomeItem | null | undefined][])
            .filter(([, item]) => Boolean(item))
            .map(([slot, item]) => {
              const displayUri = getDisplayUri(item);
              if (!item || !displayUri) return null;

              const fallbackPlacement = getDefaultOutfitPlacements(canvasSize.width, canvasSize.height)[slot];
              const placement = outfitPlacements[slot] ?? fallbackPlacement;
              const isSelected = selectedSlot === slot;

              return (
                <View
                  key={slot}
                  style={[
                    styles.canvasPieceWrap,
                    { height: placement.height, left: placement.x, top: placement.y, width: placement.width },
                  ]}>
                  <Pressable
                    onLongPress={onOpenDetail}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.canvasPiece, isSelected ? styles.canvasPieceSelected : null]}>
                    <Image source={{ uri: displayUri }} style={styles.canvasPieceImage} contentFit="contain" />
                  </Pressable>
                  {isSelected ? (
                    <View style={styles.canvasPieceControls}>
                      <Pressable onPress={() => onSlotRemove(slot)} style={styles.canvasControlButton}>
                        <Ionicons color={LuxuryTheme.accent} name="trash-outline" size={14} />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
        </View>
      </View>

      <View style={styles.actionsColumn}>
        <Pressable
          onPress={onSuggest}
          style={({ pressed }) => [styles.iconActionButton, pressed ? styles.sideActionPressed : null]}>
          <Ionicons color={LuxuryTheme.accentSoft} name="sparkles-outline" size={16} />
        </Pressable>
        <Pressable
          onPress={() => autoArrange(outfit)}
          style={({ pressed }) => [styles.iconSecondaryButton, pressed ? styles.sideActionPressed : null]}>
          <Ionicons color={LuxuryTheme.accent} name="grid-outline" size={16} />
        </Pressable>
        <Pressable
          disabled={!canSave}
          onPress={onSaveToCalendar}
          style={({ pressed }) => [
            styles.iconSecondaryButton,
            !canSave ? styles.disabledButton : null,
            pressed && canSave ? styles.sideActionPressed : null,
          ]}>
          <Ionicons color={!canSave ? '#7C6855' : LuxuryTheme.accent} name="calendar-outline" size={16} />
        </Pressable>
        <Pressable
          disabled={!canSave}
          onPress={onSaveToCloset}
          style={({ pressed }) => [
            styles.iconSecondaryButton,
            !canSave ? styles.disabledButton : null,
            pressed && canSave ? styles.sideActionPressed : null,
          ]}>
          <Ionicons color={!canSave ? '#7C6855' : LuxuryTheme.accent} name="save-outline" size={16} />
        </Pressable>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [styles.iconClearButton, pressed ? styles.sideActionPressed : null]}>
          <Ionicons color={LuxuryTheme.accent} name="trash-outline" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsColumn: {
    alignItems: 'stretch',
    gap: 6,
    justifyContent: 'space-between',
    marginLeft: 8,
    width: 50,
  },
  canvasControlButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  canvasPiece: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 24, 19, 0.94)',
    borderColor: LuxuryTheme.border,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 6,
    shadowColor: LuxuryTheme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  canvasPieceControls: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 6,
  },
  canvasPieceImage: {
    height: '100%',
    width: '100%',
  },
  canvasPieceSelected: {
    borderColor: LuxuryTheme.accent,
    borderWidth: 2,
  },
  canvasPieceWrap: {
    position: 'absolute',
  },
  canvasTapLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  disabledButton: {
    borderColor: LuxuryTheme.borderSoft,
    opacity: 0.55,
  },
  emptyCanvasArtwork: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 999,
    height: 110,
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    width: 110,
  },
  emptyCanvasBlobPrimary: {
    backgroundColor: 'rgba(214, 176, 106, 0.16)',
    borderRadius: 999,
    height: 72,
    left: 10,
    position: 'absolute',
    top: 12,
    width: 72,
  },
  emptyCanvasBlobSecondary: {
    backgroundColor: 'rgba(232, 201, 140, 0.12)',
    borderRadius: 999,
    bottom: 12,
    height: 54,
    position: 'absolute',
    right: 12,
    width: 54,
  },
  emptyCanvasState: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 28,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  emptyCanvasText: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyCanvasTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  galleryCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    height: '100%',
    padding: 10,
  },
  iconActionButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  iconClearButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.accent,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  iconSecondaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.accent,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  outfitCanvas: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.border,
    borderRadius: 18,
    borderWidth: 1,
    height: '100%',
    minHeight: OUTFIT_CANVAS_MIN_HEIGHT,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 12,
    position: 'relative',
  },
  outfitCanvasDropActive: {
    borderColor: LuxuryTheme.accent,
    borderWidth: 2,
  },
  outfitSection: {
    alignItems: 'stretch',
    flexDirection: 'row',
    height: OUTFIT_CANVAS_MIN_HEIGHT + 84,
    marginTop: 10,
  },
  sideActionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
});
