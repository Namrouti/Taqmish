import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { database } from '@/lib/firebase';
import type { ClosetItem } from '@/hooks/use-closet-items';

export type OutfitRecord = {
  accessories?: ClosetItem | null;
  bag?: ClosetItem | null;
  color?: string;
  down?: ClosetItem | null;
  hat?: ClosetItem | null;
  id?: string;
  shoes?: ClosetItem | null;
  top?: ClosetItem | null;
  watch?: ClosetItem | null;
};

function normalizeOutfit(value: unknown, fallbackId?: string): OutfitRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as OutfitRecord;
  return {
    ...record,
    id: record.id ?? fallbackId,
  };
}

export function useOutfits(userId?: string | null) {
  const [items, setItems] = useState<OutfitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const outfitRef = ref(database, `OutfitClass/${userId}`);
    const unsubscribe = onValue(outfitRef, (snapshot) => {
      const nextItems = snapshot.exists()
        ? Object.entries(snapshot.val() as Record<string, unknown>)
            .map(([key, value]) => normalizeOutfit(value, key))
            .filter((item): item is OutfitRecord => item !== null)
        : [];
      setItems(nextItems);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { isLoading, items };
}
