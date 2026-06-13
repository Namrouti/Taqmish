import { useCallback, useEffect, useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { push, ref, set } from 'firebase/database';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LuxuryTheme } from '@/constants/theme';
import { database, storage } from '@/lib/firebase';
import { useAuth } from '@/providers/auth-provider';
import { type WardrobeItem, useWardrobeItems } from '@/hooks/use-wardrobe-items';
import { OutfitCanvas } from '@/components/home/outfit-canvas';
import { ItemGallery } from '@/components/home/item-gallery';
import { OutfitSuggestions } from '@/components/home/outfit-suggestions';
import type {
  AgeFilter,
  CalendarTimeSlot,
  CanvasBounds,
  DisplayHomeItem,
  GenderMode,
  HomeItem,
  OutfitSlot,
  SeasonFilter,
  SelectedOutfit,
  SizeFilter,
  SourceFilter,
  StyleFilter,
  SuggestedOutfit,
} from '@/types/home';

const CALENDAR_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CALENDAR_TIME_OPTIONS: CalendarTimeSlot[] = ['Morning', 'Evening', 'Night'];
const DEFAULT_STYLE_TAGS = ['casual', 'formal', 'sport', 'evening', 'classic', 'streetwear', 'modest', 'business'];
const DEFAULT_SEASON_TAGS = ['spring', 'summer', 'autumn', 'winter'];
const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const DEFAULT_AGE_OPTIONS = ['kids', 'teen', 'adult'];

const categoryOptions: ('All' | OutfitSlot)[] = [
  'All',
  'Tops',
  'Bottoms',
  'Shoes',
  'Accessories',
  'Bags',
  'Watch',
  'Hat',
];

const initialSelectedOutfit: SelectedOutfit = {
  Accessories: null,
  Bags: null,
  Bottoms: null,
  Hat: null,
  Shoes: null,
  Tops: null,
  Watch: null,
};


function normalizeHex(color: string) {
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return color;
}

function isHexColor(color?: string) {
  return Boolean(color && color.startsWith('#') && (color.length === 7 || color.length === 4));
}

function uniqueHexPalette(items: { colors?: string[] }[]) {
  return Array.from(
    new Set(
      items
        .flatMap((item) => item.colors ?? [])
        .filter((color): color is string => isHexColor(color))
        .map((color) => normalizeHex(color).toUpperCase())
    )
  ).slice(0, 30);
}

function hexToRgb(color: string) {
  const parsed = Number.parseInt(normalizeHex(color).slice(1), 16);
  return {
    b: parsed & 255,
    g: (parsed >> 8) & 255,
    r: (parsed >> 16) & 255,
  };
}

function colorDistance(color1: string, color2: string) {
  const left = hexToRgb(color1);
  const right = hexToRgb(color2);
  return Math.sqrt(
    (left.r - right.r) * (left.r - right.r) +
      (left.g - right.g) * (left.g - right.g) +
      (left.b - right.b) * (left.b - right.b)
  );
}

function isInColorRange(color1: string, color2: string, range: number) {
  return colorDistance(color1, color2) <= range;
}

function isWithinComplementaryRange(color1: string, color2: string, range: number) {
  const rgb = hexToRgb(color2);
  const complementary = `#${(255 - rgb.r).toString(16).padStart(2, '0')}${(255 - rgb.g)
    .toString(16)
    .padStart(2, '0')}${(255 - rgb.b).toString(16).padStart(2, '0')}`;
  return colorDistance(color1, complementary) <= range;
}

function getSlotForItem(item: HomeItem): OutfitSlot {
  const bodyPart = (item.bodyPart ?? '').toLowerCase();
  const subParts = (item.subParts ?? '').toLowerCase();
  const type = (item.type ?? '').toLowerCase();
  const category = (item.category ?? '').toLowerCase();

  if (bodyPart.includes('علوي') || type.includes('top') || category.includes('top')) {
    return 'Tops';
  }
  if (bodyPart.includes('سفلي') || type.includes('bottom') || type.includes('pants')) {
    return 'Bottoms';
  }
  if (subParts.includes('حذاء') || type.includes('shoe')) {
    return 'Shoes';
  }
  if (subParts.includes('ساع') || type.includes('watch')) {
    return 'Watch';
  }
  if (subParts.includes('شن') || type.includes('bag')) {
    return 'Bags';
  }
  if (subParts.includes('قب') || type.includes('hat') || type.includes('cap')) {
    return 'Hat';
  }
  if (bodyPart.includes('اكسسو') || type.includes('accessor')) {
    return 'Accessories';
  }
  return 'Tops';
}

function mapClosetItem(item: WardrobeItem): HomeItem {
  return {
    ...item,
    category: item.mainClass ?? '',
    titel: item.subParts || item.bodyPart || 'Closet Item',
    type: item.subParts || item.bodyPart || '',
  };
}

function getItemImageSource(item?: HomeItem | null) {
  const primaryPath = item?.filePath?.trim();
  if (primaryPath) {
    return primaryPath;
  }

  return item?.images?.find((entry) => typeof entry === 'string' && entry.trim().length > 0)?.trim();
}

function resolveImageUri(item?: HomeItem | null) {
  const uri = getItemImageSource(item);
  if (!uri) {
    return undefined;
  }

  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://')) {
    return encodeURI(uri);
  }

  if (uri.startsWith('/')) {
    return `file://${encodeURI(uri)}`;
  }

  if (/^[A-Za-z]:\\/.test(uri)) {
    return `file:///${encodeURI(uri.replace(/\\/g, '/'))}`;
  }

  return encodeURI(uri.replace(/\\/g, '/'));
}

function getBodyPartForSlot(slot: OutfitSlot) {
  switch (slot) {
    case 'Tops':
      return 'الجزء العلوي';
    case 'Bottoms':
      return 'الجزء السفلي';
    case 'Shoes':
      return 'أحذية';
    default:
      return 'اكسسوارات';
  }
}

function itemToSiteClosets(item: HomeItem, bodyPart: string) {
  return {
    age: item.age ?? '',
    bag: null,
    bodyPart,
    bodyPartKey: item.bodyPartKey ?? '',
    closetSectionId: item.closetSectionId ?? '',
    closetSectionName: item.closetSectionName ?? '',
    closetSectionPath: item.closetSectionPath ?? '',
    colors: item.colors ?? [],
    filePath: item.filePath ?? '',
    genderKey: item.genderKey ?? '',
    id: item.id ?? '',
    mainClass: item.mainClass ?? item.category ?? '',
    ownerId: item.ownerId ?? '',
    seasonTags: item.seasonTags ?? [],
    sex: item.sex ?? '',
    size: item.size ?? '',
    source: item.source,
    styleTags: item.styleTags ?? [],
    subParts: item.subParts ?? item.type ?? '',
    subType: item.subType ?? item.subParts ?? item.type ?? '',
    title: item.title ?? item.titel ?? item.subParts ?? '',
  };
}

function getAnchorItem(selectedOutfit: SelectedOutfit) {
  return (
    selectedOutfit.Tops ??
    selectedOutfit.Bottoms ??
    selectedOutfit.Shoes ??
    selectedOutfit.Accessories ??
    selectedOutfit.Bags ??
    selectedOutfit.Hat ??
    selectedOutfit.Watch ??
    null
  );
}

function normalizeGender(input?: string | null): GenderMode | null {
  const value = (input ?? '').trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value.includes('male') || value.includes('men') || value.includes('boy') || value.includes('ذكر')) {
    return 'Male';
  }
  if (
    value.includes('female') ||
    value.includes('women') ||
    value.includes('girl') ||
    value.includes('أنث') ||
    value.includes('انث')
  ) {
    return 'Female';
  }
  return null;
}

function matchesGenderMode(item: HomeItem, mode: GenderMode) {
  if (mode === 'All') {
    return true;
  }

  const itemGender = normalizeGender(item.sex);
  return !itemGender || itemGender === mode;
}

function matchesSourceFilter(item: HomeItem, filter: SourceFilter) {
  if (filter === 'Mixed') {
    return true;
  }

  if (filter === 'My Closet') {
    return item.source === 'user';
  }

  return item.source === 'store' || item.source === 'catalog';
}

function inferSlotFromContext(item: HomeItem, currentCategory: 'All' | OutfitSlot): OutfitSlot {
  const inferred = getSlotForItem(item);
  if (currentCategory !== 'All') {
    const bodyPart = (item.bodyPart ?? '').trim();
    const subParts = (item.subParts ?? '').trim();
    const mainClass = (item.mainClass ?? '').trim();
    if (!bodyPart && !subParts && !mainClass) {
      return currentCategory;
    }
  }

  return inferred;
}

function clampRange(value: number) {
  return Math.max(20, Math.min(255, Math.round(value)));
}

function formatDayKey(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
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

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getSlotLabel(slot: OutfitSlot) {
  switch (slot) {
    case 'Tops':
      return 'Top';
    case 'Bottoms':
      return 'Bottom';
    case 'Shoes':
      return 'Shoes';
    case 'Accessories':
      return 'Accessories';
    case 'Bags':
      return 'Bag';
    case 'Watch':
      return 'Watch';
    case 'Hat':
      return 'Hat';
    default:
      return slot;
  }
}

function getCategoryLabel(category: 'All' | OutfitSlot) {
  switch (category) {
    case 'Tops':
      return 'Top';
    case 'Bottoms':
      return 'Bottom';
    case 'Shoes':
      return 'Shoes';
    case 'Accessories':
      return 'Acc.';
    case 'Bags':
      return 'Bag';
    case 'Watch':
      return 'Watch';
    case 'Hat':
      return 'Hat';
    default:
      return 'All parts';
  }
}


function buildSuggestionId(outfit: SelectedOutfit, index: number) {
  return [
    outfit.Tops?.id ?? 'top',
    outfit.Bottoms?.id ?? 'bottom',
    outfit.Shoes?.id ?? 'shoes',
    outfit.Accessories?.id ?? 'accessories',
    outfit.Bags?.id ?? 'bags',
    index,
  ].join('-');
}

function uniqueHexColors(items: (HomeItem | null | undefined)[]) {
  return Array.from(
    new Set(
      items
        .flatMap((item) => item?.colors ?? [])
        .filter((color): color is string => isHexColor(color))
        .map((color) => color.toUpperCase())
    )
  ).slice(0, 6);
}

function dominantOutfitColors(items: (HomeItem | null | undefined)[]) {
  return Array.from(
    new Set(
      items
        .map((item) => (item?.colors ?? []).find(isHexColor))
        .filter((color): color is string => Boolean(color))
        .map((color) => color.toUpperCase())
    )
  ).slice(0, 6);
}

function ColorRangeSlider({
  value,
  onChange,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);

  const updateFromLocation = useCallback(
    (locationX: number) => {
      if (!trackWidth) {
        return;
      }

      const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
      onChange(clampRange(20 + ratio * (255 - 20)));
    },
    [onChange, trackWidth]
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          updateFromLocation(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateFromLocation(event.nativeEvent.locationX);
        },
      }),
    [updateFromLocation]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const ratio = (value - 20) / (255 - 20);

  return (
    <View style={styles.sliderWrap}>
      <View
        onLayout={handleLayout}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => updateFromLocation(event.nativeEvent.locationX)}
        style={styles.sliderTrack}
        {...responder.panHandlers}>
        <View style={[styles.sliderFill, { width: `${ratio * 100}%` }]} />
        <View style={[styles.sliderThumb, { left: `${ratio * 100}%` }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>20</Text>
        <Text style={styles.sliderLabel}>255</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { authUser, isLoading: isAuthLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { isLoading, items: wardrobeItems } = useWardrobeItems(authUser?.uid);
  const [currentCategory, setCurrentCategory] = useState<'All' | OutfitSlot>('All');
  const [colorRange, setColorRange] = useState(120);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<SourceFilter>('Mixed');
  const [selectedOutfit, setSelectedOutfit] = useState<SelectedOutfit>(initialSelectedOutfit);
  const [genderMode, setGenderMode] = useState<GenderMode>('All');
  const [selectedStyleTag, setSelectedStyleTag] = useState<StyleFilter>('All');
  const [selectedSeasonTag, setSelectedSeasonTag] = useState<SeasonFilter>('All');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<SizeFilter>('All');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<AgeFilter>('All');
  const [selectedSuggestionItemIds, setSelectedSuggestionItemIds] = useState<string[]>([]);
  const [isRangeDialogVisible, setRangeDialogVisible] = useState(false);
  const [isColorDialogVisible, setColorDialogVisible] = useState(false);
  const [isCalendarDialogVisible, setCalendarDialogVisible] = useState(false);
  const [isOutfitDetailVisible, setOutfitDetailVisible] = useState(false);
  const [isSuggestionsVisible, setSuggestionsVisible] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<DisplayHomeItem | null>(null);
  const [suggestedOutfits, setSuggestedOutfits] = useState<SuggestedOutfit[]>([]);
  const [pendingCalendarOutfit, setPendingCalendarOutfit] = useState<SelectedOutfit | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());
  const [selectedCalendarTimes, setSelectedCalendarTimes] = useState<CalendarTimeSlot[]>(['Morning']);
  const [resolvedImageMap, setResolvedImageMap] = useState<Record<string, string>>({});
  const [selectedFilterColor, setSelectedFilterColor] = useState<string | null>(null);
  const [draggedListItem, setDraggedListItem] = useState<DisplayHomeItem | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState({ x: 0, y: 0 });
  const [isOutfitDropActive, setIsOutfitDropActive] = useState(false);
  const [outfitCanvasBounds, setOutfitCanvasBounds] = useState({ height: 0, width: 0, x: 0, y: 0 });

  const items = useMemo(() => wardrobeItems.map(mapClosetItem), [wardrobeItems]);
  const availableStyleTags = useMemo(() => {
    const tags = Array.from(
      new Set(items.flatMap((item) => item.styleTags ?? []).map((tag) => tag.toLowerCase()))
    );
    return Array.from(new Set([...DEFAULT_STYLE_TAGS, ...tags])).sort();
  }, [items]);
  const availableSeasonTags = useMemo(() => {
    const tags = Array.from(
      new Set(items.flatMap((item) => item.seasonTags ?? []).map((tag) => tag.toLowerCase()))
    );
    return Array.from(new Set([...DEFAULT_SEASON_TAGS, ...tags])).sort();
  }, [items]);
  const availableSizeOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        items
          .flatMap((item) => [item.size, ...(item.sizeOptions ?? [])])
          .map((entry) => (entry ?? '').trim())
          .filter(Boolean)
      )
    );
    return Array.from(new Set([...DEFAULT_SIZE_OPTIONS, ...options]));
  }, [items]);
  const availableAgeOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        items
          .map((item) => (item.age ?? '').trim().toLowerCase())
          .filter(Boolean)
      )
    );
    return Array.from(new Set([...DEFAULT_AGE_OPTIONS, ...options]));
  }, [items]);
  const availableFilterColors = useMemo(() => uniqueHexPalette(items), [items]);
  const anchorItem = useMemo(() => getAnchorItem(selectedOutfit), [selectedOutfit]);
  const hasSelectedItem = Boolean(anchorItem);
  const getDisplayUri = useCallback(
    (item?: HomeItem | null) => {
      const rawPath = getItemImageSource(item);
      if (!rawPath) {
        return undefined;
      }

      return resolvedImageMap[rawPath] ?? resolveImageUri(item);
    },
    [resolvedImageMap]
  );

  const displayItems = useMemo<DisplayHomeItem[]>(
    () =>
      items.map((item) => ({
        ...item,
        displayUri: getDisplayUri(item),
        slot: inferSlotFromContext(item, currentCategory),
      })),
    [currentCategory, getDisplayUri, items]
  );

  useEffect(() => {
    const unresolvedPaths = Array.from(
        new Set(
          items
            .map((item) => getItemImageSource(item))
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
  }, [items, resolvedImageMap]);

  const filteredItems = useMemo(() => {
    return displayItems.filter((item) => {
      if (!matchesSourceFilter(item, selectedSourceFilter)) {
        return false;
      }

      const slot = item.slot;
      if (currentCategory !== 'All' && slot !== currentCategory) {
        return false;
      }

      if (!matchesGenderMode(item, genderMode)) {
        return false;
      }

      if (
        selectedStyleTag !== 'All' &&
        !(item.styleTags ?? []).map((tag) => tag.toLowerCase()).includes(selectedStyleTag.toLowerCase())
      ) {
        return false;
      }

      if (
        selectedSeasonTag !== 'All' &&
        !(item.seasonTags ?? []).map((tag) => tag.toLowerCase()).includes(selectedSeasonTag.toLowerCase())
      ) {
        return false;
      }

      if (selectedSizeFilter !== 'All') {
        const itemSizes = [item.size, ...(item.sizeOptions ?? [])]
          .map((entry) => (entry ?? '').trim().toLowerCase())
          .filter(Boolean);
        if (itemSizes.length && !itemSizes.includes(selectedSizeFilter.toLowerCase())) {
          return false;
        }
      }

      if (selectedAgeFilter !== 'All') {
        const itemAge = (item.age ?? '').trim().toLowerCase();
        if (itemAge && itemAge !== selectedAgeFilter.toLowerCase()) {
          return false;
        }
      }

      if (!anchorItem && selectedFilterColor) {
        const candidateColors = (item.colors ?? []).filter(isHexColor);
        if (
          candidateColors.length &&
          !candidateColors.some((candidateColor) => isInColorRange(selectedFilterColor, candidateColor, colorRange))
        ) {
          return false;
        }
      }

      if (!anchorItem || anchorItem.id === item.id) {
        return true;
      }

      const anchorColors = (anchorItem.colors ?? []).filter(isHexColor);
      const candidateColors = (item.colors ?? []).filter(isHexColor);
      if (!anchorColors.length || !candidateColors.length) {
        return true;
      }

      return anchorColors.some((anchorColor) =>
        candidateColors.some(
          (candidateColor) =>
            isWithinComplementaryRange(anchorColor, candidateColor, colorRange) ||
            isInColorRange(anchorColor, candidateColor, colorRange)
        )
      );
    });
  }, [
    anchorItem,
    colorRange,
    currentCategory,
    displayItems,
    genderMode,
    selectedAgeFilter,
    selectedFilterColor,
    selectedSeasonTag,
    selectedSizeFilter,
    selectedSourceFilter,
    selectedStyleTag,
  ]);
  const suggestionSeedItems = useMemo(() => {
    if (!selectedSuggestionItemIds.length) {
      return filteredItems;
    }

    const selectedSet = new Set(selectedSuggestionItemIds);
    return filteredItems.filter((item) => item.id && selectedSet.has(item.id));
  }, [filteredItems, selectedSuggestionItemIds]);
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const selectedCalendarKey = useMemo(() => formatDayKey(selectedCalendarDate), [selectedCalendarDate]);
  const calendarPreviewOutfit = pendingCalendarOutfit ?? selectedOutfit;
  const outfitCombinationColors = useMemo(
    () =>
      dominantOutfitColors([
        selectedOutfit.Tops,
        selectedOutfit.Bottoms,
        selectedOutfit.Shoes,
        selectedOutfit.Accessories,
        selectedOutfit.Bags,
        selectedOutfit.Hat,
        selectedOutfit.Watch,
      ]),
    [selectedOutfit]
  );

  const canSave = Boolean(selectedOutfit.Tops && selectedOutfit.Bottoms);

  const createSwipeDismissResponder = useCallback((onDismiss: () => void) => {
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
  }, []);

  const itemDetailDismissResponder = useMemo(
    () => createSwipeDismissResponder(() => setSelectedItemDetail(null)),
    [createSwipeDismissResponder]
  );
  const outfitDetailDismissResponder = useMemo(
    () => createSwipeDismissResponder(() => setOutfitDetailVisible(false)),
    [createSwipeDismissResponder]
  );

  const assignSelectedItem = (item: DisplayHomeItem) => {
    const slot = item.slot;
    setSelectedOutfit((current) => ({ ...current, [slot]: item }));
  };

  const openItemDetail = (item: DisplayHomeItem) => {
    setSelectedItemDetail(item);
  };

  const openOutfitDetail = () => {
    if (!hasSelectedItem) {
      return;
    }
    setOutfitDetailVisible(true);
  };

  const removeSelectedSlot = (slot: OutfitSlot) => {
    setSelectedOutfit((current) => ({ ...current, [slot]: null }));
  };

  const clearSelectedOutfit = () => {
    setSelectedOutfit(initialSelectedOutfit);
  };

  const toggleSuggestionSeedItem = (item: DisplayHomeItem) => {
    if (!item.id) {
      return;
    }

    setSelectedSuggestionItemIds((current) =>
      current.includes(item.id!) ? current.filter((entry) => entry !== item.id) : [...current, item.id!]
    );
  };

  const clearSuggestionSeedItems = () => {
    setSelectedSuggestionItemIds([]);
  };

  const cycleCategory = () => {
    setCurrentCategory((current) => {
      const currentIndex = categoryOptions.indexOf(current);
      const nextIndex = (currentIndex + 1) % categoryOptions.length;
      return categoryOptions[nextIndex];
    });
  };

  const cycleStyleFilter = () => {
    const styleOptions: StyleFilter[] = ['All', ...availableStyleTags];
    setSelectedStyleTag((current) => {
      const currentIndex = styleOptions.indexOf(current);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % styleOptions.length : 0;
      return styleOptions[nextIndex];
    });
  };

  const cycleSeasonFilter = () => {
    const seasonOptions: SeasonFilter[] = ['All', ...availableSeasonTags];
    setSelectedSeasonTag((current) => {
      const currentIndex = seasonOptions.indexOf(current);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % seasonOptions.length : 0;
      return seasonOptions[nextIndex];
    });
  };

  const cycleSizeFilter = () => {
    const sizeOptions: SizeFilter[] = ['All', ...availableSizeOptions];
    setSelectedSizeFilter((current) => {
      const currentIndex = sizeOptions.indexOf(current);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % sizeOptions.length : 0;
      return sizeOptions[nextIndex];
    });
  };

  const cycleAgeFilter = () => {
    const ageOptions: AgeFilter[] = ['All', ...availableAgeOptions];
    setSelectedAgeFilter((current) => {
      const currentIndex = ageOptions.indexOf(current);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % ageOptions.length : 0;
      return ageOptions[nextIndex];
    });
  };

  const listFiltersHeader = (
    <View style={styles.listHeader}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.underOutfitFiltersRow}>
        <Pressable onPress={cycleStyleFilter} style={styles.iconControl}>
          <Ionicons color={LuxuryTheme.accent} name="sparkles-outline" size={18} />
          <Text style={styles.iconControlValue}>{selectedStyleTag}</Text>
        </Pressable>

        <Pressable onPress={cycleCategory} style={styles.iconControl}>
          <Ionicons color={LuxuryTheme.accent} name="funnel-outline" size={18} />
          <Text style={styles.iconControlValue}>{getCategoryLabel(currentCategory)}</Text>
        </Pressable>

        <Pressable onPress={cycleSeasonFilter} style={styles.iconControl}>
          <Ionicons color={LuxuryTheme.accent} name="partly-sunny-outline" size={18} />
          <Text style={styles.iconControlValue}>{selectedSeasonTag}</Text>
        </Pressable>

        <Pressable onPress={cycleSizeFilter} style={styles.iconControl}>
          <Ionicons color={LuxuryTheme.accent} name="resize-outline" size={18} />
          <Text style={styles.iconControlValue}>{selectedSizeFilter}</Text>
        </Pressable>

        <Pressable onPress={cycleAgeFilter} style={styles.iconControl}>
          <Ionicons color={LuxuryTheme.accent} name="people-outline" size={18} />
          <Text style={styles.iconControlValue}>{selectedAgeFilter}</Text>
        </Pressable>
      </ScrollView>

      {selectedSuggestionItemIds.length ? (
        <View style={styles.pickedRow}>
          <Text style={styles.pickedText}>{selectedSuggestionItemIds.length} picked</Text>
          <Pressable onPress={clearSuggestionSeedItems} style={styles.clearInlineChip}>
            <Ionicons color={LuxuryTheme.accent} name="close-outline" size={14} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const openCalendarForOutfit = (outfit: SelectedOutfit) => {
    if (!authUser?.uid || !(outfit.Tops && outfit.Bottoms)) {
      Alert.alert('Select at least one top and one bottom first.');
      return;
    }

    setPendingCalendarOutfit(outfit);
    setCalendarMonth(new Date(selectedCalendarDate));
    setCalendarDialogVisible(true);
  };

  const cycleGenderMode = () => {
    setGenderMode((current) => {
      if (current === 'All') return 'Male';
      if (current === 'Male') return 'Female';
      return 'All';
    });
  };

  const cycleSourceFilter = () => {
    setSelectedSourceFilter((current) => {
      if (current === 'Mixed') return 'My Closet';
      if (current === 'My Closet') return 'Store';
      return 'Mixed';
    });
  };

  const scorePair = (left?: HomeItem | null, right?: HomeItem | null) => {
    if (!left?.colors?.length || !right?.colors?.length) {
      return 0;
    }

    let score = 0;
    const leftColors = left.colors.filter(isHexColor);
    const rightColors = right.colors.filter(isHexColor);
    for (const leftColor of leftColors) {
      for (const rightColor of rightColors) {
        if (isWithinComplementaryRange(leftColor, rightColor, colorRange)) {
          score += 4;
        }
        if (isInColorRange(leftColor, rightColor, colorRange)) {
          score += 2;
        }
      }
    }
    return score;
  };

  const scoreOutfit = (outfit: SelectedOutfit) => {
    const items = [
      outfit.Tops,
      outfit.Bottoms,
      outfit.Shoes,
      outfit.Accessories,
      outfit.Bags,
      outfit.Hat,
      outfit.Watch,
    ].filter((item): item is HomeItem => Boolean(item));

    let score = 0;
    for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
        score += scorePair(items[leftIndex], items[rightIndex]);
      }
    }

    return score;
  };

  const buildSuggestions = () => {
    const poolItems = suggestionSeedItems.length ? suggestionSeedItems : filteredItems;
    const fallbackItems = filteredItems;

    const uniqueById = (items: DisplayHomeItem[]) => {
      const seen = new Set<string>();
      return items.filter((item, index) => {
        const key = item.id ?? `${item.slot}-${item.filePath ?? index}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    };

    const buildSlotOptions = (slot: OutfitSlot, limit: number, lockedItem?: HomeItem | null) => {
      if (lockedItem) {
        return [lockedItem];
      }

      const preferred = poolItems.filter((item) => item.slot === slot);
      const fallback = fallbackItems.filter((item) => item.slot === slot);
      return uniqueById([...preferred, ...fallback]).slice(0, limit);
    };

    const tops = buildSlotOptions('Tops', 6, selectedOutfit.Tops);
    const bottoms = buildSlotOptions('Bottoms', 6, selectedOutfit.Bottoms);
    const shoesList = buildSlotOptions('Shoes', 4, selectedOutfit.Shoes);
    const accessoriesList = buildSlotOptions('Accessories', 4, selectedOutfit.Accessories);
    const bagsList = buildSlotOptions('Bags', 4, selectedOutfit.Bags);
    const hatsList = buildSlotOptions('Hat', 2, selectedOutfit.Hat);
    const watchesList = buildSlotOptions('Watch', 2, selectedOutfit.Watch);

    const candidates: SuggestedOutfit[] = [];

    if (!tops.length || !bottoms.length) {
      return [];
    }

    for (const top of tops) {
      for (const bottom of bottoms) {
        const shoesOptions = shoesList.length ? shoesList : [null];
        const accessoriesOptions = accessoriesList.length ? accessoriesList : [null];
        const bagsOptions = bagsList.length ? bagsList : [null];
        const hatsOptions = hatsList.length ? hatsList : [null];
        const watchesOptions = watchesList.length ? watchesList : [null];

        for (const shoes of shoesOptions) {
          for (const accessories of accessoriesOptions) {
            for (const bag of bagsOptions) {
              for (const hat of hatsOptions) {
                for (const watch of watchesOptions) {
                  const outfit: SelectedOutfit = {
                    Accessories: accessories,
                    Bags: bag,
                    Bottoms: bottom,
                    Hat: hat,
                    Shoes: shoes,
                    Tops: top,
                    Watch: watch,
                  };
                  const colors = uniqueHexColors([
                    top,
                    bottom,
                    shoes,
                    accessories,
                    bag,
                    hat,
                    watch,
                  ]);
                  candidates.push({
                    colorSummary: colors,
                    id: buildSuggestionId(outfit, candidates.length),
                    label: `${top.subParts || 'Top'} + ${bottom.subParts || 'Bottom'}`,
                    outfit,
                    score: scoreOutfit(outfit),
                  });
                }
              }
            }
          }
        }
      }
    }

    return candidates
      .sort((left, right) => right.score - left.score)
      .filter((candidate, index, array) => array.findIndex((entry) => entry.id === candidate.id) === index);
  };

  const suggestOutfit = () => {
    if (!filteredItems.length && !Object.values(selectedOutfit).some(Boolean)) {
      Alert.alert('No SiteClosets items available for this mode.');
      return;
    }

    const suggestions = buildSuggestions();
    if (!suggestions.length) {
      Alert.alert('No complete suggestions available from the selected items and current filters yet.');
      return;
    }

    setSuggestedOutfits(suggestions);
    setSuggestionsVisible(true);
  };

  const saveOutfitDocument = async (outfitToSave: SelectedOutfit = selectedOutfit) => {
    if (!authUser?.uid) {
      return null;
    }

    const outfitRef = push(ref(database, `OutfitClass/${authUser.uid}`));
    const outfitId = outfitRef.key;

    if (!outfitId) {
      throw new Error('Unable to create outfit id.');
    }

    await set(outfitRef, {
      accessories: outfitToSave.Accessories
        ? itemToSiteClosets(outfitToSave.Accessories, getBodyPartForSlot('Accessories'))
        : null,
      bag: outfitToSave.Bags ? itemToSiteClosets(outfitToSave.Bags, getBodyPartForSlot('Bags')) : null,
      bodyPart: '',
      color: (outfitToSave.Tops?.colors ?? []).join(','),
      down: outfitToSave.Bottoms ? itemToSiteClosets(outfitToSave.Bottoms, getBodyPartForSlot('Bottoms')) : null,
      hat: outfitToSave.Hat ? itemToSiteClosets(outfitToSave.Hat, getBodyPartForSlot('Hat')) : null,
      id: outfitId,
      mainClass: '',
      shoes: outfitToSave.Shoes ? itemToSiteClosets(outfitToSave.Shoes, getBodyPartForSlot('Shoes')) : null,
      subParts: '',
      top: outfitToSave.Tops ? itemToSiteClosets(outfitToSave.Tops, getBodyPartForSlot('Tops')) : null,
      watch: outfitToSave.Watch ? itemToSiteClosets(outfitToSave.Watch, getBodyPartForSlot('Watch')) : null,
    });

    return outfitId;
  };

  const saveOutfitToCloset = async (outfitToSave: SelectedOutfit = selectedOutfit) => {
    if (!(outfitToSave.Tops && outfitToSave.Bottoms)) {
      Alert.alert('Select at least one top and one bottom first.');
      return;
    }

    try {
      await saveOutfitDocument(outfitToSave);
      Alert.alert('Outfit saved to your closet!');
    } catch {
      Alert.alert('Failed to save outfit.');
    }
  };

  const saveOutfitToCalendar = async () => {
    if (!canSave || !authUser?.uid) {
      Alert.alert('Select at least one top and one bottom first.');
      return;
    }

    setPendingCalendarOutfit(null);
    setCalendarMonth(new Date(selectedCalendarDate));
    setCalendarDialogVisible(true);
  };

  const toggleCalendarTime = (time: CalendarTimeSlot) => {
    setSelectedCalendarTimes((current) => {
      if (current.includes(time)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((entry) => entry !== time);
      }

      return [...current, time];
    });
  };

  const confirmSaveOutfitToCalendar = async (outfitToSave: SelectedOutfit = selectedOutfit) => {
    if (!authUser?.uid || !(outfitToSave.Tops && outfitToSave.Bottoms)) {
      Alert.alert('Select at least one top and one bottom first.');
      return;
    }

    if (!selectedCalendarTimes.length) {
      Alert.alert('Select at least one time for this outfit.');
      return;
    }

    try {
      const outfitId = await saveOutfitDocument(outfitToSave);
      if (!outfitId) {
        throw new Error('Missing outfit id');
      }

      const targetDate = new Date(selectedCalendarDate);
      const formattedDate = formatDayKey(targetDate);
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const year = String(targetDate.getFullYear());
      const day = String(targetDate.getDate()).padStart(2, '0');

      await Promise.all(
        selectedCalendarTimes.map(async (time) => {
          const calendarRef = push(ref(database, `CalendarItem/${authUser.uid}`));
          const calendarItemId = calendarRef.key;
          if (!calendarItemId) {
            throw new Error('Missing calendar item id');
          }

          await set(calendarRef, {
            date: formattedDate,
            day,
            itemID: calendarItemId,
            month,
            outfitID: outfitId,
            time,
            title: 'Taqmish Outfit',
            year,
          });
        })
      );

      setPendingCalendarOutfit(null);
      setCalendarDialogVisible(false);
      Alert.alert('Outfit added to calendar!');
    } catch {
      Alert.alert('Failed to add outfit to calendar.');
    }
  };

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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.screenContent, { paddingBottom: Math.max(insets.bottom, 12) + 96 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topControls}>
          <Pressable onPress={cycleSourceFilter} style={styles.iconControl}>
            <Ionicons
              color={LuxuryTheme.accent}
              name={
                selectedSourceFilter === 'My Closet'
                  ? 'shirt-outline'
                  : selectedSourceFilter === 'Store'
                    ? 'storefront-outline'
                    : 'git-merge-outline'
              }
              size={18}
            />
            <Text style={styles.iconControlValue}>{selectedSourceFilter}</Text>
          </Pressable>

          <Pressable onPress={cycleGenderMode} style={styles.iconControl}>
            <Ionicons
              color={LuxuryTheme.accent}
              name={genderMode === 'Male' ? 'male-outline' : genderMode === 'Female' ? 'female-outline' : 'people-outline'}
              size={18}
            />
            <Text style={styles.iconControlValue}>{genderMode}</Text>
          </Pressable>

          <Pressable onPress={() => setRangeDialogVisible(true)} style={styles.iconControl}>
            <Ionicons color={LuxuryTheme.accent} name="color-palette-outline" size={18} />
            <Text style={styles.iconControlValue}>{colorRange}</Text>
          </Pressable>

          <Pressable onPress={() => setColorDialogVisible(true)} style={styles.iconControl}>
            <View
              style={[
                styles.selectedColorDot,
                { backgroundColor: selectedFilterColor ?? '#F4E7DC' },
                !selectedFilterColor ? styles.selectedColorDotEmpty : null,
              ]}
            />
            <Text style={styles.iconControlValue}>{selectedFilterColor ? 'Color' : 'Pick'}</Text>
          </Pressable>
        </View>

        <OutfitCanvas
          canSave={canSave}
          getDisplayUri={getDisplayUri}
          isDropActive={isOutfitDropActive}
          outfit={selectedOutfit}
          onBoundsChange={setOutfitCanvasBounds}
          onClear={clearSelectedOutfit}
          onEmptyPress={() => setColorDialogVisible(true)}
          onOpenDetail={openOutfitDetail}
          onSaveToCalendar={saveOutfitToCalendar}
          onSaveToCloset={() => void saveOutfitToCloset()}
          onSlotRemove={removeSelectedSlot}
          onSuggest={suggestOutfit}
        />

        {listFiltersHeader}

        <ItemGallery
          isLoading={isLoading}
          items={filteredItems}
          outfitCanvasBounds={outfitCanvasBounds}
          selectedSuggestionItemIds={selectedSuggestionItemIds}
          onDropActiveChange={setIsOutfitDropActive}
          onDraggedItemChange={setDraggedListItem}
          onDragPositionChange={setDragPreviewPosition}
          onItemDrop={assignSelectedItem}
          onItemPress={openItemDetail}
          onSeedToggle={toggleSuggestionSeedItem}
        />
      </ScrollView>

      {draggedListItem?.displayUri ? (
        <View
          pointerEvents="none"
          style={[
            styles.dragPreview,
            { left: dragPreviewPosition.x, top: dragPreviewPosition.y },
          ]}>
          <Image source={{ uri: draggedListItem.displayUri }} style={styles.dragPreviewImage} contentFit="cover" />
        </View>
      ) : null}

      <Modal
        animationType="fade"
        transparent
        visible={isRangeDialogVisible}
        onRequestClose={() => setRangeDialogVisible(false)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setRangeDialogVisible(false)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Color Range</Text>
            <Text style={styles.dialogValue}>{colorRange}</Text>
            <ColorRangeSlider value={colorRange} onChange={setColorRange} />
            <View style={styles.dialogRangeActions}>
              <Pressable onPress={() => setColorRange((current) => clampRange(current - 10))} style={styles.dialogStepButton}>
                <Text style={styles.dialogStepButtonText}>-10</Text>
              </Pressable>
              <Pressable onPress={() => setColorRange((current) => clampRange(current + 10))} style={styles.dialogStepButton}>
                <Text style={styles.dialogStepButtonText}>+10</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setRangeDialogVisible(false)} style={styles.dialogButton}>
              <Text style={styles.dialogButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isColorDialogVisible}
        onRequestClose={() => setColorDialogVisible(false)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setColorDialogVisible(false)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Pick A Color</Text>
            <Text style={styles.dialogSubtitle}>
              Show items whose saved colors are within the current color range.
            </Text>
            <View style={styles.dialogPaletteRow}>
              {availableFilterColors.map((color) => {
                const selected = selectedFilterColor === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedFilterColor(color)}
                    style={[
                      styles.dialogPaletteSwatch,
                      { backgroundColor: color },
                      selected ? styles.dialogPaletteSwatchSelected : null,
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.dialogRangeActions}>
              <Pressable onPress={() => setSelectedFilterColor(null)} style={styles.dialogStepButton}>
                <Text style={styles.dialogStepButtonText}>Clear</Text>
              </Pressable>
              <Pressable onPress={() => setColorDialogVisible(false)} style={styles.dialogButtonCompact}>
                <Text style={styles.dialogButtonText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isCalendarDialogVisible}
        onRequestClose={() => setCalendarDialogVisible(false)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setCalendarDialogVisible(false)} />
          <View style={styles.calendarDialogCard}>
            <Text style={styles.dialogTitle}>Save Outfit To Calendar</Text>
            <Text style={styles.calendarDialogSubtitle}>Select a date, then choose one or more time slots.</Text>

            <View style={styles.calendarPreviewCard}>
              <Text style={styles.calendarPreviewTitle}>Outfit preview</Text>
              <View style={styles.calendarPreviewRow}>
                <View style={styles.calendarPreviewMainColumn}>
                  <View style={styles.calendarPreviewTopRow}>
                    <View style={styles.calendarPreviewLargeTile}>
                      {getDisplayUri(calendarPreviewOutfit.Tops) ? (
                        <Image source={{ uri: getDisplayUri(calendarPreviewOutfit.Tops)! }} style={styles.galleryImage} contentFit="cover" />
                      ) : null}
                    </View>
                    <View style={[styles.calendarPreviewLargeTile, styles.galleryTileGap]}>
                      {getDisplayUri(calendarPreviewOutfit.Bottoms) ? (
                        <Image source={{ uri: getDisplayUri(calendarPreviewOutfit.Bottoms)! }} style={styles.galleryImage} contentFit="cover" />
                      ) : null}
                    </View>
                  </View>
                  <View style={[styles.calendarPreviewWideTile, styles.galleryRowGap]}>
                    {getDisplayUri(calendarPreviewOutfit.Shoes) ? (
                      <Image source={{ uri: getDisplayUri(calendarPreviewOutfit.Shoes)! }} style={styles.galleryImage} contentFit="cover" />
                    ) : null}
                  </View>
                </View>
                <View style={styles.calendarPreviewSideColumn}>
                  <View style={styles.calendarPreviewSmallTile}>
                    {getDisplayUri(calendarPreviewOutfit.Accessories) ? (
                      <Image source={{ uri: getDisplayUri(calendarPreviewOutfit.Accessories)! }} style={styles.galleryImage} contentFit="cover" />
                    ) : null}
                  </View>
                  <View style={[styles.calendarPreviewSmallTile, styles.galleryRowGap]}>
                    {getDisplayUri(calendarPreviewOutfit.Bags) ? (
                      <Image source={{ uri: getDisplayUri(calendarPreviewOutfit.Bags)! }} style={styles.galleryImage} contentFit="cover" />
                    ) : null}
                  </View>
                  <View style={[styles.calendarPreviewSmallTile, styles.galleryRowGap]}>
                    {getDisplayUri(calendarPreviewOutfit.Watch) ? (
                      <Image source={{ uri: getDisplayUri(calendarPreviewOutfit.Watch)! }} style={styles.galleryImage} contentFit="cover" />
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.calendarDialogHeader}>
              <Pressable
                onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                style={styles.calendarMonthButton}>
                <Text style={styles.calendarMonthButtonText}>{'<'}</Text>
              </Pressable>
              <Text style={styles.calendarMonthLabel}>{formatMonthLabel(calendarMonth)}</Text>
              <Pressable
                onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                style={styles.calendarMonthButton}>
                <Text style={styles.calendarMonthButtonText}>{'>'}</Text>
              </Pressable>
            </View>

            <View style={styles.calendarWeekRow}>
              {CALENDAR_DAY_LABELS.map((label) => (
                <Text key={label} style={styles.calendarWeekLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.calendarDaysGrid}>
              {calendarDays.map((date) => {
                const dayKey = formatDayKey(date);
                const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                const isSelected = dayKey === selectedCalendarKey;

                return (
                  <Pressable
                    key={dayKey}
                    onPress={() => setSelectedCalendarDate(date)}
                    style={[
                      styles.calendarDayCell,
                      isSelected ? styles.calendarDayCellSelected : null,
                      !isCurrentMonth ? styles.calendarDayCellMuted : null,
                    ]}>
                    <Text style={[styles.calendarDayText, isSelected ? styles.calendarDayTextSelected : null]}>{date.getDate()}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.calendarSelectedDate}>Date: {selectedCalendarKey}</Text>

            <View style={styles.calendarTimeRow}>
              {CALENDAR_TIME_OPTIONS.map((time) => {
                const selected = selectedCalendarTimes.includes(time);
                return (
                  <Pressable
                    key={time}
                    onPress={() => toggleCalendarTime(time)}
                    style={[styles.calendarTimeChip, selected ? styles.calendarTimeChipSelected : null]}>
                    <Text style={[styles.calendarTimeChipText, selected ? styles.calendarTimeChipTextSelected : null]}>{time}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.calendarDialogActions}>
              <Pressable onPress={() => setCalendarDialogVisible(false)} style={styles.calendarCancelButton}>
                <Text style={styles.calendarCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => confirmSaveOutfitToCalendar(pendingCalendarOutfit ?? selectedOutfit)} style={styles.dialogButton}>
                <Text style={styles.dialogButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <OutfitSuggestions
        suggestions={suggestedOutfits}
        visible={isSuggestionsVisible}
        getDisplayUri={getDisplayUri}
        onApply={(outfit) => { setSelectedOutfit(outfit); setSuggestionsVisible(false); }}
        onClose={() => setSuggestionsVisible(false)}
        onSaveToCloset={(outfit) => { setSuggestionsVisible(false); void saveOutfitToCloset(outfit); }}
        onSchedule={(outfit) => { setSuggestionsVisible(false); openCalendarForOutfit(outfit); }}
      />

      <Modal
        animationType="slide"
        visible={selectedItemDetail !== null}
        onRequestClose={() => setSelectedItemDetail(null)}>
        <View style={[styles.detailScreen, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 }]}>
          <View style={styles.detailSwipeZone} {...itemDetailDismissResponder.panHandlers}>
            <View style={styles.detailSwipeHandle} />
          </View>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => setSelectedItemDetail(null)} style={styles.detailBackButton}>
              <Text style={styles.detailBackText}>Back</Text>
            </Pressable>
            <View style={styles.detailHeaderTitleWrap}>
              <Text numberOfLines={1} style={styles.detailTitle}>Item Details</Text>
            </View>
            <Pressable
              accessibilityLabel="Close item details"
              onPress={() => setSelectedItemDetail(null)}
              style={styles.detailCloseButton}>
              <Ionicons color={LuxuryTheme.accent} name="close" size={18} />
            </Pressable>
          </View>
          {selectedItemDetail ? (
            <View style={styles.detailCard}>
              {selectedItemDetail.displayUri ? (
                <Image source={{ uri: selectedItemDetail.displayUri }} style={styles.detailImage} contentFit="cover" />
              ) : (
                <View style={styles.detailFallback}>
                  <Text style={styles.detailFallbackText}>{selectedItemDetail.subParts || selectedItemDetail.bodyPart || 'Item'}</Text>
                </View>
              )}
              <Text style={styles.detailName}>{selectedItemDetail.subParts || selectedItemDetail.bodyPart || 'Closet Item'}</Text>
              <Text style={styles.detailMeta}>Slot: {getSlotLabel(selectedItemDetail.slot)}</Text>
              <Text style={styles.detailMeta}>Source: {selectedItemDetail.source}</Text>
              <Text style={styles.detailMeta}>Section: {selectedItemDetail.closetSectionPath || selectedItemDetail.closetSectionName || 'No section'}</Text>
              <Text style={styles.detailMeta}>Tags: {(selectedItemDetail.styleTags ?? []).join(', ') || 'No tags'}</Text>
              <Text style={styles.detailMeta}>Colors</Text>
              <View style={styles.suggestionColorsRow}>
                {(selectedItemDetail.colors ?? []).filter(isHexColor).length ? (
                  (selectedItemDetail.colors ?? [])
                    .filter(isHexColor)
                    .map((color, colorIndex) => (
                      <View
                        key={`${selectedItemDetail.id ?? 'detail'}-${color}-${colorIndex}`}
                        style={[styles.suggestionColorChip, { backgroundColor: color }]}
                      />
                    ))
                ) : (
                  <Text style={styles.detailMeta}>No saved colors</Text>
                )}
              </View>
              <Pressable
                onPress={() => {
                  assignSelectedItem(selectedItemDetail);
                  setSelectedItemDetail(null);
                }}
                style={styles.detailPrimaryButton}>
                <Text style={styles.detailPrimaryText}>Use In Outfit</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={isOutfitDetailVisible}
        onRequestClose={() => setOutfitDetailVisible(false)}>
        <View style={[styles.detailScreen, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 }]}>
          <View style={styles.detailSwipeZone} {...outfitDetailDismissResponder.panHandlers}>
            <View style={styles.detailSwipeHandle} />
          </View>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => setOutfitDetailVisible(false)} style={styles.detailBackButton}>
              <Text style={styles.detailBackText}>Back</Text>
            </Pressable>
            <View style={styles.detailHeaderTitleWrap}>
              <Text numberOfLines={1} style={styles.detailTitle}>Outfit Details</Text>
            </View>
            <Pressable
              accessibilityLabel="Close outfit details"
              onPress={() => setOutfitDetailVisible(false)}
              style={styles.detailCloseButton}>
              <Ionicons color={LuxuryTheme.accent} name="close" size={18} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.outfitDetailList}>
            <View style={styles.detailCard}>
              <Text style={styles.detailName}>Combination Colors</Text>
              <View style={styles.combinationPaletteRow}>
                {outfitCombinationColors.length ? (
                  outfitCombinationColors.map((color, colorIndex) => (
                    <View
                      key={`outfit-combination-${color}-${colorIndex}`}
                      style={[styles.combinationColorRect, { backgroundColor: color }]}
                    />
                  ))
                ) : (
                  <Text style={styles.detailMeta}>No saved colors</Text>
                )}
              </View>
            </View>
            {(Object.entries(selectedOutfit) as [OutfitSlot, HomeItem | null | undefined][]).map(([slot, item]) =>
              item ? (
                <View key={slot} style={styles.outfitDetailRow}>
                  {getDisplayUri(item) ? (
                    <Image source={{ uri: getDisplayUri(item)! }} style={styles.outfitDetailImage} contentFit="cover" />
                  ) : (
                    <View style={styles.detailFallback}>
                      <Text style={styles.detailFallbackText}>{item.subParts || item.bodyPart || 'Item'}</Text>
                    </View>
                  )}
                  <View style={styles.outfitDetailTextWrap}>
                    <Text style={styles.detailName}>{getSlotLabel(slot)}</Text>
                    <Text style={styles.detailMeta}>Type: {item.subType || item.subParts || item.bodyPart || 'Saved item'}</Text>
                    <Text style={styles.detailMeta}>Style: {(item.styleTags ?? []).join(', ') || 'No tags'}</Text>
                    <Text style={styles.detailMeta}>Section: {item.closetSectionPath || item.closetSectionName || 'No section'}</Text>
                    <Text style={styles.detailMeta}>Colors</Text>
                    <View style={styles.suggestionColorsRow}>
                      {(item.colors ?? []).filter(isHexColor).length ? (
                        (item.colors ?? [])
                          .filter(isHexColor)
                          .map((color, colorIndex) => (
                            <View
                              key={`${slot}-${color}-${colorIndex}`}
                              style={[styles.suggestionColorChip, { backgroundColor: color }]}
                            />
                          ))
                      ) : (
                        <Text style={styles.detailMeta}>No saved colors</Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : null
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCancelButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  calendarCancelButtonText: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  calendarDayCell: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.cardAlt,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    marginBottom: 6,
    width: '13.4%',
  },
  calendarDayCellMuted: {
    opacity: 0.45,
  },
  calendarDayCellSelected: {
    backgroundColor: LuxuryTheme.chipActive,
  },
  calendarDayText: {
    color: LuxuryTheme.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: LuxuryTheme.chipActiveText,
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  calendarDialogActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  calendarDialogCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 14,
    padding: 18,
  },
  calendarDialogHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  calendarDialogSubtitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  calendarPreviewCard: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 18,
    marginTop: 14,
    borderWidth: 1,
    padding: 10,
  },
  calendarPreviewLargeTile: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 14,
    flex: 1,
    height: 76,
    overflow: 'hidden',
  },
  calendarPreviewMainColumn: {
    flex: 1,
  },
  calendarPreviewRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  calendarPreviewSideColumn: {
    marginLeft: 6,
    width: 64,
  },
  calendarPreviewSmallTile: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 14,
    height: 48,
    overflow: 'hidden',
  },
  calendarPreviewTitle: {
    color: LuxuryTheme.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  calendarPreviewTopRow: {
    flexDirection: 'row',
  },
  calendarPreviewWideTile: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 14,
    height: 56,
    overflow: 'hidden',
  },
  calendarMonthButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  calendarMonthButtonText: {
    color: LuxuryTheme.accent,
    fontSize: 16,
    fontWeight: '900',
  },
  calendarMonthLabel: {
    color: LuxuryTheme.textStrong,
    fontSize: 16,
    fontWeight: '800',
  },
  calendarSelectedDate: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  calendarTimeChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderRadius: 14,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  calendarTimeChipSelected: {
    backgroundColor: LuxuryTheme.chipActive,
  },
  calendarTimeChipText: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  calendarTimeChipTextSelected: {
    color: LuxuryTheme.chipActiveText,
  },
  calendarTimeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  calendarWeekLabel: {
    color: LuxuryTheme.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    width: '13.4%',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  combinationColorRect: {
    borderColor: LuxuryTheme.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    height: 42,
    minWidth: 48,
  },
  combinationPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterPillIcon: {
    marginRight: 5,
  },
  filterPillSelected: {
    backgroundColor: LuxuryTheme.chipActive,
    borderColor: LuxuryTheme.accent,
  },
  filterPillText: {
    color: LuxuryTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextSelected: {
    color: LuxuryTheme.chipActiveText,
  },
  categoryRow: {
    alignItems: 'center',
    minHeight: 40,
    paddingVertical: 4,
    paddingRight: 8,
  },
  clearInlineChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    marginLeft: 6,
    width: 30,
  },
  iconControl: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.border,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  iconControlValue: {
    color: LuxuryTheme.accentSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  selectedColorDot: {
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 16,
    width: 16,
  },
  selectedColorDotEmpty: {
    backgroundColor: LuxuryTheme.chip,
  },
  controlTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  disabledText: {
    color: '#7C6855',
  },
  dialogBackdrop: {
    flex: 1,
  },
  detailBackButton: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailBackText: {
    color: LuxuryTheme.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  detailCloseButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  dialogButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    marginTop: 18,
  },
  dialogButtonCompact: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 12,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  dialogButtonText: {
    color: '#120F0D',
    fontSize: 13,
    fontWeight: '800',
  },
  dialogCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 20,
    padding: 18,
  },
  dialogPaletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  dialogPaletteSwatch: {
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    width: 34,
  },
  dialogPaletteSwatchSelected: {
    borderColor: LuxuryTheme.accent,
    borderWidth: 3,
  },
  dialogOverlay: {
    backgroundColor: LuxuryTheme.overlay,
    flex: 1,
    justifyContent: 'center',
  },
  dialogRangeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  dialogStepButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  dialogStepButtonText: {
    color: LuxuryTheme.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  dialogTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  dialogSubtitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  dialogValue: {
    color: LuxuryTheme.accent,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  detailFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 18,
    height: 260,
    justifyContent: 'center',
  },
  detailFallbackText: {
    color: LuxuryTheme.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
  },
  detailHeaderTitleWrap: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  detailImage: {
    borderRadius: 18,
    height: 260,
    width: '100%',
  },
  detailMeta: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  detailName: {
    color: LuxuryTheme.textStrong,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },
  detailPrimaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    marginTop: 18,
  },
  detailPrimaryText: {
    color: '#120F0D',
    fontSize: 13,
    fontWeight: '800',
  },
  detailScreen: {
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  detailSwipeHandle: {
    backgroundColor: LuxuryTheme.border,
    borderRadius: 999,
    height: 5,
    width: 44,
  },
  detailSwipeZone: {
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 2,
  },
  detailTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
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
  galleryColumn: {
    width: 86,
  },
  galleryImage: {
    borderRadius: 16,
    height: '100%',
    width: '100%',
  },
  galleryRow: {
    flexDirection: 'row',
  },
  galleryRowGap: {
    marginTop: 6,
  },
  galleryTile: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 18,
    overflow: 'hidden',
  },
  galleryTileGap: {
    marginLeft: 6,
  },
  galleryTileLarge: {
    flex: 1,
    height: 154,
  },
  galleryTileMini: {
    flex: 1,
    height: 72,
  },
  galleryTileSmall: {
    height: 57,
    width: 86,
  },
  galleryTileWide: {
    flex: 1,
    height: 120,
  },
  listHeader: {
    gap: 2,
    marginTop: 10,
    paddingBottom: 8,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  dragPreview: {
    borderColor: LuxuryTheme.accent,
    borderRadius: 18,
    borderWidth: 2,
    elevation: 8,
    height: 84,
    opacity: 0.92,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: '#52372A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    width: 84,
    zIndex: 50,
  },
  dragPreviewImage: {
    height: '100%',
    width: '100%',
  },
  pickedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  underOutfitFiltersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickedText: {
    color: LuxuryTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  outfitDetailImage: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 220,
    width: '100%',
  },
  outfitDetailList: {
    gap: 12,
    paddingBottom: 20,
  },
  outfitDetailRow: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
  },
  outfitDetailTextWrap: {
    marginTop: 12,
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
    paddingBottom: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  screenContent: {
    flexGrow: 1,
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
  suggestionColorChip: {
    borderColor: LuxuryTheme.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 22,
    marginRight: 8,
    width: 22,
  },
  suggestionColorsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    minHeight: 24,
  },
  sliderFill: {
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 999,
    height: 6,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  sliderLabel: {
    color: LuxuryTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderThumb: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.accent,
    borderRadius: 11,
    borderWidth: 3,
    height: 22,
    marginLeft: -11,
    position: 'absolute',
    top: -8,
    width: 22,
  },
  sliderTrack: {
    backgroundColor: LuxuryTheme.border,
    borderRadius: 999,
    height: 6,
    marginTop: 14,
    position: 'relative',
  },
  sliderWrap: {
    marginTop: 2,
  },
  topControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
});
