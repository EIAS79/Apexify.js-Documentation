/**
 * Old URL hashes → current MDX basename (after docs restructure).
 *
 * Canonical entry hash is `00-start-here` (matches the prefix-numbered
 * file). Older bookmarks pointing at `start-here` and `Getting-Started`
 * are aliased through and silently rewritten to the canonical hash by
 * the docs page so the URL bar stays consistent.
 */
export const DOC_FILENAME_ALIASES: Record<string, string> = {
  'start-here': '00-start-here',
  'Getting-Started': '00-start-here',
  'api-index': 'api-reference',
  /** Friendly hubs → existing topic hashes */
  'create-charts': 'charts',
  'create-gifs': 'gif-and-animation',
  'create-videos': 'video-ffmpeg',
};

/** The canonical default doc shown when no hash is in the URL. */
export const DEFAULT_DOC_FILENAME = '00-start-here';

export function resolveDocFilename(filename: string): string {
  return DOC_FILENAME_ALIASES[filename] ?? filename;
}
