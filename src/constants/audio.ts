export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3',
  'm4a',
  'wav',
  'aac',
  'flac',
  'ogg',
  'opus',
  'wma',
] as const;

export type SupportedAudioExtension = (typeof SUPPORTED_AUDIO_EXTENSIONS)[number];

/** AsyncStorage keys (single source of truth). */
export const StorageKeys = {
  songsCache: '@glassmusic/songsCache/v1',
  likedSongs: '@glassmusic/likedSongs/v1',
  playlists: '@glassmusic/playlists/v1',
  settings: '@glassmusic/settings/v1',
  lastPlayed: '@glassmusic/lastPlayed/v1',
  queue: '@glassmusic/queue/v1',
} as const;

export const DEFAULT_SETTINGS = {
  glass: {
    transparency: 0.6,
    blurIntensity: 60,
    backgroundOpacity: 0.35,
  },
  playback: {
    crossfade: false,
    resumeLastPlayed: true,
    autoPlayOnLaunch: false,
  },
  library: {
    showHiddenAudio: false,
  },
  theme: {
    themeId: 'aurora',
    customBackgroundUri: undefined as string | undefined,
    customBackgroundDim: 0.45,
  },
};
