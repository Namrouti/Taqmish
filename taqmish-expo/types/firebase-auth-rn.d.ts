declare module '@firebase/auth/dist/rn/index.js' {
  export * from '@firebase/auth';
  import type { Persistence } from '@firebase/auth';

  export function getReactNativePersistence(storage: unknown): Persistence;
}
