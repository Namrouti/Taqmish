import { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { database } from '@/lib/firebase';

export type WardrobeSource = 'catalog' | 'user' | 'store';

export type WardrobeItem = {
  age?: string;
  bodyPart?: string;
  bodyPartKey?: string;
  closetSectionId?: string;
  closetSectionName?: string;
  closetSectionPath?: string;
  colors?: string[];
  description?: string;
  filePath?: string;
  genderKey?: string;
  id?: string;
  images?: string[];
  mainClass?: string;
  ownerId?: string;
  price?: number;
  sectionId?: string;
  sectionName?: string;
  sectionPath?: string;
  seasonTags?: string[];
  sex?: string;
  size?: string;
  sizeOptions?: string[];
  stock?: number;
  source: WardrobeSource;
  storeId?: string;
  storeName?: string;
  styleTags?: string[];
  subParts?: string;
  subType?: string;
  title?: string;
};

function pickString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function pickStringArray(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }
  return undefined;
}

function normalizeBodyPartKey(bodyPart?: string, subParts?: string) {
  const combined = `${bodyPart ?? ''} ${subParts ?? ''}`.toLowerCase();
  if (combined.includes('top') || combined.includes('علوي')) return 'top';
  if (combined.includes('bottom') || combined.includes('سفلي') || combined.includes('pants')) return 'bottom';
  if (combined.includes('shoe') || combined.includes('حذ')) return 'shoes';
  if (combined.includes('watch') || combined.includes('ساع')) return 'watch';
  if (combined.includes('bag') || combined.includes('شن')) return 'bag';
  if (combined.includes('hat') || combined.includes('cap') || combined.includes('قب')) return 'hat';
  if (combined.includes('access')) return 'accessory';
  return undefined;
}

function normalizeGenderKey(sex?: string) {
  const value = (sex ?? '').trim().toLowerCase();
  if (!value) {
    return undefined;
  }
  if (value.includes('male') || value.includes('men') || value.includes('boy') || value.includes('ذكر')) {
    return 'male';
  }
  if (value.includes('female') || value.includes('women') || value.includes('girl') || value.includes('أنث') || value.includes('انث')) {
    return 'female';
  }
  return undefined;
}

function normalizeStyleTags(record: Record<string, unknown>) {
  const direct = pickStringArray(record, 'styleTags', 'StyleTags', 'tags', 'Tags', 'style', 'Style');
  if (direct?.length) {
    return direct.map((entry) => entry.toLowerCase());
  }

  const category = pickString(record, 'mainClass', 'MainClass', 'category', 'Category');
  if (!category) {
    return [];
  }

  const normalized = category.toLowerCase();
  const tags: string[] = [];
  if (normalized.includes('casual') || normalized.includes('كاجوال')) tags.push('casual');
  if (normalized.includes('formal') || normalized.includes('رسمي')) tags.push('formal');
  if (normalized.includes('evening') || normalized.includes('سهرة')) tags.push('evening');
  if (normalized.includes('sport') || normalized.includes('سبورت')) tags.push('sport');
  return tags;
}

function normalizeSeasonTags(record: Record<string, unknown>) {
  return (pickStringArray(record, 'seasonTags', 'SeasonTags', 'season', 'Season') ?? []).map((entry) => entry.toLowerCase());
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = Number(value.replace(/[^\d.]/g, ''));
      if (Number.isFinite(normalized)) {
        return normalized;
      }
    }
  }
  return undefined;
}

function normalizeWardrobeItem(value: unknown, source: WardrobeSource, fallbackId?: string, ownerId?: string): WardrobeItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const bodyPart = pickString(record, 'bodyPart', 'BodyPart');
  const subParts = pickString(record, 'subParts', 'SubParts', 'subparts', 'type', 'Type');
  const filePath = pickString(record, 'filePath', 'FilePath', 'filepath', 'imageUrl', 'ImageUrl', 'url');
  const mainClass = pickString(record, 'mainClass', 'MainClass', 'category', 'Category');

  if (!filePath && !bodyPart && !subParts && !mainClass) {
    return null;
  }

  const sex = pickString(record, 'sex', 'Sex');
  return {
    age: pickString(record, 'age', 'Age'),
    bodyPart,
    bodyPartKey: normalizeBodyPartKey(bodyPart, subParts),
    closetSectionId: pickString(record, 'closetSectionId', 'ClosetSectionId', 'sectionId', 'SectionId'),
    closetSectionName: pickString(record, 'closetSectionName', 'ClosetSectionName', 'sectionName', 'SectionName'),
    closetSectionPath: pickString(record, 'closetSectionPath', 'ClosetSectionPath', 'sectionPath', 'SectionPath'),
    colors: pickStringArray(record, 'colors', 'Colors'),
    description: pickString(record, 'description', 'Description', 'details', 'Details'),
    filePath,
    genderKey: normalizeGenderKey(sex),
    id: pickString(record, 'id', 'Id', 'ID', 'itemId', 'ItemId') ?? fallbackId,
    images: pickStringArray(record, 'images', 'Images', 'gallery', 'Gallery'),
    mainClass,
    ownerId,
    price: pickNumber(record, 'price', 'Price'),
    sectionId: pickString(record, 'sectionId', 'SectionId'),
    sectionName: pickString(record, 'sectionName', 'SectionName'),
    sectionPath: pickString(record, 'sectionPath', 'SectionPath'),
    seasonTags: normalizeSeasonTags(record),
    sex,
    size: pickString(record, 'size', 'Size'),
    sizeOptions: pickStringArray(record, 'sizeOptions', 'SizeOptions', 'sizes', 'Sizes'),
    stock: pickNumber(record, 'stock', 'Stock'),
    source,
    storeId: pickString(record, 'storeId', 'StoreId'),
    storeName: pickString(record, 'storeName', 'StoreName'),
    styleTags: normalizeStyleTags(record),
    subParts,
    subType: pickString(record, 'subType', 'SubType') ?? subParts,
    title: pickString(record, 'title', 'Title', 'titel', 'Titel') ?? subParts ?? bodyPart,
  };
}

function normalizeLegacyItemRecord(value: unknown, fallbackId?: string, ownerId?: string): WardrobeItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = pickString(record, 'type', 'Type');
  const category = pickString(record, 'category', 'Category');
  const title = pickString(record, 'titel', 'Titel', 'title', 'Title') ?? type ?? category;
  const filePath = pickString(record, 'filePath', 'FilePath', 'filepath', 'imageUrl', 'ImageUrl', 'url');
  if (!filePath && !type && !category) {
    return null;
  }

  return {
    colors: pickStringArray(record, 'colors', 'Colors'),
    description: pickString(record, 'description', 'Description'),
    filePath,
    genderKey: normalizeGenderKey(pickString(record, 'sex', 'Sex')),
    id: pickString(record, 'id', 'Id', 'ID', 'ItemKey') ?? fallbackId,
    images: pickStringArray(record, 'images', 'Images'),
    mainClass: category,
    ownerId,
    price: pickNumber(record, 'price', 'Price'),
    sectionId: pickString(record, 'sectionId', 'SectionId'),
    sectionName: pickString(record, 'sectionName', 'SectionName'),
    sectionPath: pickString(record, 'sectionPath', 'SectionPath'),
    seasonTags: normalizeSeasonTags(record),
    sex: pickString(record, 'sex', 'Sex'),
    source: 'user',
    sizeOptions: pickStringArray(record, 'sizeOptions', 'SizeOptions', 'sizes', 'Sizes'),
    stock: pickNumber(record, 'stock', 'Stock'),
    storeId: pickString(record, 'storeId', 'StoreId'),
    storeName: pickString(record, 'storeName', 'StoreName'),
    styleTags: normalizeStyleTags(record),
    subParts: type,
    subType: type,
    title,
    bodyPartKey: normalizeBodyPartKey(category, type),
    bodyPart: category,
  };
}

function readItemsFromRecord(
  value: unknown,
  source: WardrobeSource,
  userId?: string | null,
  ownerId?: string
) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const root = value as Record<string, unknown>;

  if (userId && root[userId] && typeof root[userId] === 'object') {
    const nested = Object.entries(root[userId] as Record<string, unknown>)
      .map(([key, entry]) => normalizeWardrobeItem(entry, source, key, ownerId))
      .filter((item): item is WardrobeItem => item !== null);
    if (nested.length > 0) {
      return nested;
    }
  }

  const direct = Object.entries(root)
    .map(([key, entry]) => normalizeWardrobeItem(entry, source, key, ownerId))
    .filter((item): item is WardrobeItem => item !== null);
  if (direct.length > 0) {
    return direct;
  }

  return Object.values(root).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    return Object.entries(entry as Record<string, unknown>)
      .map(([key, nested]) => normalizeWardrobeItem(nested, source, key, ownerId))
      .filter((item): item is WardrobeItem => item !== null);
  });
}

function dedupeItems(items: WardrobeItem[]) {
  const byId = new Map<string, WardrobeItem>();
  for (const item of items) {
    const key = item.id ?? `${item.source}-${item.filePath ?? item.title ?? Math.random()}`;
    if (
      !byId.has(key) ||
      byId.get(key)?.source === 'catalog' ||
      (byId.get(key)?.source === 'user' && item.source === 'store')
    ) {
      byId.set(key, item);
    }
  }
  return [...byId.values()];
}

export function useWardrobeItems(userId?: string | null) {
  const [catalogItems, setCatalogItems] = useState<WardrobeItem[]>([]);
  const [legacyItems, setLegacyItems] = useState<WardrobeItem[]>([]);
  const [legacyPersonalItems, setLegacyPersonalItems] = useState<WardrobeItem[]>([]);
  const [storeItems, setStoreItems] = useState<WardrobeItem[]>([]);
  const [userItems, setUserItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setCatalogItems([]);
      setLegacyItems([]);
      setLegacyPersonalItems([]);
      setStoreItems([]);
      setUserItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const catalogRef = ref(database, 'catalogItems');
    const userClosetRef = ref(database, `userClosetItems/${userId}`);
    const legacyClosetRef = ref(database, 'SiteClosets');
    const legacyItemsRef = ref(database, `Item/${userId}`);
    const storesRef = ref(database, 'Stores');
    const storeItemsRef = ref(database, 'StoreItems');

    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 6) {
        setIsLoading(false);
      }
    };

    const unsubCatalog = onValue(catalogRef, (snapshot) => {
      setCatalogItems(snapshot.exists() ? readItemsFromRecord(snapshot.val(), 'catalog') : []);
      markLoaded();
    });

    const unsubUser = onValue(userClosetRef, (snapshot) => {
      setUserItems(snapshot.exists() ? readItemsFromRecord(snapshot.val(), 'user', undefined, userId) : []);
      markLoaded();
    });

    const unsubLegacy = onValue(legacyClosetRef, (snapshot) => {
      setLegacyItems(snapshot.exists() ? readItemsFromRecord(snapshot.val(), 'user', userId, userId) : []);
      markLoaded();
    });

    const unsubLegacyItems = onValue(legacyItemsRef, (snapshot) => {
      const nextItems = snapshot.exists()
        ? Object.entries(snapshot.val() as Record<string, unknown>)
            .map(([key, value]) => normalizeLegacyItemRecord(value, key, userId))
            .filter((item): item is WardrobeItem => item !== null)
        : [];
      setLegacyPersonalItems(nextItems);
      markLoaded();
    });

    const unsubStoreItems = onValue(storeItemsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setStoreItems([]);
        markLoaded();
        return;
      }

      const root = snapshot.val() as Record<string, unknown>;
      const normalized = Object.entries(root).flatMap(([storeId, value]) =>
        readItemsFromRecord(value, 'store', undefined, storeId).map((item) => ({
          ...item,
          ownerId: item.ownerId ?? storeId,
          storeId: item.storeId ?? storeId,
        }))
      );
      setStoreItems(normalized);
      markLoaded();
    });

    const unsubStores = onValue(storesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setStoreItems((current) => current.map((item) => ({ ...item, storeName: item.storeName ?? 'Store' })));
        markLoaded();
        return;
      }

      const storesRecord = snapshot.val() as Record<string, Record<string, unknown>>;
      setStoreItems((current) =>
        current.map((item) => {
          const storeProfile = item.storeId ? storesRecord[item.storeId] : undefined;
          const storeName =
            item.storeName ??
            (storeProfile ? pickString(storeProfile, 'storeName', 'name', 'Name', 'title', 'Title') : undefined);
          return {
            ...item,
            storeName,
          };
        })
      );
      markLoaded();
    });

    return () => {
      unsubCatalog();
      unsubUser();
      unsubLegacy();
      unsubLegacyItems();
      unsubStoreItems();
      unsubStores();
    };
  }, [userId]);

  const items = useMemo(() => {
    const merged = dedupeItems([...catalogItems, ...storeItems, ...userItems, ...legacyPersonalItems, ...legacyItems]);
    return merged.sort((left, right) => {
      if (left.source !== right.source) {
        const order: Record<WardrobeSource, number> = { catalog: 0, store: 1, user: 2 };
        return order[left.source] - order[right.source];
      }
      return (left.title ?? '').localeCompare(right.title ?? '');
    });
  }, [catalogItems, legacyItems, legacyPersonalItems, storeItems, userId, userItems]);

  return {
    catalogItems: items.filter((item) => item.source === 'catalog'),
    isLoading,
    items,
    storeItems: items.filter((item) => item.source === 'store'),
    userItems: items.filter((item) => item.source === 'user'),
  };
}
