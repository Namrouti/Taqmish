# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Taqmish** (TUQ MISH) is a React Native / Expo outfit-coordinator app. This directory (`taqmish-expo/`) is the Expo project. There is also a legacy Android native app at `../app/` (the sibling `app/` folder in the parent directory is a Gradle-based Android Studio project). Both share the same Firebase backend (project ID: `tuqmish`).

## Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server (choose emulator/device in output)
npm run android      # Start with Android target
npm run ios          # Start with iOS target
npm run web          # Start with web target
npm run lint         # Run ESLint via expo lint
```

There is no test suite configured.

## Architecture

### Routing — Expo Router (file-based)

```
app/
  _layout.tsx          # Root layout: SafeAreaProvider > AuthProvider > ThemeProvider > Stack
  index.tsx            # Splash/redirect: sends authenticated users to (tabs), unauthenticated to login
  login.tsx
  signup.tsx
  forgot-password.tsx
  profile-setup.tsx    # Required after first registration (profileComplete flag)
  (tabs)/
    _layout.tsx        # Tab bar + custom luxury header + left/right slide-over drawers
    index.tsx          # Home: outfit builder with drag-and-drop mannequin slots
    closet.tsx         # Closet manager: upload items, section management, saved outfits view
    coordination.tsx   # Calendar coordination (scheduling outfits by date/time slot)
    settings.tsx       # Wardrobe/store items browser
    profile.tsx        # User profile viewer/editor
```

### Authentication — `providers/auth-provider.tsx`

Wraps the app. Exposes `useAuth()` giving `{ authUser, profile, isLoading, login, logout, register, refreshProfile, resetPassword, saveProfile }`. After `register()`, users must complete `profile-setup` (sets `profileComplete: true` in the DB). Navigation guards in screen files redirect to `/login` when `!authUser`.

### Firebase — `lib/firebase.ts`

Single module initialises the Firebase app (named `tuqmish-expo`) and exports `{ app, auth, database, storage }`. Uses `AsyncStorage` persistence for auth on React Native. Config values read from `EXPO_PUBLIC_FIREBASE_*` env vars; hardcoded fallbacks are present for development.

**Realtime Database paths:**
| Path | Content |
|------|---------|
| `Users/{uid}` | User profile (`UserProfile`) |
| `userClosetItems/{uid}/{itemId}` | Primary per-user closet items |
| `SiteClosets/{uid}/{itemId}` | Legacy closet mirror (written in parallel) |
| `Item/{uid}/{itemId}` | Older legacy personal items |
| `ClosetSections/{uid}/{sectionId}` | User-defined closet sections |
| `OutfitClass/{uid}/{outfitId}` | Saved outfits |
| `catalogItems` | Global catalog items (source: `'catalog'`) |
| `StoreItems/{storeId}/{itemId}` | Store inventory |
| `Stores/{storeId}` | Store profiles |

### Data hooks — `hooks/`

All hooks subscribe to Firebase Realtime Database with `onValue` and return `{ isLoading, items }` or `{ isLoading, userItems, storeItems, catalogItems, items }`.

- **`useWardrobeItems(userId)`** — merges and de-duplicates items from `catalogItems`, `StoreItems`, `userClosetItems`, `SiteClosets`, and `Item/{uid}`. The primary hook for browsing all available wardrobe items. Returns filtered views: `userItems`, `storeItems`, `catalogItems`.
- **`useClosetItems(userId)`** — lighter hook reading only `SiteClosets` (legacy path). Still used in `closet.tsx` as `toLegacyClosetItem()`.
- **`useClosetSections(userId)`** — reads `ClosetSections/{uid}`.
- **`useOutfits(userId)`** — reads `OutfitClass/{uid}`.
- **`useCalendarItems(userId)`** — reads calendar/scheduling data.
- **`useItems(userId)`** — reads legacy `Item/{uid}`.

Data normalisation happens inside each hook using `normalizeWardrobeItem` / `normalizeClosetItem` which resolve both camelCase and PascalCase field names (the Firebase DB has inconsistent casing from the legacy Android app).

### Theming — `constants/theme.ts`

`LuxuryTheme` is the primary design token object (gold/espresso/cream palette). `Colors` provides light/dark values for the standard `useColorScheme` hook. `Fonts` provides platform-specific font families. Use `LuxuryTheme.*` for in-component styling; `StyleSheet.create` is used throughout.

### Image pipeline — `closet.tsx`

When adding a closet item: camera/gallery → `expo-image-manipulator` auto-crop by detected type (Top/Bottom/Shoes/Accessories) → `jpeg-js` color palette extraction → Firebase Storage upload via resumable upload API → record written to both `SiteClosets` and `userClosetItems`. The upload uses a raw `fetch` with Firebase's resumable upload protocol (not the Firebase SDK `uploadBytes`) because `expo-file-system`'s `uploadAsync` is required on React Native.

### Path alias

`@/` resolves to the project root (`tsconfig.json` paths). Always use `@/` imports, not relative paths.
