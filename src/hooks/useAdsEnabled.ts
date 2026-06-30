import { useEffect, useState } from 'react';
import { ADS_ENABLED } from '@/constants/ads';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Reactive version of `adsCurrentlyEnabled()` for components. Returns false when
 * the master switch is off or while a "remove ads" reward window is active, and
 * flips back to true on its own when that window expires.
 */
export function useAdsEnabled(): boolean {
  const adFreeUntil = useSettingsStore((s) => s.adFreeUntil);
  const [now, setNow] = useState(() => Date.now());

  // When ad-free, schedule a single re-check for the moment it expires so ads
  // resume without needing an app restart.
  useEffect(() => {
    if (!ADS_ENABLED) return;
    const remaining = adFreeUntil - Date.now();
    if (remaining <= 0) return;
    const t = setTimeout(() => setNow(Date.now()), remaining + 250);
    return () => clearTimeout(t);
  }, [adFreeUntil]);

  return ADS_ENABLED && now >= adFreeUntil;
}
