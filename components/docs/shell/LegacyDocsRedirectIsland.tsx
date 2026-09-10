'use client';

import { useEffect } from 'react';
import {
  DEFAULT_DOCUMENTATION_PATH,
  resolveLegacyDocumentationFragment,
} from '@/lib/docs/legacy-routing';

export function LegacyDocsRedirectIsland() {
  useEffect(() => {
    if (window.location.pathname !== '/docs') return;
    const canonicalize = () => {
      if (window.location.pathname !== '/docs') return;
      const fragment = window.location.hash.slice(1);
      const target = fragment
        ? resolveLegacyDocumentationFragment(fragment)
        : DEFAULT_DOCUMENTATION_PATH;
      if (target) window.location.replace(target);
    };
    canonicalize();
    window.addEventListener('hashchange', canonicalize);
    return () => window.removeEventListener('hashchange', canonicalize);
  }, []);
  return null;
}
