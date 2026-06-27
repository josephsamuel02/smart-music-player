import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Native module that reports Android audio-route changes. It fires an
 * `onAudioBecomingNoisy` event when the system broadcasts
 * `ACTION_AUDIO_BECOMING_NOISY` - i.e. headphones or Bluetooth audio were
 * disconnected and playback is about to blast out of the speaker.
 *
 * Returns `null` on platforms/builds where the native side isn't present (iOS,
 * or a JS-only reload before a rebuild), so callers must guard for that.
 */
export default requireOptionalNativeModule('AudioRoute');
