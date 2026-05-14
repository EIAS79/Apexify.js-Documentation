'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

export function DocsSearchPalette({
  open,
  onClose,
  initialQuery = '',
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<number>(0);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setResults([]);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (!open) return;
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
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
  }, [query, open]);

  /** Group results by folder so the list scans by topic. */
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
    onClose();
    if (typeof window === 'undefined') return;
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/docs') {
      // Same route: `router.push` updates the hash via the History API but does not
      // fire `hashchange`, and `app/docs/page.tsx` only reloads MDX on `hashchange`.
      window.location.hash = filename;
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      router.push(`/docs#${filename}`);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flat, active, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-base) 70%, black)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            className="w-full max-w-2xl overflow-hidden rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-raised)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3.5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <MagnifyingGlassIcon
                className="h-4 w-4 shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
                aria-hidden
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search docs by title, section, or content…"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
                autoComplete="off"
                spellCheck={false}
                aria-label="Search documentation"
              />
              {searching && (
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 animate-spin rounded-full"
                  style={{
                    border: '2px solid color-mix(in srgb, var(--accent-iris) 30%, transparent)',
                    borderTopColor: 'var(--accent-iris)',
                  }}
                />
              )}
              <kbd className="kbd hidden sm:inline-flex">esc</kbd>
            </div>

            <ul
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto py-1"
              role="listbox"
            >
              {!searching && query.trim().length < 2 && (
                <li className="px-5 py-10 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  <p className="text-sm">Start typing to search documentation</p>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Try “canvas”, “gif”, or “createChart”
                  </p>
                </li>
              )}

              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <li className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  No matches for <span style={{ color: 'var(--text-secondary)' }}>“{query}”</span>.
                </li>
              )}

              {grouped.map(([groupName, items]) => {
                const startIdx = flat.findIndex((r) => r === items[0]);
                return (
                  <li key={groupName}>
                    <p
                      className="sticky top-0 z-10 px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
                      style={{
                        color: 'var(--accent-magenta)',
                        backgroundColor: 'color-mix(in srgb, var(--bg-raised) 96%, transparent)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {groupName}
                    </p>
                    <ul>
                      {items.map((r, i) => {
                        const idx = startIdx + i;
                        const isActive = idx === active;
                        return (
                          <li
                            key={`${r.filename}-${idx}`}
                            id={`docs-palette-${idx}`}
                            data-idx={idx}
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => goTo(r.filename)}
                            className="mx-2 flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
                            style={{
                              backgroundColor: isActive
                                ? 'color-mix(in srgb, var(--accent-iris) 14%, transparent)'
                                : 'transparent',
                            }}
                          >
                            <span
                              className="mt-0.5 inline-flex h-5 items-center rounded-md px-1.5 text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                background: `color-mix(in srgb, ${MATCH_COLOR[r.matchType]} 18%, transparent)`,
                                color: MATCH_COLOR[r.matchType],
                                border: `1px solid color-mix(in srgb, ${MATCH_COLOR[r.matchType]} 40%, transparent)`,
                              }}
                              aria-hidden
                            >
                              {MATCH_LABEL[r.matchType]}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className="block truncate text-sm font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {r.name}
                              </span>
                              {r.snippet && (
                                <span
                                  className="mt-0.5 block line-clamp-2 text-[11px] leading-snug"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  …{r.snippet}…
                                </span>
                              )}
                            </span>
                            {isActive && (
                              <kbd className="kbd ml-auto hidden shrink-0 sm:inline-flex">↵</kbd>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>

            <div
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px]"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                color: 'var(--text-tertiary)',
                backgroundColor: 'var(--bg-sunken)',
              }}
            >
              <span className="inline-flex items-center gap-1">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="kbd">↵</kbd>
                open
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd">K</kbd>
                toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
