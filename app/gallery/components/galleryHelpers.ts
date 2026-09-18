import { backgroundGalleryItems, type BackgroundGalleryCard } from '@/lib/gallery/background/backgroundSnippets';
import { spinWheelGalleryItems, type SpinWheelGalleryCard } from '@/lib/gallery/spin-wheel/spinWheelSnippets';
import { extraMotionGalleryItems } from '@/lib/gallery/motion/motionSnippets';
import { presentationSlideGalleryItems } from '@/lib/gallery/presentation/presentationSlideSnippet';
import { advanceGalleryItems } from '@/lib/gallery/advance/advanceSnippets';
import { doc5GalleryItems, type Doc5GalleryCard } from '@/lib/gallery/docs/doc5GalleryAdapter';
import type { AdvanceGalleryCard } from '@/lib/gallery/core/galleryTypes';
import type { FilterCategory } from './galleryConfig';

export type GalleryItem = BackgroundGalleryCard | SpinWheelGalleryCard | AdvanceGalleryCard | Doc5GalleryCard;
export type GalleryRuntimeFilter = 'all' | 'node';
export type GalleryEvidenceFilter = 'all' | 'verified' | 'legacy';

export const galleryItems: GalleryItem[] = [
  ...backgroundGalleryItems,
  ...spinWheelGalleryItems,
  ...extraMotionGalleryItems,
  ...presentationSlideGalleryItems,
  ...advanceGalleryItems,
  ...doc5GalleryItems,
];

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

const DATA_IDS = new Set([
  'advance-chart-donut-glow',
  'advance-comparison-donut-line',
  'presentation-deck-slide',
  'advance-chart-bar-quarterly',
  'advance-chart-hbar-routes',
  'advance-chart-line-dual-target',
]);

const TYPOGRAPHY_IDS = new Set([
  'advance-text-glow-plaque',
  'presentation-deck-slide',
]);

const IMAGE_IDS = new Set([
  'advance-shape-collage',
]);

const COMPOSITION_IDS = new Set([
  'advance-comparison-donut-line',
  'presentation-deck-slide',
  'advance-shape-collage',
]);

/** Visual lenses used by the Gallery UI. One item may appear under more than one lens. */
export function discoverCategories(item: GalleryItem): Exclude<FilterCategory, 'all'>[] {
  const tags = new Set<Exclude<FilterCategory, 'all'>>();

  if (isVerifiedGalleryItem(item)) {
    if (item.doc5Features.includes('charts')) tags.add('data');
    if (item.doc5Features.includes('gif')) tags.add('motion');
    if (item.doc5Features.includes('canvas')) tags.add('image');
    if (item.doc5Features.includes('batch')) tags.add('composition');
    if (tags.size === 0) tags.add('advanced');
    return [...tags];
  }

  if (item.category === 'background') {
    tags.add('surface');
    tags.add('composition');
    return [...tags];
  }

  if (item.category === 'gifs' || item.category === 'videos') {
    tags.add('motion');
    tags.add('composition');
    return [...tags];
  }

  if (item.category === 'advance') {
    if (DATA_IDS.has(item.id) || item.id.startsWith('advance-chartshowcase-')) tags.add('data');
    if (TYPOGRAPHY_IDS.has(item.id)) tags.add('typography');
    if (IMAGE_IDS.has(item.id)) tags.add('image');
    if (COMPOSITION_IDS.has(item.id) || item.id === 'advance-chartshowcase-comparison-pie-bar') tags.add('composition');

    if (tags.size === 0) tags.add('advanced');
    else if (tags.size > 1) tags.add('advanced');

    return [...tags];
  }

  tags.add('composition');
  return [...tags];
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
