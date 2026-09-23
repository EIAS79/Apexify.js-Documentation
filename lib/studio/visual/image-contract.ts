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
) {
  const item = record(value);
  if (!item || !IMAGE_FILTER_TYPES.includes(item.type as VisualImageFilter['type'])) {
    issue(issues, 'image-filter-type', path + '.type', 'Unsupported image filter type.');
    return;
  }
  for (const key of ['intensity','radius','angle','centerX','centerY','value','levels','size']) {
    if (item[key] !== undefined && !finite(item[key])) {
      issue(issues, 'image-filter-number', path + '.' + key, 'Image filter values must be finite numbers.');
    }
  }
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
  if (props.filterIntensity !== undefined && !finite(props.filterIntensity)) {
    issue(issues, 'image-filter-intensity', path + '.props.filterIntensity', 'Filter intensity must be finite.');
  }
  if (props.filterOrder !== undefined && props.filterOrder !== 'pre' && props.filterOrder !== 'post') {
    issue(issues, 'image-filter-order', path + '.props.filterOrder', 'Filter order must be pre or post.');
  }
  props.filters?.forEach((filter, index) =>
    validateFilter(filter, path + '.props.filters[' + index + ']', issues),
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
