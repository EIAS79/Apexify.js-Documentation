'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowsUpDownIcon,
  CheckIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Squares2X2Icon } from '@heroicons/react/24/solid';
import {
  CATEGORY_CONFIG,
  FILTER_ORDER_PRIMARY,
  FILTER_ORDER_SECONDARY,
  type FilterCategory,
  type SortMode,
} from './galleryConfig';
import { GallerySpotlight } from './GallerySpotlight';
import type { GalleryItem } from './galleryHelpers';

type FilterCounts = Record<Exclude<FilterCategory, 'all'>, number>;

const CATEGORY_KEYS: Exclude<FilterCategory, 'all'>[] = [
  ...FILTER_ORDER_PRIMARY,
  ...FILTER_ORDER_SECONDARY,
];

const SORT_OPTIONS: { id: SortMode; label: string; symbol: string }[] = [
  { id: 'curated', label: 'Curated', symbol: '★' },
  { id: 'alpha', label: 'A → Z', symbol: 'Az' },
  { id: 'shuffle', label: 'Shuffle', symbol: '⇌' },
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
  onPickItem,
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
  onPickItem?: (item: GalleryItem) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  /* Close popovers on outside click / Esc */
  useEffect(() => {
    if (!filterOpen && !sortOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (filterOpen && !filterRef.current?.contains(t)) setFilterOpen(false);
      if (sortOpen && !sortRef.current?.contains(t)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFilterOpen(false); setSortOpen(false); }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [filterOpen, sortOpen]);

  /* ⌘K / "/" opens spotlight */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const isInput = t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen(true);
        return;
      }
      if (e.key === '/' && !isInput && !spotlightOpen) {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spotlightOpen]);

  const activeIsAll = selected === 'all';
  const activeCfg = activeIsAll ? null : CATEGORY_CONFIG[selected as Exclude<FilterCategory, 'all'>];
  const activeAccent = activeCfg?.accent ?? 'var(--accent-magenta)';
  const ActiveIcon = activeCfg?.icon ?? Squares2X2Icon;
  const activeLabel = activeCfg?.label ?? 'All pieces';

  const hasQuery = query.trim().length > 0;
  const sortMeta = SORT_OPTIONS.find((s) => s.id === sort)!;

  return (
    <>
      <div className="sticky top-[88px] sm:top-[96px] z-30 py-4 sm:py-5">
        {/* Floating command island — single pill, content-width, centered */}
        <div className="flex justify-center">
          <div
            className="relative inline-flex items-stretch p-1 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 88%, transparent)',
              border: '1px solid color-mix(in srgb, white 6%, transparent)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow:
                '0 18px 48px -16px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, var(--accent-iris) 10%, transparent), inset 0 1px 0 color-mix(in srgb, white 7%, transparent)',
            }}
          >
            {/* ── Filter chip + popover ── */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => { setFilterOpen((o) => !o); setSortOpen(false); }}
                aria-haspopup="menu"
                aria-expanded={filterOpen}
                className="h-10 inline-flex items-center gap-2 px-3 sm:px-3.5 rounded-full text-[12.5px] font-semibold transition-colors"
                style={{
                  backgroundColor: filterOpen
                    ? 'color-mix(in srgb, var(--accent-iris) 18%, transparent)'
                    : 'transparent',
                  color: 'var(--text-secondary)',
                }}
              >
                <FunnelIcon className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                <span
                  className="inline-flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md"
                  style={{
                    background: activeIsAll
                      ? 'color-mix(in srgb, var(--text-primary) 5%, transparent)'
                      : `linear-gradient(135deg, color-mix(in srgb, ${activeAccent} 28%, transparent), color-mix(in srgb, ${activeAccent} 12%, transparent))`,
                    color: activeIsAll ? 'var(--text-secondary)' : 'white',
                    border: `1px solid color-mix(in srgb, ${activeAccent} ${activeIsAll ? 0 : 35}%, transparent)`,
                  }}
                >
                  <ActiveIcon className="h-3 w-3 shrink-0" style={{ color: activeIsAll ? 'var(--text-tertiary)' : 'white' }} />
                  <span className="text-[12px] font-bold whitespace-nowrap">{activeLabel}</span>
                  <span
                    className="tabular-nums text-[10.5px] font-bold px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: activeIsAll ? 'color-mix(in srgb, var(--text-primary) 8%, transparent)' : 'rgba(0,0,0,0.25)',
                      color: activeIsAll ? 'var(--text-tertiary)' : 'white',
                    }}
                  >
                    {filteredCount}
                  </span>
                </span>
                {!activeIsAll && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); onSelect('all'); }}
                    aria-label="Clear filter"
                    className="h-4 w-4 -ml-0.5 inline-flex items-center justify-center rounded-full transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-magenta)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                  >
                    <XMarkIcon className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>

              {filterOpen && (
                <FilterMenu
                  selected={selected}
                  counts={counts}
                  totalCount={totalCount}
                  onSelect={(k) => { onSelect(k); setFilterOpen(false); }}
                />
              )}
            </div>

            {/* ── Divider ── */}
            <div
              className="self-center mx-0.5 h-5 w-px"
              style={{ backgroundColor: 'color-mix(in srgb, var(--border-default) 70%, transparent)' }}
              aria-hidden
            />

            {/* ── Search trigger ── */}
            <button
              type="button"
              onClick={() => setSpotlightOpen(true)}
              className="group h-10 inline-flex items-center gap-1.5 px-3 sm:px-3.5 rounded-full text-[12.5px] font-semibold transition-all active:scale-[0.97]"
              style={{
                color: hasQuery ? 'var(--accent-magenta)' : 'var(--text-secondary)',
                backgroundColor: hasQuery
                  ? 'color-mix(in srgb, var(--accent-magenta) 14%, transparent)'
                  : 'transparent',
              }}
              onMouseEnter={(e) => { if (!hasQuery) e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 5%, transparent)'; }}
              onMouseLeave={(e) => { if (!hasQuery) e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-label="Open search"
            >
              <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              {hasQuery ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="max-w-[10ch] sm:max-w-[20ch] truncate font-bold">{query}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); onQueryChange(''); }}
                    aria-label="Clear search"
                    className="h-4 w-4 inline-flex items-center justify-center rounded-full"
                    style={{ color: 'var(--accent-magenta)' }}
                  >
                    <XMarkIcon className="h-3 w-3" strokeWidth={3} />
                  </span>
                </span>
              ) : (
                <span className="hidden sm:inline">Search</span>
              )}
              <kbd
                className="hidden md:inline-flex items-center justify-center h-5 min-w-[34px] px-1 rounded text-[9.5px] font-bold leading-none ml-0.5"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--text-primary) 7%, transparent)',
                  color: 'var(--text-tertiary)',
                  border: '1px solid color-mix(in srgb, var(--border-default) 50%, transparent)',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* ── Divider ── */}
            <div
              className="self-center mx-0.5 h-5 w-px"
              style={{ backgroundColor: 'color-mix(in srgb, var(--border-default) 70%, transparent)' }}
              aria-hidden
            />

            {/* ── Sort ── */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => { setSortOpen((o) => !o); setFilterOpen(false); }}
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                className="h-10 inline-flex items-center gap-1.5 px-3 sm:px-3.5 rounded-full text-[12.5px] font-semibold transition-colors"
                style={{
                  backgroundColor: sortOpen
                    ? 'color-mix(in srgb, var(--accent-iris) 18%, transparent)'
                    : 'transparent',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { if (!sortOpen) e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 5%, transparent)'; }}
                onMouseLeave={(e) => { if (!sortOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <ArrowsUpDownIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{sortMeta.label}</span>
              </button>

              {sortOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-48 rounded-2xl p-1 z-40 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid color-mix(in srgb, var(--accent-iris) 18%, transparent)',
                    boxShadow:
                      '0 24px 64px -16px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, white 4%, transparent)',
                  }}
                >
                  {SORT_OPTIONS.map((opt) => {
                    const active = sort === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => { onSortChange(opt.id); setSortOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors"
                        style={{
                          backgroundColor: active ? 'color-mix(in srgb, var(--accent-iris) 12%, transparent)' : 'transparent',
                          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 5%, transparent)'; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <span
                          className="grid place-items-center h-7 w-7 rounded-lg text-[11px] font-black"
                          style={{
                            backgroundColor: active
                              ? 'color-mix(in srgb, var(--accent-iris) 22%, transparent)'
                              : 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
                            color: active ? 'var(--accent-iris)' : 'var(--text-tertiary)',
                          }}
                          aria-hidden
                        >
                          {opt.symbol}
                        </span>
                        <span className="text-[12.5px] font-semibold flex-1">{opt.label}</span>
                        {active && <CheckIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent-iris)' }} strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <GallerySpotlight
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        scope={selected}
        onScopeChange={onSelect}
        onCommitQuery={onQueryChange}
        onPick={(item) => onPickItem?.(item)}
      />
    </>
  );
}

/* ============================================================
   FilterMenu — visual grid popover that replaces the old tab rail.
   Categories shown as cards, each with the category icon, name,
   count, and accent-colored hover/selected state.
   ============================================================ */

function FilterMenu({
  selected,
  counts,
  totalCount,
  onSelect,
}: {
  selected: FilterCategory;
  counts: FilterCounts;
  totalCount: number;
  onSelect: (c: FilterCategory) => void;
}) {
  return (
    <div
      role="menu"
      className="absolute left-0 top-12 w-[min(86vw,420px)] rounded-2xl p-3 z-40 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid color-mix(in srgb, var(--accent-iris) 18%, transparent)',
        boxShadow:
          '0 32px 80px -20px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, white 4%, transparent)',
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-[0.18em] px-1.5 pb-2"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Browse by category
      </div>

      {/* "All" — full width hero card */}
      <FilterCard
        active={selected === 'all'}
        onClick={() => onSelect('all')}
        Icon={Squares2X2Icon}
        label="All pieces"
        count={totalCount}
        accent="var(--accent-magenta)"
        full
      />

      {/* Grid of categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1.5">
        {CATEGORY_KEYS.map((key) => {
          const cfg = CATEGORY_CONFIG[key];
          return (
            <FilterCard
              key={key}
              active={selected === key}
              onClick={() => onSelect(key)}
              Icon={cfg.icon}
              label={cfg.label}
              count={counts[key]}
              accent={cfg.accent}
            />
          );
        })}
      </div>
    </div>
  );
}

function FilterCard({
  active,
  onClick,
  Icon,
  label,
  count,
  accent,
  full,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Squares2X2Icon;
  label: string;
  count: number;
  accent: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onClick}
      className={`relative ${full ? 'w-full flex items-center gap-3 px-2.5 py-2' : 'flex flex-col items-start gap-1.5 px-2.5 py-2.5'} rounded-xl text-left transition-all cursor-pointer overflow-hidden group`}
      style={{
        backgroundColor: active
          ? `color-mix(in srgb, ${accent} 18%, transparent)`
          : 'color-mix(in srgb, var(--text-primary) 4%, transparent)',
        border: `1px solid ${active ? `color-mix(in srgb, ${accent} 55%, transparent)` : 'transparent'}`,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${accent} 10%, transparent)`;
          e.currentTarget.style.borderColor = `color-mix(in srgb, ${accent} 25%, transparent)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
    >
      {full ? (
        <>
          <div
            className="grid place-items-center h-9 w-9 rounded-lg shrink-0"
            style={{
              background: active
                ? `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, var(--accent-iris)))`
                : `color-mix(in srgb, ${accent} 14%, transparent)`,
              boxShadow: active ? `0 6px 20px -6px color-mix(in srgb, ${accent} 70%, transparent)` : 'none',
            }}
          >
            <Icon className="h-4 w-4" style={{ color: active ? 'white' : accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold leading-tight">{label}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {count} pieces · everything in the gallery
            </div>
          </div>
          {active && (
            <CheckIcon className="h-4 w-4 shrink-0" style={{ color: accent }} strokeWidth={3} />
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between w-full">
            <div
              className="grid place-items-center h-7 w-7 rounded-lg"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, var(--accent-iris)))`
                  : 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
                boxShadow: active ? `0 4px 14px -4px color-mix(in srgb, ${accent} 70%, transparent)` : 'none',
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: active ? 'white' : accent }} />
            </div>
            <span
              className="tabular-nums text-[10.5px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: active
                  ? `color-mix(in srgb, ${accent} 28%, transparent)`
                  : 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
                color: active ? accent : 'var(--text-tertiary)',
              }}
            >
              {count}
            </span>
          </div>
          <div className="text-[12px] font-semibold w-full truncate">{label}</div>
        </>
      )}
    </button>
  );
}
