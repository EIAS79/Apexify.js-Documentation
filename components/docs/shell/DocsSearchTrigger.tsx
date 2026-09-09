'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function DocsSearchTrigger() {
  const focusSearch = () => {
    const input = document.getElementById('docs-sidebar-search-input') as HTMLInputElement | null;
    if (input && input.offsetParent !== null) {
      input.focus();
      return;
    }
    window.dispatchEvent(new Event('apx-open-docs-nav'));
    window.setTimeout(() => document.getElementById('docs-sidebar-search-input')?.focus(), 80);
  };

  return (
    <button type="button" className="apx-icon-button" aria-label="Search documentation" title="Search documentation" onClick={focusSearch}>
      <MagnifyingGlassIcon className="h-5 w-5" aria-hidden />
    </button>
  );
}
