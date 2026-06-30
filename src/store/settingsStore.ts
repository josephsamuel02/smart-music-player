import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';
import type {
  AppSettings,
  EqualizerSettings,
  GlassSettings,
  LibrarySettings,
  PlaybackSettings,
  ThemeSettings,
} from '@/types';
import { DEFAULT_SETTINGS, StorageKeys } from '@/constants/audio';
import { sanitizeEqualizer } from '@/constants/equalizer';
import { StorageService } from '@/services/StorageService';

type SettingsStoreState = AppSettings & {
  hydrated: boolean;
  /** Epoch ms until which the app is ad-free (from the "remove ads" reward). 0 = ads on. */
  adFreeUntil: number;
  hydrate: () => Promise<void>;
  updateGlass: (partial: Partial<GlassSettings>) => void;
  updatePlayback: (partial: Partial<PlaybackSettings>) => void;
  updateLibrary: (partial: Partial<LibrarySettings>) => void;
  updateTheme: (partial: Partial<ThemeSettings>) => void;
  updateEqualizer: (partial: Partial<EqualizerSettings>) => void;
  /** Copy a picked image into the document directory and remember its URI.
   *  Pass `null` to clear the current custom background. */
  setCustomBackground: (sourceUri: string | null) => Promise<void>;
  /** Grant an ad-free window of `durationMs` (extends an existing one). */
  grantAdFree: (durationMs: number) => void;
  reset: () => void;
};

type RewardsState = { adFreeUntil: number };

function persistRewards(rewards: RewardsState) {
  void StorageService.set(StorageKeys.rewards, rewards);
}

function persist(state: AppSettings) {
  void StorageService.set(StorageKeys.settings, {
    glass: state.glass,
    playback: state.playback,
    library: state.library,
    theme: state.theme,
    equalizer: state.equalizer,
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function sanitizeGlass(g: GlassSettings): GlassSettings {
  return {
    transparency: clamp(g.transparency, 0, 1),
    blurIntensity: clamp(g.blurIntensity, 0, 100),
    backgroundOpacity: clamp(g.backgroundOpacity, 0, 1),
  };
}

function sanitizeTheme(t: ThemeSettings): ThemeSettings {
  return {
    themeId: t.themeId,
    backgroundId: t.backgroundId || 'default',
    customBackgroundUri: t.customBackgroundUri || undefined,
    customBackgroundDim: clamp(t.customBackgroundDim ?? 0.45, 0, 1),
  };
}

const CUSTOM_BG_DIR_NAME = 'custom-background';

async function copyCustomBackground(sourceUri: string): Promise<string> {
  const documentDir = FileSystem.documentDirectory;
  if (!documentDir) {
    throw new Error('No writable document directory available.');
  }
  const targetDir = `${documentDir}${CUSTOM_BG_DIR_NAME}/`;
  await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true }).catch(() => undefined);

  const extMatch = /\.([a-zA-Z0-9]+)(?:\?.*)?$/.exec(sourceUri);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const targetUri = `${targetDir}bg-${Date.now()}.${ext}`;

  await FileSystem.copyAsync({ from: sourceUri, to: targetUri });
  return targetUri;
}

async function deleteCustomBackground(uri: string | undefined): Promise<void> {
  if (!uri) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,
  adFreeUntil: 0,

  hydrate: async () => {
    const rewards = await StorageService.get<RewardsState | null>(StorageKeys.rewards, null);
    if (rewards && typeof rewards.adFreeUntil === 'number') {
      set({ adFreeUntil: rewards.adFreeUntil });
    }

    const stored = await StorageService.get<AppSettings | null>(StorageKeys.settings, null);
    if (stored) {
      const theme = sanitizeTheme({ ...DEFAULT_SETTINGS.theme, ...stored.theme });
      // If the persisted custom background no longer exists on disk, forget it
      // so the UI doesn't render a broken image source.
      if (theme.customBackgroundUri) {
        const info = await FileSystem.getInfoAsync(theme.customBackgroundUri).catch(() => null);
        if (!info?.exists) {
          theme.customBackgroundUri = undefined;
        }
      }
      set({
        glass: sanitizeGlass({ ...DEFAULT_SETTINGS.glass, ...stored.glass }),
        playback: { ...DEFAULT_SETTINGS.playback, ...stored.playback },
        library: { ...DEFAULT_SETTINGS.library, ...stored.library },
        theme,
        equalizer: sanitizeEqualizer({ ...DEFAULT_SETTINGS.equalizer, ...stored.equalizer }),
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  updateGlass: (partial) => {
    const glass = sanitizeGlass({ ...get().glass, ...partial });
    set({ glass });
    persist({ ...get(), glass });
  },

  updatePlayback: (partial) => {
    const playback = { ...get().playback, ...partial };
    set({ playback });
    persist({ ...get(), playback });
  },

  updateLibrary: (partial) => {
    const library = { ...get().library, ...partial };
    set({ library });
    persist({ ...get(), library });
  },

  updateTheme: (partial) => {
    const theme = sanitizeTheme({ ...get().theme, ...partial });
    set({ theme });
    persist({ ...get(), theme });
  },

  updateEqualizer: (partial) => {
    const equalizer = sanitizeEqualizer({ ...get().equalizer, ...partial });
    set({ equalizer });
    persist({ ...get(), equalizer });
  },

  setCustomBackground: async (sourceUri) => {
    const previous = get().theme.customBackgroundUri;

    if (sourceUri == null) {
      const theme = sanitizeTheme({ ...get().theme, customBackgroundUri: undefined });
      set({ theme });
      persist({ ...get(), theme });
      await deleteCustomBackground(previous);
      return;
    }

    const persistedUri = await copyCustomBackground(sourceUri);
    const theme = sanitizeTheme({ ...get().theme, customBackgroundUri: persistedUri });
    set({ theme });
    persist({ ...get(), theme });
    // Clean up the prior custom background only after the new one is saved.
    if (previous && previous !== persistedUri) {
      await deleteCustomBackground(previous);
    }
  },

  grantAdFree: (durationMs) => {
    // Extend from now or from an existing window, whichever is later, so
    // watching again while already ad-free stacks another day.
    const base = Math.max(Date.now(), get().adFreeUntil);
    const adFreeUntil = base + durationMs;
    set({ adFreeUntil });
    persistRewards({ adFreeUntil });
  },

  reset: () => {
    const previous = get().theme.customBackgroundUri;
    // Keep the earned ad-free window - it's earned, not a preference, so a
    // settings reset shouldn't revoke it.
    set({ ...DEFAULT_SETTINGS });
    persist(DEFAULT_SETTINGS as AppSettings);
    void deleteCustomBackground(previous);
  },
}));
