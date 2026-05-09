'use client';

import { getGalleryItemsByIds } from '@/lib/gallery/docs/galleryRegistry';
import { GalleryExample } from './GalleryExample';

export function RelatedGallery({ ids }: { ids: string }) {
  const list = ids
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const resolved = getGalleryItemsByIds(list);

  if (resolved.length === 0) {
    return null;
  }

  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      {resolved.map((item) => (
        <GalleryExample key={item.id} id={item.id} compact />
      ))}
    </div>
  );
}
