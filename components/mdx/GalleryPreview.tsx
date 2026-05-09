'use client';

import { inferMediaKind } from '@/lib/gallery/core/galleryDocLink';

export function GalleryPreview({
  src,
  alt,
  thumbnailMedia,
  className = '',
}: {
  src: string;
  alt: string;
  thumbnailMedia?: 'image' | 'gif' | 'video';
  className?: string;
}) {
  const kind = inferMediaKind(src, thumbnailMedia);
  const wrap = `rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-lg ${className}`;
  if (kind === 'video') {
    return (
      <div className={wrap}>
        <video
          src={src}
          className="w-full max-h-[min(420px,55vh)] object-contain mx-auto bg-black"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }
  return (
    <div className={wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full max-h-[min(420px,55vh)] object-contain mx-auto"
        loading="lazy"
      />
    </div>
  );
}
