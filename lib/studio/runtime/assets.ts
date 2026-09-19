import type { InteractiveInputAsset } from '@/lib/docs/playground/contracts';

export const STUDIO_ASSET_LIMITS = Object.freeze({
  maxAssets: 12,
  maxAssetBytes: 12 * 1024 * 1024,
  maxTotalBytes: 32 * 1024 * 1024,
});

export type StudioAsset = InteractiveInputAsset;

export function normalizeStudioAssetName(name: string): string {
  const basename = name.replace(/\\/g, '/').split('/').pop() ?? 'asset.bin';
  const cleaned = basename
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (cleaned || 'asset.bin').slice(0, 160);
}

export function studioAssetPath(asset: Pick<StudioAsset, 'name'>): string {
  return `assets/${normalizeStudioAssetName(asset.name)}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export async function fileToStudioAsset(file: File): Promise<StudioAsset> {
  if (file.size > STUDIO_ASSET_LIMITS.maxAssetBytes) {
    throw new Error(
      `${file.name} exceeds the ${Math.round(STUDIO_ASSET_LIMITS.maxAssetBytes / 1024 / 1024)} MiB per-asset limit.`,
    );
  }

  const name = normalizeStudioAssetName(file.name);
  const base64 = arrayBufferToBase64(await file.arrayBuffer());

  return {
    id: `asset-${crypto.randomUUID()}`,
    name,
    mime: file.type || 'application/octet-stream',
    size: file.size,
    base64,
    virtualPath: `assets/${name}`,
  };
}

export function validateStudioAssetSet(assets: readonly StudioAsset[]): string | null {
  if (assets.length > STUDIO_ASSET_LIMITS.maxAssets) {
    return `Studio accepts at most ${STUDIO_ASSET_LIMITS.maxAssets} uploaded assets per session.`;
  }

  let total = 0;
  for (const asset of assets) {
    if (asset.size > STUDIO_ASSET_LIMITS.maxAssetBytes) {
      return `${asset.name} exceeds the per-asset size limit.`;
    }
    total += asset.size;
  }

  if (total > STUDIO_ASSET_LIMITS.maxTotalBytes) {
    return `Studio assets exceed the ${Math.round(STUDIO_ASSET_LIMITS.maxTotalBytes / 1024 / 1024)} MiB session limit.`;
  }

  return null;
}
