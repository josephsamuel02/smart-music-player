import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * AdMob configuration.
 *
 * In development we always use Google's test ad units so we never serve real
 * ads to ourselves (which violates AdMob policy and can get the account
 * flagged for invalid traffic). Production builds use the real native unit.
 */

/** Real native-advanced ad unit (from the AdMob console). */
const PROD_NATIVE_ANDROID = 'ca-app-pub-5721101134854173/7795019094';

export const NATIVE_AD_UNIT_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({ android: PROD_NATIVE_ANDROID, default: TestIds.NATIVE })!;

/** Master switch for in-app ads. */
export const ADS_ENABLED = true;

/** How often the artwork box swaps over to show an ad. */
export const AD_INTERVAL_MS = 90_000;
/** How long the ad stays visible before flipping back to album art. */
export const AD_VISIBLE_MS = 60_000;
