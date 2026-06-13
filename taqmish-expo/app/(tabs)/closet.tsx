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

  const items = useMemo(
    () =>
      userItems.map(toLegacyClosetItem).map((item) => {
        if (!item.id) return item;
        const override = itemOverrides[item.id];
        return override ? { ...item, ...override } : item;
      }),
    [itemOverrides, userItems]
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
      <View style={styles.viewTabsWrap}>
        <Pressable
          onPress={() => setViewMode('items')}
          style={[styles.viewTab, viewMode === 'items' ? styles.viewTabSelected : null]}>
          <Text style={[styles.viewTabText, viewMode === 'items' ? styles.viewTabTextSelected : null]}>
            Closet Items
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode('outfits')}
          style={[styles.viewTab, viewMode === 'outfits' ? styles.viewTabSelected : null]}>
          <Text style={[styles.viewTabText, viewMode === 'outfits' ? styles.viewTabTextSelected : null]}>
            Saved Outfits
          </Text>
        </Pressable>
      </View>

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

          <View style={styles.sectionsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>
                {selectedSection ? selectedSection.name : 'All sections'}
              </Text>
              <View style={styles.sectionHeaderActions}>
                {selectedSection ? (
                  <Pressable onPress={openEditSectionDialog} style={styles.editSectionButton}>
                    <Text style={styles.addSectionButtonText}>Edit</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={openSectionDialog} style={styles.addSectionButton}>
                  <Text style={styles.addSectionButtonText}>+ Add</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.filtersRow}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <Pressable
                onPress={() => {
                  if (isMovingItem) {
                    void moveItemToSection(null);
                    return;
                  }
                  setActiveSectionId(ALL_SECTIONS_ID);
                }}
                style={[
                  styles.filterChip,
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
                      if (isMovingItem) {
                        void moveItemToSection(section);
                        return;
                      }
                      setActiveSectionId(section.id);
                    }}
                    style={[
                      styles.subSectionChip,
                      selected ? styles.filterChipSelected : null,
                      isMovingItem ? styles.dropTargetChip : null,
                    ]}>
                    <Ionicons
                      color={selected ? LuxuryTheme.accentSoft : LuxuryTheme.textMuted}
                      name={(section.iconKey as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                      size={13}
                      style={styles.sectionChipIcon}
                    />
                    <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>
                      {section.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {visibleChildSections.length ? (
              <ScrollView
                contentContainerStyle={styles.filtersRow}
                horizontal
                showsHorizontalScrollIndicator={false}>
                {visibleChildSections.map((section) => {
                  const selected = activeSectionId === section.id;
                  return (
                    <Pressable
                      key={section.id}
                      onPress={() => {
                        if (isMovingItem) {
                          void moveItemToSection(section);
                          return;
                        }
                        setActiveSectionId(section.id);
                      }}
                      style={[
                        styles.subSectionChip,
                        selected ? styles.filterChipSelected : null,
                        isMovingItem ? styles.dropTargetChip : null,
                      ]}>
                      <Ionicons
                        color={selected ? LuxuryTheme.accentSoft : LuxuryTheme.textMuted}
                        name={(section.iconKey as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                        size={13}
                        style={styles.sectionChipIcon}
                      />
                      <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>
                        {section.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          {isMovingItem ? (
            <View style={styles.moveBanner}>
              <Text style={styles.moveBannerText}>
                Move `{movingItem?.subParts || 'item'}` or tap `All` to remove its section.
              </Text>
              <Pressable onPress={() => { setIsMovingItem(false); setMovingItem(null); }}>
                <Text style={styles.moveBannerAction}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}

      {viewMode === 'outfits' && savedOutfits.length ? (
        <>
          <View style={styles.savedOutfitsHeader}>
            <Text style={styles.sectionHeaderTitle}>Saved outfits from Home</Text>
            <Text style={styles.filterHeaderMeta}>{filteredSavedOutfits.length} saved</Text>
          </View>
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
          <ScrollView
            contentContainerStyle={styles.savedOutfitsList}
            showsVerticalScrollIndicator={false}>
            {filteredSavedOutfits.map((outfit, index) => (
              <Pressable
                key={outfit.id ?? `saved-outfit-${index}`}
                onPress={() => setSelectedOutfitDetail(outfit)}
                style={styles.savedOutfitCardWide}>
                <View style={styles.savedOutfitGalleryWide}>
                  {getOutfitItems(outfit).slice(0, 6).map(({ item, label }) =>
                    resolveImageUri(item?.filePath) ? (
                      <Image
                        key={`${outfit.id}-${label}`}
                        source={{ uri: resolveImageUri(item?.filePath)! }}
                        style={styles.savedOutfitGalleryWideImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View key={`${outfit.id}-${label}`} style={styles.savedOutfitGalleryWideFallback}>
                        <Text style={styles.savedOutfitGalleryFallbackText}>{label}</Text>
                      </View>
                    )
                  )}
                </View>
                <Text style={styles.savedOutfitTitle}>
                  {(outfit.top?.subParts ?? 'Top') + ' + ' + (outfit.down?.subParts ?? 'Bottom')}
                </Text>
                <View style={styles.savedOutfitMetaRow}>
                  <View style={styles.savedOutfitSourceBadge}>
                    <Text style={styles.savedOutfitSourceBadgeText}>
                      {getOutfitSourceFilter(outfit)}
                    </Text>
                  </View>
                </View>
                <View style={styles.savedOutfitColorsRow}>
                  {getOutfitColors(outfit).length ? (
                    getOutfitColors(outfit).map((color, colorIndex) => (
                      <View
                        key={`${outfit.id ?? 'outfit'}-${color}-${colorIndex}`}
                        style={[styles.savedOutfitColorSwatch, { backgroundColor: color }]}
                      />
                    ))
                  ) : (
                    <Text style={styles.itemMeta}>Saved from Home</Text>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {isLoading || isLoadingOutfits ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading closet data...</Text>
        </View>
      ) : viewMode === 'items' && filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No closet items saved yet.</Text>
        </View>
      ) : viewMode === 'outfits' && savedOutfits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No saved outfits yet.</Text>
        </View>
      ) : viewMode === 'outfits' && filteredSavedOutfits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No saved outfits match this source.</Text>
        </View>
      ) : viewMode === 'items' ? (
        <View style={styles.closetLayout}>
          {closetShelfGroups.map((group) => (
            <View key={group.id} style={styles.closetShelfCard}>
              <View style={styles.closetShelfHeader}>
                <View style={styles.closetShelfTitleWrap}>
                  <View style={styles.closetShelfIconWrap}>
                    <Ionicons
                      color={LuxuryTheme.accent}
                      name={(group.iconKey as keyof typeof Ionicons.glyphMap) || 'shirt-outline'}
                      size={18}
                    />
                  </View>
                  <Text style={styles.closetShelfTitle}>{group.label}</Text>
                </View>
                <View style={styles.closetShelfCountBadge}>
                  <Text style={styles.closetShelfCountText}>{group.itemCount}</Text>
                </View>
              </View>

              <View style={styles.closetRail} />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.closetRailItems}>
                {group.items.map((item, index) => (
                  <Pressable
                    key={item.id ?? `${group.id}-${item.subParts}-${index}`}
                    onLongPress={() => startMoveItem(item)}
                    onPress={() => setSelectedItemDetail(item)}
                    style={styles.itemCard}>
                    <View style={styles.itemImageWrap}>
                      {resolveImageUri(item.filePath) ? (
                        <Image
                          source={{ uri: resolveImageUri(item.filePath)! }}
                          style={styles.itemImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.itemFallback}>
                          <Ionicons name="shirt-outline" size={36} color={LuxuryTheme.border} />
                        </View>
                      )}
                      <View style={styles.hangerHook} />
                    </View>
                    <View style={styles.itemCardInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title || item.subParts || 'Item'}</Text>
                      <Text style={styles.itemMeta} numberOfLines={1}>{item.subParts || item.bodyPart || ''}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      ) : null}

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
  addSectionButton: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addSectionButtonText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  closetLayout: {
    gap: 14,
  },
  closetRail: {
    backgroundColor: LuxuryTheme.border,
    borderRadius: 999,
    height: 6,
    marginLeft: 8,
    marginRight: 8,
    marginTop: 8,
  },
  closetRailItems: {
    paddingBottom: 4,
    paddingTop: 12,
  },
  closetShelfCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 28,
    borderWidth: 1,
    padding: 14,
  },
  closetShelfCountBadge: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chipActive,
    borderRadius: 999,
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  closetShelfCountText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  closetShelfHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closetShelfIconWrap: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  closetShelfTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  closetShelfTitleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginRight: 12,
  },
  dropTargetChip: {
    borderColor: LuxuryTheme.accent,
    borderStyle: 'dashed',
  },
  editSectionButton: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
  },
  emptyText: {
    color: LuxuryTheme.textStrong,
    fontSize: 15,
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
    paddingVertical: 8,
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
  filterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterHeaderMeta: {
    color: LuxuryTheme.textStrong,
    fontSize: 12,
    fontWeight: '600',
  },
  filterHeaderTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 22,
    fontWeight: '800',
  },
  filtersRow: {
    paddingRight: 12,
  },
  hangerHook: {
    alignSelf: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 999,
    height: 5,
    left: '50%',
    marginLeft: -22,
    position: 'absolute',
    top: 8,
    width: 44,
    zIndex: 2,
  },
  itemCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    width: 148,
  },
  itemCardInfo: {
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  itemFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.cardAlt,
    flex: 1,
    justifyContent: 'center',
  },
  itemImage: {
    flex: 1,
  },
  itemImageWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    height: 190,
    width: '100%',
  },
  itemMeta: {
    color: LuxuryTheme.textStrong,
    fontSize: 11,
    marginTop: 2,
  },
  itemTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  moveBanner: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.accent,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moveBannerAction: {
    color: LuxuryTheme.accent,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 12,
  },
  moveBannerText: {
    color: LuxuryTheme.textStrong,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  savedOutfitCardWide: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    padding: 12,
  },
  savedOutfitColorSwatch: {
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 18,
    marginRight: 6,
    marginTop: 2,
    width: 18,
  },
  savedOutfitColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    minHeight: 18,
  },
  savedOutfitGalleryFallbackText: {
    color: LuxuryTheme.textStrong,
    fontSize: 10,
    fontWeight: '700',
  },
  savedOutfitGalleryWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  savedOutfitGalleryWideFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 14,
    height: 74,
    justifyContent: 'center',
    width: '31.8%',
  },
  savedOutfitGalleryWideImage: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 14,
    height: 74,
    width: '31.8%',
  },
  savedOutfitMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  savedOutfitSourceBadge: {
    backgroundColor: LuxuryTheme.chipActive,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedOutfitSourceBadgeText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  savedOutfitTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
    fontWeight: '700',
  },
  savedOutfitsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  savedOutfitsList: {
    paddingBottom: 6,
    paddingTop: 10,
  },
  sectionsCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
  },
  sectionChipIcon: {
    marginRight: 6,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionHeaderTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  subSectionChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewTab: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  viewTabSelected: {
    backgroundColor: LuxuryTheme.chipActive,
    borderColor: LuxuryTheme.accent,
  },
  viewTabText: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    fontWeight: '800',
  },
  viewTabTextSelected: {
    color: LuxuryTheme.chipActiveText,
  },
  viewTabsWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6,
  },
});
