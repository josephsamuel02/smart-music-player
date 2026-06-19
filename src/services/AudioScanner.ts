import * as MediaLibrary from 'expo-media-library';
import type { Song } from '@/types';
import { SUPPORTED_AUDIO_EXTENSIONS } from '@/constants/audio';
import { basename, dirname, parseFilenameForMetadata } from '@/utils/format';

const PAGE_SIZE = 200;

const EXTENSION_SET = new Set<string>(SUPPORTED_AUDIO_EXTENSIONS);

function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx < 0 ? '' : filename.slice(idx + 1).toLowerCase();
}

function isHidden(filename: string): boolean {
  return filename.startsWith('.');
}

/**
 * Scan the device using expo-media-library and return a list of Song objects.
 * - Paginates through every audio asset
 * - Filters by file extension (covers `.opus` etc. which MediaLibrary still tags as audio)
 * - Best-effort metadata parsing from filename
 */
export async function scanDeviceForSongs(options?: {
  includeHidden?: boolean;
  onProgress?: (count: number) => void;
}): Promise<Song[]> {
  const includeHidden = options?.includeHidden ?? false;
  const songs: Song[] = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      first: PAGE_SIZE,
      after,
      sortBy: [[MediaLibrary.SortBy.default, false]],
    });

    for (const asset of page.assets) {
      const filename = asset.filename ?? basename(asset.uri);
      if (!includeHidden && isHidden(filename)) continue;

      const ext = extensionOf(filename);
      if (ext && !EXTENSION_SET.has(ext)) {
        // Skip anything mis-tagged as audio (ringtones, voicemails, etc.)
        continue;
      }

      const meta = parseFilenameForMetadata(filename);
      const folderPath = dirname(asset.uri);
      const folder = basename(folderPath) || 'Music';

      songs.push({
        id: asset.id,
        title: meta.title || filename.replace(/\.[^.]+$/, ''),
        artist: meta.artist || 'Unknown Artist',
        album: meta.album || folder || 'Unknown Album',
        duration: asset.duration ?? 0,
        uri: asset.uri,
        folder,
        folderPath,
        filename,
        modifiedAt: asset.modificationTime,
        addedAt: asset.creationTime ?? asset.modificationTime,
      });
    }

    options?.onProgress?.(songs.length);
    after = page.endCursor;
    hasNextPage = page.hasNextPage;
  }

  return songs;
}

/**
 * Delete a single asset from the device. Requires WRITE permission on the
 * media library; the user will be prompted on iOS / Android 11+ as needed.
 */
export async function deleteSongAsset(songId: string): Promise<boolean> {
  try {
    return await MediaLibrary.deleteAssetsAsync([songId]);
  } catch {
    return false;
  }
}
