"use client";

import { GlobalDocsSearch } from "./GlobalDocsSearch";
import type { SearchFilters } from "@/lib/search/schema";

export function InlineSearch({
  inputId = "docs-inline-search-input",
  ariaLabel = "Search this documentation corpus",
  scope,
}: {
  inputId?: string;
  ariaLabel?: string;
  scope?: SearchFilters;
}) {
  return (
    <div
      className="not-prose mb-3 min-w-0 overflow-hidden rounded-xl p-2"
      style={{
        background: "color-mix(in srgb, var(--bg-sunken) 55%, transparent)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <GlobalDocsSearch inputId={inputId} compact ariaLabel={ariaLabel} fixedFilters={scope} />
      <p className="px-1 pt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
        Uses the same build-time search index and ranking as global search.
      </p>
    </div>
  );
}
