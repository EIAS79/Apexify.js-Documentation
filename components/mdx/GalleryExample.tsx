'use client';

import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { getGalleryItemById, plainGalleryDescription } from '@/lib/gallery/docs/galleryRegistry';
import { galleryDeepLink } from '@/lib/gallery/core/galleryDocLink';
import { GalleryPreview } from './GalleryPreview';

export function GalleryExample({ id, compact = false }: { id: string; compact?: boolean }) {
  const item = getGalleryItemById(id);
  if (!item) {
    return (
      <div className="my-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        Gallery preview unavailable (unknown id).
      </div>
    );
  }

  const href = galleryDeepLink(item);
  const blurb = plainGalleryDescription(item.description, compact ? 120 : 220);

  return (
    <figure className={`my-6 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4 ${compact ? 'max-w-md' : ''}`}>
      <GalleryPreview src={item.thumbnail} alt={item.title} thumbnailMedia={item.thumbnailMedia} />
      <figcaption className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-base font-semibold text-white">{item.title}</span>
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-sky-300"
          >
            Open in gallery
            <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{blurb}</p>
      </figcaption>
    </figure>
  );
}
