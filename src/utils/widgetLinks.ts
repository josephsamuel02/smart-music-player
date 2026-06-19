/**
 * Deep links used by the home-screen widgets to drive playback. Widgets fire
 * these via the `OPEN_URI` click action; the app parses them on launch and on
 * `Linking` url events (see `useWidgetBridge`).
 */
const SCHEME = 'smartmusic';

export type WidgetAction =
  | { action: 'playpause' }
  | { action: 'next' }
  | { action: 'previous' }
  | { action: 'play'; songId: string }
  | { action: 'open' };

export function buildWidgetUri(a: WidgetAction): string {
  const params = new URLSearchParams({ wa: a.action });
  if (a.action === 'play') params.set('id', a.songId);
  return `${SCHEME}://widget?${params.toString()}`;
}

/** Parse a deep link URL into a widget action, or null if it isn't one. */
export function parseWidgetUri(url: string): WidgetAction | null {
  try {
    const qIndex = url.indexOf('?');
    if (qIndex < 0) return null;
    if (!url.toLowerCase().startsWith(`${SCHEME}://`)) return null;
    const params = new URLSearchParams(url.slice(qIndex + 1));
    const wa = params.get('wa');
    switch (wa) {
      case 'playpause':
        return { action: 'playpause' };
      case 'next':
        return { action: 'next' };
      case 'previous':
        return { action: 'previous' };
      case 'open':
        return { action: 'open' };
      case 'play': {
        const id = params.get('id');
        return id ? { action: 'play', songId: id } : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
