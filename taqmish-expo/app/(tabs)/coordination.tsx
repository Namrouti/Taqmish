import { useEffect, useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app-shell';
import { LuxuryTheme } from '@/constants/theme';
import { type CalendarItem, useCalendarItems } from '@/hooks/use-calendar-items';
import { type OutfitRecord, useOutfits } from '@/hooks/use-outfits';
import type { ClosetItem } from '@/hooks/use-closet-items';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_BUCKETS = ['Morning', 'Evening', 'Night'] as const;
const SOURCE_FILTERS = ['Mixed', 'My Closet', 'Store'] as const;
type CoordinationSourceFilter = (typeof SOURCE_FILTERS)[number];

function parseCalendarDate(item: CalendarItem) {
  const dateString = item.date ?? '';
  const [day, month, year] = dateString.split('-').map(Number);
  if (day && month && year) {
    return new Date(year, month - 1, day);
  }

  const fallbackYear = Number(item.year ?? 0);
  const fallbackMonth = Number(item.month ?? 0);
  const fallbackDay = Number(item.day ?? 0);
  if (fallbackYear && fallbackMonth && fallbackDay) {
    return new Date(fallbackYear, fallbackMonth - 1, fallbackDay);
  }

  return new Date();
}

function formatDayKey(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    year: 'numeric',
  });
}

function buildCalendarDays(monthDate: Date) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const nextDate = new Date(gridStart);
    nextDate.setDate(gridStart.getDate() + index);
    return nextDate;
  });
}

function resolveImageUri(path?: string | null) {
  if (!path) {
    return undefined;
  }

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://') || path.startsWith('content://')) {
    return encodeURI(path);
  }

  if (path.startsWith('/')) {
    return `file://${encodeURI(path)}`;
  }

  if (/^[A-Za-z]:\\/.test(path)) {
    return `file:///${encodeURI(path.replace(/\\/g, '/'))}`;
  }

  return encodeURI(path.replace(/\\/g, '/'));
}

function groupItemsByDay(items: CalendarItem[]) {
  return items.reduce<Record<string, CalendarItem[]>>((accumulator, item) => {
    const key = item.date ?? formatDayKey(parseCalendarDate(item));
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(item);
    return accumulator;
  }, {});
}

function sortItemsByTime(items: CalendarItem[]) {
  const order = new Map<string, number>([
    ['Morning', 0],
    ['Evening', 1],
    ['Night', 2],
  ]);

  return [...items].sort((left, right) => {
    const leftOrder = order.get(left.time ?? '') ?? 99;
    const rightOrder = order.get(right.time ?? '') ?? 99;
    return leftOrder - rightOrder;
  });
}

function getOutfitSourceKind(outfit?: OutfitRecord) {
  if (!outfit) {
    return 'My Closet' as CoordinationSourceFilter;
  }

  const sources = [
    outfit.top?.source,
    outfit.down?.source,
    outfit.shoes?.source,
    outfit.accessories?.source,
    outfit.bag?.source,
    outfit.hat?.source,
    outfit.watch?.source,
  ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

  const hasStore = sources.includes('store');
  const hasCloset = sources.some((source) => source !== 'store');

  if (hasStore && hasCloset) {
    return 'Mixed' as CoordinationSourceFilter;
  }
  if (hasStore) {
    return 'Store' as CoordinationSourceFilter;
  }
  return 'My Closet' as CoordinationSourceFilter;
}

function OutfitPreviewCard({
  item,
  outfit,
  resolveOutfitUri,
  onPress,
}: {
  item: CalendarItem;
  outfit?: OutfitRecord;
  onPress?: () => void;
  resolveOutfitUri: (path?: string | null) => string | undefined;
}) {
  const images = [outfit?.top?.filePath, outfit?.down?.filePath, outfit?.shoes?.filePath, outfit?.accessories?.filePath]
    .map(resolveOutfitUri)
    .filter((uri): uri is string => Boolean(uri))
    .slice(0, 4);

  return (
    <Pressable onPress={onPress} style={styles.outfitCard}>
      <View style={styles.outfitCardHeader}>
        <Text style={styles.outfitTitle}>{item.title || 'Taqmish Outfit'}</Text>
        <Text
          style={[
            styles.timeBadge,
            item.time === 'Morning'
              ? styles.timeMorning
              : item.time === 'Evening'
                ? styles.timeEvening
                : styles.timeNight,
          ]}>
          {item.time || 'Any time'}
        </Text>
      </View>

      {images.length ? (
        <View style={styles.outfitImagesRow}>
          {images.map((uri, index) => (
            <Image key={`${uri}-${index}`} source={{ uri }} style={styles.outfitImage} contentFit="cover" />
          ))}
        </View>
      ) : (
        <View style={styles.outfitFallback}>
          <Text style={styles.outfitFallbackText}>Outfit preview unavailable</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function CoordinationScreen() {
  const { authUser, isLoading: isAuthLoading } = useAuth();
  const { isLoading, items } = useCalendarItems(authUser?.uid);
  const { items: outfits } = useOutfits(authUser?.uid);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(() => formatDayKey(new Date()));
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<CoordinationSourceFilter>('Mixed');
  const [dialogDateKey, setDialogDateKey] = useState<string | null>(null);
  const [selectedOutfitDetail, setSelectedOutfitDetail] = useState<{ item: CalendarItem; outfit?: OutfitRecord } | null>(null);
  const [resolvedImageMap, setResolvedImageMap] = useState<Record<string, string>>({});

  const monthDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const outfitById = useMemo(
    () =>
      outfits.reduce<Record<string, OutfitRecord>>((accumulator, outfit) => {
        if (outfit.id) {
          accumulator[outfit.id] = outfit;
        }
        return accumulator;
      }, {}),
    [outfits]
  );
  const filteredCalendarItems = useMemo(
    () =>
      items.filter((item) => {
        const outfit = item.outfitID ? outfitById[item.outfitID] : undefined;
        const sourceKind = getOutfitSourceKind(outfit);
        return sourceKind === selectedSourceFilter;
      }),
    [items, outfitById, selectedSourceFilter]
  );
  const filteredItemsByDay = useMemo(() => groupItemsByDay(filteredCalendarItems), [filteredCalendarItems]);
  const selectedDayItems = sortItemsByTime(filteredItemsByDay[selectedDayKey] ?? []);
  const dialogItems = dialogDateKey ? sortItemsByTime(filteredItemsByDay[dialogDateKey] ?? []) : [];
  const resolveOutfitUri = (path?: string | null) => {
    if (!path) {
      return undefined;
    }

    return resolvedImageMap[path] ?? resolveImageUri(path);
  };

  useEffect(() => {
    const unresolvedPaths = Array.from(
      new Set(
        outfits
          .flatMap((outfit) => [outfit.top?.filePath, outfit.down?.filePath, outfit.shoes?.filePath, outfit.accessories?.filePath])
          .filter(
            (path): path is string =>
              typeof path === 'string' &&
              path.length > 0 &&
              !resolvedImageMap[path] &&
              !path.startsWith('http://') &&
              !path.startsWith('https://') &&
              !path.startsWith('file://') &&
              !path.startsWith('content://') &&
              (path.startsWith('gs://') || path.startsWith('SiteClosets/') || path.includes('.appspot.com/'))
          )
      )
    );

    if (!unresolvedPaths.length) {
      return;
    }

    let isCancelled = false;

    void Promise.all(
      unresolvedPaths.map(async (path) => {
        try {
          const url = await getDownloadURL(storageRef(storage, path));
          return [path, url] as const;
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (isCancelled) {
        return;
      }

      const nextEntries = entries.filter((entry): entry is readonly [string, string] => entry !== null);
      if (!nextEntries.length) {
        return;
      }

      setResolvedImageMap((current) => {
        const merged = { ...current };
        for (const [path, url] of nextEntries) {
          merged[path] = url;
        }
        return merged;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [outfits, resolvedImageMap]);

  const sections = TIME_BUCKETS.map((bucket) => ({
    items: selectedDayItems.filter((item) => item.time === bucket),
    title: bucket,
  }));

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

  return (
    <AppShell title="Outfit Calendar">
      <View style={styles.calendarCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sourceFiltersRow}>
          {SOURCE_FILTERS.map((filter) => {
            const selected = selectedSourceFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedSourceFilter(filter)}
                style={[styles.sourceFilterChip, selected ? styles.sourceFilterChipSelected : null]}>
                <Text style={[styles.sourceFilterChipText, selected ? styles.sourceFilterChipTextSelected : null]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.calendarHeader}>
          <Pressable
            onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
            style={styles.monthArrow}>
            <Ionicons color={LuxuryTheme.accent} name="chevron-back" size={18} />
          </Pressable>
          <Text style={styles.monthTitle}>{formatMonthLabel(visibleMonth)}</Text>
          <Pressable
            onPress={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
            style={styles.monthArrow}>
            <Ionicons color={LuxuryTheme.accent} name="chevron-forward" size={18} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {DAY_LABELS.map((label) => (
            <Text key={label} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {monthDays.map((date) => {
            const dayKey = formatDayKey(date);
            const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
            const isSelected = dayKey === selectedDayKey;
            const dayCount = filteredItemsByDay[dayKey]?.length ?? 0;

            return (
              <Pressable
                key={dayKey}
                delayLongPress={250}
                onLongPress={() => setDialogDateKey(dayKey)}
                onPress={() => setSelectedDayKey(dayKey)}
                style={[
                  styles.dayCell,
                  isSelected ? styles.dayCellSelected : null,
                  !isCurrentMonth ? styles.dayCellMuted : null,
                ]}>
                <Text style={[styles.dayNumber, isSelected ? styles.dayNumberSelected : null]}>{date.getDate()}</Text>
                {dayCount ? (
                  <View style={[styles.dayCountBadge, isSelected ? styles.dayCountBadgeSelected : null]}>
                    <Text style={[styles.dayCountText, isSelected ? styles.dayCountTextSelected : null]}>{dayCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.selectedHeader}>
        <Text style={styles.selectedTitle}>Selected Day</Text>
        <Text style={styles.selectedDate}>
          {selectedDayKey} • {selectedSourceFilter}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading calendar items...</Text>
        </View>
      ) : selectedDayItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No outfits saved for this day yet.</Text>
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionRow}>
                {section.items.map((item, index) => (
                  <View key={item.itemID ?? `${section.title}-${index}`} style={styles.sectionItemWrap}>
                    <OutfitPreviewCard
                      item={item}
                      outfit={item.outfitID ? outfitById[item.outfitID] : undefined}
                      onPress={() => setSelectedOutfitDetail({ item, outfit: item.outfitID ? outfitById[item.outfitID] : undefined })}
                      resolveOutfitUri={resolveOutfitUri}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.sectionEmpty}>No saved outfits for {section.title.toLowerCase()}.</Text>
            )}
          </View>
        ))
      )}

      <Modal
        animationType="fade"
        transparent
        visible={dialogDateKey !== null}
        onRequestClose={() => setDialogDateKey(null)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setDialogDateKey(null)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>{dialogDateKey || 'Selected day'}</Text>
            <Text style={styles.dialogSubtitle}>All outfits saved for this date.</Text>

            {dialogItems.length ? (
              <ScrollView style={styles.dialogScroll} contentContainerStyle={styles.dialogScrollContent}>
                {dialogItems.map((item, index) => (
                  <View key={item.itemID ?? `${dialogDateKey}-${index}`} style={styles.dialogItemWrap}>
                    <OutfitPreviewCard
                      item={item}
                      outfit={item.outfitID ? outfitById[item.outfitID] : undefined}
                      onPress={() => setSelectedOutfitDetail({ item, outfit: item.outfitID ? outfitById[item.outfitID] : undefined })}
                      resolveOutfitUri={resolveOutfitUri}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No outfits saved for this date.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={selectedOutfitDetail !== null}
        onRequestClose={() => setSelectedOutfitDetail(null)}>
        <SafeAreaView style={styles.detailScreen} edges={['top']}>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => setSelectedOutfitDetail(null)} style={styles.detailBackButton}>
              <Text style={styles.detailBackText}>Back</Text>
            </Pressable>
            <Text style={styles.detailTitle}>Outfit Details</Text>
          </View>

          {selectedOutfitDetail ? (
            <ScrollView contentContainerStyle={styles.detailList}>
              <View style={styles.detailCard}>
                <Text style={styles.detailName}>{selectedOutfitDetail.item.title || 'Taqmish Outfit'}</Text>
                <Text style={styles.detailMeta}>Date: {selectedOutfitDetail.item.date || selectedDayKey}</Text>
                <Text style={styles.detailMeta}>Time: {selectedOutfitDetail.item.time || 'Any time'}</Text>
              </View>

              {([
                { item: selectedOutfitDetail.outfit?.top, label: 'Top' },
                { item: selectedOutfitDetail.outfit?.down, label: 'Bottom' },
                { item: selectedOutfitDetail.outfit?.shoes, label: 'Shoes' },
                { item: selectedOutfitDetail.outfit?.accessories, label: 'Accessories' },
                { item: selectedOutfitDetail.outfit?.bag, label: 'Bag' },
                { item: selectedOutfitDetail.outfit?.watch, label: 'Watch' },
                { item: selectedOutfitDetail.outfit?.hat, label: 'Hat' },
              ] as { item?: ClosetItem | null; label: string }[]).map(({ item, label }) =>
                item ? (
                  <View key={label} style={styles.detailCard}>
                    {resolveOutfitUri(item.filePath) ? (
                      <Image source={{ uri: resolveOutfitUri(item.filePath)! }} style={styles.detailImage} contentFit="cover" />
                    ) : null}
                    <Text style={styles.detailName}>{label}</Text>
                    <Text style={styles.detailMeta}>{item.subParts || item.bodyPart || 'Saved item'}</Text>
                  </View>
                ) : null
              )}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
  },
  sourceFilterChip: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sourceFilterChipSelected: {
    backgroundColor: LuxuryTheme.chipActive,
    borderColor: LuxuryTheme.accent,
  },
  sourceFilterChipText: {
    color: LuxuryTheme.textStrong,
    fontSize: 12,
    fontWeight: '800',
  },
  sourceFilterChipTextSelected: {
    color: LuxuryTheme.chipActiveText,
  },
  sourceFiltersRow: {
    paddingBottom: 12,
    paddingRight: 8,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.cardAlt,
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    marginBottom: 8,
    width: '13.4%',
  },
  dayCellMuted: {
    opacity: 0.45,
  },
  dayCellSelected: {
    backgroundColor: LuxuryTheme.chipActive,
  },
  dayCountBadge: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.border,
    borderRadius: 999,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
  dayCountBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dayCountText: {
    color: LuxuryTheme.chipActiveText,
    fontSize: 10,
    fontWeight: '800',
  },
  dayCountTextSelected: {
    color: LuxuryTheme.textStrong,
  },
  dayNumber: {
    color: LuxuryTheme.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: LuxuryTheme.chipActiveText,
  },
  detailBackButton: {
    backgroundColor: LuxuryTheme.chip,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailBackText: {
    color: LuxuryTheme.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  detailCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailImage: {
    borderRadius: 16,
    height: 220,
    width: '100%',
  },
  detailList: {
    gap: 12,
    paddingBottom: 24,
  },
  detailMeta: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    marginTop: 6,
  },
  detailName: {
    color: LuxuryTheme.textStrong,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  detailScreen: {
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  detailTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 20,
    fontWeight: '800',
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dialogBackdrop: {
    flex: 1,
  },
  dialogCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 26,
    borderWidth: 1,
    marginHorizontal: 18,
    maxHeight: '72%',
    padding: 18,
  },
  dialogItemWrap: {
    marginBottom: 12,
  },
  dialogOverlay: {
    backgroundColor: LuxuryTheme.overlay,
    flex: 1,
    justifyContent: 'center',
  },
  dialogScroll: {
    marginTop: 14,
  },
  dialogScrollContent: {
    paddingBottom: 4,
  },
  dialogSubtitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    marginTop: 4,
  },
  dialogTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 22,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
  },
  emptyText: {
    color: LuxuryTheme.textStrong,
    fontSize: 15,
    textAlign: 'center',
  },
  monthArrow: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderRadius: 12,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  monthTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 20,
    fontWeight: '800',
  },
  outfitCard: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    width: 220,
  },
  outfitCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  outfitFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 92,
    justifyContent: 'center',
    marginTop: 10,
  },
  outfitFallbackText: {
    color: LuxuryTheme.textStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  outfitImage: {
    borderRadius: 14,
    height: 92,
    width: 44,
  },
  outfitImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  outfitTitle: {
    color: LuxuryTheme.textStrong,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8,
  },
  sectionCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  sectionEmpty: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    marginTop: 8,
  },
  sectionItemWrap: {
    marginRight: 12,
  },
  sectionRow: {
    paddingTop: 10,
  },
  sectionTitle: {
    color: LuxuryTheme.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  selectedDate: {
    color: LuxuryTheme.textStrong,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  timeBadge: {
    borderRadius: 999,
    color: '#120F0D',
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeEvening: {
    backgroundColor: LuxuryTheme.accent,
  },
  timeMorning: {
    backgroundColor: '#8E7A58',
  },
  timeNight: {
    backgroundColor: LuxuryTheme.chipActive,
  },
  weekLabel: {
    color: LuxuryTheme.textStrong,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: '13.4%',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
});
