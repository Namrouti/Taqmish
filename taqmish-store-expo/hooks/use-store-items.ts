import { useEffect, useMemo, useState } from 'react';
import { onValue, ref, set, update } from 'firebase/database';

import { database } from '@/lib/firebase';
import type { StoreItem } from '@/types/store';

function normalizeStoreItem(value: unknown, fallbackId: string, storeId: string): StoreItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const title = typeof record.title === 'string' ? record.title : typeof record.Title === 'string' ? record.Title : 'Untitled product';
  const filePath = typeof record.filePath === 'string'
    ? record.filePath
    : typeof record.FilePath === 'string'
      ? record.FilePath
      : undefined;
  const images = Array.isArray(record.images)
    ? record.images.filter((entry): entry is string => typeof entry === 'string')
    : filePath
      ? [filePath]
      : [];

  return {
    bodyPart: typeof record.bodyPart === 'string' ? record.bodyPart : undefined,
    bodyPartKey: typeof record.bodyPartKey === 'string' ? record.bodyPartKey : undefined,
    colors: Array.isArray(record.colors)
      ? record.colors.filter((entry): entry is string => typeof entry === 'string')
      : [],
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
    currency: typeof record.currency === 'string' ? record.currency : 'ILS',
    description: typeof record.description === 'string' ? record.description : undefined,
    filePath: filePath ?? images[0],
    genderKey: typeof record.genderKey === 'string' ? record.genderKey : undefined,
    id: typeof record.id === 'string' ? record.id : fallbackId,
    images,
    ownerId: typeof record.ownerId === 'string' ? record.ownerId : storeId,
    price:
      typeof record.price === 'number'
        ? record.price
        : typeof record.price === 'string'
          ? Number(record.price)
          : undefined,
    source: 'store',
    seasonTags: Array.isArray(record.seasonTags)
      ? record.seasonTags.filter((entry): entry is string => typeof entry === 'string')
      : [],
    sectionId: typeof record.sectionId === 'string' ? record.sectionId : undefined,
    sectionName: typeof record.sectionName === 'string' ? record.sectionName : undefined,
    sectionPath: typeof record.sectionPath === 'string' ? record.sectionPath : undefined,
    sizeOptions: Array.isArray(record.sizeOptions)
      ? record.sizeOptions.filter((entry): entry is string => typeof entry === 'string')
      : typeof record.sizes === 'string'
        ? record.sizes.split(',').map((entry) => entry.trim()).filter(Boolean)
        : [],
    sku: typeof record.sku === 'string' ? record.sku : undefined,
    status:
      record.status === 'draft' || record.status === 'published'
        ? record.status
        : 'published',
    stock:
      typeof record.stock === 'number'
        ? record.stock
        : typeof record.stock === 'string'
          ? Number(record.stock)
          : undefined,
    storeId,
    storeName: typeof record.storeName === 'string' ? record.storeName : undefined,
    styleTags: Array.isArray(record.styleTags)
      ? record.styleTags.filter((entry): entry is string => typeof entry === 'string')
      : [],
    subParts: typeof record.subParts === 'string' ? record.subParts : undefined,
    subType: typeof record.subType === 'string' ? record.subType : undefined,
    title,
  };
}

export function useStoreItems(storeId?: string | null) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(storeId));

  useEffect(() => {
    if (!storeId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const itemsRef = ref(database, `StoreItems/${storeId}`);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const nextItems = snapshot.exists()
        ? Object.entries(snapshot.val() as Record<string, unknown>)
            .map(([key, value]) => normalizeStoreItem(value, key, storeId))
            .filter((item): item is StoreItem => item !== null)
        : [];
      setItems(nextItems);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [storeId]);

  const saveItem = async (item: StoreItem) => {
    await set(ref(database, `StoreItems/${item.storeId}/${item.id}`), item);
  };

  const patchItem = async (ownerId: string, itemId: string, updates: Partial<StoreItem>) => {
    await update(ref(database, `StoreItems/${ownerId}/${itemId}`), updates);
  };

  const publishedCount = useMemo(
    () => items.filter((item) => item.status !== 'draft').length,
    [items]
  );

  const inventoryCount = useMemo(
    () => items.reduce((total, item) => total + (item.stock ?? 0), 0),
    [items]
  );

  const lowStockCount = useMemo(
    () => items.filter((item) => (item.stock ?? 0) > 0 && (item.stock ?? 0) <= 3).length,
    [items]
  );

  return {
    inventoryCount,
    isLoading,
    items,
    lowStockCount,
    patchItem,
    publishedCount,
    saveItem,
  };
}
