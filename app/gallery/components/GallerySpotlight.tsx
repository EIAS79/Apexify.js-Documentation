'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRightIcon,
  HashtagIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  galleryItems,
  itemMatchesQuery,
  plainGallerySummary,
  type GalleryItem,
} from './galleryHelpers';
import { CATEGORY_CONFIG, type FilterCategory } from './galleryConfig';

/**
 * Spotlight-style gallery search.
 *
 * Opened via ⌘K / "/" or the search button in the filter island.
 * Centered floating dialog with:
 *   - Big search input
 *   - Live, ranked result list with thumbnail-style icons + meta
 *   - Quick-filter pills below the input that scope the search
 *   - Keyboard nav (↑ ↓ Enter Esc)
 *
 * Selecting a result calls `onPick(item)` to open it (gallery modal),
 * and also commits the typed query into the parent so the grid below
 * reflects the active filter.
 */

const QUICK_PILLS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'background', label: 'Backgrounds' },
  { id: 'charts', label: 'Charts' },
  { id: 'videos', label: 'Videos' },
  { id: 'gifs', label: 'GIFs' },
  { id: 'advance', label: 'Advanced' },
];

const RECENT_KEY = 'apx.gallery.recent';

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  if (typeof window === 'undefined' || !q.trim()) return;
  try {
    const cur = loadRecent().filter((x) => x !== q);
    const next = [q, ...cur].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function GallerySpotlight({
  open,
  onClose,
  onPick,
  onCommitQuery,
  scope,
  onScopeChange,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (item: GalleryItem) => void;
  onCommitQuery: (q: string) => void;
  scope: FilterCategory;
  onScopeChange: (s: FilterCategory) => void;
}) {
  const [draft, setDraft] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  /* Reset draft when opened, refresh recent searches */
  useEffect(() => {
    if (!open) return;
    setDraft('');
    setActiveIdx(0);
    setRecent(loadRecent());
    // Focus on next frame so the dialog mounts first
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* Compute filtered + ranked results */
  const results = useMemo(() => {
    const q = draft.trim().toLowerCase();
    let pool = galleryItems;
    if (scope !== 'all') {
      pool = pool.filter((item) => itemMatchesScope(item, scope));
    }
    if (!q) return pool.slice(0, 20);
    const scored: { item: GalleryItem; score: number }[] = [];
    for (const item of pool) {
      if (!itemMatchesQuery(item, q)) continue;
      let score = 0;
      const title = item.title.toLowerCase();
      const id = item.id.toLowerCase();
      if (title.startsWith(q)) score += 100;
      else if (title.includes(q)) score += 60;
      if (id.includes(q)) score += 30;
      if (item.featured) score += 10;
      scored.push({ item, score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 20).map((s) => s.item);
  }, [draft, scope]);

  /* Reset selection when results change */
  useEffect(() => { setActiveIdx(0); }, [results.length, scope, draft]);

  /* Keyboard navigation */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(results.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[activeIdx];
        if (item) {
          pushRecent(draft);
          onCommitQuery(draft);
          onPick(item);
          onClose();
        }
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const order: FilterCategory[] = QUICK_PILLS.map((p) => p.id);
        const cur = order.indexOf(scope);
        const next = order[(cur + (e.shiftKey ? -1 + order.length : 1)) % order.length];
        onScopeChange(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, activeIdx, draft, scope, onPick, onClose, onCommitQuery, onScopeChange]);

  /* Scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    if (el) (el as HTMLElement).scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search gallery"
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh] animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-base) 70%, transparent)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      />

      {/* Floating panel */}
      <div
        className="relative w-full max-w-[640px] rounded-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-elevated) 96%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-iris) 22%, transparent)',
          boxShadow:
            '0 32px 96px -16px color-mix(in srgb, var(--accent-magenta) 22%, transparent), 0 0 0 1px color-mix(in srgb, white 4%, transparent), 0 24px 64px -12px rgba(0,0,0,0.55)',
        }}
      >
        {/* Top gradient strip — pure decoration */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-[2px] opacity-70"
          style={{ background: 'var(--gradient-aurora)' }}
        />

        {/* Header — input row */}
        <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-3">
          <div
            className="grid place-items-center h-9 w-9 rounded-xl shrink-0"
            style={{
              background: 'var(--gradient-sunset)',
              boxShadow: '0 4px 18px -4px color-mix(in srgb, var(--accent-magenta) 70%, transparent)',
            }}
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Find a gallery piece by name, id, or vibe…"
            spellCheck={false}
            autoComplete="off"
            className="flex-1 min-w-0 h-10 bg-transparent border-0 outline-none text-[15px] sm:text-[16px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center h-8 w-8 rounded-lg transition-colors shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
              color: 'var(--text-tertiary)',
            }}
          >
            <XMarkIcon className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scope pills */}
        <div className="px-4 sm:px-5 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
          {QUICK_PILLS.map((p) => {
            const active = scope === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onScopeChange(p.id)}
                className="shrink-0 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-all"
                style={
                  active
                    ? {
                        background: 'color-mix(in srgb, var(--accent-iris) 18%, transparent)',
                        color: 'var(--accent-iris)',
                        border: '1px solid color-mix(in srgb, var(--accent-iris) 35%, transparent)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--text-tertiary)',
                        border: '1px solid color-mix(in srgb, var(--border-default) 50%, transparent)',
                      }
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Recent searches (only when input empty + scope is "all") */}
        {!draft && recent.length > 0 && (
          <div className="px-4 sm:px-5 pb-2">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Recent
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDraft(r)}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--text-primary) 5%, transparent)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <HashtagIcon className="h-2.5 w-2.5" />
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div
          className="h-px mx-4 sm:mx-5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--border-default) 50%, transparent)' }}
        />

        {/* Results */}
        <ul
          ref={listRef}
          className="max-h-[42vh] overflow-y-auto px-2 py-2"
          role="listbox"
        >
          {results.length === 0 ? (
            <li
              className="px-3 py-10 text-center text-[13px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <div
                className="mx-auto mb-3 grid place-items-center h-12 w-12 rounded-2xl"
                style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 5%, transparent)' }}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                No matches for &ldquo;{draft}&rdquo;
              </div>
              <div className="text-[11.5px]">Try a different keyword or change the scope.</div>
            </li>
          ) : (
            results.map((item, idx) => {
              const active = idx === activeIdx;
              const cat = primaryCategoryFor(item);
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              return (
                <li
                  key={item.id}
                  data-idx={idx}
                  role="option"
                  aria-selected={active}
                >
                  <button
                    type="button"
                    onClick={() => {
                      pushRecent(draft);
                      onCommitQuery(draft);
                      onPick(item);
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                    style={{
                      backgroundColor: active
                        ? 'color-mix(in srgb, var(--accent-iris) 12%, transparent)'
                        : 'transparent',
                    }}
                  >
                    {/* Category icon tile */}
                    <div
                      className="grid place-items-center h-9 w-9 rounded-lg shrink-0"
                      style={{
                        backgroundColor: active
                          ? `color-mix(in srgb, ${cfg.accent} 22%, transparent)`
                          : `color-mix(in srgb, ${cfg.accent} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${cfg.accent} 30%, transparent)`,
                      }}
                    >
                      <Icon className="h-4 w-4" style={{ color: cfg.accent }} />
                    </div>

                    {/* Title + summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[13.5px] font-semibold truncate"
                          style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                        >
                          {highlight(item.title, draft)}
                        </span>
                        {item.featured && (
                          <span
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0"
                            style={{
                              background: 'var(--gradient-sunset)',
                              color: 'white',
                            }}
                          >
                            ★
                          </span>
                        )}
                      </div>
                      <div
                        className="text-[11.5px] truncate mt-0.5"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <span style={{ color: cfg.accent, fontWeight: 600 }}>{cfg.label}</span>
                        <span className="mx-1.5 opacity-50">·</span>
                        <span>{plainGallerySummary(item.description).slice(0, 80)}</span>
                      </div>
                    </div>

                    <ArrowRightIcon
                      className="h-3.5 w-3.5 shrink-0 transition-opacity"
                      style={{
                        color: 'var(--accent-iris)',
                        opacity: active ? 1 : 0,
                      }}
                    />
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {/* Footer — keyboard hints + result count */}
        <div
          className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 text-[10.5px] font-medium"
          style={{
            borderTop: '1px solid color-mix(in srgb, var(--border-default) 50%, transparent)',
            color: 'var(--text-tertiary)',
            backgroundColor: 'color-mix(in srgb, var(--bg-sunken) 30%, transparent)',
          }}
        >
          <div className="flex items-center gap-3">
            <Hint keys={['↑', '↓']}>navigate</Hint>
            <Hint keys={['↵']}>open</Hint>
            <Hint keys={['Tab']}>scope</Hint>
            <Hint keys={['Esc']}>close</Hint>
          </div>
          <div className="tabular-nums">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hint({ keys, children }: { keys: string[]; children: React.ReactNode }) {
  return (
    <span className="hidden sm:inline-flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[9.5px] font-bold leading-none"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
            color: 'var(--text-secondary)',
            border: '1px solid color-mix(in srgb, var(--border-default) 60%, transparent)',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          {k}
        </kbd>
      ))}
      <span>{children}</span>
    </span>
  );
}

/* ---- helpers ---- */

function itemMatchesScope(item: GalleryItem, scope: FilterCategory): boolean {
  if (scope === 'all') return true;
  if (item.category === 'background' && scope === 'background') return true;
  if (item.category === 'gifs' && (scope === 'gifs' || scope === 'extras' || scope === 'mix')) return true;
  if (item.category === 'videos' && (scope === 'videos' || scope === 'extras' || scope === 'mix')) return true;
  if (item.category === 'advance' && scope === 'advance') return true;
  if (item.category === 'advance' && scope === 'images') return true;
  if (item.category === 'advance' && scope === 'charts') {
    return item.id.startsWith('advance-chartshowcase-') ||
      ['advance-chart-donut-glow', 'advance-comparison-donut-line', 'presentation-deck-slide',
       'advance-chart-bar-quarterly', 'advance-chart-hbar-routes', 'advance-chart-line-dual-target']
        .includes(item.id);
  }
  return false;
}

function primaryCategoryFor(item: GalleryItem): Exclude<FilterCategory, 'all'> {
  if (item.category === 'background') return 'background';
  if (item.category === 'gifs') return 'gifs';
  if (item.category === 'videos') return 'videos';
  return 'advance';
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const lower = text.toLowerCase();
  const ql = q.trim().toLowerCase();
  const idx = lower.indexOf(ql);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span
        style={{
          background: 'color-mix(in srgb, var(--accent-magenta) 28%, transparent)',
          color: 'var(--text-primary)',
          padding: '0 2px',
          borderRadius: 3,
        }}
      >
        {text.slice(idx, idx + ql.length)}
      </span>
      {text.slice(idx + ql.length)}
    </>
  );
}

