import { create } from 'zustand';
import { StorageKeys } from '@/constants/audio';
import { StorageService } from '@/services/StorageService';

/**
 * Persists user-saved lyrics keyed by song id. Lyrics may be plain text or
 * LRC-style timestamped lines (`[mm:ss.xx] ...`) for synced viewing.
 */
type LyricsStoreState = {
  byId: Record<string, string>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  get: (songId: string) => string | undefined;
  set: (songId: string, lyrics: string) => void;
  clear: (songId: string) => void;
};

function persist(byId: Record<string, string>) {
  void StorageService.set(StorageKeys.lyrics, byId);
}

export const useLyricsStore = create<LyricsStoreState>((set, get) => ({
  byId: {},
  hydrated: false,

  hydrate: async () => {
    const byId = await StorageService.get<Record<string, string>>(StorageKeys.lyrics, {});
    set({ byId, hydrated: true });
  },

  get: (songId) => get().byId[songId],

  set: (songId, lyrics) => {
    const next = { ...get().byId, [songId]: lyrics };
    set({ byId: next });
    persist(next);
  },

  clear: (songId) => {
    const next = { ...get().byId };
    delete next[songId];
    set({ byId: next });
    persist(next);
  },
}));
