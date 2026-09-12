"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import type { SearchFilterOptions, SearchFilters, SearchResponse, SearchResult } from "@/lib/search/schema";

const EMPTY_FILTERS: SearchFilterOptions = { runtimes: [], packages: [], kinds: [], stabilities: [], versions: [], domains: [] };
const GROUP_LABEL: Record<string, string> = {
  "api-symbol": "API",
  "api-member": "API members",
  "api-option": "Options",
  "api-type": "Types",
  doc: "Docs",
  heading: "Headings",
  example: "Examples",
  gallery: "Gallery",
  changelog: "Changelog",
  error: "Errors",
  diagnostic: "Diagnostics",
};
const RECENT_KEY = "apexify.docs.search.recent.v1";

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}
function rememberRecent(query: string): void {
  const value = query.trim();
  if (value.length < 2) return;
  try {
    const next = [value, ...readRecent().filter((entry) => entry.toLowerCase() !== value.toLowerCase())].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Search remains fully functional when local storage is unavailable.
  }
}
function resultMeta(result: SearchResult): string {
  return [
    result.kind.replace("api-", "API "),
    result.packages.join(", "),
    result.runtime.join(", "),
    result.stability,
  ].filter(Boolean).join(" · ");
}

export interface GlobalDocsSearchProps {
  inputId?: string;
  initialQuery?: string;
  compact?: boolean;
  autoFocus?: boolean;
  onEscape?: () => void;
  onNavigate?: () => void;
  ariaLabel?: string;
  fixedFilters?: SearchFilters;
}

export function GlobalDocsSearch({
  inputId = "global-docs-search-input",
  initialQuery = "",
  compact = false,
  autoFocus = false,
  onEscape,
  onNavigate,
  ariaLabel = "Search documentation, API reference, examples, and diagnostics",
  fixedFilters = {},
}: GlobalDocsSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFilterOptions>(EMPTY_FILTERS);
  const [runtime, setRuntime] = useState("");
  const [packageName, setPackageName] = useState("");
  const [kind, setKind] = useState("");
  const [stability, setStability] = useState("");
  const [version, setVersion] = useState("");
  const [domain, setDomain] = useState("");
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [filteredOut, setFilteredOut] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const listboxId = `${inputId}-results`;

  useEffect(() => {
    setRecent(readRecent());
    if (autoFocus) requestAnimationFrame(() => inputRef.current?.focus());
  }, [autoFocus]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const trimmed = query.trim();
      const params = new URLSearchParams();
      if (trimmed.length >= 2) params.set("q", trimmed);
      const effectiveRuntime = fixedFilters.runtime ?? runtime;
      const effectivePackage = fixedFilters.package ?? packageName;
      const effectiveKind = fixedFilters.kind ?? kind;
      const effectiveStability = fixedFilters.stability ?? stability;
      const effectiveVersion = fixedFilters.version ?? version;
      const effectiveDomain = fixedFilters.domain ?? domain;
      if (effectiveRuntime) params.set("runtime", effectiveRuntime);
      if (effectivePackage) params.set("package", effectivePackage);
      if (effectiveKind) params.set("kind", effectiveKind);
      if (effectiveStability) params.set("stability", effectiveStability);
      if (effectiveVersion) params.set("version", effectiveVersion);
      if (effectiveDomain) params.set("domain", effectiveDomain);
      if (trimmed.length < 2 && (effectiveRuntime || effectivePackage || effectiveKind || effectiveStability || effectiveVersion || effectiveDomain)) params.set("q", "*");
      setSearching(trimmed.length >= 2);
      setError("");
      void fetch(`/api/docs/search?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(`Search request failed (${response.status})`);
          return response.json() as Promise<SearchResponse>;
        })
        .then((payload) => {
          setFilters(payload.filters ?? EMPTY_FILTERS);
          setResults(trimmed.length >= 2 ? payload.results ?? [] : []);
          setFilteredOut(Boolean(payload.filteredOut));
          setActive(0);
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setError(reason instanceof Error ? reason.message : "Search is temporarily unavailable.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, query.trim().length >= 2 ? 120 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, runtime, packageName, kind, stability, version, domain, fixedFilters.runtime, fixedFilters.package, fixedFilters.kind, fixedFilters.stability, fixedFilters.version, fixedFilters.domain]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const result of results) {
      const key = result.kind;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(result);
    }
    // Map insertion order follows the server's global relevance ranking, so the
    // highest-ranked result remains the first visible/keyboard-selectable item.
    return [...map.entries()];
  }, [results]);
  const flat = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);
  const hasFilters = Boolean(runtime || packageName || kind || stability || version || domain || fixedFilters.runtime || fixedFilters.package || fixedFilters.kind || fixedFilters.stability || fixedFilters.version || fixedFilters.domain);

  useEffect(() => {
    const option = listRef.current?.querySelector<HTMLElement>(`[data-search-index="${active}"]`);
    option?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const navigate = (result: SearchResult) => {
    rememberRecent(query);
    setRecent(readRecent());
    onNavigate?.();
    router.push(result.canonicalHref);
  };

  const resetFilters = () => {
    setRuntime("");
    setPackageName("");
    setKind("");
    setStability("");
    setVersion("");
    setDomain("");
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (query || hasFilters) {
        setQuery("");
        resetFilters();
        setResults([]);
      } else {
        onEscape?.();
      }
      return;
    }
    if (!flat.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(flat.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(0, value - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = flat[active];
      if (target) navigate(target);
    }
  };

  return (
    <div className="min-w-0">
      <div
        className="flex min-h-11 items-center gap-2 rounded-xl px-3"
        style={{ background: "var(--bg-sunken)", border: "1px solid var(--border-default)" }}
      >
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden style={{ color: "var(--text-secondary)" }} />
        <input
          id={inputId}
          data-docs-search-input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Search symbols, options, concepts, goals…"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={query.trim().length >= 2}
          aria-controls={query.trim().length >= 2 ? listboxId : undefined}
          aria-activedescendant={flat[active] ? `${inputId}-option-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {searching ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Searching" />
        ) : query ? (
          <button type="button" onClick={() => setQuery("")} className="grid h-8 w-8 place-items-center rounded-lg" aria-label="Clear search">
            <XMarkIcon className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {!compact && (
        <div role="group" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Search filters">
          <select aria-label="Runtime filter" value={runtime} onChange={(event) => setRuntime(event.target.value)} className="min-h-10 rounded-lg bg-transparent px-2 text-xs" style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            <option value="">All runtimes</option>
            {filters.runtimes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Package filter" value={packageName} onChange={(event) => setPackageName(event.target.value)} className="min-h-10 rounded-lg bg-transparent px-2 text-xs" style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            <option value="">All packages</option>
            {filters.packages.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Content type filter" value={kind} onChange={(event) => setKind(event.target.value)} className="min-h-10 rounded-lg bg-transparent px-2 text-xs" style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            <option value="">All content</option>
            {filters.kinds.map((value) => <option key={value} value={value}>{GROUP_LABEL[value] ?? value}</option>)}
          </select>
          <select aria-label="Stability filter" value={stability} onChange={(event) => setStability(event.target.value)} className="min-h-10 rounded-lg bg-transparent px-2 text-xs" style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            <option value="">All stability</option>
            {filters.stabilities.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          {filters.domains.length > 1 && (
            <select aria-label="Domain filter" value={domain} onChange={(event) => setDomain(event.target.value)} className="min-h-10 rounded-lg bg-transparent px-2 text-xs" style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
              <option value="">All domains</option>
              {filters.domains.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          )}
          {filters.versions.length > 1 && (
            <select aria-label="Version filter" value={version} onChange={(event) => setVersion(event.target.value)} className="min-h-10 rounded-lg bg-transparent px-2 text-xs" style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
              <option value="">All versions</option>
              {filters.versions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          )}
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {error ? error : searching ? "Searching" : query.trim().length >= 2 ? `${results.length} search results` : "Search ready"}
      </div>

      {query.trim().length < 2 ? (
        <div className="px-2 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          {recent.length > 0 ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Recent searches</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((value) => (
                  <button key={value} type="button" onClick={() => setQuery(value)} className="rounded-lg px-2.5 py-1.5 text-xs" style={{ border: "1px solid var(--border-default)" }}>
                    {value}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p>Try an API symbol, nested option, “canvas”, “create a chart”, or a runtime/package term.</p>
          )}
        </div>
      ) : error ? (
        <div role="alert" className="px-3 py-5 text-sm" style={{ color: "var(--text-secondary)" }}>{error}</div>
      ) : !searching && results.length === 0 ? (
        <div className="px-3 py-5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>{filteredOut ? "Matches exist, but the active filters exclude them." : `No results for “${query}”.`}</p>
          {hasFilters && <button type="button" onClick={resetFilters} className="mt-2 underline">Reset filters</button>}
        </div>
      ) : (
        <div id={listboxId} ref={listRef} role="listbox" aria-label="Search results" className={`apex-scroll mt-2 overflow-y-auto ${compact ? "max-h-[16rem]" : "max-h-[min(60vh,34rem)]"}`}>
          {grouped.map(([group, items]) => {
            const start = flat.indexOf(items[0]);
            return (
              <section key={group} role="presentation" className="mb-2">
                <h3 className="sticky top-0 z-10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ background: "var(--bg-raised)", color: "var(--text-tertiary)" }}>
                  {GROUP_LABEL[group] ?? group}
                </h3>
                {items.map((result, offset) => {
                  const index = start + offset;
                  const selected = index === active;
                  return (
                    <button
                      key={result.id}
                      id={`${inputId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-search-index={index}
                      data-search-href={result.canonicalHref}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => navigate(result)}
                      className="block min-h-11 w-full rounded-lg px-3 py-2.5 text-left"
                      style={{ background: selected ? "color-mix(in srgb, var(--accent-iris) 14%, transparent)" : "transparent" }}
                    >
                      <span className="flex min-w-0 items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{result.title}</span>
                          <span className="mt-0.5 block truncate text-[11px]" style={{ color: "var(--text-tertiary)" }}>{result.breadcrumb.join(" › ")}</span>
                        </span>
                        <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                          {result.stability ?? result.kind}
                        </span>
                      </span>
                      {(result.excerpt || result.description) && (
                        <span className="mt-1 line-clamp-2 block text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {result.excerpt || result.description}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px]" style={{ color: "var(--text-muted)" }}>{resultMeta(result)}</span>
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
