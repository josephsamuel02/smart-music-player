import 'expo-router/entry';
import { Platform } from 'react-native';

// Register the Android home-screen widget task handler. Guarded to Android so
// the native module is never touched on iOS / web.
if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widget-task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
