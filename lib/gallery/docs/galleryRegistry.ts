import { backgroundGalleryItems } from '../background/backgroundSnippets';
import { spinWheelGalleryItems } from '../spin-wheel/spinWheelSnippets';
import { extraMotionGalleryItems } from '../motion/motionSnippets';
import { presentationSlideGalleryItems } from '../presentation/presentationSlideSnippet';
import { advanceGalleryItems } from '../advance/advanceSnippets';
import type { RegistryGalleryItem } from '../core/galleryDocLink';

export type { RegistryGalleryItem };

export const allGalleryItemsForDocs: RegistryGalleryItem[] = [
  ...backgroundGalleryItems,
  ...spinWheelGalleryItems,
  ...extraMotionGalleryItems,
  ...presentationSlideGalleryItems,
  ...advanceGalleryItems,
];

export function getGalleryItemById(id: string): RegistryGalleryItem | undefined {
  return allGalleryItemsForDocs.find((item) => item.id === id);
}

export function getGalleryItemsByIds(ids: string[]): RegistryGalleryItem[] {
  const map = new Map(allGalleryItemsForDocs.map((item) => [item.id, item]));
  return ids.map((id) => map.get(id)).filter(Boolean) as RegistryGalleryItem[];
}

/** Strip light markdown for doc cards (titles/descriptions). */
export function plainGalleryDescription(text: string, maxLen = 220): string {
  const plain = text
    .replace(/\r?\n+/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}
