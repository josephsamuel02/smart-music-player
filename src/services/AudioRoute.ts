import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Bridge to the local `expo-audio-route` native module. It fires when Android
 * audio "becomes noisy" - i.e. headphones / Bluetooth audio were unplugged and
 * sound is about to come out of the speaker. We use this to optionally pause
 * playback (expo-audio's player keeps playing through the speaker otherwise).
 *
 * The native module only exists on Android builds that include it; on iOS or a
 * JS reload before a rebuild, `requireOptionalNativeModule` returns null and
 * the listener becomes a no-op.
 */

type AudioRouteNativeModule = {
  addListener: (eventName: string, listener: () => void) => { remove: () => void };
};

const nativeModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<AudioRouteNativeModule>('AudioRoute')
    : null;

/**
 * Subscribe to "audio becoming noisy" (headphones/Bluetooth disconnected).
 * Returns an unsubscribe function. No-ops gracefully when the native module
 * isn't available.
 */
export function addAudioBecomingNoisyListener(listener: () => void): () => void {
  if (!nativeModule?.addListener) return () => {};
  const sub = nativeModule.addListener('onAudioBecomingNoisy', listener);
  return () => sub.remove();
}
