import { AppOpenAd, AdEventType } from 'react-native-google-mobile-ads';
import {
  ADS_ENABLED,
  APP_OPEN_AD_UNIT_ID,
  APP_OPEN_EXPIRY_MS,
  APP_OPEN_MIN_INTERVAL_MS,
} from '@/constants/ads';
import { adsCurrentlyEnabled } from '@/services/ads';

/**
 * App-open ad manager.
 *
 * Keeps a single preloaded `AppOpenAd` ready and shows it when the app is
 * brought back to the foreground (see `useAppOpenAd`). Google expires these
 * ads after ~4h, and we additionally rate-limit how often one can appear so
 * the user isn't bombarded. All failures are swallowed - if no ad is ready the
 * app just continues normally.
 */

let ad: AppOpenAd | null = null;
let loadedAt = 0;
let loading = false;
let showing = false;
let lastShownAt = 0;

/** True when we hold an ad that's loaded and not past Google's expiry window. */
function isFresh(): boolean {
  return !!ad && ad.loaded && Date.now() - loadedAt < APP_OPEN_EXPIRY_MS;
}

/** Preload an app-open ad in the background (no-op if one is already ready/loading). */
export function preloadAppOpenAd(): void {
  if (!ADS_ENABLED || loading || isFresh()) return;

  loading = true;
  const next = AppOpenAd.createForAdRequest(APP_OPEN_AD_UNIT_ID);

  next.addAdEventListener(AdEventType.LOADED, () => {
    loading = false;
    loadedAt = Date.now();
    ad = next;
  });
  next.addAdEventListener(AdEventType.ERROR, () => {
    loading = false;
    ad = null;
    next.removeAllListeners();
  });

  try {
    next.load();
  } catch {
    loading = false;
  }
}

/**
 * Show the app-open ad if one is ready, we're not already showing one, and the
 * frequency cap has elapsed. Reloads a fresh ad afterwards. Safe to call any
 * time; it self-guards.
 */
export async function showAppOpenAdIfAvailable(): Promise<void> {
  if (!adsCurrentlyEnabled() || showing) return;
  if (Date.now() - lastShownAt < APP_OPEN_MIN_INTERVAL_MS) return;

  if (!isFresh()) {
    preloadAppOpenAd();
    return;
  }

  const current = ad!;
  showing = true;

  const finish = () => {
    showing = false;
    lastShownAt = Date.now();
    ad = null;
    loadedAt = 0;
    current.removeAllListeners();
    // Warm up the next one for the following resume.
    preloadAppOpenAd();
  };

  current.addAdEventListener(AdEventType.CLOSED, finish);
  current.addAdEventListener(AdEventType.ERROR, finish);

  try {
    await current.show();
  } catch {
    finish();
  }
}
