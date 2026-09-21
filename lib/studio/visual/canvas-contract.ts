import type {
  VisualBackgroundLayer,
  VisualCanvasConfig,
  VisualGradient,
  VisualPatternOptions,
  VisualProjectIssue,
} from './model';

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
    opacity: 0.42,
    size: 1,
    spacing: 32,
    rotation: 0,
  };
}

export function defaultBackgroundLayer(type: VisualBackgroundLayer['type']): VisualBackgroundLayer {
  if (type === 'color') return { type, value: '#172554', opacity: 1 };
  if (type === 'gradient') return { type, value: defaultCanvasGradient(), opacity: 1 };
  if (type === 'image') return { type, source: '', fit: 'cover', align: 'center', opacity: 1 };
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

function validateGradient(
  issues: VisualProjectIssue[],
  gradient: VisualGradient | undefined,
  path: string,
) {
  if (!gradient) return;
  if (!['linear','radial','conic'].includes(gradient.type)) {
    issue(issues, 'canvas-gradient-type', path + '.type', 'Unsupported gradient type.');
  }
  if (!Array.isArray(gradient.colors) || gradient.colors.length < 2) {
    issue(issues, 'canvas-gradient-stops', path + '.colors', 'Gradient requires at least two color stops.');
    return;
  }
  gradient.colors.forEach((stop, index) => {
    if (!finite(stop.stop) || stop.stop < 0 || stop.stop > 1) {
      issue(issues, 'canvas-gradient-stop', path + `.colors[${index}].stop`, 'Gradient stop must be between 0 and 1.');
    }
    if (!stop.color?.trim()) {
      issue(issues, 'canvas-gradient-color', path + `.colors[${index}].color`, 'Gradient color is required.');
    }
  });
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
  for (const key of ['size','spacing','rotation','scale','offsetX','offsetY'] as const) {
    const value = pattern[key];
    if (value !== undefined && !finite(value)) {
      issue(issues, 'canvas-pattern-number', path + '.' + key, 'Pattern numeric values must be finite.');
    }
  }
  if (pattern.type === 'custom' && !pattern.customPatternImage?.trim()) {
    issue(issues, 'canvas-pattern-image', path + '.customPatternImage', 'Custom pattern requires an image source.');
  }
  validateGradient(issues, pattern.gradient, path + '.gradient');
}

export function validateVisualCanvasConfig(
  canvas: VisualCanvasConfig | undefined,
  issues: VisualProjectIssue[],
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
    canvas.borderRadius !== undefined &&
    canvas.borderRadius !== 'circular' &&
    (!finite(canvas.borderRadius) || canvas.borderRadius < 0)
  ) {
    issue(issues, 'canvas-radius', p + '.borderRadius', 'Canvas radius must be non-negative or circular.');
  }

  const baseCount = [canvas.colorBg, canvas.gradientBg, canvas.customBg].filter((value) => value !== undefined).length;
  if (baseCount > 1) {
    issue(issues, 'canvas-base-background', p, 'Only one of colorBg, gradientBg or customBg may be active.');
  }

  validateGradient(issues, canvas.gradientBg, p + '.gradientBg');
  validatePattern(issues, canvas.patternBg, p + '.patternBg');

  if (canvas.noiseBg?.intensity !== undefined &&
      (!finite(canvas.noiseBg.intensity) || canvas.noiseBg.intensity < 0 || canvas.noiseBg.intensity > 1)) {
    issue(issues, 'canvas-noise', p + '.noiseBg.intensity', 'Noise intensity must be between 0 and 1.');
  }

  if (canvas.customBg) {
    if (!canvas.customBg.source.trim()) issue(issues, 'canvas-custom-bg-source', p + '.customBg.source', 'Background image source is required.');
    validateOpacity(issues, canvas.customBg.opacity, p + '.customBg.opacity');
  }

  if (canvas.videoBg) {
    if (!canvas.videoBg.source.trim()) issue(issues, 'canvas-video-bg-source', p + '.videoBg.source', 'Video source is required.');
    validateOpacity(issues, canvas.videoBg.opacity, p + '.videoBg.opacity');
    if (canvas.videoBg.frame !== undefined && (!finite(canvas.videoBg.frame) || canvas.videoBg.frame < 0)) {
      issue(issues, 'canvas-video-frame', p + '.videoBg.frame', 'Video frame must be non-negative.');
    }
    if (canvas.videoBg.time !== undefined && (!finite(canvas.videoBg.time) || canvas.videoBg.time < 0)) {
      issue(issues, 'canvas-video-time', p + '.videoBg.time', 'Video time must be non-negative.');
    }
  }

  canvas.bgLayers?.forEach((layer, index) => {
    const path = p + `.bgLayers[${index}]`;
    if ('opacity' in layer) validateOpacity(issues, layer.opacity, path + '.opacity');
    if (layer.type === 'gradient') validateGradient(issues, layer.value, path + '.value');
    if (layer.type === 'presetPattern') validatePattern(issues, layer.pattern, path + '.pattern');
    if ((layer.type === 'image' || layer.type === 'pattern') && !layer.source.trim()) {
      issue(issues, 'canvas-layer-source', path + '.source', 'Background layer source is required.');
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
