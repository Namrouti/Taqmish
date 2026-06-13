import { useRef, useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ref as databaseRef, update } from 'firebase/database';

import { database } from '@/lib/firebase';

import { AppShell } from '@/components/app-shell';
import { ItemCaptureDialog, type ItemCaptureDialogRef } from '@/components/closet/item-capture-dialog';
import { SectionManagerDialog } from '@/components/closet/section-manager-dialog';
import { ClosetItemDetailModal } from '@/components/closet/closet-item-detail-modal';
import { OutfitDetailModal } from '@/components/closet/outfit-detail-modal';
import { LuxuryTheme } from '@/constants/theme';
import { type ClosetItem } from '@/hooks/use-closet-items';
import { useClosetSections } from '@/hooks/use-closet-sections';
import { type OutfitRecord, useOutfits } from '@/hooks/use-outfits';
import { useWardrobeItems } from '@/hooks/use-wardrobe-items';
import { useAuth } from '@/providers/auth-provider';
import type { ClosetFilter, ClosetViewMode, DisplaySection, OutfitSourceFilter, SectionDialogMode } from '@/types/closet';
import {
  ALL_SECTIONS_ID,
  buildDisplaySections,
  buildSectionIdsMap,
  getOutfitColors,
  getOutfitItems,
  getOutfitSourceFilter,
  matchesSection,
  resolveDisplaySectionForItem,
  resolveImageUri,
  toLegacyClosetItem,
} from '@/utils/closet-helpers';

const filters: ClosetFilter[] = ['All', 'Top', 'Bottom', 'Shoes', 'Accessories', 'Bag'];
const outfitSourceFilters: OutfitSourceFilter[] = ['My Closet', 'Store', 'Mixed'];

function mapFilterMatch(item: ClosetItem, filter: ClosetFilter) {
  if (filter === 'All') return true;
  const subParts = (item.subParts ?? '').toLowerCase();
  if (filter === 'Bag') return subParts.includes('bag');
  return subParts.includes(filter.toLowerCase());
}

export default function ClosetScreen() {
  const { authUser, isLoading: isAuthLoading } = useAuth();
  const { isLoading, userItems } = useWardrobeItems(authUser?.uid);
  const { items: savedOutfits, isLoading: isLoadingOutfits } = useOutfits(authUser?.uid);
  const { items: sectionRecords } = useClosetSections(authUser?.uid);

  const captureDialogRef = useRef<ItemCaptureDialogRef>(null);

  const [activeFilter, setActiveFilter] = useState<ClosetFilter>('All');
  const [activeSectionId, setActiveSectionId] = useState(ALL_SECTIONS_ID);
  const [isSectionDialogVisible, setSectionDialogVisible] = useState(false);
  const [sectionDialogMode, setSectionDialogMode] = useState<SectionDialogMode>('create');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isMovingItem, setIsMovingItem] = useState(false);
  const [movingItem, setMovingItem] = useState<ClosetItem | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<ClosetItem | null>(null);
  const [selectedOutfitDetail, setSelectedOutfitDetail] = useState<OutfitRecord | null>(null);
  const [viewMode, setViewMode] = useState<ClosetViewMode>('items');
  const [savedOutfitSourceFilter, setSavedOutfitSourceFilter] = useState<OutfitSourceFilter>('Mixed');
  const [itemOverrides, setItemOverrides] = useState<Record<string, Partial<ClosetItem>>>({});
  const [deletedItemIds, setDeletedItemIds] = useState<Record<string, true>>({});

  const items = useMemo(
    () =>
      userItems
        .map(toLegacyClosetItem)
        .filter((item) => !item.id || !deletedItemIds[item.id])
        .map((item) => {
          if (!item.id) return item;
          const override = itemOverrides[item.id];
          return override ? { ...item, ...override } : item;
        }),
    [deletedItemIds, itemOverrides, userItems]
  );
  const sections = useMemo(() => buildDisplaySections(sectionRecords), [sectionRecords]);
  const sectionIdsMap = useMemo(() => buildSectionIdsMap(sections), [sections]);
  const rootSections = useMemo(() => sections.filter((s) => s.level === 0), [sections]);
  const selectedSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? null,
    [activeSectionId, sections]
  );
  const visibleChildSections = useMemo(
    () =>
      selectedSection && selectedSection.level === 0
        ? sections.filter((s) => s.parentSectionId === selectedSection.id)
        : [],
    [sections, selectedSection]
  );
  const editingSection = useMemo(
    () => sections.find((s) => s.id === editingSectionId) ?? null,
    [editingSectionId, sections]
  );
  const sectionItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const section of sections) {
      const ids = sectionIdsMap.get(section.id) ?? new Set([section.id]);
      counts.set(section.id, items.filter((item) => matchesSection(item, ids, section.types)).length);
    }
    return counts;
  }, [items, sectionIdsMap, sections]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (!mapFilterMatch(item, activeFilter)) return false;
        if (activeSectionId === ALL_SECTIONS_ID || !selectedSection) return true;
        return matchesSection(
          item,
          sectionIdsMap.get(selectedSection.id) ?? new Set([selectedSection.id]),
          selectedSection.types
        );
      }),
    [activeFilter, activeSectionId, items, sectionIdsMap, selectedSection]
  );

  const closetShelfGroups = useMemo(() => {
    const buckets = new Map<string, { id: string; iconKey?: string; itemCount: number; items: ClosetItem[]; label: string; pathLabel?: string }>();
    for (const item of filteredItems) {
      const section = resolveDisplaySectionForItem(item, sections);
      const groupId = section?.id ?? 'unassigned';
      const existing = buckets.get(groupId);
      if (existing) {
        existing.items.push(item);
        existing.itemCount += 1;
        continue;
      }
      buckets.set(groupId, {
        id: groupId,
        iconKey: section?.iconKey ?? 'shirt-outline',
        itemCount: 1,
        items: [item],
        label: section?.name ?? 'Open Space',
        pathLabel: section?.pathLabel,
      });
    }
    return Array.from(buckets.values()).sort((left, right) => {
      if (left.id === 'unassigned') return 1;
      if (right.id === 'unassigned') return -1;
      return left.label.localeCompare(right.label);
    });
  }, [filteredItems, sections]);

  const filteredSavedOutfits = useMemo(
    () =>
      savedOutfitSourceFilter === 'Mixed'
        ? savedOutfits
        : savedOutfits.filter((outfit) => getOutfitSourceFilter(outfit) === savedOutfitSourceFilter),
    [savedOutfitSourceFilter, savedOutfits]
  );

  if (isAuthLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={LuxuryTheme.accent} />
      </View>
    );
  }

  if (!authUser) {
    return <Redirect href="/login" />;
  }

  const openSectionDialog = () => {
    setSectionDialogMode('create');
    setEditingSectionId(null);
    setSectionDialogVisible(true);
  };

  const openEditSectionDialog = () => {
    if (!selectedSection || selectedSection.id === ALL_SECTIONS_ID) return;
    setSectionDialogMode('edit');
    setEditingSectionId(selectedSection.id);
    setSectionDialogVisible(true);
  };

  const startMoveItem = (item: ClosetItem) => {
    setMovingItem(item);
    setIsMovingItem(true);
    if (item.closetSectionId) setActiveSectionId(item.closetSectionId);
  };

  const moveItemToSection = async (targetSection: DisplaySection | null) => {
    if (!authUser?.uid || !movingItem?.id) return;
    const movingItemId = movingItem.id;
    const previousOverride = itemOverrides[movingItemId];
    const optimisticPayload: Partial<ClosetItem> = {
      closetSectionId: targetSection?.id,
      closetSectionName: targetSection?.name,
      closetSectionPath: targetSection?.pathLabel,
    };
    try {
      const updatePayload = {
        closetSectionId: targetSection?.id ?? null,
        closetSectionName: targetSection?.name ?? null,
        closetSectionPath: targetSection?.pathLabel ?? null,
      };
      setItemOverrides((current) => ({
        ...current,
        [movingItemId]: { ...(current[movingItemId] ?? {}), ...optimisticPayload },
      }));
      setSelectedItemDetail((current) =>
        current?.id === movingItemId ? { ...current, ...optimisticPayload } : current
      );
      await Promise.all([
        update(databaseRef(database, `SiteClosets/${authUser.uid}/${movingItemId}`), updatePayload),
        update(databaseRef(database, `userClosetItems/${authUser.uid}/${movingItemId}`), updatePayload),
      ]);
      setMovingItem(null);
      setIsMovingItem(false);
      Alert.alert('Item moved successfully.');
    } catch (error) {
      setItemOverrides((current) => {
        if (!previousOverride) {
          const next = { ...current };
          delete next[movingItemId];
          return next;
        }
        return {
          ...current,
          [movingItemId]: previousOverride,
        };
      });
      Alert.alert('Failed to move item.', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <AppShell
      onPrimaryAction={() => captureDialogRef.current?.open()}
      primaryActionBottomOffset={98}
      primaryActionIcon="camera-outline"
      primaryActionLabel="Add a closet item"
      primaryActionRightOffset={18}
      title="My Closet">
      {/* View toggle */}
      <View style={styles.viewTabsWrap}>
        <Pressable
          onPress={() => setViewMode('items')}
          style={[styles.viewTab, viewMode === 'items' ? styles.viewTabSelected : null]}>
          <Ionicons
            name="shirt-outline"
            size={14}
            color={viewMode === 'items' ? LuxuryTheme.chipActiveText : LuxuryTheme.textStrong}
            style={styles.viewTabIcon}
          />
          <Text style={[styles.viewTabText, viewMode === 'items' ? styles.viewTabTextSelected : null]}>
            Closet Items
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('outfits')}
          style={[styles.viewTab, viewMode === 'outfits' ? styles.viewTabSelected : null]}>
          <Ionicons
            name="layers-outline"
            size={14}
            color={viewMode === 'outfits' ? LuxuryTheme.chipActiveText : LuxuryTheme.textStrong}
            style={styles.viewTabIcon}
          />
          <Text style={[styles.viewTabText, viewMode === 'outfits' ? styles.viewTabTextSelected : null]}>
            Saved Outfits
          </Text>
        </Pressable>
      </View>

      {/* Header row */}
      <View style={styles.filterHeader}>
        <Text style={styles.filterHeaderTitle}>
          {viewMode === 'items' ? 'My clothes' : 'Saved outfits'}
        </Text>
        <Text style={styles.filterHeaderMeta}>
          {viewMode === 'items'
            ? `${filteredItems.length} piece${filteredItems.length === 1 ? '' : 's'}`
            : `${filteredSavedOutfits.length} outfit${filteredSavedOutfits.length === 1 ? '' : 's'}`}
        </Text>
      </View>

      {viewMode === 'items' ? (
        <>
          {/* Type filter chips */}
          <ScrollView
            contentContainerStyle={styles.filtersRow}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => {
              const selected = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterChip, selected ? styles.filterChipSelected : null]}>
                  <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section filter row — inline, no card wrapper */}
          <View style={styles.sectionFilterRow}>
            <ScrollView
              contentContainerStyle={styles.sectionFilterScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sectionFilterScrollView}>
              <Pressable
                onPress={() => {
                  if (isMovingItem) { void moveItemToSection(null); return; }
                  setActiveSectionId(ALL_SECTIONS_ID);
                }}
                style={[
                  styles.sectionChip,
                  activeSectionId === ALL_SECTIONS_ID ? styles.filterChipSelected : null,
                  isMovingItem ? styles.dropTargetChip : null,
                ]}>
                <Text style={[styles.filterChipText, activeSectionId === ALL_SECTIONS_ID ? styles.filterChipTextSelected : null]}>
                  All
                </Text>
              </Pressable>
              {rootSections.map((section) => {
                const selected = activeSectionId === section.id;
                return (
                  <Pressable
                    key={section.id}
                    onPress={() => {
                      if (isMovingItem) { void moveItemToSection(section); return; }
                      setActiveSectionId(section.id);
                    }}
                    style={[
                      styles.sectionChip,
                      selected ? styles.filterChipSelected : null,
                      isMovingItem ? styles.dropTargetChip : null,
                    ]}>
                    <Ionicons
                      color={selected ? LuxuryTheme.chipActiveText : LuxuryTheme.textStrong}
                      name={(section.iconKey as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                      size={12}
                      style={styles.sectionChipIcon}
                    />
                    <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>
                      {section.name}
                    </Text>
                  </Pressable>
                );
              })}
              {visibleChildSections.map((section) => {
                const selected = activeSectionId === section.id;
                return (
                  <Pressable
                    key={section.id}
                    onPress={() => {
                      if (isMovingItem) { void moveItemToSection(section); return; }
                      setActiveSectionId(section.id);
                    }}
                    style={[
                      styles.sectionChip,
                      selected ? styles.filterChipSelected : null,
                      isMovingItem ? styles.dropTargetChip : null,
                    ]}>
                    <Ionicons
                      color={selected ? LuxuryTheme.chipActiveText : LuxuryTheme.textStrong}
                      name={(section.iconKey as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                      size={12}
                      style={styles.sectionChipIcon}
                    />
                    <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>
                      {section.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.sectionFilterActions}>
              {selectedSection ? (
                <Pressable onPress={openEditSectionDialog} style={styles.sectionActionBtn}>
                  <Ionicons name="pencil-outline" size={14} color={LuxuryTheme.textStrong} />
                </Pressable>
              ) : null}
              <Pressable onPress={openSectionDialog} style={styles.sectionActionBtn}>
                <Ionicons name="add" size={16} color={LuxuryTheme.textStrong} />
              </Pressable>
            </View>
          </View>

          {isMovingItem ? (
            <View style={styles.moveBanner}>
              <Ionicons name="move-outline" size={15} color={LuxuryTheme.accent} style={{ marginRight: 8 }} />
              <Text style={styles.moveBannerText}>
                Long-press a section chip to move "{movingItem?.subParts || 'item'}"
              </Text>
              <Pressable onPress={() => { setIsMovingItem(false); setMovingItem(null); }} style={styles.moveBannerCancelBtn}>
                <Text style={styles.moveBannerAction}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}

      {/* Outfits filter */}
      {viewMode === 'outfits' ? (
        <ScrollView
          contentContainerStyle={styles.filtersRow}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {outfitSourceFilters.map((filter) => {
            const selected = savedOutfitSourceFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSavedOutfitSourceFilter(filter)}
                style={[styles.filterChip, selected ? styles.filterChipSelected : null]}>
                <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {/* States: loading / empty */}
      {isLoading || isLoadingOutfits ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator color={LuxuryTheme.accent} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyText}>Loading your closet…</Text>
        </View>
      ) : viewMode === 'items' && filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="shirt-outline" size={40} color={LuxuryTheme.border} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>No items yet</Text>
          <Text style={styles.emptyText}>Tap the camera button to add your first piece.</Text>
        </View>
      ) : viewMode === 'outfits' && filteredSavedOutfits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="layers-outline" size={40} color={LuxuryTheme.border} style={{ marginBottom: 10 }} />
          <Text style={styles.emptyTitle}>No outfits saved</Text>
          <Text style={styles.emptyText}>Build outfits from the Home tab and save them here.</Text>
        </View>
      ) : viewMode === 'items' ? (
        /* ── 2-column grid, grouped by section ── */
        <View style={styles.closetLayout}>
          {closetShelfGroups.map((group) => (
            <View key={group.id}>
              <View style={styles.gridSectionHeader}>
                <View style={styles.gridSectionTitleWrap}>
                  <Ionicons
                    color={LuxuryTheme.accent}
                    name={(group.iconKey as keyof typeof Ionicons.glyphMap) || 'shirt-outline'}
                    size={15}
                  />
                  <Text style={styles.gridSectionTitle}>{group.label}</Text>
                </View>
                <View style={styles.gridSectionBadge}>
                  <Text style={styles.gridSectionBadgeText}>{group.itemCount}</Text>
                </View>
              </View>
              <View style={styles.itemGrid}>
                {group.items.map((item, index) => (
                  <Pressable
                    key={item.id ?? `${group.id}-${item.subParts}-${index}`}
                    onLongPress={() => startMoveItem(item)}
                    onPress={() => setSelectedItemDetail(item)}
                    style={({ pressed }) => [styles.gridItem, pressed && styles.gridItemPressed]}>
                    <View style={styles.gridItemImageWrap}>
                      {resolveImageUri(item.filePath) ? (
                        <Image
                          source={{ uri: resolveImageUri(item.filePath)! }}
                          style={styles.gridItemImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.gridItemFallback}>
                          <Ionicons name="shirt-outline" size={32} color={LuxuryTheme.border} />
                        </View>
                      )}
                      <View style={styles.hangerHook} />
                    </View>
                    <View style={styles.gridItemInfo}>
                      <Text style={styles.gridItemTitle} numberOfLines={1}>
                        {item.title || item.subParts || 'Item'}
                      </Text>
                      {item.colors?.length ? (
                        <View style={styles.gridItemColors}>
                          {item.colors.slice(0, 4).map((c, ci) => (
                            <View key={`${c}-${ci}`} style={[styles.gridItemColorDot, { backgroundColor: c }]} />
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.gridItemMeta} numberOfLines={1}>{item.subParts || ''}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        /* ── Saved outfits list ── */
        <View style={styles.outfitsList}>
          {filteredSavedOutfits.map((outfit, index) => (
            <Pressable
              key={outfit.id ?? `saved-outfit-${index}`}
              onPress={() => setSelectedOutfitDetail(outfit)}
              style={({ pressed }) => [styles.outfitCard, pressed && styles.gridItemPressed]}>
              <View style={styles.outfitGallery}>
                {getOutfitItems(outfit).slice(0, 4).map(({ item, label }) =>
                  resolveImageUri(item?.filePath) ? (
                    <Image
                      key={`${outfit.id}-${label}`}
                      source={{ uri: resolveImageUri(item?.filePath)! }}
                      style={styles.outfitGalleryImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View key={`${outfit.id}-${label}`} style={styles.outfitGalleryFallback}>
                      <Text style={styles.outfitGalleryFallbackText}>{label}</Text>
                    </View>
                  )
                )}
              </View>
              <View style={styles.outfitCardBody}>
                <Text style={styles.outfitCardTitle}>
                  {(outfit.top?.subParts ?? 'Top') + ' + ' + (outfit.down?.subParts ?? 'Bottom')}
                </Text>
                <View style={styles.outfitCardMeta}>
                  <View style={styles.outfitSourceBadge}>
                    <Text style={styles.outfitSourceBadgeText}>{getOutfitSourceFilter(outfit)}</Text>
                  </View>
                  <View style={styles.outfitColorsRow}>
                    {getOutfitColors(outfit).slice(0, 6).map((color, ci) => (
                      <View key={`${outfit.id ?? 'o'}-${color}-${ci}`} style={[styles.outfitColorDot, { backgroundColor: color }]} />
                    ))}
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <ItemCaptureDialog
        ref={captureDialogRef}
        sections={sections}
        userId={authUser.uid}
      />

      <SectionManagerDialog
        defaultParentId={activeSectionId !== ALL_SECTIONS_ID ? activeSectionId : null}
        editingSection={editingSection}
        mode={sectionDialogMode}
        sections={sections}
        sectionIdsMap={sectionIdsMap}
        sectionItemCounts={sectionItemCounts}
        userId={authUser.uid}
        visible={isSectionDialogVisible}
        onClose={() => setSectionDialogVisible(false)}
        onDeleted={() => {
          setSectionDialogVisible(false);
          setActiveSectionId(ALL_SECTIONS_ID);
        }}
        onSaved={(newSectionId) => {
          setSectionDialogVisible(false);
          if (newSectionId) setActiveSectionId(newSectionId);
        }}
      />

      <ClosetItemDetailModal
        item={selectedItemDetail}
        userId={authUser.uid}
        onClose={() => setSelectedItemDetail(null)}
        onItemDeleted={(itemId) => {
          setDeletedItemIds((current) => ({ ...current, [itemId]: true }));
          setItemOverrides((current) => {
            if (!current[itemId]) return current;
            const next = { ...current };
            delete next[itemId];
            return next;
          });
          setSelectedItemDetail((current) => (current?.id === itemId ? null : current));
        }}
        onItemUpdated={(itemId, updatedFields) => {
          setItemOverrides((current) => ({
            ...current,
            [itemId]: { ...(current[itemId] ?? {}), ...updatedFields },
          }));
          setSelectedItemDetail((current) =>
            current?.id === itemId ? { ...current, ...updatedFields } : current
          );
        }}
      />

      <OutfitDetailModal
        outfit={selectedOutfitDetail}
        onClose={() => setSelectedOutfitDetail(null)}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  // ── View toggle ──
  viewTabsWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 5,
  },
  viewTab: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 15,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 42,
  },
  viewTabSelected: {
    backgroundColor: LuxuryTheme.chipActive,
    borderColor: LuxuryTheme.accent,
    borderWidth: 1,
  },
  viewTabIcon: {},
  viewTabText: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  viewTabTextSelected: {
    color: LuxuryTheme.chipActiveText,
    fontWeight: '800',
  },

  // ── Header ──
  filterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  filterHeaderTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 22,
    fontWeight: '800',
  },
  filterHeaderMeta: {
    color: LuxuryTheme.textStrong,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Filter chips ──
  filtersRow: {
    paddingRight: 12,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipSelected: {
    backgroundColor: LuxuryTheme.chipActive,
    borderColor: LuxuryTheme.accent,
  },
  filterChipText: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: LuxuryTheme.chipActiveText,
  },

  // ── Section filter row ──
  sectionFilterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sectionFilterScrollView: {
    flex: 1,
  },
  sectionFilterScroll: {
    paddingRight: 4,
  },
  sectionChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionChipIcon: {
    marginRight: 4,
  },
  sectionFilterActions: {
    flexDirection: 'row',
    gap: 6,
  },
  sectionActionBtn: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  dropTargetChip: {
    borderColor: LuxuryTheme.accent,
    borderStyle: 'dashed',
  },

  // ── Move banner ──
  moveBanner: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surfaceRaised,
    borderColor: LuxuryTheme.accent,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moveBannerText: {
    color: LuxuryTheme.textStrong,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  moveBannerCancelBtn: {
    backgroundColor: LuxuryTheme.chipActive,
    borderRadius: 10,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  moveBannerAction: {
    color: LuxuryTheme.chipActiveText,
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Empty / loading states ──
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 28,
    borderWidth: 1,
    padding: 36,
  },
  emptyTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyText: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  // ── 2-column item grid ──
  closetLayout: {
    gap: 20,
  },
  gridSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridSectionTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  gridSectionTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  gridSectionBadge: {
    backgroundColor: LuxuryTheme.chipActive,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gridSectionBadgeText: {
    color: LuxuryTheme.chipActiveText,
    fontSize: 11,
    fontWeight: '800',
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    width: '48%',
  },
  gridItemPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  gridItemImageWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    height: 180,
    width: '100%',
  },
  gridItemImage: {
    flex: 1,
  },
  gridItemFallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  hangerHook: {
    alignSelf: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 999,
    height: 5,
    left: '50%',
    marginLeft: -20,
    position: 'absolute',
    top: 8,
    width: 40,
    zIndex: 2,
  },
  gridItemInfo: {
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  gridItemTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  gridItemMeta: {
    color: LuxuryTheme.textStrong,
    fontSize: 11,
    marginTop: 2,
  },
  gridItemColors: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
  },
  gridItemColorDot: {
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 999,
    borderWidth: 1,
    height: 12,
    width: 12,
  },

  // ── Outfit cards ──
  outfitsList: {
    gap: 12,
  },
  outfitCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  outfitGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  outfitGalleryImage: {
    height: 110,
    width: '49.5%',
  },
  outfitGalleryFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.cardAlt,
    height: 110,
    justifyContent: 'center',
    width: '49.5%',
  },
  outfitGalleryFallbackText: {
    color: LuxuryTheme.textStrong,
    fontSize: 11,
    fontWeight: '700',
  },
  outfitCardBody: {
    padding: 12,
  },
  outfitCardTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  outfitCardMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  outfitSourceBadge: {
    backgroundColor: LuxuryTheme.chipActive,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  outfitSourceBadgeText: {
    color: LuxuryTheme.chipActiveText,
    fontSize: 11,
    fontWeight: '800',
  },
  outfitColorsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  outfitColorDot: {
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 999,
    borderWidth: 1,
    height: 14,
    width: 14,
  },
});
