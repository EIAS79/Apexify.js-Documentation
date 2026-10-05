import type {
  VisualNode,
  VisualProject,
  VisualProjectIssue,
  VisualTextBatchGroupProps,
  VisualTextLineDecoration,
  VisualTextMetrics,
  VisualTextNodeProps,
  VisualValue,
} from './model';
import { CANVAS_RUNTIME_LIMITS } from './canvas-contract';

export const TEXT_ALIGNMENTS = ['left','center','right','start','end'] as const;
export const TEXT_BASELINES = ['alphabetic','bottom','hanging','ideographic','middle','top'] as const;
export const TEXT_CURVE_MODES = ['fit','clamp','override'] as const;

export type TextAuthoringSurface =
  | 'Transform'
  | 'Style'
  | 'Effects'
  | 'Data'
  | 'Advanced'
  | 'Metrics';

export type TextReverseSyncPolicy =
  | 'canonical-literal'
  | 'font-asset'
  | 'legacy-normalized';

export const TEXT_AUTHORING_CLASSIFICATION = {
  text: { surface: 'Style', reverse: 'canonical-literal' },
  font: { surface: 'Style', reverse: 'font-asset' },
  decorations: { surface: 'Style', reverse: 'canonical-literal' },
  effects: { surface: 'Effects', reverse: 'canonical-literal' },
  layout: { surface: 'Style', reverse: 'canonical-literal' },
  placement: { surface: 'Transform', reverse: 'canonical-literal' },
  fill: { surface: 'Style', reverse: 'canonical-literal' },
  stroke: { surface: 'Style', reverse: 'canonical-literal' },
  textOnCurve: { surface: 'Effects', reverse: 'canonical-literal' },
  includeCharMetrics: { surface: 'Metrics', reverse: 'canonical-literal' },
  measurementCanvas: { surface: 'Metrics', reverse: 'canonical-literal' },
  painterOpts: { surface: 'Data', reverse: 'canonical-literal' },

  fontSize: { surface: 'Advanced', reverse: 'legacy-normalized' },
  fontFamily: { surface: 'Advanced', reverse: 'legacy-normalized' },
  fontName: { surface: 'Advanced', reverse: 'legacy-normalized' },
  fontPath: { surface: 'Advanced', reverse: 'legacy-normalized' },
  bold: { surface: 'Advanced', reverse: 'legacy-normalized' },
  italic: { surface: 'Advanced', reverse: 'legacy-normalized' },
  underline: { surface: 'Advanced', reverse: 'legacy-normalized' },
  overline: { surface: 'Advanced', reverse: 'legacy-normalized' },
  strikethrough: { surface: 'Advanced', reverse: 'legacy-normalized' },
  highlight: { surface: 'Advanced', reverse: 'legacy-normalized' },
  glow: { surface: 'Advanced', reverse: 'legacy-normalized' },
  shadow: { surface: 'Advanced', reverse: 'legacy-normalized' },
  lineHeight: { surface: 'Advanced', reverse: 'legacy-normalized' },
  letterSpacing: { surface: 'Advanced', reverse: 'legacy-normalized' },
  wordSpacing: { surface: 'Advanced', reverse: 'legacy-normalized' },
  maxWidth: { surface: 'Advanced', reverse: 'legacy-normalized' },
  maxHeight: { surface: 'Advanced', reverse: 'legacy-normalized' },
  textAlign: { surface: 'Advanced', reverse: 'legacy-normalized' },
  textBaseline: { surface: 'Advanced', reverse: 'legacy-normalized' },
  rotation: { surface: 'Advanced', reverse: 'legacy-normalized' },
  color: { surface: 'Advanced', reverse: 'legacy-normalized' },
  gradient: { surface: 'Advanced', reverse: 'legacy-normalized' },
  opacity: { surface: 'Advanced', reverse: 'legacy-normalized' },
} as const satisfies Record<
  keyof VisualTextNodeProps,
  { surface: TextAuthoringSurface; reverse: TextReverseSyncPolicy }
>;

export function defaultTextNodeProps(text = 'Text'): VisualTextNodeProps {
  return {
    text,
    font: {
      size: 48,
      family: 'Arial',
    },
    decorations: {
      bold: false,
      italic: false,
    },
    layout: {
      lineHeight: 1.2,
      letterSpacing: 0,
      wordSpacing: 0,
      maxWidth: 360,
    },
    placement: {
      textAlign: 'left',
      textBaseline: 'top',
      rotation: 0,
    },
    fill: {
      color: '#f4f7fb',
      opacity: 1,
    },
  };
}

export function textBatchGroupPropsRecord(
  value: VisualTextBatchGroupProps,
): Record<string, VisualValue> {
  return structuredClone(value) as unknown as Record<string, VisualValue>;
}

export function visualTextBatchGroupProps(
  node: VisualNode,
): VisualTextBatchGroupProps | null {
  if (node.kind !== 'group') return null;
  const raw = node.props as unknown as Partial<VisualTextBatchGroupProps>;
  if (raw.textBatch !== true) return null;
  return {
    textBatch: true,
    ...(raw.painterOpts
      ? { painterOpts: structuredClone(raw.painterOpts) }
      : {}),
  };
}

export function isTextBatchGroup(node: VisualNode): boolean {
  return visualTextBatchGroupProps(node) !== null;
}

export function visualTextProps(
  node: { props: Record<string, unknown> },
): VisualTextNodeProps {
  return node.props as unknown as VisualTextNodeProps;
}

export function textPropsRecord(
  props: VisualTextNodeProps,
): Record<string, VisualValue> {
  return props as unknown as Record<string, VisualValue>;
}

function push(
  issues: VisualProjectIssue[],
  code: string,
  path: string,
  message: string,
) {
  issues.push({ severity: 'error', code, path, message });
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function opacity(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
) {
  if (value !== undefined && (!finite(value) || value < 0 || value > 1)) {
    push(issues, 'text-opacity', path, 'Opacity must be between 0 and 1.');
  }
}

function lineDecoration(
  issues: VisualProjectIssue[],
  value: VisualTextLineDecoration | undefined,
  path: string,
) {
  if (value === undefined || typeof value === 'boolean') return;
  if (value.width !== undefined && (!finite(value.width) || value.width < 0)) {
    push(issues, 'text-decoration-width', path + '.width', 'Decoration width must be non-negative.');
  }
}

export function validateVisualTextNode(
  node: { id: string; kind: string; props: Record<string, unknown> },
  issues: VisualProjectIssue[],
) {
  if (node.kind !== 'text') return;
  const props = visualTextProps(node);
  const path = 'document.nodes.' + node.id + '.props';

  if (typeof props.text !== 'string' || !props.text.length) {
    push(issues, 'text-content', path + '.text', 'Text must be a non-empty string.');
  }

  const size = props.font?.size ?? props.fontSize;
  if (size !== undefined && (!finite(size) || size <= 0)) {
    push(issues, 'text-font-size', path + '.font.size', 'Font size must be positive.');
  }

  const layout = props.layout ?? {};
  const lineHeight = layout.lineHeight ?? props.lineHeight;
  const letterSpacing = layout.letterSpacing ?? props.letterSpacing;
  const wordSpacing = layout.wordSpacing ?? props.wordSpacing;
  const maxWidth = layout.maxWidth ?? props.maxWidth;
  const maxHeight = layout.maxHeight ?? props.maxHeight;

  if (lineHeight !== undefined && (!finite(lineHeight) || lineHeight <= 0)) {
    push(issues, 'text-line-height', path + '.layout.lineHeight', 'Line height must be positive.');
  }
  for (const [key, value] of [
    ['letterSpacing', letterSpacing],
    ['wordSpacing', wordSpacing],
  ] as const) {
    if (value !== undefined && !finite(value)) {
      push(issues, 'text-spacing', path + '.layout.' + key, 'Text spacing must be finite.');
    }
  }
  for (const [key, value] of [
    ['maxWidth', maxWidth],
    ['maxHeight', maxHeight],
  ] as const) {
    if (value !== undefined && (!finite(value) || value <= 0)) {
      push(issues, 'text-layout-bound', path + '.layout.' + key, 'Text layout bounds must be positive.');
    }
  }

  const placement = props.placement ?? {};
  const align = placement.textAlign ?? props.textAlign;
  const baseline = placement.textBaseline ?? props.textBaseline;
  const rotation = placement.rotation ?? props.rotation;
  if (align !== undefined && !TEXT_ALIGNMENTS.includes(align)) {
    push(issues, 'text-align', path + '.placement.textAlign', 'Unsupported text alignment.');
  }
  if (baseline !== undefined && !TEXT_BASELINES.includes(baseline)) {
    push(issues, 'text-baseline', path + '.placement.textBaseline', 'Unsupported text baseline.');
  }
  if (rotation !== undefined && !finite(rotation)) {
    push(issues, 'text-rotation', path + '.placement.rotation', 'Text rotation must be finite.');
  }

  opacity(issues, props.fill?.opacity ?? props.opacity, path + '.fill.opacity');
  opacity(issues, props.effects?.shadow?.opacity ?? props.shadow?.opacity, path + '.effects.shadow.opacity');
  opacity(issues, props.effects?.glow?.opacity ?? props.glow?.opacity, path + '.effects.glow.opacity');
  opacity(issues, props.effects?.highlight?.opacity ?? props.highlight?.opacity, path + '.effects.highlight.opacity');
  opacity(issues, props.stroke?.opacity, path + '.stroke.opacity');

  if (props.effects?.shadow?.blur !== undefined && props.effects.shadow.blur < 0) {
    push(issues, 'text-shadow-blur', path + '.effects.shadow.blur', 'Shadow blur cannot be negative.');
  }
  if (props.effects?.glow?.intensity !== undefined && props.effects.glow.intensity < 0) {
    push(issues, 'text-glow-intensity', path + '.effects.glow.intensity', 'Glow intensity cannot be negative.');
  }
  if (props.stroke?.width !== undefined && (!finite(props.stroke.width) || props.stroke.width < 0)) {
    push(issues, 'text-stroke-width', path + '.stroke.width', 'Stroke width must be non-negative.');
  }

  const dec = props.decorations ?? {};
  lineDecoration(issues, dec.underline ?? props.underline, path + '.decorations.underline');
  lineDecoration(issues, dec.overline ?? props.overline, path + '.decorations.overline');
  lineDecoration(issues, dec.strikethrough ?? props.strikethrough, path + '.decorations.strikethrough');

  if (props.textOnCurve) {
    if (!finite(props.textOnCurve.sweepAngle) || props.textOnCurve.sweepAngle <= 0 || props.textOnCurve.sweepAngle > 360) {
      push(issues, 'text-curve-sweep', path + '.textOnCurve.sweepAngle', 'Curve sweep must be > 0 and <= 360.');
    }
    if (props.textOnCurve.radius !== undefined && (!finite(props.textOnCurve.radius) || props.textOnCurve.radius <= 0)) {
      push(issues, 'text-curve-radius', path + '.textOnCurve.radius', 'Curve radius must be positive.');
    }
    if (
      props.textOnCurve.layoutMode !== undefined &&
      !TEXT_CURVE_MODES.includes(props.textOnCurve.layoutMode)
    ) {
      push(issues, 'text-curve-mode', path + '.textOnCurve.layoutMode', 'Unsupported curved-text layout mode.');
    }
  }

  if (props.measurementCanvas) {
    for (const key of ['width','height'] as const) {
      const value = props.measurementCanvas[key];
      if (value !== undefined && (!finite(value) || value <= 0 || !Number.isInteger(value))) {
        push(issues, 'text-measurement-canvas', path + '.measurementCanvas.' + key, 'Measurement canvas dimensions must be positive integers.');
      }
    }
    const width = props.measurementCanvas.width ?? 1;
    const height = props.measurementCanvas.height ?? 1;
    if (
      width > CANVAS_RUNTIME_LIMITS.maxCanvasDimension ||
      height > CANVAS_RUNTIME_LIMITS.maxCanvasDimension ||
      width * height > CANVAS_RUNTIME_LIMITS.maxTotalPixels
    ) {
      push(
        issues,
        'text-measurement-canvas-limit',
        path + '.measurementCanvas',
        'Measurement canvas exceeds the pinned runtime canvas resource limits.',
      );
    }
  }

  if (
    props.painterOpts?.resolveAssetRefs !== undefined &&
    typeof props.painterOpts.resolveAssetRefs !== 'boolean'
  ) {
    push(
      issues,
      'text-painter-asset-refs',
      path + '.painterOpts.resolveAssetRefs',
      'resolveAssetRefs must be a boolean.',
    );
  }
}

export function validateVisualTextBatchGroup(
  project: VisualProject,
  node: VisualNode,
  issues: VisualProjectIssue[],
) {
  const batch = visualTextBatchGroupProps(node);
  if (!batch) return;

  const path = 'document.nodes.' + node.id;
  const children = node.childIds ?? [];
  if (children.length < 2) {
    push(
      issues,
      'text-batch-size',
      path + '.childIds',
      'A createText TextProperties[] batch requires at least two text children.',
    );
  }
  if (children.length > CANVAS_RUNTIME_LIMITS.maxCollectionItems) {
    push(
      issues,
      'text-batch-limit',
      path + '.childIds',
      'Text batch exceeds the pinned runtime maxCollectionItems limit.',
    );
  }

  let totalLength = 0;
  for (const childId of children) {
    const child = project.document.nodes[childId];
    if (!child || child.kind !== 'text') {
      push(
        issues,
        'text-batch-child',
        path + '.childIds',
        'Text batches may contain only text children.',
      );
      continue;
    }
    totalLength += visualTextProps(child).text.length;
  }
  if (totalLength > 1_000_000) {
    push(
      issues,
      'text-batch-length',
      path + '.childIds',
      'Text batch exceeds the pinned runtime maxTextLength limit.',
    );
  }

  if (
    batch.painterOpts?.resolveAssetRefs !== undefined &&
    typeof batch.painterOpts.resolveAssetRefs !== 'boolean'
  ) {
    push(
      issues,
      'text-batch-painter-asset-refs',
      path + '.props.painterOpts.resolveAssetRefs',
      'resolveAssetRefs must be a boolean.',
    );
  }
}

function browserWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth?: number,
): string[] {
  const explicit = text.split('\n');
  if (!maxWidth || maxWidth <= 0) return explicit;
  const out: string[] = [];
  for (const explicitLine of explicit) {
    const words = explicitLine.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push('');
      continue;
    }
    let line = words[0]!;
    for (let i = 1; i < words.length; i += 1) {
      const candidate = line + ' ' + words[i]!;
      if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
      else {
        out.push(line);
        line = words[i]!;
      }
    }
    out.push(line);
  }
  return out;
}

export function measureVisualTextInBrowser(
  props: VisualTextNodeProps,
): VisualTextMetrics | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const size = props.font?.size ?? props.fontSize ?? 16;
  const family =
    props.font?.name ??
    props.fontName ??
    props.font?.family ??
    props.fontFamily ??
    'Arial';
  const bold = props.decorations?.bold ?? props.bold ?? false;
  const italic = props.decorations?.italic ?? props.italic ?? false;
  const lineHeightMultiplier = props.layout?.lineHeight ?? props.lineHeight ?? 1.4;
  const maxWidth = props.layout?.maxWidth ?? props.maxWidth;

  ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px "${family}"`;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = String(props.layout?.letterSpacing ?? props.letterSpacing ?? 0) + 'px';
  }
  if ('wordSpacing' in ctx) {
    ctx.wordSpacing = String(props.layout?.wordSpacing ?? props.wordSpacing ?? 0) + 'px';
  }

  const lines = browserWrappedLines(ctx, props.text, maxWidth);
  const pxLineHeight = lineHeightMultiplier * size;
  const native = lines.map((line) => ctx.measureText(line));
  const widths = native.map((metric) => metric.width);
  const width = widths.reduce((max, value) => Math.max(max, value), 0);
  const first = native[0] ?? ctx.measureText('');
  const ascent = first.actualBoundingBoxAscent || size * 0.8;
  const descent = first.actualBoundingBoxDescent || size * 0.2;
  const metricBase = {
    width: first.width,
    actualBoundingBoxAscent: first.actualBoundingBoxAscent,
    actualBoundingBoxDescent: first.actualBoundingBoxDescent,
    actualBoundingBoxLeft: first.actualBoundingBoxLeft,
    actualBoundingBoxRight: first.actualBoundingBoxRight,
    fontBoundingBoxAscent:
      ('fontBoundingBoxAscent' in first
        ? Number(first.fontBoundingBoxAscent)
        : ascent),
    fontBoundingBoxDescent:
      ('fontBoundingBoxDescent' in first
        ? Number(first.fontBoundingBoxDescent)
        : descent),
    height: ascent + descent,
    lineHeight: pxLineHeight,
    baseline: ascent,
    top: -ascent,
    bottom: descent,
    centerX: first.width / 2,
    centerY: (descent - ascent) / 2,
  };

  const result: VisualTextMetrics = {
    ...metricBase,
    width,
    height: Math.max(1, lines.length) * pxLineHeight,
    totalHeight: Math.max(1, lines.length) * pxLineHeight,
    lineCount: Math.max(1, lines.length),
    lines: lines.map((line, index) => {
      const metric = native[index] ?? ctx.measureText(line);
      const lineAscent = metric.actualBoundingBoxAscent || size * 0.8;
      const lineDescent = metric.actualBoundingBoxDescent || size * 0.2;
      return {
        text: line,
        width: metric.width,
        height: lineAscent + lineDescent,
        metrics: {
          width: metric.width,
          actualBoundingBoxAscent: metric.actualBoundingBoxAscent,
          actualBoundingBoxDescent: metric.actualBoundingBoxDescent,
          actualBoundingBoxLeft: metric.actualBoundingBoxLeft,
          actualBoundingBoxRight: metric.actualBoundingBoxRight,
          fontBoundingBoxAscent:
            ('fontBoundingBoxAscent' in metric
              ? Number(metric.fontBoundingBoxAscent)
              : lineAscent),
          fontBoundingBoxDescent:
            ('fontBoundingBoxDescent' in metric
              ? Number(metric.fontBoundingBoxDescent)
              : lineDescent),
          height: lineAscent + lineDescent,
          lineHeight: pxLineHeight,
          baseline: lineAscent,
          top: -lineAscent,
          bottom: lineDescent,
          centerX: metric.width / 2,
          centerY: (lineDescent - lineAscent) / 2,
        },
      };
    }),
    centerX: width / 2,
    centerY: (Math.max(1, lines.length) * pxLineHeight) / 2,
  };

  if (props.includeCharMetrics) {
    const units = Array.from(props.text);
    let currentX = 0;
    result.charWidths = [];
    result.charPositions = [];
    for (const unit of units) {
      const charWidth = ctx.measureText(unit).width;
      result.charWidths.push(charWidth);
      result.charPositions.push({ x: currentX, width: charWidth });
      currentX += charWidth;
    }
  }

  return result;
}
