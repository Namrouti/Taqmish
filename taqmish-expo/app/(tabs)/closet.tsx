import { useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { FirebaseError } from 'firebase/app';
import jpeg from 'jpeg-js';
import { getDownloadURL, getMetadata, getStorage as getFirebaseStorage, ref as storageRef } from 'firebase/storage';
import { push, ref as databaseRef, remove, set, update } from 'firebase/database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app-shell';
import { LuxuryTheme } from '@/constants/theme';
import { app, database, storage } from '@/lib/firebase';
import type { ClosetItem } from '@/hooks/use-closet-items';
import { type ClosetSectionRecord, useClosetSections } from '@/hooks/use-closet-sections';
import { type OutfitRecord, useOutfits } from '@/hooks/use-outfits';
import { type WardrobeItem, useWardrobeItems } from '@/hooks/use-wardrobe-items';
import { useAuth } from '@/providers/auth-provider';

type ClosetFilter = 'All' | 'Top' | 'Bottom' | 'Shoes' | 'Accessories' | 'Bag';
type CapturedType = 'Top' | 'Bottom' | 'Shoes' | 'Accessories' | 'Bag';
type BaseSection = {
  iconKey?: string;
  id: string;
  name: string;
  parentSectionId?: string;
  parentSectionName?: string;
  types: CapturedType[];
};
type DisplaySection = ClosetSectionRecord & {
  id: string;
  iconKey?: string;
  level: number;
  name: string;
  parentSectionId?: string;
  pathLabel: string;
  types: CapturedType[];
};
type ClosetShelfGroup = {
  id: string;
  iconKey?: string;
  itemCount: number;
  items: ClosetItem[];
  label: string;
  pathLabel?: string;
};

type SectionDialogMode = 'create' | 'edit';
type ClosetViewMode = 'items' | 'outfits';
type OutfitSourceFilter = 'My Closet' | 'Store' | 'Mixed';

const filters: ClosetFilter[] = ['All', 'Top', 'Bottom', 'Shoes', 'Accessories', 'Bag'];
const outfitSourceFilters: OutfitSourceFilter[] = ['My Closet', 'Store', 'Mixed'];
const capturedTypes: CapturedType[] = ['Top', 'Bottom', 'Shoes', 'Accessories', 'Bag'];
const ALL_SECTIONS_ID = 'all-sections';
const DEFAULT_SECTION_ICONS = ['shirt-outline', 'briefcase-outline', 'sparkles-outline', 'footsteps-outline', 'pricetag-outline'];
const DEFAULT_STYLE_TAGS = ['casual', 'formal', 'evening', 'sport', 'classic', 'streetwear', 'modest', 'business'];
const DEFAULT_SEASON_TAGS = ['spring', 'summer', 'autumn', 'winter'];
const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const DEFAULT_AGE_OPTIONS = ['kids', 'teen', 'adult'];
const DEFAULT_BODY_PART_OPTIONS = ['الجزء العلوي', 'الجزء السفلي', 'أحذية', 'اكسسوارات'];

function rgbToHex(red: number, green: number, blue: number) {
  return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue
    .toString(16)
    .padStart(2, '0')}`.toUpperCase();
}

function quantizeColor(value: number, step = 32) {
  return Math.min(255, Math.round(value / step) * step);
}

async function extractImagePalette(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const decoded = jpeg.decode(bytes, { useTArray: true });
  const counts = new Map<string, number>();
  const step = Math.max(1, Math.floor(Math.sqrt((decoded.width * decoded.height) / 2500)));

  for (let y = 0; y < decoded.height; y += step) {
    for (let x = 0; x < decoded.width; x += step) {
      const index = (y * decoded.width + x) * 4;
      const red = decoded.data[index];
      const green = decoded.data[index + 1];
      const blue = decoded.data[index + 2];

      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      if (max < 20) {
        continue;
      }
      if (max > 245 && max - min < 10) {
        continue;
      }

      const key = rgbToHex(quantizeColor(red), quantizeColor(green), quantizeColor(blue));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([color]) => color)
    .slice(0, 8);
}

function classifyItemType(width?: number, height?: number): CapturedType {
  if (!width || !height) {
    return 'Accessories';
  }

  const ratio = width / Math.max(1, height);

  if (ratio > 1.2) {
    return 'Top';
  }
  if (ratio < 0.8) {
    return 'Bottom';
  }
  if (ratio > 0.9 && ratio < 1.1) {
    return 'Shoes';
  }
  return 'Accessories';
}

function buildAutoCropRect(type: CapturedType, width: number, height: number) {
  const sourceWidth = Math.max(1, Math.floor(width));
  const sourceHeight = Math.max(1, Math.floor(height));

  if (type === 'Top') {
    const cropWidth = Math.floor(sourceWidth * 0.82);
    const cropHeight = Math.floor(sourceHeight * 0.72);
    return {
      originX: Math.floor((sourceWidth - cropWidth) / 2),
      originY: Math.floor(sourceHeight * 0.08),
      width: cropWidth,
      height: cropHeight,
    };
  }

  if (type === 'Bottom') {
    const cropWidth = Math.floor(sourceWidth * 0.82);
    const cropHeight = Math.floor(sourceHeight * 0.76);
    return {
      originX: Math.floor((sourceWidth - cropWidth) / 2),
      originY: Math.floor(sourceHeight * 0.18),
      width: cropWidth,
      height: cropHeight,
    };
  }

  if (type === 'Shoes') {
    const cropWidth = Math.floor(sourceWidth * 0.88);
    const cropHeight = Math.floor(sourceHeight * 0.58);
    return {
      originX: Math.floor((sourceWidth - cropWidth) / 2),
      originY: Math.floor(sourceHeight * 0.26),
      width: cropWidth,
      height: cropHeight,
    };
  }

  const cropWidth = Math.floor(sourceWidth * 0.84);
  const cropHeight = Math.floor(sourceHeight * 0.74);
  return {
    originX: Math.floor((sourceWidth - cropWidth) / 2),
    originY: Math.floor((sourceHeight - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

function getBodyPartForType(type: CapturedType) {
  if (type === 'Top') return 'الجزء العلوي';
  if (type === 'Bottom') return 'الجزء السفلي';
  if (type === 'Shoes') return 'أحذية';
  return 'اكسسوارات';
}

function getFilterLabel(type: ClosetFilter) {
  switch (type) {
    case 'Top':
      return 'Tops';
    case 'Bottom':
      return 'Bottoms';
    case 'Shoes':
      return 'Shoes';
    case 'Accessories':
      return 'Accessories';
    case 'Bag':
      return 'Bags';
    default:
      return 'All items';
  }
}

function mapFilterMatch(item: ClosetItem, filter: ClosetFilter) {
  if (filter === 'All') {
    return true;
  }

  const subParts = (item.subParts ?? '').toLowerCase();

  if (filter === 'Bag') {
    return subParts.includes('bag');
  }

  return subParts.includes(filter.toLowerCase());
}

function getPlaceholderColors(type: CapturedType) {
  switch (type) {
    case 'Top':
      return ['#B36A4C', '#E6C1AB'];
    case 'Bottom':
      return ['#6B7280', '#D1D5DB'];
    case 'Shoes':
      return ['#4B5563', '#E5E7EB'];
    case 'Bag':
      return ['#7C4A2D', '#D6B299'];
    default:
      return ['#C9A27A', '#F0E0D0'];
  }
}

function resolveImageUri(uri?: string | null) {
  if (!uri) {
    return undefined;
  }

  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }

  return `file://${uri.replace(/\\/g, '/')}`;
}

function normalizeCapturedType(value?: string | null): CapturedType | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized.includes('top')) return 'Top';
  if (normalized.includes('bottom')) return 'Bottom';
  if (normalized.includes('shoe')) return 'Shoes';
  if (normalized.includes('bag')) return 'Bag';
  if (normalized.includes('access')) return 'Accessories';
  return null;
}

function buildStorageBucketCandidates(projectId?: string | null, configuredBucket?: string | null) {
  const candidates = [configuredBucket, projectId ? `${projectId}.appspot.com` : null].filter(
    (value): value is string => Boolean(value?.trim())
  );

  return Array.from(new Set(candidates));
}

function normalizeBaseSection(record: ClosetSectionRecord, index: number): BaseSection | null {
  const name = record.name?.trim();
  if (!name) {
    return null;
  }

  const types = (record.types ?? [])
    .map((entry) => normalizeCapturedType(entry))
    .filter((entry): entry is CapturedType => entry !== null);

  return {
    iconKey: record.iconKey,
    id: record.id ?? `section-${index}`,
    name,
    parentSectionId: record.parentSectionId,
    parentSectionName: record.parentSectionName,
    types: types.length ? Array.from(new Set(types)) : [],
  };
}

function buildDisplaySections(records: ClosetSectionRecord[]) {
  const baseSections = records
    .map(normalizeBaseSection)
    .filter((entry): entry is BaseSection => entry !== null);

  const byId = new Map(baseSections.map((section) => [section.id, section]));
  const byParent = new Map<string, BaseSection[]>();

  for (const section of baseSections) {
    const parentId = section.parentSectionId && byId.has(section.parentSectionId) ? section.parentSectionId : '';
    const list = byParent.get(parentId) ?? [];
    list.push(section);
    byParent.set(parentId, list);
  }

  for (const list of byParent.values()) {
    list.sort((left, right) => left.name.localeCompare(right.name));
  }

  const output: DisplaySection[] = [];

  const visit = (parentId: string, level: number, parentPath?: string) => {
    const children = byParent.get(parentId) ?? [];
    for (const section of children) {
      const pathLabel = parentPath ? `${parentPath} / ${section.name}` : section.name;
      output.push({
        ...section,
        level,
        pathLabel,
      });
      visit(section.id, level + 1, pathLabel);
    }
  };

  visit('', 0);
  return output;
}

function itemTypeForSection(item: ClosetItem): CapturedType | null {
  return normalizeCapturedType(item.subParts);
}

function buildSectionIdsMap(sections: DisplaySection[]) {
  const childrenByParent = new Map<string, string[]>();
  for (const section of sections) {
    const parentId = section.parentSectionId ?? '';
    const list = childrenByParent.get(parentId) ?? [];
    list.push(section.id);
    childrenByParent.set(parentId, list);
  }

  const descendantsById = new Map<string, Set<string>>();

  const collect = (sectionId: string) => {
    if (descendantsById.has(sectionId)) {
      return descendantsById.get(sectionId)!;
    }

    const collected = new Set<string>([sectionId]);
    const children = childrenByParent.get(sectionId) ?? [];
    for (const childId of children) {
      const childSet = collect(childId);
      for (const value of childSet) {
        collected.add(value);
      }
    }

    descendantsById.set(sectionId, collected);
    return collected;
  };

  for (const section of sections) {
    collect(section.id);
  }

  return descendantsById;
}

function matchesSection(item: ClosetItem, sectionIds: Set<string>, fallbackTypes: CapturedType[]) {
  if (item.closetSectionId && sectionIds.has(item.closetSectionId)) {
    return true;
  }

  if (item.closetSectionPath) {
    const pathParts = item.closetSectionPath
      .split('/')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (item.closetSectionName && pathParts.includes(item.closetSectionName.trim())) {
      return true;
    }
  }

  if (item.closetSectionName && fallbackTypes.length === 0) {
    return true;
  }

  if (!fallbackTypes.length) {
    return false;
  }

  const itemType = itemTypeForSection(item);
  return itemType ? fallbackTypes.includes(itemType) : false;
}

function resolveDisplaySectionForItem(item: ClosetItem, sections: DisplaySection[]) {
  if (item.closetSectionId) {
    const exact = sections.find((section) => section.id === item.closetSectionId);
    if (exact) {
      return exact;
    }
  }

  const normalizedPath = (item.closetSectionPath ?? '')
    .split('/')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(' / ');

  if (normalizedPath) {
    const byPath = sections.find((section) => section.pathLabel === normalizedPath);
    if (byPath) {
      return byPath;
    }
  }

  const normalizedName = item.closetSectionName?.trim().toLowerCase();
  if (normalizedName) {
    const byName = sections.find((section) => section.name.trim().toLowerCase() === normalizedName);
    if (byName) {
      return byName;
    }
  }

  return null;
}

function toLegacyClosetItem(item: WardrobeItem): ClosetItem {
  return {
    age: item.age,
    bodyPart: item.bodyPart,
    bodyPartKey: item.bodyPartKey,
    closetSectionId: item.closetSectionId,
    closetSectionName: item.closetSectionName,
    closetSectionPath: item.closetSectionPath,
    colors: item.colors,
    filePath: item.filePath,
    genderKey: item.genderKey,
    id: item.id,
    mainClass: item.mainClass,
    ownerId: item.ownerId,
    seasonTags: item.seasonTags,
    sex: item.sex,
    size: item.size,
    source: item.source,
    styleTags: item.styleTags,
    subParts: item.subParts,
    subType: item.subType,
    title: item.title,
  };
}

function isHexColor(value?: string | null) {
  if (!value) {
    return false;
  }
  const normalized = value.trim();
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(normalized);
}

function getOutfitColors(outfit: OutfitRecord) {
  const fromSummary = (outfit.color ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => isHexColor(entry));

  const fromItems = [
    ...(outfit.top?.colors ?? []),
    ...(outfit.down?.colors ?? []),
    ...(outfit.shoes?.colors ?? []),
    ...(outfit.accessories?.colors ?? []),
    ...(outfit.bag?.colors ?? []),
    ...(outfit.hat?.colors ?? []),
    ...(outfit.watch?.colors ?? []),
  ].filter((entry) => isHexColor(entry));

  return Array.from(new Set([...(fromSummary as string[]), ...(fromItems as string[])])).slice(0, 8);
}

function getOutfitItems(outfit: OutfitRecord) {
  return [
    { item: outfit.top, label: 'Top' },
    { item: outfit.down, label: 'Bottom' },
    { item: outfit.shoes, label: 'Shoes' },
    { item: outfit.accessories, label: 'Accessories' },
    { item: outfit.bag, label: 'Bag' },
    { item: outfit.hat, label: 'Hat' },
    { item: outfit.watch, label: 'Watch' },
  ].filter((entry) => Boolean(entry.item));
}

function getOutfitSourceFilter(outfit: OutfitRecord): OutfitSourceFilter {
  const sources = Array.from(
    new Set(
      getOutfitItems(outfit)
        .map(({ item }) => item?.source?.trim().toLowerCase())
        .filter((source): source is string => Boolean(source))
    )
  );

  if (!sources.length) {
    return 'Store';
  }

  if (sources.every((source) => source === 'user')) {
    return 'My Closet';
  }

  if (sources.every((source) => source === 'store')) {
    return 'Store';
  }

  return 'Mixed';
}

export default function ClosetScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, isLoading: isAuthLoading } = useAuth();
  const { isLoading, userItems } = useWardrobeItems(authUser?.uid);
  const { items: savedOutfits, isLoading: isLoadingOutfits } = useOutfits(authUser?.uid);
  const { items: sectionRecords } = useClosetSections(authUser?.uid);
  const [activeFilter, setActiveFilter] = useState<ClosetFilter>('All');
  const [activeSectionId, setActiveSectionId] = useState(ALL_SECTIONS_ID);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<CapturedType>('Accessories');
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [isCaptureDialogVisible, setCaptureDialogVisible] = useState(false);
  const [isSectionDialogVisible, setSectionDialogVisible] = useState(false);
  const [isProcessingCapture, setProcessingCapture] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isMovingItem, setIsMovingItem] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionTypes, setNewSectionTypes] = useState<CapturedType[]>(['Top']);
  const [newSectionParentId, setNewSectionParentId] = useState<string | null>(null);
  const [selectedSectionIcon, setSelectedSectionIcon] = useState(DEFAULT_SECTION_ICONS[0]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionDialogMode, setSectionDialogMode] = useState<SectionDialogMode>('create');
  const [movingItem, setMovingItem] = useState<ClosetItem | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<ClosetItem | null>(null);
  const [selectedOutfitDetail, setSelectedOutfitDetail] = useState<OutfitRecord | null>(null);
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>(['casual']);
  const [isEditItemDialogVisible, setEditItemDialogVisible] = useState(false);
  const [editingItemBodyPart, setEditingItemBodyPart] = useState(DEFAULT_BODY_PART_OPTIONS[0]);
  const [editingItemStyleTags, setEditingItemStyleTags] = useState<string[]>(['casual']);
  const [editingItemSeasonTags, setEditingItemSeasonTags] = useState<string[]>([]);
  const [editingItemSize, setEditingItemSize] = useState('');
  const [editingItemAge, setEditingItemAge] = useState('');
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [viewMode, setViewMode] = useState<ClosetViewMode>('items');
  const [savedOutfitSourceFilter, setSavedOutfitSourceFilter] =
    useState<OutfitSourceFilter>('Mixed');

  const items = useMemo(() => userItems.map(toLegacyClosetItem), [userItems]);

  const sections = useMemo(() => buildDisplaySections(sectionRecords), [sectionRecords]);
  const sectionIdsMap = useMemo(() => buildSectionIdsMap(sections), [sections]);
  const rootSections = useMemo(() => sections.filter((section) => section.level === 0), [sections]);
  const selectedSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? null,
    [activeSectionId, sections]
  );
  const visibleChildSections = useMemo(
    () =>
      selectedSection && selectedSection.level === 0
        ? sections.filter((section) => section.parentSectionId === selectedSection.id)
        : [],
    [sections, selectedSection]
  );
  const activeEditSection = useMemo(
    () => sections.find((section) => section.id === editingSectionId) ?? null,
    [editingSectionId, sections]
  );
  const availableParentSections = useMemo(() => {
    if (!activeEditSection) {
      return sections;
    }

    const blockedIds = sectionIdsMap.get(activeEditSection.id) ?? new Set([activeEditSection.id]);
    return sections.filter((section) => !blockedIds.has(section.id));
  }, [activeEditSection, sectionIdsMap, sections]);
  const sectionItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const section of sections) {
      const ids = sectionIdsMap.get(section.id) ?? new Set([section.id]);
      const count = items.filter((item) =>
        matchesSection(item, ids, section.types)
      ).length;
      counts.set(section.id, count);
    }
    return counts;
  }, [items, sectionIdsMap, sections]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (!mapFilterMatch(item, activeFilter)) {
          return false;
        }

        if (activeSectionId === ALL_SECTIONS_ID || !selectedSection) {
          return true;
        }

        return matchesSection(
          item,
          sectionIdsMap.get(selectedSection.id) ?? new Set([selectedSection.id]),
          selectedSection.types
        );
      }),
    [activeFilter, activeSectionId, items, sectionIdsMap, selectedSection]
  );
  const closetShelfGroups = useMemo(() => {
    const buckets = new Map<string, ClosetShelfGroup>();

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
  const filteredSavedOutfits = useMemo(() => {
    if (savedOutfitSourceFilter === 'Mixed') {
      return savedOutfits;
    }

    return savedOutfits.filter(
      (outfit) => getOutfitSourceFilter(outfit) === savedOutfitSourceFilter
    );
  }, [savedOutfitSourceFilter, savedOutfits]);

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

  const processSelectedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    const predictedType = classifyItemType(asset.width, asset.height);
    const hasDimensions = Boolean(asset.width && asset.height);

    setProcessingCapture(true);

    try {
      let processedUri = asset.uri;
      let processedBase64 = asset.base64 ?? null;

      if (hasDimensions) {
        const crop = buildAutoCropRect(predictedType, asset.width!, asset.height!);
        const manipulated = await manipulateAsync(
          asset.uri,
          [{ crop }],
          {
            base64: true,
            compress: 0.92,
            format: SaveFormat.JPEG,
          }
        );
        processedUri = manipulated.uri;
        processedBase64 = manipulated.base64 ?? processedBase64;
        const extractedColors = manipulated.base64 ? await extractImagePalette(manipulated.base64) : [];
        setDominantColors(extractedColors.length ? extractedColors : getPlaceholderColors(predictedType));
      } else {
        const extractedColors = asset.base64 ? await extractImagePalette(asset.base64) : [];
        setDominantColors(extractedColors.length ? extractedColors : getPlaceholderColors(predictedType));
      }

      setCapturedImageUri(processedUri);
      setCapturedImageBase64(processedBase64);
      setCapturedType(predictedType);
      const defaultSection =
        sections.find((section) => section.types.includes(predictedType) && section.level > 0) ??
        sections.find((section) => section.types.includes(predictedType)) ??
        null;
      setSelectedSectionId(defaultSection?.id ?? null);
      setCaptureDialogVisible(true);
    } catch (error) {
      Alert.alert(
        'Auto crop fallback',
        error instanceof Error ? error.message : 'Using the original captured image instead.'
      );
      const fallbackManipulated = await manipulateAsync(
        asset.uri,
        [],
        {
          base64: true,
          compress: 0.92,
          format: SaveFormat.JPEG,
        }
      );
      setCapturedImageUri(fallbackManipulated.uri);
      setCapturedImageBase64(fallbackManipulated.base64 ?? asset.base64 ?? null);
      setCapturedType(predictedType);
      setDominantColors(getPlaceholderColors(predictedType));
      const defaultSection =
        sections.find((section) => section.types.includes(predictedType) && section.level > 0) ??
        sections.find((section) => section.types.includes(predictedType)) ??
        null;
      setSelectedSectionId(defaultSection?.id ?? null);
      setCaptureDialogVisible(true);
    } finally {
      setProcessingCapture(false);
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('يرجى السماح باستخدام الكاميرا أولاً.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      base64: true,
      cameraType: ImagePicker.CameraType.back,
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    await processSelectedAsset(result.assets[0]);
  };

  const openPhotoLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('يرجى السماح بالوصول إلى الصور أولاً.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      base64: true,
      mediaTypes: ['images'],
      quality: 0.9,
      selectionLimit: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    await processSelectedAsset(result.assets[0]);
  };

  const openUploadChoice = () => {
    if (isProcessingCapture || isSaving) {
      return;
    }

    Alert.alert('Add to My Clothes', 'Choose how you want to add the item.', [
      { text: 'Camera', onPress: () => void openCamera() },
      { text: 'Phone Gallery', onPress: () => void openPhotoLibrary() },
      { style: 'cancel', text: 'Cancel' },
    ]);
  };

  const closeCaptureDialog = () => {
    if (isSaving) {
      return;
    }

    setCaptureDialogVisible(false);
    setCapturedImageUri(null);
    setCapturedImageBase64(null);
    setCapturedType('Accessories');
    setDominantColors([]);
    setSelectedSectionId(null);
    setSelectedStyleTags(['casual']);
  };

  const toggleNewSectionType = (type: CapturedType) => {
    setNewSectionTypes((current) => {
      if (current.includes(type)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((entry) => entry !== type);
      }
      return [...current, type];
    });
  };

  const toggleStyleTag = (tag: string) => {
    setSelectedStyleTags((current) => {
      if (current.includes(tag)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((entry) => entry !== tag);
      }

      return [...current, tag];
    });
  };

  const toggleEditingStyleTag = (tag: string) => {
    setEditingItemStyleTags((current) => {
      if (current.includes(tag)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((entry) => entry !== tag);
      }

      return [...current, tag];
    });
  };

  const toggleEditingSeasonTag = (tag: string) => {
    setEditingItemSeasonTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  };

  const openEditItemDialog = () => {
    if (!selectedItemDetail) {
      return;
    }

    setEditingItemBodyPart(selectedItemDetail.bodyPart || DEFAULT_BODY_PART_OPTIONS[0]);
    setEditingItemStyleTags(selectedItemDetail.styleTags?.length ? selectedItemDetail.styleTags : ['casual']);
    setEditingItemSeasonTags(selectedItemDetail.seasonTags ?? []);
    setEditingItemSize(selectedItemDetail.size || '');
    setEditingItemAge(selectedItemDetail.age || '');
    setEditItemDialogVisible(true);
  };

  const saveEditedItem = async () => {
    if (!authUser?.uid || !selectedItemDetail?.id) {
      return;
    }

    setIsUpdatingItem(true);

    try {
      const updatePayload = {
        age: editingItemAge.trim() || 'adult',
        bodyPart: editingItemBodyPart,
        bodyPartKey:
          editingItemBodyPart === 'الجزء العلوي'
            ? 'top'
            : editingItemBodyPart === 'الجزء السفلي'
              ? 'bottom'
              : editingItemBodyPart === 'أحذية'
                ? 'shoes'
                : 'accessory',
        seasonTags: editingItemSeasonTags,
        size: editingItemSize.trim() || 'One Size',
        styleTags: editingItemStyleTags.length ? editingItemStyleTags : ['casual'],
      };

      await Promise.all([
        update(databaseRef(database, `SiteClosets/${authUser.uid}/${selectedItemDetail.id}`), updatePayload),
        update(databaseRef(database, `userClosetItems/${authUser.uid}/${selectedItemDetail.id}`), updatePayload),
      ]);

      setSelectedItemDetail((current) => (current ? { ...current, ...updatePayload } : current));
      setEditItemDialogVisible(false);
      Alert.alert('Item updated successfully.');
    } catch (error) {
      Alert.alert('Failed to update item.', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const openSectionDialog = () => {
    setSectionDialogMode('create');
    setEditingSectionId(null);
    setNewSectionName('');
    setNewSectionTypes(['Top']);
    setNewSectionParentId(activeSectionId !== ALL_SECTIONS_ID ? activeSectionId : null);
    setSelectedSectionIcon(DEFAULT_SECTION_ICONS[0]);
    setSectionDialogVisible(true);
  };

  const openEditSectionDialog = () => {
    if (!selectedSection || selectedSection.id === ALL_SECTIONS_ID) {
      return;
    }

    setSectionDialogMode('edit');
    setEditingSectionId(selectedSection.id);
    setNewSectionName(selectedSection.name);
    setNewSectionTypes(selectedSection.types.length ? selectedSection.types : ['Top']);
    setNewSectionParentId(selectedSection.parentSectionId ?? null);
    setSelectedSectionIcon(selectedSection.iconKey ?? DEFAULT_SECTION_ICONS[0]);
    setSectionDialogVisible(true);
  };

  const saveSection = async () => {
    if (!authUser?.uid) {
      return;
    }

    const trimmedName = newSectionName.trim();
    if (!trimmedName) {
      Alert.alert('Enter a section name first.');
      return;
    }

    if (!newSectionTypes.length) {
      Alert.alert('Select at least one type for this section.');
      return;
    }

    setIsSavingSection(true);

    try {
      const parentSection = sections.find((section) => section.id === newSectionParentId) ?? null;
      if (sectionDialogMode === 'create') {
        const sectionRef = push(databaseRef(database, `ClosetSections/${authUser.uid}`));
        const id = sectionRef.key;

        if (!id) {
          throw new Error('Unable to create section id.');
        }

        await set(sectionRef, {
          iconKey: selectedSectionIcon,
          id,
          name: trimmedName,
          parentSectionId: parentSection?.id ?? null,
          parentSectionName: parentSection?.name ?? null,
          types: newSectionTypes,
        });
        setActiveSectionId(id);
      } else if (editingSectionId) {
        await update(databaseRef(database, `ClosetSections/${authUser.uid}/${editingSectionId}`), {
          iconKey: selectedSectionIcon,
          name: trimmedName,
          parentSectionId: parentSection?.id ?? null,
          parentSectionName: parentSection?.name ?? null,
          types: newSectionTypes,
        });
      }

      setSectionDialogVisible(false);
      Alert.alert(sectionDialogMode === 'create' ? 'Closet section created.' : 'Closet section updated.');
    } catch (error) {
      Alert.alert('Failed to save section.', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSavingSection(false);
    }
  };

  const deleteSection = async () => {
    if (!authUser?.uid || !activeEditSection) {
      return;
    }

    const linkedItemsCount = sectionItemCounts.get(activeEditSection.id) ?? 0;
    if (linkedItemsCount > 0) {
      Alert.alert('Cannot delete this section because it still contains items.');
      return;
    }

    try {
      await remove(databaseRef(database, `ClosetSections/${authUser.uid}/${activeEditSection.id}`));
      setSectionDialogVisible(false);
      setActiveSectionId(ALL_SECTIONS_ID);
      Alert.alert('Closet section deleted.');
    } catch (error) {
      Alert.alert('Failed to delete section.', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const startMoveItem = (item: ClosetItem) => {
    setMovingItem(item);
    setIsMovingItem(true);
    if (item.closetSectionId) {
      setActiveSectionId(item.closetSectionId);
    }
  };

  const moveItemToSection = async (targetSection: DisplaySection | null) => {
    if (!authUser?.uid || !movingItem?.id) {
      return;
    }

    try {
      const updatePayload = {
        closetSectionId: targetSection?.id ?? null,
        closetSectionName: targetSection?.name ?? null,
        closetSectionPath: targetSection?.pathLabel ?? null,
      };
      await Promise.all([
        update(databaseRef(database, `SiteClosets/${authUser.uid}/${movingItem.id}`), updatePayload),
        update(databaseRef(database, `userClosetItems/${authUser.uid}/${movingItem.id}`), updatePayload),
      ]);
      setMovingItem(null);
      setIsMovingItem(false);
      Alert.alert('Item moved successfully.');
    } catch (error) {
      Alert.alert('Failed to move item.', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const saveCapturedPiece = async () => {
    if (!authUser?.uid) {
      Alert.alert('يجب تسجيل الدخول أولاً.');
      return;
    }

    if (!capturedImageUri) {
      Alert.alert('التقط صورة أولاً ثم حاول الحفظ.');
      return;
    }

    setIsSaving(true);

    try {
      const recordRef = push(databaseRef(database, `SiteClosets/${authUser.uid}`));
      const id = recordRef.key;

      if (!id) {
        throw new Error('Unable to create item id.');
      }

      const objectPath = `SiteClosets/${authUser.uid}/${id}.jpg`;
      const fileInfo = await FileSystem.getInfoAsync(capturedImageUri);

      if (!fileInfo.exists || !fileInfo.size) {
        throw new Error('Unable to read the local image file for upload.');
      }

      const idToken = await authUser.getIdToken();
      const storageBuckets = buildStorageBucketCandidates(app.options.projectId, app.options.storageBucket);

      if (!storageBuckets.length) {
        throw new Error('Firebase Storage bucket is missing from app configuration.');
      }

      let activeBucket: string | null = null;
      let uploadFailureDetails = '';

      for (const storageBucket of storageBuckets) {
        const startResponse = await fetch(
          `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(storageBucket)}/o?name=${encodeURIComponent(objectPath)}`,
          {
            body: JSON.stringify({
              contentType: 'image/jpeg',
              name: objectPath,
            }),
            headers: {
              Authorization: `Firebase ${idToken}`,
              'Content-Type': 'application/json; charset=utf-8',
              'X-Firebase-GMPID': app.options.appId ?? '',
              'X-Goog-Upload-Command': 'start',
              'X-Goog-Upload-Header-Content-Length': String(fileInfo.size),
              'X-Goog-Upload-Header-Content-Type': 'image/jpeg',
              'X-Goog-Upload-Protocol': 'resumable',
            },
            method: 'POST',
          }
        );

        if (!startResponse.ok) {
          const startBody = await startResponse.text();
          uploadFailureDetails = `Bucket ${storageBucket}: [${startResponse.status}] ${startBody || 'No server response.'}`;
          continue;
        }

        const uploadUrl = startResponse.headers.get('X-Goog-Upload-URL');
        if (!uploadUrl) {
          const startBody = await startResponse.text();
          uploadFailureDetails = `Bucket ${storageBucket}: missing upload URL. ${startBody || 'No server response.'}`;
          continue;
        }

        const uploadResult = await FileSystem.uploadAsync(uploadUrl, capturedImageUri, {
          fieldName: 'file',
          headers: {
            'Content-Type': 'image/jpeg',
            'X-Goog-Upload-Command': 'upload, finalize',
            'X-Goog-Upload-Offset': '0',
          },
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          uploadFailureDetails = `Bucket ${storageBucket}: [${uploadResult.status}] ${uploadResult.body || 'No server response.'}`;
          continue;
        }

        activeBucket = storageBucket;
        break;
      }

      if (!activeBucket) {
        throw new Error(`Firebase Storage upload failed. ${uploadFailureDetails || 'No bucket accepted the upload request.'}`);
      }

      const activeStorage = getFirebaseStorage(app, `gs://${activeBucket}`);
      const imageRef = storageRef(activeStorage, objectPath);
      const uploadedMetadata = await getMetadata(imageRef);
      if (!uploadedMetadata.fullPath || uploadedMetadata.size === 0) {
        throw new Error('Upload verification failed. Firebase Storage returned empty metadata.');
      }
      const downloadUrl = await getDownloadURL(imageRef);
      const section = sections.find((entry) => entry.id === selectedSectionId) ?? null;

      const payload: ClosetItem = {
        age: 'غير محدد',
        bodyPart: getBodyPartForType(capturedType),
        closetSectionId: section?.id,
        closetSectionName: section?.name,
        closetSectionPath: section?.pathLabel,
        colors: dominantColors,
        filePath: downloadUrl,
        id,
        mainClass: 'Camera',
        sex: 'غير محدد',
        size: 'غير محدد',
        subParts: capturedType,
      };

      const normalizedPayload = {
        ...payload,
        bodyPartKey:
          capturedType === 'Top'
            ? 'top'
            : capturedType === 'Bottom'
              ? 'bottom'
              : capturedType === 'Shoes'
                ? 'shoes'
                : capturedType === 'Bag'
                  ? 'bag'
                  : 'accessory',
        ownerId: authUser.uid,
        seasonTags: [],
        source: 'user',
        styleTags: selectedStyleTags,
        subType: capturedType,
        title: capturedType,
      };

      await Promise.all([
        set(recordRef, normalizedPayload),
        set(databaseRef(database, `userClosetItems/${authUser.uid}/${id}`), normalizedPayload),
      ]);

      closeCaptureDialog();
      Alert.alert('تم حفظ القطعة بنجاح.', `Storage path: ${uploadedMetadata.fullPath}\nBucket: ${activeBucket}`);
    } catch (error) {
      const firebaseError = error as FirebaseError & {
        customData?: { serverResponse?: string };
        serverResponse?: string;
      };
      const details = [
        firebaseError.code,
        firebaseError.message,
        firebaseError.customData?.serverResponse ?? firebaseError.serverResponse,
        `projectId: ${app.options.projectId ?? 'unknown'}`,
        `storageBucket: ${app.options.storageBucket ?? 'unknown'}`,
        `uid: ${authUser.uid}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      Alert.alert(
        'فشل حفظ القطعة.',
        details || (error instanceof Error ? error.message : 'حاول مرة أخرى.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      onPrimaryAction={openUploadChoice}
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
        <View>
          <Text style={styles.filterHeaderTitle}>
            {viewMode === 'items' ? 'My clothes' : 'Saved outfits'}
          </Text>
        </View>
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
                style={[styles.filterChip, activeSectionId === ALL_SECTIONS_ID ? styles.filterChipSelected : null, isMovingItem ? styles.dropTargetChip : null]}>
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
                    style={[styles.subSectionChip, selected ? styles.filterChipSelected : null, isMovingItem ? styles.dropTargetChip : null]}>
                    <Ionicons
                      color={selected ? LuxuryTheme.accentSoft : LuxuryTheme.textMuted}
                      name={(section.iconKey as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                      size={13}
                      style={styles.sectionChipIcon}
                    />
                    <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>{section.name}</Text>
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
                      style={[styles.subSectionChip, selected ? styles.filterChipSelected : null, isMovingItem ? styles.dropTargetChip : null]}>
                      <Ionicons
                        color={selected ? LuxuryTheme.accentSoft : LuxuryTheme.textMuted}
                        name={(section.iconKey as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                        size={13}
                        style={styles.sectionChipIcon}
                      />
                      <Text style={[styles.filterChipText, selected ? styles.filterChipTextSelected : null]}>{section.name}</Text>
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
              <Pressable onPress={() => {
                setIsMovingItem(false);
                setMovingItem(null);
              }}>
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
                  <Text
                    style={[
                      styles.filterChipText,
                      selected ? styles.filterChipTextSelected : null,
                    ]}>
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
                onPress={() => {
                  setSelectedOutfitDetail(outfit);
                }}
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
                      <View key={`${outfit.id ?? 'outfit'}-${color}-${colorIndex}`} style={[styles.savedOutfitColorSwatch, { backgroundColor: color }]} />
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

      {isProcessingCapture ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator color={LuxuryTheme.accent} />
          <Text style={styles.processingText}>Processing captured image...</Text>
        </View>
      ) : isLoading || isLoadingOutfits ? (
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
                  <View>
                    <Text style={styles.closetShelfTitle}>{group.label}</Text>
                  </View>
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
                    <View style={styles.hangerHook} />
                    {resolveImageUri(item.filePath) ? (
                      <Image source={{ uri: resolveImageUri(item.filePath)! }} style={styles.itemImage} contentFit="cover" />
                    ) : (
                      <View style={styles.itemFallback}>
                        <Text style={styles.itemFallbackText}>{item.subParts || 'Item'}</Text>
                      </View>
                    )}
                    <Text style={styles.itemTitle}>{item.subParts || 'Untitled item'}</Text>
                    <Text style={styles.itemMeta}>{item.bodyPart || 'Unknown section'}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      ) : null}

      <Modal
        animationType="fade"
        transparent
        visible={isCaptureDialogVisible}
        onRequestClose={closeCaptureDialog}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={closeCaptureDialog} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Save to My Clothes</Text>
            <Text style={styles.dialogSubtitle}>
              Preview the captured piece, confirm its type, then save it to `SiteClosets`.
            </Text>

            {capturedImageUri ? (
              <View style={styles.previewSection}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewHeaderTitle}>Processed preview</Text>
                  <Text style={styles.previewHeaderMeta}>Prepared preview</Text>
                </View>
                <View style={styles.previewWrap}>
                  <View style={styles.previewCheckerboard}>
                    <View style={styles.previewCheckerRow}>
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                    </View>
                    <View style={styles.previewCheckerRow}>
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                    </View>
                    <View style={styles.previewCheckerRow}>
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                    </View>
                    <View style={styles.previewCheckerRow}>
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                      <View style={styles.previewCheckerCell} />
                      <View style={[styles.previewCheckerCell, styles.previewCheckerCellDark]} />
                    </View>
                  </View>
                  <Image
                    source={{ uri: resolveImageUri(capturedImageUri)! }}
                    style={styles.previewImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.previewNote}>Auto-cropped preview ready for saving.</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detected type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {capturedTypes.map((type) => {
                    const selected = capturedType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => {
                          setCapturedType(type);
                          setDominantColors(getPlaceholderColors(type));
                          const matchingSection =
                            sections.find((section) => section.types.includes(type) && section.level > 0) ??
                            sections.find((section) => section.types.includes(type)) ??
                            null;
                          setSelectedSectionId(matchingSection?.id ?? null);
                        }}
                        style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                        <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Closet section</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  <Pressable
                    onPress={() => setSelectedSectionId(null)}
                    style={[styles.typeChip, selectedSectionId === null ? styles.typeChipSelected : null]}>
                    <Text style={[styles.typeChipText, selectedSectionId === null ? styles.typeChipTextSelected : null]}>No section</Text>
                  </Pressable>
                  {sections.map((section) => {
                    const selected = selectedSectionId === section.id;
                    return (
                      <Pressable
                        key={section.id}
                        onPress={() => setSelectedSectionId(section.id)}
                        style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                        <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{section.pathLabel}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Style tags</Text>
              <View style={styles.typeRowWrap}>
                {DEFAULT_STYLE_TAGS.map((tag) => {
                  const selected = selectedStyleTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleStyleTag(tag)}
                      style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                      <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{tag}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dominant colors</Text>
              <View style={styles.colorsRow}>
                {dominantColors.map((color, colorIndex) => (
                  <View key={`${color}-${colorIndex}`} style={[styles.colorSwatch, { backgroundColor: color }]} />
                ))}
              </View>
            </View>

            <View style={styles.dialogActions}>
              <Pressable
                disabled={isSaving}
                onPress={closeCaptureDialog}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !isSaving ? styles.buttonPressed : null,
                  isSaving ? styles.buttonDisabled : null,
                ]}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isSaving || isProcessingCapture}
                onPress={openCamera}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && !isProcessingCapture ? styles.buttonPressed : null,
                  isProcessingCapture ? styles.buttonDisabled : null,
                ]}>
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </Pressable>
              <Pressable
                disabled={isSaving}
                onPress={saveCapturedPiece}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !isSaving ? styles.buttonPressed : null,
                  isSaving ? styles.buttonDisabled : null,
                ]}>
                {isSaving ? (
                  <ActivityIndicator color={LuxuryTheme.textStrong} />
                ) : (
                  <Text style={styles.primaryButtonText}>Save piece</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={selectedItemDetail !== null}
        onRequestClose={() => setSelectedItemDetail(null)}>
        <View style={[styles.detailScreen, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 }]}>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => setSelectedItemDetail(null)} style={styles.detailBackButton}>
              <Text style={styles.detailBackText}>Back</Text>
            </Pressable>
            <Text style={styles.detailTitle}>Item Details</Text>
          </View>
          {selectedItemDetail ? (
            <ScrollView contentContainerStyle={styles.detailList}>
              <View style={styles.detailCard}>
                {resolveImageUri(selectedItemDetail.filePath) ? (
                  <Image source={{ uri: resolveImageUri(selectedItemDetail.filePath)! }} style={styles.detailImage} contentFit="cover" />
                ) : (
                  <View style={styles.detailFallback}>
                    <Text style={styles.detailFallbackText}>{selectedItemDetail.subParts || 'Item'}</Text>
                  </View>
                )}
                <Text style={styles.detailName}>{selectedItemDetail.subParts || selectedItemDetail.bodyPart || 'Closet item'}</Text>
                <Text style={styles.detailMeta}>Section: {selectedItemDetail.closetSectionPath || selectedItemDetail.closetSectionName || 'No section'}</Text>
                <Text style={styles.detailMeta}>Body part: {selectedItemDetail.bodyPart || 'Unknown'}</Text>
                <Text style={styles.detailMeta}>Tags: {(selectedItemDetail.styleTags ?? []).join(', ') || 'No tags'}</Text>
                <Text style={styles.detailMeta}>Season: {(selectedItemDetail.seasonTags ?? []).join(', ') || 'All season'}</Text>
                <Text style={styles.detailMeta}>Size: {selectedItemDetail.size || 'One Size'}</Text>
                <Text style={styles.detailMeta}>Age: {selectedItemDetail.age || 'adult'}</Text>
                <Text style={styles.detailMeta}>Colors</Text>
                <View style={styles.colorsRow}>
                  {(selectedItemDetail.colors ?? []).length ? (
                    (selectedItemDetail.colors ?? []).map((color, colorIndex) => (
                      <View key={`${selectedItemDetail.id ?? 'detail'}-${color}-${colorIndex}`} style={[styles.colorSwatch, { backgroundColor: color }]} />
                    ))
                  ) : (
                    <Text style={styles.detailMeta}>No saved colors</Text>
                  )}
                </View>
                <Pressable onPress={openEditItemDialog} style={styles.editItemButton}>
                  <Text style={styles.editItemButtonText}>Edit item</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={selectedOutfitDetail !== null}
        onRequestClose={() => setSelectedOutfitDetail(null)}>
        <View style={[styles.detailScreen, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: insets.top + 12 }]}>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => setSelectedOutfitDetail(null)} style={styles.detailBackButton}>
              <Text style={styles.detailBackText}>Back</Text>
            </Pressable>
            <Text style={styles.detailTitle}>Outfit Details</Text>
          </View>
          {selectedOutfitDetail ? (
            <ScrollView contentContainerStyle={styles.detailList}>
              <View style={styles.detailCard}>
                <Text style={styles.detailName}>Saved outfit</Text>
                <Text style={styles.detailMeta}>
                  Source: {getOutfitSourceFilter(selectedOutfitDetail)}
                </Text>
                <Text style={styles.detailMeta}>Color summary</Text>
                <View style={styles.colorsRow}>
                  {getOutfitColors(selectedOutfitDetail).length ? (
                    getOutfitColors(selectedOutfitDetail).map((color, colorIndex) => (
                      <View key={`${selectedOutfitDetail.id ?? 'outfit'}-${color}-${colorIndex}`} style={[styles.colorSwatch, { backgroundColor: color }]} />
                    ))
                  ) : (
                    <Text style={styles.detailMeta}>No saved colors</Text>
                  )}
                </View>
              </View>
              {getOutfitItems(selectedOutfitDetail).map(({ item, label }) => (
                <View key={`${selectedOutfitDetail.id}-${label}`} style={styles.outfitItemDetailCard}>
                  {resolveImageUri(item?.filePath) ? (
                    <Image
                      source={{ uri: resolveImageUri(item?.filePath)! }}
                      style={styles.outfitItemDetailImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.outfitItemDetailFallback}>
                      <Text style={styles.detailFallbackText}>{label}</Text>
                    </View>
                  )}
                  <View style={styles.outfitItemDetailTextWrap}>
                    <Text style={styles.outfitItemDetailTitle}>{label}</Text>
                    <Text style={styles.detailMeta}>{item?.subParts || item?.bodyPart || 'Unnamed item'}</Text>
                    <Text style={styles.detailMeta}>{item?.bodyPart || 'Unknown body part'}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isEditItemDialogVisible}
        onRequestClose={() => setEditItemDialogVisible(false)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setEditItemDialogVisible(false)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Edit Item</Text>
            <Text style={styles.dialogSubtitle}>
              Update the body part, style, season, size, and age group used in filtering and outfit building.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Body part</Text>
              <View style={styles.typeRowWrap}>
                {DEFAULT_BODY_PART_OPTIONS.map((option) => {
                  const selected = editingItemBodyPart === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setEditingItemBodyPart(option)}
                      style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                      <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Style tags</Text>
              <View style={styles.typeRowWrap}>
                {DEFAULT_STYLE_TAGS.map((tag) => {
                  const selected = editingItemStyleTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleEditingStyleTag(tag)}
                      style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                      <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{tag}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Season</Text>
              <View style={styles.typeRowWrap}>
                {DEFAULT_SEASON_TAGS.map((tag) => {
                  const selected = editingItemSeasonTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleEditingSeasonTag(tag)}
                      style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                      <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{tag}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {DEFAULT_SIZE_OPTIONS.map((option) => {
                    const selected = editingItemSize === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setEditingItemSize(option)}
                        style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                        <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Age group</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  {DEFAULT_AGE_OPTIONS.map((option) => {
                    const selected = editingItemAge === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setEditingItemAge(option)}
                        style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                        <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom size or age</Text>
              <View style={styles.editFieldsRow}>
                <View style={styles.editFieldWrap}>
                  <TextInput
                    onChangeText={setEditingItemSize}
                    placeholder="Size"
                    placeholderTextColor="#B39A88"
                    style={styles.sectionNameInput}
                    value={editingItemSize}
                  />
                </View>
                <View style={styles.editFieldWrap}>
                  <TextInput
                    onChangeText={setEditingItemAge}
                    placeholder="Age"
                    placeholderTextColor="#B39A88"
                    style={styles.sectionNameInput}
                    value={editingItemAge}
                  />
                </View>
              </View>
            </View>

            <View style={styles.dialogActions}>
              <Pressable
                disabled={isUpdatingItem}
                onPress={() => setEditItemDialogVisible(false)}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isUpdatingItem}
                onPress={saveEditedItem}
                style={styles.primaryButton}>
                {isUpdatingItem ? <ActivityIndicator color={LuxuryTheme.textStrong} /> : <Text style={styles.primaryButtonText}>Save item</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isSectionDialogVisible}
        onRequestClose={() => setSectionDialogVisible(false)}>
        <View style={styles.dialogOverlay}>
          <Pressable style={styles.dialogBackdrop} onPress={() => setSectionDialogVisible(false)} />
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>{sectionDialogMode === 'create' ? 'Add Closet Section' : 'Edit Closet Section'}</Text>
            <Text style={styles.dialogSubtitle}>
              Create a custom section and choose one or more clothing types for it.
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Section name</Text>
              <View style={styles.sectionNameWrap}>
                <TextInput
                  onChangeText={setNewSectionName}
                  placeholder="Example: Dresses and Hats"
                  placeholderTextColor="#B39A88"
                  style={styles.sectionNameInput}
                  value={newSectionName}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Included types</Text>
              <View style={styles.typeRowWrap}>
                {capturedTypes.map((type) => {
                  const selected = newSectionTypes.includes(type);
                  return (
                    <Pressable
                      key={type}
                      onPress={() => toggleNewSectionType(type)}
                      style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                      <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{type}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Default logo</Text>
              <View style={styles.typeRowWrap}>
                {DEFAULT_SECTION_ICONS.map((iconName) => {
                  const selected = selectedSectionIcon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => setSelectedSectionIcon(iconName)}
                      style={[styles.iconChip, selected ? styles.typeChipSelected : null]}>
                      <Ionicons
                        color={selected ? LuxuryTheme.accentSoft : LuxuryTheme.textMuted}
                        name={iconName as keyof typeof Ionicons.glyphMap}
                        size={18}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parent section</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.typeRow}>
                  <Pressable
                    onPress={() => setNewSectionParentId(null)}
                    style={[styles.typeChip, newSectionParentId === null ? styles.typeChipSelected : null]}>
                    <Text style={[styles.typeChipText, newSectionParentId === null ? styles.typeChipTextSelected : null]}>
                      Main section
                    </Text>
                  </Pressable>
                  {availableParentSections.map((section) => {
                    const selected = newSectionParentId === section.id;
                    return (
                      <Pressable
                        key={section.id}
                        onPress={() => setNewSectionParentId(section.id)}
                        style={[styles.typeChip, selected ? styles.typeChipSelected : null]}>
                        <Text style={[styles.typeChipText, selected ? styles.typeChipTextSelected : null]}>{section.pathLabel}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.dialogActions}>
              <Pressable
                disabled={isSavingSection}
                onPress={() => setSectionDialogVisible(false)}
                style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              {sectionDialogMode === 'edit' ? (
                <Pressable
                  disabled={isSavingSection}
                  onPress={deleteSection}
                  style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              ) : null}
              <Pressable
                disabled={isSavingSection}
                onPress={saveSection}
                style={styles.primaryButton}>
                {isSavingSection ? <ActivityIndicator color={LuxuryTheme.textStrong} /> : <Text style={styles.primaryButtonText}>Save section</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#C75146',
    borderRadius: 14,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFF7F1',
    fontSize: 13,
    fontWeight: '800',
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
  editItemButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editItemButtonText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
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
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    marginRight: 12,
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
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  dialogBackdrop: {
    flex: 1,
  },
  dialogCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 26,
    marginHorizontal: 18,
    borderWidth: 1,
    padding: 18,
  },
  dialogOverlay: {
    backgroundColor: LuxuryTheme.overlay,
    flex: 1,
    justifyContent: 'center',
  },
  dialogSubtitle: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
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
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailImage: {
    borderRadius: 18,
    height: 260,
    width: '100%',
  },
  detailList: {
    paddingBottom: 24,
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
  dialogTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 22,
    fontWeight: '800',
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
    color: LuxuryTheme.textMuted,
    fontSize: 15,
  },
  editFieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  editFieldWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipTextSelected: {
    color: LuxuryTheme.accentSoft,
  },
  filterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterHeaderMeta: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  filterHeaderTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 22,
    fontWeight: '800',
  },
  filtersRow: {
    paddingRight: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hangerHook: {
    alignSelf: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 999,
    height: 10,
    marginBottom: 8,
    width: 54,
  },
  itemCard: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    padding: 12,
    width: 170,
  },
  itemFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 18,
    height: 150,
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  itemFallbackText: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  itemImage: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 18,
    height: 150,
    marginBottom: 10,
    width: '100%',
  },
  itemMeta: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  itemTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  iconChip: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
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
    color: LuxuryTheme.textMuted,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  outfitItemDetailCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
  },
  outfitItemDetailFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 220,
    justifyContent: 'center',
    width: '100%',
  },
  outfitItemDetailImage: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 220,
    width: '100%',
  },
  outfitItemDetailTextWrap: {
    marginTop: 12,
  },
  outfitItemDetailTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 15,
    fontWeight: '800',
  },
  previewImage: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  previewCheckerCell: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    flex: 1,
  },
  previewCheckerCellDark: {
    backgroundColor: LuxuryTheme.cardAlt,
  },
  previewCheckerRow: {
    flex: 1,
    flexDirection: 'row',
  },
  previewCheckerboard: {
    ...StyleSheet.absoluteFillObject,
  },
  previewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  previewHeaderMeta: {
    color: LuxuryTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  previewHeaderTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  previewNote: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  previewSection: {
    marginTop: 2,
  },
  previewWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    height: 220,
    marginTop: 10,
    overflow: 'hidden',
    padding: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.accent,
    borderRadius: 14,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#120F0D',
    fontSize: 13,
    fontWeight: '800',
  },
  processingText: {
    color: LuxuryTheme.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  savedOutfitCard: {
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    padding: 10,
    width: 180,
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
  savedOutfitGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  savedOutfitGalleryFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    width: 77,
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
  savedOutfitGalleryFallbackText: {
    color: LuxuryTheme.textMuted,
    fontSize: 10,
    fontWeight: '700',
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
  savedOutfitGalleryImage: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 12,
    height: 52,
    width: 77,
  },
  savedOutfitColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    minHeight: 18,
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
  savedOutfitFallback: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 110,
    justifyContent: 'center',
    marginBottom: 10,
  },
  savedOutfitFallbackText: {
    color: LuxuryTheme.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  savedOutfitImage: {
    backgroundColor: LuxuryTheme.placeholder,
    borderRadius: 16,
    height: 110,
    marginBottom: 10,
    width: '100%',
  },
  savedOutfitsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  savedOutfitsRow: {
    paddingRight: 12,
    paddingTop: 10,
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
  savedOutfitTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
    fontWeight: '700',
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
  viewTabsWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6,
  },
  viewTabText: {
    color: LuxuryTheme.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  viewTabTextSelected: {
    color: LuxuryTheme.accentSoft,
  },
  sectionChipIcon: {
    marginRight: 6,
  },
  sectionNameInput: {
    color: LuxuryTheme.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  sectionNameWrap: {
    backgroundColor: LuxuryTheme.cardAlt,
    borderColor: LuxuryTheme.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: LuxuryTheme.surface,
    borderColor: LuxuryTheme.accent,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    height: 46,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: LuxuryTheme.accentSoft,
    fontSize: 13,
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
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: LuxuryTheme.textStrong,
    fontSize: 14,
    fontWeight: '800',
  },
  typeChip: {
    backgroundColor: LuxuryTheme.chip,
    borderColor: LuxuryTheme.border,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeChipSelected: {
    backgroundColor: LuxuryTheme.chipActive,
    borderColor: LuxuryTheme.accent,
  },
  typeChipText: {
    color: LuxuryTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  typeChipTextSelected: {
    color: LuxuryTheme.accentSoft,
  },
  typeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  typeRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
});
