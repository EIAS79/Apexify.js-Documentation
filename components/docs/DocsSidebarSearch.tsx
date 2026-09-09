'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type SearchResult = {
  filename: string;
  name: string;
  folder: string;
  href: string;
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
    .map((segment) =>
      segment
        .replace(/^\d+-/, '')
        .split('-')
        .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
        .join(' '),
    )
    .join(' › ');
}

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
        .then((response) => response.json())
        .then((data: { results?: SearchResult[] }) => {
          setResults(Array.isArray(data.results) ? data.results : []);
          setActive(0);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 220);

    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();
    for (const result of results) {
      const key = prettyFolder(result.folder);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(result);
    }
    return Array.from(groups.entries());
  }, [results]);

  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  const goTo = (result: SearchResult) => {
    router.push(result.href);
    setQuery('');
    setResults([]);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current) return;
      if (query.trim().length < 2 || flat.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((index) => Math.min(flat.length - 1, index + 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const target = flat[active];
        if (target) goTo(target);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [query, flat, active]);

  useEffect(() => {
    const element = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    element?.scrollIntoView({ block: 'nearest' });
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
        style={{
          borderBottom:
            results.length > 0 || query.trim().length >= 2
              ? '1px solid var(--border-subtle)'
              : undefined,
        }}
      >
        <MagnifyingGlassIcon
          className="h-4 w-4 shrink-0"
          style={{ color: 'var(--text-tertiary)' }}
          aria-hidden
        />
        <input
          id="docs-sidebar-search-input"
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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
        <div
          className="min-w-0 border-t overflow-x-hidden"
          style={{ borderTopColor: 'var(--border-subtle)' }}
        >
          <div
            ref={listRef}
            className="apex-scroll max-h-[min(38vh,16rem)] overflow-y-auto overflow-x-hidden overscroll-y-contain py-1.5 pl-1 pr-1"
            style={{ scrollbarGutter: 'stable' }}
            role="listbox"
            aria-label="Search results"
          >
            {!searching && results.length === 0 && (
              <div
                className="px-3 py-4 text-center text-[12px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                No matches for “{query}”.
              </div>
            )}

            {grouped.map(([groupName, items]) => {
              const startIndex = flat.findIndex((result) => result === items[0]);
              return (
                <div key={groupName} className="min-w-0" role="presentation">
                  <p
                    className="sticky top-0 z-10 mb-1 border-b px-2.5 py-1 pt-2 text-[9px] font-bold uppercase tracking-[0.18em]"
                    style={{
                      color: 'var(--accent-magenta)',
                      backgroundColor:
                        'color-mix(in srgb, var(--bg-raised) 94%, transparent)',
                      borderBottomColor:
                        'color-mix(in srgb, var(--border-default) 80%, transparent)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                  >
                    {groupName}
                  </p>
                  <div className="mx-1 min-w-0 space-y-0.5">
                    {items.map((result, index) => {
                      const flatIndex = startIndex + index;
                      const isActive = flatIndex === active;
                      return (
                        <button
                          key={`${result.href}-${flatIndex}`}
                          type="button"
                          data-idx={flatIndex}
                          data-search-href={result.href}
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActive(flatIndex)}
                          onClick={() => goTo(result)}
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
                              background: `color-mix(in srgb, ${MATCH_COLOR[result.matchType]} 18%, transparent)`,
                              color: MATCH_COLOR[result.matchType],
                              border: `1px solid color-mix(in srgb, ${MATCH_COLOR[result.matchType]} 42%, transparent)`,
                            }}
                            aria-hidden
                          >
                            {MATCH_LABEL[result.matchType]}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className="block break-words text-[12px] font-semibold leading-snug line-clamp-2"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {result.name}
                            </span>
                            {result.snippet && (
                              <span
                                className="mt-0.5 line-clamp-2 break-words text-[10px] leading-snug"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                …{result.snippet}…
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
