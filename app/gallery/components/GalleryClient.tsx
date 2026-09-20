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
  CATEGORY_CONFIG,
  HASH_TYPE_TO_FILTER,
  type FilterCategory,
  type SortMode,
} from './galleryConfig';
import { buildGalleryHash } from '@/lib/gallery/core/galleryDocLink';
import GalleryHero from './GalleryHero';
import GalleryFilterBar from './GalleryFilterBar';
import GalleryScopeBar from './GalleryScopeBar';
import GalleryToolbar from './GalleryToolbar';
import GalleryGrid from './GalleryGrid';
import GalleryModal from './GalleryModal';

const PAGE_SIZE = 24;
const FEATURED_LIMIT = 4;

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
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

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
          const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
          if (featuredDelta !== 0) return featuredDelta;

          const verifiedDelta = Number(isVerifiedGalleryItem(b)) - Number(isVerifiedGalleryItem(a));
          if (verifiedDelta !== 0) return verifiedDelta;

          if (selectedCategory !== 'all') {
            const primaryBoost = (item: GalleryItem) => Number(primaryBadgeCategory(item) === selectedCategory);
            const primaryDelta = primaryBoost(b) - primaryBoost(a);
            if (primaryDelta !== 0) return primaryDelta;
          }

          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        });
    }
  }, [selectedCategory, runtime, evidence, query, sort, shuffleSeed]);

  const showFeatured =
    selectedCategory === 'all' &&
    runtime === 'all' &&
    evidence === 'all' &&
    query.trim() === '' &&
    sort === 'curated';

  const featuredItems = useMemo(
    () => (showFeatured ? visibleItems.filter((item) => item.featured).slice(0, FEATURED_LIMIT) : []),
    [showFeatured, visibleItems],
  );

  const featuredIds = useMemo(() => new Set(featuredItems.map((item) => item.id)), [featuredItems]);

  const catalogItems = useMemo(
    () => (showFeatured ? visibleItems.filter((item) => !featuredIds.has(item.id)) : visibleItems),
    [showFeatured, visibleItems, featuredIds],
  );

  const displayedCatalogItems = catalogItems.slice(0, visibleLimit);
  const hasMore = displayedCatalogItems.length < catalogItems.length;
  const activeLabel =
    selectedCategory === 'all' ? 'All outputs' : CATEGORY_CONFIG[selectedCategory].label;

  useEffect(() => {
    if (sort === 'shuffle') setShuffleSeed((value) => value + 1);
  }, [selectedCategory, runtime, evidence, query, sort]);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
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
      videos: galleryItems.filter(
        (item) =>
          discoverCategories(item).includes('motion') &&
          (item.thumbnailMedia === 'video' || item.thumbnail.endsWith('.mp4')),
      ).length,
      gifs: galleryItems.filter(
        (item) =>
          discoverCategories(item).includes('motion') &&
          item.thumbnailMedia !== 'video' &&
          !item.thumbnail.endsWith('.mp4'),
      ).length,
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

        <section className="apx-gallery-library" aria-label="Gallery library">
          <div className="apx-gallery-shell apx-gallery-library__layout">
            <aside className="apx-gallery-sidebar">
              <div className="apx-gallery-sidebar__sticky">
                <GalleryFilterBar
                  selected={selectedCategory}
                  onSelect={setSelectedCategory}
                  counts={filterCounts}
                  totalCount={galleryItems.length}
                />

                <GalleryScopeBar
                  runtime={runtime}
                  evidence={evidence}
                  verifiedCount={evidenceCounts.verified}
                  legacyCount={evidenceCounts.legacy}
                  onRuntimeChange={setRuntime}
                  onEvidenceChange={setEvidence}
                />
              </div>
            </aside>

            <div className="apx-gallery-catalog">
              <GalleryToolbar
                query={query}
                onQueryChange={setQuery}
                sort={sort}
                onSortChange={setSort}
                filteredCount={visibleItems.length}
                totalCount={galleryItems.length}
              />

              {featuredItems.length > 0 ? (
                <section className="apx-gallery-featured" aria-labelledby="gallery-featured-title">
                  <div className="apx-gallery-section-heading">
                    <div>
                      <span>FEATURED</span>
                      <h2 id="gallery-featured-title">Selected work</h2>
                    </div>
                    <p>{featuredItems.length} curated highlights</p>
                  </div>
                  <GalleryGrid items={featuredItems} onOpen={openItem} variant="featured" />
                </section>
              ) : null}

              <section className="apx-gallery-catalog-list" aria-labelledby="gallery-catalog-title">
                <div className="apx-gallery-section-heading">
                  <div>
                    <span>LIBRARY / {selectedCategory.toUpperCase()}</span>
                    <h2 id="gallery-catalog-title">
                      {query ? `Results for “${query}”` : activeLabel}
                    </h2>
                  </div>
                  <p>
                    Showing {displayedCatalogItems.length} of {catalogItems.length}
                  </p>
                </div>

                <GalleryGrid items={displayedCatalogItems} onOpen={openItem} />

                {hasMore ? (
                  <div className="apx-gallery-load-more">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((value) => value + PAGE_SIZE)}
                    >
                      <span>Load 24 more</span>
                      <small>{catalogItems.length - displayedCatalogItems.length} remaining</small>
                    </button>
                  </div>
                ) : catalogItems.length > 0 ? (
                  <div className="apx-gallery-catalog-end">
                    <span>END OF CURRENT SET</span>
                    <small>{catalogItems.length} pieces in this view</small>
                  </div>
                ) : null}
              </section>
            </div>
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
