'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, BookOpenIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import AmbientBackground from '@/components/home/AmbientBackground';
import {
  galleryEvidence,
  galleryItems,
  galleryPackageVersion,
  isVerifiedGalleryItem,
  itemMatchesEvidence,
  itemMatchesFilter,
  itemMatchesQuery,
  itemMatchesRuntime,
  primaryBadgeCategory,
  parseGalleryHash,
  type GalleryEvidenceFilter,
  type GalleryItem,
  type GalleryRuntimeFilter,
} from './galleryHelpers';
import {
  HASH_TYPE_TO_FILTER,
  type FilterCategory,
  type SortMode,
} from './galleryConfig';
import { discoverCategories } from './galleryHelpers';
import { buildGalleryHash } from '@/lib/gallery/core/galleryDocLink';
import GalleryHero from './GalleryHero';
import GalleryFilterBar from './GalleryFilterBar';
import GalleryScopeBar from './GalleryScopeBar';
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
  const [runtime, setRuntime] = useState<GalleryRuntimeFilter>('all');
  const [evidence, setEvidence] = useState<GalleryEvidenceFilter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('curated');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);

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
      for (const category of discoverCategories(item)) counts[category] += 1;
    }
    return counts;
  }, []);

  const evidenceCounts = useMemo(
    () => ({
      verified: galleryItems.filter((item) => galleryEvidence(item) === 'verified').length,
      legacy: galleryItems.filter((item) => galleryEvidence(item) === 'legacy').length,
    }),
    [],
  );

  const visibleItems = useMemo(() => {
    const filtered = galleryItems
      .filter((item) => itemMatchesFilter(item, selectedCategory))
      .filter((item) => itemMatchesRuntime(item, runtime))
      .filter((item) => itemMatchesEvidence(item, evidence))
      .filter((item) => itemMatchesQuery(item, query));

    switch (sort) {
      case 'shuffle':
        void shuffleSeed;
        return shuffle(filtered);
      case 'alpha':
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
      case 'curated':
      default:
        return [...filtered].sort((a, b) => {
          const verifiedDelta = Number(isVerifiedGalleryItem(b)) - Number(isVerifiedGalleryItem(a));
          if (verifiedDelta !== 0) return verifiedDelta;
          const featuredDelta = Number(!!b.featured) - Number(!!a.featured);
          if (featuredDelta !== 0) return featuredDelta;
          if (selectedCategory !== 'all') {
            const primaryBoost = (item: GalleryItem) => Number(primaryBadgeCategory(item) === selectedCategory);
            const primaryDelta = primaryBoost(b) - primaryBoost(a);
            if (primaryDelta !== 0) return primaryDelta;
          }
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        });
    }
  }, [selectedCategory, runtime, evidence, query, sort, shuffleSeed]);

  useEffect(() => {
    if (sort === 'shuffle') setShuffleSeed((n) => n + 1);
  }, [selectedCategory, runtime, evidence, query, sort]);

  useEffect(() => {
    const apply = () => {
      const parsed = parseGalleryHash(window.location.hash);
      if (!parsed) {
        setSelectedItem(null);
        return;
      }
      const item = galleryItems.find((candidate) => candidate.id === parsed.id);
      if (!item) return;
      if (parsed.type) {
        const nextCategory = HASH_TYPE_TO_FILTER[parsed.type];
        if (nextCategory) setSelectedCategory(nextCategory);
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
    if (!selectedItem || visibleItems.length === 0) return;
    const index = visibleItems.findIndex((item) => item.id === selectedItem.id);
    if (index < 0) return;
    openItem(visibleItems[(index + delta + visibleItems.length) % visibleItems.length]);
  };

  const heroCounts = useMemo(
    () => ({
      total: galleryItems.length,
      featured: galleryItems.filter((item) => item.featured).length,
      videos: filterCounts.videos,
      gifs: filterCounts.gifs,
      verified: evidenceCounts.verified,
    }),
    [filterCounts, evidenceCounts],
  );

  const selectedIndex = selectedItem ? Math.max(0, visibleItems.findIndex((item) => item.id === selectedItem.id)) : -1;

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>
      <AmbientBackground />
      <Navbar />

      <main>
        <GalleryHero counts={heroCounts} version={galleryPackageVersion()} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GalleryScopeBar
            runtime={runtime}
            evidence={evidence}
            verifiedCount={evidenceCounts.verified}
            legacyCount={evidenceCounts.legacy}
            onRuntimeChange={setRuntime}
            onEvidenceChange={setEvidence}
          />
          <GalleryFilterBar
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            counts={filterCounts}
            totalCount={galleryItems.length}
            filteredCount={visibleItems.length}
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={setSort}
            onPickItem={openItem}
          />
        </div>

        <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-label="Gallery results">
          <div className="mx-auto max-w-7xl">
            <GalleryGrid items={visibleItems} selectedFilter={selectedCategory} onOpen={openItem} />
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
  const reduce = useReducedMotion();
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-14"
          style={{ background: 'var(--gradient-aurora)', boxShadow: 'var(--shadow-xl)' }}
        >
          <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-3">
            <div className="text-white lg:col-span-2">
              <h2 className="mb-4 text-balance text-3xl font-black leading-[1.05] sm:text-4xl lg:text-[2.75rem]">
                Use verified examples when you need proof.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-white/95 sm:text-lg">
                DOC-5 examples expose canonical repository-controlled source and verified outputs. Studio remains an interactive authoring surface; it is not used as evidence that every legacy Gallery card has been execution-verified.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/examples/node.canvas.basic" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold shadow-[var(--shadow-md)]" style={{ color: '#1a0f3d' }}>
                <BookOpenIcon className="h-5 w-5" />
                Open verified examples
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/studio" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3.5 text-base font-bold text-white hover:bg-white/10">
                <RocketLaunchIcon className="h-5 w-5" />
                Open Studio
              </Link>
              <Link href="/docs/getting-started" className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2 text-sm font-bold text-white/90 hover:text-white">
                Read the docs <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
