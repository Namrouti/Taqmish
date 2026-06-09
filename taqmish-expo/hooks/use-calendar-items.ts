import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { database } from '@/lib/firebase';

export type CalendarItem = {
  date?: string;
  day?: string;
  itemID?: string;
  month?: string;
  outfitID?: string;
  time?: string;
  title?: string;
  year?: string;
};

function normalizeCalendarItem(value: unknown, fallbackId?: string): CalendarItem | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as CalendarItem;
  return {
    ...record,
    itemID: record.itemID ?? fallbackId,
  };
}

function parseItemDate(item: CalendarItem) {
  const dateString = item.date ?? '';
  const [day, month, year] = dateString.split('-').map(Number);
  if (day && month && year) {
    return new Date(year, month - 1, day).getTime();
  }

  const fallbackYear = Number(item.year ?? 0);
  const fallbackMonth = Number(item.month ?? 0);
  const fallbackDay = Number(item.day ?? 0);
  if (fallbackYear && fallbackMonth && fallbackDay) {
    return new Date(fallbackYear, fallbackMonth - 1, fallbackDay).getTime();
  }

  return 0;
}

function getTimeOrder(item: CalendarItem) {
  switch (item.time) {
    case 'Morning':
      return 0;
    case 'Evening':
      return 1;
    case 'Night':
      return 2;
    default:
      return 99;
  }
}

export function useCalendarItems(userId?: string | null) {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const calendarRef = ref(database, `CalendarItem/${userId}`);
    const unsubscribe = onValue(calendarRef, (snapshot) => {
      const nextItems = snapshot.exists()
        ? Object.entries(snapshot.val() as Record<string, unknown>)
            .map(([key, value]) => normalizeCalendarItem(value, key))
            .filter((item): item is CalendarItem => item !== null)
        : [];

      nextItems.sort((left, right) => {
        const dateDiff = parseItemDate(right) - parseItemDate(left);
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return getTimeOrder(left) - getTimeOrder(right);
      });

      setItems(nextItems);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { isLoading, items };
}
