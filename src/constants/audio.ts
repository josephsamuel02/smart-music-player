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

/** AsyncStorage keys (single source of truth) */
export const StorageKeys = {
  songsCache: '@smartmusic/songsCache/v1',
  likedSongs: '@smartmusic/likedSongs/v1',
  playlists: '@smartmusic/playlists/v1',
  settings: '@smartmusic/settings/v1',
  lastPlayed: '@smartmusic/lastPlayed/v1',
  queue: '@smartmusic/queue/v1',
  lyrics: '@smartmusic/lyrics/v1',
  playStats: '@smartmusic/playStats/v1',
  widgetSnapshot: '@smartmusic/widgetSnapshot/v1',
  rewards: '@smartmusic/rewards/v1',
} as const;

export const DEFAULT_SETTINGS = {
  glass: {
    transparency: 0.57,
    blurIntensity: 0,
    backgroundOpacity: 0.34,
  },
  playback: {
    crossfade: false,
    resumeLastPlayed: true,
    autoPlayOnLaunch: false,
    pauseOnHeadphonesDisconnect: true,
  },
  library: {
    showHiddenAudio: false,
  },
  theme: {
    themeId: 'aurora',
    backgroundId: 'default',
    customBackgroundUri: undefined as string | undefined,
    customBackgroundDim: 0.45,
  },
  equalizer: {
    enabled: false,
    preset: 'flat',
    gains: [0, 0, 0, 0, 0],
  },
};
