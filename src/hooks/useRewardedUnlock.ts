import { useCallback, useEffect, useRef, useState } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

/**
 * Wraps the library's `useRewardedAd` into a simple "watch a video to unlock X"
 * flow:
 *   - does NOT auto-load on mount (loads on-demand when user clicks),
 *   - calls `onEarned` exactly once when the user actually earns the reward
 *     (the only AdMob-compliant moment to grant it),
 *   - exposes `isLoading` (for loading state), `isLoaded` (for button state) and `present()` to show the ad.
 *   - auto-closes the ad after reward is earned
 */
export function useRewardedUnlock(adUnitId: string, onEarned: () => void) {
  const { isLoaded, isClosed, isEarnedReward, load, show } = useRewardedAd(adUnitId);
  const [isLoading, setIsLoading] = useState(false);

  const onEarnedRef = useRef(onEarned);
  onEarnedRef.current = onEarned;
  const firedRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  // Grant the reward once per earn; reset the latch when state cycles back.
  useEffect(() => {
    if (isEarnedReward && !firedRef.current) {
      firedRef.current = true;
      onEarnedRef.current();
    } else if (!isEarnedReward) {
      firedRef.current = false;
    }
  }, [isEarnedReward]);

  // Track loading state
  useEffect(() => {
    if (isLoaded && isLoading) {
      setIsLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [isLoaded, isLoading]);

  // Reset loading state when closed
  useEffect(() => {
    if (isClosed) {
      setIsLoading(false);
    }
  }, [isClosed]);

  const present = useCallback(() => {
    if (isLoaded) {
      // Ad already loaded, show it immediately
      show();
    } else if (!isLoading) {
      // Start loading the ad
      setIsLoading(true);
      load();
    }
  }, [isLoaded, isLoading, show, load]);

  // Load a fresh ad after the previous one closes (for next time)
  useEffect(() => {
    if (isClosed && hasLoadedOnceRef.current) {
      // Preload for next use after user has interacted once
      load();
    }
  }, [isClosed, load]);

  return { isLoaded, isLoading, present };
}