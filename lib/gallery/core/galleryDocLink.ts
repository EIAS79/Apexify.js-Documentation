import type { GalleryCardBase, GalleryLens, GalleryMediaKind } from './galleryTypes';

/** Generic registry card accepted by Gallery/docs consumers. */
export type RegistryGalleryItem = GalleryCardBase & {
  category: 'background' | 'gifs' | 'videos' | 'advance';
  primaryLens?: GalleryLens;
};

export function inferMediaKind(src: string, explicit?: GalleryMediaKind): GalleryMediaKind {
  if (explicit) return explicit;
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(src)) return 'video';
  if (/\.gif(\?|#|$)/i.test(src)) return 'gif';
  return 'image';
}

/** Fragment suffix for `/gallery#id+suffix` deep links. */
export function galleryHashSuffix(item: RegistryGalleryItem): string {
  if (item.primaryLens) return item.primaryLens;
  if (item.category === 'background') return 'surface';
  if (item.category === 'gifs' || item.category === 'videos') return 'motion';
  if (item.id.includes('chart')) return 'data';
  if (item.id.includes('text')) return 'typography';
  if (item.id.includes('shape') || item.id.includes('image')) return 'image';
  return 'advanced';
}

export function buildGalleryHash(item: RegistryGalleryItem): string {
  return `${item.id}+${galleryHashSuffix(item)}`;
}

export function galleryDeepLink(item: RegistryGalleryItem): string {
  return `/gallery#${encodeURIComponent(buildGalleryHash(item))}`;
}
