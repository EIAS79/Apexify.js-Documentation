import type { VisualCanvasConfig, VisualProject } from '../model';
import { validateVisualProject } from '../compiler/validate';

export type VisualCodeSyncResult =
  | { ok: true; project: VisualProject; changed: boolean }
  | { ok: false; error: string };

type Jsonish = null | boolean | number | string | Jsonish[] | { [key: string]: Jsonish };
type RecordValue = { [key: string]: Jsonish };

const CANVAS_KEYS = new Set([
  'width','height','x','y','customBg','videoBg','colorBg','gradientBg','patternBg',
  'noiseBg','transparentBase','bgLayers','blendMode','opacity','blur','rotation',
  'borderRadius','borderPosition','zoom','stroke','shadow',
]);

class LiteralParser {
  private index = 0;
  constructor(private readonly source: string) {}

  parse(): Jsonish {
    const value = this.parseValue();
    this.skipSpace();
    if (this.index < this.source.length) {
      throw new Error('Unexpected token near “' + this.source.slice(this.index, this.index + 24) + '”.');
    }
    return value;
  }

  private parseValue(): Jsonish {
    this.skipSpace();
    const ch = this.source[this.index];
    if (ch === '{') return this.parseObject();
    if (ch === '[') return this.parseArray();
    if (ch === '"' || ch === "'" || ch === '`') return this.parseString();
    if (ch === '-' || ch === '+' || /[0-9.]/.test(ch ?? '')) return this.parseNumber();

    const id = this.parseIdentifier();
    if (id === 'true') return true;
    if (id === 'false') return false;
    if (id === 'null' || id === 'undefined') return null;
    throw new Error(id ? 'Dynamic expression “' + id + '” cannot be reconciled into Visual mode.' : 'Expected a literal value.');
  }

  private parseObject(): RecordValue {
    const out: RecordValue = {};
    this.expect('{');
    this.skipSpace();
    while (this.source[this.index] !== '}') {
      const ch = this.source[this.index];
      const key = ch === '"' || ch === "'" || ch === '`'
        ? this.parseString()
        : this.parseIdentifier();
      if (!key) throw new Error('Expected an object property name.');
      this.skipSpace();
      this.expect(':');
      out[key] = this.parseValue();
      this.skipSpace();
      if (this.source[this.index] === ',') {
        this.index += 1;
        this.skipSpace();
        if (this.source[this.index] === '}') break;
        continue;
      }
      break;
    }
    this.expect('}');
    return out;
  }

  private parseArray(): Jsonish[] {
    const out: Jsonish[] = [];
    this.expect('[');
    this.skipSpace();
    while (this.source[this.index] !== ']') {
      out.push(this.parseValue());
      this.skipSpace();
      if (this.source[this.index] === ',') {
        this.index += 1;
        this.skipSpace();
        if (this.source[this.index] === ']') break;
        continue;
      }
      break;
    }
    this.expect(']');
    return out;
  }

  private parseString(): string {
    const quote = this.source[this.index++];
    let out = '';
    while (this.index < this.source.length) {
      const ch = this.source[this.index++];
      if (ch === quote) return out;
      if (quote === '`' && ch === '$' && this.source[this.index] === '{') {
        throw new Error('Template expressions cannot be reconciled into Visual mode.');
      }
      if (ch !== '\\') {
        out += ch;
        continue;
      }
      const next = this.source[this.index++];
      const escapes: Record<string, string> = {
        n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v',
        '0': '\0', '\\': '\\', '"': '"', "'": "'", '`': '`',
      };
      out += escapes[next] ?? next;
    }
    throw new Error('Unterminated string literal.');
  }

  private parseNumber(): number {
    const match = this.source.slice(this.index).match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (!match) throw new Error('Invalid numeric literal.');
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new Error('Numeric literal must be finite.');
    return value;
  }

  private parseIdentifier(): string {
    this.skipSpace();
    const match = this.source.slice(this.index).match(/^[A-Za-z_$][\w$-]*/);
    if (!match) return '';
    this.index += match[0].length;
    return match[0];
  }

  private skipSpace() {
    while (this.index < this.source.length) {
      const ch = this.source[this.index];
      const next = this.source[this.index + 1];
      if (/\s/.test(ch)) {
        this.index += 1;
        continue;
      }
      if (ch === '/' && next === '/') {
        this.index += 2;
        while (this.index < this.source.length && this.source[this.index] !== '\n') this.index += 1;
        continue;
      }
      if (ch === '/' && next === '*') {
        this.index += 2;
        while (this.index < this.source.length - 1 &&
          !(this.source[this.index] === '*' && this.source[this.index + 1] === '/')) this.index += 1;
        this.index += 2;
        continue;
      }
      break;
    }
  }

  private expect(ch: string) {
    this.skipSpace();
    if (this.source[this.index] !== ch) {
      throw new Error('Expected “' + ch + '” near “' + this.source.slice(this.index, this.index + 20) + '”.');
    }
    this.index += 1;
  }
}

function isRecord(value: Jsonish): value is RecordValue {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

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
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
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
      if (depth === 0) return source.slice(open, index + 1);
    }
  }
  return null;
}

function parseCanvasOptions(source: string): RecordValue {
  const objectSource = extractCreateCanvasObject(source);
  if (!objectSource) throw new Error('Visual sync needs a painter.createCanvas({ ... }) call.');
  const parsed = new LiteralParser(objectSource).parse();
  if (!isRecord(parsed)) throw new Error('createCanvas options must be an object literal.');
  for (const key of Object.keys(parsed)) {
    if (!CANVAS_KEYS.has(key)) {
      throw new Error('createCanvas option “' + key + '” is not owned by the current Visual canvas contract.');
    }
  }
  return parsed;
}

function serializeCanvasConfig(value: RecordValue): VisualCanvasConfig {
  const {
    width: _width,
    height: _height,
    ...canvas
  } = value;
  return canvas as unknown as VisualCanvasConfig;
}

/**
 * Safe linked-code reverse sync for the deterministic createCanvas contract.
 * Literal canonical CanvasConfig is parsed without eval/new Function. Dynamic
 * expressions stay editable in Code but surface a sync error until normalized.
 */
export function reconcileVisualProjectFromCode(
  project: VisualProject,
  source: string,
): VisualCodeSyncResult {
  if (!/\bApexPainter\b/.test(source)) {
    return { ok: false, error: 'Code must use ApexPainter so Visual Studio can reconcile it.' };
  }

  try {
    const options = parseCanvasOptions(source);
    const width = options.width;
    const height = options.height;
    if (typeof width !== 'number' || typeof height !== 'number') {
      return { ok: false, error: 'createCanvas width and height must be numeric literals for live Visual sync.' };
    }
    if (width < 1 || height < 1 || width > 16384 || height > 16384) {
      return { ok: false, error: 'Canvas width and height must be between 1 and 16384.' };
    }

    const next = structuredClone(project);
    next.document.width = Math.round(width);
    next.document.height = Math.round(height);
    const canvas = serializeCanvasConfig(options);
    next.document.canvas = Object.keys(canvas).length ? canvas : undefined;
    next.updatedAt = new Date().toISOString();

    const validation = validateVisualProject(next);
    if (!validation.ok) {
      const issue = validation.issues.find((item) => item.severity === 'error');
      return { ok: false, error: issue?.message ?? 'The code produced an invalid Visual Project.' };
    }

    const changed =
      next.document.width !== project.document.width ||
      next.document.height !== project.document.height ||
      JSON.stringify(next.document.canvas ?? {}) !== JSON.stringify(project.document.canvas ?? {});

    return { ok: true, project: next, changed };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Canvas code could not be reconciled.',
    };
  }
}

export function safeVisualDownloadStem(value: string): string {
  return value
    .trim()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'apexify-visual';
}
