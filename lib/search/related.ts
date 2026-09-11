import recordsJson from '@/generated/docs-doc6/search-records.json';
import relatedJson from '@/generated/docs-doc6/related-content.json';
import type { SearchRecord } from './schema';

interface RelatedTargetArtifact {
  id: string;
  score: number;
  reasons: string[];
}

interface RelatedEntryArtifact {
  sourceId: string;
  targets: RelatedTargetArtifact[];
}

export interface RelatedContentItem {
  id: string;
  kind: SearchRecord['kind'];
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

const records = (recordsJson as { records: SearchRecord[] }).records;
const related = (relatedJson as { records: RelatedEntryArtifact[] }).records;
const recordById = new Map(records.map((record) => [record.id, record]));
const recordIdsBySourceId = new Map<string, string[]>();
for (const record of records) {
  const ids = recordIdsBySourceId.get(record.sourceId) ?? [];
  ids.push(record.id);
  recordIdsBySourceId.set(record.sourceId, ids);
}
const relatedBySourceId = new Map(related.map((entry) => [entry.sourceId, entry]));

function resolveSourceRecordId(authoritativeId: string, preferredKinds?: readonly SearchRecord['kind'][]): string | null {
  if (relatedBySourceId.has(authoritativeId)) return authoritativeId;
  const ids = recordIdsBySourceId.get(authoritativeId) ?? [];
  if (!ids.length) return null;
  if (preferredKinds?.length) {
    const preferred = ids.find((id) => {
      const record = recordById.get(id);
      return record ? preferredKinds.includes(record.kind) : false;
    });
    if (preferred) return preferred;
  }
  return ids.find((id) => relatedBySourceId.has(id)) ?? null;
}

export function getRelatedContent(
  authoritativeId: string,
  options: { limit?: number; preferredKinds?: readonly SearchRecord['kind'][] } = {},
): RelatedContentItem[] {
  const sourceRecordId = resolveSourceRecordId(authoritativeId, options.preferredKinds);
  if (!sourceRecordId) return [];
  const entry = relatedBySourceId.get(sourceRecordId);
  if (!entry) return [];
  const limit = Math.max(1, Math.min(12, options.limit ?? 4));
  return entry.targets
    .map((target) => {
      const record = recordById.get(target.id);
      if (!record) return null;
      return {
        id: record.id,
        kind: record.kind,
        title: record.title,
        description: record.description ?? record.excerpt,
        canonicalHref: record.canonicalHref,
        breadcrumb: record.breadcrumb,
        runtime: record.runtime,
        packages: record.packages,
        stability: record.stability,
        score: target.score,
        reasons: target.reasons,
      } satisfies RelatedContentItem;
    })
    .filter((item): item is RelatedContentItem => Boolean(item))
    .slice(0, limit);
}
