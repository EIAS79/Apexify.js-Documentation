import { resolveDoc9LegacyIdentity } from './doc9-legacy-client';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function canonicalizeDoc9LegacyHref(href: string): string {
  if (!href.startsWith('/docs#')) return href;
  const fragment = href.slice('/docs#'.length);
  const queryIndex = fragment.indexOf('?');
  const identity = safeDecode(queryIndex >= 0 ? fragment.slice(0, queryIndex) : fragment);
  const target = resolveDoc9LegacyIdentity(identity);
  if (!target) return href;
  if (queryIndex < 0) return target;
  const params = new URLSearchParams(fragment.slice(queryIndex + 1));
  const heading = params.get('h');
  return heading ? `${target}#${encodeURIComponent(safeDecode(heading))}` : target;
}

/**
 * Preserve authored prose while ensuring the active routed/search corpus no
 * longer emits legacy hash-only internal links. Compatibility source syntax is
 * retained in git for migration audit and content-loss review.
 */
export function canonicalizeDoc9BodyLinks(body: string): string {
  const markdown = body.replace(/\]\((\/docs#[^)]+)\)/g, (_match, href: string) => `](${canonicalizeDoc9LegacyHref(href)})`);
  return markdown.replace(/href=(['"])(\/docs#[^'"]+)\1/g, (_match, quote: string, href: string) => `href=${quote}${canonicalizeDoc9LegacyHref(href)}${quote}`);
}
