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
    <div className="not-prose min-w-0">
      <GlobalDocsSearch inputId={inputId} compact ariaLabel={ariaLabel} fixedFilters={scope} />
      <div className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-tertiary)" }} aria-hidden>
        Symbols · options · guides
      </div>
    </div>
  );
}
