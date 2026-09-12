import { NextRequest, NextResponse } from "next/server";
import { getSearchArtifacts } from "@/lib/search/server-data";
import { getSearchFilterOptions, searchRecords } from "@/lib/search/query";
import { SEARCH_SCHEMA_VERSION, type SearchResponse, type SearchResult, type RankedSearchRecord } from "@/lib/search/schema";

export const runtime = 'nodejs';

// Generated DOC-6 artifacts are fixed files loaded and cached by the server-data module.
// The request hot path never traverses content/docs or reparses MDX sources.
const { recordsArtifact, indexArtifact } = getSearchArtifacts();
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
