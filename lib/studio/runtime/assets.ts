export type StudioVirtualAsset = {
  id: string;
  name: string;
  mime: string;
  size: number;
  base64: string;
};

export const STUDIO_ASSET_LIMITS = Object.freeze({
  maxCount: 12,
  maxBytesPerAsset: 8 * 1024 * 1024,
  maxTotalBytes: 24 * 1024 * 1024,
});

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

function extension(name: string): string {
  return name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
}

export function inferStudioAssetMime(name: string, supplied = ''): string {
  return supplied || MIME_BY_EXTENSION[extension(name)] || 'application/octet-stream';
}

export function studioAssetReference(asset: Pick<StudioVirtualAsset, 'id'>): string {
  return `studio://asset/${asset.id}`;
}

export function studioAssetQuotedReference(asset: Pick<StudioVirtualAsset, 'id'>): string {
  return JSON.stringify(studioAssetReference(asset));
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + CHUNK));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function fileToStudioAsset(file: File): Promise<StudioVirtualAsset> {
  if (file.size <= 0) throw new Error('Empty files cannot be added to Studio.');
  if (file.size > STUDIO_ASSET_LIMITS.maxBytesPerAsset) {
    throw new Error(`${file.name} exceeds the 8 MiB Studio asset limit.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    name: file.name || 'asset',
    mime: inferStudioAssetMime(file.name, file.type),
    size: bytes.byteLength,
    base64: bytesToBase64(bytes),
  };
}

export function totalStudioAssetBytes(assets: readonly StudioVirtualAsset[]): number {
  return assets.reduce((sum, asset) => sum + asset.size, 0);
}

export function isStudioAssetReference(value: string): boolean {
  return /^studio:\/\/asset\/[A-Za-z0-9._-]+$/i.test(value);
}

export function studioAssetIdFromReference(value: string): string | null {
  const match = /^studio:\/\/asset\/([A-Za-z0-9._-]+)$/i.exec(value.trim());
  return match?.[1] ?? null;
}
