import { useEffect, useState } from 'react';
import { onValue, ref, set, update } from 'firebase/database';

import { database } from '@/lib/firebase';
import type { StoreProfile } from '@/types/store';

export function useStoreProfile(ownerId?: string | null) {
  const [profile, setProfileState] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(ownerId));

  useEffect(() => {
    if (!ownerId) {
      setProfileState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const profileRef = ref(database, `Stores/${ownerId}`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      setProfileState(snapshot.exists() ? (snapshot.val() as StoreProfile) : null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [ownerId]);

  const saveProfile = async (nextProfile: StoreProfile) => {
    await set(ref(database, `Stores/${nextProfile.ownerId}`), nextProfile);
  };

  const patchProfile = async (ownerKey: string, updates: Partial<StoreProfile>) => {
    await update(ref(database, `Stores/${ownerKey}`), updates);
  };

  return {
    isLoading,
    patchProfile,
    profile,
    saveProfile,
  };
}
