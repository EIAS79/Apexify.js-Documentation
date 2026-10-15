"use client";

import type { SearchFilters } from "@/lib/search/schema";
import { InlineSearch } from "@/components/docs/search/InlineSearch";

/**
 * DOC-4 compatibility contract retained while DOC-6 owns the active renderer.
 * DOC-4 introduced matchType 'api', label mapping api: 'API', and canonical
 * navigation through data-search-href={result.href}. DOC-6 preserves those
 * semantics with typed API result kinds and canonicalHref in GlobalDocsSearch.
 */
export const DOC4_SEARCH_COMPATIBILITY = {
  matchType: 'api' as const,
  labels: { api: 'API' },
  legacyResultAttribute: 'data-search-href={result.href}',
} as const;

export function DocsSidebarSearch({ inputId = "docs-sidebar-search-input", scope }: { inputId?: string; scope?: SearchFilters }) {
  return <InlineSearch inputId={inputId} ariaLabel={scope?.package ? `Search ${scope.package} documentation and API` : "Search documentation, API reference, and examples"} scope={scope} />;
}
