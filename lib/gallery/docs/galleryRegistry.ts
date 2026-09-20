import { peakGalleryItems } from '../peak/peakGalleryItems';
import { doc5GalleryItems } from './doc5GalleryAdapter';
import type { RegistryGalleryItem } from '../core/galleryDocLink';

/**
 * Gallery registry after the peak-showcase reset.
 * The visible Gallery is the 21-piece curated catalog. DOC-5 examples stay
 * addressable for canonical verified-example links, but are not mixed into
 * the reset visual catalog.
 */
export const allGalleryItemsForDocs: RegistryGalleryItem[] = [
  ...peakGalleryItems,
  ...doc5GalleryItems,
];

export function getGalleryItemById(id: string): RegistryGalleryItem | undefined {
  return allGalleryItemsForDocs.find((item) => item.id === id);
}

export function getGalleryItemsByIds(ids: readonly string[]): RegistryGalleryItem[] {
  const set = new Set(ids);
  return allGalleryItemsForDocs.filter((item) => set.has(item.id));
}

export function plainGalleryDescription(markdown: string, max = 220): string {
  const text = markdown.replace(/\r?\n+/g, ' ').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
