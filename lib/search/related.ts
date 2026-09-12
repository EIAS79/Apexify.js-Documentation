import { getResolvedRelatedContentArtifact, type ResolvedRelatedEntryArtifact } from './server-data';
import type { SearchRecord } from './schema';

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

const related = getResolvedRelatedContentArtifact().records;
const relatedByRecordId = new Map(related.map((entry) => [entry.sourceRecordId, entry]));
const relatedByAuthoritativeSourceId = new Map<string, ResolvedRelatedEntryArtifact[]>();
for (const entry of related) {
  const entries = relatedByAuthoritativeSourceId.get(entry.authoritativeSourceId) ?? [];
  entries.push(entry);
  relatedByAuthoritativeSourceId.set(entry.authoritativeSourceId, entries);
}

function resolveSourceEntry(
  authoritativeId: string,
  preferredKinds?: readonly SearchRecord['kind'][],
): ResolvedRelatedEntryArtifact | null {
  const direct = relatedByRecordId.get(authoritativeId);
  if (direct) return direct;
  const entries = relatedByAuthoritativeSourceId.get(authoritativeId) ?? [];
  if (!entries.length) return null;
  if (preferredKinds?.length) {
    const preferred = entries.find((entry) => preferredKinds.includes(entry.sourceKind));
    if (preferred) return preferred;
  }
  return entries[0] ?? null;
}

export function getRelatedContent(
  authoritativeId: string,
  options: { limit?: number; preferredKinds?: readonly SearchRecord['kind'][] } = {},
): RelatedContentItem[] {
  const entry = resolveSourceEntry(authoritativeId, options.preferredKinds);
  if (!entry) return [];
  const limit = Math.max(1, Math.min(12, options.limit ?? 4));
  return entry.targets.slice(0, limit).map((target) => {
    const item: RelatedContentItem = {
      id: target.id,
      kind: target.kind,
      title: target.title,
      canonicalHref: target.canonicalHref,
      breadcrumb: target.breadcrumb,
      runtime: target.runtime,
      packages: target.packages,
      score: target.score,
      reasons: target.reasons,
    };
    if (target.description) item.description = target.description;
    if (target.stability) item.stability = target.stability;
    return item;
  });
}
