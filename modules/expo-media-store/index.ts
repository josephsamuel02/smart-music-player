import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Native module that exposes Android's MediaStore audio metadata. Returns
 * `null` on platforms/builds where the native side isn't present (e.g. iOS or
 * a JS-only reload before a rebuild), so callers must guard for that.
 */
export default requireOptionalNativeModule('MediaStore');
