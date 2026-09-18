'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SortMode } from './galleryConfig';

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'curated', label: 'Curated' },
  { id: 'alpha', label: 'A–Z' },
  { id: 'shuffle', label: 'Shuffle' },
];

export default function GalleryToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  filteredCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="apx-gallery-toolbar" aria-label="Gallery search and sorting">
      <label className="apx-gallery-search">
        <MagnifyingGlassIcon className="h-4 w-4" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search outputs, features, or source…"
          aria-label="Search Gallery"
        />
        {query ? (
          <button type="button" onClick={() => onQueryChange('')} aria-label="Clear search">
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : (
          <kbd>/</kbd>
        )}
      </label>

      <div className="apx-gallery-sort" role="group" aria-label="Sort Gallery">
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

      <div className="apx-gallery-toolbar__count" aria-live="polite">
        <strong>{filteredCount}</strong>
        <span>{filteredCount === totalCount ? 'pieces' : `of ${totalCount}`}</span>
      </div>
    </div>
  );
}
