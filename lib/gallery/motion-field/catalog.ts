import type { GalleryLens, GalleryMediaKind } from '../core/galleryTypes';

export type GallerySection = 'use-cases' | 'explore' | 'templates' | 'examples';
export type FieldEntry = {
  id: string; title: string; description: string; thumbnail: string; poster?: string;
  media: GalleryMediaKind; lenses: GalleryLens[]; primary: GalleryLens;
  kind: 'template' | 'example' | 'showcase'; sourceLabel: string;
  source?: string; output?: string; difficulty?: string;
  steps?: { title: string; detail: string }[];
  edits?: string; docs?: string;
};
const base = '/gallery/motion-field';
const make = (id: string, title: string, description: string, primary: GalleryLens, edits: string, difficulty: string): FieldEntry => ({
  id, title, description, primary, lenses: [primary, 'composition'], kind: 'template',
  thumbnail: `${base}/${id}${primary === 'motion' ? '.mp4' : '.webp'}`,
  poster: `${base}/${id}.webp`, media: primary === 'motion' ? 'video' : 'image',
  source: `${base}/source/${id}.mjs`, output: `${base}/${id}.png`,
  sourceLabel: 'Source matched', difficulty, edits, docs: '/docs/node/canvas',
  steps: [
    { title: 'Make it yours', detail: `Edit the settings object at the top. ${edits}` },
    { title: 'Create the canvas', detail: 'createCanvas sets a 1200 × 675 surface. Layers paint in order, from background to foreground.' },
    { title: 'Compose the artwork', detail: 'Paths draw the geometry, image layers add shapes, and text layers use bundled, reproducible fonts.' },
    { title: 'Render and save', detail: 'renderScene returns PNG bytes. The final writeFile saves them beside your downloaded script.' },
  ],
});
export const fieldTemplates: FieldEntry[] = [
  make('orbit-study', 'Orbit study', 'A procedural orbital composition. Project ribbons into a canvas, shade them with light, and animate a satellite.', 'motion', 'Change title, accent and satellite color. The phase argument controls the loop.', 'Advanced'),
  make('signal-flow', 'Signal flow', 'Turn layered sine waves into a flowing identity system. One small function produces a complete motion loop.', 'motion', 'Change title, accent, line color or density. Start with the supplied density of 48.', 'Intermediate'),
  make('launch-card', 'Launch card', 'A reusable announcement for product releases, social posts and link previews. Bold typography meets procedural geometry.', 'image', 'Change title, subtitle, caption and accent. Keep each headline short to fit the layout.', 'Beginner friendly'),
  make('data-pulse', 'Data pulse', 'Give a report a visual point of view with dimensional bars and an editorial headline. Includes clearly labeled sample data.', 'data', 'Replace the six values and matching labels; keep values nonnegative. Heights scale to the largest value.', 'Intermediate'),
  make('prism-type', 'Prism type', 'An architectural poster made from repeating geometric panels. Build rhythm with color, depth and type.', 'typography', 'Change title, subtitle and accent. Short titles preserve the editorial composition.', 'Beginner friendly'),
];
export const fieldUseCases = [
  { id: 'social', title: 'Make every link count.', label: 'SOCIAL & LAUNCHES', description: 'Generate branded launch cards, article covers and social images from reusable data.', template: 'launch-card', lens: 'image' as GalleryLens, action: 'Explore social images' },
  { id: 'motion', title: 'Give ideas a little motion.', label: 'MOTION & IDENTITY', description: 'Create frame sequences and rendered loops for campaign visuals, brand studies and presentations.', template: 'orbit-study', lens: 'motion' as GalleryLens, action: 'Explore motion' },
  { id: 'reports', title: 'Make the numbers visible.', label: 'DATA & REPORTS', description: 'Turn structured data into shareable visual reports and illustrated summaries.', template: 'data-pulse', lens: 'data' as GalleryLens, action: 'Explore data' },
  { id: 'editorial', title: 'Build a visual language.', label: 'TYPE & COMPOSITION', description: 'Compose posters and repeatable editorial graphics with typography, shapes and controlled layout.', template: 'prism-type', lens: 'typography' as GalleryLens, action: 'Explore typography' },
];
export function filterFieldEntries(entries: FieldEntry[], section: GallerySection, lens: string, query: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(entry =>
    (section !== 'templates' || entry.kind === 'template') &&
    (section !== 'examples' || entry.kind !== 'showcase') &&
    (lens === 'all' || entry.lenses.includes(lens as GalleryLens)) &&
    words.every(word => `${entry.title} ${entry.description} ${entry.lenses.join(' ')} ${entry.difficulty ?? ''}`.toLowerCase().includes(word)),
  );
}
