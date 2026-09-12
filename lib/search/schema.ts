export const SEARCH_SCHEMA_VERSION = 1 as const;

export const SEARCH_RECORD_KINDS = [
  'doc',
  'heading',
  'api-symbol',
  'api-member',
  'api-option',
  'api-type',
  'example',
  'gallery',
  'changelog',
  'error',
  'diagnostic',
] as const;

export type SearchRecordKind = (typeof SEARCH_RECORD_KINDS)[number];

export interface SearchRecord {
  id: string;
  kind: SearchRecordKind;
  title: string;
  description?: string;
  excerpt?: string;
  href: string;
  canonicalHref: string;
  breadcrumb: string[];
  runtime: string[];
  packages: string[];
  stability?: string;
  version?: string;
  domain?: string;
  symbol?: string;
  optionPath?: string;
  typeName?: string;
  errorCode?: string;
  keywords: string[];
  aliases: string[];
  goals: string[];
  sourceId: string;
  sourcePath?: string;
}

export interface SearchIndexArtifact {
  schemaVersion: typeof SEARCH_SCHEMA_VERSION;
  sourceChecksum: string;
  recordCount: number;
  tokens: Record<string, string[]>;
  prefixes: Record<string, string[]>;
}

export interface SearchFilters {
  runtime?: string;
  package?: string;
  kind?: string;
  stability?: string;
  version?: string;
  domain?: string;
}

export interface RankedSearchRecord extends SearchRecord {
  score: number;
  matchReason: string;
}

/** Browser/API result shape. Internal search terms, aliases and source paths stay server-side. */
export interface SearchResult {
  id: string;
  kind: SearchRecordKind;
  title: string;
  description?: string;
  excerpt?: string;
  canonicalHref: string;
  breadcrumb: string[];
  runtime: string[];
  packages: string[];
  stability?: string;
  version?: string;
  domain?: string;
  symbol?: string;
  optionPath?: string;
  typeName?: string;
  errorCode?: string;
  score: number;
  matchReason: string;
}

export interface SearchFilterOptions {
  runtimes: string[];
  packages: string[];
  kinds: string[];
  stabilities: string[];
  versions: string[];
  domains: string[];
}

export interface SearchResponse {
  schemaVersion: typeof SEARCH_SCHEMA_VERSION;
  query: string;
  results: SearchResult[];
  total: number;
  unfilteredTotal: number;
  filteredOut: boolean;
  filters: SearchFilterOptions;
}
