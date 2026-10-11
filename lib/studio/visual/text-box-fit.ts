import type { VisualTextNodeProps } from './model';
import { measureVisualTextInBrowser } from './text-contract';

/**
 * The visual bounding rectangle is the authoritative wrap/fit box.
 * Apexify's public createText() wraps at maxWidth and truncates at maxHeight;
 * it does not automatically shrink content. Studio computes render-only fitted
 * typography, leaving the user's requested font and spacing untouched.
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
  const preferredSize = Math.max(0.1, props.font?.size ?? props.fontSize ?? 16);
  const leading = Math.max(0.01, props.layout?.lineHeight ?? props.lineHeight ?? 1.4);
  const preferredLetterSpacing = props.layout?.letterSpacing ?? props.letterSpacing ?? 0;
  const preferredWordSpacing = props.layout?.wordSpacing ?? props.wordSpacing ?? 0;

  const key = JSON.stringify([
    props.text, props.font, props.decorations?.bold, props.decorations?.italic,
    props.isBold, props.textOnCurve, props.placement?.textAlign,
    width, height, leading, preferredLetterSpacing, preferredWordSpacing,
    typeof document !== 'undefined',
  ]);
  const cached = fitCache.get(key);
  if (cached) return cached;

  // Leave at least one logical pixel between the final line and the box edge.
  const safeHeight = Math.max(0.5, height - 2);
  const safeWidth = Math.max(0.5, width - 2);
  const measure = (scale: number) => {
    const size = preferredSize * scale;
    const letterSpacing = preferredLetterSpacing * scale;
    const wordSpacing = preferredWordSpacing * scale;
    const sample = lineMetrics(props, width, size, letterSpacing, wordSpacing, leading);
    // Glyphs can extend beyond a small requested line-height multiplier.
    const contentHeight = Math.max(1, sample.count) * size * Math.max(1, leading);
    return {
      width, height, fontSize: size, lineHeight: leading, letterSpacing,
      wordSpacing, lineCount: Math.max(1, sample.count), contentHeight,
      measuredWidth: sample.maxWidth, scale,
      fullyFits: contentHeight <= safeHeight && sample.maxWidth <= safeWidth,
    };
  };
  let result = measure(1);
  if (!result.fullyFits) {
    let lower = 0;
    let upper = 1;
    for (let index = 0; index < 13; index++) {
      const middle = (lower + upper) / 2;
      const trial = measure(middle);
      if (trial.fullyFits) { lower = middle; result = trial; }
      else upper = middle;
    }
    // Round down, never up, to retain a margin after serialization.
    result = measure(Math.max(0.0001, Math.floor(lower * 10000) / 10000));
  }
  if (fitCache.size >= CACHE_LIMIT) fitCache.clear();
  fitCache.set(key, result);
  return result;
}
