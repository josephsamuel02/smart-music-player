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
/** Real app-open ad unit (from the AdMob console). */
const PROD_APP_OPEN_ANDROID = 'ca-app-pub-5721101134854173/9845513070';
/** Real rewarded unit backing the "remove ads for a day" reward. */
const PROD_REWARDED_REMOVE_ADS_ANDROID = 'ca-app-pub-5721101134854173/9920132323';
/** Real rewarded unit backing the "unlock custom background" reward. */
const PROD_REWARDED_BACKGROUND_ANDROID = 'ca-app-pub-5721101134854173/3633925576';

export const NATIVE_AD_UNIT_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({ android: PROD_NATIVE_ANDROID, default: TestIds.NATIVE })!;

export const APP_OPEN_AD_UNIT_ID = __DEV__
  ? TestIds.APP_OPEN
  : Platform.select({ android: PROD_APP_OPEN_ANDROID, default: TestIds.APP_OPEN })!;

export const REWARDED_REMOVE_ADS_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({ android: PROD_REWARDED_REMOVE_ADS_ANDROID, default: TestIds.REWARDED })!;

export const REWARDED_BACKGROUND_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({ android: PROD_REWARDED_BACKGROUND_ANDROID, default: TestIds.REWARDED })!;

/** Master switch for in-app ads. */
export const ADS_ENABLED = true;

/** How long the "remove ads" reward keeps the whole app ad-free. */
export const AD_FREE_DURATION_MS = 24 * 60 * 60 * 1000;

/** How often the artwork box swaps over to show an ad. */
export const AD_INTERVAL_MS = 90_000;
/** How long the ad stays visible before flipping back to album art. */
export const AD_VISIBLE_MS = 60_000;

/**
 * App-open ad tuning.
 *  - Google expires app-open ads after ~4h, so a cached ad past that is stale.
 *  - We cap how often one can appear so resuming the app repeatedly (or coming
 *    back from tapping an inline ad) doesn't spam full-screen ads.
 */
export const APP_OPEN_EXPIRY_MS = 4 * 60 * 60 * 1000;
export const APP_OPEN_MIN_INTERVAL_MS = 4 * 60 * 1000;
/**
 * Minimum time the app must have been backgrounded before a resume is allowed
 * to show an app-open ad. Keeps quick app-switches (and returns from a tapped
 * ad's browser tab) from triggering one.
 */
export const APP_OPEN_MIN_BACKGROUND_MS = 5 * 1000;
