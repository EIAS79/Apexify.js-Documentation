'use client';

import {
  CATEGORY_CONFIG,
  FILTER_ORDER,
  type FilterCategory,
} from './galleryConfig';

type FilterCounts = Record<Exclude<FilterCategory, 'all'>, number>;

export default function GalleryFilterBar({
  selected,
  onSelect,
  counts,
  totalCount,
}: {
  selected: FilterCategory;
  onSelect: (category: FilterCategory) => void;
  counts: FilterCounts;
  totalCount: number;
}) {
  return (
    <nav className="apx-gallery-browse" aria-label="Browse Gallery by visual category">
      <div className="apx-gallery-browse__heading">
        <span>BROWSE</span>
        <small>{totalCount} pieces</small>
      </div>

      <button
        type="button"
        aria-pressed={selected === 'all'}
        data-active={selected === 'all' || undefined}
        onClick={() => onSelect('all')}
      >
        <span className="apx-gallery-browse__icon">ALL</span>
        <span>All outputs</span>
        <small>{totalCount}</small>
      </button>

      {FILTER_ORDER.map((category) => {
        const cfg = CATEGORY_CONFIG[category];
        const Icon = cfg.icon;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected === category}
            data-active={selected === category || undefined}
            onClick={() => onSelect(category)}
            title={cfg.description}
          >
            <Icon className="h-4 w-4" />
            <span>{cfg.label}</span>
            <small>{counts[category]}</small>
          </button>
        );
      })}
    </nav>
  );
}
