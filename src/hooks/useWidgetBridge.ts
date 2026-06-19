import { useEffect } from 'react';
import { useMusicStore } from '@/store/musicStore';
import { updateWidgets } from '@/services/WidgetService';

/**
 * Keeps the Android home-screen widgets in sync with playback. Widget taps are
 * delivered as deep links and handled by the `app/widget.tsx` route. Mount once
 * at the app root.
 */
export function useWidgetBridge() {
  useEffect(() => {
    void updateWidgets(true);
    const unsubscribe = useMusicStore.subscribe(() => {
      void updateWidgets();
    });
    return unsubscribe;
  }, []);
}
