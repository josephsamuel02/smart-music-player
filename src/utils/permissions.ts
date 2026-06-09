import * as MediaLibrary from 'expo-media-library';

export type PermissionResult = {
  granted: boolean;
  canAskAgain: boolean;
  status: MediaLibrary.PermissionStatus;
};

/**
 * Request READ access to the device's music library.
 *
 * Notes:
 *  - The first argument to expo-media-library's permission helpers is
 *    `writeOnly`. Passing `true` (the previous behaviour here) asks the user
 *    for WRITE-only access, so the prompt would succeed but `getAssetsAsync`
 *    would never return any songs. We pass `false` to request READ access.
 *  - On Android 13+ we use the granular `'audio'` permission so the system
 *    prompt only mentions music — no photo / video prompts for a music app.
 */
export async function ensureMediaPermission(): Promise<PermissionResult> {
  const existing = await MediaLibrary.getPermissionsAsync(false, ['audio']);
  if (existing.status === 'granted') {
    return { granted: true, canAskAgain: existing.canAskAgain, status: existing.status };
  }

  if (existing.canAskAgain) {
    const requested = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
    return {
      granted: requested.status === 'granted',
      canAskAgain: requested.canAskAgain,
      status: requested.status,
    };
  }

  return { granted: false, canAskAgain: false, status: existing.status };
}
