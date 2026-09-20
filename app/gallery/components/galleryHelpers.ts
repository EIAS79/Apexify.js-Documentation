import type { GalleryCardBase, GalleryLens } from '@/lib/gallery/core/galleryTypes';
import { doc5GalleryItems, type Doc5GalleryCard } from '@/lib/gallery/docs/doc5GalleryAdapter';
import { peakLabGalleryItems } from '@/lib/gallery/generatedPeakLabCatalog';
import type { FilterCategory } from './galleryConfig';

export type CuratedGalleryCard = GalleryCardBase & {
  category: 'advance';
  primaryLens?: GalleryLens;
  lenses?: GalleryLens[];
};

export type GalleryItem = CuratedGalleryCard | Doc5GalleryCard;
export type GalleryRuntimeFilter = 'all' | 'node';
export type GalleryEvidenceFilter = 'all' | 'verified' | 'legacy';

const peakShowcaseItems: CuratedGalleryCard[] = [
  {
    id: 'showcase-apexify-spectrum',
    category: 'advance',
    title: 'Apexify Spectrum',
    description: 'Peak showcase film spanning composition, typography, image work, charts, templates, audio, motion, and video. Presented as finished Apexify work rather than a source tutorial.',
    thumbnail: '/brand/Apexify-Spectrum.mp4',
    thumbnailMedia: 'video',
    featured: true,
    lenses: ['composition', 'image', 'typography', 'data', 'motion', 'surface', 'advanced'],
    primaryLens: 'motion',
    executionMode: 'none',
    sourceKind: 'showcase',
  },
  {
    id: 'showcase-orbit-breaker',
    category: 'advance',
    title: 'Orbit Breaker',
    description: 'A cinematic procedural motion study built to show the upper creative range of Apexify composition, effects, animation, and media output.',
    thumbnail: '/brand/Orbit-Breaker.mp4',
    thumbnailMedia: 'video',
    featured: true,
    lenses: ['composition', 'image', 'motion', 'advanced'],
    primaryLens: 'motion',
    executionMode: 'none',
    sourceKind: 'showcase',
  },
];

/**
 * Visible Gallery catalog.
 *
 * The two cinematic showcases are hand-curated finished work. Peak Lab items
 * are generated from the canonical Peak Lab source + real rendered artifacts
 * by the repository publishing workflow.
 */
export const galleryItems: GalleryItem[] = [
  ...peakShowcaseItems,
  ...peakLabGalleryItems,
];

export function isVerifiedGalleryItem(item: GalleryItem): item is Doc5GalleryCard {
  return 'doc5' in item && item.doc5 === true;
}

export function galleryRuntime(item: GalleryItem): 'node' {
  return isVerifiedGalleryItem(item) ? item.runtime : 'node';
}

export function galleryEvidence(item: GalleryItem): Exclude<GalleryEvidenceFilter, 'all'> {
  return isVerifiedGalleryItem(item) || item.sourceKind === 'peak-lab' ? 'verified' : 'legacy';
}

export function galleryTrustLabel(item: GalleryItem): 'Verified source' | 'Peak Lab' | 'Peak showcase' | 'Curated demo' {
  if (isVerifiedGalleryItem(item)) return 'Verified source';
  if (item.sourceKind === 'peak-lab') return 'Peak Lab';
  if (item.sourceKind === 'showcase') return 'Peak showcase';
  return 'Curated demo';
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
  const sourcePages = item.codePages?.map((page) => page.label).join(' ') ?? '';
  const outputLabels = item.outputs?.map((output) => output.label).join(' ') ?? '';
  return [
    item.title,
    item.id,
    plainGallerySummary(item.description),
    discoverCategories(item).join(' '),
    galleryRuntime(item),
    galleryEvidence(item),
    galleryTrustLabel(item),
    features,
    sourcePages,
    outputLabels,
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
