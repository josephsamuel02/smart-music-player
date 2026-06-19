import React from 'react';
import { MusicWidgetLarge, MusicWidgetMedium, MusicWidgetSmall } from './MusicWidgets';
import type { WidgetData } from './widgetData';

/**
 * Maps a registered widget name to its rendered JSX. Kept in its own module so
 * the (native) `react-native-android-widget` primitives are only pulled in
 * when actually rendering a widget - never at app start.
 */
export function renderWidgetByName(name: string, data: WidgetData) {
  switch (name) {
    case 'MusicSmall':
      return <MusicWidgetSmall data={data} />;
    case 'MusicMedium':
      return <MusicWidgetMedium data={data} />;
    case 'MusicLarge':
    default:
      return <MusicWidgetLarge data={data} />;
  }
}
