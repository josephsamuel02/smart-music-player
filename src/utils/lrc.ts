export type LyricLine = {
  /** Start time in seconds, or null for un-timed plain lines. */
  time: number | null;
  text: string;
};

const TIME_TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

/** True if the text contains at least one `[mm:ss]` style timestamp. */
export function isSyncedLyrics(text: string): boolean {
  TIME_TAG.lastIndex = 0;
  return TIME_TAG.test(text);
}

/**
 * Parse lyrics into displayable lines. LRC timestamps become `time` values
 * (a single line may carry multiple timestamps → multiple emitted lines).
 * Plain text returns lines with `time: null`.
 */
export function parseLyrics(text: string): LyricLine[] {
  if (!text) return [];
  const synced = isSyncedLyrics(text);
  const rawLines = text.split(/\r?\n/);

  if (!synced) {
    return rawLines.map((l) => ({ time: null, text: l }));
  }

  const out: LyricLine[] = [];
  for (const raw of rawLines) {
    const times: number[] = [];
    let match: RegExpExecArray | null;
    TIME_TAG.lastIndex = 0;
    while ((match = TIME_TAG.exec(raw)) !== null) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const fracStr = match[3] ?? '0';
      const frac = parseInt(fracStr, 10) / Math.pow(10, fracStr.length);
      times.push(mins * 60 + secs + frac);
    }
    const content = raw.replace(TIME_TAG, '').trim();
    if (times.length === 0) continue;
    for (const t of times) out.push({ time: t, text: content });
  }

  out.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
  return out;
}

/** Index of the active line for a given playback position (synced lyrics). */
export function activeLineIndex(lines: LyricLine[], positionSeconds: number): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].time;
    if (t == null) continue;
    if (t <= positionSeconds + 0.25) idx = i;
    else break;
  }
  return idx;
}

/** Strip LRC timestamps to plain text (used for copying). */
export function toPlainText(text: string): string {
  if (!text) return '';
  if (!isSyncedLyrics(text)) return text;
  return parseLyrics(text)
    .map((l) => l.text)
    .filter((l) => l.length > 0)
    .join('\n');
}
