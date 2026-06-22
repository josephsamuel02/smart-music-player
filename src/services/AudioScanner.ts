import * as MediaLibrary from 'expo-media-library';
import type { Song } from '@/types';
import { SUPPORTED_AUDIO_EXTENSIONS } from '@/constants/audio';
import { basename, dirname, isNumericTitle, parseFilenameForMetadata } from '@/utils/format';
import { loadMediaStoreTags } from './MediaStoreTags';

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

  // Pull the system's already-scanned audio metadata once. This is what other
  // players use to show real titles for files with opaque names (WhatsApp etc).
  const mediaTags = await loadMediaStoreTags();

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
      const ms = mediaTags.get(asset.id);

      // Prefer the system MediaStore title (real song name where available),
      // then a "Artist - Title" parsed from the filename, then the bare name.
      let title = ms?.title || meta.title || filename.replace(/\.[^.]+$/, '');
      // When the title is just a number (e.g. "12.mp3"), fall back to other
      // available information so the list shows something meaningful. We keep
      // the number as a suffix so tracks in the same folder stay distinct.
      if (isNumericTitle(title)) {
        const base = ms?.artist || meta.artist || meta.album || (folder !== 'Music' ? folder : '');
        if (base) title = `${base} ${title.trim()}`;
      }

      songs.push({
        id: asset.id,
        title,
        artist: ms?.artist || meta.artist || 'Unknown Artist',
        album: ms?.album || meta.album || folder || 'Unknown Album',
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
