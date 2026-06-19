import 'expo-router/entry';
import { Platform } from 'react-native';

// Register the Android home-screen widget task handler. Guarded + wrapped so a
// build without the native widget module (e.g. Expo Go or a not-yet-rebuilt
// dev client) never crashes at startup - widgets are simply disabled.
if (Platform.OS === 'android') {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./widget-task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Native widget module not present in this build.
  }
}
