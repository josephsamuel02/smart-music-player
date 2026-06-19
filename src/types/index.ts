export type Song = {
  /** MediaLibrary asset id - stable across launches */
  id: string;
  /** Display title (falls back to filename without extension) */
  title: string;
  /** Best-effort artist parsed from filename or metadata */
  artist: string;
  /** Best-effort album parsed from filename or metadata */
  album: string;
  /** Duration in seconds */
  duration: number;
  /** Absolute file URI (file://...) usable by expo-audio */
  uri: string;
  /** Optional local artwork URI (we use a per-folder convention + fallback) */
  artwork?: string;
  /** Parent folder name, used by the Folders screen */
  folder: string;
  /** Parent folder absolute path */
  folderPath: string;
  /** Filename including extension */
  filename: string;
  /** File size in bytes */
  size?: number;
  /** Modification time (ms epoch) */
  modifiedAt?: number;
  /** Creation / date-added time (ms epoch), used by the "Newly added" playlist */
  addedAt?: number;
};

export type Playlist = {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type RepeatMode = 'off' | 'all' | 'one';

export type PlaybackStatus = {
  isLoaded: boolean;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  didJustFinish: boolean;
};

export type SongAction =
  | 'play-next'
  | 'add-to-queue'
  | 'add-to-playlist'
  | 'like'
  | 'share'
  | 'delete';

export type GlassSettings = {
  /** 0..1 - how transparent the glass surfaces should be */
  transparency: number;
  /** 1..100 - blur intensity */
  blurIntensity: number;
  /** 0..1 - tinted background opacity behind the glass */
  backgroundOpacity: number;
};

export type PlaybackSettings = {
  crossfade: boolean;
  resumeLastPlayed: boolean;
  autoPlayOnLaunch: boolean;
};

export type LibrarySettings = {
  showHiddenAudio: boolean;
};

export type ThemeSettings = {
  /** Id of the active theme-colour preset (accent palette). See `src/constants/themes.ts`. */
  themeId: string;
  /** Id of the active background preset (image or mood gradient). See `src/constants/backgrounds.ts`. */
  backgroundId: string;
  /** Optional persisted local URI of a user-picked custom background image.
   *  When set, it replaces the selected background preset at render time. */
  customBackgroundUri?: string;
  /** 0..1 - how much to darken the custom background for readability. */
  customBackgroundDim: number;
};

export type AppSettings = {
  glass: GlassSettings;
  playback: PlaybackSettings;
  library: LibrarySettings;
  theme: ThemeSettings;
};

export type FolderGroup = {
  path: string;
  name: string;
  songCount: number;
  songIds: string[];
};
