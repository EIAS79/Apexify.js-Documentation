export type StudioArtifactKind =
  | 'image'
  | 'gif'
  | 'audio'
  | 'video'
  | 'json'
  | 'text'
  | 'binary';

export type StudioMediaIdentity = {
  kind: StudioArtifactKind;
  mime: string;
};

export type StudioDerivedMediaMetadata = {
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  frameCount?: number;
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
};

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let out = '';
  for (let i = start; i < Math.min(end, bytes.length); i += 1) {
    out += String.fromCharCode(bytes[i] ?? 0);
  }
  return out;
}

function extension(name: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function u16le(bytes: Uint8Array, offset: number): number | undefined {
  if (offset < 0 || offset + 2 > bytes.length) return undefined;
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function u32le(bytes: Uint8Array, offset: number): number | undefined {
  if (offset < 0 || offset + 4 > bytes.length) return undefined;
  return (
    bytes[offset]! |
    (bytes[offset + 1]! << 8) |
    (bytes[offset + 2]! << 16) |
    (bytes[offset + 3]! << 24)
  ) >>> 0;
}

function u32be(bytes: Uint8Array, offset: number): number | undefined {
  if (offset < 0 || offset + 4 > bytes.length) return undefined;
  return (
    ((bytes[offset]! << 24) >>> 0) |
    (bytes[offset + 1]! << 16) |
    (bytes[offset + 2]! << 8) |
    bytes[offset + 3]!
  ) >>> 0;
}

function skipGifSubBlocks(bytes: Uint8Array, offset: number): number {
  let cursor = offset;
  while (cursor < bytes.length) {
    const size = bytes[cursor] ?? 0;
    cursor += 1;
    if (size === 0) break;
    cursor += size;
  }
  return Math.min(cursor, bytes.length);
}

function gifMetadata(bytes: Uint8Array): StudioDerivedMediaMetadata {
  if (bytes.length < 13) return { bytes: bytes.length };
  const width = u16le(bytes, 6);
  const height = u16le(bytes, 8);
  const packed = bytes[10] ?? 0;
  let cursor = 13;
  if ((packed & 0x80) !== 0) cursor += 3 * (1 << ((packed & 0x07) + 1));

  let frames = 0;
  let durationMs = 0;
  let pendingDelay = 0;

  while (cursor < bytes.length) {
    const marker = bytes[cursor++] ?? 0;
    if (marker === 0x3b) break;

    if (marker === 0x21) {
      const label = bytes[cursor++] ?? 0;
      if (label === 0xf9 && (bytes[cursor] ?? 0) === 4 && cursor + 5 < bytes.length) {
        pendingDelay = (u16le(bytes, cursor + 2) ?? 0) * 10;
        cursor += 6;
      } else {
        cursor = skipGifSubBlocks(bytes, cursor);
      }
      continue;
    }

    if (marker === 0x2c) {
      if (cursor + 9 > bytes.length) break;
      const descriptorPacked = bytes[cursor + 8] ?? 0;
      cursor += 9;
      if ((descriptorPacked & 0x80) !== 0) {
        cursor += 3 * (1 << ((descriptorPacked & 0x07) + 1));
      }
      cursor += 1;
      cursor = skipGifSubBlocks(bytes, cursor);
      frames += 1;
      durationMs += pendingDelay;
      pendingDelay = 0;
      continue;
    }

    break;
  }

  return {
    bytes: bytes.length,
    width,
    height,
    frameCount: frames || undefined,
    duration: durationMs > 0 ? durationMs / 1000 : undefined,
  };
}

function wavMetadata(bytes: Uint8Array): StudioDerivedMediaMetadata {
  const metadata: StudioDerivedMediaMetadata = { bytes: bytes.length };
  if (bytes.length < 44 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 12) !== 'WAVE') {
    return metadata;
  }

  let cursor = 12;
  let dataBytes: number | undefined;
  let byteRate: number | undefined;

  while (cursor + 8 <= bytes.length) {
    const id = ascii(bytes, cursor, cursor + 4);
    const size = u32le(bytes, cursor + 4) ?? 0;
    const body = cursor + 8;

    if (id === 'fmt ' && size >= 16 && body + 16 <= bytes.length) {
      metadata.channels = u16le(bytes, body + 2);
      metadata.sampleRate = u32le(bytes, body + 4);
      byteRate = u32le(bytes, body + 8);
      metadata.bitsPerSample = u16le(bytes, body + 14);
    } else if (id === 'data') {
      dataBytes = Math.min(size, Math.max(0, bytes.length - body));
    }

    cursor = body + size + (size % 2);
  }

  if (dataBytes !== undefined && byteRate && byteRate > 0) metadata.duration = dataBytes / byteRate;
  return metadata;
}

function pngMetadata(bytes: Uint8Array): StudioDerivedMediaMetadata {
  return { bytes: bytes.length, width: u32be(bytes, 16), height: u32be(bytes, 20) };
}

function jpegMetadata(bytes: Uint8Array): StudioDerivedMediaMetadata {
  const metadata: StudioDerivedMediaMetadata = { bytes: bytes.length };
  let cursor = 2;
  while (cursor + 4 <= bytes.length) {
    if (bytes[cursor] !== 0xff) {
      cursor += 1;
      continue;
    }
    while (bytes[cursor] === 0xff) cursor += 1;
    const marker = bytes[cursor++] ?? 0;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = ((bytes[cursor] ?? 0) << 8) | (bytes[cursor + 1] ?? 0);
    if (length < 2 || cursor + length > bytes.length) break;
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)
    ) {
      metadata.height = ((bytes[cursor + 3] ?? 0) << 8) | (bytes[cursor + 4] ?? 0);
      metadata.width = ((bytes[cursor + 5] ?? 0) << 8) | (bytes[cursor + 6] ?? 0);
      break;
    }
    cursor += length;
  }
  return metadata;
}

export function studioKindFromMime(mime: string): StudioArtifactKind {
  const normalized = mime.toLowerCase();
  if (normalized === 'image/gif') return 'gif';
  if (normalized.startsWith('image/')) return 'image';
  if (normalized.startsWith('audio/')) return 'audio';
  if (normalized.startsWith('video/')) return 'video';
  if (normalized.includes('json')) return 'json';
  if (normalized.startsWith('text/')) return 'text';
  return 'binary';
}

function isoBmffImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 12 || ascii(bytes, 4, 8) !== 'ftyp') return null;
  const brands = new Set<string>();
  brands.add(ascii(bytes, 8, 12));
  const boxSize = u32be(bytes, 0) ?? Math.min(bytes.length, 64);
  for (let offset = 16; offset + 4 <= Math.min(bytes.length, boxSize, 96); offset += 4) {
    brands.add(ascii(bytes, offset, offset + 4));
  }
  if (brands.has('avif') || brands.has('avis')) return 'image/avif';
  if (
    ['heic','heix','hevc','hevx','heim','heis','hevm','hevs','mif1','msf1']
      .some((brand) => brands.has(brand))
  ) return 'image/heif';
  return null;
}

export function detectStudioMedia(bytes: Uint8Array, name = ''): StudioMediaIdentity {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) return { kind: 'image', mime: 'image/png' };

  const sig6 = ascii(bytes, 0, 6);
  if (sig6 === 'GIF87a' || sig6 === 'GIF89a') return { kind: 'gif', mime: 'image/gif' };

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { kind: 'image', mime: 'image/jpeg' };
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return { kind: 'image', mime: 'image/webp' };
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WAVE') {
    return { kind: 'audio', mime: 'audio/wav' };
  }

  const isoImageMime = isoBmffImageMime(bytes);
  if (isoImageMime) return { kind: 'image', mime: isoImageMime };

  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a))
  ) return { kind: 'image', mime: 'image/tiff' };

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00 && bytes[3] === 0x0c &&
    ascii(bytes, 4, 8) === 'jP  ' &&
    bytes[8] === 0x0d && bytes[9] === 0x0a && bytes[10] === 0x87 && bytes[11] === 0x0a
  ) return { kind: 'image', mime: 'image/jp2' };

  if (
    (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0x0a) ||
    (bytes.length >= 12 &&
      bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00 && bytes[3] === 0x0c &&
      ascii(bytes, 4, 8) === 'JXL ' &&
      bytes[8] === 0x0d && bytes[9] === 0x0a && bytes[10] === 0x87 && bytes[11] === 0x0a)
  ) return { kind: 'image', mime: 'image/jxl' };

  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp') return { kind: 'video', mime: 'video/mp4' };

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) return { kind: 'video', mime: 'video/webm' };

  const ext = extension(name);
  if (ext === 'wav') return { kind: 'audio', mime: 'audio/wav' };
  if (ext === 'mp3') return { kind: 'audio', mime: 'audio/mpeg' };
  if (ext === 'ogg' || ext === 'oga') return { kind: 'audio', mime: 'audio/ogg' };
  if (ext === 'mp4' || ext === 'm4v' || ext === 'mov') return { kind: 'video', mime: 'video/mp4' };
  if (ext === 'webm') return { kind: 'video', mime: 'video/webm' };
  if (ext === 'png') return { kind: 'image', mime: 'image/png' };
  if (ext === 'jpg' || ext === 'jpeg') return { kind: 'image', mime: 'image/jpeg' };
  if (ext === 'webp') return { kind: 'image', mime: 'image/webp' };
  if (ext === 'gif') return { kind: 'gif', mime: 'image/gif' };
  if (ext === 'avif') return { kind: 'image', mime: 'image/avif' };
  if (ext === 'tif' || ext === 'tiff') return { kind: 'image', mime: 'image/tiff' };
  if (ext === 'heif' || ext === 'heic') return { kind: 'image', mime: 'image/heif' };
  if (ext === 'jp2') return { kind: 'image', mime: 'image/jp2' };
  if (ext === 'jxl') return { kind: 'image', mime: 'image/jxl' };
  if (ext === 'raw') return { kind: 'binary', mime: 'application/octet-stream' };
  if (ext === 'json') return { kind: 'json', mime: 'application/json' };
  if (ext === 'txt' || ext === 'log' || ext === 'md') return { kind: 'text', mime: 'text/plain' };

  return { kind: 'binary', mime: 'application/octet-stream' };
}

export function deriveStudioMediaMetadata(
  bytes: Uint8Array,
  identity: StudioMediaIdentity = detectStudioMedia(bytes),
): StudioDerivedMediaMetadata {
  if (identity.mime === 'image/png') return pngMetadata(bytes);
  if (identity.mime === 'image/jpeg') return jpegMetadata(bytes);
  if (identity.mime === 'image/gif') return gifMetadata(bytes);
  if (identity.mime === 'audio/wav') return wavMetadata(bytes);
  return { bytes: bytes.length };
}
