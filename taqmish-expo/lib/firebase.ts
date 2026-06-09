import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from '@firebase/auth';
import type { Auth } from '@firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const projectId = 'tuqmish';
const appName = 'tuqmish-expo';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyBACPAK4CWQ9lWLUm4nQgm72LmfIgBNc4c',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
    `https://${projectId}-default-rtdb.firebaseio.com`,
  projectId,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'tuqmish.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '860137769763',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ??
    '1:860137769763:web:9fe7640822e5808f4c9a96',
};

const app =
  getApps().find((existingApp) => existingApp.name === appName || existingApp.options.projectId === projectId) ??
  initializeApp(firebaseConfig, appName);
const appStorage = createAsyncStorage(`app-${projectId}`);

let auth: Auth;
const { getAuth, initializeAuth } = FirebaseAuth;
const getReactNativePersistence = (FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence?: (storage: ReturnType<typeof createAsyncStorage>) => unknown;
}).getReactNativePersistence;

try {
  if (getReactNativePersistence) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(appStorage) as never,
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  auth = getAuth(app);
}

const database = getDatabase(app);
const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);

export { app, auth, database, storage };
