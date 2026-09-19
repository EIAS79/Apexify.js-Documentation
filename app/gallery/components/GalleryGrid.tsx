'use client';

import type { CSSProperties } from 'react';
import {
  ArrowUpRightIcon,
  CheckBadgeIcon,
  CodeBracketIcon,
  FilmIcon,
} from '@heroicons/react/24/outline';
import { inferMediaKind } from '@/lib/gallery/core/galleryDocLink';
import { CATEGORY_CONFIG } from './galleryConfig';
import {
  galleryRuntime,
  galleryTrustLabel,
  isVerifiedGalleryItem,
  plainGallerySummary,
  primaryBadgeCategory,
  type GalleryItem,
} from './galleryHelpers';

export default function GalleryGrid({
  items,
  onOpen,
  variant = 'catalog',
}: {
  items: GalleryItem[];
  onOpen: (item: GalleryItem) => void;
  variant?: 'catalog' | 'featured';
}) {
  if (items.length === 0) {
    return (
      <div className="apx-gallery-empty">
        <span>NO MATCHES</span>
        <h2>Nothing in this view yet.</h2>
        <p>Try another category, clear search, or broaden source trust.</p>
      </div>
    );
  }

  return (
    <div className="apx-gallery-grid" data-variant={variant}>
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} onOpen={onOpen} featured={variant === 'featured'} />
      ))}
    </div>
  );
}

function GalleryCard({
  item,
  onOpen,
  featured,
}: {
  item: GalleryItem;
  onOpen: (item: GalleryItem) => void;
  featured: boolean;
}) {
  const category = primaryBadgeCategory(item);
  const cfg = CATEGORY_CONFIG[category];
  const mediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);
  const verified = isVerifiedGalleryItem(item);
  const summary = plainGallerySummary(item.description);
  const hasCode = Boolean(item.code?.ts?.trim() || item.code?.js?.trim());

  return (
    <article
      className="apx-gallery-card"
      data-category={category}
      data-featured={featured || undefined}
      data-media={mediaKind}
    >
      <button
        type="button"
        className="apx-gallery-card__button"
        data-cursor="pointer"
        onClick={() => onOpen(item)}
      >
        <div className="apx-gallery-card__visual">
          {mediaKind === 'video' ? (
            <video
              src={item.thumbnail}
              muted
              playsInline
              preload="metadata"
              aria-label={item.title}
            />
          ) : (
            // Local generated outputs; native img preserves animated GIF playback.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnail} alt="" loading="lazy" />
          )}

          <div className="apx-gallery-card__visual-top">
            <span
              className="apx-gallery-card__category"
              style={{ '--card-accent': cfg.accent } as CSSProperties}
            >
              {cfg.short}
            </span>
            <span className="apx-gallery-card__trust" data-verified={verified || undefined}>
              {verified ? <CheckBadgeIcon className="h-3.5 w-3.5" /> : null}
              {galleryTrustLabel(item)}
            </span>
          </div>

          {mediaKind !== 'image' ? (
            <span className="apx-gallery-card__motion">
              <FilmIcon className="h-4 w-4" />
              {mediaKind.toUpperCase()}
            </span>
          ) : null}
        </div>

        <div className="apx-gallery-card__body">
          <div className="apx-gallery-card__meta">
            <span>{cfg.label}</span>
            <span>{galleryRuntime(item)}</span>
            {hasCode ? <span><CodeBracketIcon className="h-3 w-3" /> source</span> : null}
          </div>

          <h2>{item.title}</h2>
          <p>{summary}</p>

          <div className="apx-gallery-card__footer">
            <span>{item.id}</span>
            <ArrowUpRightIcon className="h-4 w-4" />
          </div>
        </div>
      </button>
    </article>
  );
}
