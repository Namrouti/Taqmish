import jpeg from 'jpeg-js';
import type { ClosetItem } from '@/hooks/use-closet-items';
import type { ClosetSectionRecord } from '@/hooks/use-closet-sections';
import type { OutfitRecord } from '@/hooks/use-outfits';
import type { WardrobeItem } from '@/hooks/use-wardrobe-items';
import type { CapturedType, DisplaySection, OutfitSourceFilter } from '@/types/closet';

export const capturedTypes: CapturedType[] = ['Top', 'Bottom', 'Shoes', 'Accessories', 'Bag'];
export const ALL_SECTIONS_ID = 'all-sections';
export const DEFAULT_SECTION_ICONS = [
  'shirt-outline',
  'briefcase-outline',
  'sparkles-outline',
  'footsteps-outline',
  'pricetag-outline',
];
export const DEFAULT_STYLE_TAGS = [
  'casual',
  'formal',
  'evening',
  'sport',
  'classic',
  'streetwear',
  'modest',
  'business',
];
export const DEFAULT_SEASON_TAGS = ['spring', 'summer', 'autumn', 'winter'];
export const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
export const DEFAULT_AGE_OPTIONS = ['kids', 'teen', 'adult'];
export const DEFAULT_BODY_PART_OPTIONS = ['الجزء العلوي', 'الجزء السفلي', 'أحذية', 'اكسسوارات'];

type BaseSection = {
  iconKey?: string;
  id: string;
  name: string;
  parentSectionId?: string;
  parentSectionName?: string;
  types: CapturedType[];
};

export function rgbToHex(red: number, green: number, blue: number) {
  return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue
    .toString(16)
    .padStart(2, '0')}`.toUpperCase();
}

function quantizeColor(value: number, step = 32) {
  return Math.min(255, Math.round(value / step) * step);
}

export async function extractImagePalette(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  // jpeg-js only decodes JPEG (SOI marker = 0xFF 0xD8). Other formats (PNG, HEIC, WebP) will throw.
  let decoded: ReturnType<typeof jpeg.decode>;
  try {
    decoded = jpeg.decode(bytes, { useTArray: true });
  } catch {
    return [];
  }
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
      if (max < 20) continue;
      if (max > 245 && max - min < 10) continue;

      const key = rgbToHex(quantizeColor(red), quantizeColor(green), quantizeColor(blue));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([color]) => color)
    .slice(0, 8);
}

export function classifyItemType(width?: number, height?: number): CapturedType {
  if (!width || !height) return 'Accessories';
  const ratio = width / Math.max(1, height);
  if (ratio > 1.2) return 'Top';
  if (ratio < 0.8) return 'Bottom';
  if (ratio > 0.9 && ratio < 1.1) return 'Shoes';
  return 'Accessories';
}

export function buildAutoCropRect(type: CapturedType, width: number, height: number) {
  const sourceWidth = Math.max(1, Math.floor(width));
  const sourceHeight = Math.max(1, Math.floor(height));

  if (type === 'Top') {
    const cropWidth = Math.floor(sourceWidth * 0.82);
    const cropHeight = Math.floor(sourceHeight * 0.72);
    return {
      height: cropHeight,
      originX: Math.floor((sourceWidth - cropWidth) / 2),
      originY: Math.floor(sourceHeight * 0.08),
      width: cropWidth,
    };
  }
  if (type === 'Bottom') {
    const cropWidth = Math.floor(sourceWidth * 0.82);
    const cropHeight = Math.floor(sourceHeight * 0.76);
    return {
      height: cropHeight,
      originX: Math.floor((sourceWidth - cropWidth) / 2),
      originY: Math.floor(sourceHeight * 0.18),
      width: cropWidth,
    };
  }
  if (type === 'Shoes') {
    const cropWidth = Math.floor(sourceWidth * 0.88);
    const cropHeight = Math.floor(sourceHeight * 0.58);
    return {
      height: cropHeight,
      originX: Math.floor((sourceWidth - cropWidth) / 2),
      originY: Math.floor(sourceHeight * 0.26),
      width: cropWidth,
    };
  }
  const cropWidth = Math.floor(sourceWidth * 0.84);
  const cropHeight = Math.floor(sourceHeight * 0.74);
  return {
    height: cropHeight,
    originX: Math.floor((sourceWidth - cropWidth) / 2),
    originY: Math.floor((sourceHeight - cropHeight) / 2),
    width: cropWidth,
  };
}

export function getBodyPartForType(type: CapturedType) {
  if (type === 'Top') return 'الجزء العلوي';
  if (type === 'Bottom') return 'الجزء السفلي';
  if (type === 'Shoes') return 'أحذية';
  return 'اكسسوارات';
}

export function getPlaceholderColors(type: CapturedType) {
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

export function resolveImageUri(uri?: string | null) {
  if (!uri) return undefined;
  if (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('data:')
  ) {
    return uri;
  }
  return `file://${uri.replace(/\\/g, '/')}`;
}

export function normalizeCapturedType(value?: string | null): CapturedType | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized.includes('top')) return 'Top';
  if (normalized.includes('bottom')) return 'Bottom';
  if (normalized.includes('shoe')) return 'Shoes';
  if (normalized.includes('bag')) return 'Bag';
  if (normalized.includes('access')) return 'Accessories';
  return null;
}

export function buildStorageBucketCandidates(
  projectId?: string | null,
  configuredBucket?: string | null
) {
  const candidates = [
    configuredBucket,
    projectId ? `${projectId}.appspot.com` : null,
  ].filter((value): value is string => Boolean(value?.trim()));
  return Array.from(new Set(candidates));
}

function normalizeBaseSection(record: ClosetSectionRecord, index: number): BaseSection | null {
  const name = record.name?.trim();
  if (!name) return null;
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

export function buildDisplaySections(records: ClosetSectionRecord[]): DisplaySection[] {
  const baseSections = records
    .map(normalizeBaseSection)
    .filter((entry): entry is BaseSection => entry !== null);

  const byId = new Map(baseSections.map((section) => [section.id, section]));
  const byParent = new Map<string, BaseSection[]>();

  for (const section of baseSections) {
    const parentId =
      section.parentSectionId && byId.has(section.parentSectionId)
        ? section.parentSectionId
        : '';
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
      output.push({ ...section, level, pathLabel });
      visit(section.id, level + 1, pathLabel);
    }
  };

  visit('', 0);
  return output;
}

function itemTypeForSection(item: ClosetItem): CapturedType | null {
  return normalizeCapturedType(item.subParts);
}

export function buildSectionIdsMap(sections: DisplaySection[]) {
  const childrenByParent = new Map<string, string[]>();
  for (const section of sections) {
    const parentId = section.parentSectionId ?? '';
    const list = childrenByParent.get(parentId) ?? [];
    list.push(section.id);
    childrenByParent.set(parentId, list);
  }

  const descendantsById = new Map<string, Set<string>>();

  const collect = (sectionId: string): Set<string> => {
    if (descendantsById.has(sectionId)) return descendantsById.get(sectionId)!;
    const collected = new Set<string>([sectionId]);
    for (const childId of childrenByParent.get(sectionId) ?? []) {
      for (const value of collect(childId)) collected.add(value);
    }
    descendantsById.set(sectionId, collected);
    return collected;
  };

  for (const section of sections) collect(section.id);
  return descendantsById;
}

export function matchesSection(
  item: ClosetItem,
  sectionIds: Set<string>,
  fallbackTypes: CapturedType[]
) {
  if (item.closetSectionId && sectionIds.has(item.closetSectionId)) return true;
  if (item.closetSectionPath) {
    const pathParts = item.closetSectionPath
      .split('/')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (item.closetSectionName && pathParts.includes(item.closetSectionName.trim())) return true;
  }
  if (item.closetSectionName && fallbackTypes.length === 0) return true;
  if (!fallbackTypes.length) return false;
  const itemType = itemTypeForSection(item);
  return itemType ? fallbackTypes.includes(itemType) : false;
}

export function resolveDisplaySectionForItem(
  item: ClosetItem,
  sections: DisplaySection[]
): DisplaySection | null {
  if (item.closetSectionId) {
    const exact = sections.find((section) => section.id === item.closetSectionId);
    if (exact) return exact;
  }
  const normalizedPath = (item.closetSectionPath ?? '')
    .split('/')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(' / ');
  if (normalizedPath) {
    const byPath = sections.find((section) => section.pathLabel === normalizedPath);
    if (byPath) return byPath;
  }
  const normalizedName = item.closetSectionName?.trim().toLowerCase();
  if (normalizedName) {
    const byName = sections.find(
      (section) => section.name.trim().toLowerCase() === normalizedName
    );
    if (byName) return byName;
  }
  return null;
}

export function toLegacyClosetItem(item: WardrobeItem): ClosetItem {
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
  if (!value) return false;
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(value.trim());
}

export function getOutfitColors(outfit: OutfitRecord) {
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
  return Array.from(new Set([...(fromSummary as string[]), ...(fromItems as string[])])).slice(
    0,
    8
  );
}

export function getOutfitItems(outfit: OutfitRecord) {
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

export function getOutfitSourceFilter(outfit: OutfitRecord): OutfitSourceFilter {
  const sources = Array.from(
    new Set(
      getOutfitItems(outfit)
        .map(({ item }) => item?.source?.trim().toLowerCase())
        .filter((source): source is string => Boolean(source))
    )
  );
  if (!sources.length) return 'Store';
  if (sources.every((source) => source === 'user')) return 'My Closet';
  if (sources.every((source) => source === 'store')) return 'Store';
  return 'Mixed';
}
