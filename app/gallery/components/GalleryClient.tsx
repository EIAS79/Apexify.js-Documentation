'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  BookOpenIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeAmbientBackground from '@/components/home/HomeAmbientBackground';
import {
  discoverCategories,
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
      composition: 0,
      image: 0,
      typography: 0,
      data: 0,
      motion: 0,
      surface: 0,
      advanced: 0,
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

          const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
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
    if (sort === 'shuffle') setShuffleSeed((value) => value + 1);
  }, [selectedCategory, runtime, evidence, query, sort]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (event.key === '/' && !editing) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('.apx-gallery-search input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      videos: galleryItems.filter((item) => item.thumbnailMedia === 'video' || item.thumbnail.endsWith('.mp4')).length,
      gifs: galleryItems.filter((item) => item.thumbnailMedia === 'gif' || item.thumbnail.endsWith('.gif')).length,
      verified: evidenceCounts.verified,
    }),
    [evidenceCounts],
  );

  const selectedIndex = selectedItem
    ? Math.max(0, visibleItems.findIndex((item) => item.id === selectedItem.id))
    : -1;

  return (
    <div className="apx-gallery-root min-h-screen overflow-x-hidden">
      <a href="#gallery-main" className="apx-gallery-skip">Skip to Gallery content</a>
      <HomeAmbientBackground />
      <HomeNavbar active="gallery" />

      <main id="gallery-main" tabIndex={-1}>
        <GalleryHero counts={heroCounts} version={galleryPackageVersion()} />

        <div className="apx-gallery-shell apx-gallery-control-stack">
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
          />
        </div>

        <section className="apx-gallery-results" aria-label="Gallery results">
          <div className="apx-gallery-shell">
            <div className="apx-gallery-results__heading">
              <div>
                <span>LIBRARY / {selectedCategory.toUpperCase()}</span>
                <h2>{query ? `Results for “${query}”` : 'Selected output studies'}</h2>
              </div>
              <p>
                {visibleItems.length} {visibleItems.length === 1 ? 'piece' : 'pieces'} · {sort === 'curated' ? 'verified and featured first' : sort}
              </p>
            </div>
            <GalleryGrid items={visibleItems} selectedFilter={selectedCategory} onOpen={openItem} />
          </div>
        </section>

        <GalleryClosing />
      </main>

      {selectedItem ? (
        <GalleryModal
          item={selectedItem}
          itemIndex={selectedIndex}
          total={visibleItems.length}
          onClose={closeItem}
          onPrev={() => moveBy(-1)}
          onNext={() => moveBy(1)}
        />
      ) : null}
    </div>
  );
}

function GalleryClosing() {
  return (
    <section className="apx-gallery-closing">
      <div className="apx-gallery-shell apx-gallery-closing__inner">
        <div>
          <span>FROM OUTPUT TO IMPLEMENTATION</span>
          <h2>See the piece. Inspect the source. Build your own.</h2>
        </div>
        <div className="apx-gallery-closing__actions">
          <Link href="/examples/node.canvas.basic">
            <BookOpenIcon className="h-4 w-4" />
            Verified examples
          </Link>
          <Link href="/studio">
            <CodeBracketIcon className="h-4 w-4" />
            Open Studio
          </Link>
          <Link href="/docs/getting-started">
            Read documentation
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
