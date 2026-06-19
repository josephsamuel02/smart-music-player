import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { getWidgetSnapshot, renderWidgetByName } from '@/services/WidgetService';

/**
 * Headless handler invoked by the OS for widget lifecycle/click events.
 * Renders the requested widget from the persisted snapshot. Playback click
 * actions use OPEN_URI deep links, which Android handles by launching the app
 * (parsed in `useWidgetBridge`), so no work is needed here for clicks.
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
    case 'WIDGET_CLICK':
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
