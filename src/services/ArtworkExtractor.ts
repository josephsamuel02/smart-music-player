import * as FileSystem from 'expo-file-system/legacy';
import type { Song } from '@/types';

/**
 * Extracts embedded album art from local audio files (best-effort, pure JS).
 *
 * Supports the common case: MP3 files with an ID3v2 tag containing an APIC
 * (attached picture) frame — covers ID3v2.2 (PIC), 2.3 and 2.4. Other
 * containers (FLAC/M4A/OGG) are skipped and fall back to the gradient
 * placeholder, matching the "songs without an image" behaviour.
 *
 * Extracted images are written once to the cache directory and reused on
 * subsequent launches, so the expensive parse only happens a single time.
 */

const ARTWORK_DIR = `${FileSystem.cacheDirectory}artwork/`;
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const B64_LOOKUP = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < B64_CHARS.length; i++) table[B64_CHARS.charCodeAt(i)] = i;
  return table;
})();

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const byteLen = Math.floor((len * 3) / 4) - pad;
  const out = new Uint8Array(byteLen);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const c0 = B64_LOOKUP[clean.charCodeAt(i)];
    const c1 = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const c2 = B64_LOOKUP[clean.charCodeAt(i + 2)];
    const c3 = B64_LOOKUP[clean.charCodeAt(i + 3)];
    const triplet = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (p < byteLen) out[p++] = (triplet >> 16) & 0xff;
    if (p < byteLen) out[p++] = (triplet >> 8) & 0xff;
    if (p < byteLen) out[p++] = triplet & 0xff;
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < len ? B64_CHARS[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < len ? B64_CHARS[b2 & 0x3f] : '=';
  }
  return out;
}

/** Read a byte range from a file as raw bytes. */
async function readBytes(uri: string, position: number, length: number): Promise<Uint8Array> {
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
    position,
    length,
  });
  return base64ToBytes(b64);
}

/** ID3 size fields: v2.4 + the tag header use synchsafe (7-bit) integers. */
function readSynchsafe(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 21) |
    (bytes[offset + 1] << 14) |
    (bytes[offset + 2] << 7) |
    bytes[offset + 3]
  );
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readUint24BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 16) + (bytes[offset + 1] << 8) + bytes[offset + 2];
}

type Picture = { mime: string; data: Uint8Array };

/** Parse the picture out of an already-loaded ID3v2 tag body. */
function parseApic(tag: Uint8Array, major: number): Picture | null {
  // tag includes the 10-byte header; frames start at offset 10.
  let offset = 10;
  const isV22 = major === 2;
  const headerSize = isV22 ? 6 : 10;

  while (offset + headerSize <= tag.length) {
    let frameId: string;
    let frameSize: number;

    if (isV22) {
      frameId = String.fromCharCode(tag[offset], tag[offset + 1], tag[offset + 2]);
      frameSize = readUint24BE(tag, offset + 3);
    } else {
      frameId = String.fromCharCode(
        tag[offset],
        tag[offset + 1],
        tag[offset + 2],
        tag[offset + 3],
      );
      frameSize = major === 4 ? readSynchsafe(tag, offset + 4) : readUint32BE(tag, offset + 4);
    }

    if (frameSize <= 0 || frameId.charCodeAt(0) === 0) break;

    const bodyStart = offset + headerSize;
    const bodyEnd = bodyStart + frameSize;
    if (bodyEnd > tag.length) break;

    if (frameId === 'APIC' || frameId === 'PIC') {
      const body = tag.subarray(bodyStart, bodyEnd);
      let p = 1; // skip text-encoding byte
      let mime: string;

      if (isV22) {
        // 3-char image format code, e.g. "JPG" / "PNG"
        const fmt = String.fromCharCode(body[1], body[2], body[3]).toUpperCase();
        mime = fmt.startsWith('PNG') ? 'image/png' : 'image/jpeg';
        p = 4;
      } else {
        let mimeStr = '';
        while (p < body.length && body[p] !== 0) {
          mimeStr += String.fromCharCode(body[p]);
          p++;
        }
        p++; // skip MIME null terminator
        mime = mimeStr || 'image/jpeg';
      }

      p++; // skip picture-type byte

      // Skip the (possibly UTF-16) description string up to its terminator.
      const encoding = body[0];
      if (encoding === 1 || encoding === 2) {
        while (p + 1 < body.length && !(body[p] === 0 && body[p + 1] === 0)) p += 2;
        p += 2;
      } else {
        while (p < body.length && body[p] !== 0) p++;
        p++;
      }

      if (p < body.length) {
        return { mime, data: body.subarray(p) };
      }
    }

    offset = bodyEnd;
  }

  return null;
}

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

let dirEnsured = false;
async function ensureDir() {
  if (dirEnsured) return;
  const info = await FileSystem.getInfoAsync(ARTWORK_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ARTWORK_DIR, { intermediates: true });
  dirEnsured = true;
}

/**
 * Returns a cached file URI for the song's embedded artwork, or null if the
 * file has none / is an unsupported container. Caches the result on disk.
 */
export async function extractArtwork(song: Song): Promise<string | null> {
  if (!song.uri.toLowerCase().endsWith('.mp3')) return null;

  try {
    await ensureDir();

    // Fast path: already extracted in a previous session.
    for (const ext of ['jpg', 'png', 'webp']) {
      const cached = `${ARTWORK_DIR}${song.id}.${ext}`;
      const info = await FileSystem.getInfoAsync(cached);
      if (info.exists) return info.size && info.size > 0 ? cached : null;
    }

    const header = await readBytes(song.uri, 0, 10);
    if (header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) return null; // "ID3"

    const major = header[3];
    const tagSize = readSynchsafe(header, 6);
    if (tagSize <= 0 || tagSize > 20_000_000) return null;

    const tag = await readBytes(song.uri, 0, tagSize + 10);
    const pic = parseApic(tag, major);
    if (!pic || pic.data.length < 100) return null;

    const out = `${ARTWORK_DIR}${song.id}.${extFromMime(pic.mime)}`;
    await FileSystem.writeAsStringAsync(out, bytesToBase64(pic.data), {
      encoding: FileSystem.EncodingType.Base64,
    });
    return out;
  } catch {
    return null;
  }
}

/**
 * Walks a list of songs and resolves embedded artwork for any MP3 that lacks
 * it, invoking `onArtwork` as each image becomes available. Runs with limited
 * concurrency so a large library doesn't stall the JS thread.
 */
export async function enrichSongsWithArtwork(
  songs: Song[],
  onArtwork: (songId: string, uri: string) => void,
  concurrency = 3,
): Promise<void> {
  const targets = songs.filter((s) => !s.artwork && s.uri.toLowerCase().endsWith('.mp3'));
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const song = targets[cursor++];
      const uri = await extractArtwork(song);
      if (uri) onArtwork(song.id, uri);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, targets.length) }, worker);
  await Promise.all(workers);
}
