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
    for (const alias of SEARCH_SYNONYMS[term.toLowerCase()] ?? []) out.add(alias);
  }
  return [...out];
}
