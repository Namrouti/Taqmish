import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { database } from '@/lib/firebase';

export type ClosetSourceItem = {
  AddDate?: string;
  category?: string;
  colors?: string[];
  filePath?: string;
  id?: string;
  imageId?: string;
  imageName?: string;
  ItemKey?: string;
  season?: string;
  sex?: string;
  status?: string;
  titel?: string;
  type?: string;
};

export function useItems(userId?: string | null) {
  const [items, setItems] = useState<ClosetSourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const itemsRef = ref(database, `Item/${userId}`);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const nextItems = snapshot.exists()
        ? (Object.values(snapshot.val()) as ClosetSourceItem[])
        : [];

      setItems(nextItems);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { isLoading, items };
}
