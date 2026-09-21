let fallbackCounter = 0;

const ID_PART = /[^a-z0-9_-]+/gi;

export function sanitizeVisualIdPart(value: string, fallback = 'item'): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(ID_PART, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return cleaned || fallback;
}

export function createVisualId(prefix = 'visual'): string {
  const safePrefix = sanitizeVisualIdPart(prefix, 'visual');
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${safePrefix}_${uuid}`;
  fallbackCounter += 1;
  return `${safePrefix}_${Date.now().toString(36)}_${fallbackCounter.toString(36)}`;
}

export function isStableVisualId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 160 && /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(value);
}
