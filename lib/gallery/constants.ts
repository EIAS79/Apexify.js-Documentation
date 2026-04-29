/**
 * Whitelist for server-side gallery previews and `/api/gallery/thumbnail/[id]`.
 * Add new IDs here when you register runners in `previewRunners.ts` / domain modules.
 */
export const GALLERY_PREVIEW_IDS = [
  'bg-chromatic-depth',
  'bg-crt-ghost',
  'bg-solstice-silk',
  'bg-hex-stage',
  'bg-tideglass',
] as const;

export type GalleryPreviewId = (typeof GALLERY_PREVIEW_IDS)[number];

export function isGalleryPreviewId(id: string): id is GalleryPreviewId {
  return (GALLERY_PREVIEW_IDS as readonly string[]).includes(id);
}

export function hasGalleryPreview(id: string): boolean {
  return isGalleryPreviewId(id);
}
