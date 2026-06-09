import { create } from 'zustand';
import type { FolderGroup, RepeatMode, Song } from '@/types';
import { StorageKeys } from '@/constants/audio';
import { StorageService } from '@/services/StorageService';
import { sortSongsByTitle, sortStrings } from '@/utils/sort';

type LoadState = 'idle' | 'permission-denied' | 'scanning' | 'ready' | 'error';

type MusicStoreState = {
  songs: Song[];
  songsById: Record<string, Song>;
  folders: FolderGroup[];
  loadState: LoadState;
  errorMessage: string | null;

  queue: string[];
  history: string[];
  currentIndex: number;

  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  positionSeconds: number;
  durationSeconds: number;

  setSongs: (songs: Song[]) => void;
  setLoadState: (state: LoadState, error?: string | null) => void;

  /** Play a song from a source list (sets the queue to that list, starting at the given song). */
  playFromList: (songs: Song[], startId: string) => void;
  /** Adds a single song to play directly after the current one. */
  playNext: (songId: string) => void;
  /** Adds songs to the end of the queue. */
  addToQueue: (songIds: string[] | string) => void;
  /** Remove a song at a queue index. */
  removeFromQueueAt: (index: number) => void;
  /** Reorder the queue (used by drag-handle). */
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;

  setIsPlaying: (v: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setRepeat: (mode: RepeatMode) => void;

  next: () => string | null;
  previous: () => string | null;
  onTrackFinished: () => string | null;

  setPosition: (positionSeconds: number, durationSeconds?: number) => void;

  hydrateFromStorage: () => Promise<void>;
};

function buildFolderGroups(songs: Song[]): FolderGroup[] {
  const map = new Map<string, FolderGroup>();
  for (const s of songs) {
    const key = s.folderPath || s.folder;
    const existing = map.get(key);
    if (existing) {
      existing.songIds.push(s.id);
      existing.songCount += 1;
    } else {
      map.set(key, {
        path: s.folderPath,
        name: s.folder || 'Music',
        songCount: 1,
        songIds: [s.id],
      });
    }
  }
  const names = sortStrings(Array.from(map.values()).map((f) => f.name));
  return names
    .map((n) => Array.from(map.values()).find((f) => f.name === n)!)
    .filter(Boolean);
}

export const useMusicStore = create<MusicStoreState>((set, get) => ({
  songs: [],
  songsById: {},
  folders: [],
  loadState: 'idle',
  errorMessage: null,

  queue: [],
  history: [],
  currentIndex: -1,

  isPlaying: false,
  shuffle: false,
  repeat: 'off',
  positionSeconds: 0,
  durationSeconds: 0,

  setSongs: (songs) => {
    const sorted = sortSongsByTitle(songs);
    const byId: Record<string, Song> = {};
    for (const s of sorted) byId[s.id] = s;
    set({
      songs: sorted,
      songsById: byId,
      folders: buildFolderGroups(sorted),
    });
    void StorageService.set(StorageKeys.songsCache, sorted);
  },

  setLoadState: (loadState, errorMessage = null) => set({ loadState, errorMessage }),

  playFromList: (songs, startId) => {
    const ids = songs.map((s) => s.id);
    const startIndex = ids.indexOf(startId);
    if (startIndex < 0) return;
    set({
      queue: ids,
      currentIndex: startIndex,
      isPlaying: true,
      positionSeconds: 0,
    });
    void StorageService.set(StorageKeys.queue, { queue: ids, index: startIndex });
    void StorageService.set(StorageKeys.lastPlayed, startId);
  },

  playNext: (songId) => {
    const { queue, currentIndex } = get();
    const next = [...queue];
    const existingIdx = next.indexOf(songId);
    if (existingIdx >= 0) next.splice(existingIdx, 1);
    const insertAt = currentIndex < 0 ? 0 : currentIndex + 1;
    next.splice(insertAt, 0, songId);

    // If the song was earlier than current, the current index shifts left
    const adjustedIndex =
      existingIdx >= 0 && existingIdx < currentIndex ? currentIndex - 1 : currentIndex;

    set({ queue: next, currentIndex: adjustedIndex < 0 ? 0 : adjustedIndex });
    void StorageService.set(StorageKeys.queue, { queue: next, index: adjustedIndex });
  },

  addToQueue: (songIds) => {
    const toAdd = Array.isArray(songIds) ? songIds : [songIds];
    const { queue } = get();
    const dedup = toAdd.filter((id) => !queue.includes(id));
    if (dedup.length === 0) return;
    const next = [...queue, ...dedup];
    set({ queue: next });
    void StorageService.set(StorageKeys.queue, { queue: next, index: get().currentIndex });
  },

  removeFromQueueAt: (index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const next = [...queue];
    next.splice(index, 1);
    let newIndex = currentIndex;
    if (index < currentIndex) newIndex = currentIndex - 1;
    else if (index === currentIndex) newIndex = Math.min(currentIndex, next.length - 1);
    set({ queue: next, currentIndex: newIndex });
    void StorageService.set(StorageKeys.queue, { queue: next, index: newIndex });
  },

  reorderQueue: (from, to) => {
    const { queue, currentIndex } = get();
    if (from === to || from < 0 || to < 0 || from >= queue.length || to >= queue.length) return;
    const next = [...queue];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    // Track the current song index through the move
    let newIndex = currentIndex;
    if (from === currentIndex) newIndex = to;
    else if (from < currentIndex && to >= currentIndex) newIndex = currentIndex - 1;
    else if (from > currentIndex && to <= currentIndex) newIndex = currentIndex + 1;

    set({ queue: next, currentIndex: newIndex });
    void StorageService.set(StorageKeys.queue, { queue: next, index: newIndex });
  },

  clearQueue: () => {
    set({ queue: [], currentIndex: -1, isPlaying: false, positionSeconds: 0 });
    void StorageService.set(StorageKeys.queue, { queue: [], index: -1 });
  },

  setIsPlaying: (v) => set({ isPlaying: v }),

  toggleShuffle: () => {
    const { shuffle, queue, currentIndex } = get();
    if (!shuffle) {
      // Snapshot history and reshuffle the upcoming portion
      const upcoming = queue.slice(currentIndex + 1);
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }
      const next = [...queue.slice(0, currentIndex + 1), ...upcoming];
      set({ shuffle: true, queue: next });
      void StorageService.set(StorageKeys.queue, { queue: next, index: currentIndex });
    } else {
      set({ shuffle: false });
    }
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ['off', 'all', 'one'];
    const { repeat } = get();
    const nextMode = order[(order.indexOf(repeat) + 1) % order.length];
    set({ repeat: nextMode });
  },

  setRepeat: (mode) => set({ repeat: mode }),

  next: () => {
    const { queue, currentIndex, repeat } = get();
    if (queue.length === 0) return null;
    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === 'all') nextIndex = 0;
      else return null;
    }
    set({ currentIndex: nextIndex, positionSeconds: 0, isPlaying: true });
    return queue[nextIndex];
  },

  previous: () => {
    const { queue, currentIndex, positionSeconds } = get();
    if (queue.length === 0) return null;
    // If we've played > 3s, restart current track instead of going back
    if (positionSeconds > 3) {
      set({ positionSeconds: 0 });
      return queue[currentIndex] ?? null;
    }
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      set({ positionSeconds: 0 });
      return queue[currentIndex] ?? null;
    }
    set({ currentIndex: prevIndex, positionSeconds: 0, isPlaying: true });
    return queue[prevIndex];
  },

  onTrackFinished: () => {
    const { queue, currentIndex, repeat } = get();
    if (queue.length === 0) return null;
    if (repeat === 'one') {
      set({ positionSeconds: 0 });
      return queue[currentIndex];
    }
    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeat === 'all') nextIndex = 0;
      else {
        set({ isPlaying: false, positionSeconds: 0 });
        return null;
      }
    }
    set({ currentIndex: nextIndex, positionSeconds: 0, isPlaying: true });
    return queue[nextIndex];
  },

  setPosition: (positionSeconds, durationSeconds) =>
    set((s) => ({
      positionSeconds,
      durationSeconds: durationSeconds ?? s.durationSeconds,
    })),

  hydrateFromStorage: async () => {
    const [cached, queueData, lastPlayed] = await Promise.all([
      StorageService.get<Song[]>(StorageKeys.songsCache, []),
      StorageService.get<{ queue: string[]; index: number }>(StorageKeys.queue, {
        queue: [],
        index: -1,
      }),
      StorageService.get<string | null>(StorageKeys.lastPlayed, null),
    ]);

    if (cached.length > 0) {
      const sorted = sortSongsByTitle(cached);
      const byId: Record<string, Song> = {};
      for (const s of sorted) byId[s.id] = s;
      set({ songs: sorted, songsById: byId, folders: buildFolderGroups(sorted) });
    }

    // Restore queue, but pause - actual playback resumes via settings.resumeLastPlayed
    if (queueData.queue.length > 0) {
      let idx = queueData.index;
      if (lastPlayed) {
        const li = queueData.queue.indexOf(lastPlayed);
        if (li >= 0) idx = li;
      }
      set({
        queue: queueData.queue,
        currentIndex: idx >= 0 ? idx : 0,
        isPlaying: false,
      });
    }
  },
}));

/** Convenience selector for the currently active song. */
export function selectCurrentSong(state: MusicStoreState): Song | null {
  if (state.currentIndex < 0) return null;
  const id = state.queue[state.currentIndex];
  return id ? state.songsById[id] ?? null : null;
}
