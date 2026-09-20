import { doc5GalleryItems } from './doc5GalleryAdapter';
import { peakLabGalleryItems } from '../generatedPeakLabCatalog';
import type { RegistryGalleryItem } from '../core/galleryDocLink';

/**
 * Documentation/search registry after the Gallery output reset.
 *
 * The visible Gallery catalog is intentionally empty. Verified DOC-5 examples
 * remain registered here because documentation search and canonical example
 * links still depend on their authoritative metadata; they are not injected
 * back into the visual Gallery catalog.
 */
export const allGalleryItemsForDocs: RegistryGalleryItem[] = [
  ...doc5GalleryItems,
  ...peakLabGalleryItems,
];

export function getGalleryItemById(id: string): RegistryGalleryItem | undefined {
  return allGalleryItemsForDocs.find((item) => item.id === id);
}

export function getGalleryItemsByIds(ids: readonly string[]): RegistryGalleryItem[] {
  const set = new Set(ids);
  return allGalleryItemsForDocs.filter((item) => set.has(item.id));
}

export function plainGalleryDescription(markdown: string, max = 220): string {
  const text = markdown
    .replace(/\r?\n+/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
