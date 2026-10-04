import type {
  VisualBlendMode,
  VisualCreateImageOptions,
  VisualImageFilter,
  VisualImageNodeProps,
  VisualImageSource,
  VisualNode,
  VisualProject,
  VisualProjectIssue,
  VisualShapeProperties,
  VisualShapeType,
  VisualValue,
} from './model';
import { validateVisualImageUtilities } from './image-utility-contract';

export const IMAGE_SHAPE_TYPES: readonly VisualShapeType[] = [
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
] as const;

export const IMAGE_FILTER_TYPES: readonly VisualImageFilter['type'][] = [
  'gaussianBlur',
  'motionBlur',
  'radialBlur',
  'sharpen',
  'noise',
  'grain',
  'edgeDetection',
  'emboss',
  'invert',
  'grayscale',
  'sepia',
  'pixelate',
  'brightness',
  'contrast',
  'saturation',
  'hueShift',
  'posterize',
] as const;

export type ImageFilterNumericKey =
  | 'intensity'
  | 'angle'
  | 'centerX'
  | 'centerY'
  | 'value'
  | 'levels'
  | 'size'
  | 'x'
  | 'y'
  | 'width'
  | 'height';

export type ImageFilterFieldSpec = {
  key: ImageFilterNumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  suffix?: string;
  integer?: boolean;
  help: string;
};

type ImageFilterStaticFieldSpec = Omit<ImageFilterFieldSpec, 'max' | 'defaultValue'> & {
  max:
    | number
    | 'width'
    | 'height'
    | 'maxDimension'
    | 'widthMinusOne'
    | 'heightMinusOne';
  defaultValue:
    | number
    | 'halfWidth'
    | 'halfHeight'
    | 'fullWidth'
    | 'fullHeight';
};

export const IMAGE_FILTER_PARAMETERLESS_TYPES = [
  'invert',
  'grayscale',
  'sepia',
] as const satisfies readonly VisualImageFilter['type'][];

const IMAGE_FILTER_FIELD_SPECS: Record<
  VisualImageFilter['type'],
  readonly ImageFilterStaticFieldSpec[]
> = {
  gaussianBlur: [
    { key: 'intensity', label: 'Blur radius', min: 0, max: 100, step: 0.5, defaultValue: 4, suffix: 'px', help: '0–100 px' },
  ],
  motionBlur: [
    { key: 'intensity', label: 'Strength', min: 0, max: 101, step: 1, defaultValue: 9, help: '0–101' },
    { key: 'angle', label: 'Angle', min: -3600, max: 3600, step: 1, defaultValue: 0, suffix: '°', help: '−3600° to 3600°' },
  ],
  radialBlur: [
    { key: 'intensity', label: 'Strength', min: 0, max: 50, step: 0.5, defaultValue: 8, help: '0–50' },
    { key: 'centerX', label: 'Center X', min: 0, max: 'width', step: 1, defaultValue: 'halfWidth', suffix: 'px', help: '0 to canvas width' },
    { key: 'centerY', label: 'Center Y', min: 0, max: 'height', step: 1, defaultValue: 'halfHeight', suffix: 'px', help: '0 to canvas height' },
  ],
  sharpen: [
    { key: 'intensity', label: 'Strength', min: 0, max: 10, step: 0.1, defaultValue: 1, help: '0–10' },
  ],
  noise: [
    { key: 'intensity', label: 'Intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.1, help: '0–1' },
  ],
  grain: [
    { key: 'intensity', label: 'Intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.1, help: '0–1' },
  ],
  edgeDetection: [
    { key: 'intensity', label: 'Strength', min: 0, max: 10, step: 0.1, defaultValue: 1, help: '0–10' },
  ],
  emboss: [
    { key: 'intensity', label: 'Strength', min: 0, max: 10, step: 0.1, defaultValue: 1, help: '0–10' },
  ],
  invert: [],
  grayscale: [],
  sepia: [],
  pixelate: [
    { key: 'size', label: 'Block size', min: 1, max: 'maxDimension', step: 1, defaultValue: 8, suffix: 'px', integer: true, help: 'integer 1 to the larger canvas dimension' },
    { key: 'x', label: 'Region X', min: 0, max: 'widthMinusOne', step: 1, defaultValue: 0, suffix: 'px', integer: true, help: 'integer 0 to width − 1' },
    { key: 'y', label: 'Region Y', min: 0, max: 'heightMinusOne', step: 1, defaultValue: 0, suffix: 'px', integer: true, help: 'integer 0 to height − 1' },
    { key: 'width', label: 'Region width', min: 1, max: 'width', step: 1, defaultValue: 'fullWidth', suffix: 'px', integer: true, help: 'integer 1 to remaining width' },
    { key: 'height', label: 'Region height', min: 1, max: 'height', step: 1, defaultValue: 'fullHeight', suffix: 'px', integer: true, help: 'integer 1 to remaining height' },
  ],
  brightness: [
    { key: 'value', label: 'Brightness', min: -100, max: 100, step: 1, defaultValue: 10, suffix: '%', help: '−100% to 100%' },
  ],
  contrast: [
    { key: 'value', label: 'Contrast', min: -100, max: 100, step: 1, defaultValue: 10, suffix: '%', help: '−100% to 100%' },
  ],
  saturation: [
    { key: 'value', label: 'Saturation', min: -100, max: 100, step: 1, defaultValue: 10, suffix: '%', help: '−100% to 100%' },
  ],
  hueShift: [
    { key: 'value', label: 'Hue shift', min: -3600, max: 3600, step: 1, defaultValue: 30, suffix: '°', help: '−3600° to 3600°' },
  ],
  posterize: [
    { key: 'levels', label: 'Levels', min: 2, max: 256, step: 1, defaultValue: 6, integer: true, help: 'integer 2–256' },
  ],
};

export function imageFilterFieldSpecs(
  type: VisualImageFilter['type'],
  width: number,
  height: number,
  filter?: VisualImageFilter,
): readonly ImageFilterFieldSpec[] {
  const safeWidth = Math.max(1, Number.isFinite(width) ? Math.floor(width) : 1);
  const safeHeight = Math.max(1, Number.isFinite(height) ? Math.floor(height) : 1);
  const startX =
    type === 'pixelate' && typeof filter?.x === 'number' && Number.isFinite(filter.x)
      ? Math.max(0, Math.min(safeWidth - 1, Math.floor(filter.x)))
      : 0;
  const startY =
    type === 'pixelate' && typeof filter?.y === 'number' && Number.isFinite(filter.y)
      ? Math.max(0, Math.min(safeHeight - 1, Math.floor(filter.y)))
      : 0;

  return IMAGE_FILTER_FIELD_SPECS[type].map((field) => {
    let max =
      field.max === 'width'
        ? safeWidth
        : field.max === 'height'
          ? safeHeight
          : field.max === 'maxDimension'
            ? Math.max(safeWidth, safeHeight)
            : field.max === 'widthMinusOne'
              ? Math.max(0, safeWidth - 1)
              : field.max === 'heightMinusOne'
                ? Math.max(0, safeHeight - 1)
                : field.max;
    let defaultValue =
      field.defaultValue === 'halfWidth'
        ? safeWidth / 2
        : field.defaultValue === 'halfHeight'
          ? safeHeight / 2
          : field.defaultValue === 'fullWidth'
            ? safeWidth
            : field.defaultValue === 'fullHeight'
              ? safeHeight
              : field.defaultValue;

    if (type === 'pixelate' && field.key === 'width') {
      max = Math.max(1, safeWidth - startX);
      defaultValue = max;
    }
    if (type === 'pixelate' && field.key === 'height') {
      max = Math.max(1, safeHeight - startY);
      defaultValue = max;
    }

    return { ...field, max, defaultValue };
  });
}

export function defaultVisualImageFilter(
  type: VisualImageFilter['type'],
  width = 100,
  height = 100,
): VisualImageFilter {
  const filter: VisualImageFilter = { type };
  for (const field of imageFilterFieldSpecs(type, width, height)) {
    (filter as unknown as Record<string, number | string>)[field.key] = field.defaultValue;
  }
  return filter;
}

export function clampVisualImageFilterValue(
  type: VisualImageFilter['type'],
  key: ImageFilterNumericKey,
  value: number,
  width: number,
  height: number,
  filter?: VisualImageFilter,
): number {
  const field = imageFilterFieldSpecs(type, width, height, filter).find(
    (item) => item.key === key,
  );
  if (!field) return value;
  const finiteValue = Number.isFinite(value) ? value : field.defaultValue;
  const bounded = Math.max(field.min, Math.min(field.max, finiteValue));
  return field.integer ? Math.round(bounded) : bounded;
}

export function updateVisualImageFilterValue(
  filter: VisualImageFilter,
  key: ImageFilterNumericKey,
  value: number,
  width: number,
  height: number,
): VisualImageFilter {
  const next: VisualImageFilter = {
    ...filter,
    [key]: clampVisualImageFilterValue(
      filter.type,
      key,
      value,
      width,
      height,
      filter,
    ),
  };

  if (next.type === 'pixelate') {
    if (key === 'x' || key === 'width') {
      const currentWidth =
        typeof next.width === 'number'
          ? next.width
          : Math.max(1, width - (next.x ?? 0));
      next.width = clampVisualImageFilterValue(
        'pixelate',
        'width',
        currentWidth,
        width,
        height,
        next,
      );
    }
    if (key === 'y' || key === 'height') {
      const currentHeight =
        typeof next.height === 'number'
          ? next.height
          : Math.max(1, height - (next.y ?? 0));
      next.height = clampVisualImageFilterValue(
        'pixelate',
        'height',
        currentHeight,
        width,
        height,
        next,
      );
    }
  }

  return next;
}

function validateTypedFilterFields(
  item: Record<string, unknown>,
  type: VisualImageFilter['type'],
  path: string,
  issues: VisualProjectIssue[],
  width: number,
  height: number,
) {
  const specs = imageFilterFieldSpecs(
    type,
    width,
    height,
    item as unknown as VisualImageFilter,
  );
  for (const field of specs) {
    const current = item[field.key];
    if (current === undefined) continue;
    if (
      !finite(current) ||
      current < field.min ||
      current > field.max ||
      (field.integer && !Number.isInteger(current))
    ) {
      issue(
        issues,
        'image-filter-range',
        path + '.' + field.key,
        field.label + ' must be ' + field.help + '.',
      );
    }
  }

  const allowed = new Set<string>(['type', ...specs.map((field) => field.key)]);
  for (const key of ['intensity','radius','angle','centerX','centerY','value','levels','size','x','y','width','height']) {
    if (item[key] !== undefined && !allowed.has(key)) {
      issue(
        issues,
        'image-filter-parameter',
        path + '.' + key,
        type + ' does not use the ' + key + ' parameter.',
      );
    }
  }
}

export const IMAGE_BLEND_MODES: readonly VisualBlendMode[] = [
  'source-over','source-in','source-out','source-atop',
  'destination-over','destination-in','destination-out','destination-atop',
  'lighter','copy','xor','multiply','screen','overlay','darken','lighten',
  'color-dodge','color-burn','hard-light','soft-light','difference','exclusion',
  'hue','saturation','color','luminosity',
] as const;

export type ImageAuthoringSurface =
  | 'Transform'
  | 'Style'
  | 'Effects'
  | 'Data'
  | 'Advanced';

export type ImageReverseSyncPolicy =
  | 'canonical-literal'
  | 'stable-source'
  | 'generated-buffer';

export type ImageRuntimePropertyKey =
  | keyof Omit<VisualImageNodeProps, 'createOptions'>
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'opacity';

export const IMAGE_AUTHORING_CLASSIFICATION = {
  source: { surface: 'Data', reverse: 'stable-source' },
  x: { surface: 'Transform', reverse: 'canonical-literal' },
  y: { surface: 'Transform', reverse: 'canonical-literal' },
  width: { surface: 'Transform', reverse: 'canonical-literal' },
  height: { surface: 'Transform', reverse: 'canonical-literal' },
  inherit: { surface: 'Style', reverse: 'canonical-literal' },
  fit: { surface: 'Style', reverse: 'canonical-literal' },
  align: { surface: 'Style', reverse: 'canonical-literal' },
  rotation: { surface: 'Transform', reverse: 'canonical-literal' },
  opacity: { surface: 'Transform', reverse: 'canonical-literal' },
  blur: { surface: 'Effects', reverse: 'canonical-literal' },
  blendMode: { surface: 'Effects', reverse: 'canonical-literal' },
  borderRadius: { surface: 'Style', reverse: 'canonical-literal' },
  borderPosition: { surface: 'Advanced', reverse: 'canonical-literal' },
  filters: { surface: 'Effects', reverse: 'canonical-literal' },
  filterIntensity: { surface: 'Effects', reverse: 'canonical-literal' },
  filterOrder: { surface: 'Effects', reverse: 'canonical-literal' },
  mask: { surface: 'Effects', reverse: 'stable-source' },
  clipPath: { surface: 'Advanced', reverse: 'canonical-literal' },
  distortion: { surface: 'Advanced', reverse: 'canonical-literal' },
  meshWarp: { surface: 'Advanced', reverse: 'canonical-literal' },
  effects: { surface: 'Advanced', reverse: 'canonical-literal' },
  shape: { surface: 'Style', reverse: 'canonical-literal' },
  shadow: { surface: 'Effects', reverse: 'canonical-literal' },
  stroke: { surface: 'Style', reverse: 'canonical-literal' },
  boxBackground: { surface: 'Style', reverse: 'canonical-literal' },
  utilityStack: { surface: 'Effects', reverse: 'canonical-literal' },
  utilityAnalyses: { surface: 'Data', reverse: 'canonical-literal' },
  painterOpts: { surface: 'Advanced', reverse: 'canonical-literal' },
} as const satisfies Record<
  ImageRuntimePropertyKey,
  { surface: ImageAuthoringSurface; reverse: ImageReverseSyncPolicy }
>;

export const CREATE_IMAGE_OPTIONS_CLASSIFICATION = {
  isGrouped: { surface: 'Advanced', reverse: 'canonical-literal' },
  groupTransform: { surface: 'Advanced', reverse: 'canonical-literal' },
} as const satisfies Record<
  keyof VisualCreateImageOptions,
  { surface: ImageAuthoringSurface; reverse: ImageReverseSyncPolicy }
>;

export const GROUP_TRANSFORM_CLASSIFICATION = {
  rotation: 'Advanced',
  translateX: 'Advanced',
  translateY: 'Advanced',
  scaleX: 'Advanced',
  scaleY: 'Advanced',
  pivotX: 'Advanced',
  pivotY: 'Advanced',
  opacity: 'Advanced',
  blur: 'Advanced',
  blendMode: 'Advanced',
  borderRadius: 'Advanced',
  borderPosition: 'Advanced',
  filters: 'Advanced',
  filterIntensity: 'Advanced',
  filterOrder: 'Advanced',
  mask: 'Advanced',
  clipPath: 'Advanced',
  distortion: 'Advanced',
  meshWarp: 'Advanced',
  effects: 'Advanced',
  shadow: 'Advanced',
  stroke: 'Advanced',
  boxBackground: 'Advanced',
} as const satisfies Record<
  keyof NonNullable<VisualCreateImageOptions['groupTransform']>,
  ImageAuthoringSurface
>;

export const SHAPE_PROPERTIES_CLASSIFICATION = {
  fill: 'Style',
  color: 'Style',
  gradient: 'Advanced',
  points: 'Advanced',
  radius: 'Advanced',
  sides: 'Style',
  innerRadius: 'Style',
  outerRadius: 'Style',
  startAngle: 'Style',
  endAngle: 'Style',
  centerX: 'Advanced',
  centerY: 'Advanced',
} as const satisfies Record<
  keyof VisualShapeProperties,
  ImageAuthoringSurface
>;

export const IMAGE_FITS = ['fill', 'contain', 'cover'] as const;
export const IMAGE_ALIGNS = [
  'center','top','bottom','left','right',
  'top-left','top-right','bottom-left','bottom-right',
] as const;

function issue(
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

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function visualImageProps(node: VisualNode): VisualImageNodeProps {
  return node.props as unknown as VisualImageNodeProps;
}

export function imagePropsRecord(props: VisualImageNodeProps): Record<string, VisualValue> {
  return props as unknown as Record<string, VisualValue>;
}

export function isGeneratedImageSource(
  source: VisualImageSource,
): source is { $generated: string } {
  return Boolean(
    source &&
      typeof source === 'object' &&
      !Array.isArray(source) &&
      typeof (source as { $generated?: unknown }).$generated === 'string',
  );
}

export function defaultShapeProperties(type: VisualShapeType): VisualShapeProperties {
  if (type === 'star') {
    return { fill: true, color: '#6f86ff', innerRadius: 36, outerRadius: 72 };
  }
  if (type === 'polygon') {
    return { fill: true, color: '#6f86ff', sides: 6 };
  }
  if (type === 'arc' || type === 'pieSlice') {
    return {
      fill: true,
      color: '#6f86ff',
      innerRadius: type === 'arc' ? 34 : 0,
      outerRadius: 72,
      startAngle: 0,
      endAngle: Math.PI * 1.5,
    };
  }
  return { fill: true, color: '#6f86ff' };
}

export function defaultImageNodeProps(source = ''): VisualImageNodeProps {
  return {
    source,
    fit: 'cover',
    align: 'center',
    blur: 0,
    blendMode: 'source-over',
    borderRadius: 0,
    filterIntensity: 1,
    filterOrder: 'post',
  };
}

export function defaultShapeNodeProps(type: VisualShapeType): VisualImageNodeProps {
  return {
    source: type,
    blendMode: 'source-over',
    borderRadius: 0,
    shape: defaultShapeProperties(type),
  };
}

export function defaultCreateImageOptions(): VisualCreateImageOptions {
  return { isGrouped: false };
}

function validateSource(
  project: VisualProject,
  source: unknown,
  path: string,
  issues: VisualProjectIssue[],
) {
  if (typeof source === 'string') {
    if (!source.trim()) issue(issues, 'image-source', path, 'Image source must not be empty.');
    return;
  }
  const object = record(source);
  if (object && typeof object.$ref === 'string') {
    return;
  }
  if (!object || typeof object.$generated !== 'string' || !object.$generated.trim()) {
    issue(issues, 'image-source', path, 'Image source must be a string, asset reference, or generated-buffer reference.');
    return;
  }
  if (object.$generated !== 'document_canvas' && !project.document.nodes[object.$generated]) {
    issue(issues, 'image-generated-source', path, 'Generated-buffer source must reference an existing node.');
  }
}

function validateFilter(
  value: unknown,
  path: string,
  issues: VisualProjectIssue[],
  width = 4096,
  height = 4096,
) {
  const item = record(value);
  if (!item || !IMAGE_FILTER_TYPES.includes(item.type as VisualImageFilter['type'])) {
    issue(issues, 'image-filter-type', path + '.type', 'Unsupported image filter type.');
    return;
  }
  validateTypedFilterFields(
    item,
    item.type as VisualImageFilter['type'],
    path,
    issues,
    width,
    height,
  );
}

function validateStrokeShadowLike(
  value: unknown,
  path: string,
  issues: VisualProjectIssue[],
) {
  if (value === undefined) return;
  const object = record(value);
  if (!object) {
    issue(issues, 'image-effect-object', path, 'Effect configuration must be an object.');
    return;
  }
  for (const key of ['width','position','blur','opacity','offsetX','offsetY']) {
    if (object[key] !== undefined && !finite(object[key])) {
      issue(issues, 'image-effect-number', path + '.' + key, 'Effect values must be finite numbers.');
    }
  }
  if (finite(object.opacity) && (object.opacity < 0 || object.opacity > 1)) {
    issue(issues, 'image-effect-opacity', path + '.opacity', 'Effect opacity must be between 0 and 1.');
  }
}

export function validateVisualImageNode(
  project: VisualProject,
  node: VisualNode,
  issues: VisualProjectIssue[],
) {
  if (node.kind !== 'image' && node.kind !== 'shape') return;
  const path = 'document.nodes.' + node.id;
  const props = visualImageProps(node);

  validateSource(project, props.source, path + '.props.source', issues);

  if (
    props.painterOpts?.resolveAssetRefs !== undefined &&
    typeof props.painterOpts.resolveAssetRefs !== 'boolean'
  ) {
    issue(
      issues,
      'image-painter-opts-resolve-asset-refs',
      path + '.props.painterOpts.resolveAssetRefs',
      'createImage painterOpts.resolveAssetRefs must be boolean when provided.',
    );
  }

  if (node.kind === 'shape') {
    if (typeof props.source !== 'string' || !IMAGE_SHAPE_TYPES.includes(props.source as VisualShapeType)) {
      issue(issues, 'shape-source', path + '.props.source', 'Shape nodes require a built-in Apexify shape source.');
    }
  }

  if (props.fit !== undefined && !IMAGE_FITS.includes(props.fit)) {
    issue(issues, 'image-fit', path + '.props.fit', 'Unsupported image fit mode.');
  }
  if (props.align !== undefined && !IMAGE_ALIGNS.includes(props.align)) {
    issue(issues, 'image-align', path + '.props.align', 'Unsupported image alignment.');
  }
  if (props.blendMode !== undefined && !IMAGE_BLEND_MODES.includes(props.blendMode)) {
    issue(issues, 'image-blend', path + '.props.blendMode', 'Unsupported image blend mode.');
  }
  if (props.blur !== undefined && (!finite(props.blur) || props.blur < 0)) {
    issue(issues, 'image-blur', path + '.props.blur', 'Image blur must be non-negative.');
  }
  if (
    props.borderRadius !== undefined &&
    props.borderRadius !== 'circular' &&
    (!finite(props.borderRadius) || props.borderRadius < 0)
  ) {
    issue(issues, 'image-radius', path + '.props.borderRadius', 'Image radius must be non-negative or circular.');
  }
  if (
    props.filterIntensity !== undefined &&
    (!finite(props.filterIntensity) || props.filterIntensity < 0)
  ) {
    issue(
      issues,
      'image-filter-intensity',
      path + '.props.filterIntensity',
      'Filter intensity multiplier must be a non-negative finite number.',
    );
  }
  if (props.filterOrder !== undefined && props.filterOrder !== 'pre' && props.filterOrder !== 'post') {
    issue(issues, 'image-filter-order', path + '.props.filterOrder', 'Filter order must be pre or post.');
  }

  const filterMultiplier =
    props.filterIntensity === undefined ? 1 : props.filterIntensity;
  if (finite(filterMultiplier) && filterMultiplier >= 0) {
    props.filters?.forEach((filter, index) => {
      const specs = imageFilterFieldSpecs(
        filter.type,
        node.transform?.width ?? project.document.width,
        node.transform?.height ?? project.document.height,
      );
      for (const field of specs) {
        if (field.key !== 'intensity' && field.key !== 'value') continue;
        const current = filter[field.key];
        if (typeof current !== 'number' || !Number.isFinite(current)) continue;
        const effective = current * filterMultiplier;
        if (effective < field.min || effective > field.max) {
          issue(
            issues,
            'image-filter-effective-range',
            path + '.props.filters[' + index + '].' + field.key,
            field.label +
              ' becomes ' +
              effective +
              ' after filterIntensity and must stay ' +
              field.help +
              '.',
          );
        }
      }
    });
  }

  props.filters?.forEach((filter, index) =>
    validateFilter(
      filter,
      path + '.props.filters[' + index + ']',
      issues,
      node.transform?.width ?? project.document.width,
      node.transform?.height ?? project.document.height,
    ),
  );

  if (props.mask) validateSource(project, props.mask.source, path + '.props.mask.source', issues);

  props.clipPath?.forEach((point, index) => {
    if (!finite(point.x) || !finite(point.y)) {
      issue(issues, 'image-clip-point', path + '.props.clipPath[' + index + ']', 'Clip-path points must be finite.');
    }
  });

  if (props.distortion) {
    if (!['perspective','warp','bulge','pinch'].includes(props.distortion.type)) {
      issue(issues, 'image-distortion', path + '.props.distortion.type', 'Unsupported distortion type.');
    }
    if (props.distortion.intensity !== undefined && !finite(props.distortion.intensity)) {
      issue(issues, 'image-distortion-intensity', path + '.props.distortion.intensity', 'Distortion intensity must be finite.');
    }
  }

  if (props.meshWarp) {
    for (const key of ['gridX','gridY'] as const) {
      const value = props.meshWarp[key];
      if (value !== undefined && (!finite(value) || value < 1)) {
        issue(issues, 'image-mesh-grid', path + '.props.meshWarp.' + key, 'Mesh grid values must be positive.');
      }
    }
  }

  validateStrokeShadowLike(props.stroke, path + '.props.stroke', issues);
  validateStrokeShadowLike(props.shadow, path + '.props.shadow', issues);

  if (props.shape) {
    for (const key of ['radius','sides','innerRadius','outerRadius','startAngle','endAngle','centerX','centerY'] as const) {
      const value = props.shape[key];
      if (value !== undefined && !finite(value)) {
        issue(issues, 'shape-number', path + '.props.shape.' + key, 'Shape numeric values must be finite.');
      }
    }
    props.shape.points?.forEach((point, index) => {
      if (!finite(point.x) || !finite(point.y)) {
        issue(issues, 'shape-point', path + '.props.shape.points[' + index + ']', 'Shape points must be finite.');
      }
    });
  }

  if (props.createOptions?.groupTransform) {
    const group = props.createOptions.groupTransform;
    for (const key of ['rotation','translateX','translateY','scaleX','scaleY','pivotX','pivotY','opacity','blur','filterIntensity'] as const) {
      const value = group[key];
      if (value !== undefined && !finite(value)) {
        issue(issues, 'image-group-number', path + '.props.createOptions.groupTransform.' + key, 'Group transform values must be finite.');
      }
    }
    group.filters?.forEach((filter, index) =>
      validateFilter(filter, path + '.props.createOptions.groupTransform.filters[' + index + ']', issues),
    );
  }

  validateVisualImageUtilities(project, node, issues);
}
