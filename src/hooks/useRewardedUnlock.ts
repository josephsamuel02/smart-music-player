import { useCallback, useEffect, useRef } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

/**
 * Wraps the library's `useRewardedAd` into a simple "watch a video to unlock X"
 * flow:
 *   - auto-loads an ad on mount and reloads after each one closes,
 *   - calls `onEarned` exactly once when the user actually earns the reward
 *     (the only AdMob-compliant moment to grant it),
 *   - exposes `isLoaded` (for button state) and `present()` to show the ad.
 */
export function useRewardedUnlock(adUnitId: string, onEarned: () => void) {
  const { isLoaded, isClosed, isEarnedReward, load, show } = useRewardedAd(adUnitId);

  const onEarnedRef = useRef(onEarned);
  onEarnedRef.current = onEarned;
  const firedRef = useRef(false);

  // Load on mount and whenever the ad unit changes.
  useEffect(() => {
    load();
  }, [load]);

  // Reload a fresh ad once the previous one is dismissed.
  useEffect(() => {
    if (isClosed) load();
  }, [isClosed, load]);

  // Grant the reward once per earn; reset the latch when state cycles back.
  useEffect(() => {
    if (isEarnedReward && !firedRef.current) {
      firedRef.current = true;
      onEarnedRef.current();
    } else if (!isEarnedReward) {
      firedRef.current = false;
    }
  }, [isEarnedReward]);

  const present = useCallback(() => {
    if (isLoaded) show();
  }, [isLoaded, show]);

  return { isLoaded, present };
}
