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

export function galleryPackageVersion(): string | null {
  return doc5GalleryItems[0]?.verifiedPackageVersion ?? null;
}

/** Each item exposes one or more category lenses. DOC-5 items derive feature lenses from the authoritative manifest. */
export function discoverCategories(item: GalleryItem): Exclude<FilterCategory, 'all'>[] {
  const tags = new Set<Exclude<FilterCategory, 'all'>>();
  if (isVerifiedGalleryItem(item)) {
    tags.add('advance');
    if (item.doc5Features.includes('charts')) tags.add('charts');
    if (item.doc5Features.includes('gif')) { tags.add('gifs'); tags.add('extras'); }
    if (item.doc5Features.includes('canvas')) tags.add('images');
    if (item.doc5Features.includes('batch')) tags.add('mix');
    return [...tags];
  }
  if (item.category === 'background') { tags.add('background'); tags.add('mix'); return [...tags]; }
  if (item.category === 'gifs') { tags.add('gifs'); tags.add('extras'); tags.add('mix'); return [...tags]; }
  if (item.category === 'videos') { tags.add('videos'); tags.add('extras'); tags.add('mix'); return [...tags]; }
  if (item.category === 'advance') {
    tags.add('advance'); tags.add('images');
    const advanceChartIds = ['advance-chart-donut-glow','advance-comparison-donut-line','presentation-deck-slide','advance-chart-bar-quarterly','advance-chart-hbar-routes','advance-chart-line-dual-target'];
    if (advanceChartIds.includes(item.id) || item.id.startsWith('advance-chartshowcase-')) tags.add('charts');
    if (item.id === 'advance-chartshowcase-comparison-pie-bar') tags.add('mix');
    if (['presentation-deck-slide','advance-shape-collage','advance-text-glow-plaque'].includes(item.id)) tags.add('text');
    if (['advance-comparison-donut-line','presentation-deck-slide','advance-shape-collage'].includes(item.id)) tags.add('mix');
    return [...tags];
  }
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
    features,
  ].some((value) => value.toLowerCase().includes(q));
}

export function plainGallerySummary(text: string): string {
  return text.replace(/\r?\n+/g,' ').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1').replace(/\s+/g,' ').trim();
}

export function primaryBadgeCategory(item: GalleryItem): Exclude<FilterCategory,'all'> {
  if (isVerifiedGalleryItem(item)) {
    if(item.doc5Features.includes('charts'))return 'charts';
    if(item.doc5Features.includes('gif'))return 'gifs';
    if(item.doc5Features.includes('canvas'))return 'images';
    return 'advance';
  }
  if (item.category === 'background') return 'background';
  if (item.category === 'gifs') return 'gifs';
  if (item.category === 'videos') return 'videos';
  const ids=['advance-chart-donut-glow','advance-comparison-donut-line','presentation-deck-slide','advance-chart-bar-quarterly','advance-chart-hbar-routes','advance-chart-line-dual-target'];
  if(item.id.startsWith('advance-chartshowcase-')||ids.includes(item.id))return 'charts';
  if(item.id==='advance-text-glow-plaque')return 'text';
  if(item.id==='advance-shape-collage')return 'images';
  return 'advance';
}

export function parseGalleryHash(rawHash:string):{id:string;type:string|null}|null{
  const hash=rawHash.replace(/^#/,'').trim();
  if(!hash)return null;
  let decoded=hash;
  try{decoded=decodeURIComponent(hash);}catch{decoded=hash;}
  const plusIdx=decoded.lastIndexOf('+');
  if(plusIdx<=0)return{id:decoded,type:null};
  const id=decoded.slice(0,plusIdx).trim();
  const type=decoded.slice(plusIdx+1).trim().toLowerCase();
  if(!id)return null;
  return{id,type:type||null};
}
