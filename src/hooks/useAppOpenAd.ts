import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ADS_ENABLED, APP_OPEN_MIN_BACKGROUND_MS } from '@/constants/ads';
import { preloadAppOpenAd, showAppOpenAdIfAvailable } from '@/services/appOpenAd';

/**
 * Drives the app-open ad: preloads one at startup and shows it when the user
 * returns to the app after it's been backgrounded for a moment.
 *
 * We intentionally only show on a background -> foreground transition (a "warm"
 * resume), not on the very first cold launch - that avoids interrupting the
 * boot sequence and showing an ad before one has had time to load. A minimum
 * background duration filters out quick task-switches and returns from a
 * tapped inline ad's browser tab.
 */
export function useAppOpenAd() {
  const appState = useRef(AppState.currentState);
  const backgroundedAt = useRef(0);

  useEffect(() => {
    if (!ADS_ENABLED) return;

    // Have an ad ready for the first resume.
    preloadAppOpenAd();

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;

      if (next.match(/inactive|background/)) {
        backgroundedAt.current = Date.now();
        return;
      }

      if (next === 'active' && prev.match(/inactive|background/)) {
        const awayFor = Date.now() - backgroundedAt.current;
        if (awayFor >= APP_OPEN_MIN_BACKGROUND_MS) {
          void showAppOpenAdIfAvailable();
        }
      }
    });

    return () => sub.remove();
  }, []);
}
