'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type SearchResult = {
  filename: string;
  name: string;
  folder: string;
  matchType: 'filename' | 'folder' | 'content';
  snippet?: string;
};

const MATCH_LABEL: Record<SearchResult['matchType'], string> = {
  filename: 'Title',
  folder: 'Section',
  content: 'Content',
};

const MATCH_COLOR: Record<SearchResult['matchType'], string> = {
  filename: 'var(--accent-magenta)',
  folder: 'var(--accent-iris)',
  content: 'var(--accent-amber)',
};

function prettyFolder(folder: string): string {
  if (folder === 'root') return 'Overview';
  return folder
    .split(/[\\/]/)
    .map((seg) =>
      seg
        .replace(/^\d+-/, '')
        .split('-')
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ')
    )
    .join(' › ');
}

/**
 * Documentation search anchored in the left rail (desktop + mobile drawer).
 */
export function DocsSidebarSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>(0);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      setActive(0);
      return;
    }
    setSearching(true);
    debounceRef.current = window.setTimeout(() => {
      void fetch(`/api/docs/search?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d: { results?: SearchResult[] }) => {
          setResults(Array.isArray(d.results) ? d.results : []);
          setActive(0);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 220);
    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();
    for (const r of results) {
      const key = prettyFolder(r.folder);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    return Array.from(groups.entries());
  }, [results]);

  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  const goTo = (filename: string) => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/docs') {
      window.location.hash = filename;
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      window.dispatchEvent(new CustomEvent('docHashChange'));
    } else {
      router.push(`/docs#${filename}`);
    }
    setQuery('');
    setResults([]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && inputRef.current && t !== inputRef.current && !inputRef.current.contains(t)) {
        return;
      }
      if (document.activeElement !== inputRef.current) return;
      if (query.trim().length < 2 || flat.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(flat.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = flat[active];
        if (target) goTo(target.filename);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [query, flat, active]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  return (
    <div
      className="not-prose mb-3 min-w-0 overflow-hidden rounded-xl"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-sunken) 55%, transparent)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="flex items-center gap-2 px-2.5 py-2"
        style={{ borderBottom: results.length > 0 || query.trim().length >= 2 ? '1px solid var(--border-subtle)' : undefined }}
      >
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} aria-hidden />
        <input
          id="docs-sidebar-search-input"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs…"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: 'var(--text-primary)' }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search documentation"
        />
        {searching && (
          <span
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full"
            style={{
              border: '2px solid color-mix(in srgb, var(--accent-iris) 30%, transparent)',
              borderTopColor: 'var(--accent-iris)',
            }}
          />
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="min-w-0 border-t overflow-x-hidden" style={{ borderTopColor: 'var(--border-subtle)' }}>
          <div
            ref={listRef}
            className="apex-scroll max-h-[min(38vh,16rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain py-1.5 pr-1 pl-1"
            style={{ scrollbarGutter: 'stable' }}
            role="listbox"
            aria-label="Search results"
          >
          {!searching && results.length === 0 && (
            <div className="px-3 py-4 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              No matches for “{query}”.
            </div>
          )}

          {grouped.map(([groupName, items]) => {
            const startIdx = flat.findIndex((r) => r === items[0]);
            return (
              <div key={groupName} className="min-w-0" role="presentation">
                <p
                  className="sticky top-0 z-10 mb-1 border-b px-2.5 py-1 pt-2 text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    color: 'var(--accent-magenta)',
                    backgroundColor: 'color-mix(in srgb, var(--bg-raised) 94%, transparent)',
                    borderBottomColor: 'color-mix(in srgb, var(--border-default) 80%, transparent)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  {groupName}
                </p>
                <div className="mx-1 min-w-0 space-y-0.5">
                  {items.map((r, i) => {
                    const idx = startIdx + i;
                    const isActive = idx === active;
                    return (
                      <button
                        key={`${r.filename}-${idx}`}
                        type="button"
                        data-idx={idx}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => goTo(r.filename)}
                        className="flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors"
                        style={{
                          backgroundColor: isActive
                            ? 'color-mix(in srgb, var(--accent-iris) 16%, transparent)'
                            : 'transparent',
                        }}
                      >
                        <span
                          className="mt-0.5 inline-flex h-4 shrink-0 items-center rounded px-1 text-[8px] font-bold uppercase tracking-wider"
                          style={{
                            background: `color-mix(in srgb, ${MATCH_COLOR[r.matchType]} 18%, transparent)`,
                            color: MATCH_COLOR[r.matchType],
                            border: `1px solid color-mix(in srgb, ${MATCH_COLOR[r.matchType]} 42%, transparent)`,
                          }}
                          aria-hidden
                        >
                          {MATCH_LABEL[r.matchType]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block break-words text-[12px] font-semibold leading-snug line-clamp-2"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {r.name}
                          </span>
                          {r.snippet && (
                            <span
                              className="mt-0.5 line-clamp-2 break-words text-[10px] leading-snug"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              …{r.snippet}…
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      <p className="px-2.5 py-2 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        <kbd className="kbd text-[9px]">⌘</kbd>{' '}
        <kbd className="kbd text-[9px]">K</kbd> focuses this search · min. 2 characters
      </p>
    </div>
  );
}
