'use client';

import { useCallback, useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SearchCommandPalette } from '@/components/docs/search/SearchCommandPalette';

export function DocsSearchTrigger() {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch]);

  return (
    <>
      <button
        type="button"
        className="apx-icon-button"
        aria-label="Search documentation"
        title="Search documentation (Ctrl/⌘ K)"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSearch}
      >
        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden />
      </button>
      <SearchCommandPalette open={open} onClose={closeSearch} />
    </>
  );
}
