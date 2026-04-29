/** User-visible message from sandbox/API failures (no stacks, bounded length). */
const MAX_MSG = 600;

export function formatGalleryRunError(err: unknown): string {
  if (err instanceof Error) {
    let m = err.message.replace(/\s+/g, ' ').trim();
    if (!m) return 'Run failed.';
    if (m.length > MAX_MSG) m = `${m.slice(0, MAX_MSG - 3)}...`;
    return m;
  }
  return 'Run failed.';
}

/** Fetch abort or modal teardown — ignore (do not show error / avoid stale state). */
export function isAbortError(e: unknown): boolean {
  if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') {
    return true;
  }
  return e instanceof Error && e.name === 'AbortError';
}
