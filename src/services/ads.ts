import mobileAds, { MaxAdContentRating, AdsConsent } from "react-native-google-mobile-ads";
import { ADS_ENABLED } from "@/constants/ads";
import { useSettingsStore } from "@/store/settingsStore";

let initStarted = false;

/**
 * Whether ads should currently be shown. False when the master switch is off or
 * the user is inside a "remove ads" reward window. Read this (not the raw
 * `ADS_ENABLED` constant) before showing any ad.
 */
export function adsCurrentlyEnabled(): boolean {
  if (!ADS_ENABLED) return false;
  return Date.now() >= useSettingsStore.getState().adFreeUntil;
}

/**
 * Initialize the Google Mobile Ads SDK once at app start. Safe to call more
 * than once; subsequent calls are ignored. Failures are swallowed so a missing
 * config / no-network situation never blocks app startup.
 * 
 * GDPR Compliance: Only initializes if user consent allows or if consent is not required.
 */
export async function initializeAds(): Promise<void> {
  if (!ADS_ENABLED || initStarted) return;
  initStarted = true;
  
  try {
    // Check consent status before initializing ads
    const consentInfo = await AdsConsent.getConsentInfo();
    
    if (!consentInfo.canRequestAds) {
      console.log('[Ads] Consent not granted or required - skipping ads initialization');
      return;
    }

    console.log('[Ads] Consent allows ads - initializing SDK...');

    await mobileAds().setRequestConfiguration({
      // Keep served ads family-friendly for a music player.
      maxAdContentRating: MaxAdContentRating.PG,
    });
    
    await mobileAds().initialize();
    console.log('[Ads] SDK initialized successfully');
    
  } catch (error) {
    // SDK not available / init failed - ads simply won't show.
    console.warn('[Ads] Failed to initialize:', error);
  }
}
