import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useMusicStore } from '@/store/musicStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ensureMediaPermission } from '@/utils/permissions';
import { scanDeviceForSongs } from '@/services/AudioScanner';

/**
 * Manages library lifecycle: hydrates from cache, requests permissions,
 * triggers a fresh scan on launch + on foreground returns (so granting
 * permission via the system Settings auto-refreshes the library).
 */
export function useLibraryLoader() {
  const setSongs = useMusicStore((s) => s.setSongs);
  const setLoadState = useMusicStore((s) => s.setLoadState);
  const hydrateMusic = useMusicStore((s) => s.hydrateFromStorage);
  const showHidden = useSettingsStore((s) => s.library.showHiddenAudio);
  const scanningRef = useRef(false);

  const scanNow = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    try {
      const perm = await ensureMediaPermission();
      if (!perm.granted) {
        setLoadState('permission-denied', 'Permission to access your music library was denied.');
        return;
      }
      const hadSongs = useMusicStore.getState().songs.length > 0;
      // Only show the full-screen spinner on a cold scan. If we already have
      // cached songs to render, keep the list visible while we refresh.
      if (!hadSongs) setLoadState('scanning');
      const songs = await scanDeviceForSongs({ includeHidden: showHidden });
      setSongs(songs);
      setLoadState('ready');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to scan music library.';
      setLoadState('error', message);
    } finally {
      scanningRef.current = false;
    }
  }, [setSongs, setLoadState, showHidden]);

  // First launch: hydrate cache → fresh scan.
  // The `showHidden` dep also re-scans whenever the user flips that setting.
  useEffect(() => {
    let mounted = true;
    (async () => {
      await hydrateMusic();
      if (!mounted) return;
      await scanNow();
    })();
    return () => {
      mounted = false;
    };
  }, [hydrateMusic, scanNow]);

  // Re-scan whenever the app returns to the foreground. This is what makes
  // the library auto-refresh after the user grants permission in the system
  // Settings app and comes back to Smart Music Player.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void scanNow();
    });
    return () => sub.remove();
  }, [scanNow]);

  return { scanNow };
}
