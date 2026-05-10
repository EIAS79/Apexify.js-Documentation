'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Category = 'backgrounds' | 'charts' | 'compositions';

type ShowcaseItem = {
  src: string;
  title: string;
  category: Category;
  blurb?: string;
};

const ITEMS: ShowcaseItem[] = [
  // Backgrounds (14)
  { src: '/gallery-outputs/backgrounds/bg-aurora-grid.png', title: 'Aurora Grid', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-chromatic-depth.png', title: 'Chromatic Depth', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-crossweave-noir.png', title: 'Crossweave Noir', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-crt-ghost.png', title: 'CRT Ghost', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-crystal-fog.png', title: 'Crystal Fog', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-hex-stage.png', title: 'Hex Stage', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-molten-core.png', title: 'Molten Core', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-pipeline-color-stripes.png', title: 'Color Stripes', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-pipeline-framed-chrome.png', title: 'Framed Chrome', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-pipeline-gradient-grid-crosses.png', title: 'Grid Crosses', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-pipeline-layer-dots-multiply.png', title: 'Dots Multiply', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-pipeline-transparent-gradient.png', title: 'Transparent Gradient', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-solstice-silk.png', title: 'Solstice Silk', category: 'backgrounds' },
  { src: '/gallery-outputs/backgrounds/bg-tideglass.png', title: 'Tideglass', category: 'backgrounds' },
  // Charts (14)
  { src: '/gallery-outputs/images/chart-bar-quarterly.png', title: 'Bar — Quarterly', category: 'charts' },
  { src: '/gallery-outputs/images/chart-donut-luminous.png', title: 'Donut — Luminous', category: 'charts' },
  { src: '/gallery-outputs/images/chart-hbar-routes.png', title: 'H-Bar — Routes', category: 'charts' },
  { src: '/gallery-outputs/images/chart-line-dual-target.png', title: 'Line — Dual target', category: 'charts' },
  { src: '/gallery-outputs/images/comparison-donut-line.png', title: 'Comparison — Donut + Line', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-bar-grouped.png', title: 'Bar — Grouped', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-bar-lollipop.png', title: 'Bar — Lollipop', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-bar-waterfall.png', title: 'Bar — Waterfall', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-combo-grouped-lines.png', title: 'Combo — Grouped Lines', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-comparison-pie-bar.png', title: 'Comparison — Pie + Bar', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-hbar-stacked.png', title: 'H-Bar — Stacked', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-line-all-styles.png', title: 'Line — All Styles', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-line-rich.png', title: 'Line — Rich', category: 'charts' },
  { src: '/gallery-outputs/images/gallery-chartshowcase-pie-connected.png', title: 'Pie — Connected', category: 'charts' },
  // Compositions (3)
  { src: '/gallery-outputs/images/presentation-slide.png', title: 'Slide — Composition', category: 'compositions' },
  { src: '/gallery-outputs/images/advance-text-glow-plaque.png', title: 'Text — Glow Plaque', category: 'compositions' },
  { src: '/gallery-outputs/images/shape-collage-prism.png', title: 'Shapes — Prism', category: 'compositions' },
];

const FILTERS: { id: 'all' | Category; label: string; accent: string }[] = [
  { id: 'all', label: 'All', accent: 'var(--accent-iris)' },
  { id: 'backgrounds', label: 'Backgrounds', accent: 'var(--accent-iris)' },
  { id: 'charts', label: 'Charts', accent: 'var(--accent-magenta)' },
  { id: 'compositions', label: 'Compositions', accent: 'var(--accent-amber)' },
];

export default function ShowcaseWall() {
  const [filter, setFilter] = useState<'all' | Category>('all');
  const [lightbox, setLightbox] = useState<ShowcaseItem | null>(null);

  const filtered = useMemo(
    () => (filter === 'all' ? ITEMS : ITEMS.filter((i) => i.category === filter)),
    [filter]
  );

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: ITEMS.length };
    ITEMS.forEach((i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1;
    });
    return acc;
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  return (
    <section id="showcase" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3"
              style={{ color: 'var(--accent-magenta)' }}
            >
              Showcase
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-4 text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              Every image below was{' '}
              <span className="text-grad-sunset">rendered with this library</span>.
            </h2>
            <p
              className="text-base sm:text-lg leading-relaxed text-pretty"
              style={{ color: 'var(--text-secondary)' }}
            >
              No mockups, no placeholders. Tap any tile to inspect, or open the matching recipe in the gallery.
            </p>
          </div>
          <Link href="/gallery" className="btn btn-secondary !text-sm">
            Browse all in gallery
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={active ? 'chip chip-active' : 'chip'}
                style={
                  active
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${f.accent}, var(--accent-magenta))`,
                      }
                    : undefined
                }
              >
                <span>{f.label}</span>
                <span
                  className="text-[10px] font-mono opacity-70"
                  style={{ marginLeft: 4 }}
                >
                  {counts[f.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Masonry grid (CSS columns for true masonry) */}
        <motion.div
          layout
          className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]"
        >
          {filtered.map((item, i) => (
            <motion.button
              key={item.src}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.025, 0.4), ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setLightbox(item)}
              className="mb-4 break-inside-avoid w-full text-left group block relative overflow-hidden rounded-xl surface-elevated"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="relative aspect-[16/9]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white truncate">{item.title}</span>
                  <span
                    className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white/90 border"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 backdrop-blur-md"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="absolute -top-12 right-0 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white"
                aria-label="Close preview"
              >
                <XMarkIcon className="h-5 w-5" />
                Close
                <span className="kbd ml-1" style={{ color: 'inherit', backgroundColor: 'rgba(255,255,255,0.1)' }}>Esc</span>
              </button>
              <div
                className="surface-elevated rounded-2xl overflow-hidden"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div
                  className="px-4 py-2.5 border-b flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--bg-sunken)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {lightbox.title}
                  </span>
                  <Link
                    href="/gallery"
                    className="text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                    style={{ color: 'var(--accent-magenta)' }}
                  >
                    Open in gallery
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
                <div className="relative aspect-[16/9]" style={{ backgroundColor: 'var(--bg-sunken)' }}>
                  <Image
                    src={lightbox.src}
                    alt={lightbox.title}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
