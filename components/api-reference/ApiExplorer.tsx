'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import type { ApiSymbol } from '@/lib/api-reference/schema';

type CatalogSymbol = Pick<ApiSymbol, 'id' | 'symbol' | 'kind' | 'href' | 'summary' | 'stability' | 'isTypeOnly' | 'runtimeTargets'>;
type Group = 'all' | 'class' | 'function' | 'types';
const FILTERS: Array<{ id: Group; label: string }> = [
  { id: 'all', label: 'All exports' },
  { id: 'class', label: 'Classes & objects' },
  { id: 'function', label: 'Functions' },
  { id: 'types', label: 'Types & interfaces' },
];

function matchesGroup(symbol: CatalogSymbol, group: Group) {
  if (group === 'all') return true;
  if (group === 'types') return symbol.isTypeOnly || ['interface', 'type', 'enum'].includes(symbol.kind);
  if (group === 'class') return ['class', 'namespace', 'constant'].includes(symbol.kind);
  return symbol.kind === 'function';
}

export default function ApiExplorer({ symbols }: { symbols: CatalogSymbol[] }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<Group>('all');
  const [limit, setLimit] = useState(36);
  const normalized = query.trim().toLowerCase();
  const results = useMemo(() => symbols.filter(symbol =>
    matchesGroup(symbol, group) &&
    (normalized === '' || [symbol.symbol, symbol.kind, symbol.summary, ...symbol.runtimeTargets]
      .join(' ').toLowerCase().includes(normalized)),
  ), [symbols, group, normalized]);
  return (
    <section className="apx-api-explorer" aria-label="Browse API symbols">
      <div className="apx-api-explorer__bar">
        <div>
          <h2>Explore the API</h2>
          <p className="apx-api-explorer__count" role="status">
            {results.length} matching exports · Source-generated, versioned
          </p>
        </div>
        <label className="apx-api-explorer__search">
          <MagnifyingGlassIcon aria-hidden="true" />
          <input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(36); }}
            placeholder="Find a method, class or type…" aria-label="Search API exports" />
        </label>
      </div>
      <div className="apx-api-explorer__tabs" role="group" aria-label="API export types">
        {FILTERS.map(filter => <button type="button" key={filter.id} aria-pressed={group === filter.id}
          onClick={() => { setGroup(filter.id); setLimit(36); }}>{filter.label}</button>)}
      </div>
      {results.length ? (
        <>
          <div className="apx-api-related-grid">
            {results.slice(0, limit).map(symbol => (
              <Link className="apx-api-reference-card" href={symbol.href} key={symbol.id}>
                <span>{symbol.kind} · {symbol.stability} · {symbol.runtimeTargets.join(', ') || 'runtime unspecified'}</span>
                <strong>{symbol.symbol}</strong>
                <p>{symbol.summary}</p>
                <ArrowUpRightIcon width={16} height={16} aria-hidden="true" style={{ marginTop: 'auto', alignSelf: 'end', color: 'var(--docs-blue)' }} />
              </Link>
            ))}
          </div>
          {results.length > limit && (
            <button type="button" className="apx-api-explorer__more" onClick={() => setLimit(count => count + 36)}>
              Show more exports ({results.length - limit} remaining)
            </button>
          )}
        </>
      ) : (
        <div className="apx-api-explorer__empty">
          <h3>No matching exports</h3>
          <p>Try another API name or browse all symbols.</p>
          <button type="button" className="apx-api-explorer__more"
            onClick={() => { setQuery(''); setGroup('all'); }}>Clear search and filters</button>
        </div>
      )}
    </section>
  );
}
