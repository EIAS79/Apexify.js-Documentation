/** Old URL hashes → current MDX basename (after docs restructure). */
export const DOC_FILENAME_ALIASES: Record<string, string> = {
  'Getting-Started': 'start-here',
  'api-index': 'api-reference',
  /** Friendly hubs → existing topic hashes */
  'create-charts': 'charts',
  'create-gifs': 'gif-and-animation',
  'create-videos': 'video-ffmpeg',
};

export function resolveDocFilename(filename: string): string {
  return DOC_FILENAME_ALIASES[filename] ?? filename;
}
