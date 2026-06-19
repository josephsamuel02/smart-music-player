export type WidgetSong = {
  id: string;
  title: string;
  artist: string;
};

/** Snapshot of player state the widgets render from (persisted for headless renders). */
export type WidgetData = {
  hasSong: boolean;
  title: string;
  artist: string;
  isPlaying: boolean;
  songs: WidgetSong[];
};

export const EMPTY_WIDGET_DATA: WidgetData = {
  hasSong: false,
  title: 'Nothing playing',
  artist: 'Open Glass Music',
  isPlaying: false,
  songs: [],
};

/** Glassmorphic palette shared across widgets. */
export const WidgetTheme = {
  bg: 'rgba(18, 10, 46, 0.72)',
  bgList: 'rgba(10, 0, 20, 0.55)',
  surface: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.18)',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.65)',
  accent: '#A78BFA',
  accentInk: '#0A0014',
} as const;
