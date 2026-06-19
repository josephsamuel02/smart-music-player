import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { useStatsStore } from '@/store/statsStore';

/** Module-level ref to the live player so non-root consumers can call seek. */
let seekFn: ((seconds: number) => void) | null = null;

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

  const loadedSongIdRef = useRef<string | null>(null);
  const lastFinishHandledRef = useRef<string | null>(null);
  // Timestamp of the most recent track swap. Used to ignore a stale
  // `didJustFinish` that the native player can emit right after `replace`.
  const lastReplaceAtRef = useRef<number>(0);
  // Tracks which song id has already been counted for the current load, so a
  // pause/resume of the same track doesn't inflate the play count.
  const countedSongIdRef = useRef<string | null>(null);

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
      return;
    }
    if (loadedSongIdRef.current === current.id) return;
    loadedSongIdRef.current = current.id;
    lastFinishHandledRef.current = null;
    lastReplaceAtRef.current = Date.now();
    countedSongIdRef.current = null;

    try {
      player.replace({ uri: current.uri });
      player.setActiveForLockScreen?.(true, {
        title: current.title,
        artist: current.artist,
        albumTitle: current.album,
        artworkUrl: current.artwork,
      });
      if (isPlaying) {
        player.play();
        if (countedSongIdRef.current !== current.id) {
          countedSongIdRef.current = current.id;
          recordPlay(current.id);
        }
      }
    } catch {
      const nextId = onTrackFinished();
      if (!nextId) setIsPlaying(false);
    }
  }, [current, isPlaying, player, onTrackFinished, setIsPlaying, recordPlay]);

  // 3) Push play/pause toggles down to the player.
  useEffect(() => {
    if (!current) return;
    try {
      if (isPlaying) {
        player.play();
        // Count a play the first time this loaded track starts.
        if (countedSongIdRef.current !== current.id) {
          countedSongIdRef.current = current.id;
          recordPlay(current.id);
        }
      } else {
        player.pause();
      }
    } catch {
      // ignore
    }
  }, [isPlaying, current, player, recordPlay]);

  // 4) Mirror the player position/duration into the store.
  useEffect(() => {
    if (status?.isLoaded) {
      setPosition(status.currentTime ?? 0, status.duration ?? 0);
    }
  }, [status, setPosition]);

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

  // 5) Keep state honest if the OS pauses us in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && current && isPlaying) {
        try {
          player.play();
        } catch {
          // ignore
        }
      }
    });
    return () => sub.remove();
  }, [current, isPlaying, player]);

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
