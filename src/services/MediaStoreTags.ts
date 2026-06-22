import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Bridge to the local `expo-media-store` native module. We read Android's
 * MediaStore audio metadata (the same source other players use) so files whose
 * filename is cryptic — e.g. WhatsApp's `AUD-…-WA0001` — still show their real
 * title/artist/album when the system media scanner has them.
 *
 * The native module only exists on Android builds that include it; on iOS or a
 * JS reload before the app is rebuilt, `requireOptionalNativeModule` returns
 * null and we degrade gracefully to filename-derived names.
 */

type NativeRow = {
  id: string;
  title?: string | null;
  artist?: string | null;
  album?: string | null;
};

type MediaStoreNativeModule = {
  getAudioMetadata: () => Promise<NativeRow[]>;
};

export type MediaTags = { title?: string; artist?: string; album?: string };

const nativeModule =
  Platform.OS === 'android'
    ? requireOptionalNativeModule<MediaStoreNativeModule>('MediaStore')
    : null;

/** Android uses the literal string "<unknown>" for missing artist/album. */
function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '<unknown>') return undefined;
  return trimmed;
}

/**
 * Returns a map of MediaStore id → metadata. The id matches the asset id from
 * expo-media-library on Android. Resolves to an empty map when the native
 * module is unavailable or the query fails.
 */
export async function loadMediaStoreTags(): Promise<Map<string, MediaTags>> {
  const map = new Map<string, MediaTags>();
  if (!nativeModule?.getAudioMetadata) return map;

  try {
    const rows = await nativeModule.getAudioMetadata();
    for (const row of rows) {
      if (!row?.id) continue;
      map.set(String(row.id), {
        title: clean(row.title),
        artist: clean(row.artist),
        album: clean(row.album),
      });
    }
  } catch {
    // ignore — fall back to filename-derived metadata
  }
  return map;
}
