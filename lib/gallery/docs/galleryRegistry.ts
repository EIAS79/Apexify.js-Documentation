import { backgroundGalleryItems } from '../background/backgroundSnippets';
import { spinWheelGalleryItems } from '../spin-wheel/spinWheelSnippets';
import { extraMotionGalleryItems } from '../motion/motionSnippets';
import { presentationSlideGalleryItems } from '../presentation/presentationSlideSnippet';
import { advanceGalleryItems } from '../advance/advanceSnippets';
import { doc5GalleryItems } from './doc5GalleryAdapter';
import type { RegistryGalleryItem } from '../core/galleryDocLink';

/**
 * Compatibility registry for docs/Gallery consumers.
 * DOC-5 authoritative items are derived from the generated example manifest; pre-DOC-5 items remain legacy inputs until their later controlled migration.
 */
export const allGalleryItemsForDocs: RegistryGalleryItem[] = [
  ...backgroundGalleryItems,
  ...spinWheelGalleryItems,
  ...extraMotionGalleryItems,
  ...presentationSlideGalleryItems,
  ...advanceGalleryItems,
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
