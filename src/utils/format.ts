/** Format a duration (in seconds) into `m:ss` or `h:mm:ss`. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s.toString().padStart(2, '0');
  if (h > 0) {
    const mm = m.toString().padStart(2, '0');
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
}

/** Friendlier numbers for short labels, e.g. 12 songs / 1.2K songs. */
export function formatCount(n: number, singular: string, plural?: string): string {
  const word = n === 1 ? singular : plural ?? `${singular}s`;
  if (n < 1000) return `${n} ${word}`;
  return `${(n / 1000).toFixed(1)}K ${word}`;
}

/** Parse "Artist - Title" or "Artist - Album - Title" out of a filename. */
export function parseFilenameForMetadata(
  filename: string,
): { title?: string; artist?: string; album?: string } {
  const base = filename.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/_/g, ' ').trim();
  const parts = cleaned.split(/\s*[-–—]\s*/);
  if (parts.length === 1) return { title: parts[0] };
  if (parts.length === 2) return { artist: parts[0], title: parts[1] };
  return { artist: parts[0], album: parts[1], title: parts.slice(2).join(' - ') };
}

/** Last path segment from a file or directory URI. */
export function basename(path: string): string {
  if (!path) return '';
  const clean = path.replace(/[\\/]+$/, '');
  const idx = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
  return idx < 0 ? clean : clean.slice(idx + 1);
}

/** Parent directory of a file URI (without trailing slash). */
export function dirname(path: string): string {
  if (!path) return '';
  const idx = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return idx <= 0 ? path : path.slice(0, idx);
}
