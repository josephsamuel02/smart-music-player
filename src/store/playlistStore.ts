import { create } from 'zustand';
import type { Playlist } from '@/types';
import { StorageKeys } from '@/constants/audio';
import { StorageService } from '@/services/StorageService';

type PlaylistStoreState = {
  playlists: Playlist[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createPlaylist: (name: string) => Playlist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addSongs: (id: string, songIds: string[]) => void;
  removeSong: (id: string, songId: string) => void;
  reorderSongs: (id: string, from: number, to: number) => void;
  getById: (id: string) => Playlist | undefined;
};

function persist(playlists: Playlist[]) {
  void StorageService.set(StorageKeys.playlists, playlists);
}

function uid() {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const usePlaylistStore = create<PlaylistStoreState>((set, get) => ({
  playlists: [],
  hydrated: false,

  hydrate: async () => {
    const arr = await StorageService.get<Playlist[]>(StorageKeys.playlists, []);
    set({ playlists: arr, hydrated: true });
  },

  createPlaylist: (name) => {
    const playlist: Playlist = {
      id: uid(),
      name: name.trim() || 'New Playlist',
      songIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [playlist, ...get().playlists];
    set({ playlists: next });
    persist(next);
    return playlist;
  },

  renamePlaylist: (id, name) => {
    const next = get().playlists.map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name, updatedAt: Date.now() } : p,
    );
    set({ playlists: next });
    persist(next);
  },

  deletePlaylist: (id) => {
    const next = get().playlists.filter((p) => p.id !== id);
    set({ playlists: next });
    persist(next);
  },

  addSongs: (id, songIds) => {
    const next = get().playlists.map((p) => {
      if (p.id !== id) return p;
      const existing = new Set(p.songIds);
      const merged = [...p.songIds];
      for (const sid of songIds) {
        if (!existing.has(sid)) {
          merged.push(sid);
          existing.add(sid);
        }
      }
      return { ...p, songIds: merged, updatedAt: Date.now() };
    });
    set({ playlists: next });
    persist(next);
  },

  removeSong: (id, songId) => {
    const next = get().playlists.map((p) =>
      p.id === id
        ? { ...p, songIds: p.songIds.filter((s) => s !== songId), updatedAt: Date.now() }
        : p,
    );
    set({ playlists: next });
    persist(next);
  },

  reorderSongs: (id, from, to) => {
    const next = get().playlists.map((p) => {
      if (p.id !== id) return p;
      if (from === to || from < 0 || to < 0 || from >= p.songIds.length || to >= p.songIds.length)
        return p;
      const songIds = [...p.songIds];
      const [moved] = songIds.splice(from, 1);
      songIds.splice(to, 0, moved);
      return { ...p, songIds, updatedAt: Date.now() };
    });
    set({ playlists: next });
    persist(next);
  },

  getById: (id) => get().playlists.find((p) => p.id === id),
}));
