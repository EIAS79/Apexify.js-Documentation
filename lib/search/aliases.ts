/**
 * Search-only synonyms are intentionally small and limited to established Apexify/user terms.
 * Canonical records remain owned by DOC-1/DOC-4/DOC-5 manifests.
 */
export const SEARCH_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  canvas: ['surface', 'drawing surface'],
  image: ['picture', 'graphic'],
  chart: ['graph', 'data visualization', 'visualization'],
  gif: ['animated image', 'animation'],
  save: ['export', 'output'],
  create: ['make', 'build'],
  resize: ['scale', 'dimensions'],
};

export function expandSearchAliases(terms: readonly string[]): string[] {
  const out = new Set<string>();
  for (const term of terms) {
    out.add(term);
    const key = term.toLowerCase();
    const aliases = Object.prototype.hasOwnProperty.call(SEARCH_SYNONYMS, key)
      ? SEARCH_SYNONYMS[key]
      : undefined;
    for (const alias of aliases ?? []) out.add(alias);
  }
  return [...out];
}
