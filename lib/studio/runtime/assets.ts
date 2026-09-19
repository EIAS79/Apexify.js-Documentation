export type StudioAssetMetadata = {
  width?: number;
  height?: number;
  duration?: number;
};

export type StudioVirtualAsset = {
  id: string;
  name: string;
  mime: string;
  size: number;
  base64: string;
  metadata?: StudioAssetMetadata;
};

export const STUDIO_ASSET_LIMITS = Object.freeze({
  maxCount: 12,
  maxBytesPerAsset: 8 * 1024 * 1024,
  maxTotalBytes: 24 * 1024 * 1024,
});

const STUDIO_ASSET_DB = 'apexify-studio-assets-v1';
const STUDIO_ASSET_STORE = 'assets';
const STUDIO_ASSET_KEY = 'session-assets';

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

export function studioAssetFontFamily(asset: Pick<StudioVirtualAsset, 'name'>): string {
  const base = asset.name.replace(/\.[^.]+$/, '').trim();
  const normalized = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized || 'Studio Font';
}

export function isStudioFontAsset(asset: Pick<StudioVirtualAsset, 'mime' | 'name'>): boolean {
  const ext = extension(asset.name);
  return asset.mime.startsWith('font/') || ['ttf', 'otf', 'woff', 'woff2'].includes(ext);
}

export function studioAssetDataUrl(asset: Pick<StudioVirtualAsset, 'mime' | 'base64'>): string {
  return `data:${asset.mime || 'application/octet-stream'};base64,${asset.base64}`;
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

async function mediaMetadata(file: File, mime: string): Promise<StudioAssetMetadata | undefined> {
  if (mime.startsWith('image/')) {
    try {
      const bitmap = await createImageBitmap(file);
      const metadata = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return metadata;
    } catch {
      return undefined;
    }
  }

  if (!mime.startsWith('audio/') && !mime.startsWith('video/')) return undefined;

  return new Promise<StudioAssetMetadata | undefined>((resolve) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(mime.startsWith('video/') ? 'video' : 'audio');
    let settled = false;
    const finish = (value?: StudioAssetMetadata) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      media.removeAttribute('src');
      media.load();
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(undefined), 3500);

    media.preload = 'metadata';
    media.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const metadata: StudioAssetMetadata = {};
      if (Number.isFinite(media.duration)) metadata.duration = media.duration;
      if (media instanceof HTMLVideoElement) {
        if (media.videoWidth > 0) metadata.width = media.videoWidth;
        if (media.videoHeight > 0) metadata.height = media.videoHeight;
      }
      finish(Object.keys(metadata).length ? metadata : undefined);
    };
    media.onerror = () => {
      window.clearTimeout(timer);
      finish(undefined);
    };
    media.src = url;
  });
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
  const mime = inferStudioAssetMime(file.name, file.type);

  return {
    id,
    name: file.name || 'asset',
    mime,
    size: bytes.byteLength,
    base64: bytesToBase64(bytes),
    metadata: await mediaMetadata(file, mime),
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

export async function registerStudioBrowserFonts(
  assets: readonly StudioVirtualAsset[],
): Promise<Array<{ name: string; family: string; ok: boolean }>> {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return [];

  const results: Array<{ name: string; family: string; ok: boolean }> = [];
  for (const asset of assets) {
    if (!isStudioFontAsset(asset)) continue;
    const family = studioAssetFontFamily(asset);
    try {
      const existing = Array.from(document.fonts).some((face) => face.family === family);
      if (!existing) {
        const font = new FontFace(family, `url("${studioAssetDataUrl(asset)}")`);
        await font.load();
        document.fonts.add(font);
      }
      results.push({ name: asset.name, family, ok: true });
    } catch {
      results.push({ name: asset.name, family, ok: false });
    }
  }
  return results;
}

function openAssetDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STUDIO_ASSET_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STUDIO_ASSET_STORE)) {
        db.createObjectStore(STUDIO_ASSET_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open Studio asset storage.'));
  });
}

function validPersistedAssets(value: unknown): StudioVirtualAsset[] {
  if (!Array.isArray(value)) return [];
  const accepted: StudioVirtualAsset[] = [];
  let totalBytes = 0;

  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const item = raw as Partial<StudioVirtualAsset>;
    if (
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.mime !== 'string' ||
      typeof item.size !== 'number' ||
      typeof item.base64 !== 'string' ||
      item.size <= 0 ||
      item.size > STUDIO_ASSET_LIMITS.maxBytesPerAsset
    ) {
      continue;
    }
    totalBytes += item.size;
    if (totalBytes > STUDIO_ASSET_LIMITS.maxTotalBytes) break;
    accepted.push({
      id: item.id,
      name: item.name,
      mime: item.mime,
      size: item.size,
      base64: item.base64,
      metadata:
        item.metadata && typeof item.metadata === 'object'
          ? {
              width: typeof item.metadata.width === 'number' ? item.metadata.width : undefined,
              height: typeof item.metadata.height === 'number' ? item.metadata.height : undefined,
              duration: typeof item.metadata.duration === 'number' ? item.metadata.duration : undefined,
            }
          : undefined,
    });
    if (accepted.length >= STUDIO_ASSET_LIMITS.maxCount) break;
  }
  return accepted;
}

export async function loadPersistedStudioAssets(): Promise<StudioVirtualAsset[]> {
  const db = await openAssetDb();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STUDIO_ASSET_STORE, 'readonly');
    const request = tx.objectStore(STUDIO_ASSET_STORE).get(STUDIO_ASSET_KEY);
    request.onsuccess = () => resolve(validPersistedAssets(request.result));
    request.onerror = () => reject(request.error ?? new Error('Could not read Studio assets.'));
    tx.oncomplete = () => db.close();
  });
}

export async function savePersistedStudioAssets(
  assets: readonly StudioVirtualAsset[],
): Promise<void> {
  const db = await openAssetDb();
  if (!db) return;
  const payload = validPersistedAssets(assets);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STUDIO_ASSET_STORE, 'readwrite');
    tx.objectStore(STUDIO_ASSET_STORE).put(payload, STUDIO_ASSET_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not persist Studio assets.'));
  });
  db.close();
}
