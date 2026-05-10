'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowsPointingOutIcon,
  CodeBracketIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { CATEGORY_CONFIG, type FilterCategory } from './galleryConfig';
import {
  type GalleryItem,
  discoverCategories,
  primaryBadgeCategory,
  plainGallerySummary,
} from './galleryHelpers';
import { inferMediaKind } from '@/lib/gallery/core/galleryDocLink';

export default function GalleryGrid({
  items,
  selectedFilter,
  onOpen,
}: {
  items: GalleryItem[];
  selectedFilter: FilterCategory;
  onOpen: (item: GalleryItem) => void;
}) {
  const featured = items.filter((i) => i.featured).slice(0, 3);
  const rest = items.filter((i) => !i.featured || !featured.some((f) => f.id === i.id));

  if (items.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl border-2 border-dashed mx-auto max-w-2xl"
        style={{
          borderColor: 'var(--border-default)',
          backgroundColor: 'var(--bg-sunken)',
          color: 'var(--text-tertiary)',
        }}
      >
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Nothing matched your filters
        </h3>
        <p className="text-sm max-w-md mx-auto">
          Try a different lane or clear the search to see the full collection.
        </p>
      </div>
    );
  }

  return (
    <div>
      {featured.length > 0 && (
        <FeaturedRibbon featured={featured} selectedFilter={selectedFilter} onOpen={onOpen} />
      )}

      {rest.length > 0 && (
        <div>
          {featured.length > 0 && (
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'var(--accent-magenta)' }}
              >
                More in this lane
              </span>
              <span
                className="h-px flex-1"
                style={{
                  background:
                    'linear-gradient(90deg, var(--border-default), transparent)',
                }}
              />
            </div>
          )}
          <div className="columns-1 sm:columns-2 xl:columns-3 gap-5 lg:gap-6 [column-fill:_balance]">
            {rest.map((item, i) => (
              <GalleryCard key={item.id} item={item} index={i} onClick={() => onOpen(item)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Featured ribbon                                                         */
/* ---------------------------------------------------------------------- */

function FeaturedRibbon({
  featured,
  selectedFilter,
  onOpen,
}: {
  featured: GalleryItem[];
  selectedFilter: FilterCategory;
  onOpen: (item: GalleryItem) => void;
}) {
  // Single featured = one big editorial spotlight; 2-3 = a balanced grid
  if (featured.length === 1) {
    return (
      <FeaturedSpotlight item={featured[0]} onOpen={() => onOpen(featured[0])} />
    );
  }
  return (
    <div className="mb-12 sm:mb-16">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5"
            style={{ color: 'var(--accent-magenta)' }}
          >
            Editor&apos;s picks
          </p>
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {selectedFilter === 'all' ? 'Worth opening first' : 'Top of this lane'}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {featured.map((item, i) => (
          <FeaturedTile
            key={item.id}
            item={item}
            featuredIndex={i}
            onClick={() => onOpen(item)}
          />
        ))}
      </div>
    </div>
  );
}

/* Single big editorial card */
function FeaturedSpotlight({
  item,
  onOpen,
}: {
  item: GalleryItem;
  onOpen: () => void;
}) {
  const cfg = CATEGORY_CONFIG[primaryBadgeCategory(item)];
  const Icon = cfg.icon;
  const mediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) v.play().catch(() => {});
    else {
      v.pause();
      try { v.currentTime = 0; } catch {}
    }
  }, [hovered]);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative block w-full text-left rounded-3xl overflow-hidden mb-12 sm:mb-16 lift surface-elevated"
      style={{
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="relative aspect-[21/9] sm:aspect-[5/2] overflow-hidden" style={{ backgroundColor: 'var(--bg-sunken)' }}>
        {mediaKind === 'video' ? (
          <video
            ref={videoRef}
            src={item.thumbnail}
            muted
            playsInline
            loop
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.thumbnail}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}
        {/* Soft scrim with theme-aware tint */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(110deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 30%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(135deg, ${cfg.accentSoft}, transparent 50%)`,
          }}
        />
        {/* Top-left badges */}
        <div className="absolute top-5 left-5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
            style={{
              backgroundColor: cfg.accent,
              boxShadow: `0 0 24px -4px ${cfg.accent}`,
            }}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
            style={{
              backgroundImage: 'var(--gradient-sunset)',
              boxShadow: 'var(--glow-magenta)',
            }}
          >
            ★ Featured
          </span>
        </div>
        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55 mb-2">
            Editor&apos;s pick
          </p>
          <h3 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-black leading-[1.05] mb-3 text-balance">
            {item.title}
          </h3>
          <p className="text-sm sm:text-[15px] text-white/75 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-4 max-w-xl">
            {plainGallerySummary(item.description)}
          </p>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em] text-white/85 group-hover:text-white"
          >
            Open the recipe
            <ArrowsPointingOutIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* Featured tile — used when 2-3 featured items exist */
function FeaturedTile({
  item,
  featuredIndex,
  onClick,
}: {
  item: GalleryItem;
  featuredIndex: number;
  onClick: () => void;
}) {
  const cfg = CATEGORY_CONFIG[primaryBadgeCategory(item)];
  const Icon = cfg.icon;
  const mediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) v.play().catch(() => {});
    else {
      v.pause();
      try { v.currentTime = 0; } catch {}
    }
  }, [hovered]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: featuredIndex * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative block text-left rounded-2xl overflow-hidden surface-elevated lift"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="relative aspect-[5/3]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
        {mediaKind === 'video' ? (
          <video
            ref={videoRef}
            src={item.thumbnail}
            muted
            playsInline
            loop
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.thumbnail}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7))' }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${cfg.accentSoft}, transparent 60%)` }}
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: cfg.accent }}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
          <span
            className="inline-flex items-center px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundImage: 'var(--gradient-sunset)' }}
          >
            ★ Featured
          </span>
        </div>
        {mediaKind !== 'image' && (
          <span
            className="absolute top-3 right-3 inline-flex items-center justify-center h-7 w-7 rounded-full text-white"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <PlayIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3
          className="text-base sm:text-lg font-bold leading-snug mb-1 line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.title}
        </h3>
        <p
          className="text-[13px] leading-relaxed line-clamp-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {plainGallerySummary(item.description)}
        </p>
      </div>
    </motion.button>
  );
}

/* ---------------------------------------------------------------------- */
/* Standard masonry card                                                   */
/* ---------------------------------------------------------------------- */

function GalleryCard({
  item,
  index,
  onClick,
}: {
  item: GalleryItem;
  index: number;
  onClick: () => void;
}) {
  const cfg = CATEGORY_CONFIG[primaryBadgeCategory(item)];
  const Icon = cfg.icon;
  const mediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);
  const extraTags = discoverCategories(item).filter((c) => c !== primaryBadgeCategory(item)).slice(0, 3);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const hasCode = Boolean(item.code?.ts || item.code?.js);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) v.play().catch(() => {});
    else {
      v.pause();
      try { v.currentTime = 0; } catch {}
    }
  }, [hovered]);

  return (
    <motion.button
      type="button"
      data-gallery-item
      id={item.id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: Math.min(index, 12) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="break-inside-avoid mb-5 lg:mb-6 w-full block text-left group relative overflow-hidden rounded-2xl surface-elevated lift"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="relative aspect-[4/3]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
        {mediaKind === 'video' ? (
          <video
            ref={videoRef}
            src={item.thumbnail}
            muted
            playsInline
            loop
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 30%, rgba(0,0,0,0.55) 100%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${cfg.accentSoft}, transparent 65%)` }}
        />
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: cfg.accent }}
          >
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
          <div className="flex items-center gap-1">
            {hasCode && (
              <span
                className="h-6 w-6 inline-flex items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
                title="Has source"
              >
                <CodeBracketIcon className="h-3 w-3" />
              </span>
            )}
            {item.featured && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest text-white"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid color-mix(in srgb, var(--accent-amber) 50%, transparent)',
                  color: 'var(--accent-amber-soft)',
                }}
              >
                ★
              </span>
            )}
          </div>
        </div>
        {/* Center play indicator on video/gif */}
        {mediaKind !== 'image' && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          >
            <span
              className="inline-flex h-12 w-12 items-center justify-center rounded-full text-white"
              style={{
                backgroundColor: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <PlayIcon className="h-5 w-5" />
            </span>
          </div>
        )}
      </div>
      <div
        className="p-4 sm:p-5 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {extraTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {extraTags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--bg-sunken)',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                +{CATEGORY_CONFIG[tag].label}
              </span>
            ))}
          </div>
        )}
        <h3
          className="text-base font-bold leading-snug mb-1.5 line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.title}
        </h3>
        <p
          className="text-[13px] leading-relaxed line-clamp-3"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {plainGallerySummary(item.description)}
        </p>
        <div
          className="mt-3 pt-3 flex items-center justify-between border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em] transition-colors"
            style={{ color: cfg.accent }}
          >
            Open
          </span>
          <ArrowsPointingOutIcon
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
      </div>
    </motion.button>
  );
}
