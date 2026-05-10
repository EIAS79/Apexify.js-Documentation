'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  Squares2X2Icon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  CATEGORY_CONFIG,
  FILTER_ORDER_PRIMARY,
  FILTER_ORDER_SECONDARY,
  type FilterCategory,
  type SortMode,
} from './galleryConfig';

type FilterCounts = Record<Exclude<FilterCategory, 'all'>, number>;

const SORT_OPTIONS: { id: SortMode; label: string; hint: string }[] = [
  { id: 'curated', label: 'Curated', hint: 'Featured first, then alphabetical' },
  { id: 'alpha', label: 'A → Z', hint: 'Strict alphabetical' },
  { id: 'shuffle', label: 'Shuffle', hint: 'Random order, refreshes on filter change' },
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
  const [sortOpen, setSortOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close sort menu on outside click / Escape
  useEffect(() => {
    if (!sortOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!sortMenuRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const hasActiveFilter = selected !== 'all' || query.trim().length > 0;
  const sortLabel = SORT_OPTIONS.find((s) => s.id === sort)?.label ?? 'Sort';

  return (
    <div
      className="sticky top-[88px] sm:top-[96px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-2xl border-b"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-base) 85%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top row — search + sort + status */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          {/* Search */}
          <div
            className="relative flex-1 min-w-0 group"
          >
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors"
              style={{ color: query ? 'var(--accent-magenta)' : 'var(--text-tertiary)' }}
            />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search items, ids, descriptions…"
              className="w-full h-10 pl-10 pr-20 rounded-xl border text-sm font-medium outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-raised)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-iris)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={() => onQueryChange('')}
                  aria-label="Clear search"
                  className="h-6 w-6 inline-flex items-center justify-center rounded-md transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="kbd hidden sm:inline-flex">⌘K</span>
            </div>
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0" ref={sortMenuRef}>
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              className="h-10 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-colors"
              style={{
                backgroundColor: 'var(--bg-raised)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              <span className="hidden sm:inline">Sort:</span>
              <span>{sortLabel}</span>
              <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div
                role="listbox"
                className="absolute right-0 top-12 w-60 rounded-xl border shadow-lg p-1 z-40"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {SORT_OPTIONS.map((opt) => {
                  const active = sort === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onSortChange(opt.id);
                        setSortOpen(false);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg text-left transition-colors flex flex-col gap-0.5"
                      style={{
                        backgroundColor: active
                          ? 'color-mix(in srgb, var(--accent-magenta) 14%, transparent)'
                          : 'transparent',
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-sunken)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chip rail — horizontal scroll on mobile */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* All */}
          <FilterChip
            active={selected === 'all'}
            onClick={() => onSelect('all')}
            Icon={Squares2X2Icon}
            label="All"
            count={totalCount}
            accent="var(--accent-magenta)"
          />
          <span
            className="h-6 w-px shrink-0 mx-1"
            style={{ backgroundColor: 'var(--border-default)' }}
            aria-hidden
          />
          {[...FILTER_ORDER_PRIMARY, ...FILTER_ORDER_SECONDARY].map((key) => {
            const cfg = CATEGORY_CONFIG[key];
            return (
              <FilterChip
                key={key}
                active={selected === key}
                onClick={() => onSelect(key)}
                Icon={cfg.icon}
                label={cfg.label}
                shortLabel={cfg.short}
                count={counts[key]}
                accent={cfg.accent}
              />
            );
          })}
        </div>

        {/* Status row */}
        <div
          className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <div className="flex items-center gap-2">
            {hasActiveFilter ? (
              <>
                <span>
                  Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredCount}</strong> of {totalCount}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelect('all');
                    onQueryChange('');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors"
                  style={{
                    color: 'var(--accent-magenta)',
                    backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 10%, transparent)',
                  }}
                >
                  <XMarkIcon className="h-3 w-3" />
                  Clear
                </button>
              </>
            ) : (
              <span>{totalCount} pieces total</span>
            )}
          </div>
          <span className="hidden sm:inline font-mono">
            <span className="kbd mr-1">⌘K</span> search
          </span>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  Icon,
  label,
  shortLabel,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Squares2X2Icon;
  label: string;
  shortLabel?: string;
  count: number;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active || undefined}
      className="group shrink-0 h-9 inline-flex items-center gap-1.5 px-3 rounded-full text-[13px] font-semibold transition-all snap-start"
      style={
        active
          ? {
              backgroundImage: `linear-gradient(135deg, ${accent}, var(--accent-magenta))`,
              color: 'white',
              boxShadow: `0 0 22px -6px ${accent}`,
              border: '1px solid transparent',
            }
          : {
              backgroundColor: 'var(--bg-raised)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = accent;
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      <Icon
        className="h-3.5 w-3.5 transition-transform group-hover:scale-110"
        style={{ color: active ? 'white' : accent }}
      />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel ?? label}</span>
      <span
        className="tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-full"
        style={
          active
            ? { backgroundColor: 'rgba(0,0,0,0.22)', color: 'white' }
            : { backgroundColor: 'var(--bg-sunken)', color: 'var(--text-tertiary)' }
        }
      >
        {count}
      </span>
    </button>
  );
}
