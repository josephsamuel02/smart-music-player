import * as FileSystem from 'expo-file-system/legacy';
import type { Song } from '@/types';

/**
 * Extracts embedded tags (title/artist/album) and album art from local audio
 * files (best-effort, pure JS).
 *
 * Supported containers:
 *  - MP3  — ID3v2.2 (PIC) / 2.3 / 2.4 text + APIC frames
 *  - M4A/MP4/AAC — iTunes-style metadata atoms (©nam/©ART/©alb/covr)
 *  - Opus/Ogg — Vorbis comments (TITLE/ARTIST/ALBUM)
 *  - FLAC — Vorbis comments + PICTURE block
 *
 * Anything else falls back to the filename-derived name and the gradient
 * placeholder.
 *
 * Extracted images are written once to a persistent directory and reused on
 * subsequent launches, so the expensive parse only happens a single time.
 *
 * NOTE: we deliberately use the *document* directory (not the cache) so the
 * extracted covers survive the OS reclaiming cached files — otherwise the
 * stored artwork path would dangle and the player would show a blank box.
 */

const ARTWORK_DIR = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}artwork/`;

/** Audio containers we know how to read embedded tags from. */
const TAGGABLE_RE = /\.(mp3|m4a|mp4|m4b|aac|opus|ogg|oga|flac)$/;
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

function readUint32LE(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 0x1000000;
}

/** Find the byte offset of an ASCII signature inside a buffer (or -1). */
function indexOfAscii(buf: Uint8Array, sig: string, from = 0): number {
  outer: for (let i = from; i <= buf.length - sig.length; i++) {
    for (let j = 0; j < sig.length; j++) {
      if (buf[i + j] !== sig.charCodeAt(j)) continue outer;
    }
    return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// MP3 / ID3v2
// ---------------------------------------------------------------------------

async function parseMp3Tags(uri: string): Promise<Id3Tags> {
  try {
    const header = await readBytes(uri, 0, 10);
    if (header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) return {}; // not "ID3"
    const major = header[3];
    const tagSize = readSynchsafe(header, 6);
    if (tagSize <= 0 || tagSize > 20_000_000) return {};
    const tag = await readBytes(uri, 0, tagSize + 10);
    return parseTag(tag, major);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// MP4 / M4A (iTunes-style metadata atoms)
// ---------------------------------------------------------------------------

type Atom = { type: string; size: number; headerLen: number };

async function readAtomHeader(uri: string, pos: number): Promise<Atom | null> {
  const b = await readBytes(uri, pos, 16);
  if (b.length < 8) return null;
  let size = readUint32BE(b, 0);
  let headerLen = 8;
  if (size === 1) {
    if (b.length < 16) return null;
    // 64-bit size (we cap to a safe JS integer; metadata atoms are tiny anyway)
    size = readUint32BE(b, 8) * 0x100000000 + readUint32BE(b, 12);
    headerLen = 16;
  }
  const type = String.fromCharCode(b[4], b[5], b[6], b[7]);
  return { type, size, headerLen };
}

/** Locate a direct child atom of `type` within [start, end). */
async function findAtom(
  uri: string,
  type: string,
  start: number,
  end: number,
): Promise<{ contentStart: number; contentEnd: number } | null> {
  let pos = start;
  while (pos + 8 <= end) {
    const a = await readAtomHeader(uri, pos);
    if (!a) break;
    let size = a.size;
    if (size === 0) size = end - pos; // extends to container end
    if (size < a.headerLen) break;
    if (a.type === type) {
      return { contentStart: pos + a.headerLen, contentEnd: pos + size };
    }
    pos += size;
  }
  return null;
}

async function parseMp4Tags(uri: string): Promise<Id3Tags> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    const fileEnd = info.exists && info.size && info.size > 0 ? info.size : Number.MAX_SAFE_INTEGER;

    const moov = await findAtom(uri, 'moov', 0, fileEnd);
    if (!moov) return {};
    const udta = await findAtom(uri, 'udta', moov.contentStart, moov.contentEnd);
    if (!udta) return {};
    const meta = await findAtom(uri, 'meta', udta.contentStart, udta.contentEnd);
    if (!meta) return {};
    // `meta` carries a 4-byte version/flags field before its child atoms.
    const ilst = await findAtom(uri, 'ilst', meta.contentStart + 4, meta.contentEnd);
    if (!ilst) return {};

    const result: Id3Tags = {};
    const NAME = '\u00A9nam';
    const ARTIST = '\u00A9ART';
    const ALBUM = '\u00A9alb';

    let pos = ilst.contentStart;
    while (pos + 8 <= ilst.contentEnd) {
      const a = await readAtomHeader(uri, pos);
      if (!a) break;
      let size = a.size;
      if (size === 0) size = ilst.contentEnd - pos;
      if (size < a.headerLen) break;

      if (a.type === NAME || a.type === ARTIST || a.type === ALBUM || a.type === 'covr') {
        const data = await findAtom(uri, 'data', pos + a.headerLen, pos + size);
        if (data) {
          // `data` content = [4-byte type][4-byte locale][value]
          const valStart = data.contentStart + 8;
          const valLen = data.contentEnd - valStart;
          if (valLen > 0 && valLen < 8_000_000) {
            const bytes = await readBytes(uri, valStart, valLen);
            if (a.type === 'covr') {
              if (!result.picture) {
                const mime = bytes[0] === 0x89 ? 'image/png' : 'image/jpeg';
                result.picture = { mime, data: bytes };
              }
            } else {
              const text = decodeUtf8(bytes).trim();
              if (a.type === NAME && !result.title) result.title = text;
              else if (a.type === ARTIST && !result.artist) result.artist = text;
              else if (a.type === ALBUM && !result.album) result.album = text;
            }
          }
        }
      }
      pos += size;
    }
    return result;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Vorbis comments (shared by Ogg/Opus and FLAC)
// ---------------------------------------------------------------------------

function parseVorbisComments(buf: Uint8Array, start: number): Id3Tags {
  const result: Id3Tags = {};
  let p = start;
  const end = buf.length;
  if (p + 4 > end) return result;
  const vendorLen = readUint32LE(buf, p);
  p += 4;
  if (vendorLen < 0 || p + vendorLen + 4 > end) return result;
  p += vendorLen; // skip vendor string
  let count = readUint32LE(buf, p);
  p += 4;
  if (count < 0) return result;
  if (count > 512) count = 512; // sanity cap
  for (let i = 0; i < count; i++) {
    if (p + 4 > end) break;
    const len = readUint32LE(buf, p);
    p += 4;
    if (len <= 0 || len > 200_000 || p + len > end) break;
    const field = decodeUtf8(buf.subarray(p, p + len));
    p += len;
    const eq = field.indexOf('=');
    if (eq > 0) {
      const key = field.slice(0, eq).toUpperCase();
      const val = field.slice(eq + 1).trim();
      if (key === 'TITLE' && !result.title) result.title = val;
      else if (key === 'ARTIST' && !result.artist) result.artist = val;
      else if (key === 'ALBUM' && !result.album) result.album = val;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Ogg / Opus
// ---------------------------------------------------------------------------

async function parseOggTags(uri: string): Promise<Id3Tags> {
  try {
    // The comment header sits right after the ID header in the first Ogg pages;
    // a small window is enough for the title/artist/album fields.
    const buf = await readBytes(uri, 0, 32 * 1024);

    // Opus: "OpusTags" marks the start of a Vorbis-comment payload.
    const opus = indexOfAscii(buf, 'OpusTags');
    if (opus >= 0) return parseVorbisComments(buf, opus + 8);

    // Vorbis: the comment header packet begins with 0x03 then "vorbis".
    for (let i = 0; i <= buf.length - 7; i++) {
      if (
        buf[i] === 0x03 &&
        buf[i + 1] === 0x76 && // v
        buf[i + 2] === 0x6f && // o
        buf[i + 3] === 0x72 && // r
        buf[i + 4] === 0x62 && // b
        buf[i + 5] === 0x69 && // i
        buf[i + 6] === 0x73 // s
      ) {
        return parseVorbisComments(buf, i + 7);
      }
    }
    return {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// FLAC (native, not Ogg-wrapped)
// ---------------------------------------------------------------------------

function parseFlacPicture(b: Uint8Array): Picture | null {
  let p = 4; // skip picture-type
  if (p + 4 > b.length) return null;
  const mimeLen = readUint32BE(b, p);
  p += 4;
  if (p + mimeLen + 4 > b.length) return null;
  let mime = '';
  for (let i = 0; i < mimeLen; i++) mime += String.fromCharCode(b[p + i]);
  p += mimeLen;
  const descLen = readUint32BE(b, p);
  p += 4;
  p += descLen + 16; // description + width/height/depth/colors
  if (p + 4 > b.length) return null;
  const dataLen = readUint32BE(b, p);
  p += 4;
  if (dataLen <= 0 || p + dataLen > b.length) return null;
  return { mime: mime || 'image/jpeg', data: b.subarray(p, p + dataLen) };
}

async function parseFlacTags(uri: string): Promise<Id3Tags> {
  try {
    const head = await readBytes(uri, 0, 4);
    if (head[0] !== 0x66 || head[1] !== 0x4c || head[2] !== 0x61 || head[3] !== 0x43) return {}; // "fLaC"

    const result: Id3Tags = {};
    let pos = 4;
    for (let guard = 0; guard < 128; guard++) {
      const hdr = await readBytes(uri, pos, 4);
      if (hdr.length < 4) break;
      const last = (hdr[0] & 0x80) !== 0;
      const type = hdr[0] & 0x7f;
      const len = readUint24BE(hdr, 1);
      const blockStart = pos + 4;

      if (type === 4) {
        // VORBIS_COMMENT
        const block = await readBytes(uri, blockStart, Math.min(len, 1_000_000));
        Object.assign(result, parseVorbisComments(block, 0));
      } else if (type === 6 && !result.picture) {
        // PICTURE
        const block = await readBytes(uri, blockStart, Math.min(len, 8_000_000));
        const pic = parseFlacPicture(block);
        if (pic) result.picture = pic;
      }

      pos = blockStart + len;
      if (last) break;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Reads embedded tags from a local audio file and returns the title/artist/album
 * text plus a cached URI for the cover art. Returns `null` only when something
 * unexpected failed; an empty object means the file was read but had no usable
 * tags.
 *
 * Supports MP3 (ID3v2), MP4/M4A (iTunes atoms), Ogg/Opus & FLAC (Vorbis
 * comments). This is what lets WhatsApp-style files (e.g. `AUD-…-WA0001.opus`
 * or `.m4a`) show their real song name instead of the cryptic filename, just
 * like other music players.
 */
export async function extractEmbeddedMetadata(song: Song): Promise<EmbeddedMetadata | null> {
  const lower = song.uri.toLowerCase();

  try {
    await ensureDir();

    let tags: Id3Tags;
    if (lower.endsWith('.mp3')) tags = await parseMp3Tags(song.uri);
    else if (/\.(m4a|mp4|m4b|aac)$/.test(lower)) tags = await parseMp4Tags(song.uri);
    else if (/\.(opus|ogg|oga)$/.test(lower)) tags = await parseOggTags(song.uri);
    else if (lower.endsWith('.flac')) tags = await parseFlacTags(song.uri);
    else return {};

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
    (s) => TAGGABLE_RE.test(s.uri.toLowerCase()) && (!s.tagsRead || !!s.artwork),
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
