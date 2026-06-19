import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useLibraryLoader } from '@/hooks/useLibraryLoader';
import { useLikedStore } from '@/store/likedStore';
import { useLyricsStore } from '@/store/lyricsStore';
import { useMusicStore } from '@/store/musicStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Root layout. Owns:
 *   - global providers (SafeArea, GestureHandler)
 *   - the single audio engine instance (useAudioEngine)
 *   - app-wide async hydration (settings, liked songs, playlists)
 *   - the auto-scan triggered by useLibraryLoader
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppBootstrap />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="player"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="search"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="lyrics"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
            }}
          />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="folder/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="playlist/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppBootstrap() {
  useAudioEngine();
  useLibraryLoader();

  const hydrateLiked = useLikedStore((s) => s.hydrate);
  const hydratePlaylists = usePlaylistStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateLyrics = useLyricsStore((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      // Hydrate settings first so playback prefs are available before we
      // decide whether to auto-play the restored queue.
      await hydrateSettings();
      await Promise.all([hydrateLiked(), hydratePlaylists(), hydrateLyrics()]);

      const settings = useSettingsStore.getState();
      const music = useMusicStore.getState();
      if (
        settings.playback.autoPlayOnLaunch &&
        music.queue.length > 0 &&
        music.currentIndex >= 0
      ) {
        music.setIsPlaying(true);
      }
    })();
  }, [hydrateSettings, hydrateLiked, hydratePlaylists, hydrateLyrics]);

  return null;
}
