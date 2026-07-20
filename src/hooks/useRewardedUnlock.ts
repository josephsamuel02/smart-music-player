import { useCallback, useEffect, useRef, useState } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';

/**
 * Wraps the library's `useRewardedAd` into a simple "watch a video to unlock X"
 * flow:
 *   - does NOT auto-load on mount (loads on-demand when user clicks)
 *   - when user clicks "Load", ad loads and plays AUTOMATICALLY when ready
 *   - does NOT preload after ad closes (user must click again)
 *   - calls `onEarned` exactly once when the user actually earns the reward
 */
export function useRewardedUnlock(adUnitId: string, onEarned: () => void) {
  const { isLoaded, isClosed, isEarnedReward, load, show } = useRewardedAd(adUnitId);
  const [isLoading, setIsLoading] = useState(false);

  const onEarnedRef = useRef(onEarned);
  onEarnedRef.current = onEarned;
  const firedRef = useRef(false);
  const shouldAutoShowRef = useRef(false);

  // Grant the reward once per earn; reset the latch when state cycles back.
  useEffect(() => {
    if (isEarnedReward && !firedRef.current) {
      firedRef.current = true;
      onEarnedRef.current();
    } else if (!isEarnedReward) {
      firedRef.current = false;
    }
  }, [isEarnedReward]);

  // Auto-show ad when it finishes loading (if user clicked Load)
  useEffect(() => {
    if (isLoaded && isLoading && shouldAutoShowRef.current) {
      setIsLoading(false);
      shouldAutoShowRef.current = false;
      show();
    }
  }, [isLoaded, isLoading, show]);

  // Reset loading state when closed
  useEffect(() => {
    if (isClosed) {
      setIsLoading(false);
      shouldAutoShowRef.current = false;
    }
  }, [isClosed]);

  const present = useCallback(() => {
    if (isLoaded) {
      // Ad already loaded, show it immediately
      show();
    } else if (!isLoading) {
      // Start loading the ad and flag to auto-show when ready
      setIsLoading(true);
      shouldAutoShowRef.current = true;
      load();
    }
  }, [isLoaded, isLoading, show, load]);

  return { isLoaded, isLoading, present };
}
