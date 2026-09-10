'use client';

import { useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function visibleSearchInput(): HTMLInputElement | null {
  return Array.from(document.querySelectorAll<HTMLInputElement>('[data-docs-search-input]'))
    .find((input) => input.offsetParent !== null) ?? null;
}

export function DocsSearchTrigger() {
  const focusSearch = () => {
    const input = visibleSearchInput();
    if (input) {
      input.focus();
      return;
    }
    window.dispatchEvent(new Event('apx-open-docs-nav'));
    window.setTimeout(() => visibleSearchInput()?.focus(), 100);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <button type="button" className="apx-icon-button" aria-label="Search documentation" title="Search documentation (Ctrl/⌘ K)" onClick={focusSearch}>
      <MagnifyingGlassIcon className="h-5 w-5" aria-hidden />
    </button>
  );
}
