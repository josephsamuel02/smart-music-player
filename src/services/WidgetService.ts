import React from 'react';
import { Platform } from 'react-native';
import { StorageKeys } from '@/constants/audio';
import { StorageService } from '@/services/StorageService';
import { selectCurrentSong, useMusicStore } from '@/store/musicStore';
import { EMPTY_WIDGET_DATA, type WidgetData } from '@/widgets/widgetData';
import {
  MusicWidgetLarge,
  MusicWidgetMedium,
  MusicWidgetSmall,
} from '@/widgets/MusicWidgets';

const WIDGET_NAMES = ['MusicSmall', 'MusicMedium', 'MusicLarge'] as const;
const MAX_LIST = 60;

const isAndroid = Platform.OS === 'android';

/** Build the current widget snapshot from the live music store. */
export function buildWidgetData(): WidgetData {
  const state = useMusicStore.getState();
  const current = selectCurrentSong(state);
  const songs = state.songs.slice(0, MAX_LIST).map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
  }));

  return {
    hasSong: !!current,
    title: current?.title ?? EMPTY_WIDGET_DATA.title,
    artist: current?.artist ?? EMPTY_WIDGET_DATA.artist,
    isPlaying: state.isPlaying,
    songs,
  };
}

export async function getWidgetSnapshot(): Promise<WidgetData> {
  return StorageService.get<WidgetData>(StorageKeys.widgetSnapshot, EMPTY_WIDGET_DATA);
}

/** Render the correct widget component for a given registered widget name. */
export function renderWidgetByName(name: string, data: WidgetData) {
  switch (name) {
    case 'MusicSmall':
      return React.createElement(MusicWidgetSmall, { data });
    case 'MusicMedium':
      return React.createElement(MusicWidgetMedium, { data });
    case 'MusicLarge':
    default:
      return React.createElement(MusicWidgetLarge, { data });
  }
}

let lastSerialized = '';

/**
 * Persist a fresh snapshot and push it to every on-screen widget. Cheap to
 * call often: it bails out when nothing visible to the widgets changed.
 */
export async function updateWidgets(force = false): Promise<void> {
  if (!isAndroid) return;
  const data = buildWidgetData();
  const serialized = JSON.stringify(data);
  if (!force && serialized === lastSerialized) return;
  lastSerialized = serialized;

  await StorageService.set(StorageKeys.widgetSnapshot, data);

  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    await Promise.all(
      WIDGET_NAMES.map((widgetName) =>
        requestWidgetUpdate({
          widgetName,
          renderWidget: () => renderWidgetByName(widgetName, data),
          widgetNotFound: () => {
            // No instance of this widget on the home screen - nothing to do.
          },
        }),
      ),
    );
  } catch {
    // Native module unavailable (e.g. Expo Go / iOS) - snapshot is still saved.
  }
}
