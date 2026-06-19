/**
 * Fetches lyrics from the free, no-key LRCLIB API (https://lrclib.net).
 * Prefers time-synced (LRC) lyrics so they can scroll with playback, and
 * falls back to plain text.
 */

export type LyricsResult = {
  synced: string | null;
  plain: string | null;
  source: string;
};

type LrclibEntry = {
  trackName?: string;
  artistName?: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
};

const BASE = 'https://lrclib.net/api';

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GlassMusicPlayer (https://github.com/)' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Look up lyrics for an artist + title (album/duration optional but improve
 * the match quality on the `/get` endpoint).
 */
export async function fetchLyrics(
  artist: string,
  title: string,
  album?: string,
  durationSeconds?: number,
): Promise<LyricsResult | null> {
  const params = new URLSearchParams({
    artist_name: artist,
    track_name: title,
  });
  if (album) params.set('album_name', album);
  if (durationSeconds && durationSeconds > 0) {
    params.set('duration', String(Math.round(durationSeconds)));
  }

  // Try the precise endpoint first.
  const direct = await getJson<LrclibEntry>(`${BASE}/get?${params.toString()}`);
  const fromEntry = (e?: LrclibEntry | null): LyricsResult | null => {
    if (!e) return null;
    const synced = e.syncedLyrics?.trim() || null;
    const plain = e.plainLyrics?.trim() || null;
    if (!synced && !plain) return null;
    return { synced, plain, source: 'LRCLIB' };
  };

  const directResult = fromEntry(direct);
  if (directResult) return directResult;

  // Fall back to a fuzzy search and take the best candidate.
  const search = await getJson<LrclibEntry[]>(
    `${BASE}/search?${new URLSearchParams({ artist_name: artist, track_name: title }).toString()}`,
  );
  if (Array.isArray(search) && search.length > 0) {
    const withSynced = search.find((e) => e.syncedLyrics?.trim());
    return fromEntry(withSynced ?? search[0]);
  }

  return null;
}
