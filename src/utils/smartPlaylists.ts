import type { Ionicons } from '@expo/vector-icons';
import type { Song } from '@/types';
import type { PlayStat } from '@/store/statsStore';

export type SmartPlaylistType = 'last-played' | 'newly-added' | 'most-played';

export type SmartPlaylistMeta = {
  type: SmartPlaylistType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  /** Max number of songs to include (0 = unlimited). */
  limit: number;
};

export const SMART_PLAYLISTS: readonly SmartPlaylistMeta[] = [
  {
    type: 'last-played',
    title: 'Last Played',
    description: 'Your most recently played songs',
    icon: 'time-outline',
    gradient: ['#7C3AED', '#EC4899'],
    limit: 100,
  },
  {
    type: 'newly-added',
    title: 'Newly Added',
    description: 'The latest additions to your library',
    icon: 'sparkles-outline',
    gradient: ['#06B6D4', '#3B82F6'],
    limit: 21,
  },
  {
    type: 'most-played',
    title: 'Most Played',
    description: 'The songs you play the most',
    icon: 'flame-outline',
    gradient: ['#F59E0B', '#EF4444'],
    limit: 32,
  },
];

export function getSmartPlaylistMeta(type: string): SmartPlaylistMeta | undefined {
  return SMART_PLAYLISTS.find((p) => p.type === type);
}

/**
 * Compute the ordered song list for a smart playlist from the library + play
 * stats. Pure function so it can be reused by the card counts and the detail
 * screen alike.
 */
export function computeSmartPlaylist(
  type: SmartPlaylistType,
  songs: Song[],
  stats: Record<string, PlayStat>,
  limit?: number,
): Song[] {
  let result: Song[];

  switch (type) {
    case 'last-played': {
      result = songs
        .filter((s) => (stats[s.id]?.lastPlayedAt ?? 0) > 0)
        .sort((a, b) => (stats[b.id]?.lastPlayedAt ?? 0) - (stats[a.id]?.lastPlayedAt ?? 0));
      break;
    }
    case 'newly-added': {
      result = [...songs].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
      break;
    }
    case 'most-played': {
      result = songs
        .filter((s) => (stats[s.id]?.count ?? 0) > 0)
        .sort((a, b) => (stats[b.id]?.count ?? 0) - (stats[a.id]?.count ?? 0));
      break;
    }
    default:
      result = [];
  }

  const cap = limit ?? getSmartPlaylistMeta(type)?.limit ?? 0;
  return cap > 0 ? result.slice(0, cap) : result;
}
