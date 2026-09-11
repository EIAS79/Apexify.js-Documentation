import type {
  SearchFilterOptions,
  SearchFilters,
  SearchIndexArtifact,
  SearchRecord,
  RankedSearchRecord,
} from './schema';

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[@._/\\:#()[\]{}<>|+=-]+/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeSearchText(value: string): string[] {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return [...new Set(normalized.split(' ').filter(Boolean))];
}

function compactNormalized(value: string): string {
  return value.replace(/\s+/g, '');
}

function compact(value: string): string {
  return compactNormalized(normalizeSearchText(value));
}

function stabilityPenalty(stability?: string): number {
  if (stability === 'REMOVED') return -35;
  if (stability === 'ROADMAP') return -30;
  if (stability === 'DEPRECATED') return -18;
  if (stability === 'EXPERIMENTAL') return -6;
  if (stability === 'PREVIEW') return -3;
  return 0;
}

function boundedLevenshtein(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      next[j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    prev = next;
  }
  return prev[b.length];
}

type PreparedRecord = {
  title: string;
  titleCompact: string;
  symbol: string;
  symbolCompact: string;
  option: string;
  optionCompact: string;
  type: string;
  typeCompact: string;
  error: string;
  errorCompact: string;
  aliases: string[];
  keywords: string[];
  goals: string[];
  description: string;
  runtimes: string[];
  packages: string[];
  excerpt: string;
  haystackTokens: string[];
};

const preparedCache = new WeakMap<SearchRecord, PreparedRecord>();
const recordMapCache = new WeakMap<SearchRecord[], Map<string, SearchRecord>>();

function prepare(record: SearchRecord): PreparedRecord {
  const cached = preparedCache.get(record);
  if (cached) return cached;
  const title = normalizeSearchText(record.title);
  const symbol = normalizeSearchText(record.symbol ?? '');
  const option = normalizeSearchText(record.optionPath ?? '');
  const type = normalizeSearchText(record.typeName ?? '');
  const error = normalizeSearchText(record.errorCode ?? '');
  const aliases = record.aliases.map(normalizeSearchText);
  const keywords = record.keywords.map(normalizeSearchText);
  const goals = record.goals.map(normalizeSearchText);
  const description = normalizeSearchText(record.description ?? '');
  const runtimes = record.runtime.map(normalizeSearchText);
  const packages = record.packages.map(normalizeSearchText);
  const excerpt = normalizeSearchText(record.excerpt ?? '');
  const haystackTokens = [...new Set([
    title,
    description,
    excerpt,
    symbol,
    option,
    type,
    error,
    ...keywords,
    ...aliases,
    ...goals,
    ...runtimes,
    ...packages,
  ].flatMap((value) => value.split(' ')).filter(Boolean))];
  const prepared: PreparedRecord = {
    title,
    titleCompact: compactNormalized(title),
    symbol,
    symbolCompact: compactNormalized(symbol),
    option,
    optionCompact: compactNormalized(option),
    type,
    typeCompact: compactNormalized(type),
    error,
    errorCompact: compactNormalized(error),
    aliases,
    keywords,
    goals,
    description,
    runtimes,
    packages,
    excerpt,
    haystackTokens,
  };
  preparedCache.set(record, prepared);
  return prepared;
}

type QueryContext = { normalized: string; compact: string; tokens: string[] };

function scoreRecord(record: SearchRecord, query: QueryContext): { score: number; reason: string } | null {
  const prepared = prepare(record);
  let score = stabilityPenalty(record.stability);
  let reason = '';

  if (prepared.symbol && (prepared.symbol === query.normalized || prepared.symbolCompact === query.compact)) {
    score += 1000; reason = 'exact symbol';
  } else if (prepared.error && (prepared.error === query.normalized || prepared.errorCompact === query.compact)) {
    score += 990; reason = 'exact error code';
  } else if (prepared.title === query.normalized || prepared.titleCompact === query.compact) {
    score += record.kind === 'api-symbol' ? 960 : 930; reason = 'exact title';
  } else if (prepared.option && (prepared.option === query.normalized || prepared.optionCompact === query.compact)) {
    score += 900; reason = 'exact option';
  } else if (prepared.type && (prepared.type === query.normalized || prepared.typeCompact === query.compact)) {
    score += 880; reason = 'exact type';
  } else if (prepared.aliases.includes(query.normalized)) {
    score += 850; reason = 'exact alias';
  } else if (prepared.packages.includes(query.normalized)) {
    score += 820; reason = 'package';
  } else if (prepared.runtimes.includes(query.normalized)) {
    score += 800; reason = 'runtime';
  } else if (prepared.title.startsWith(query.normalized) || prepared.symbol.startsWith(query.normalized)) {
    score += 760; reason = 'title prefix';
  } else if (prepared.option.includes(query.normalized) || prepared.type.includes(query.normalized)) {
    score += 700; reason = record.kind === 'api-option' ? 'option' : 'type';
  } else if (record.kind === 'heading' && prepared.title.includes(query.normalized)) {
    score += 620; reason = 'heading';
  } else if (prepared.goals.some((goal) => goal.includes(query.normalized))) {
    score += 590; reason = 'goal';
  } else if (prepared.keywords.some((keyword) => keyword.includes(query.normalized)) || prepared.aliases.some((alias) => alias.includes(query.normalized))) {
    score += 540; reason = 'keyword';
  } else if (prepared.title.includes(query.normalized) || prepared.description.includes(query.normalized)) {
    score += 470; reason = 'title/description';
  } else if (prepared.excerpt.includes(query.normalized)) {
    score += 340; reason = 'body';
  } else {
    const allTokenMatches = query.tokens.length > 0 && query.tokens.every((token) =>
      prepared.haystackTokens.some((candidate) => candidate === token || candidate.startsWith(token)));
    if (allTokenMatches) {
      score += 310; reason = 'token';
    } else {
      let fuzzy = 0;
      for (const token of query.tokens) {
        if (token.length < 4) continue;
        if (prepared.haystackTokens.some((candidate) => candidate.length >= 4 && boundedLevenshtein(token, candidate, 2) <= 2)) fuzzy += 1;
      }
      if (!fuzzy) return null;
      score += 100 + fuzzy * 12; reason = 'fuzzy';
    }
  }

  if (record.kind === 'api-symbol') score += 24;
  if (record.kind === 'api-option') score += 15;
  if (record.kind === 'doc') score += 8;
  return { score, reason };
}

function passesFilters(record: SearchRecord, filters: SearchFilters): boolean {
  if (filters.runtime && !record.runtime.includes(filters.runtime)) return false;
  if (filters.package && !record.packages.includes(filters.package)) return false;
  if (filters.kind && record.kind !== filters.kind) return false;
  if (filters.stability && record.stability !== filters.stability) return false;
  if (filters.version && record.version !== filters.version) return false;
  if (filters.domain && record.domain !== filters.domain) return false;
  return true;
}

function intersectPostings(postings: string[][]): Set<string> {
  if (!postings.length) return new Set();
  const sorted = [...postings].sort((a, b) => a.length - b.length);
  let current = new Set(sorted[0]);
  for (let i = 1; i < sorted.length && current.size; i += 1) {
    const next = new Set(sorted[i]);
    current = new Set([...current].filter((id) => next.has(id)));
  }
  return current;
}

function candidateIds(index: SearchIndexArtifact, records: SearchRecord[], queryTokens: string[]): Set<string> {
  if (!queryTokens.length) return new Set(records.map((record) => record.id));
  const postings = queryTokens.map((token) => {
    const exact = index.tokens[token] ?? [];
    if (exact.length) return exact;
    return index.prefixes[token.slice(0, Math.min(6, token.length))] ?? [];
  });
  if (postings.every((list) => list.length > 0)) {
    const intersection = intersectPostings(postings);
    if (intersection.size) return intersection;
  }
  const union = new Set<string>();
  for (const list of postings) for (const id of list) union.add(id);
  // Only an absent posting set needs full-corpus fuzzy fallback.
  return union.size ? union : new Set(records.map((record) => record.id));
}

function recordsById(records: SearchRecord[]): Map<string, SearchRecord> {
  const cached = recordMapCache.get(records);
  if (cached) return cached;
  const map = new Map(records.map((record) => [record.id, record]));
  recordMapCache.set(records, map);
  return map;
}

export function getSearchFilterOptions(records: SearchRecord[]): SearchFilterOptions {
  const collect = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    runtimes: collect(records.flatMap((record) => record.runtime)),
    packages: collect(records.flatMap((record) => record.packages)),
    kinds: collect(records.map((record) => record.kind)),
    stabilities: collect(records.map((record) => record.stability ?? '')),
    versions: collect(records.map((record) => record.version ?? '')),
    domains: collect(records.map((record) => record.domain ?? '')),
  };
}

export function searchRecords(
  index: SearchIndexArtifact,
  records: SearchRecord[],
  rawQuery: string,
  filters: SearchFilters = {},
  limit = 30,
): { results: RankedSearchRecord[]; unfilteredTotal: number; filteredOut: boolean } {
  const normalized = normalizeSearchText(rawQuery);
  if (!normalized) return { results: [], unfilteredTotal: 0, filteredOut: false };
  const query: QueryContext = {
    normalized,
    compact: compact(rawQuery),
    tokens: [...new Set(normalized.split(' ').filter(Boolean))],
  };
  const byId = recordsById(records);
  const candidates = [...candidateIds(index, records, query.tokens)]
    .map((id) => byId.get(id))
    .filter((record): record is SearchRecord => Boolean(record));
  const scored = candidates
    .map((record) => {
      const scoredRecord = scoreRecord(record, query);
      return scoredRecord ? { ...record, score: scoredRecord.score, matchReason: scoredRecord.reason } : null;
    })
    .filter((record): record is RankedSearchRecord => Boolean(record))
    .sort((a, b) =>
      b.score - a.score ||
      a.title.localeCompare(b.title, undefined, { numeric: true }) ||
      a.canonicalHref.localeCompare(b.canonicalHref) ||
      a.id.localeCompare(b.id));

  const filtered = scored.filter((record) => passesFilters(record, filters));
  return {
    results: filtered.slice(0, Math.max(1, Math.min(100, limit))),
    unfilteredTotal: scored.length,
    filteredOut: scored.length > 0 && filtered.length === 0,
  };
}
