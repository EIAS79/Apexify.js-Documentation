'use client';

import { createSafePreviewResolver, isUnresolvedPreviewValue } from './safePreviewExpression';

type Jsonish = null | boolean | number | string | Jsonish[] | { [key: string]: Jsonish };
type RecordValue = { [key: string]: Jsonish };

export type BrowserStudioResult =
  | {
      ok: true;
      dataUrl: string;
      mime: 'image/png';
      elapsedMs: number;
      supportedApis: string[];
      warnings: string[];
    }
  | {
      ok: false;
      elapsedMs: number;
      error: string;
      supportedApis: string[];
    };

const SHAPES = new Set([
  'rectangle',
  'square',
  'circle',
  'triangle',
  'trapezium',
  'star',
  'heart',
  'polygon',
  'arc',
  'pieSlice',
]);

const MAX_REMOTE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REMOTE_IMAGE_PIXELS = 12_000_000;
const MAX_REMOTE_IMAGE_COUNT = 8;
const REMOTE_IMAGE_TIMEOUT_MS = 8_000;

const UNSUPPORTED_APIS = [
  'createChart',
  'createComparisonChart',
  'createComboChart',
  'createScene',
  'renderScene',
  'createTemplate',
  'createGIF',
  'animate',
  'createVideo',
  'videoPipeline',
  'createAudio',
  'batch',
  'chain',
];

class LiteralParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): Jsonish {
    const value = this.parseValue();
    this.skipSpace();
    if (this.index < this.source.length) {
      throw new Error(`Unexpected token near “${this.source.slice(this.index, this.index + 24)}”.`);
    }
    return value;
  }

  private parseValue(): Jsonish {
    this.skipSpace();
    const ch = this.source[this.index];

    if (ch === '{') return this.parseObject();
    if (ch === '[') return this.parseArray();
    if (ch === '"' || ch === "'" || ch === '`') return this.parseString();

    if (ch === '-' || ch === '+' || /[0-9.]/.test(ch ?? '')) {
      return this.parseNumber();
    }

    const id = this.parseIdentifier();
    if (id === 'true') return true;
    if (id === 'false') return false;
    if (id === 'null' || id === 'undefined') return null;

    throw new Error(
      id
        ? `Live Canvas could not resolve the expression “${id}” in this preview.`
        : 'Live Canvas could not parse this Apexify options object.',
    );
  }

  private parseObject(): RecordValue {
    const out: RecordValue = {};
    this.expect('{');
    this.skipSpace();

    while (this.source[this.index] !== '}') {
      let key: string;
      const ch = this.source[this.index];
      if (ch === '"' || ch === "'" || ch === '`') {
        const parsed = this.parseString();
        key = String(parsed);
      } else {
        key = this.parseIdentifier();
      }

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
        throw new Error('Template expressions are not supported in Live Canvas literals.');
      }

      if (ch !== '\\') {
        out += ch;
        continue;
      }

      const next = this.source[this.index++];
      const escapes: Record<string, string> = {
        n: '\n',
        r: '\r',
        t: '\t',
        b: '\b',
        f: '\f',
        v: '\v',
        '0': '\0',
        '\\': '\\',
        '"': '"',
        "'": "'",
        '`': '`',
      };
      out += escapes[next] ?? next;
    }

    throw new Error('Unterminated string literal.');
  }

  private parseNumber(): number {
    const rest = this.source.slice(this.index);
    const match = rest.match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (!match) throw new Error('Invalid numeric literal.');
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new Error('Numeric literal must be finite.');
    return value;
  }

  private parseIdentifier(): string {
    this.skipSpace();
    const rest = this.source.slice(this.index);
    const match = rest.match(/^[A-Za-z_$][\w$-]*/);
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
        while (
          this.index < this.source.length - 1 &&
          !(this.source[this.index] === '*' && this.source[this.index + 1] === '/')
        ) {
          this.index += 1;
        }
        this.index += 2;
        continue;
      }

      break;
    }
  }

  private expect(ch: string) {
    this.skipSpace();
    if (this.source[this.index] !== ch) {
      throw new Error(`Expected “${ch}” near “${this.source.slice(this.index, this.index + 20)}”.`);
    }
    this.index += 1;
  }
}

function isRecord(value: Jsonish | undefined): value is RecordValue {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function numberOf(value: Jsonish | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringOf(value: Jsonish | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function boolOf(value: Jsonish | undefined, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

type Call = { method: string; index: number; args: string[] };

function extractCalls(source: string, methods: string[]): Call[] {
  const calls: Call[] = [];

  for (const method of methods) {
    const re = new RegExp(`\\.\\s*${method}\\s*\\(`, 'g');
    let match: RegExpExecArray | null;

    while ((match = re.exec(source))) {
      const open = source.indexOf('(', match.index);
      if (open < 0) continue;
      const parsed = readCallArguments(source, open);
      if (!parsed) continue;
      calls.push({ method, index: match.index, args: parsed.args });
      re.lastIndex = parsed.end + 1;
    }
  }

  return calls.sort((a, b) => a.index - b.index);
}

function readCallArguments(source: string, openParen: number): { args: string[]; end: number } | null {
  const args: string[] = [];
  let start = openParen + 1;
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let quote: string | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openParen + 1; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '/' && next === '/') {
      lineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '(') depthParen += 1;
    else if (ch === ')') {
      if (depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
        const final = source.slice(start, i).trim();
        if (final) args.push(final);
        return { args, end: i };
      }
      depthParen -= 1;
    } else if (ch === '{') depthBrace += 1;
    else if (ch === '}') depthBrace -= 1;
    else if (ch === '[') depthBracket += 1;
    else if (ch === ']') depthBracket -= 1;
    else if (ch === ',' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      args.push(source.slice(start, i).trim());
      start = i + 1;
    }
  }

  return null;
}

function parseLiteral(source: string): Jsonish {
  return new LiteralParser(source).parse();
}

function hasUnresolved(value: Jsonish): boolean {
  if (isUnresolvedPreviewValue(value)) return true;
  if (Array.isArray(value)) return value.some(hasUnresolved);
  if (isRecord(value)) return Object.values(value).some(hasUnresolved);
  return false;
}

function createGradient(
  ctx: CanvasRenderingContext2D,
  config: RecordValue,
  width: number,
  height: number,
): CanvasGradient {
  const type = stringOf(config.type, 'linear');
  let gradient: CanvasGradient;

  if (type === 'radial') {
    gradient = ctx.createRadialGradient(
      numberOf(config.startX, width / 2),
      numberOf(config.startY, height / 2),
      Math.max(0, numberOf(config.startRadius, 0)),
      numberOf(config.endX, width / 2),
      numberOf(config.endY, height / 2),
      Math.max(1, numberOf(config.endRadius, Math.max(width, height) / 2)),
    );
  } else {
    const angle = numberOf(config.rotate, Number.NaN);
    if (Number.isFinite(angle)) {
      const radians = (angle * Math.PI) / 180;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
      const dx = Math.cos(radians) * radius * 0.5;
      const dy = Math.sin(radians) * radius * 0.5;
      gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    } else {
      gradient = ctx.createLinearGradient(
        numberOf(config.startX, 0),
        numberOf(config.startY, 0),
        numberOf(config.endX, width),
        numberOf(config.endY, height),
      );
    }
  }

  const colors = Array.isArray(config.colors) ? config.colors : [];
  if (colors.length === 0) {
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(1, '#334155');
    return gradient;
  }

  for (const stop of colors) {
    if (!isRecord(stop)) continue;
    gradient.addColorStop(
      Math.min(1, Math.max(0, numberOf(stop.stop, 0))),
      stringOf(stop.color, '#ffffff'),
    );
  }

  return gradient;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(Math.max(0, radius), width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function applyBackground(
  ctx: CanvasRenderingContext2D,
  config: RecordValue,
  width: number,
  height: number,
) {
  if (!boolOf(config.transparentBase, false)) {
    ctx.fillStyle = stringOf(config.colorBg, '#ffffff');
    ctx.fillRect(0, 0, width, height);
  }

  if (isRecord(config.gradientBg)) {
    ctx.fillStyle = createGradient(ctx, config.gradientBg, width, height);
    ctx.fillRect(0, 0, width, height);
  }

  const layers = Array.isArray(config.bgLayers) ? config.bgLayers : [];
  for (const layer of layers) {
    if (!isRecord(layer)) continue;

    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, numberOf(layer.opacity, 1)));
    const blend = stringOf(layer.blendMode, 'source-over');
    try {
      ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
    } catch {
      ctx.globalCompositeOperation = 'source-over';
    }

    const type = stringOf(layer.type, '');
    if (type === 'gradient' && isRecord(layer.value)) {
      ctx.fillStyle = createGradient(ctx, layer.value, width, height);
      ctx.fillRect(0, 0, width, height);
    } else if (type === 'presetPattern' && isRecord(layer.pattern)) {
      drawPattern(ctx, layer.pattern, width, height);
    }
    ctx.restore();
  }

  if (isRecord(config.patternBg)) {
    ctx.save();
    applyBlendMode(ctx, config.patternBg.blendMode);
    drawPattern(ctx, config.patternBg, width, height);
    ctx.restore();
  }

  if (isRecord(config.noiseBg)) {
    const intensity = Math.min(0.12, Math.max(0, numberOf(config.noiseBg.intensity, 0)));
    if (intensity > 0) drawNoise(ctx, width, height, intensity);
  }

  if (isRecord(config.canvasStroke)) {
    const stroke = config.canvasStroke;
    const lineWidth = Math.max(1, numberOf(stroke.width, 1));
    ctx.save();
    ctx.strokeStyle = stringOf(stroke.color, '#ffffff');
    ctx.lineWidth = lineWidth;
    const radius = numberOf(config.borderRadius, 0);
    drawRoundedRect(ctx, lineWidth / 2, lineWidth / 2, width - lineWidth, height - lineWidth, radius);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  pattern: RecordValue,
  width: number,
  height: number,
) {
  const type = stringOf(pattern.type, 'grid');
  const color = stringOf(pattern.color, 'rgba(255,255,255,.16)');
  const secondary = stringOf(pattern.secondaryColor, color);
  const spacing = Math.max(4, numberOf(pattern.spacing, 24));
  const size = Math.max(1, numberOf(pattern.size, 2));

  ctx.save();
  ctx.globalAlpha *= Math.min(1, Math.max(0, numberOf(pattern.opacity, 1)));
  const rotation = (numberOf(pattern.rotation, 0) * Math.PI) / 180;
  if (rotation) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.translate(-width / 2, -height / 2);
  }

  if (type === 'dots') {
    ctx.fillStyle = color;
    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === 'hexagons') {
    const radius = Math.max(3, size);
    const stepX = Math.max(radius * 1.5 + spacing, 6);
    const stepY = Math.max(Math.sqrt(3) * radius + spacing, 6);
    ctx.lineWidth = Math.max(0.5, radius / 7);
    let row = 0;
    for (let y = -stepY; y <= height + stepY; y += stepY, row += 1) {
      for (let x = -stepX; x <= width + stepX; x += stepX) {
        const cx = x + (row % 2 ? stepX / 2 : 0);
        ctx.strokeStyle = row % 2 ? secondary : color;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = Math.PI / 3 * i;
          const px = cx + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else {
    ctx.lineWidth = Math.max(0.5, size / 3);
    for (let x = 0; x <= width; x += spacing) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += spacing) {
      ctx.strokeStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawNoise(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${intensity})`;
  let seed = 173;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const count = Math.min(5000, Math.round((width * height) / 180));
  for (let i = 0; i < count; i += 1) {
    const x = Math.floor(next() * width);
    const y = Math.floor(next() * height);
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function applyShadow(ctx: CanvasRenderingContext2D, value: Jsonish | undefined) {
  if (!isRecord(value)) return;
  ctx.shadowColor = stringOf(value.color, 'rgba(0,0,0,0)');
  ctx.shadowBlur = Math.max(0, numberOf(value.blur, 0));
  ctx.shadowOffsetX = numberOf(value.offsetX, 0);
  ctx.shadowOffsetY = numberOf(value.offsetY, 0);
}

function applyBlendMode(ctx: CanvasRenderingContext2D, value: Jsonish | undefined) {
  if (typeof value !== 'string' || !value) return;
  try {
    ctx.globalCompositeOperation = value as GlobalCompositeOperation;
  } catch {
    ctx.globalCompositeOperation = 'source-over';
  }
}

function applyText(ctx: CanvasRenderingContext2D, value: Jsonish) {
  const list = Array.isArray(value) ? value : [value];

  for (const item of list) {
    if (!isRecord(item)) continue;
    const font = isRecord(item.font) ? item.font : {};
    const fill = isRecord(item.fill) ? item.fill : {};
    const stroke = isRecord(item.stroke) ? item.stroke : {};
    const placement = isRecord(item.placement) ? item.placement : {};

    const size = Math.max(1, numberOf(font.size, 32));
    const family = stringOf(font.family, 'Arial');
    const weight =
      typeof font.weight === 'number'
        ? String(font.weight)
        : boolOf(item.bold, false)
          ? '700'
          : stringOf(font.weight, '400');
    const style = boolOf(item.italic, false) ? 'italic' : stringOf(font.style, 'normal');
    const x = numberOf(item.x, 0);
    const y = numberOf(item.y, 0);
    const rotation = (numberOf(item.rotation, 0) * Math.PI) / 180;

    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, numberOf(item.opacity, 1)));
    applyBlendMode(ctx, item.blendMode);
    applyShadow(ctx, item.shadow);

    if (isRecord(item.gradient)) {
      ctx.fillStyle = createGradient(
        ctx,
        item.gradient,
        Math.max(1, numberOf(item.maxWidth, size * 12)),
        size * 2,
      );
    } else {
      ctx.fillStyle = stringOf(fill.color, stringOf(item.color, '#ffffff'));
    }

    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    ctx.textAlign = stringOf(
      item.textAlign,
      stringOf(placement.textAlign, 'left'),
    ) as CanvasTextAlign;
    ctx.textBaseline = stringOf(
      item.textBaseline,
      stringOf(placement.textBaseline, 'alphabetic'),
    ) as CanvasTextBaseline;

    const text = stringOf(item.text, '');
    const maxWidth = numberOf(item.maxWidth, 0);
    const lineHeight = Math.max(0.8, numberOf(item.lineHeight, 1.2));
    const explicitLines = text.split('\n');

    if (maxWidth > 0) {
      const rendered: string[] = [];
      for (const explicitLine of explicitLines) {
        const words = explicitLine.split(/\s+/).filter(Boolean);
        if (!words.length) {
          rendered.push('');
          continue;
        }
        let line = words[0];
        for (let wordIndex = 1; wordIndex < words.length; wordIndex += 1) {
          const candidate = line + ' ' + words[wordIndex];
          if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
          else {
            rendered.push(line);
            line = words[wordIndex];
          }
        }
        rendered.push(line);
      }
      rendered.forEach((line, lineIndex) => ctx.fillText(line, 0, lineIndex * size * lineHeight));
    } else {
      explicitLines.forEach((line, lineIndex) => ctx.fillText(line, 0, lineIndex * size * lineHeight));
    }

    const strokeWidth = numberOf(stroke.width, 0);
    if (strokeWidth > 0) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = stringOf(stroke.color, '#000000');
      if (maxWidth > 0) ctx.strokeText(text, 0, 0, maxWidth);
      else ctx.strokeText(text, 0, 0);
    }

    ctx.restore();
  }
}

function applyImageShapes(ctx: CanvasRenderingContext2D, value: Jsonish) {
  const list = Array.isArray(value) ? value : [value];

  for (const item of list) {
    if (!isRecord(item)) continue;
    const source = stringOf(item.source, '');
    if (!SHAPES.has(source)) continue;

    const shape = isRecord(item.shape) ? item.shape : {};
    const stroke = isRecord(item.stroke) ? item.stroke : {};
    const width = Math.max(1, numberOf(item.width, 100));
    const height = Math.max(1, numberOf(item.height, source === 'square' ? width : 100));
    const x = numberOf(item.x, 0);
    const y = numberOf(item.y, 0);
    const rotation = (numberOf(item.rotation, 0) * Math.PI) / 180;

    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.max(0, numberOf(item.opacity, 1)));
    applyBlendMode(ctx, item.blendMode);
    applyShadow(ctx, item.shadow);
    ctx.translate(x + width / 2, y + height / 2);
    if (rotation) ctx.rotate(rotation);
    ctx.translate(-width / 2, -height / 2);

    ctx.beginPath();

    if (source === 'circle') {
      const radius = numberOf(shape.radius, Math.min(width, height) / 2);
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    } else if (source === 'triangle') {
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
    } else if (source === 'trapezium') {
      const topWidth = width * 0.6;
      const topOffset = (width - topWidth) / 2;
      ctx.moveTo(topOffset, 0);
      ctx.lineTo(topOffset + topWidth, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
    } else if (source === 'star') {
      const outer = numberOf(shape.outerRadius, Math.min(width, height) / 2);
      const inner = numberOf(shape.innerRadius, outer * 0.4);
      const points = 5;
      for (let i = 0; i < points * 2; i += 1) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const px = width / 2 + Math.cos(angle) * radius;
        const py = height / 2 + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (source === 'heart') {
      ctx.moveTo(width / 2, height * 0.9);
      ctx.bezierCurveTo(width * 0.35, height * 0.6, width * 0.1, height * 0.55, width * 0.1, height * 0.3333);
      ctx.bezierCurveTo(width * 0.1, height * 0.1, width * 0.5, height * 0.05, width * 0.5, height * 0.3333);
      ctx.bezierCurveTo(width * 0.5, height * 0.05, width * 0.9, height * 0.1, width * 0.9, height * 0.3333);
      ctx.bezierCurveTo(width * 0.9, height * 0.55, width * 0.65, height * 0.6, width / 2, height * 0.9);
      ctx.closePath();
    } else if (source === 'polygon') {
      const rawPoints = Array.isArray(shape.points) ? shape.points : [];
      const points = rawPoints.filter(isRecord);

      if (points.length > 0) {
        const first = points[0];
        ctx.moveTo(numberOf(first.x, x) - x, numberOf(first.y, y) - y);
        for (let i = 1; i < points.length; i += 1) {
          ctx.lineTo(numberOf(points[i].x, x) - x, numberOf(points[i].y, y) - y);
        }
        ctx.closePath();
      } else {
        const sides = Math.max(3, Math.round(numberOf(shape.sides, 6)));
        const radius = Math.min(width, height) / 2;
        for (let i = 0; i < sides; i += 1) {
          const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
          const px = width / 2 + Math.cos(angle) * radius;
          const py = height / 2 + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      }
    } else if (source === 'arc' || source === 'pieSlice') {
      const centerX = numberOf(shape.centerX, x + width / 2) - x;
      const centerY = numberOf(shape.centerY, y + height / 2) - y;
      const outerRadius = numberOf(
        shape.radius,
        numberOf(shape.outerRadius, Math.min(width, height) / 2),
      );
      const innerRadius = Math.max(0, numberOf(shape.innerRadius, 0));
      const startAngle = numberOf(shape.startAngle, 0);
      const endAngle = numberOf(shape.endAngle, Math.PI * 2);

      if (innerRadius > 0) {
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.lineTo(
          centerX + innerRadius * Math.cos(endAngle),
          centerY + innerRadius * Math.sin(endAngle),
        );
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();
      } else {
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
      }
    } else {
      const strokeRadius = isRecord(stroke) ? stroke.borderRadius : undefined;
      const radius =
        item.borderRadius === 'circular' || strokeRadius === 'circular'
          ? Math.min(width, height) / 2
          : numberOf(item.borderRadius, numberOf(strokeRadius, 0));
      const drawHeight = source === 'square' ? width : height;
      drawRoundedRect(ctx, 0, 0, width, drawHeight, radius);
    }

    if (isRecord(shape.gradient)) {
      ctx.fillStyle = createGradient(ctx, shape.gradient, width, height);
    } else {
      ctx.fillStyle = stringOf(shape.color, '#6f86ff');
    }

    if (boolOf(shape.fill, true)) ctx.fill();

    const strokeWidth = numberOf(stroke.width, 0);
    if (strokeWidth > 0) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = stringOf(stroke.color, '#ffffff');
      ctx.stroke();
    }

    ctx.restore();
  }
}

function remoteImageSource(source: string): boolean {
  return /^https?:\/\//i.test(source);
}

function remoteImageHost(source: string): string {
  try {
    return new URL(source).hostname || 'remote host';
  } catch {
    return 'remote host';
  }
}

function alignedImageOffset(
  align: string,
  outerWidth: number,
  outerHeight: number,
  drawWidth: number,
  drawHeight: number,
) {
  let x = (outerWidth - drawWidth) / 2;
  let y = (outerHeight - drawHeight) / 2;

  if (align.includes('left')) x = 0;
  else if (align.includes('right')) x = outerWidth - drawWidth;

  if (align.includes('top')) y = 0;
  else if (align.includes('bottom')) y = outerHeight - drawHeight;

  return { x, y };
}

async function fetchRemoteImageBitmap(source: string): Promise<ImageBitmap> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REMOTE_IMAGE_TIMEOUT_MS);

  try {
    const response = await fetch(source, {
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const announcedBytes = Number(response.headers.get('content-length') || 0);
    if (Number.isFinite(announcedBytes) && announcedBytes > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error('image exceeds the 8 MiB Live Canvas limit');
    }

    const blob = await response.blob();
    if (blob.size > MAX_REMOTE_IMAGE_BYTES) {
      throw new Error('image exceeds the 8 MiB Live Canvas limit');
    }
    if (blob.type && !blob.type.toLowerCase().startsWith('image/')) {
      throw new Error(`expected image content, received ${blob.type}`);
    }

    const bitmap = await createImageBitmap(blob);
    if (bitmap.width * bitmap.height > MAX_REMOTE_IMAGE_PIXELS) {
      bitmap.close();
      throw new Error('decoded image exceeds the 12 million pixel Live Canvas limit');
    }
    return bitmap;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function applyRemoteImages(
  ctx: CanvasRenderingContext2D,
  value: Jsonish,
  warnings: string[],
) {
  const list = Array.isArray(value) ? value : [value];
  const remoteItems = list.filter(
    (item): item is RecordValue =>
      isRecord(item) && typeof item.source === 'string' && remoteImageSource(item.source),
  );

  if (remoteItems.length > MAX_REMOTE_IMAGE_COUNT) {
    warnings.push(
      `Live Canvas renders at most ${MAX_REMOTE_IMAGE_COUNT} remote image layers; extra remote layers were skipped.`,
    );
  }

  for (const item of remoteItems.slice(0, MAX_REMOTE_IMAGE_COUNT)) {
    const source = stringOf(item.source, '');
    let bitmap: ImageBitmap | null = null;

    try {
      bitmap = await fetchRemoteImageBitmap(source);
      const intrinsicWidth = Math.max(1, bitmap.width);
      const intrinsicHeight = Math.max(1, bitmap.height);
      const width = Math.max(1, numberOf(item.width, intrinsicWidth));
      const height = Math.max(1, numberOf(item.height, intrinsicHeight));
      const x = numberOf(item.x, 0);
      const y = numberOf(item.y, 0);
      const rotation = (numberOf(item.rotation, 0) * Math.PI) / 180;
      const fit = stringOf(item.fit, 'fill');
      const align = stringOf(item.align, 'center');
      const stroke = isRecord(item.stroke) ? item.stroke : {};
      const rawRadius = item.borderRadius;
      const radius =
        rawRadius === 'circular'
          ? Math.min(width, height) / 2
          : Math.max(0, numberOf(rawRadius, 0));

      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, numberOf(item.opacity, 1)));
      applyBlendMode(ctx, item.blendMode);
      ctx.translate(x + width / 2, y + height / 2);
      if (rotation) ctx.rotate(rotation);
      ctx.translate(-width / 2, -height / 2);

      if (isRecord(item.shadow)) {
        applyShadow(ctx, item.shadow);
        drawRoundedRect(ctx, 0, 0, width, height, radius);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (radius > 0) {
        drawRoundedRect(ctx, 0, 0, width, height, radius);
        ctx.clip();
      }

      if (fit === 'contain' || fit === 'cover') {
        const scale =
          fit === 'cover'
            ? Math.max(width / intrinsicWidth, height / intrinsicHeight)
            : Math.min(width / intrinsicWidth, height / intrinsicHeight);
        const drawWidth = intrinsicWidth * scale;
        const drawHeight = intrinsicHeight * scale;
        const offset = alignedImageOffset(align, width, height, drawWidth, drawHeight);
        ctx.drawImage(bitmap, offset.x, offset.y, drawWidth, drawHeight);
      } else {
        ctx.drawImage(bitmap, 0, 0, width, height);
      }

      const strokeWidth = numberOf(stroke.width, 0);
      if (strokeWidth > 0) {
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stringOf(stroke.color, '#ffffff');
        drawRoundedRect(ctx, strokeWidth / 2, strokeWidth / 2, width - strokeWidth, height - strokeWidth, radius);
        ctx.stroke();
      }

      ctx.restore();
    } catch (error) {
      warnings.push(
        `Remote image could not be loaded in Live Canvas (${remoteImageHost(source)}): ${error instanceof Error ? error.message : 'unknown browser image error'}.`,
      );
    } finally {
      bitmap?.close();
    }
  }
}

async function applyImageLayersInOrder(
  ctx: CanvasRenderingContext2D,
  value: Jsonish,
  warnings: string[],
) {
  const list = Array.isArray(value) ? value : [value];
  let remoteCount = 0;

  for (const item of list) {
    if (!isRecord(item)) continue;
    const source = stringOf(item.source, '');

    if (SHAPES.has(source)) {
      applyImageShapes(ctx, item);
      continue;
    }

    if (remoteImageSource(source)) {
      remoteCount += 1;
      if (remoteCount <= MAX_REMOTE_IMAGE_COUNT) {
        await applyRemoteImages(ctx, item, warnings);
      }
    }
  }

  if (remoteCount > MAX_REMOTE_IMAGE_COUNT) {
    warnings.push(
      `Live Canvas renders at most ${MAX_REMOTE_IMAGE_COUNT} remote image layers per createImage() call; extra remote layers were skipped.`,
    );
  }
}

export async function renderStudioBrowserPreview(source: string): Promise<BrowserStudioResult> {
  const started = performance.now();
  const supportedApis = ['createCanvas', 'createText', 'createImage'];
  const warnings: string[] = [];

  if (
    /(?:node:fs|from\s+['"]fs['"]|require\(\s*['"](?:node:)?fs['"]\s*\)|\bfs\.)/.test(source)
  ) {
    warnings.push(
      'Filesystem calls are Node-only and are ignored by Live Canvas. The visual Apexify calls are still previewed.',
    );
  }

  if (/\bprocess\.(?:env|cwd|argv|platform)\b/.test(source)) {
    warnings.push(
      'Node process APIs are not executed by Live Canvas. Switch to the trusted-local Node target when available.',
    );
  }

  try {
    const calls = extractCalls(source, [...supportedApis, ...UNSUPPORTED_APIS]);
    const resolver = createSafePreviewResolver(source);
    const resolve = (expression: string, sourceIndex: number): Jsonish => {
      try {
        return resolver.resolveAt(expression, sourceIndex);
      } catch {
        return parseLiteral(expression);
      }
    };
    const canvasCall = calls.find((call) => call.method === 'createCanvas');

    if (!canvasCall?.args[0]) {
      return {
        ok: false,
        elapsedMs: Math.round(performance.now() - started),
        error: 'Live Canvas needs a supported painter.createCanvas(...) call before it can render a preview.',
        supportedApis,
      };
    }

    const canvasConfig = resolve(canvasCall.args[0], canvasCall.index);
    if (!isRecord(canvasConfig)) {
      throw new Error('createCanvas() options must be an object literal.');
    }

    const width = Math.round(numberOf(canvasConfig.width, 640));
    const height = Math.round(numberOf(canvasConfig.height, 360));

    if (width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > 12_000_000) {
      throw new Error('Live Canvas limits output to 4096×4096 and 12 million pixels.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');

    applyBackground(ctx, canvasConfig, width, height);

    for (const call of calls) {
      if (call.index <= canvasCall.index || !call.args[0]) continue;

      if (call.method === 'createText') {
        const parsed = resolve(call.args[0], call.index);
        if (hasUnresolved(parsed)) {
          warnings.push('Some createText() values depend on runtime-only expressions and were skipped or defaulted in Live Canvas.');
        }
        applyText(ctx, parsed);
      } else if (call.method === 'createImage') {
        const parsed = resolve(call.args[0], call.index);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        const unresolvedSource = items.some(
          (item) => isRecord(item) && isUnresolvedPreviewValue(item.source),
        );

        await applyImageLayersInOrder(ctx, parsed, warnings);

        const unsupportedImage = items.some(
          (item) =>
            isRecord(item) &&
            typeof item.source === 'string' &&
            !isUnresolvedPreviewValue(item.source) &&
            !SHAPES.has(item.source) &&
            !remoteImageSource(item.source),
        );

        if (unresolvedSource) {
          warnings.push('An image layer depends on a Node-only runtime value and was skipped; other browser-supported layers were still rendered.');
        }
        if (unsupportedImage) {
          warnings.push('Local/Node-only bitmap sources were skipped; Live Canvas rendered supported shapes and browser-fetchable HTTP(S) images.');
        }
      } else if (UNSUPPORTED_APIS.includes(call.method)) {
        warnings.push(`${call.method}() requires the Node renderer and was not executed by Live Canvas.`);
      }
    }

    const unresolved = resolver.unresolved();
    if (unresolved.length) {
      warnings.push(
        'Live Canvas resolved the supported composition subset and skipped runtime-only values: ' +
          unresolved.slice(0, 4).join(', ') +
          (unresolved.length > 4 ? '…' : ''),
      );
    }

    const radius = numberOf(canvasConfig.borderRadius, 0);
    if (radius > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = '#000';
      drawRoundedRect(ctx, 0, 0, width, height, radius);
      ctx.fill();
      ctx.restore();
    }

    return {
      ok: true,
      dataUrl: canvas.toDataURL('image/png'),
      mime: 'image/png',
      elapsedMs: Math.round(performance.now() - started),
      supportedApis,
      warnings: [...new Set(warnings)],
    };
  } catch (error) {
    return {
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : 'Live Canvas could not render this snippet.',
      supportedApis,
    };
  }
}
