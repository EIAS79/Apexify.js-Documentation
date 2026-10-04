import type {
  VisualBackgroundLayer,
  VisualCanvasConfig,
  VisualGradient,
  VisualPatternGradient,
  VisualPatternOptions,
  VisualProjectIssue,
  VisualImageFilter,
} from './model';
import {
  IMAGE_FILTER_TYPES,
  imageFilterFieldSpecs,
} from './image-contract';

export const CANVAS_BLEND_MODES = [
  'source-over','source-in','source-out','source-atop',
  'destination-over','destination-in','destination-out','destination-atop',
  'lighter','copy','xor','multiply','screen','overlay','darken','lighten',
  'color-dodge','color-burn','hard-light','soft-light','difference','exclusion',
  'hue','saturation','color','luminosity',
] as const;

export const CANVAS_PATTERN_TYPES = [
  'grid','dots','diagonal','stripes','waves','crosses','hexagons',
  'checkerboard','diamonds','triangles','stars','polka','custom',
] as const;

export const CANVAS_ALIGNMENTS = [
  'center','top','bottom','left','right',
  'top-left','top-right','bottom-left','bottom-right',
] as const;

export const CANVAS_FITS = ['fill','contain','cover'] as const;
export const CANVAS_PATTERN_REPEATS = ['repeat','repeat-x','repeat-y','no-repeat'] as const;
export const CANVAS_GRADIENT_REPEATS = ['repeat','reflect','no-repeat'] as const;

/** Pinned Apexify.js v6 default runtime limits used by STUDIO-PARITY-1. */
export const CANVAS_RUNTIME_LIMITS = {
  maxCanvasDimension: 16_384,
  maxTotalPixels: 67_108_864,
  maxCollectionItems: 2_048,
  maxBackgroundLayers: 128,
  maxFiltersPerOperation: 64,
} as const;

export function defaultCanvasGradient(): VisualGradient {
  return {
    type: 'linear',
    startX: 0,
    startY: 0,
    endX: 1440,
    endY: 0,
    colors: [
      { stop: 0, color: '#0b1730' },
      { stop: 1, color: '#4f46e5' },
    ],
  };
}

export function defaultCanvasPattern(): VisualPatternOptions {
  return {
    type: 'grid',
    color: '#315078',
    secondaryColor: '#152943',
    opacity: 1,
    size: 1,
    spacing: 32,
    rotation: 0,
    blendMode: 'source-over',
  };
}

export function defaultBackgroundLayer(type: VisualBackgroundLayer['type']): VisualBackgroundLayer {
  if (type === 'color') return { type, value: '#172554', opacity: 1 };
  if (type === 'gradient') return { type, value: defaultCanvasGradient(), opacity: 1 };
  if (type === 'image') return { type, source: '', fit: 'fill', align: 'center', opacity: 1 };
  if (type === 'pattern') return { type, source: '', repeat: 'repeat', opacity: 1 };
  if (type === 'presetPattern') return { type, pattern: defaultCanvasPattern(), opacity: 1 };
  return { type: 'noise', intensity: 0.04 };
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function issue(
  issues: VisualProjectIssue[],
  code: string,
  path: string,
  message: string,
) {
  issues.push({ severity: 'error', code, path, message });
}

function validateOpacity(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
) {
  if (value !== undefined && (!finite(value) || value < 0 || value > 1)) {
    issue(issues, 'canvas-opacity', path, 'Opacity must be between 0 and 1.');
  }
}

function validateString(
  issues: VisualProjectIssue[],
  value: unknown,
  path: string,
  maxLength: number,
) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.includes('\0') ||
    value.length > maxLength
  ) {
    issue(
      issues,
      'canvas-string',
      path,
      'Value must be a non-empty string without NUL bytes and at most ' +
        String(maxLength) +
        ' characters.',
    );
  }
}

function validateFiniteFields(
  issues: VisualProjectIssue[],
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
) {
  for (const key of keys) {
    const current = value[key];
    if (current !== undefined && !finite(current)) {
      issue(
        issues,
        'canvas-number',
        path + '.' + key,
        'Numeric values must be finite.',
      );
    }
  }
}

function validateImageBackgroundOptions(
  issues: VisualProjectIssue[],
  background: {
    inherit?: unknown;
    fit?: unknown;
    align?: unknown;
    filters?: unknown;
    opacity?: unknown;
  },
  path: string,
  width: number,
  height: number,
) {
  validateOpacity(issues, background.opacity, path + '.opacity');
  if (background.inherit !== undefined && typeof background.inherit !== 'boolean') {
    issue(issues, 'canvas-background-inherit', path + '.inherit', 'Background inherit must be boolean.');
  }
  if (
    background.fit !== undefined &&
    !CANVAS_FITS.includes(background.fit as (typeof CANVAS_FITS)[number])
  ) {
    issue(issues, 'canvas-background-fit', path + '.fit', 'Unsupported background fit mode.');
  }
  if (
    background.align !== undefined &&
    !CANVAS_ALIGNMENTS.includes(background.align as (typeof CANVAS_ALIGNMENTS)[number])
  ) {
    issue(issues, 'canvas-background-align', path + '.align', 'Unsupported background alignment.');
  }
  if (background.filters !== undefined && !Array.isArray(background.filters)) {
    issue(issues, 'canvas-background-filters', path + '.filters', 'Background filters must be an array.');
    return;
  }
  if (!Array.isArray(background.filters)) return;
  if (background.filters.length > CANVAS_RUNTIME_LIMITS.maxFiltersPerOperation) {
    issue(
      issues,
      'canvas-background-filter-limit',
      path + '.filters',
      'Background filters exceed the Apexify runtime limit of ' +
        String(CANVAS_RUNTIME_LIMITS.maxFiltersPerOperation) +
        '.',
    );
  }

  background.filters.forEach((rawFilter, index) => {
    const filterPath = path + '.filters[' + index + ']';
    if (!rawFilter || typeof rawFilter !== 'object' || Array.isArray(rawFilter)) {
      issue(issues, 'canvas-background-filter-object', filterPath, 'Background filter must be an object.');
      return;
    }
    const filter = rawFilter as Record<string, unknown>;
    const type = filter.type as VisualImageFilter['type'];
    if (!IMAGE_FILTER_TYPES.includes(type)) {
      issue(issues, 'canvas-background-filter-type', filterPath + '.type', 'Unsupported image filter type.');
      return;
    }
    const specs = imageFilterFieldSpecs(
      type,
      width,
      height,
      filter as unknown as VisualImageFilter,
    );
    for (const field of specs) {
      const current = filter[field.key];
      if (current === undefined) continue;
      if (
        !finite(current) ||
        current < field.min ||
        current > field.max ||
        (field.integer && !Number.isInteger(current))
      ) {
        issue(
          issues,
          'canvas-background-filter-range',
          filterPath + '.' + field.key,
          field.label + ' must be ' + field.help + '.',
        );
      }
    }
    const allowed = new Set<string>(['type', ...specs.map((field) => field.key)]);
    for (const key of ['intensity','radius','angle','centerX','centerY','value','levels','size','x','y','width','height']) {
      if (filter[key] !== undefined && !allowed.has(key)) {
        issue(
          issues,
          'canvas-background-filter-parameter',
          filterPath + '.' + key,
          type + ' does not use the ' + key + ' parameter.',
        );
      }
    }
  });
}

function validateGradient(
  issues: VisualProjectIssue[],
  gradient: VisualGradient | undefined,
  path: string,
) {
  if (!gradient) return;
  if (!['linear','radial','conic'].includes(gradient.type)) {
    issue(issues, 'canvas-gradient-type', path + '.type', 'Unsupported gradient type.');
  }

  validateFiniteFields(
    issues,
    gradient as unknown as Record<string, unknown>,
    [
      'startX','startY','endX','endY','startRadius','endRadius',
      'centerX','centerY','startAngle','rotate','pivotX','pivotY',
    ],
    path,
  );

  if (!Array.isArray(gradient.colors) || gradient.colors.length < 2) {
    issue(issues, 'canvas-gradient-stops', path + '.colors', 'Gradient requires at least two color stops.');
    return;
  }
  if (gradient.colors.length > CANVAS_RUNTIME_LIMITS.maxCollectionItems) {
    issue(
      issues,
      'canvas-gradient-stop-limit',
      path + '.colors',
      'Gradient stops exceed the Apexify runtime collection limit of ' +
        String(CANVAS_RUNTIME_LIMITS.maxCollectionItems) +
        '.',
    );
  }

  let previousStop = -Infinity;
  gradient.colors.forEach((stop, index) => {
    if (!finite(stop.stop) || stop.stop < 0 || stop.stop > 1) {
      issue(issues, 'canvas-gradient-stop', path + `.colors[${index}].stop`, 'Gradient stop must be between 0 and 1.');
    }
    if (finite(stop.stop) && stop.stop < previousStop) {
      issue(
        issues,
        'canvas-gradient-stop-order',
        path + `.colors[${index}].stop`,
        'Gradient stops must be ordered by non-decreasing stop; duplicate stops are allowed.',
      );
    }
    if (finite(stop.stop)) previousStop = stop.stop;
    if (typeof stop.color !== 'string' || !stop.color.trim() || stop.color.includes('\0') || stop.color.length > 256) {
      issue(issues, 'canvas-gradient-color', path + `.colors[${index}].color`, 'Gradient color must be a non-empty string of at most 256 characters.');
    }
  });

  if (gradient.type === 'linear' || gradient.type === 'radial') {
    if (
      gradient.repeat !== undefined &&
      !CANVAS_GRADIENT_REPEATS.includes(
        gradient.repeat as (typeof CANVAS_GRADIENT_REPEATS)[number],
      )
    ) {
      issue(issues, 'canvas-gradient-repeat', path + '.repeat', 'Unsupported gradient repeat mode.');
    }
  }

  if (
    gradient.type === 'linear' &&
    gradient.startX !== undefined &&
    gradient.startY !== undefined &&
    gradient.endX !== undefined &&
    gradient.endY !== undefined &&
    gradient.startX === gradient.endX &&
    gradient.startY === gradient.endY
  ) {
    issue(
      issues,
      'canvas-gradient-geometry',
      path,
      'Linear gradient start and end points must not be identical.',
    );
  }

  if (gradient.type === 'radial') {
    if (gradient.startRadius !== undefined && gradient.startRadius < 0) {
      issue(issues, 'canvas-gradient-radius', path + '.startRadius', 'Radial start radius must be non-negative.');
    }
    if (gradient.endRadius !== undefined && gradient.endRadius < 0) {
      issue(issues, 'canvas-gradient-radius', path + '.endRadius', 'Radial end radius must be non-negative.');
    }
    if (
      gradient.startX !== undefined &&
      gradient.startY !== undefined &&
      gradient.startRadius !== undefined &&
      gradient.endX !== undefined &&
      gradient.endY !== undefined &&
      gradient.endRadius !== undefined &&
      gradient.startX === gradient.endX &&
      gradient.startY === gradient.endY &&
      gradient.startRadius === gradient.endRadius
    ) {
      issue(
        issues,
        'canvas-gradient-geometry',
        path,
        'Radial gradient start and end circles must not be identical.',
      );
    }
  }
}

function validatePatternGradient(
  issues: VisualProjectIssue[],
  gradient: VisualPatternGradient | undefined,
  path: string,
) {
  if (!gradient) return;
  if (!['linear', 'radial', 'conic'].includes(gradient.type)) {
    issue(issues, 'canvas-pattern-gradient-type', path + '.type', 'Unsupported pattern gradient type.');
  }
  validateFiniteFields(
    issues,
    gradient as unknown as Record<string, unknown>,
    [
      'startX','startY','endX','endY','startRadius','endRadius',
      'angle','centerX','centerY','startAngle',
    ],
    path,
  );
  if (!Array.isArray(gradient.colors) || gradient.colors.length < 2) {
    issue(issues, 'canvas-pattern-gradient-stops', path + '.colors', 'Pattern gradient requires at least two color stops.');
    return;
  }
  if (gradient.colors.length > CANVAS_RUNTIME_LIMITS.maxCollectionItems) {
    issue(
      issues,
      'canvas-pattern-gradient-stop-limit',
      path + '.colors',
      'Pattern gradient stops exceed the Apexify runtime collection limit.',
    );
  }
  if (
    gradient.repeat !== undefined &&
    !CANVAS_GRADIENT_REPEATS.includes(
      gradient.repeat as (typeof CANVAS_GRADIENT_REPEATS)[number],
    )
  ) {
    issue(issues, 'canvas-pattern-gradient-repeat', path + '.repeat', 'Unsupported pattern gradient repeat mode.');
  }

  let previousStop = -Infinity;
  gradient.colors.forEach((stop, index) => {
    if (!finite(stop.stop) || stop.stop < 0 || stop.stop > 1) {
      issue(issues, 'canvas-pattern-gradient-stop', path + `.colors[${index}].stop`, 'Pattern gradient stop must be between 0 and 1.');
    }
    if (finite(stop.stop) && stop.stop < previousStop) {
      issue(
        issues,
        'canvas-pattern-gradient-stop-order',
        path + `.colors[${index}].stop`,
        'Pattern gradient stops must be ordered by non-decreasing stop.',
      );
    }
    if (finite(stop.stop)) previousStop = stop.stop;
    if (typeof stop.color !== 'string' || !stop.color.trim() || stop.color.includes('\0') || stop.color.length > 256) {
      issue(issues, 'canvas-pattern-gradient-color', path + `.colors[${index}].color`, 'Pattern gradient color must be a non-empty string of at most 256 characters.');
    }
  });

  if (
    gradient.type === 'linear' &&
    gradient.startX !== undefined &&
    gradient.startY !== undefined &&
    gradient.endX !== undefined &&
    gradient.endY !== undefined &&
    gradient.startX === gradient.endX &&
    gradient.startY === gradient.endY
  ) {
    issue(issues, 'canvas-pattern-gradient-geometry', path, 'Linear gradient start and end points must not be identical.');
  }
  if (gradient.type === 'radial') {
    if (gradient.startRadius !== undefined && gradient.startRadius < 0) {
      issue(issues, 'canvas-pattern-gradient-radius', path + '.startRadius', 'Radial start radius must be non-negative.');
    }
    if (gradient.endRadius !== undefined && gradient.endRadius < 0) {
      issue(issues, 'canvas-pattern-gradient-radius', path + '.endRadius', 'Radial end radius must be non-negative.');
    }
    if (
      gradient.startX !== undefined &&
      gradient.startY !== undefined &&
      gradient.startRadius !== undefined &&
      gradient.endX !== undefined &&
      gradient.endY !== undefined &&
      gradient.endRadius !== undefined &&
      gradient.startX === gradient.endX &&
      gradient.startY === gradient.endY &&
      gradient.startRadius === gradient.endRadius
    ) {
      issue(issues, 'canvas-pattern-gradient-geometry', path, 'Radial gradient start and end circles must not be identical.');
    }
  }
}

function validatePattern(
  issues: VisualProjectIssue[],
  pattern: VisualPatternOptions | undefined,
  path: string,
) {
  if (!pattern) return;
  if (!CANVAS_PATTERN_TYPES.includes(pattern.type as (typeof CANVAS_PATTERN_TYPES)[number])) {
    issue(issues, 'canvas-pattern-type', path + '.type', 'Unsupported canvas pattern type.');
  }
  validateOpacity(issues, pattern.opacity, path + '.opacity');
  if (
    pattern.blendMode !== undefined &&
    !CANVAS_BLEND_MODES.includes(
      pattern.blendMode as (typeof CANVAS_BLEND_MODES)[number],
    )
  ) {
    issue(issues, 'canvas-pattern-blend', path + '.blendMode', 'Unsupported pattern blend mode.');
  }
  if (
    pattern.gradient !== undefined &&
    (pattern.color !== undefined || pattern.secondaryColor !== undefined)
  ) {
    issue(
      issues,
      'canvas-pattern-paint-exclusive',
      path,
      'Pattern paint must use either gradient or primary/secondary colors, not both.',
    );
  }
  for (const key of ['size','spacing','rotation','scale','offsetX','offsetY'] as const) {
    const value = pattern[key];
    if (value !== undefined && !finite(value)) {
      issue(issues, 'canvas-pattern-number', path + '.' + key, 'Pattern numeric values must be finite.');
    }
  }
  if (pattern.size !== undefined && pattern.size <= 0) {
    issue(issues, 'canvas-pattern-size', path + '.size', 'Pattern size must be greater than 0.');
  }
  if (pattern.spacing !== undefined && pattern.spacing < 0) {
    issue(issues, 'canvas-pattern-spacing', path + '.spacing', 'Pattern spacing must be at least 0.');
  }
  if (pattern.scale !== undefined && pattern.scale <= 0) {
    issue(issues, 'canvas-pattern-scale', path + '.scale', 'Pattern scale must be greater than 0.');
  }
  if (
    pattern.repeat !== undefined &&
    !CANVAS_PATTERN_REPEATS.includes(
      pattern.repeat as (typeof CANVAS_PATTERN_REPEATS)[number],
    )
  ) {
    issue(issues, 'canvas-pattern-repeat', path + '.repeat', 'Unsupported pattern repeat mode.');
  }
  if (pattern.color !== undefined) validateString(issues, pattern.color, path + '.color', 512);
  if (pattern.secondaryColor !== undefined) validateString(issues, pattern.secondaryColor, path + '.secondaryColor', 512);
  if (pattern.type === 'custom') {
    validateString(issues, pattern.customPatternImage, path + '.customPatternImage', 16_384);
  }
  validatePatternGradient(issues, pattern.gradient, path + '.gradient');
}

export function validateVisualCanvasConfig(
  canvas: VisualCanvasConfig | undefined,
  issues: VisualProjectIssue[],
  width = 4096,
  height = 4096,
) {
  if (!canvas) return;
  const p = 'document.canvas';

  for (const key of ['x','y','blur','rotation'] as const) {
    const value = canvas[key];
    if (value !== undefined && !finite(value)) {
      issue(issues, 'canvas-number', p + '.' + key, 'Canvas numeric values must be finite.');
    }
  }
  if (canvas.blur !== undefined && canvas.blur < 0) {
    issue(issues, 'canvas-blur', p + '.blur', 'Canvas blur cannot be negative.');
  }
  validateOpacity(issues, canvas.opacity, p + '.opacity');
  if (
    canvas.blendMode !== undefined &&
    !CANVAS_BLEND_MODES.includes(
      canvas.blendMode as (typeof CANVAS_BLEND_MODES)[number],
    )
  ) {
    issue(issues, 'canvas-blend', p + '.blendMode', 'Unsupported canvas blend mode.');
  }
  if (
    canvas.borderRadius !== undefined &&
    canvas.borderRadius !== 'circular' &&
    (!finite(canvas.borderRadius) || canvas.borderRadius < 0)
  ) {
    issue(issues, 'canvas-radius', p + '.borderRadius', 'Canvas radius must be non-negative or circular.');
  }

  const baseCount = [
    canvas.colorBg,
    canvas.gradientBg,
    canvas.customBg,
    canvas.videoBg,
    canvas.transparentBase === true ? true : undefined,
  ].filter((value) => value !== undefined).length;
  if (baseCount > 1) {
    issue(
      issues,
      'canvas-base-background',
      p,
      'Only one primary canvas background may be active: colorBg, gradientBg, customBg, videoBg, or transparentBase.',
    );
  }

  validateGradient(issues, canvas.gradientBg, p + '.gradientBg');
  validatePattern(issues, canvas.patternBg, p + '.patternBg');

  if (canvas.noiseBg?.intensity !== undefined &&
      (!finite(canvas.noiseBg.intensity) || canvas.noiseBg.intensity < 0 || canvas.noiseBg.intensity > 1)) {
    issue(issues, 'canvas-noise', p + '.noiseBg.intensity', 'Noise intensity must be between 0 and 1.');
  }

  if (canvas.customBg) {
    validateString(issues, canvas.customBg.source, p + '.customBg.source', 16_384);
    validateImageBackgroundOptions(issues, canvas.customBg, p + '.customBg', width, height);
  }

  if (canvas.videoBg) {
    validateString(issues, canvas.videoBg.source, p + '.videoBg.source', 16_384);
    validateImageBackgroundOptions(issues, canvas.videoBg, p + '.videoBg', width, height);
    if (canvas.videoBg.frame !== undefined && canvas.videoBg.time !== undefined) {
      issue(issues, 'canvas-video-selector', p + '.videoBg', 'Video background must specify frame or time, not both.');
    }
    if (
      canvas.videoBg.frame !== undefined &&
      (!finite(canvas.videoBg.frame) || !Number.isInteger(canvas.videoBg.frame) || canvas.videoBg.frame < 1)
    ) {
      issue(issues, 'canvas-video-frame', p + '.videoBg.frame', 'Video frame must be a 1-based positive integer.');
    }
    if (canvas.videoBg.time !== undefined && (!finite(canvas.videoBg.time) || canvas.videoBg.time < 0)) {
      issue(issues, 'canvas-video-time', p + '.videoBg.time', 'Video time must be non-negative.');
    }
    if (canvas.videoBg.format !== undefined && !['jpg', 'png'].includes(canvas.videoBg.format)) {
      issue(issues, 'canvas-video-format', p + '.videoBg.format', 'Video frame format must be jpg or png.');
    }
    if (
      canvas.videoBg.quality !== undefined &&
      (!finite(canvas.videoBg.quality) || !Number.isInteger(canvas.videoBg.quality) || canvas.videoBg.quality < 1 || canvas.videoBg.quality > 31)
    ) {
      issue(issues, 'canvas-video-quality', p + '.videoBg.quality', 'Video frame quality must be an integer from 1 through 31.');
    }
  }

  if ((canvas.bgLayers?.length ?? 0) > CANVAS_RUNTIME_LIMITS.maxBackgroundLayers) {
    issue(
      issues,
      'canvas-layer-limit',
      p + '.bgLayers',
      'Background layers exceed the Apexify runtime limit of ' +
        String(CANVAS_RUNTIME_LIMITS.maxBackgroundLayers) +
        '.',
    );
  }

  canvas.bgLayers?.forEach((layer, index) => {
    const path = p + `.bgLayers[${index}]`;
    if ('opacity' in layer) validateOpacity(issues, layer.opacity, path + '.opacity');
    if (
      'blendMode' in layer &&
      layer.blendMode !== undefined &&
      !CANVAS_BLEND_MODES.includes(
        layer.blendMode as (typeof CANVAS_BLEND_MODES)[number],
      )
    ) {
      issue(issues, 'canvas-layer-blend', path + '.blendMode', 'Unsupported background-layer blend mode.');
    }
    if (layer.type === 'color') {
      validateString(issues, layer.value, path + '.value', 512);
    }
    if (layer.type === 'gradient') validateGradient(issues, layer.value, path + '.value');
    if (layer.type === 'presetPattern') validatePattern(issues, layer.pattern, path + '.pattern');
    if (layer.type === 'image' || layer.type === 'pattern') {
      validateString(issues, layer.source, path + '.source', 16_384);
    }
    if (layer.type === 'image') {
      if (
        layer.fit !== undefined &&
        !CANVAS_FITS.includes(layer.fit as (typeof CANVAS_FITS)[number])
      ) {
        issue(issues, 'canvas-layer-fit', path + '.fit', 'Unsupported background-layer fit mode.');
      }
      if (
        layer.align !== undefined &&
        !CANVAS_ALIGNMENTS.includes(
          layer.align as (typeof CANVAS_ALIGNMENTS)[number],
        )
      ) {
        issue(issues, 'canvas-layer-align', path + '.align', 'Unsupported background-layer alignment.');
      }
    }
    if (
      layer.type === 'pattern' &&
      layer.repeat !== undefined &&
      !CANVAS_PATTERN_REPEATS.includes(
        layer.repeat as (typeof CANVAS_PATTERN_REPEATS)[number],
      )
    ) {
      issue(issues, 'canvas-layer-repeat', path + '.repeat', 'Unsupported background-layer repeat mode.');
    }
    if (layer.type === 'noise' && layer.intensity !== undefined &&
        (!finite(layer.intensity) || layer.intensity < 0 || layer.intensity > 1)) {
      issue(issues, 'canvas-layer-noise', path + '.intensity', 'Noise intensity must be between 0 and 1.');
    }
  });

  if (canvas.zoom) {
    if (canvas.zoom.scale !== undefined && (!finite(canvas.zoom.scale) || canvas.zoom.scale <= 0)) {
      issue(issues, 'canvas-zoom-scale', p + '.zoom.scale', 'Canvas zoom scale must be positive.');
    }
    for (const key of ['centerX','centerY'] as const) {
      if (canvas.zoom[key] !== undefined && !finite(canvas.zoom[key])) {
        issue(issues, 'canvas-zoom-center', p + '.zoom.' + key, 'Canvas zoom center must be finite.');
      }
    }
  }

  if (canvas.stroke) {
    validateOpacity(issues, canvas.stroke.opacity, p + '.stroke.opacity');
    if (canvas.stroke.width !== undefined && (!finite(canvas.stroke.width) || canvas.stroke.width < 0)) {
      issue(issues, 'canvas-stroke-width', p + '.stroke.width', 'Stroke width cannot be negative.');
    }
    validateGradient(issues, canvas.stroke.gradient, p + '.stroke.gradient');
  }

  if (canvas.shadow) {
    validateOpacity(issues, canvas.shadow.opacity, p + '.shadow.opacity');
    for (const key of ['offsetX','offsetY','blur'] as const) {
      const value = canvas.shadow[key];
      if (value !== undefined && (!finite(value) || (key === 'blur' && value < 0))) {
        issue(issues, 'canvas-shadow-number', p + '.shadow.' + key, 'Shadow values must be finite and blur cannot be negative.');
      }
    }
    validateGradient(issues, canvas.shadow.gradient, p + '.shadow.gradient');
  }
}
