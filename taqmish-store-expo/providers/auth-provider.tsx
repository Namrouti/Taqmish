import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from '@firebase/auth';
import { get, ref, set } from 'firebase/database';

import { auth, database } from '@/lib/firebase';
import type { StoreProfile } from '@/types/store';

type AuthContextValue = {
  authUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStore: (input: RegisterStoreInput) => Promise<void>;
  refreshStoreProfile: (uid?: string) => Promise<StoreProfile | null>;
  resetPassword: (email: string) => Promise<void>;
  storeProfile: StoreProfile | null;
};

type RegisterStoreInput = {
  email: string;
  ownerName: string;
  password: string;
  phone?: string;
  storeName: string;
  storeType: 'clothing' | 'shoes' | 'accessories' | 'mixed';
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readStoreProfile(uid: string) {
  const snapshot = await get(ref(database, `Stores/${uid}`));
  return snapshot.exists() ? (snapshot.val() as StoreProfile) : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      if (!user) {
        setStoreProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextProfile = await readStoreProfile(user.uid);
        setStoreProfile(nextProfile);
      } catch (error) {
        console.warn('Failed to load store profile during auth restore.', error);
        setStoreProfile(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      isLoading,
      async login(email, password) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        setAuthUser(result.user);
        try {
          const nextProfile = await readStoreProfile(result.user.uid);
          setStoreProfile(nextProfile);
        } catch (error) {
          console.warn('Failed to load store profile after login.', error);
          setStoreProfile(null);
        }
      },
      async logout() {
        await signOut(auth);
        setAuthUser(null);
        setStoreProfile(null);
      },
      async registerStore(input) {
        const result = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
        const uid = result.user.uid;

        const nextStoreProfile: StoreProfile = {
          description: '',
          logoUrl: '',
          ownerEmail: result.user.email ?? input.email.trim(),
          ownerId: uid,
          phone: input.phone?.trim() ?? '',
          status: 'draft',
          storeName: input.storeName.trim(),
          storeType: input.storeType,
        };

        await Promise.all([
          set(ref(database, `Stores/${uid}`), nextStoreProfile),
          set(ref(database, `Users/${uid}`), {
            email: result.user.email ?? input.email.trim(),
            firstName: input.ownerName.trim(),
            fullName: input.ownerName.trim(),
            profileComplete: true,
            role: 'store_owner',
            storeId: uid,
            userType: 'store_owner',
          }),
        ]);

        setAuthUser(result.user);
        setStoreProfile(nextStoreProfile);
      },
      async refreshStoreProfile(uid) {
        const targetUid = uid ?? auth.currentUser?.uid;
        if (!targetUid) {
          setStoreProfile(null);
          return null;
        }

        try {
          const nextProfile = await readStoreProfile(targetUid);
          setStoreProfile(nextProfile);
          return nextProfile;
        } catch (error) {
          console.warn('Failed to refresh store profile.', error);
          setStoreProfile(null);
          return null;
        }
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email);
      },
      storeProfile,
    }),
    [authUser, isLoading, storeProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
