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

export function detectStudioMedia(bytes: Uint8Array, name = ''): StudioMediaIdentity {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { kind: 'image', mime: 'image/png' };
  }

  const sig6 = ascii(bytes, 0, 6);
  if (sig6 === 'GIF87a' || sig6 === 'GIF89a') {
    return { kind: 'gif', mime: 'image/gif' };
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { kind: 'image', mime: 'image/jpeg' };
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return { kind: 'image', mime: 'image/webp' };
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WAVE') {
    return { kind: 'audio', mime: 'audio/wav' };
  }

  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp') {
    return { kind: 'video', mime: 'video/mp4' };
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return { kind: 'video', mime: 'video/webm' };
  }

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
  if (ext === 'json') return { kind: 'json', mime: 'application/json' };
  if (ext === 'txt' || ext === 'log' || ext === 'md') return { kind: 'text', mime: 'text/plain' };

  return { kind: 'binary', mime: 'application/octet-stream' };
}
