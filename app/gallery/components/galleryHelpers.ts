import { peakGalleryItems, type PeakGalleryCard } from '@/lib/gallery/peak/peakGalleryItems';
import { peakLabGalleryItems, type PeakLabGalleryCard } from '@/lib/gallery/peak/peakLabGalleryItems';
import { doc5GalleryItems, type Doc5GalleryCard } from '@/lib/gallery/docs/doc5GalleryAdapter';
import type { FilterCategory } from './galleryConfig';

export type GalleryItem = PeakGalleryCard | PeakLabGalleryCard | Doc5GalleryCard;
export type GalleryRuntimeFilter = 'all' | 'node';
export type GalleryEvidenceFilter = 'all' | 'verified' | 'legacy';

/**
 * Visible Gallery catalog.
 *
 * The pre-reset curated catalog remains in source/history for compatibility,
 * but the Gallery UI now starts from the purpose-built peak showcase plus
 * the complete 26-recipe Peak Lab collection.
 * DOC-5 examples remain available at /examples and still provide package
 * provenance/version information below.
 */
export const galleryItems: GalleryItem[] = [...peakGalleryItems, ...peakLabGalleryItems];

export function isVerifiedGalleryItem(item: GalleryItem): item is Doc5GalleryCard {
  return 'doc5' in item && item.doc5 === true;
}

export function galleryRuntime(item: GalleryItem): 'node' {
  return isVerifiedGalleryItem(item) ? item.runtime : 'node';
}

export function galleryEvidence(item: GalleryItem): Exclude<GalleryEvidenceFilter, 'all'> {
  return isVerifiedGalleryItem(item) ? 'verified' : 'legacy';
}

export function galleryTrustLabel(item: GalleryItem): 'Verified source' | 'Curated demo' {
  return isVerifiedGalleryItem(item) ? 'Verified source' : 'Curated demo';
}

export function galleryPackageVersion(): string | null {
  return doc5GalleryItems[0]?.verifiedPackageVersion ?? null;
}

/** Visual lenses used by the Gallery UI. One item may appear under more than one lens. */
export function discoverCategories(item: GalleryItem): Exclude<FilterCategory, 'all'>[] {
  if ('lenses' in item && Array.isArray(item.lenses) && item.lenses.length > 0) {
    return [...new Set(item.lenses)];
  }

  if (isVerifiedGalleryItem(item)) {
    const tags = new Set<Exclude<FilterCategory, 'all'>>();
    if (item.doc5Features.includes('charts')) tags.add('data');
    if (item.doc5Features.includes('gif')) tags.add('motion');
    if (item.doc5Features.includes('canvas')) tags.add('image');
    if (item.doc5Features.includes('batch')) tags.add('composition');
    if (tags.size === 0) tags.add('advanced');
    return [...tags];
  }

  return ['advanced'];
}

export function itemMatchesFilter(item: GalleryItem, filter: FilterCategory): boolean {
  return filter === 'all' || discoverCategories(item).includes(filter);
}

export function itemMatchesRuntime(item: GalleryItem, filter: GalleryRuntimeFilter): boolean {
  return filter === 'all' || galleryRuntime(item) === filter;
}

export function itemMatchesEvidence(item: GalleryItem, filter: GalleryEvidenceFilter): boolean {
  return filter === 'all' || galleryEvidence(item) === filter;
}

export function itemMatchesQuery(item: GalleryItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const features = isVerifiedGalleryItem(item) ? item.doc5Features.join(' ') : '';
  return [
    item.title,
    item.id,
    plainGallerySummary(item.description),
    discoverCategories(item).join(' '),
    galleryRuntime(item),
    galleryEvidence(item),
    galleryTrustLabel(item),
    features,
  ].some((value) => value.toLowerCase().includes(q));
}

export function plainGallerySummary(text: string): string {
  return text
    .replace(/\r?\n+/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\`([^\`]+)\`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function primaryBadgeCategory(item: GalleryItem): Exclude<FilterCategory, 'all'> {
  if ('primaryLens' in item && item.primaryLens) return item.primaryLens;

  const categories = discoverCategories(item);
  const priority: Exclude<FilterCategory, 'all'>[] = [
    'composition',
    'image',
    'typography',
    'data',
    'motion',
    'surface',
    'advanced',
  ];
  return priority.find((category) => categories.includes(category)) ?? 'advanced';
}

export function parseGalleryHash(rawHash: string): { id: string; type: string | null } | null {
  const hash = rawHash.replace(/^#/, '').trim();
  if (!hash) return null;

  let decoded = hash;
  try {
    decoded = decodeURIComponent(hash);
  } catch {
    decoded = hash;
  }

  const plusIdx = decoded.lastIndexOf('+');
  if (plusIdx <= 0) return { id: decoded, type: null };

  const id = decoded.slice(0, plusIdx).trim();
  const type = decoded.slice(plusIdx + 1).trim().toLowerCase();
  if (!id) return null;
  return { id, type: type || null };
}
