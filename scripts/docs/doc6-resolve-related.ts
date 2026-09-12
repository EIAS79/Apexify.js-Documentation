import fs from 'node:fs';
import path from 'node:path';
import { SEARCH_SCHEMA_VERSION, type SearchRecord, type SearchRecordKind } from '../../lib/search/schema';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'generated', 'docs-doc6');
const CHECK = process.argv.includes('--check');
const RECORDS_PATH = path.join(OUT, 'search-records.json');
const RELATED_PATH = path.join(OUT, 'related-content.json');
const RESOLVED_PATH = path.join(OUT, 'related-content-resolved.json');

interface SearchRecordsArtifact {
  schemaVersion: number;
  sourceChecksum: string;
  records: SearchRecord[];
}
interface RelatedTargetArtifact {
  id: string;
  score: number;
  reasons: string[];
}
interface RelatedEntryArtifact {
  sourceId: string;
  targets: RelatedTargetArtifact[];
}
interface RelatedContentArtifact {
  schemaVersion: number;
  records: RelatedEntryArtifact[];
}
interface ResolvedRelatedTargetArtifact {
  id: string;
  kind: SearchRecordKind;
  title: string;
  description?: string;
  canonicalHref: string;
  breadcrumb: string[];
  runtime: string[];
  packages: string[];
  stability?: string;
  score: number;
  reasons: string[];
}
interface ResolvedRelatedEntryArtifact {
  sourceRecordId: string;
  authoritativeSourceId: string;
  sourceKind: SearchRecordKind;
  targets: ResolvedRelatedTargetArtifact[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}
function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const recordsArtifact = readJson<SearchRecordsArtifact>(RECORDS_PATH);
const relatedArtifact = readJson<RelatedContentArtifact>(RELATED_PATH);
if (recordsArtifact.schemaVersion !== SEARCH_SCHEMA_VERSION || relatedArtifact.schemaVersion !== 1) {
  throw new Error('[doc6-related] source artifact schema mismatch');
}
const recordById = new Map(recordsArtifact.records.map((record) => [record.id, record]));
const resolvedRecords: ResolvedRelatedEntryArtifact[] = relatedArtifact.records.map((entry) => {
  const source = recordById.get(entry.sourceId);
  if (!source) throw new Error(`[doc6-related] missing source record ${entry.sourceId}`);
  const targets = entry.targets.map((target): ResolvedRelatedTargetArtifact => {
    const record = recordById.get(target.id);
    if (!record) throw new Error(`[doc6-related] missing target record ${target.id}`);
    const item: ResolvedRelatedTargetArtifact = {
      id: record.id,
      kind: record.kind,
      title: record.title,
      canonicalHref: record.canonicalHref,
      breadcrumb: record.breadcrumb,
      runtime: record.runtime,
      packages: record.packages,
      score: target.score,
      reasons: target.reasons,
    };
    const description = record.description ?? record.excerpt;
    if (description) item.description = description;
    if (record.stability) item.stability = record.stability;
    return item;
  });
  return {
    sourceRecordId: source.id,
    authoritativeSourceId: source.sourceId,
    sourceKind: source.kind,
    targets,
  };
});
const output = {
  schemaVersion: SEARCH_SCHEMA_VERSION,
  sourceChecksum: recordsArtifact.sourceChecksum,
  records: resolvedRecords,
};
const next = stable(output);
if (CHECK) {
  if (!fs.existsSync(RESOLVED_PATH) || fs.readFileSync(RESOLVED_PATH, 'utf8') !== next) {
    throw new Error('[doc6-related] resolved related-content artifact is stale; run npm run docs:search:build');
  }
  console.log(`[doc6-related] verified ${resolvedRecords.length} resolved source records`);
} else {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(RESOLVED_PATH, next);
  console.log(`[doc6-related] wrote ${resolvedRecords.length} resolved source records`);
}
