import fs from 'node:fs';
import path from 'node:path';
import { SEARCH_SCHEMA_VERSION, type SearchIndexArtifact, type SearchRecord } from './schema';

export interface SearchRecordsArtifact {
  schemaVersion: number;
  sourceChecksum: string;
  records: SearchRecord[];
}

export interface RelatedTargetArtifact {
  id: string;
  score: number;
  reasons: string[];
}

export interface RelatedEntryArtifact {
  sourceId: string;
  targets: RelatedTargetArtifact[];
}

export interface RelatedContentArtifact {
  schemaVersion: number;
  records: RelatedEntryArtifact[];
}

const GENERATED_DIR = path.join(process.cwd(), 'generated', 'docs-doc6');
const RECORDS_PATH = path.join(GENERATED_DIR, 'search-records.json');
const INDEX_PATH = path.join(GENERATED_DIR, 'search-index-manifest.json');
const RELATED_PATH = path.join(GENERATED_DIR, 'related-content.json');

let recordsCache: SearchRecordsArtifact | undefined;
let indexCache: SearchIndexArtifact | undefined;
let relatedCache: RelatedContentArtifact | undefined;

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function getSearchRecordsArtifact(): SearchRecordsArtifact {
  if (!recordsCache) {
    recordsCache = readJson<SearchRecordsArtifact>(RECORDS_PATH);
    if (recordsCache.schemaVersion !== SEARCH_SCHEMA_VERSION) {
      throw new Error('[doc6-search] generated search-record schema mismatch; rebuild DOC-6 artifacts');
    }
  }
  return recordsCache;
}

export function getSearchIndexArtifact(): SearchIndexArtifact {
  if (!indexCache) {
    indexCache = readJson<SearchIndexArtifact>(INDEX_PATH);
    if (indexCache.schemaVersion !== SEARCH_SCHEMA_VERSION) {
      throw new Error('[doc6-search] generated search-index schema mismatch; rebuild DOC-6 artifacts');
    }
  }
  return indexCache;
}

export function getSearchArtifacts(): { recordsArtifact: SearchRecordsArtifact; indexArtifact: SearchIndexArtifact } {
  const recordsArtifact = getSearchRecordsArtifact();
  const indexArtifact = getSearchIndexArtifact();
  if (recordsArtifact.sourceChecksum !== indexArtifact.sourceChecksum) {
    throw new Error('[doc6-search] generated search artifacts are stale/inconsistent');
  }
  if (recordsArtifact.records.length !== indexArtifact.recordCount) {
    throw new Error('[doc6-search] generated record/index count mismatch');
  }
  return { recordsArtifact, indexArtifact };
}

export function getRelatedContentArtifact(): RelatedContentArtifact {
  if (!relatedCache) relatedCache = readJson<RelatedContentArtifact>(RELATED_PATH);
  return relatedCache;
}
