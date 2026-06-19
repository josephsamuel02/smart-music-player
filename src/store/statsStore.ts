import { create } from 'zustand';
import { StorageKeys } from '@/constants/audio';
import { StorageService } from '@/services/StorageService';

export type PlayStat = {
  /** Number of times this song has started playing. */
  count: number;
  /** Last time it started playing (ms epoch). */
  lastPlayedAt: number;
};

type StatsStoreState = {
  stats: Record<string, PlayStat>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Record that a song just started playing. */
  recordPlay: (songId: string) => void;
};

function persist(stats: Record<string, PlayStat>) {
  void StorageService.set(StorageKeys.playStats, stats);
}

export const useStatsStore = create<StatsStoreState>((set, get) => ({
  stats: {},
  hydrated: false,

  hydrate: async () => {
    const stats = await StorageService.get<Record<string, PlayStat>>(StorageKeys.playStats, {});
    set({ stats, hydrated: true });
  },

  recordPlay: (songId) => {
    if (!songId) return;
    const prev = get().stats[songId];
    const next = {
      ...get().stats,
      [songId]: {
        count: (prev?.count ?? 0) + 1,
        lastPlayedAt: Date.now(),
      },
    };
    set({ stats: next });
    persist(next);
  },
}));
