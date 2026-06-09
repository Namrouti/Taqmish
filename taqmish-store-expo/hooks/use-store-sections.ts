import { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref, set } from 'firebase/database';

import { database } from '@/lib/firebase';
import type { StoreSection } from '@/types/store';

function normalizeStoreSection(value: unknown, fallbackId: string, ownerId: string): StoreSection | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === 'string'
      ? record.name.trim()
      : typeof record.Name === 'string'
        ? record.Name.trim()
        : '';

  if (!name) {
    return null;
  }

  return {
    iconKey: typeof record.iconKey === 'string' ? record.iconKey : undefined,
    id: typeof record.id === 'string' ? record.id : fallbackId,
    name,
    ownerId,
    parentSectionId:
      typeof record.parentSectionId === 'string'
        ? record.parentSectionId
        : record.parentSectionId === null
          ? null
          : undefined,
    parentSectionName:
      typeof record.parentSectionName === 'string'
        ? record.parentSectionName
        : record.parentSectionName === null
          ? null
          : undefined,
    pathLabel: typeof record.pathLabel === 'string' ? record.pathLabel : name,
    types: Array.isArray(record.types)
      ? record.types.filter((entry): entry is string => typeof entry === 'string')
      : [],
  };
}

export function useStoreSections(ownerId?: string | null) {
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(ownerId));

  useEffect(() => {
    if (!ownerId) {
      setSections([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const sectionsRef = ref(database, `StoreSections/${ownerId}`);
    const unsubscribe = onValue(sectionsRef, (snapshot) => {
      const nextSections = snapshot.exists()
        ? Object.entries(snapshot.val() as Record<string, unknown>)
            .map(([key, value]) => normalizeStoreSection(value, key, ownerId))
            .filter((section): section is StoreSection => section !== null)
        : [];
      setSections(nextSections);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [ownerId]);

  const createSection = async (input: Omit<StoreSection, 'id'>) => {
    const sectionRef = push(ref(database, `StoreSections/${input.ownerId}`));
    const id = sectionRef.key;
    if (!id) {
      throw new Error('Unable to create section id.');
    }

    await set(sectionRef, {
      ...input,
      id,
      pathLabel: input.pathLabel ?? input.name,
    });
  };

  const rootSections = useMemo(
    () => sections.filter((section) => !section.parentSectionId),
    [sections]
  );

  return {
    createSection,
    isLoading,
    rootSections,
    sections,
  };
}
