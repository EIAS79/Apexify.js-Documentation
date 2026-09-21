import type {
  VisualProjectIssue,
  VisualTextLineDecoration,
  VisualTextMetrics,
  VisualTextNodeProps,
} from './model';

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

export function visualTextProps(
  node: { props: Record<string, unknown> },
): VisualTextNodeProps {
  return node.props as unknown as VisualTextNodeProps;
}

export function textPropsRecord(
  props: VisualTextNodeProps,
): Record<string, import('./model').VisualValue> {
  return props as unknown as Record<string, import('./model').VisualValue>;
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
  const lineHeight = props.layout?.lineHeight ?? props.lineHeight ?? 1.2;
  const maxWidth = props.layout?.maxWidth ?? props.maxWidth;

  ctx.font = `${italic ? 'italic ' : ''}${bold ? '700 ' : ''}${size}px "${family}"`;
  const lines = browserWrappedLines(ctx, props.text, maxWidth);
  const measured = lines.map((line) => ({
    text: line,
    width: ctx.measureText(line).width,
  }));
  const width = measured.reduce((max, line) => Math.max(max, line.width), 0);
  const pxLineHeight = lineHeight <= 4 ? size * lineHeight : lineHeight;
  return {
    width,
    height: Math.max(1, lines.length) * pxLineHeight,
    lineHeight: pxLineHeight,
    lineCount: Math.max(1, lines.length),
    baseline: size * .8,
    lines: measured,
  };
}
