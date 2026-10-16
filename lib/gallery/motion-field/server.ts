import 'server-only';
import { galleryItems, discoverCategories, plainGallerySummary } from '@/app/gallery/components/galleryHelpers';
import { doc5GalleryItems } from '@/lib/gallery/docs/doc5GalleryAdapter';
import { inferMediaKind } from '@/lib/gallery/core/galleryDocLink';
import { fieldTemplates, type FieldEntry } from './catalog';

export const sourceItems = [...galleryItems, ...doc5GalleryItems];
export function getFieldEntries(): FieldEntry[] {
  const unique = new Map(sourceItems.map(item => [item.id, item]));
  return [...fieldTemplates, ...Array.from(unique.values()).map(item => ({
    id: item.id, title: item.title, description: plainGallerySummary(item.description),
    thumbnail: item.thumbnail, media: inferMediaKind(item.thumbnail, item.thumbnailMedia),
    ...((item.sourceKind === 'showcase' || inferMediaKind(item.thumbnail, item.thumbnailMedia) === 'gif') ? { poster: `/gallery/motion-field/${item.id}.webp` } : {}),
    lenses: discoverCategories(item), primary: item.primaryLens ?? discoverCategories(item)[0],
    kind: item.sourceKind === 'showcase' ? 'showcase' as const : 'example' as const,
    sourceLabel: item.sourceKind === 'showcase' ? 'Showcase film' : item.sourceKind === 'peak-lab' ? 'Peak Lab recipe' : 'Verified docs example',
    ...('exampleRoute' in item ? { docs: item.exampleRoute } : {}),
  }))];
}
