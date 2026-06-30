import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useStatsStore } from '@/store/statsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { addAudioBecomingNoisyListener } from '@/services/AudioRoute';

/** Module-level ref to the live player so non-root consumers can call seek. */
let seekFn: ((seconds: number) => void) | null = null;

/** Shape the lock-screen / media notification metadata from a song. */
function lockScreenMetadata(song: {
  title: string;
  artist: string;
  album: string;
  artwork?: string;
}) {
  return {
    title: song.title,
    artist: song.artist,
    albumTitle: song.album,
    artworkUrl: song.artwork,
  };
}

/**
 * Call this from anywhere to seek the active player. Safe to call before the
 * engine has mounted - it just no-ops.
 */
export function seekToSecondsGlobal(seconds: number) {
  seekFn?.(seconds);
}

/**
 * Bridges the imperative expo-audio player to the declarative Zustand store.
 * Mount this hook ONCE at the root of the app (we do it from `app/_layout.tsx`).
 *
 * - Loads/replaces the current track whenever the queue index changes
 * - Pushes play/pause state into the player
 * - Mirrors the player's current time and duration back into the store
 * - Advances the queue on `didJustFinish` (respecting repeat/shuffle)
 * - Configures the audio session for background playback + lock-screen
 */
export function useAudioEngine() {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const current = useMusicStore(selectCurrentSong);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const setPosition = useMusicStore((s) => s.setPosition);
  const onTrackFinished = useMusicStore((s) => s.onTrackFinished);
  const recordPlay = useStatsStore((s) => s.recordPlay);
  const pauseOnDisconnect = useSettingsStore((s) => s.playback.pauseOnHeadphonesDisconnect);

  const loadedSongIdRef = useRef<string | null>(null);
  const lastFinishHandledRef = useRef<string | null>(null);
  // Timestamp of the most recent track swap. Used to ignore a stale
  // `didJustFinish` that the native player can emit right after `replace`.
  const lastReplaceAtRef = useRef<number>(0);
  // Tracks which song id has already been counted for the current load, so a
  // pause/resume of the same track doesn't inflate the play count.
  const countedSongIdRef = useRef<string | null>(null);
  // Whether we currently own the lock-screen / media notification. We arm it
  // while playing and clear it on pause/stop so the notification stays
  // dismissible instead of getting stuck as an ongoing notification.
  const lockScreenActiveRef = useRef(false);

  // 1) Configure audio mode for background playback / lock screen.
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  // 2) Load / replace the active track whenever the current song changes.
  useEffect(() => {
    if (!current) {
      loadedSongIdRef.current = null;
      try {
        player.pause();
      } catch {
        // player may already be released
      }
      // Nothing to play: tear down the media notification so it goes away.
      try {
        if (lockScreenActiveRef.current) {
          player.clearLockScreenControls?.();
          lockScreenActiveRef.current = false;
        }
      } catch {
        // ignore
      }
      return;
    }
    if (loadedSongIdRef.current === current.id) return;
    loadedSongIdRef.current = current.id;
    lastFinishHandledRef.current = null;
    lastReplaceAtRef.current = Date.now();
    countedSongIdRef.current = null;

    try {
      player.replace({ uri: current.uri });
      const meta = lockScreenMetadata(current);
      if (isPlaying) {
        // Arm (or refresh) the media notification only while playing.
        if (lockScreenActiveRef.current) {
          player.updateLockScreenMetadata?.(meta);
        } else {
          player.setActiveForLockScreen?.(true, meta);
          lockScreenActiveRef.current = true;
        }
        player.play();
        if (countedSongIdRef.current !== current.id) {
          countedSongIdRef.current = current.id;
          recordPlay(current.id);
        }
      } else if (lockScreenActiveRef.current) {
        player.updateLockScreenMetadata?.(meta);
      }
    } catch {
      const nextId = onTrackFinished();
      if (!nextId) setIsPlaying(false);
    }
  }, [current, isPlaying, player, onTrackFinished, setIsPlaying, recordPlay]);

  // 3) Push play/pause *toggles* down to the player. This intentionally does
  // NOT depend on `current`: track changes are handled by the loader (effect 2)
  // which starts playback itself, so reacting to `current` here too would fire
  // a redundant second play()/recordPlay on every skip and make next/prev feel
  // stiff. We read the current song live instead.
  useEffect(() => {
    const cur = selectCurrentSong(useMusicStore.getState());
    if (!cur) return;
    try {
      if (isPlaying) {
        // Re-arm the media notification if a previous pause cleared it.
        if (!lockScreenActiveRef.current) {
          player.setActiveForLockScreen?.(true, lockScreenMetadata(cur));
          lockScreenActiveRef.current = true;
        }
        player.play();
        // Count a play the first time this loaded track starts.
        if (countedSongIdRef.current !== cur.id) {
          countedSongIdRef.current = cur.id;
          recordPlay(cur.id);
        }
      } else {
        player.pause();
        // Clear the media notification on pause so it isn't stuck as an
        // ongoing (non-dismissible) notification - the user can swipe it away.
        if (lockScreenActiveRef.current) {
          player.clearLockScreenControls?.();
          lockScreenActiveRef.current = false;
        }
      }
    } catch {
      // ignore
    }
  }, [isPlaying, player, recordPlay]);

  // 4) Mirror the player position/duration into the store.
  useEffect(() => {
    if (status?.isLoaded) {
      setPosition(status.currentTime ?? 0, status.duration ?? 0);
    }
  }, [status, setPosition]);

  // 4c) Pause when headphones / Bluetooth audio disconnect. expo-audio's
  // ExoPlayer is built without `handleAudioBecomingNoisy`, so it keeps playing
  // out of the speaker on an output-route change. We listen for the OS
  // "becoming noisy" broadcast (via the local expo-audio-route native module)
  // and pause ourselves, which also tears down the media notification.
  useEffect(() => {
    if (!pauseOnDisconnect) return;
    const remove = addAudioBecomingNoisyListener(() => {
      const store = useMusicStore.getState();
      if (store.isPlaying) store.setIsPlaying(false);
    });
    return remove;
  }, [pauseOnDisconnect]);

  // 4b) Advance the queue when a track finishes. We use a direct playback event
  // listener (not the derived `status`) so this only runs on real "finished"
  // events from the native player - reacting to `status` in an effect would
  // re-fire on every React re-render with a stale `didJustFinish`, causing the
  // queue to skip to the end instead of advancing one track at a time.
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s: { didJustFinish?: boolean }) => {
      if (!s?.didJustFinish) return;

      const finishedId = loadedSongIdRef.current;
      if (!finishedId) return;
      // Ignore a stale "finished" emitted right after we swapped tracks.
      if (Date.now() - lastReplaceAtRef.current < 800) return;
      if (lastFinishHandledRef.current === finishedId) return;
      lastFinishHandledRef.current = finishedId;

      const nextId = useMusicStore.getState().onTrackFinished();
      if (!nextId) {
        // End of queue (repeat off): stop at the start of the last track.
        try {
          player.pause();
          player.seekTo(0);
        } catch {
          // ignore
        }
        return;
      }
      if (nextId === finishedId) {
        // Repeat-one: replay the same track. Clear the guard so the next
        // finish is handled again, and restart playback ourselves since the
        // loader effect won't fire (the current song id is unchanged).
        lastFinishHandledRef.current = null;
        lastReplaceAtRef.current = Date.now();
        try {
          player.seekTo(0);
          player.play();
        } catch {
          // ignore
        }
      }
      // Otherwise a different song is now current; the loader effect (2) picks
      // it up and starts playback.
    });
    return () => sub.remove();
  }, [player]);

  // 5) When returning to the foreground, resume ONLY if we were genuinely
  // paused mid-track. We must never call play() on a track that finished while
  // backgrounded - ExoPlayer is in an ENDED state and play() would restart it
  // from 0 (the "song starts afresh on unlock" bug). We also skip it when the
  // player is already playing. State is read live so the listener doesn't need
  // to re-subscribe on every track change.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const store = useMusicStore.getState();
      if (!store.isPlaying || store.currentIndex < 0) return;
      try {
        const dur = player.duration ?? 0;
        const pos = player.currentTime ?? 0;
        const atEnd = dur > 0 && pos >= dur - 0.75;
        if (player.isLoaded && !player.playing && !atEnd) {
          player.play();
        }
      } catch {
        // ignore
      }
    });
    return () => sub.remove();
  }, [player]);

  // 6) Expose seek globally for consumers like the full-screen player.
  useEffect(() => {
    seekFn = (seconds: number) => {
      try {
        player.seekTo(Math.max(0, seconds));
      } catch {
        // ignore
      }
    };
    return () => {
      seekFn = null;
    };
  }, [player]);
}
