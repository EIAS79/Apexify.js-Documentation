import { NextRequest, NextResponse } from "next/server";
import recordsJson from "@/generated/docs-doc6/search-records.json";
import indexJson from "@/generated/docs-doc6/search-index-manifest.json";
import { getSearchFilterOptions, searchRecords } from "@/lib/search/query";
import { SEARCH_SCHEMA_VERSION, type SearchIndexArtifact, type SearchRecord, type SearchResponse, type SearchResult, type RankedSearchRecord } from "@/lib/search/schema";

const recordsArtifact = recordsJson as { schemaVersion: number; sourceChecksum: string; records: SearchRecord[] };
const indexArtifact = indexJson as SearchIndexArtifact;

if (recordsArtifact.schemaVersion !== SEARCH_SCHEMA_VERSION || indexArtifact.schemaVersion !== SEARCH_SCHEMA_VERSION) {
  throw new Error("[doc6-search] generated search schema mismatch; rebuild DOC-6 artifacts");
}
if (recordsArtifact.sourceChecksum !== indexArtifact.sourceChecksum) {
  throw new Error("[doc6-search] generated search artifacts are stale/inconsistent");
}
if (recordsArtifact.records.length !== indexArtifact.recordCount) {
  throw new Error("[doc6-search] generated record/index count mismatch");
}

const availableFilters = getSearchFilterOptions(recordsArtifact.records);

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const filters = {
    runtime: request.nextUrl.searchParams.get("runtime") || undefined,
    package: request.nextUrl.searchParams.get("package") || undefined,
    kind: request.nextUrl.searchParams.get("kind") || undefined,
    stability: request.nextUrl.searchParams.get("stability") || undefined,
    version: request.nextUrl.searchParams.get("version") || undefined,
    domain: request.nextUrl.searchParams.get("domain") || undefined,
  };
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 30);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 30;

  if (!query || query === "*") {
    const payload: SearchResponse = {
      schemaVersion: SEARCH_SCHEMA_VERSION,
      query: query === "*" ? "" : query,
      results: [],
      total: 0,
      unfilteredTotal: 0,
      filteredOut: false,
      filters: availableFilters,
    };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  }

  const outcome = searchRecords(indexArtifact, recordsArtifact.records, query, filters, limit);
  type CompatibleResult = SearchResult & { filename: string; name: string; folder: string; matchType: string };
  const results: CompatibleResult[] = outcome.results.map((result: RankedSearchRecord) => ({
    id: result.id,
    kind: result.kind,
    title: result.title,
    description: result.description,
    excerpt: result.excerpt,
    canonicalHref: result.canonicalHref,
    breadcrumb: result.breadcrumb,
    runtime: result.runtime,
    packages: result.packages,
    stability: result.stability,
    version: result.version,
    domain: result.domain,
    symbol: result.symbol,
    optionPath: result.optionPath,
    typeName: result.typeName,
    errorCode: result.errorCode,
    score: result.score,
    matchReason: result.matchReason,
    // Temporary compatibility fields for any pre-DOC-6 consumer not yet migrated.
    filename: result.sourceId,
    name: result.title,
    folder: result.breadcrumb.join(" / "),
    matchType: result.kind.startsWith("api-") || result.kind === "error" ? "api" : result.kind === "heading" ? "folder" : result.kind === "doc" ? "filename" : "content",
  }));
  const payload: SearchResponse & { results: CompatibleResult[] } = {
    schemaVersion: SEARCH_SCHEMA_VERSION,
    query,
    results,
    total: outcome.results.length,
    unfilteredTotal: outcome.unfilteredTotal,
    filteredOut: outcome.filteredOut,
    filters: availableFilters,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
      "X-Apexify-Search-Schema": String(SEARCH_SCHEMA_VERSION),
    },
  });
}
