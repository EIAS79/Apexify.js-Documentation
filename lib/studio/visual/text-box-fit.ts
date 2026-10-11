import type { VisualTextNodeProps } from './model';
import { measureVisualTextInBrowser } from './text-contract';

/**
 * The visual rectangle controls text wrapping and clipping boundaries.
 * Font size, line height and spacing are ALWAYS user-authoritative.
 * Width changes wrap lines, never glyph size; overflow is reported,
 * never silently corrected by shrinking typography.
 */
export type VisualTextBoxFit = {
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  lineCount: number;
  contentHeight: number;
  measuredWidth: number;
  scale: number;
  fullyFits: boolean;
};

const fitCache = new Map<string, VisualTextBoxFit>();
const CACHE_LIMIT = 160;

function lineMetrics(
  props: VisualTextNodeProps,
  width: number,
  size: number,
  letterSpacing: number,
  wordSpacing: number,
  leading: number,
): { count: number; maxWidth: number } {
  const sample: VisualTextNodeProps = {
    ...props,
    maxWidth: undefined,
    maxHeight: undefined,
    font: { ...props.font, size },
    layout: {
      ...props.layout,
      maxWidth: width,
      maxHeight: undefined,
      lineHeight: leading,
      letterSpacing,
      wordSpacing,
    },
  };
  const actual = props.text.length <= 4000 ? measureVisualTextInBrowser(sample) : null;
  if (actual) return { count: actual.lineCount ?? Math.max(1, actual.lines?.length ?? 1), maxWidth: actual.width ?? 0 };

  // Deterministic server-side fallback. Public output is always bounded by
  // the same box; this estimate errs toward smaller glyphs when canvas metrics
  // are unavailable during SSR/CLI code generation.
  const units = (value: string) => Array.from(value);
  const charWidth = (char: string) => {
    if (char === ' ') return size * 0.34 + letterSpacing + wordSpacing;
    if (/^[ilI.,!:'\x60|]$/u.test(char)) return size * 0.32 + letterSpacing;
    if (/^[MW@#%]$/u.test(char)) return size * 0.94 + letterSpacing;
    if (/^[^\x00-\x7f]$/u.test(char)) return size * 1.05 + letterSpacing;
    return size * 0.62 + letterSpacing;
  };
  const textWidth = (word: string) =>
    units(word).reduce((acc, glyph) => acc + charWidth(glyph), 0);
  let count = 0;
  let longest = 0;
  const limit = 20000;
  let scanned = 0;
  for (const paragraph of props.text.split('\n')) {
    const tokens = paragraph.trim().split(/\s+/u).filter(Boolean);
    if (!tokens.length) { count++; continue; }
    let current = '';
    for (const token of tokens) {
      const chunks: string[] = [];
      let chunk = '';
      for (const glyph of units(token)) {
        if (++scanned > limit) return { count: count + Math.ceil((props.text.length - scanned) / Math.max(1, width / Math.max(size,1))) + 1, maxWidth: width };
        if (chunk && textWidth(chunk + glyph) > width) { chunks.push(chunk); chunk = glyph; }
        else chunk += glyph;
      }
      if (chunk) chunks.push(chunk);
      for (const part of chunks) {
        const candidate = current ? current + ' ' + part : part;
        if (current && textWidth(candidate) > width) {
          longest = Math.max(longest, textWidth(current));
          count++; current = part;
        } else current = candidate;
      }
    }
    if (current) {
      count++; longest = Math.max(longest, textWidth(current));
    }
  }
  return { count: Math.max(1, count), maxWidth: longest };
}

export function textBoxAnchorOffset(
  placement: VisualTextNodeProps['placement'],
  width: number,
  renderedFontSize: number,
): { x: number; y: number } {
  const align = placement?.textAlign ?? 'left';
  const baseline = placement?.textBaseline ?? 'alphabetic';
  const x = align === 'center' ? width / 2
    : align === 'right' || align === 'end' ? width : 0;
  const y = baseline === 'top' ? 0
    : baseline === 'middle' ? renderedFontSize * 0.5
    : baseline === 'hanging' ? renderedFontSize * 0.18
    : baseline === 'bottom' ? renderedFontSize
    : renderedFontSize * 0.95;
  return { x, y };
}

export function fitVisualTextToBox(
  props: VisualTextNodeProps,
  rawWidth: number,
  rawHeight: number,
): VisualTextBoxFit {
  const width = Math.max(1, rawWidth);
  const height = Math.max(1, rawHeight);
  const fontSize = Math.max(0.1, props.font?.size ?? props.fontSize ?? 16);
  const lineHeight = Math.max(0.01, props.layout?.lineHeight ?? props.lineHeight ?? 1.4);
  const letterSpacing = props.layout?.letterSpacing ?? props.letterSpacing ?? 0;
  const wordSpacing = props.layout?.wordSpacing ?? props.wordSpacing ?? 0;
  const key = JSON.stringify([
    props.text, props.font, props.decorations?.bold, props.decorations?.italic,
    props.isBold, props.textOnCurve, props.placement?.textAlign,
    width, height, lineHeight, letterSpacing, wordSpacing,
    typeof document !== 'undefined',
  ]);
  const cached = fitCache.get(key);
  if (cached) return cached;
  const sample = lineMetrics(props, width, fontSize, letterSpacing, wordSpacing, lineHeight);
  const lineCount = Math.max(1, sample.count);
  const contentHeight = lineCount * fontSize * Math.max(1, lineHeight);
  const result: VisualTextBoxFit = {
    width, height, fontSize, lineHeight, letterSpacing, wordSpacing,
    lineCount, contentHeight, measuredWidth: sample.maxWidth,
    scale: 1,
    fullyFits: contentHeight <= height && sample.maxWidth <= width,
  };
  if (fitCache.size >= CACHE_LIMIT) fitCache.clear();
  fitCache.set(key, result);
  return result;
}
