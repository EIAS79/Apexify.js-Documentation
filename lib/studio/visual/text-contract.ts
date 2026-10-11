import type {
  VisualGradient,
  VisualNode,
  VisualProject,
  VisualProjectIssue,
  VisualTextBatchGroupProps,
  VisualTextLineDecoration,
  VisualTextMetrics,
  VisualTextNodeProps,
  VisualTextPerspective,
  VisualCreateTextOptions,
  VisualValue,
} from './model';
import { CANVAS_RUNTIME_LIMITS } from './canvas-contract';

export const TEXT_ALIGNMENTS = ['left','center','right','start','end'] as const;
export const TEXT_BASELINES = ['alphabetic','bottom','hanging','ideographic','middle','top'] as const;
export const TEXT_CURVE_MODES = ['fit','clamp','override'] as const;
export const TEXT_STROKE_STYLES = ['solid','dashed','dotted','groove','ridge','double'] as const;

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
  studioFrameFit: { surface: 'Style', reverse: 'legacy-normalized' },
  font: { surface: 'Style', reverse: 'font-asset' },
  decorations: { surface: 'Style', reverse: 'canonical-literal' },
  effects: { surface: 'Effects', reverse: 'canonical-literal' },
  layout: { surface: 'Style', reverse: 'canonical-literal' },
  placement: { surface: 'Transform', reverse: 'canonical-literal' },
  createOptions: { surface: 'Advanced', reverse: 'canonical-literal' },
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
  scaleX: { surface: 'Advanced', reverse: 'legacy-normalized' },
  scaleY: { surface: 'Advanced', reverse: 'legacy-normalized' },
  skewX: { surface: 'Advanced', reverse: 'legacy-normalized' },
  skewY: { surface: 'Advanced', reverse: 'legacy-normalized' },
  isBold: { surface: 'Advanced', reverse: 'legacy-normalized' },
  outlined: { surface: 'Advanced', reverse: 'legacy-normalized' },
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
      lineHeight: 1.4,
      letterSpacing: 0,
      wordSpacing: 0,
      maxWidth: 360,
    },
    placement: {
      textAlign: 'left',
      textBaseline: 'alphabetic',
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
    ...(raw.createOptions ? { createOptions: structuredClone(raw.createOptions) } : {}),
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
  return structuredClone(props) as unknown as Record<string, VisualValue>;
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

function optionalFinite(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
  options: { min?: number; max?: number; exclusiveMin?: boolean; integer?: boolean } = {},
) {
  if (value === undefined) return;
  if (!finite(value)) {
    push(issues, 'text-number', path, 'Value must be finite.');
    return;
  }
  if (options.integer && !Number.isInteger(value)) {
    push(issues, 'text-integer', path, 'Value must be an integer.');
  }
  if (
    options.min !== undefined &&
    (options.exclusiveMin ? value <= options.min : value < options.min)
  ) {
    push(
      issues,
      'text-number-min',
      path,
      options.exclusiveMin
        ? 'Value must be greater than ' + options.min + '.'
        : 'Value must be at least ' + options.min + '.',
    );
  }
  if (options.max !== undefined && value > options.max) {
    push(issues, 'text-number-max', path, 'Value must not exceed ' + options.max + '.');
  }
}

function optionalBoolean(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
) {
  if (value !== undefined && typeof value !== 'boolean') {
    push(issues, 'text-boolean', path, 'Value must be boolean.');
  }
}

function optionalString(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
) {
  if (
    value !== undefined &&
    (typeof value !== 'string' || !value.trim().length || value.includes('\0'))
  ) {
    push(issues, 'text-string', path, 'Value must be a non-empty string without NUL bytes.');
  }
}

function opacity(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
) {
  optionalFinite(issues, value, path, { min: 0, max: 1 });
}

function validateGradient(
  issues: VisualProjectIssue[],
  value: VisualGradient | undefined,
  path: string,
) {
  if (!value) return;
  if (!['linear','radial','conic'].includes(value.type)) {
    push(issues, 'text-gradient-type', path + '.type', 'Unsupported gradient type.');
  }
  if (!Array.isArray(value.colors) || value.colors.length < 2) {
    push(issues, 'text-gradient-stops', path + '.colors', 'Gradient requires at least two color stops.');
    return;
  }
  if (value.colors.length > CANVAS_RUNTIME_LIMITS.maxCollectionItems) {
    push(issues, 'text-gradient-limit', path + '.colors', 'Gradient stop count exceeds the runtime collection limit.');
  }
  let previous = -Infinity;
  value.colors.forEach((stop, index) => {
    if (!finite(stop.stop) || stop.stop < 0 || stop.stop > 1) {
      push(issues, 'text-gradient-stop', path + '.colors[' + index + '].stop', 'Gradient stop must be between 0 and 1.');
    }
    if (finite(stop.stop) && stop.stop < previous) {
      push(issues, 'text-gradient-order', path + '.colors[' + index + '].stop', 'Gradient stops must be in non-decreasing order.');
    }
    previous = finite(stop.stop) ? stop.stop : previous;
    optionalString(issues, stop.color, path + '.colors[' + index + '].color');
  });
  for (const key of ['rotate','pivotX','pivotY'] as const) {
    optionalFinite(issues, value[key], path + '.' + key);
  }
  if (value.type === 'linear') {
    for (const key of ['startX','startY','endX','endY'] as const) {
      optionalFinite(issues, value[key], path + '.' + key);
    }
    if (
      value.repeat !== undefined &&
      !['repeat','reflect','no-repeat'].includes(value.repeat)
    ) {
      push(issues, 'text-gradient-repeat', path + '.repeat', 'Unsupported gradient repeat mode.');
    }
  } else if (value.type === 'radial') {
    for (const key of ['startX','startY','endX','endY'] as const) {
      optionalFinite(issues, value[key], path + '.' + key);
    }
    optionalFinite(issues, value.startRadius, path + '.startRadius', { min: 0 });
    optionalFinite(issues, value.endRadius, path + '.endRadius', { min: 0 });
    if (
      value.repeat !== undefined &&
      !['repeat','reflect','no-repeat'].includes(value.repeat)
    ) {
      push(issues, 'text-gradient-repeat', path + '.repeat', 'Unsupported gradient repeat mode.');
    }
  } else {
    optionalFinite(issues, value.centerX, path + '.centerX');
    optionalFinite(issues, value.centerY, path + '.centerY');
    optionalFinite(issues, value.startAngle, path + '.startAngle');
  }
}

function lineDecoration(
  issues: VisualProjectIssue[],
  value: VisualTextLineDecoration | undefined,
  path: string,
) {
  if (value === undefined || typeof value === 'boolean') return;
  optionalString(issues, value.color, path + '.color');
  optionalFinite(issues, value.width, path + '.width', { min: 0 });
  validateGradient(issues, value.gradient, path + '.gradient');
}

export const TEXT_BLEND_MODES = [
  'source-over', 'source-in', 'source-out', 'source-atop',
  'destination-over', 'destination-in', 'destination-out', 'destination-atop',
  'lighter', 'copy', 'xor', 'multiply', 'screen', 'overlay', 'darken',
  'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light',
  'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity',
] as const;

export function validateTextPerspective(
  issues: VisualProjectIssue[], value: VisualTextPerspective | undefined, at: string,
) {
  if (!value) return;
  if (!Array.isArray(value.points) || value.points.length !== 4) {
    push(issues, 'text-perspective-points', at + '.points', 'Perspective requires exactly four corners.');
  } else value.points.forEach((point, index) => {
    if (!point || !finite(point.x) || !finite(point.y)) {
      push(issues, 'text-perspective-coordinates', at + '.points[' + index + ']', 'Corner requires finite x/y.');
    }
  });
  if (value.interpolation !== undefined && !['nearest','bilinear','bicubic'].includes(value.interpolation)) {
    push(issues, 'text-perspective-interpolation', at + '.interpolation', 'Invalid perspective interpolation.');
  }
  if (value.edgeMode !== undefined && !['transparent','clamp','wrap','mirror'].includes(value.edgeMode)) {
    push(issues, 'text-perspective-edge', at + '.edgeMode', 'Invalid perspective edge mode.');
  }
}
function validateScaleSkew(
  issues: VisualProjectIssue[], value: {scaleX?:number;scaleY?:number;skewX?:number;skewY?:number}, at: string,
) {
  for (const key of ['scaleX','scaleY'] as const) optionalFinite(issues,value[key],at+'.'+key);
  for (const key of ['skewX','skewY'] as const) {
    optionalFinite(issues,value[key],at+'.'+key);
    if (finite(value[key]) && Math.abs(value[key]) >= 90) {
      push(issues,'text-skew-range',at+'.'+key,'Skew must be strictly within -90 and 90 degrees.');
    }
  }
}
export function validateCreateTextOptions(
  issues: VisualProjectIssue[], options: VisualCreateTextOptions | undefined, at: string,
) {
  if (!options) return;
  optionalBoolean(issues,options.isGrouped,at+'.isGrouped');
  const t=options.groupTransform;
  if (!t) return;
  validateScaleSkew(issues,t,at+'.groupTransform');
  for (const key of ['rotation','translateX','translateY','pivotX','pivotY'] as const) {
    optionalFinite(issues,t[key],at+'.groupTransform.'+key);
  }
  opacity(issues,t.opacity,at+'.groupTransform.opacity');
  if (t.blendMode !== undefined && !(TEXT_BLEND_MODES as readonly string[]).includes(t.blendMode)) {
    push(issues,'text-group-blend-mode',at+'.groupTransform.blendMode','Unsupported group blend mode.');
  }
  validateTextPerspective(issues,t.perspective,at+'.groupTransform.perspective');
}

export function validateVisualTextNode(
  node: { id: string; kind: string; props: Record<string, unknown>; transform?: { x?: number; y?: number } },
  issues: VisualProjectIssue[],
) {
  if (node.kind !== 'text') return;
  const props = visualTextProps(node);
  const path = 'document.nodes.' + node.id + '.props';

  // An empty layer is a valid transient editing state. The compiler renders
  // a transparent-width whitespace sentinel rather than failing the canvas.
  if (typeof props.text !== 'string') {
    push(issues, 'text-content', path + '.text', 'Text must be a string.');
  } else if (props.text.length > 1_000_000) {
    push(issues, 'text-length', path + '.text', 'Text exceeds the runtime text-length limit.');
  }

  optionalFinite(issues, node.transform?.x, 'document.nodes.' + node.id + '.transform.x');
  optionalFinite(issues, node.transform?.y, 'document.nodes.' + node.id + '.transform.y');

  optionalBoolean(issues, props.studioFrameFit, path + '.studioFrameFit');
  validateCreateTextOptions(issues,props.createOptions,path+'.createOptions');
  const font = props.font ?? {};
  for (const [key, value] of [
    ['family', font.family ?? props.fontFamily],
    ['name', font.name ?? props.fontName],
    ['path', font.path ?? props.fontPath],
  ] as const) {
    optionalString(issues, value, path + '.font.' + key);
  }
  const size = font.size ?? props.fontSize;
  optionalFinite(issues, size, path + '.font.size', { min: 0, exclusiveMin: true });
  if (finite(size) && size <= 0) {
    push(issues, 'text-font-size', path + '.font.size', 'Font size must be greater than zero.');
  }
  if (finite(size) && size > CANVAS_RUNTIME_LIMITS.maxCanvasDimension) {
    push(issues, 'text-font-size-limit', path + '.font.size', 'Font size exceeds the runtime canvas dimension limit.');
  }
  if (font.weight !== undefined) {
    const w=font.weight;
    if (typeof w === 'number') {
      if (!Number.isInteger(w) || w < 100 || w > 900) push(issues,'text-font-weight',path+'.font.weight','Numeric weight must be an integer 100..900.');
    } else if (!['normal','bold','bolder','lighter'].includes(w)) {
      push(issues,'text-font-weight',path+'.font.weight','Unsupported font weight.');
    }
  }
  if (font.style !== undefined && !['normal','italic','oblique'].includes(font.style)) {
    push(issues,'text-font-style',path+'.font.style','Unsupported font style.');
  }
  optionalBoolean(issues,props.isBold,path+'.isBold');
  optionalBoolean(issues,props.outlined,path+'.outlined');
  const layout = props.layout ?? {};
  const lineHeight = layout.lineHeight ?? props.lineHeight;
  const letterSpacing = layout.letterSpacing ?? props.letterSpacing;
  const wordSpacing = layout.wordSpacing ?? props.wordSpacing;
  const maxWidth = layout.maxWidth ?? props.maxWidth;
  const maxHeight = layout.maxHeight ?? props.maxHeight;
  optionalFinite(issues, lineHeight, path + '.layout.lineHeight', { min: 0, exclusiveMin: true });
  optionalFinite(issues, letterSpacing, path + '.layout.letterSpacing');
  optionalFinite(issues, wordSpacing, path + '.layout.wordSpacing');
  optionalFinite(issues, maxWidth, path + '.layout.maxWidth', { min: 0, exclusiveMin: true });
  optionalFinite(issues, maxHeight, path + '.layout.maxHeight', { min: 0, exclusiveMin: true });
  if (finite(lineHeight) && lineHeight <= 0) {
    push(issues, 'text-line-height', path + '.layout.lineHeight', 'lineHeight must be greater than zero.');
  }
  if (
    (finite(maxWidth) && maxWidth <= 0) ||
    (finite(maxHeight) && maxHeight <= 0)
  ) {
    push(issues, 'text-layout-bound', path + '.layout', 'Text layout bounds must be greater than zero.');
  }
  if (finite(maxWidth) && maxWidth > CANVAS_RUNTIME_LIMITS.maxCanvasDimension) {
    push(issues, 'text-max-width-limit', path + '.layout.maxWidth', 'maxWidth exceeds the runtime canvas dimension limit.');
  }
  if (finite(maxHeight) && maxHeight > CANVAS_RUNTIME_LIMITS.maxCanvasDimension) {
    push(issues, 'text-max-height-limit', path + '.layout.maxHeight', 'maxHeight exceeds the runtime canvas dimension limit.');
  }

  const placement = props.placement ?? {};
  const align = placement.textAlign ?? props.textAlign;
  const baseline = placement.textBaseline ?? props.textBaseline;
  if (align !== undefined && !TEXT_ALIGNMENTS.includes(align)) {
    push(issues, 'text-align', path + '.placement.textAlign', 'Unsupported text alignment.');
  }
  if (baseline !== undefined && !TEXT_BASELINES.includes(baseline)) {
    push(issues, 'text-baseline', path + '.placement.textBaseline', 'Unsupported text baseline.');
  }
  optionalFinite(issues, placement.rotation ?? props.rotation, path + '.placement.rotation');
  validateScaleSkew(issues, {
    scaleX:placement.scaleX ?? props.scaleX, scaleY:placement.scaleY ?? props.scaleY,
    skewX:placement.skewX ?? props.skewX, skewY:placement.skewY ?? props.skewY,
  },path+'.placement');
  validateTextPerspective(issues,placement.perspective,path+'.placement.perspective');

  const fill = props.fill ?? {};
  optionalString(issues, fill.color ?? props.color, path + '.fill.color');
  opacity(issues, fill.opacity ?? props.opacity, path + '.fill.opacity');
  validateGradient(issues, fill.gradient ?? props.gradient, path + '.fill.gradient');

  const effects = props.effects ?? {};
  const shadow = effects.shadow ?? props.shadow;
  if (shadow) {
    optionalString(issues, shadow.color, path + '.effects.shadow.color');
    optionalFinite(issues, shadow.offsetX, path + '.effects.shadow.offsetX');
    optionalFinite(issues, shadow.offsetY, path + '.effects.shadow.offsetY');
    optionalFinite(issues, shadow.blur, path + '.effects.shadow.blur', { min: 0 });
    opacity(issues, shadow.opacity, path + '.effects.shadow.opacity');
    validateGradient(issues, shadow.gradient, path + '.effects.shadow.gradient');
  }
  const glow = effects.glow ?? props.glow;
  if (glow) {
    optionalString(issues, glow.color, path + '.effects.glow.color');
    optionalFinite(issues, glow.intensity, path + '.effects.glow.intensity', { min: 0 });
    opacity(issues, glow.opacity, path + '.effects.glow.opacity');
    validateGradient(issues, glow.gradient, path + '.effects.glow.gradient');
  }
  const highlight = effects.highlight ?? props.highlight;
  if (highlight) {
    optionalString(issues, highlight.color, path + '.effects.highlight.color');
    opacity(issues, highlight.opacity, path + '.effects.highlight.opacity');
    validateGradient(issues, highlight.gradient, path + '.effects.highlight.gradient');
  }

  if (props.stroke) {
    optionalString(issues, props.stroke.color, path + '.stroke.color');
    optionalFinite(issues, props.stroke.width, path + '.stroke.width', { min: 0 });
    opacity(issues, props.stroke.opacity, path + '.stroke.opacity');
    validateGradient(issues, props.stroke.gradient, path + '.stroke.gradient');
    if (
      props.stroke.style !== undefined &&
      !TEXT_STROKE_STYLES.includes(props.stroke.style)
    ) {
      push(issues, 'text-stroke-style', path + '.stroke.style', 'Unsupported stroke style.');
    }
  }

  const dec = props.decorations ?? {};
  optionalBoolean(issues, dec.bold ?? props.bold, path + '.decorations.bold');
  optionalBoolean(issues, dec.italic ?? props.italic, path + '.decorations.italic');
  lineDecoration(issues, dec.underline ?? props.underline, path + '.decorations.underline');
  lineDecoration(issues, dec.overline ?? props.overline, path + '.decorations.overline');
  lineDecoration(issues, dec.strikethrough ?? props.strikethrough, path + '.decorations.strikethrough');
  if (props.textOnCurve) {
    optionalFinite(issues, props.textOnCurve.sweepAngle, path + '.textOnCurve.sweepAngle', { min: 0, exclusiveMin: true, max: 360 });
    if (finite(props.textOnCurve.sweepAngle) && props.textOnCurve.sweepAngle >= 360) {
      push(issues, 'text-curve-sweep', path + '.textOnCurve.sweepAngle', 'Curve sweep must be less than 360 degrees.');
    }
    optionalFinite(issues, props.textOnCurve.radius, path + '.textOnCurve.radius', { min: 0, exclusiveMin: true });
    if (finite(props.textOnCurve.radius) && props.textOnCurve.radius <= 0) {
      push(issues, 'text-curve-radius', path + '.textOnCurve.radius', 'Curve radius must be greater than zero.');
    }
    optionalBoolean(issues, props.textOnCurve.up, path + '.textOnCurve.up');
    if (
      props.textOnCurve.layoutMode !== undefined &&
      !TEXT_CURVE_MODES.includes(props.textOnCurve.layoutMode)
    ) {
      push(issues, 'text-curve-mode', path + '.textOnCurve.layoutMode', 'Unsupported curved-text layout mode.');
    }
    optionalFinite(issues, props.textOnCurve.baselineOffset, path + '.textOnCurve.baselineOffset');
    optionalFinite(issues, props.textOnCurve.startAngleDeg, path + '.textOnCurve.startAngleDeg');
  }

  optionalBoolean(issues, props.includeCharMetrics, path + '.includeCharMetrics');
  if (props.measurementCanvas) {
    for (const key of ['width','height'] as const) {
      optionalFinite(
        issues,
        props.measurementCanvas[key],
        path + '.measurementCanvas.' + key,
        { min: 0, exclusiveMin: true, integer: true },
      );
    }
    const width = props.measurementCanvas.width ?? 1;
    const height = props.measurementCanvas.height ?? 1;
    if (
      (finite(props.measurementCanvas.width) &&
        (props.measurementCanvas.width <= 0 ||
          !Number.isInteger(props.measurementCanvas.width))) ||
      (finite(props.measurementCanvas.height) &&
        (props.measurementCanvas.height <= 0 ||
          !Number.isInteger(props.measurementCanvas.height)))
    ) {
      push(
        issues,
        'text-measurement-canvas',
        path + '.measurementCanvas',
        'Measurement canvas dimensions must be positive integers.',
      );
    }
    if (
      width > CANVAS_RUNTIME_LIMITS.maxCanvasDimension ||
      height > CANVAS_RUNTIME_LIMITS.maxCanvasDimension ||
      width * height > CANVAS_RUNTIME_LIMITS.maxTotalPixels
    ) {
      push(
        issues,
        'text-measurement-canvas-limit',
        path + '.measurementCanvas',
        'Measurement canvas exceeds the runtime canvas resource limits.',
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
      'resolveAssetRefs must be boolean.',
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
  validateCreateTextOptions(issues,batch.createOptions,path+'.props.createOptions');
  if (
    batch.painterOpts?.resolveAssetRefs !== undefined &&
    typeof batch.painterOpts.resolveAssetRefs !== 'boolean'
  ) {
    push(
      issues,
      'text-batch-painter-asset-refs',
      path + '.props.painterOpts.resolveAssetRefs',
      'resolveAssetRefs must be boolean.',
    );
  }
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
      'Text batch exceeds the runtime maxCollectionItems limit.',
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
    const childProps = visualTextProps(child);
    totalLength += childProps.text.length;
  }
  if (totalLength > 1_000_000) {
    push(
      issues,
      'text-batch-length',
      path + '.childIds',
      'Text batch exceeds the runtime maxTextLength limit.',
    );
  }


}

function browserGraphemes(value: string): string[] {
  const SegmenterCtor = (
    Intl as typeof Intl & {
      Segmenter?: new (
        locales?: string | string[],
        options?: { granularity?: 'grapheme' },
      ) => { segment(input: string): Iterable<{ segment: string }> };
    }
  ).Segmenter;
  return SegmenterCtor
    ? Array.from(
        new SegmenterCtor(undefined, { granularity: 'grapheme' }).segment(value),
        (entry) => entry.segment,
      )
    : Array.from(value);
}

function browserSplitOverlongToken(
  ctx: CanvasRenderingContext2D,
  token: string,
  maxWidth: number,
): string[] {
  if (ctx.measureText(token).width <= maxWidth) return [token];
  const chunks: string[] = [];
  let current = '';
  for (const unit of browserGraphemes(token)) {
    const candidate = current + unit;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      chunks.push(current);
      current = unit;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [token];
}

function browserWrappedLines(
  ctx: CanvasRenderingContext2D,
  props: VisualTextNodeProps,
  pxLineHeight: number,
): string[] {
  const maxWidth = props.layout?.maxWidth ?? props.maxWidth;
  const maxHeight = props.layout?.maxHeight ?? props.maxHeight;

  if (maxWidth === undefined) {
    const explicit = props.text.split('\n');
    if (maxHeight === undefined) return explicit.length ? explicit : [''];
    const maxLines = Math.max(0, Math.floor(maxHeight / pxLineHeight));
    return explicit.slice(0, maxLines);
  }

  const maxLines =
    maxHeight === undefined
      ? Infinity
      : Math.max(0, Math.floor(maxHeight / pxLineHeight));
  if (maxLines === 0) return [];

  const output: string[] = [];
  for (const explicitLine of props.text.split('\n')) {
    if (output.length >= maxLines) break;
    if (explicitLine.length === 0) {
      output.push('');
      continue;
    }

    const tokens = explicitLine.trim().split(/\s+/u).filter(Boolean);
    if (!tokens.length) {
      output.push('');
      continue;
    }

    let current = '';
    for (const token of tokens) {
      for (const piece of browserSplitOverlongToken(ctx, token, maxWidth)) {
        const candidate = current ? current + ' ' + piece : piece;
        if (current && ctx.measureText(candidate).width > maxWidth) {
          output.push(current);
          if (output.length >= maxLines) return output;
          current = piece;
        } else {
          current = candidate;
        }
      }
    }
    if (current && output.length < maxLines) output.push(current);
  }
  return output;
}

function browserResolveCurve(
  width: number,
  props: VisualTextNodeProps,
): { width: number; extraHeight: number } | null {
  const curve = props.textOnCurve;
  if (!curve || curve.sweepAngle <= 0 || curve.sweepAngle >= 360) return null;
  const thetaUser = (curve.sweepAngle * Math.PI) / 180;
  const fitRadius = thetaUser > 0 ? width / thetaUser : width;
  const mode = curve.layoutMode ?? 'clamp';
  let radius = fitRadius;
  let theta = thetaUser;
  if (mode === 'fit') {
    radius = fitRadius;
  } else if (mode === 'override') {
    radius = curve.radius ?? fitRadius;
    const minTheta = radius > 0 ? width / radius : thetaUser;
    theta = Math.max(thetaUser, minTheta);
  } else {
    radius = curve.radius != null ? Math.max(curve.radius, fitRadius) : fitRadius;
  }
  const chord = 2 * radius * Math.sin(theta / 2);
  const sagitta = radius * (1 - Math.cos(theta / 2));
  return { width: chord, extraHeight: sagitta };
}

export function measureVisualTextInBrowser(
  props: VisualTextNodeProps,
): VisualTextMetrics | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(props.measurementCanvas?.width ?? 1));
  canvas.height = Math.max(1, Math.round(props.measurementCanvas?.height ?? 1));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const size = props.font?.size ?? props.fontSize ?? 16;
  const family =
    props.font?.name ??
    props.fontName ??
    props.font?.family ??
    props.fontFamily ??
    'Arial';
  // Mirror runtime typography precedence in this explicitly approximate browser view.
  const weight = props.font?.weight ?? ((props.decorations?.bold ?? props.bold ?? props.isBold) ? 'bold' : 'normal');
  const style = props.font?.style ?? ((props.decorations?.italic ?? props.italic) ? 'italic' : 'normal');
  const lineHeightMultiplier = props.layout?.lineHeight ?? props.lineHeight ?? 1.4;
  const maxWidth = props.layout?.maxWidth ?? props.maxWidth;

  ctx.font = `${style} ${weight} ${size}px "${family}"`;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = String(props.layout?.letterSpacing ?? props.letterSpacing ?? 0) + 'px';
  }
  if ('wordSpacing' in ctx) {
    ctx.wordSpacing = String(props.layout?.wordSpacing ?? props.wordSpacing ?? 0) + 'px';
  }

  const pxLineHeight = lineHeightMultiplier * size;
  const lines = browserWrappedLines(ctx, props, pxLineHeight);
  const native = lines.map((line) => ctx.measureText(line));
  const widths = native.map((metric) => metric.width);
  const measuredWidth = widths.reduce((max, value) => Math.max(max, value), 0);
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
    alphabeticBaseline:
      'alphabeticBaseline' in first ? Number(first.alphabeticBaseline) : undefined,
    emHeightAscent:
      'emHeightAscent' in first ? Number(first.emHeightAscent) : undefined,
    emHeightDescent:
      'emHeightDescent' in first ? Number(first.emHeightDescent) : undefined,
    hangingBaseline:
      'hangingBaseline' in first ? Number(first.hangingBaseline) : undefined,
    ideographicBaseline:
      'ideographicBaseline' in first ? Number(first.ideographicBaseline) : undefined,
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
        width: measuredWidth,
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
          alphabeticBaseline:
            'alphabeticBaseline' in metric ? Number(metric.alphabeticBaseline) : undefined,
          emHeightAscent:
            'emHeightAscent' in metric ? Number(metric.emHeightAscent) : undefined,
          emHeightDescent:
            'emHeightDescent' in metric ? Number(metric.emHeightDescent) : undefined,
          hangingBaseline:
            'hangingBaseline' in metric ? Number(metric.hangingBaseline) : undefined,
          ideographicBaseline:
            'ideographicBaseline' in metric ? Number(metric.ideographicBaseline) : undefined,
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
    centerX: measuredWidth / 2,
    centerY: (Math.max(1, lines.length) * pxLineHeight) / 2,
  };


  if (props.textOnCurve && result.lineCount === 1) {
    const curved = browserResolveCurve(measuredWidth, props);
    if (curved) {
      result.width = curved.width;
      result.height = metricBase.height + curved.extraHeight;
      result.totalHeight = result.height;
      result.centerX = result.width / 2;
      result.centerY = result.height / 2;
    }
  }

  if (props.includeCharMetrics) {
    const SegmenterCtor = (
      Intl as typeof Intl & {
        Segmenter?: new (
          locales?: string | string[],
          options?: { granularity?: 'grapheme' },
        ) => { segment(input: string): Iterable<{ segment: string }> };
      }
    ).Segmenter;
    const units = SegmenterCtor
      ? Array.from(
          new SegmenterCtor(undefined, { granularity: 'grapheme' }).segment(props.text),
          (entry) => entry.segment,
        )
      : Array.from(props.text);
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
