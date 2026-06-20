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
 * Extracted images are written once to a persistent directory and reused on
 * subsequent launches, so the expensive parse only happens a single time.
 *
 * NOTE: we deliberately use the *document* directory (not the cache) so the
 * extracted covers survive the OS reclaiming cached files — otherwise the
 * stored artwork path would dangle and the player would show a blank box.
 */

const ARTWORK_DIR = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}artwork/`;
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
type Id3Tags = { title?: string; artist?: string; album?: string; picture?: Picture };

function decodeLatin1(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) {
    if (b[i] === 0) break;
    s += String.fromCharCode(b[i]);
  }
  return s;
}

function decodeUtf8(b: Uint8Array): string {
  let s = '';
  let i = 0;
  while (i < b.length) {
    const c = b[i++];
    if (c === 0) break;
    if (c < 0x80) {
      s += String.fromCharCode(c);
    } else if (c < 0xe0) {
      const c2 = b[i++];
      s += String.fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f));
    } else if (c < 0xf0) {
      const c2 = b[i++];
      const c3 = b[i++];
      s += String.fromCharCode(((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f));
    } else {
      const c2 = b[i++];
      const c3 = b[i++];
      const c4 = b[i++];
      let cp = ((c & 0x07) << 18) | ((c2 & 0x3f) << 12) | ((c3 & 0x3f) << 6) | (c4 & 0x3f);
      cp -= 0x10000;
      s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return s;
}

function decodeUtf16(b: Uint8Array, encoding: number): string {
  let i = 0;
  let littleEndian = false;
  if (encoding === 1) {
    // UTF-16 with BOM
    if (b[0] === 0xff && b[1] === 0xfe) {
      littleEndian = true;
      i = 2;
    } else if (b[0] === 0xfe && b[1] === 0xff) {
      i = 2;
    }
  }
  let s = '';
  for (; i + 1 < b.length; i += 2) {
    const code = littleEndian ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1];
    if (code === 0) break;
    s += String.fromCharCode(code);
  }
  return s;
}

/** Decode an ID3 text-frame body (first byte is the encoding flag). */
function decodeTextFrame(body: Uint8Array): string {
  if (body.length <= 1) return '';
  const encoding = body[0];
  const data = body.subarray(1);
  let text: string;
  if (encoding === 0) text = decodeLatin1(data);
  else if (encoding === 3) text = decodeUtf8(data);
  else text = decodeUtf16(data, encoding);
  return text.replace(/\u0000+$/, '').trim();
}

/** Pull the picture bytes out of an APIC/PIC frame body. */
function parsePictureBody(body: Uint8Array, isV22: boolean): Picture | null {
  let p = 1; // skip text-encoding byte
  let mime: string;

  if (isV22) {
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

  const encoding = body[0];
  if (encoding === 1 || encoding === 2) {
    while (p + 1 < body.length && !(body[p] === 0 && body[p + 1] === 0)) p += 2;
    p += 2;
  } else {
    while (p < body.length && body[p] !== 0) p++;
    p++;
  }

  if (p < body.length) return { mime, data: body.subarray(p) };
  return null;
}

/**
 * Walk an already-loaded ID3v2 tag once, collecting the title/artist/album
 * text frames and the first embedded picture. Handles ID3v2.2 / 2.3 / 2.4.
 */
function parseTag(tag: Uint8Array, major: number): Id3Tags {
  const result: Id3Tags = {};
  let offset = 10; // frames start after the 10-byte header
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

    const body = tag.subarray(bodyStart, bodyEnd);

    if (frameId === 'APIC' || frameId === 'PIC') {
      if (!result.picture) {
        const pic = parsePictureBody(body, isV22);
        if (pic) result.picture = pic;
      }
    } else if (frameId === 'TIT2' || frameId === 'TT2') {
      if (!result.title) result.title = decodeTextFrame(body);
    } else if (frameId === 'TPE1' || frameId === 'TP1') {
      if (!result.artist) result.artist = decodeTextFrame(body);
    } else if (frameId === 'TALB' || frameId === 'TAL') {
      if (!result.album) result.album = decodeTextFrame(body);
    }

    offset = bodyEnd;
  }

  return result;
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

export type EmbeddedMetadata = {
  title?: string;
  artist?: string;
  album?: string;
  /** Local cached URI of the embedded cover art, if any. */
  artwork?: string;
};

/**
 * Reads the embedded ID3 tag of an MP3 once and returns the title/artist/album
 * text plus a cached URI for the cover art. Returns `null` only when the file
 * could not be read (so the caller can retry later); an empty object means the
 * file was read but had no usable tags.
 *
 * This is what lets WhatsApp-style files (e.g. `AUD-…-WA0001.mp3`) show their
 * real song name instead of the cryptic filename, mirroring other players.
 */
export async function extractEmbeddedMetadata(song: Song): Promise<EmbeddedMetadata | null> {
  if (!song.uri.toLowerCase().endsWith('.mp3')) return {};

  try {
    await ensureDir();

    const header = await readBytes(song.uri, 0, 10);
    if (header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) return {}; // not "ID3"

    const major = header[3];
    const tagSize = readSynchsafe(header, 6);
    if (tagSize <= 0 || tagSize > 20_000_000) return {};

    const tag = await readBytes(song.uri, 0, tagSize + 10);
    const tags = parseTag(tag, major);

    let artwork: string | undefined;
    if (tags.picture && tags.picture.data.length >= 100) {
      const out = `${ARTWORK_DIR}${song.id}.${extFromMime(tags.picture.mime)}`;
      const info = await FileSystem.getInfoAsync(out);
      if (!info.exists) {
        await FileSystem.writeAsStringAsync(out, bytesToBase64(tags.picture.data), {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      artwork = out;
    }

    return {
      title: tags.title || undefined,
      artist: tags.artist || undefined,
      album: tags.album || undefined,
      artwork,
    };
  } catch {
    return null;
  }
}

/**
 * True when a song's stored artwork URI still points at a real file inside our
 * persistent directory. Legacy cache-dir paths (which the OS can purge) are
 * treated as invalid so they get re-extracted into the persistent location.
 */
async function artworkStillValid(uri: string | undefined): Promise<boolean> {
  if (!uri) return false;
  if (!uri.startsWith(ARTWORK_DIR)) return false; // legacy cache path → refresh
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists;
  } catch {
    return false;
  }
}

/**
 * Walks a list of songs and resolves embedded metadata (title/artist/album +
 * cover art), invoking `onMetadata` as each result becomes available. Runs with
 * limited concurrency so a large library doesn't stall the JS thread.
 *
 * Two kinds of work happen here:
 *  - MP3s never read before → full tag parse (title/artist/album + art).
 *  - MP3s already read but whose cached art file went missing (OS purge) or
 *    lives in the old cache directory → re-extract just the cover so the
 *    player/list never end up pointing at a dangling file.
 */
export async function enrichSongsWithMetadata(
  songs: Song[],
  onMetadata: (songId: string, meta: EmbeddedMetadata) => void,
  concurrency = 3,
): Promise<void> {
  const targets = songs.filter(
    (s) => s.uri.toLowerCase().endsWith('.mp3') && (!s.tagsRead || !!s.artwork),
  );
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const song = targets[cursor++];
      if (!song.tagsRead) {
        const meta = await extractEmbeddedMetadata(song);
        // `null` = read failure (retry next session); any object = mark as read.
        if (meta) onMetadata(song.id, meta);
        continue;
      }
      // Already read: only do work if the cached cover is gone/stale.
      if (await artworkStillValid(song.artwork)) continue;
      const meta = await extractEmbeddedMetadata(song);
      if (meta?.artwork) onMetadata(song.id, { artwork: meta.artwork });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, targets.length) }, worker);
  await Promise.all(workers);
}
