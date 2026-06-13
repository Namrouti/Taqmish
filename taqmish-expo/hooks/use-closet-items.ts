import { useEffect, useState } from 'react';
import { get, onValue, ref, set } from 'firebase/database';

import { database } from '@/lib/firebase';

export type ClosetItem = {
  age?: string;
  bodyPart?: string;
  bodyPartKey?: string;
  closetSectionId?: string;
  closetSectionName?: string;
  closetSectionPath?: string;
  colors?: string[];
  filePath?: string;
  genderKey?: string;
  id?: string;
  mainClass?: string;
  ownerId?: string;
  seasonTags?: string[];
  sex?: string;
  size?: string;
  source?: string;
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
      return value.filter((entry): entry is string => typeof entry === 'string');
    }
  }
  return undefined;
}

function normalizeClosetItem(value: unknown, fallbackId?: string): ClosetItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const normalized: ClosetItem = {
    age: pickString(record, 'age', 'Age'),
    bodyPart: pickString(record, 'bodyPart', 'BodyPart'),
    bodyPartKey: pickString(record, 'bodyPartKey', 'BodyPartKey'),
    closetSectionId: pickString(record, 'closetSectionId', 'ClosetSectionId', 'sectionId', 'SectionId'),
    closetSectionName: pickString(record, 'closetSectionName', 'ClosetSectionName', 'sectionName', 'SectionName'),
    closetSectionPath: pickString(record, 'closetSectionPath', 'ClosetSectionPath', 'sectionPath', 'SectionPath'),
    colors: pickStringArray(record, 'colors', 'Colors'),
    filePath: pickString(record, 'filePath', 'FilePath', 'filepath', 'imageUrl', 'ImageUrl', 'url'),
    genderKey: pickString(record, 'genderKey', 'GenderKey'),
    id: pickString(record, 'id', 'Id', 'ID') ?? fallbackId,
    mainClass: pickString(record, 'mainClass', 'MainClass'),
    ownerId: pickString(record, 'ownerId', 'OwnerId'),
    seasonTags: pickStringArray(record, 'seasonTags', 'SeasonTags'),
    sex: pickString(record, 'sex', 'Sex'),
    size: pickString(record, 'size', 'Size'),
    source: pickString(record, 'source', 'Source'),
    styleTags: pickStringArray(record, 'styleTags', 'StyleTags', 'tags', 'Tags'),
    subParts: pickString(record, 'subParts', 'SubParts', 'subparts'),
    subType: pickString(record, 'subType', 'SubType'),
    title: pickString(record, 'title', 'Title', 'titel', 'Titel'),
  };

  if (!normalized.filePath && !normalized.bodyPart && !normalized.subParts && !normalized.mainClass) {
    return null;
  }

  return normalized;
}

function looksLikeClosetItem(value: unknown): value is ClosetItem {
  return normalizeClosetItem(value) !== null;
}

function normalizeSnapshotItems(value: unknown, userId?: string | null) {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const root = value as Record<string, unknown>;

  if (userId && root[userId] && typeof root[userId] === 'object') {
    const nested = Object.entries(root[userId] as Record<string, unknown>)
      .map(([key, entry]) => normalizeClosetItem(entry, key))
      .filter((item): item is ClosetItem => item !== null);
    if (nested.length > 0) {
      return nested;
    }
  }

  const directItems = Object.entries(root)
    .map(([key, entry]) => normalizeClosetItem(entry, key))
    .filter((item): item is ClosetItem => item !== null);
  if (directItems.length > 0) {
    return directItems;
  }

  const flattened = Object.values(root).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    return Object.entries(entry as Record<string, unknown>)
      .map(([key, nestedEntry]) => normalizeClosetItem(nestedEntry, key))
      .filter((item): item is ClosetItem => item !== null);
  });

  return flattened;
}

export function useClosetItems(userId?: string | null) {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const closetRef = ref(database, `SiteClosets/${userId}`);

    let unsubscribe: () => void;

    get(closetRef).then((snapshot) => {
      if (!snapshot.exists()) {
        return set(closetRef, { _initialized: true });
      }
    }).finally(() => {
      unsubscribe = onValue(closetRef, (snapshot) => {
        const nextItems = snapshot.exists() ? normalizeSnapshotItems(snapshot.val(), userId) : [];
        setItems(nextItems);
        setIsLoading(false);
      });
    });

    return () => unsubscribe?.();
  }, [userId]);

  return { isLoading, items };
}
