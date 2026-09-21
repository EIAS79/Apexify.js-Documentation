import type { VisualProject } from '../model';
import { validateVisualProject } from '../compiler/validate';

export type VisualCodeSyncResult =
  | { ok: true; project: VisualProject; changed: boolean }
  | { ok: false; error: string };

function extractCreateCanvasObject(source: string): string | null {
  const call = source.search(/\.createCanvas\s*\(\s*\{/);
  if (call < 0) return null;
  const open = source.indexOf('{', call);
  if (open < 0) return null;

  let depth = 0;
  let quote: string | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = open; index < source.length; index += 1) {
    const char = source[index]!;
    const next = source[index + 1] ?? '';

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  return null;
}

function numericProperty(objectSource: string, key: 'width' | 'height'): number | null {
  const match = objectSource.match(
    new RegExp('(?:^|[,\\n\\r])\\s*' + key + '\\s*:\\s*(-?\\d+(?:\\.\\d+)?)\\b'),
  );
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Safe PRE-4 reverse sync for the compiler surface that exists today.
 *
 * The current Visual compiler owns document-level createCanvas only. This
 * reconciler deliberately parses that same contract without eval/new Function.
 * Feature phases extend this module when their runtime lowering lands.
 */
export function reconcileVisualProjectFromCode(
  project: VisualProject,
  source: string,
): VisualCodeSyncResult {
  if (!/\bApexPainter\b/.test(source)) {
    return { ok: false, error: 'Code must use ApexPainter so Visual Studio can reconcile it.' };
  }

  const canvasObject = extractCreateCanvasObject(source);
  if (!canvasObject) {
    return { ok: false, error: 'Visual sync needs a painter.createCanvas({ ... }) call.' };
  }

  const width = numericProperty(canvasObject, 'width');
  const height = numericProperty(canvasObject, 'height');
  if (width === null || height === null) {
    return { ok: false, error: 'createCanvas width and height must be numeric literals for live Visual sync.' };
  }
  if (width < 1 || height < 1 || width > 16384 || height > 16384) {
    return { ok: false, error: 'Canvas width and height must be between 1 and 16384.' };
  }

  const next = structuredClone(project);
  next.document.width = Math.round(width);
  next.document.height = Math.round(height);
  next.updatedAt = new Date().toISOString();

  const validation = validateVisualProject(next);
  if (!validation.ok) {
    const issue = validation.issues.find((item) => item.severity === 'error');
    return { ok: false, error: issue?.message ?? 'The code produced an invalid Visual Project.' };
  }

  const changed =
    next.document.width !== project.document.width ||
    next.document.height !== project.document.height;

  return { ok: true, project: next, changed };
}

export function safeVisualDownloadStem(value: string): string {
  return value
    .trim()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'apexify-visual';
}
