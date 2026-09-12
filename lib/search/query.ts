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
type ScoredRef = { record: SearchRecord; score: number; reason: string };

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

function intersectPostings(postings: string[][]): string[] {
  if (!postings.length) return [];
  const sorted = [...postings].sort((a, b) => a.length - b.length);
  let current = new Set(sorted[0]);
  for (let i = 1; i < sorted.length && current.size; i += 1) {
    const next = new Set(sorted[i]);
    for (const id of current) if (!next.has(id)) current.delete(id);
  }
  return [...current];
}

function candidateIds(index: SearchIndexArtifact, records: SearchRecord[], queryTokens: string[]): string[] {
  if (!queryTokens.length) return records.map((record) => record.id);
  const postings = queryTokens.map((token) => {
    const exact = index.tokens[token] ?? [];
    if (exact.length) return exact;
    return index.prefixes[token.slice(0, Math.min(6, token.length))] ?? [];
  });
  if (postings.length === 1 && postings[0].length) return postings[0];
  if (postings.every((list) => list.length > 0)) {
    const intersection = intersectPostings(postings);
    if (intersection.length) return intersection;
  }
  const union = new Set<string>();
  for (const list of postings) for (const id of list) union.add(id);
  return union.size ? [...union] : records.map((record) => record.id);
}

function recordsById(records: SearchRecord[]): Map<string, SearchRecord> {
  const cached = recordMapCache.get(records);
  if (cached) return cached;
  const map = new Map(records.map((record) => [record.id, record]));
  recordMapCache.set(records, map);
  return map;
}

function compareScored(a: ScoredRef, b: ScoredRef): number {
  return b.score - a.score ||
    a.record.title.localeCompare(b.record.title, undefined, { numeric: true }) ||
    a.record.canonicalHref.localeCompare(b.record.canonicalHref) ||
    a.record.id.localeCompare(b.record.id);
}

function insertTop(top: ScoredRef[], candidate: ScoredRef, limit: number): void {
  if (top.length === limit && compareScored(candidate, top[top.length - 1]) >= 0) return;
  let low = 0;
  let high = top.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (compareScored(candidate, top[mid]) < 0) high = mid;
    else low = mid + 1;
  }
  top.splice(low, 0, candidate);
  if (top.length > limit) top.pop();
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
  const boundedLimit = Math.max(1, Math.min(100, limit));
  const byId = recordsById(records);
  const top: ScoredRef[] = [];
  let unfilteredTotal = 0;
  let filteredMatches = 0;

  for (const id of candidateIds(index, records, query.tokens)) {
    const record = byId.get(id);
    if (!record) continue;
    const scored = scoreRecord(record, query);
    if (!scored) continue;
    unfilteredTotal += 1;
    if (!passesFilters(record, filters)) continue;
    filteredMatches += 1;
    insertTop(top, { record, score: scored.score, reason: scored.reason }, boundedLimit);
  }

  return {
    results: top.map(({ record, score, reason }) => ({ ...record, score, matchReason: reason })),
    unfilteredTotal,
    filteredOut: unfilteredTotal > 0 && filteredMatches === 0,
  };
}
