# Glass Music

A premium, offline, glassmorphic music player for Android & iOS built with
**Expo SDK 56**, **Expo Router**, **TypeScript**, **Zustand**, **expo-audio**
and **expo-media-library**.

The app automatically scans the device for local audio files, sorts them
alphabetically, and lets you listen with a beautiful frosted-glass UI that you
can fine-tune yourself.

## Highlights

- Auto-scans the device library on launch (`mp3`, `m4a`, `wav`, `aac`, `flac`,
  `ogg`, `opus`, `wma`) and caches metadata for fast subsequent launches.
- Four horizontally-scrollable top tabs: **Songs**, **Liked**, **Playlists**,
  **Folders**.
- Full queue-based audio engine: play, pause, resume, stop, next, previous,
  seek, shuffle, repeat-one, repeat-all, "play next", "add to queue".
- Persistent **mini player** above the tabs, **full-screen player** with
  scrubbing + queue management (drag-to-reorder).
- **Liked songs** & **playlists** stored locally via AsyncStorage.
- **Folders** tab groups your music by source directory.
- Background playback + lock-screen controls (configured for both iOS & Android
  via the `expo-audio` plugin).
- Customisable glassmorphism: **transparency**, **blur intensity** and
  **background opacity** sliders in Settings.
- Action sheet on every song with: Play Next · Add to Queue · Add to Playlist ·
  Like · Share · Delete from device.
- Robust error handling: permission denial, missing files, empty library.

## Run it

```bash
npm install
npx expo start
```

Then scan the QR code with the Expo Go app (or use a dev client).

> **If `npm install` complains about peer dependencies** (common while React
> Native and Expo are mid-release), use either of:
>
> ```bash
> npm install --legacy-peer-deps
> # or, to force-align every dependency to the versions Expo recommends:
> npm run fix-deps
> ```
>
> **You must use a development build (not Expo Go)** because this app relies on
> `expo-media-library` and `expo-audio` background playback features that
> require native code:
>
> ```bash
> npx expo run:android      # or
> npx expo run:ios
> ```

> **Permissions:** the app will request the *Media Library* permission on first
> launch. On Android 13+ this maps to `READ_MEDIA_AUDIO`; on iOS it maps to the
> Photos library (which is also where Apple keeps imported music).

## Build it with EAS

Cloud-build installable binaries (APK / AAB / IPA) with
[EAS Build](https://docs.expo.dev/build/introduction/). No Xcode / Android Studio
required.

### 1. One-time setup

```bash
npm install
npm install -g eas-cli           # install the EAS CLI globally (per expo-doctor)
npm run eas:login                # sign into your Expo account
npm run eas:init                 # creates the project on EAS and writes
                                 # `extra.eas.projectId` + `owner` into app.json
npx eas update:configure         # wires up the OTA `updates.url`
```

After `eas init` and `eas update:configure`, replace the
`REPLACE_WITH_EAS_PROJECT_ID` / `REPLACE_WITH_EXPO_ACCOUNT_USERNAME` placeholders
that ship in `app.json` are populated automatically.

### 2. Build profiles

`eas.json` defines three profiles:

| Profile        | Use it for                                   | Android         | iOS                    |
| -------------- | -------------------------------------------- | --------------- | ---------------------- |
| `development`  | Daily dev with the dev-client + Metro        | Debug APK       | Simulator `.app`       |
| `preview`      | Internal QA / TestFlight-style sharing       | Release APK     | Simulator `.app`       |
| `preview:device` | Same as `preview` but for real iPhones     | —               | Ad-hoc signed `.ipa`   |
| `production`   | App Store / Play Store submissions           | Release `.aab`  | App Store-signed `.ipa`|

### 3. Run a build

```bash
# Development client (install once, then use `npm start` for live reload)
npm run eas:build:dev:android
npm run eas:build:dev:ios

# Internal preview (shareable APK / sim build)
npm run eas:build:preview:android
npm run eas:build:preview:ios

# Production (auto-increments versionCode / buildNumber on EAS servers)
npm run eas:build:production              # both platforms
npm run eas:build:production:android
npm run eas:build:production:ios
```

### 4. Submit to the stores

Fill in the placeholders under `submit.production` in `eas.json`
(`ascAppId`, `appleId`, `appleTeamId`, and a Google Play
`serviceAccountKeyPath` JSON at `./secrets/play-service-account.json` — the
`secrets/` folder is git-ignored), then:

```bash
npm run eas:submit:android
npm run eas:submit:ios
```

### 5. Ship OTA updates

Each EAS build is pinned to a `channel` (`development`, `preview`, `production`)
and to the `runtimeVersion` policy `appVersion`. Push JS-only updates to any
channel without rebuilding:

```bash
npm run eas:update           # publishes to the channel matching the current branch
# or explicitly:
npx eas update --branch production --message "fix: queue reorder crash"
```

### Notes

- `appVersionSource: "remote"` in `eas.json` means EAS owns the
  `versionCode` / `buildNumber`. Bump the human-facing `version` in `app.json`
  for marketing releases; EAS handles the rest.
- The repo intentionally **does not** commit `android/` or `ios/` folders. EAS
  regenerates them on every build via `npm run prebuild` (`expo prebuild`).
- Native credentials (keystores, p8 / p12 keys, provisioning profiles) are
  managed by EAS — never commit them. The matching ignore rules live in
  `.gitignore` (`*.jks`, `*.p8`, `*.p12`, `*.mobileprovision`, `secrets/`,
  `google-services.json`, `GoogleService-Info.plist`).

## Project layout

```
app/                       Expo Router routes (file-based navigation)
  _layout.tsx                Root layout: providers + audio engine + hydration
  index.tsx                  Redirects to /(tabs)/songs
  (tabs)/
    _layout.tsx              Shared chrome: gradient + tab bar + mini-player
    songs.tsx                Default screen
    liked.tsx
    playlists.tsx
    folders.tsx
  search.tsx                 Modal search
  player.tsx                 Full-screen player (also a modal)
  settings.tsx               Settings (glass + playback + library)
  folder/[id].tsx            Songs inside a folder
  playlist/[id].tsx          Songs inside a playlist + add/remove
  +not-found.tsx
src/
  components/                Re-usable building blocks
    GlassCard, SongItem, MiniPlayer, SearchBar, PlaylistCard, FolderCard,
    QueueList, ActionSheet, SongActionSheet, AddToPlaylistSheet, TopTabBar,
    TopHeader, Artwork, BackgroundGradient, EmptyState
  constants/                 Colors, spacing, default settings, storage keys
  hooks/
    useAudioEngine.ts        Bridges expo-audio ↔ Zustand store
    useLibraryLoader.ts      Permission + scan lifecycle
    useGlass.ts              Derives style values from the glass settings
  services/
    AudioScanner.ts          expo-media-library wrapper
    StorageService.ts        Tiny typed AsyncStorage helper
  store/
    musicStore.ts            songs, queue, playback state
    likedStore.ts            liked songs (persisted)
    playlistStore.ts         playlists (persisted)
    settingsStore.ts         glass + playback + library settings (persisted)
  types/                     Shared TypeScript models
  utils/                     Formatting, sorting, permissions
```

> *Note:* Expo Router resolves routes from the `app/` directory at the project
> root. Everything else lives under `src/` and is imported via the `@/...`
> path alias (configured in `tsconfig.json`). This keeps the file-system
> router happy while preserving the clean module separation requested.

## Architecture notes

### State

- **`musicStore`** owns the queue and currently-playing index. It is the
  single source of truth for "what should be playing right now".
- **`useAudioEngine`** (mounted once at the root) listens to the store and
  imperatively drives a single `expo-audio` `useAudioPlayer` instance. It also
  pushes the current time / duration back into the store, advances the queue
  on `didJustFinish`, and exposes a global `seekToSecondsGlobal` helper so
  the full-screen player can scrub without spawning a second player.
- Liked songs, playlists, and settings each have their own focused store and
  hydrate from AsyncStorage on launch.

### Glassmorphism

- `GlassCard` wraps an `expo-blur` `BlurView` with a translucent overlay.
- `useGlass()` reads the user's settings and derives the actual fill /
  border / tint colors that every glass surface uses. Updating any slider in
  Settings immediately re-renders the whole UI.

### Background playback / lock screen

The `expo-audio` config plugin in `app.json` enables:

- iOS `UIBackgroundModes: audio`
- Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK` + the `AudioControlsService`
  declared by the plugin.

At runtime the engine calls `setAudioModeAsync({ shouldPlayInBackground: true })`
and `player.setActiveForLockScreen(true, { ... })` whenever a track starts.

## Customising

- **Defaults** for the glassmorphism look live in `src/constants/audio.ts`
  (`DEFAULT_SETTINGS.glass`).
- **Supported file extensions** are in `src/constants/audio.ts`
  (`SUPPORTED_AUDIO_EXTENSIONS`).
- **Color palette** lives in `src/constants/colors.ts`.

## License

MIT
