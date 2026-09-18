'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  CATEGORY_CONFIG,
  FILTER_ORDER,
  type FilterCategory,
  type SortMode,
} from './galleryConfig';

type FilterCounts = Record<Exclude<FilterCategory, 'all'>, number>;

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'curated', label: 'Curated' },
  { id: 'alpha', label: 'A–Z' },
  { id: 'shuffle', label: 'Shuffle' },
];

export default function GalleryFilterBar({
  selected,
  onSelect,
  counts,
  totalCount,
  filteredCount,
  query,
  onQueryChange,
  sort,
  onSortChange,
}: {
  selected: FilterCategory;
  onSelect: (c: FilterCategory) => void;
  counts: FilterCounts;
  totalCount: number;
  filteredCount: number;
  query: string;
  onQueryChange: (q: string) => void;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
}) {
  return (
    <section className="apx-gallery-tools" aria-label="Gallery filters">
      <div className="apx-gallery-tools__top">
        <label className="apx-gallery-search">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search title, category, feature, or source…"
            aria-label="Search gallery"
          />
          {query ? (
            <button type="button" onClick={() => onQueryChange('')} aria-label="Clear search">
              <XMarkIcon className="h-4 w-4" />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </label>

        <div className="apx-gallery-sort" role="group" aria-label="Sort gallery">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={sort === option.id}
              data-active={sort === option.id || undefined}
              onClick={() => onSortChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="apx-gallery-result-count">
          <strong>{filteredCount}</strong>
          <span>of {totalCount}</span>
        </div>
      </div>

      <div className="apx-gallery-lenses" role="group" aria-label="Visual category">
        <button
          type="button"
          data-active={selected === 'all' || undefined}
          aria-pressed={selected === 'all'}
          onClick={() => onSelect('all')}
        >
          <span>All</span>
          <small>{totalCount}</small>
        </button>

        {FILTER_ORDER.map((category) => {
          const cfg = CATEGORY_CONFIG[category];
          const Icon = cfg.icon;
          return (
            <button
              key={category}
              type="button"
              data-active={selected === category || undefined}
              aria-pressed={selected === category}
              onClick={() => onSelect(category)}
              title={cfg.description}
            >
              <Icon className="h-4 w-4" />
              <span>{cfg.label}</span>
              <small>{counts[category]}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
