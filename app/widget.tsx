import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useMusicStore } from '@/store/musicStore';

/**
 * Invisible deep-link target for home-screen widget taps
 * (`smartmusic://widget?wa=...`). Performs the requested playback action then
 * gets out of the way - returning to the previous screen if the app was
 * already open, or landing on a sensible screen on a cold launch.
 */
function leave(toPlayer = false) {
  if (toPlayer) {
    router.replace('/player');
  } else if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/songs');
  }
}

function playSongById(songId: string, attempt = 0) {
  const store = useMusicStore.getState();
  // Library may still be hydrating on a cold launch from a widget tap.
  if (store.songs.length === 0 && attempt < 20) {
    setTimeout(() => playSongById(songId, attempt + 1), 300);
    return;
  }
  if (store.songsById[songId]) {
    store.playFromList(store.songs, songId);
  }
}

export default function WidgetActionScreen() {
  const { wa, id } = useLocalSearchParams<{ wa?: string; id?: string }>();

  useEffect(() => {
    const store = useMusicStore.getState();
    switch (wa) {
      case 'playpause':
        store.setIsPlaying(!store.isPlaying);
        leave();
        break;
      case 'next':
        store.next();
        leave();
        break;
      case 'previous':
        store.previous();
        leave();
        break;
      case 'play':
        if (id) playSongById(id);
        leave(true);
        break;
      case 'open':
      default:
        leave(true);
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
