'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import AmbientBackground from '@/components/home/AmbientBackground';
import {
  galleryItems,
  itemMatchesFilter,
  itemMatchesQuery,
  primaryBadgeCategory,
  parseGalleryHash,
  type GalleryItem,
} from './galleryHelpers';
import {
  CATEGORY_CONFIG,
  HASH_TYPE_TO_FILTER,
  type FilterCategory,
  type SortMode,
} from './galleryConfig';
import { discoverCategories } from './galleryHelpers';
import { buildGalleryHash } from '@/lib/gallery/core/galleryDocLink';
import GalleryHero from './GalleryHero';
import GalleryFilterBar from './GalleryFilterBar';
import GalleryGrid from './GalleryGrid';
import GalleryModal from './GalleryModal';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GalleryClient() {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('curated');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  /** Bumped each filter change so 'shuffle' resorts. */
  const [shuffleSeed, setShuffleSeed] = useState(0);

  /* Per-category counts (post-discovery, pre-search) */
  const filterCounts = useMemo(() => {
    const counts: Record<Exclude<FilterCategory, 'all'>, number> = {
      background: 0,
      images: 0,
      charts: 0,
      text: 0,
      gifs: 0,
      videos: 0,
      extras: 0,
      mix: 0,
      advance: 0,
    };
    for (const item of galleryItems) {
      for (const c of discoverCategories(item)) {
        counts[c] += 1;
      }
    }
    return counts;
  }, []);

  const totalCount = galleryItems.length;

  /* Filtered + searched + sorted */
  const visibleItems = useMemo(() => {
    const filtered = galleryItems
      .filter((item) => itemMatchesFilter(item, selectedCategory))
      .filter((item) => itemMatchesQuery(item, query));

    switch (sort) {
      case 'shuffle':
        // shuffleSeed used so React re-runs this memo when reshuffle is requested
        void shuffleSeed;
        return shuffle(filtered);
      case 'alpha':
        return [...filtered].sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
        );
      case 'curated':
      default:
        return [...filtered].sort((a, b) => {
          const featuredDelta = Number(!!b.featured) - Number(!!a.featured);
          if (featuredDelta !== 0) return featuredDelta;
          if (selectedCategory !== 'all') {
            const primaryBoost = (item: GalleryItem) =>
              Number(primaryBadgeCategory(item) === selectedCategory);
            const primaryDelta = primaryBoost(b) - primaryBoost(a);
            if (primaryDelta !== 0) return primaryDelta;
          }
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        });
    }
  }, [selectedCategory, query, sort, shuffleSeed]);

  /* Reshuffle when filter/search changes if in shuffle mode */
  useEffect(() => {
    if (sort === 'shuffle') setShuffleSeed((n) => n + 1);
  }, [selectedCategory, query, sort]);

  /* Hash routing — sync URL hash with selectedItem */
  useEffect(() => {
    const apply = () => {
      const parsed = parseGalleryHash(window.location.hash);
      if (!parsed) {
        setSelectedItem(null);
        return;
      }
      const item = galleryItems.find((c) => c.id === parsed.id);
      if (!item) return;
      if (parsed.type) {
        const t = HASH_TYPE_TO_FILTER[parsed.type];
        if (t) setSelectedCategory(t);
      }
      setSelectedItem(item);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const openItem = (item: GalleryItem) => {
    setSelectedItem(item);
    const nextHash = `#${encodeURIComponent(buildGalleryHash(item))}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  };

  const closeItem = () => {
    setSelectedItem(null);
    if (!window.location.hash) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  const moveBy = (delta: number) => {
    if (!selectedItem) return;
    if (visibleItems.length === 0) return;
    const idx = visibleItems.findIndex((i) => i.id === selectedItem.id);
    if (idx < 0) return;
    const nextIdx = (idx + delta + visibleItems.length) % visibleItems.length;
    openItem(visibleItems[nextIdx]);
  };

  const heroCounts = useMemo(
    () => ({
      total: totalCount,
      featured: galleryItems.filter((i) => i.featured).length,
      videos: filterCounts.videos,
      gifs: filterCounts.gifs,
    }),
    [totalCount, filterCounts]
  );

  const selectedIndex = selectedItem
    ? Math.max(0, visibleItems.findIndex((i) => i.id === selectedItem.id))
    : -1;

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>
      <AmbientBackground />
      <Navbar />

      <main>
        <GalleryHero counts={heroCounts} />

        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <GalleryFilterBar
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            counts={filterCounts}
            totalCount={totalCount}
            filteredCount={visibleItems.length}
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={setSort}
            onPickItem={openItem}
          />
        </div>

        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <GalleryGrid
              items={visibleItems}
              selectedFilter={selectedCategory}
              onOpen={openItem}
            />
          </div>
        </section>

        <CallToAction />
      </main>

      {selectedItem && (
        <GalleryModal
          item={selectedItem}
          itemIndex={selectedIndex}
          total={visibleItems.length}
          onClose={closeItem}
          onPrev={() => moveBy(-1)}
          onNext={() => moveBy(1)}
        />
      )}
    </div>
  );
}

function CallToAction() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-14"
          style={{
            background: 'var(--gradient-aurora)',
            backgroundSize: '200% 200%',
            animation: 'gradient-pan 8s ease infinite',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-white/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 text-white">
              <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black leading-[1.05] tracking-tight mb-4 text-balance">
                Found one you like?{' '}
                <span className="italic font-medium">Make it yours.</span>
              </h2>
              <p className="text-base sm:text-lg text-white/95 max-w-xl leading-relaxed">
                Open any tile, hit <strong>Open in Studio</strong>, and the same recipe lands in a live editor — tweak the inputs, regenerate, save the snippet, ship it.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/studio"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white font-bold text-base shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 group"
                style={{ color: '#1a0f3d' }}
              >
                <RocketLaunchIcon className="h-5 w-5" />
                Open the Studio
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/docs#00-start-here"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-bold text-base border-2 border-white/40 hover:bg-white/10 transition-colors"
              >
                Read the docs
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
