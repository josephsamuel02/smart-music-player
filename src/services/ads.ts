import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { ADS_ENABLED } from '@/constants/ads';

let initStarted = false;

/**
 * Initialize the Google Mobile Ads SDK once at app start. Safe to call more
 * than once; subsequent calls are ignored. Failures are swallowed so a missing
 * config / no-network situation never blocks app startup.
 */
export async function initializeAds(): Promise<void> {
  if (!ADS_ENABLED || initStarted) return;
  initStarted = true;
  try {
    await mobileAds().setRequestConfiguration({
      // Keep served ads family-friendly for a music player.
      maxAdContentRating: MaxAdContentRating.PG,
    });
    await mobileAds().initialize();
  } catch {
    // SDK not available / init failed - ads simply won't show.
  }
}
