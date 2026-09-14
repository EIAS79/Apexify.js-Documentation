import redirectManifest from '../../generated/docs-doc1/redirect-manifest.json';
import { resolveDoc9LegacyIdentity } from './doc9-legacy-client';

type RedirectRoute = {
  canonicalPath: string;
  legacyHashes: string[];
  aliases: string[];
};

const routes = redirectManifest.routes as RedirectRoute[];
const byIdentity = new Map<string, string>();

for (const route of routes) {
  for (const identity of [...route.legacyHashes, ...route.aliases]) {
    byIdentity.set(identity, route.canonicalPath);
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * URL fragments are browser-only. The compatibility client therefore maps
 * both DOC-1 aliases and the complete DOC-9 legacy corpus to canonical routes.
 */
export function resolveLegacyDocumentationFragment(fragment: string): string | null {
  const normalized = fragment.replace(/^#/, '');
  if (!normalized) return null;

  const queryIndex = normalized.indexOf('?');
  const rawIdentity = queryIndex >= 0 ? normalized.slice(0, queryIndex) : normalized;
  const identity = safeDecode(rawIdentity);
  const canonicalPath = byIdentity.get(identity) ?? resolveDoc9LegacyIdentity(identity);
  if (!canonicalPath) return null;

  if (queryIndex < 0) return canonicalPath;

  const params = new URLSearchParams(normalized.slice(queryIndex + 1));
  const heading = params.get('h');
  if (!heading) return canonicalPath;
  return `${canonicalPath}#${encodeURIComponent(safeDecode(heading))}`;
}

export function canonicalizeLegacyDocumentationHref(href: string): string {
  if (!href.startsWith('/docs#')) return href;
  return resolveLegacyDocumentationFragment(href.slice('/docs#'.length)) ?? href;
}

export const DEFAULT_DOCUMENTATION_PATH = redirectManifest.canonicalEntry;
