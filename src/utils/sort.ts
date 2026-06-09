import type { Song } from '@/types';

const collator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true,
});

/** Alphabetical sort by song title with a stable artist tiebreaker. */
export function sortSongsByTitle(songs: Song[]): Song[] {
  return [...songs].sort((a, b) => {
    const t = collator.compare(a.title || '', b.title || '');
    if (t !== 0) return t;
    return collator.compare(a.artist || '', b.artist || '');
  });
}

export function sortStrings(values: string[]): string[] {
  return [...values].sort((a, b) => collator.compare(a, b));
}
