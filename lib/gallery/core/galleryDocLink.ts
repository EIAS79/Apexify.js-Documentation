import type { BackgroundGalleryCard } from '../background/backgroundSnippets';
import type { SpinWheelGalleryCard } from '../spin-wheel/spinWheelSnippets';
import type { AdvanceGalleryCard, GalleryMediaKind } from './galleryTypes';

/** Same union as `GalleryClient` uses for items. */
export type RegistryGalleryItem = BackgroundGalleryCard | SpinWheelGalleryCard | AdvanceGalleryCard;

export function inferMediaKind(src: string, explicit?: GalleryMediaKind): GalleryMediaKind {
  if (explicit) return explicit;
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(src)) return 'video';
  if (/\.gif(\?|#|$)/i.test(src)) return 'gif';
  return 'image';
}

/** Fragment suffix for `/gallery#id+suffix` deep links. */
export function galleryHashSuffix(item: RegistryGalleryItem): string {
  if (item.category === 'background') return 'background';
  if (item.category === 'gifs') return 'gif';
  if (item.category === 'videos') return 'video';
  if (item.id.startsWith('advance-chartshowcase-') || item.id.includes('chart')) return 'chart';
  if (item.id.includes('text')) return 'text';
  if (item.id.includes('shape') || item.id.includes('image')) return 'image';
  return 'advance';
}

export function buildGalleryHash(item: RegistryGalleryItem): string {
  return `${item.id}+${galleryHashSuffix(item)}`;
}

export function galleryDeepLink(item: RegistryGalleryItem): string {
  return `/gallery#${encodeURIComponent(buildGalleryHash(item))}`;
}
