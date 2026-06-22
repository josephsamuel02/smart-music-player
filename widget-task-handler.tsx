import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { StorageKeys } from '@/constants/audio';
import { StorageService } from '@/services/StorageService';
import { buildWidgetData, getWidgetSnapshot } from '@/services/WidgetService';
import { useMusicStore } from '@/store/musicStore';
import { WidgetClickAction } from '@/utils/widgetLinks';
import { renderWidgetByName } from '@/widgets/renderWidget';
import type { WidgetData } from '@/widgets/widgetData';

/**
 * Runs the transport action triggered by a widget button.
 *
 * Because the click action is a custom string (not OPEN_URI/OPEN_APP), Android
 * dispatches it to this headless task *without* opening the app. When the app
 * process is still alive (e.g. music playing in the background) this task runs
 * in the same JS runtime, so mutating the music store drives the live audio
 * engine directly. When the process is dead there is no playback to control, so
 * we just leave the saved snapshot untouched.
 */
async function applyControl(action: string, songId?: string): Promise<WidgetData> {
  const store = useMusicStore.getState();
  // A populated library means we're sharing the running app's JS runtime.
  const live = store.songs.length > 0;

  if (live) {
    switch (action) {
      case WidgetClickAction.PlayPause:
        store.setIsPlaying(!store.isPlaying);
        break;
      case WidgetClickAction.Next:
        store.next();
        break;
      case WidgetClickAction.Previous:
        store.previous();
        break;
      case WidgetClickAction.Play:
        if (songId && store.songsById[songId]) store.playFromList(store.songs, songId);
        break;
      default:
        break;
    }
    const data = buildWidgetData();
    await StorageService.set(StorageKeys.widgetSnapshot, data);
    return data;
  }

  // No live runtime — nothing is playing, so just re-render the last snapshot.
  return getWidgetSnapshot();
}

/**
 * Headless handler invoked by the OS for widget lifecycle + click events.
 * Lifecycle events render from the persisted snapshot; click events run the
 * transport action in the background and re-render with the new state.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const name = props.widgetInfo.widgetName;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await getWidgetSnapshot();
      props.renderWidget(renderWidgetByName(name, data));
      break;
    }
    case 'WIDGET_CLICK': {
      const action = props.clickAction ?? '';
      const songId =
        typeof props.clickActionData?.songId === 'string'
          ? (props.clickActionData.songId as string)
          : undefined;
      const data = await applyControl(action, songId);
      props.renderWidget(renderWidgetByName(name, data));
      break;
    }
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
