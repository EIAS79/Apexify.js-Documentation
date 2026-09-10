import { getGalleryExamples } from '@/lib/examples/manifest';
import type { AdvanceGalleryCard } from '../core/galleryTypes';

export type Doc5GalleryCard = AdvanceGalleryCard & {
  doc5: true;
  exampleRoute: string;
  runtime: 'node';
  difficulty: 'minimal' | 'practical' | 'advanced' | 'integration';
  doc5Features: string[];
  verificationStatus: 'verified';
};

export const doc5GalleryItems: Doc5GalleryCard[] = getGalleryExamples().map((example) => {
  const entry = example.sources.find((source) => source.path === example.entrypoint) ?? example.sources[0];
  const preview = example.outputs.find((output) => output.path === example.gallery.previewOutput);
  if (!entry || !preview?.publicPath) throw new Error(`[DOC-5 ${example.id}] Gallery adapter requires authoritative entry source and public preview.`);
  return {
    id: example.id,
    title: example.title,
    description: `${example.summary}\n\nVerified by DOC-5 against packed ${example.verifiedPackageVersion ?? 'apexify.js'}. [Open the canonical verified example](${example.canonicalRoute}).`,
    thumbnail: preview.publicPath,
    thumbnailMedia: preview.kind === 'gif' ? 'gif' : 'image',
    featured: example.gallery.featured,
    category: 'advance',
    code: { ts: entry.content },
    doc5: true,
    exampleRoute: example.canonicalRoute,
    runtime: 'node',
    difficulty: example.difficulty,
    doc5Features: example.features,
    verificationStatus: 'verified',
  };
});
