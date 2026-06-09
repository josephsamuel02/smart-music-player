import { create } from 'zustand';
import { StorageKeys } from '@/constants/audio';
import { StorageService } from '@/services/StorageService';

type LikedStoreState = {
  likedIds: Set<string>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  isLiked: (id: string) => boolean;
  toggleLike: (id: string) => boolean;
  setLiked: (id: string, liked: boolean) => void;
};

async function persist(ids: Set<string>) {
  await StorageService.set(StorageKeys.likedSongs, Array.from(ids));
}

export const useLikedStore = create<LikedStoreState>((set, get) => ({
  likedIds: new Set<string>(),
  hydrated: false,

  hydrate: async () => {
    const arr = await StorageService.get<string[]>(StorageKeys.likedSongs, []);
    set({ likedIds: new Set(arr), hydrated: true });
  },

  isLiked: (id) => get().likedIds.has(id),

  toggleLike: (id) => {
    const next = new Set(get().likedIds);
    let liked: boolean;
    if (next.has(id)) {
      next.delete(id);
      liked = false;
    } else {
      next.add(id);
      liked = true;
    }
    set({ likedIds: next });
    void persist(next);
    return liked;
  },

  setLiked: (id, liked) => {
    const next = new Set(get().likedIds);
    if (liked) next.add(id);
    else next.delete(id);
    set({ likedIds: next });
    void persist(next);
  },
}));
