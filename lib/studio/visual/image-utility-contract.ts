import type {
  VisualImageSource,
  VisualImageUtilityAnalysis,
  VisualImageUtilityInput,
  VisualImageUtilityOperation,
  VisualNode,
  VisualProject,
  VisualProjectIssue,
} from './model';

export const IMAGE_UTILITY_STACK_TYPES = [
  'resize','cropImage','effects','colorsFilter','colorsRemover','blend',
  'masking','gradientBlend','stitchImages','createCollage','imgConverter','compress',
] as const satisfies readonly VisualImageUtilityOperation['type'][];

export const IMAGE_UTILITY_ANALYSIS_TYPES = [
  'extractPalette','colorAnalysis',
] as const satisfies readonly VisualImageUtilityAnalysis['type'][];

/** Complete public PainterImageUtils classification for STUDIO-VISUAL-10. */
export const IMAGE_UTILITY_API_COVERAGE = {
  stitchImages: { authoring: 'stack', route: 'full-runtime' },
  createCollage: { authoring: 'stack', route: 'full-runtime' },
  compress: { authoring: 'stack', route: 'full-runtime' },
  extractPalette: { authoring: 'analysis', route: 'full-runtime' },
  resize: { authoring: 'stack', route: 'full-runtime' },
  imgConverter: { authoring: 'stack', route: 'full-runtime' },
  effects: { authoring: 'stack', route: 'full-runtime' },
  colorsFilter: { authoring: 'stack', route: 'full-runtime' },
  colorAnalysis: { authoring: 'analysis', route: 'full-runtime' },
  colorsRemover: { authoring: 'stack', route: 'full-runtime' },
  removeBackground: { authoring: 'excluded', route: 'external-service' },
  blend: { authoring: 'stack', route: 'full-runtime' },
  cropImage: { authoring: 'stack', route: 'full-runtime' },
  masking: { authoring: 'stack', route: 'full-runtime' },
  gradientBlend: { authoring: 'stack', route: 'full-runtime' },
  validHex: { authoring: 'not-applicable', route: 'introspection' },
} as const;

export type ImageUtilityStackType = typeof IMAGE_UTILITY_STACK_TYPES[number];

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
function positiveInteger(value: unknown) {
  return finite(value) && value >= 1 && Number.isInteger(value);
}
function byte(value: unknown) {
  return finite(value) && value >= 0 && value <= 255 && Number.isInteger(value);
}
function opacity(value: unknown) {
  return finite(value) && value >= 0 && value <= 1;
}

export function isCurrentUtilityInput(
  input: VisualImageUtilityInput,
): input is { $current: true } {
  return Boolean(
    input &&
      typeof input === 'object' &&
      !Array.isArray(input) &&
      '$current' in input &&
      input.$current === true,
  );
}

function validateImageSource(
  project: VisualProject,
  source: VisualImageSource,
  path: string,
  issues: VisualProjectIssue[],
) {
  if (typeof source === 'string') {
    if (!source.trim()) issue(issues, 'image-utility-source', path, 'Image utility source must not be empty.');
    return;
  }
  if ('$ref' in source) return;
  if ('$generated' in source) {
    if (
      source.$generated !== 'document_canvas' &&
      !project.document.nodes[source.$generated]
    ) {
      issue(
        issues,
        'image-utility-generated-source',
        path,
        'Generated image utility source must reference an existing node.',
      );
    }
    return;
  }
  issue(issues, 'image-utility-source', path, 'Unsupported image utility source.');
}

function validateInput(
  project: VisualProject,
  input: VisualImageUtilityInput,
  path: string,
  issues: VisualProjectIssue[],
) {
  if (isCurrentUtilityInput(input)) return;
  validateImageSource(project, input, path, issues);
}

function validateFilters(
  filters: unknown,
  path: string,
  issues: VisualProjectIssue[],
) {
  if (!Array.isArray(filters) || filters.length === 0) {
    issue(issues, 'image-utility-filters', path, 'Effects requires at least one filter.');
    return;
  }
  filters.forEach((filter, index) => {
    if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
      issue(issues, 'image-utility-filter', path + '[' + index + ']', 'Filter must be an object.');
      return;
    }
    for (const value of Object.values(filter)) {
      if (typeof value === 'number' && !Number.isFinite(value)) {
        issue(issues, 'image-utility-filter-number', path + '[' + index + ']', 'Filter numeric values must be finite.');
        break;
      }
    }
  });
}

export function defaultImageUtilityOperation(
  type: ImageUtilityStackType,
  id: string,
): VisualImageUtilityOperation {
  switch (type) {
    case 'resize':
      return { id, type, size: { width: 800 }, maintainAspectRatio: true, quality: 90, outputFormat: 'png' };
    case 'cropImage':
      return {
        id, type, crop: 'inner', radius: 0,
        coordinates: [
          { from: { x: 0, y: 0 }, to: { x: 640, y: 0 } },
          { from: { x: 640, y: 0 }, to: { x: 640, y: 480 } },
          { from: { x: 640, y: 480 }, to: { x: 0, y: 480 } },
        ],
      };
    case 'effects':
      return { id, type, filters: [{ type: 'brightness', value: 0.08 }] };
    case 'colorsFilter':
      return { id, type, filterColor: '#5b7cff', opacity: 0.2 };
    case 'colorsRemover':
      return { id, type, colorToRemove: { red: 255, green: 255, blue: 255 } };
    case 'blend':
      return {
        id, type,
        layers: [{ source: { $current: true }, blendMode: 'screen', opacity: 0.35 }],
        defaultBlendMode: 'source-over',
      };
    case 'masking':
      return { id, type, maskSource: { $current: true }, options: { type: 'alpha', threshold: 128 } };
    case 'gradientBlend':
      return {
        id, type,
        options: {
          type: 'linear',
          angle: 90,
          colors: [
            { stop: 0, color: '#00000000' },
            { stop: 1, color: '#000000' },
          ],
          blendMode: 'multiply',
        },
      };
    case 'stitchImages':
      return {
        id, type, images: [{ $current: true }],
        options: { direction: 'horizontal', overlap: 0, blend: false, spacing: 0 },
      };
    case 'createCollage':
      return {
        id, type,
        images: [{ source: { $current: true } }],
        layout: { type: 'grid', columns: 1, spacing: 8, background: '#00000000', borderRadius: 0 },
      };
    case 'imgConverter':
      return { id, type, newExtension: 'png' };
    case 'compress':
      return { id, type, options: { quality: 82, format: 'webp', progressive: false } };
  }
}

export function defaultImageUtilityAnalysis(
  type: VisualImageUtilityAnalysis['type'],
  id: string,
): VisualImageUtilityAnalysis {
  return type === 'extractPalette'
    ? { id, type, options: { count: 8, method: 'kmeans', format: 'hex' } }
    : { id, type };
}


function draftRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Image utility configuration must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

function optionalDraftRecord(value: unknown, label: string): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(label + ' must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

/**
 * Converts editable JSON into a structurally safe operation before it enters
 * Visual Project state. Missing required collections/objects inherit the
 * operation defaults; wrong structural types are rejected at the editor edge.
 */
function requiredDraftRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(label + ' must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

function validateDraftInput(value: unknown, label: string) {
  if (typeof value === 'string' && value.trim()) return;
  const record = requiredDraftRecord(value, label);
  if (record.$current === true) return;
  if (typeof record.$ref === 'string' && record.$ref.trim()) return;
  if (typeof record.$generated === 'string' && record.$generated.trim()) return;
  throw new Error(label + ' must be an image source, $current, $ref, or $generated input.');
}

function validateDraftPoint(value: unknown, label: string) {
  const point = requiredDraftRecord(value, label);
  if (!finite(point.x) || !finite(point.y)) {
    throw new Error(label + ' must contain finite x and y coordinates.');
  }
}

function validateDraftGradientStops(value: unknown, label: string) {
  if (!Array.isArray(value)) throw new Error(label + ' must be an array.');
  value.forEach((item, index) => {
    const stop = requiredDraftRecord(item, label + '[' + index + ']');
    if (!finite(stop.stop) || typeof stop.color !== 'string' || !stop.color.trim()) {
      throw new Error(label + '[' + index + '] must contain a finite stop and color string.');
    }
  });
}

export function normalizeImageUtilityOperationDraft(
  type: ImageUtilityStackType,
  id: string,
  value: unknown,
): VisualImageUtilityOperation {
  const raw = draftRecord(value);
  const base = defaultImageUtilityOperation(type, id) as unknown as Record<string, unknown>;
  const merged = { ...base, ...raw, id, type } as Record<string, unknown>;

  switch (type) {
    case 'resize': {
      const size = optionalDraftRecord(raw.size, 'Resize size');
      if (size) merged.size = { ...((base.size as Record<string, unknown> | undefined) ?? {}), ...size };
      break;
    }
    case 'cropImage':
      if (raw.coordinates !== undefined) {
        if (!Array.isArray(raw.coordinates)) throw new Error('Crop coordinates must be an array.');
        raw.coordinates.forEach((item, index) => {
          const coordinate = requiredDraftRecord(item, 'Crop coordinate[' + index + ']');
          validateDraftPoint(coordinate.from, 'Crop coordinate[' + index + '].from');
          validateDraftPoint(coordinate.to, 'Crop coordinate[' + index + '].to');
          if (coordinate.tension !== undefined && !finite(coordinate.tension)) {
            throw new Error('Crop coordinate[' + index + '].tension must be finite.');
          }
        });
      }
      break;
    case 'effects':
      if (raw.filters !== undefined) {
        if (!Array.isArray(raw.filters)) throw new Error('Effects filters must be an array.');
        raw.filters.forEach((item, index) => {
          const filter = requiredDraftRecord(item, 'Effects filter[' + index + ']');
          if (typeof filter.type !== 'string' || !filter.type.trim()) {
            throw new Error('Effects filter[' + index + '] requires a type.');
          }
        });
      }
      break;
    case 'colorsFilter':
      if (
        raw.filterColor !== undefined &&
        typeof raw.filterColor !== 'string' &&
        (!raw.filterColor || typeof raw.filterColor !== 'object' || Array.isArray(raw.filterColor))
      ) {
        throw new Error('Color filter must be a color string or gradient object.');
      }
      if (raw.filterColor && typeof raw.filterColor === 'object' && !Array.isArray(raw.filterColor)) {
        const gradient = raw.filterColor as Record<string, unknown>;
        validateDraftGradientStops(gradient.colors, 'Color filter gradient colors');
        if (gradient.maskSource !== undefined) validateDraftInput(gradient.maskSource, 'Color filter gradient maskSource');
      }
      break;
    case 'colorsRemover': {
      const color = optionalDraftRecord(raw.colorToRemove, 'Removed color');
      if (color) {
        merged.colorToRemove = {
          ...((base.colorToRemove as Record<string, unknown> | undefined) ?? {}),
          ...color,
        };
      }
      break;
    }
    case 'blend':
      if (raw.layers !== undefined) {
        if (!Array.isArray(raw.layers)) throw new Error('Blend layers must be an array.');
        raw.layers.forEach((item, index) => {
          const layer = requiredDraftRecord(item, 'Blend layer[' + index + ']');
          validateDraftInput(layer.source, 'Blend layer[' + index + '].source');
          if (typeof layer.blendMode !== 'string' || !layer.blendMode.trim()) {
            throw new Error('Blend layer[' + index + '] requires a blendMode.');
          }
          if (layer.position !== undefined) {
            const position = requiredDraftRecord(layer.position, 'Blend layer[' + index + '].position');
            if (!finite(position.x) || !finite(position.y)) {
              throw new Error('Blend layer[' + index + '].position requires finite x and y.');
            }
          }
        });
      }
      break;
    case 'masking': {
      if (raw.maskSource !== undefined) validateDraftInput(raw.maskSource, 'Mask source');
      const options = optionalDraftRecord(raw.options, 'Mask options');
      if (options) merged.options = { ...((base.options as Record<string, unknown> | undefined) ?? {}), ...options };
      break;
    }
    case 'gradientBlend': {
      const options = optionalDraftRecord(raw.options, 'Gradient blend options');
      if (options) {
        if (options.colors !== undefined) validateDraftGradientStops(options.colors, 'Gradient blend colors');
        if (options.maskSource !== undefined) validateDraftInput(options.maskSource, 'Gradient blend maskSource');
        merged.options = { ...((base.options as Record<string, unknown> | undefined) ?? {}), ...options };
      }
      break;
    }
    case 'stitchImages': {
      if (raw.images !== undefined) {
        if (!Array.isArray(raw.images)) throw new Error('Stitch images must be an array.');
        raw.images.forEach((item, index) => validateDraftInput(item, 'Stitch image[' + index + ']'));
      }
      const options = optionalDraftRecord(raw.options, 'Stitch options');
      if (options) merged.options = { ...((base.options as Record<string, unknown> | undefined) ?? {}), ...options };
      break;
    }
    case 'createCollage': {
      if (raw.images !== undefined) {
        if (!Array.isArray(raw.images)) throw new Error('Collage images must be an array.');
        raw.images.forEach((item, index) => {
          const entry = requiredDraftRecord(item, 'Collage image[' + index + ']');
          validateDraftInput(entry.source, 'Collage image[' + index + '].source');
        });
      }
      const layout = optionalDraftRecord(raw.layout, 'Collage layout');
      if (layout) merged.layout = { ...((base.layout as Record<string, unknown> | undefined) ?? {}), ...layout };
      break;
    }
    case 'imgConverter':
      if (raw.newExtension !== undefined && typeof raw.newExtension !== 'string') {
        throw new Error('Conversion extension must be a string.');
      }
      break;
    case 'compress': {
      const options = optionalDraftRecord(raw.options, 'Compression options');
      if (options) merged.options = { ...((base.options as Record<string, unknown> | undefined) ?? {}), ...options };
      break;
    }
  }

  return merged as unknown as VisualImageUtilityOperation;
}

export function normalizeImageUtilityAnalysisDraft(
  type: VisualImageUtilityAnalysis['type'],
  id: string,
  value: unknown,
): VisualImageUtilityAnalysis {
  const raw = draftRecord(value);
  const base = defaultImageUtilityAnalysis(type, id) as unknown as Record<string, unknown>;
  const merged = { ...base, ...raw, id, type } as Record<string, unknown>;
  if (type === 'extractPalette') {
    const options = optionalDraftRecord(raw.options, 'Palette analysis options');
    if (options) merged.options = { ...((base.options as Record<string, unknown> | undefined) ?? {}), ...options };
  }
  return merged as unknown as VisualImageUtilityAnalysis;
}

export function validateVisualImageUtilities(
  project: VisualProject,
  node: VisualNode,
  issues: VisualProjectIssue[],
) {
  if (node.kind !== 'image' && node.kind !== 'shape') return;
  const props = node.props as unknown as {
    utilityStack?: VisualImageUtilityOperation[];
    utilityAnalyses?: VisualImageUtilityAnalysis[];
  };
  const stack = props.utilityStack ?? [];
  const analyses = props.utilityAnalyses ?? [];
  const base = 'document.nodes.' + node.id + '.props';
  const ids = new Set<string>();

  if (node.kind === 'shape' && (stack.length || analyses.length)) {
    issue(
      issues,
      'image-utility-shape-source',
      base,
      'Full-runtime image utilities require a raster image source; built-in shape tokens are authored with the existing shape controls.',
    );
    return;
  }

  let outputStageStarted = false;

  for (const [index, operation] of stack.entries()) {
    const path = base + '.utilityStack[' + index + ']';
    if (!operation.id?.trim()) issue(issues, 'image-utility-id', path + '.id', 'Image utility operation requires a stable id.');
    if (ids.has(operation.id)) issue(issues, 'image-utility-duplicate-id', path + '.id', 'Image utility operation ids must be unique per layer.');
    ids.add(operation.id);
    if (!IMAGE_UTILITY_STACK_TYPES.includes(operation.type)) {
      issue(issues, 'image-utility-type', path + '.type', 'Unsupported image utility operation.');
      continue;
    }
    const outputStage = operation.type === 'imgConverter' || operation.type === 'compress';
    if (outputStage) outputStageStarted = true;
    else if (outputStageStarted) {
      issue(
        issues,
        'image-utility-output-order',
        path,
        'Conversion/compression are output-stage operations and must remain after raster manipulation operations.',
      );
    }
    if (operation.enabled === false) continue;

    switch (operation.type) {
      case 'resize':
        if (operation.size?.width !== undefined && !positiveInteger(operation.size.width)) issue(issues, 'image-utility-resize-width', path + '.size.width', 'Resize width must be a positive integer.');
        if (operation.size?.height !== undefined && !positiveInteger(operation.size.height)) issue(issues, 'image-utility-resize-height', path + '.size.height', 'Resize height must be a positive integer.');
        if (operation.quality !== undefined && (!positiveInteger(operation.quality) || operation.quality > 100)) issue(issues, 'image-utility-resize-quality', path + '.quality', 'Resize quality must be an integer from 1 to 100.');
        break;
      case 'cropImage':
        if (operation.coordinates.length < 3) issue(issues, 'image-utility-crop-coordinates', path + '.coordinates', 'Crop requires at least three coordinates.');
        operation.coordinates.forEach((coordinate, coordinateIndex) => {
          for (const point of [coordinate.from, coordinate.to]) {
            if (!finite(point.x) || point.x < 0 || !finite(point.y) || point.y < 0) {
              issue(issues, 'image-utility-crop-point', path + '.coordinates[' + coordinateIndex + ']', 'Crop coordinates must be finite and non-negative.');
              break;
            }
          }
        });
        if (operation.radius !== undefined && operation.radius !== 'circular' && (!finite(operation.radius) || operation.radius < 0)) issue(issues, 'image-utility-crop-radius', path + '.radius', 'Crop radius must be non-negative or circular.');
        break;
      case 'effects':
        validateFilters(operation.filters, path + '.filters', issues);
        break;
      case 'colorsFilter':
        if (operation.opacity !== undefined && !opacity(operation.opacity)) issue(issues, 'image-utility-color-opacity', path + '.opacity', 'Color filter opacity must be between 0 and 1.');
        break;
      case 'colorsRemover':
        for (const [channel, value] of Object.entries(operation.colorToRemove)) {
          if (!byte(value)) issue(issues, 'image-utility-remove-color', path + '.colorToRemove.' + channel, 'Removed RGB channels must be integers from 0 to 255.');
        }
        break;
      case 'blend':
        if (!operation.layers.length) issue(issues, 'image-utility-blend-layers', path + '.layers', 'Blend requires at least one layer.');
        operation.layers.forEach((layer, layerIndex) => {
          validateInput(project, layer.source, path + '.layers[' + layerIndex + '].source', issues);
          if (layer.opacity !== undefined && !opacity(layer.opacity)) issue(issues, 'image-utility-blend-opacity', path + '.layers[' + layerIndex + '].opacity', 'Blend opacity must be between 0 and 1.');
        });
        break;
      case 'masking':
        validateInput(project, operation.maskSource, path + '.maskSource', issues);
        if (operation.options?.threshold !== undefined && (!finite(operation.options.threshold) || operation.options.threshold < 0 || operation.options.threshold > 255)) issue(issues, 'image-utility-mask-threshold', path + '.options.threshold', 'Mask threshold must be from 0 to 255.');
        if (operation.options?.type === 'color' && !operation.options.colorKey?.trim()) issue(issues, 'image-utility-mask-color', path + '.options.colorKey', 'Color masks require colorKey.');
        break;
      case 'gradientBlend':
        if (!operation.options.colors.length) issue(issues, 'image-utility-gradient-colors', path + '.options.colors', 'Gradient blend requires color stops.');
        if (operation.options.maskSource) validateInput(project, operation.options.maskSource, path + '.options.maskSource', issues);
        break;
      case 'stitchImages':
        if (!operation.images.length) issue(issues, 'image-utility-stitch-images', path + '.images', 'Stitch requires at least one image.');
        operation.images.forEach((source, sourceIndex) => validateInput(project, source, path + '.images[' + sourceIndex + ']', issues));
        if (operation.options?.direction === 'grid' && (operation.options.overlap ?? 0) !== 0) issue(issues, 'image-utility-stitch-grid-overlap', path + '.options.overlap', 'Grid stitch does not support overlap.');
        break;
      case 'createCollage':
        if (!operation.images.length) issue(issues, 'image-utility-collage-images', path + '.images', 'Collage requires at least one image.');
        operation.images.forEach((item, itemIndex) => {
          validateInput(project, item.source, path + '.images[' + itemIndex + '].source', issues);
          if (item.width !== undefined && !positiveInteger(item.width)) issue(issues, 'image-utility-collage-width', path + '.images[' + itemIndex + '].width', 'Collage item width must be positive.');
          if (item.height !== undefined && !positiveInteger(item.height)) issue(issues, 'image-utility-collage-height', path + '.images[' + itemIndex + '].height', 'Collage item height must be positive.');
        });
        if (operation.layout.columns !== undefined && !positiveInteger(operation.layout.columns)) issue(issues, 'image-utility-collage-columns', path + '.layout.columns', 'Collage columns must be positive.');
        if (operation.layout.rows !== undefined && !positiveInteger(operation.layout.rows)) issue(issues, 'image-utility-collage-rows', path + '.layout.rows', 'Collage rows must be positive.');
        break;
      case 'imgConverter':
        break;
      case 'compress':
        if (operation.options?.quality !== undefined && (!positiveInteger(operation.options.quality) || operation.options.quality > 100)) issue(issues, 'image-utility-compress-quality', path + '.options.quality', 'Compression quality must be an integer from 1 to 100.');
        if (operation.options?.maxWidth !== undefined && !positiveInteger(operation.options.maxWidth)) issue(issues, 'image-utility-compress-width', path + '.options.maxWidth', 'Compression maxWidth must be positive.');
        if (operation.options?.maxHeight !== undefined && !positiveInteger(operation.options.maxHeight)) issue(issues, 'image-utility-compress-height', path + '.options.maxHeight', 'Compression maxHeight must be positive.');
        break;
    }
  }

  for (const [index, analysis] of analyses.entries()) {
    const path = base + '.utilityAnalyses[' + index + ']';
    if (!analysis.id?.trim()) issue(issues, 'image-analysis-id', path + '.id', 'Image analysis requires a stable id.');
    if (ids.has(analysis.id)) issue(issues, 'image-analysis-duplicate-id', path + '.id', 'Image utility and analysis ids must be unique per layer.');
    ids.add(analysis.id);
    if (!IMAGE_UTILITY_ANALYSIS_TYPES.includes(analysis.type)) {
      issue(issues, 'image-analysis-type', path + '.type', 'Unsupported image analysis operation.');
      continue;
    }
    if (analysis.type === 'extractPalette') {
      const count = analysis.options?.count;
      if (count !== undefined && (!positiveInteger(count) || count > 256)) issue(issues, 'image-analysis-palette-count', path + '.options.count', 'Palette count must be an integer from 1 to 256.');
    }
  }
}
