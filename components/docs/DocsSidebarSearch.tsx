"use client";

import { InlineSearch } from "@/components/docs/search/InlineSearch";

export function DocsSidebarSearch({ inputId = "docs-sidebar-search-input" }: { inputId?: string }) {
  return <InlineSearch inputId={inputId} ariaLabel="Search documentation, API reference, and examples" />;
}
