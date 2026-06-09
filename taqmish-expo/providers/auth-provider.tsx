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

export type UserProfile = {
  age?: string;
  bodyShape?: string;
  country?: string;
  email?: string;
  firstName?: string;
  fullName?: string;
  gender?: string;
  height?: string;
  lastName?: string;
  password?: string;
  profileComplete?: boolean;
  profileImageUrl?: string;
  weight?: string;
};

type SaveProfileInput = {
  age: string;
  bodyShape: string;
  country: string;
  firstName: string;
  gender: string;
  height: string;
  lastName: string;
  weight: string;
};

type AuthContextValue = {
  authUser: FirebaseUser | null;
  isLoading: boolean;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<UserProfile | null>;
  refreshProfile: (uid?: string) => Promise<UserProfile | null>;
  resetPassword: (email: string) => Promise<void>;
  saveProfile: (input: SaveProfileInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readProfile(uid: string) {
  const snapshot = await get(ref(database, `Users/${uid}`));
  return snapshot.exists() ? (snapshot.val() as UserProfile) : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextProfile = await readProfile(user.uid);
        setProfile(nextProfile);
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
      profile,
      async login(email, password) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        setAuthUser(result.user);
        const nextProfile = await readProfile(result.user.uid);
        setProfile(nextProfile);
        return nextProfile;
      },
      async logout() {
        await signOut(auth);
        setAuthUser(null);
        setProfile(null);
      },
      async register(email, password) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        setAuthUser(result.user);
        setProfile(null);
        return null;
      },
      async refreshProfile(uid) {
        const targetUid = uid ?? auth.currentUser?.uid;
        if (!targetUid) {
          setProfile(null);
          return null;
        }

        const nextProfile = await readProfile(targetUid);
        setProfile(nextProfile);
        return nextProfile;
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email);
      },
      async saveProfile(input) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user.');
        }

        const nextProfile: UserProfile = {
          age: input.age,
          bodyShape: input.bodyShape,
          country: input.country,
          email: currentUser.email ?? '',
          firstName: input.firstName,
          fullName: `${input.firstName} ${input.lastName}`.trim(),
          gender: input.gender,
          height: input.height,
          lastName: input.lastName,
          password: '',
          profileComplete: true,
          profileImageUrl: profile?.profileImageUrl ?? '',
          weight: input.weight,
        };

        await set(ref(database, `Users/${currentUser.uid}`), nextProfile);
        setProfile(nextProfile);
      },
    }),
    [authUser, isLoading, profile]
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
