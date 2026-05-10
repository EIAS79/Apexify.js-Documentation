import { backgroundGalleryItems, type BackgroundGalleryCard } from '@/lib/gallery/background/backgroundSnippets';
import { spinWheelGalleryItems, type SpinWheelGalleryCard } from '@/lib/gallery/spin-wheel/spinWheelSnippets';
import { extraMotionGalleryItems } from '@/lib/gallery/motion/motionSnippets';
import { presentationSlideGalleryItems } from '@/lib/gallery/presentation/presentationSlideSnippet';
import { advanceGalleryItems } from '@/lib/gallery/advance/advanceSnippets';
import type { AdvanceGalleryCard } from '@/lib/gallery/core/galleryTypes';
import type { FilterCategory } from './galleryConfig';

export type GalleryItem = BackgroundGalleryCard | SpinWheelGalleryCard | AdvanceGalleryCard;

export const galleryItems: GalleryItem[] = [
  ...backgroundGalleryItems,
  ...spinWheelGalleryItems,
  ...extraMotionGalleryItems,
  ...presentationSlideGalleryItems,
  ...advanceGalleryItems,
];

/** Each item exposes one or more category "lenses" — same as before. */
export function discoverCategories(item: GalleryItem): Exclude<FilterCategory, 'all'>[] {
  const tags = new Set<Exclude<FilterCategory, 'all'>>();

  if (item.category === 'background') {
    tags.add('background');
    tags.add('mix');
    return [...tags];
  }

  if (item.category === 'gifs') {
    tags.add('gifs');
    tags.add('extras');
    tags.add('mix');
    return [...tags];
  }

  if (item.category === 'videos') {
    tags.add('videos');
    tags.add('extras');
    tags.add('mix');
    return [...tags];
  }

  if (item.category === 'advance') {
    tags.add('advance');
    tags.add('images');

    const advanceChartIds: string[] = [
      'advance-chart-donut-glow',
      'advance-comparison-donut-line',
      'presentation-deck-slide',
      'advance-chart-bar-quarterly',
      'advance-chart-hbar-routes',
      'advance-chart-line-dual-target',
    ];
    if (advanceChartIds.includes(item.id) || item.id.startsWith('advance-chartshowcase-')) {
      tags.add('charts');
    }

    if (item.id === 'advance-chartshowcase-comparison-pie-bar') {
      tags.add('mix');
    }

    if (
      item.id === 'presentation-deck-slide' ||
      item.id === 'advance-shape-collage' ||
      item.id === 'advance-text-glow-plaque'
    ) {
      tags.add('text');
    }

    if (
      item.id === 'advance-comparison-donut-line' ||
      item.id === 'presentation-deck-slide' ||
      item.id === 'advance-shape-collage'
    ) {
      tags.add('mix');
    }

    return [...tags];
  }

  return [...tags];
}

export function itemMatchesFilter(item: GalleryItem, filter: FilterCategory): boolean {
  if (filter === 'all') return true;
  return discoverCategories(item).includes(filter);
}

export function itemMatchesQuery(item: GalleryItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    item.title.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q) ||
    plainGallerySummary(item.description).toLowerCase().includes(q)
  );
}

/** Strip lightweight markdown so grid tiles + previews stay readable. */
export function plainGallerySummary(text: string): string {
  return text
    .replace(/\r?\n+/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function primaryBadgeCategory(item: GalleryItem): Exclude<FilterCategory, 'all'> {
  if (item.category === 'background') return 'background';
  if (item.category === 'gifs') return 'gifs';
  if (item.category === 'videos') return 'videos';
  const advanceChartBadgeIds = [
    'advance-chart-donut-glow',
    'advance-comparison-donut-line',
    'presentation-deck-slide',
    'advance-chart-bar-quarterly',
    'advance-chart-hbar-routes',
    'advance-chart-line-dual-target',
  ];
  if (item.id.startsWith('advance-chartshowcase-') || advanceChartBadgeIds.includes(item.id)) return 'charts';
  if (item.id === 'advance-text-glow-plaque') return 'text';
  if (item.id === 'advance-shape-collage') return 'images';
  return 'advance';
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
