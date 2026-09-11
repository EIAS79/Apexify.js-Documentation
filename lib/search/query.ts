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

function compact(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, '');
}

function recordText(record: SearchRecord): string {
  return [
    record.title,
    record.description,
    record.excerpt,
    record.symbol,
    record.optionPath,
    record.typeName,
    record.errorCode,
    ...record.keywords,
    ...record.aliases,
    ...record.goals,
    ...record.runtime,
    ...record.packages,
  ]
    .filter(Boolean)
    .join(' ');
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

function scoreRecord(record: SearchRecord, rawQuery: string): { score: number; reason: string } | null {
  const query = normalizeSearchText(rawQuery);
  if (!query) return null;
  const qCompact = compact(rawQuery);
  const title = normalizeSearchText(record.title);
  const titleCompact = compact(record.title);
  const symbol = normalizeSearchText(record.symbol ?? '');
  const symbolCompact = compact(record.symbol ?? '');
  const option = normalizeSearchText(record.optionPath ?? '');
  const optionCompact = compact(record.optionPath ?? '');
  const type = normalizeSearchText(record.typeName ?? '');
  const typeCompact = compact(record.typeName ?? '');
  const error = normalizeSearchText(record.errorCode ?? '');
  const aliases = record.aliases.map(normalizeSearchText);
  const keywords = record.keywords.map(normalizeSearchText);
  const goals = record.goals.map(normalizeSearchText);
  const description = normalizeSearchText(record.description ?? '');
  const runtimes = record.runtime.map(normalizeSearchText);
  const packages = record.packages.map(normalizeSearchText);
  const excerpt = normalizeSearchText(record.excerpt ?? '');
  const tokens = tokenizeSearchText(rawQuery);
  let score = stabilityPenalty(record.stability);
  let reason = '';

  if (symbol && (symbol === query || symbolCompact === qCompact)) {
    score += 1000; reason = 'exact symbol';
  } else if (error && (error === query || compact(error) === qCompact)) {
    score += 990; reason = 'exact error code';
  } else if (title === query || titleCompact === qCompact) {
    score += record.kind === 'api-symbol' ? 960 : 930; reason = 'exact title';
  } else if (option && (option === query || optionCompact === qCompact)) {
    score += 900; reason = 'exact option';
  } else if (type && (type === query || typeCompact === qCompact)) {
    score += 880; reason = 'exact type';
  } else if (aliases.includes(query)) {
    score += 850; reason = 'exact alias';
  } else if (packages.includes(query)) {
    score += 820; reason = 'package';
  } else if (runtimes.includes(query)) {
    score += 800; reason = 'runtime';
  } else if (title.startsWith(query) || symbol.startsWith(query)) {
    score += 760; reason = 'title prefix';
  } else if (option.includes(query) || type.includes(query)) {
    score += 700; reason = record.kind === 'api-option' ? 'option' : 'type';
  } else if (record.kind === 'heading' && title.includes(query)) {
    score += 620; reason = 'heading';
  } else if (goals.some((goal) => goal.includes(query))) {
    score += 590; reason = 'goal';
  } else if (keywords.some((keyword) => keyword.includes(query)) || aliases.some((alias) => alias.includes(query))) {
    score += 540; reason = 'keyword';
  } else if (title.includes(query) || description.includes(query)) {
    score += 470; reason = 'title/description';
  } else if (excerpt.includes(query)) {
    score += 340; reason = 'body';
  } else {
    const haystackTokens = tokenizeSearchText(recordText(record));
    const allTokenMatches = tokens.length > 0 && tokens.every((token) =>
      haystackTokens.some((candidate) => candidate === token || candidate.startsWith(token)));
    if (allTokenMatches) {
      score += 310; reason = 'token';
    } else {
      let fuzzy = 0;
      for (const token of tokens) {
        if (token.length < 4) continue;
        if (haystackTokens.some((candidate) => candidate.length >= 4 && boundedLevenshtein(token, candidate, 2) <= 2)) fuzzy += 1;
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

function candidateIds(index: SearchIndexArtifact, records: SearchRecord[], query: string): Set<string> {
  const tokens = tokenizeSearchText(query);
  if (!tokens.length) return new Set(records.map((record) => record.id));
  const candidate = new Set<string>();
  for (const token of tokens) {
    for (const id of index.tokens[token] ?? []) candidate.add(id);
    for (const id of index.prefixes[token.slice(0, Math.min(6, token.length))] ?? []) candidate.add(id);
  }
  // Fuzzy fallback requires the full normalized record set, but only after the cheap
  // postings lookup fails to find a meaningful candidate.
  return candidate.size ? candidate : new Set(records.map((record) => record.id));
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
  query: string,
  filters: SearchFilters = {},
  limit = 30,
): { results: RankedSearchRecord[]; unfilteredTotal: number; filteredOut: boolean } {
  const byId = new Map(records.map((record) => [record.id, record]));
  const candidates = [...candidateIds(index, records, query)]
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
