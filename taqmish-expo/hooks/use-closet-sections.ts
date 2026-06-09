import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { database } from '@/lib/firebase';

export type ClosetSectionRecord = {
  iconKey?: string;
  id?: string;
  name?: string;
  parentSectionId?: string;
  parentSectionName?: string;
  types?: string[];
};

function normalizeSection(value: unknown): ClosetSectionRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const iconKey =
    typeof record.iconKey === 'string'
      ? record.iconKey
      : typeof record.IconKey === 'string'
        ? record.IconKey
        : undefined;
  const id = typeof record.id === 'string' ? record.id : undefined;
  const name = typeof record.name === 'string' ? record.name : undefined;
  const parentSectionId =
    typeof record.parentSectionId === 'string'
      ? record.parentSectionId
      : typeof record.ParentSectionId === 'string'
        ? record.ParentSectionId
        : undefined;
  const parentSectionName =
    typeof record.parentSectionName === 'string'
      ? record.parentSectionName
      : typeof record.ParentSectionName === 'string'
        ? record.ParentSectionName
        : undefined;
  const types = Array.isArray(record.types)
    ? record.types.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : undefined;

  if (!id && !name) {
    return null;
  }

  return { iconKey, id, name, parentSectionId, parentSectionName, types };
}

export function useClosetSections(userId?: string | null) {
  const [items, setItems] = useState<ClosetSectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const sectionsRef = ref(database, `ClosetSections/${userId}`);
    const unsubscribe = onValue(sectionsRef, (snapshot) => {
      const nextItems = snapshot.exists()
        ? Object.values(snapshot.val())
            .map(normalizeSection)
            .filter((item): item is ClosetSectionRecord => item !== null)
        : [];
      setItems(nextItems);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { isLoading, items };
}
