import 'server-only';
import { galleryItems, discoverCategories, plainGallerySummary } from '@/app/gallery/components/galleryHelpers';
import { inferMediaKind } from '@/lib/gallery/core/galleryDocLink';
import { fieldTemplates, type FieldEntry } from './catalog';

/** Keep legacy DOC-5 learning examples in Docs, not in the curated editorial Gallery.
 * The basic blue canvas and simple chart fixtures are useful tutorials, but
 * they are not representative art direction for the public showcase. */
export const sourceItems = [...galleryItems];
export function getFieldEntries(): FieldEntry[] {
  const unique = new Map(sourceItems.map(item => [item.id, item]));
  const promoted = new Set(['peak-16', 'peak-18', 'peak-03']);
  const curated = Array.from(unique.values()).filter(item =>
    !['peak-11'].includes(item.id));
  curated.sort((a, b) => Number(promoted.has(b.id)) - Number(promoted.has(a.id)));
  return [...fieldTemplates, ...curated.map(item => ({
    id: item.id, title: item.title, description: plainGallerySummary(item.description),
    thumbnail: item.thumbnail, media: inferMediaKind(item.thumbnail, item.thumbnailMedia),
    ...((item.sourceKind === 'showcase' || inferMediaKind(item.thumbnail, item.thumbnailMedia) === 'gif') ? { poster: `/gallery/motion-field/${item.id}.webp` } : {}),
    lenses: discoverCategories(item), primary: item.primaryLens ?? discoverCategories(item)[0],
    kind: item.sourceKind === 'showcase' ? 'showcase' as const : promoted.has(item.id) ? 'template' as const : 'example' as const,
    sourceLabel: item.sourceKind === 'showcase' ? 'Showcase film' : promoted.has(item.id) ? 'Verified Apexify recipe · multi-output' : item.sourceKind === 'peak-lab' ? 'Peak Lab recipe' : 'Verified docs example',
    ...('exampleRoute' in item ? { docs: item.exampleRoute } : {}),
    ...(promoted.has(item.id) ? { difficulty: 'Advanced · source-backed',
      steps: [
        { title: 'Explore the composition', detail: 'Inspect the original Apexify recipe and its declared source structure.' },
        { title: 'Review its variations', detail: 'Use the output selector to compare actual renders from the same recipe.' },
        { title: 'Adapt with care', detail: 'Copy the full recipe with its imports and helpers; retain supported Apexify API calls.' },
        { title: 'Run and verify', detail: 'Execute locally with the pinned Node runtime, assets and fonts before publishing a modified result.' },
      ], } : {}),
  }))];
}
