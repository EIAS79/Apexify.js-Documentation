import type {
  VisualCanvasConfig,
  VisualCreateImageOptions,
  VisualImageNodeProps,
  VisualNode,
  VisualProject,
  VisualTextNodeProps,
  VisualValue,
  VisualImageUtilityAnalysis,
  VisualImageUtilityInput,
  VisualImageUtilityOperation,
} from '../model';
import { isGeneratedImageSource, visualImageProps } from '../image-contract';
import { isCurrentUtilityInput } from '../image-utility-contract';
import { visualTextProps } from '../text-contract';
import {
  visualChartProps,
  type VisualStandaloneChartFamily,
} from '../chart-contract';
import {
  detectionOperation,
  pixelOperation,
  visualPathProps,
  type StudioConnectorOptions,
  type StudioDetectionOperation,
  type StudioPathCommand,
  type StudioPathDrawOptions,
} from '../path-pixel-contract';
import { normalizeVisualProject } from './normalize';
import { assertValidVisualProject } from './validate';
import {
  phase9Definition,
  phase9RegistryRecords,
  phase9SceneDefinition,
  phase9TemplateSceneDefinition,
  resolvePhase9References,
  type Phase9SceneDefinition,
} from '../scene-component-contract';

export const STUDIO_OPERATION_PLAN_VERSION = 1 as const;

export type StudioTargetReference = {
  $studioTarget: string;
  member?: 'buffer';
};

export type StudioCreateCanvasOperation = {
  id: string;
  kind: 'create-canvas';
  source: 'document';
  target: string;
  preferredName?: string;
  options: {
    width: number;
    height: number;
  } & VisualCanvasConfig;
};

export type StudioImageProperties = Omit<
  VisualImageNodeProps,
  'source' | 'createOptions'
> & {
  source: string | StudioTargetReference;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
};

export type StudioCreateImageOperation = {
  id: string;
  kind: 'create-image';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  properties: StudioImageProperties;
  options?: VisualCreateImageOptions;
};

export type StudioImageUtilityOperation = {
  id: string;
  kind: 'image-utility';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  method: VisualImageUtilityOperation['type'];
  args: unknown[];
};

export type StudioImageAnalysisOperation = {
  id: string;
  kind: 'image-analysis';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  resultName: string;
  method: VisualImageUtilityAnalysis['type'];
  args: unknown[];
};

export type StudioTextProperties = VisualTextNodeProps & {
  x: number;
  y: number;
};

export type StudioCreateTextOperation = {
  id: string;
  kind: 'create-text';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  properties: StudioTextProperties;
};

export type StudioCreateChartOperation = {
  id: string;
  kind: 'create-chart';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  family: VisualStandaloneChartFamily;
  data: VisualValue[];
  options: Record<string, VisualValue>;
};

export type StudioCreateComparisonChartOperation = {
  id: string;
  kind: 'create-comparison-chart';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  options: Record<string, VisualValue>;
};

export type StudioCreateComboChartOperation = {
  id: string;
  kind: 'create-combo-chart';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  options: Record<string, VisualValue>;
};

export type StudioRegisterAssetOperation = {
  id: string;
  kind: 'register-asset';
  registryKind: 'image' | 'font' | 'palette' | 'value';
  name: string;
  value: VisualValue;
};

export type StudioCreateSceneOperation = {
  id: string;
  kind: 'create-scene';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  definition: Phase9SceneDefinition;
  placement: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
  };
};

export type StudioRenderTemplateOperation = {
  id: string;
  kind: 'render-template';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  definitionId: string;
  definitionName: string;
  definition: Phase9SceneDefinition;
  data: Record<string, VisualValue>;
  overrides: Record<string, Record<string, VisualValue>>;
  insertions: VisualValue[];
  placement: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
  };
};

export type StudioDrawPathOperation = {
  id: string;
  kind: 'path-draw';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  commands: StudioPathCommand[];
  options?: StudioPathDrawOptions;
};

export type StudioCustomPathOperation = {
  id: string;
  kind: 'path-custom';
  sourceNodeId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  options: StudioConnectorOptions | StudioConnectorOptions[];
};

export type StudioPixelManipulateOperation = {
  id: string;
  kind: 'pixels-manipulate';
  sourceOperationId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  options: {
    filter: 'grayscale' | 'invert' | 'sepia' | 'brightness' | 'contrast' | 'saturate';
    intensity?: number;
    region?: { x: number; y: number; width: number; height: number };
  };
};

export type StudioPixelSetColorOperation = {
  id: string;
  kind: 'pixels-set-color';
  sourceOperationId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
  x: number;
  y: number;
  color: { r: number; g: number; b: number; a?: number };
};

export type StudioInspectionOperation = {
  id: string;
  sourceOperationId: string;
  target: string;
  preferredName?: string;
  base: StudioTargetReference;
} & (
  | { kind: 'pixels-get-color'; x: number; y: number }
  | { kind: 'pixels-get-data'; region?: { x: number; y: number; width: number; height: number } }
  | {
      kind: 'detect-path';
      pathSourceNodeId: string;
      commands: StudioPathCommand[];
      x: number;
      y: number;
      options?: {
        includeStroke?: boolean;
        strokeWidth?: number;
        tolerance?: number;
        fillRule?: 'nonzero' | 'evenodd';
      };
    }
  | {
      kind: 'detect-region';
      region: Extract<StudioDetectionOperation, { type: 'detectRegion' }>['region'];
      x: number;
      y: number;
      options?: {
        includeStroke?: boolean;
        strokeWidth?: number;
        tolerance?: number;
        fillRule?: 'nonzero' | 'evenodd';
      };
    }
  | {
      kind: 'detect-any-region';
      regions: Extract<StudioDetectionOperation, { type: 'detectAnyRegion' }>['regions'];
      x: number;
      y: number;
      options?: {
        includeStroke?: boolean;
        strokeWidth?: number;
        tolerance?: number;
        fillRule?: 'nonzero' | 'evenodd';
      };
    }
  | {
      kind: 'detect-distance';
      region: Extract<StudioDetectionOperation, { type: 'detectDistance' }>['region'];
      x: number;
      y: number;
    }
);

export type StudioOperation =
  | StudioCreateCanvasOperation
  | StudioCreateImageOperation
  | StudioImageUtilityOperation
  | StudioImageAnalysisOperation
  | StudioCreateTextOperation
  | StudioCreateChartOperation
  | StudioCreateComparisonChartOperation
  | StudioCreateComboChartOperation
  | StudioRegisterAssetOperation
  | StudioCreateSceneOperation
  | StudioRenderTemplateOperation
  | StudioDrawPathOperation
  | StudioCustomPathOperation
  | StudioPixelManipulateOperation
  | StudioPixelSetColorOperation
  | StudioInspectionOperation;

export interface StudioOperationPlan {
  version: typeof STUDIO_OPERATION_PLAN_VERSION;
  projectId: string;
  schemaVersion: number;
  operations: StudioOperation[];
  result: {
    target: string;
    member: 'buffer' | null;
  };
}

function orderedAuthoringNodes(project: VisualProject): VisualNode[] {
  const out: VisualNode[] = [];
  const visit = (id: string) => {
    const node = project.document.nodes[id];
    if (!node) return;
    if (node.transform?.visible === false) return;

    if (node.kind === 'group') {
      for (const childId of node.childIds ?? []) visit(childId);
      return;
    }

    if (
      node.kind === 'image' ||
      node.kind === 'shape' ||
      node.kind === 'text' ||
      node.kind === 'chart' ||
      node.kind === 'path' ||
      node.kind === 'freehand' ||
      node.kind === 'scene' ||
      node.kind === 'surface' ||
      node.kind === 'component' ||
      node.kind === 'template-instance'
    ) {
      out.push(node);
      return;
    }

    throw new Error(
      `STUDIO-VISUAL-10 cannot lower node kind "${node.kind}" yet. It belongs to a later authoring phase.`,
    );
  };

  for (const rootId of project.document.rootNodeIds) visit(rootId);
  return out;
}

function resolveImageSource(
  project: VisualProject,
  props: VisualImageNodeProps,
  produced: Map<string, { target: string; member: 'buffer' | null }>,
): string | StudioTargetReference {
  if (
    typeof props.source === 'object' &&
    props.source &&
    '$ref' in props.source
  ) {
    const match = String(props.source.$ref).match(/^asset:(.+)$/);
    const asset = match
      ? project.assets.find((item) => item.id === match[1])
      : undefined;
    const uri = asset?.value?.uri;
    if (typeof uri !== 'string' || !uri.trim()) {
      throw new Error('Image asset reference must resolve to a string uri.');
    }
    return uri;
  }
  if (!isGeneratedImageSource(props.source)) return props.source;

  const generated = produced.get(props.source.$generated);
  if (!generated) {
    throw new Error(
      `Generated image source "${props.source.$generated}" must reference an earlier generated node.`,
    );
  }
  return {
    $studioTarget: generated.target,
    ...(generated.member ? { member: generated.member } : {}),
  };
}


function resolveImageUtilityInput(
  project: VisualProject,
  input: VisualImageUtilityInput,
  current: string | StudioTargetReference,
  produced: Map<string, { target: string; member: 'buffer' | null }>,
): string | StudioTargetReference {
  if (isCurrentUtilityInput(input)) return current;
  if (typeof input === 'string') return input;
  if ('$ref' in input) {
    const match = String(input.$ref).match(/^asset:(.+)$/);
    const asset = match ? project.assets.find((item) => item.id === match[1]) : undefined;
    const uri = asset?.value?.uri;
    if (typeof uri !== 'string' || !uri.trim()) {
      throw new Error('Image utility asset reference must resolve to a string uri.');
    }
    return uri;
  }
  const generated = produced.get(input.$generated);
  if (!generated) {
    throw new Error(
      'Image utility generated source "' + input.$generated + '" must reference an earlier generated node.',
    );
  }
  return {
    $studioTarget: generated.target,
    ...(generated.member ? { member: generated.member } : {}),
  };
}

function imageUtilityArgs(
  project: VisualProject,
  operation: VisualImageUtilityOperation,
  current: string | StudioTargetReference,
  produced: Map<string, { target: string; member: 'buffer' | null }>,
): unknown[] {
  const resolve = (input: VisualImageUtilityInput) =>
    resolveImageUtilityInput(project, input, current, produced);

  switch (operation.type) {
    case 'resize':
      return [{
        imagePath: current,
        ...(operation.size ? { size: operation.size } : {}),
        ...(operation.maintainAspectRatio !== undefined ? { maintainAspectRatio: operation.maintainAspectRatio } : {}),
        ...(operation.quality !== undefined ? { quality: operation.quality } : {}),
        ...(operation.outputFormat ? { outputFormat: operation.outputFormat } : {}),
      }];
    case 'cropImage':
      return [{
        imageSource: current,
        coordinates: operation.coordinates,
        crop: operation.crop,
        ...(operation.radius !== undefined ? { radius: operation.radius } : {}),
      }];
    case 'effects':
      return [current, operation.filters];
    case 'colorsFilter':
      return [current, operation.filterColor, operation.opacity ?? 1];
    case 'colorsRemover':
      return [current, operation.colorToRemove];
    case 'blend':
      return [
        operation.layers.map((layer) => ({
          image: resolve(layer.source),
          blendMode: layer.blendMode,
          ...(layer.position ? { position: layer.position } : {}),
          ...(layer.opacity !== undefined ? { opacity: layer.opacity } : {}),
        })),
        current,
        operation.defaultBlendMode ?? 'source-over',
      ];
    case 'masking':
      return [current, resolve(operation.maskSource), operation.options ?? {}];
    case 'gradientBlend':
      return [
        current,
        {
          ...operation.options,
          ...(operation.options.maskSource
            ? { maskSource: resolve(operation.options.maskSource) }
            : {}),
        },
      ];
    case 'stitchImages':
      return [operation.images.map(resolve), operation.options ?? {}];
    case 'createCollage':
      return [
        operation.images.map((item) => ({
          source: resolve(item.source),
          ...(item.width !== undefined ? { width: item.width } : {}),
          ...(item.height !== undefined ? { height: item.height } : {}),
        })),
        operation.layout,
      ];
    case 'imgConverter':
      return [current, operation.newExtension];
    case 'compress':
      return [current, operation.options ?? {}];
  }
}

function imageAnalysisArgs(
  analysis: VisualImageUtilityAnalysis,
  current: string | StudioTargetReference,
): unknown[] {
  return analysis.type === 'extractPalette'
    ? [current, analysis.options ?? {}]
    : [current];
}

function imageOperationProperties(
  project: VisualProject,
  node: VisualNode,
  produced: Map<string, { target: string; member: 'buffer' | null }>,
): StudioImageProperties {
  const props = visualImageProps(node);
  const {
    source: _source,
    createOptions: _options,
    utilityStack: _utilityStack,
    utilityAnalyses: _utilityAnalyses,
    ...rest
  } = props;
  const transform = node.transform ?? {};
  const width =
    transform.width === undefined
      ? undefined
      : transform.width * (transform.scaleX ?? 1);
  const height =
    transform.height === undefined
      ? undefined
      : transform.height * (transform.scaleY ?? 1);

  return {
    ...rest,
    source: resolveImageSource(project, props, produced),
    x: transform.x ?? 0,
    y: transform.y ?? 0,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(transform.rotation !== undefined ? { rotation: transform.rotation } : {}),
    ...(transform.opacity !== undefined ? { opacity: transform.opacity } : {}),
  };
}

function textOperationProperties(node: VisualNode): StudioTextProperties {
  const props = visualTextProps(node);
  const transform = node.transform ?? {};
  const layout = {
    ...(props.layout ?? {}),
    ...(transform.width !== undefined
      ? { maxWidth: transform.width * (transform.scaleX ?? 1) }
      : {}),
    ...(transform.height !== undefined
      ? { maxHeight: transform.height * (transform.scaleY ?? 1) }
      : {}),
  };
  const placement = {
    ...(props.placement ?? {}),
    ...(transform.rotation !== undefined
      ? { rotation: transform.rotation }
      : {}),
  };
  const fill = {
    ...(props.fill ?? {}),
    ...(transform.opacity !== undefined
      ? { opacity: transform.opacity }
      : {}),
  };

  return {
    ...props,
    x: transform.x ?? 0,
    y: transform.y ?? 0,
    ...(Object.keys(layout).length ? { layout } : {}),
    ...(Object.keys(placement).length ? { placement } : {}),
    ...(Object.keys(fill).length ? { fill } : {}),
  };
}

function pathOperationOptions(node: VisualNode): StudioPathDrawOptions {
  const props = visualPathProps(node);
  const transform = node.transform ?? {};
  const width = Math.max(1, props.viewport.width);
  const height = Math.max(1, props.viewport.height);
  const scaleX = (transform.width ?? width) * (transform.scaleX ?? 1) / width;
  const scaleY = (transform.height ?? height) * (transform.scaleY ?? 1) / height;
  return {
    ...(props.draw ?? {}),
    opacity: (props.draw?.opacity ?? 1) * (transform.opacity ?? 1),
    transform: {
      ...(props.draw?.transform ?? {}),
      translateX: (props.draw?.transform?.translateX ?? 0) + (transform.x ?? 0),
      translateY: (props.draw?.transform?.translateY ?? 0) + (transform.y ?? 0),
      rotate: (props.draw?.transform?.rotate ?? 0) + (transform.rotation ?? 0),
      scaleX: (props.draw?.transform?.scaleX ?? 1) * scaleX,
      scaleY: (props.draw?.transform?.scaleY ?? 1) * scaleY,
    },
  };
}

function translatedConnector(
  node: VisualNode,
  value: StudioConnectorOptions | StudioConnectorOptions[],
): StudioConnectorOptions | StudioConnectorOptions[] {
  const props = visualPathProps(node);
  const transform = node.transform ?? {};
  const scaleX = ((transform.width ?? props.viewport.width) * (transform.scaleX ?? 1)) / Math.max(1, props.viewport.width);
  const scaleY = ((transform.height ?? props.viewport.height) * (transform.scaleY ?? 1)) / Math.max(1, props.viewport.height);
  const tx = transform.x ?? 0;
  const ty = transform.y ?? 0;
  const rotation = ((transform.rotation ?? 0) * Math.PI) / 180;
  const centerX = tx + (props.viewport.width * scaleX) / 2;
  const centerY = ty + (props.viewport.height * scaleY) / 2;
  const rotate = (point: { x: number; y: number }) => {
    const x = tx + point.x * scaleX;
    const y = ty + point.y * scaleY;
    if (!rotation) return { x, y };
    const dx = x - centerX;
    const dy = y - centerY;
    return {
      x: centerX + dx * Math.cos(rotation) - dy * Math.sin(rotation),
      y: centerY + dx * Math.sin(rotation) + dy * Math.cos(rotation),
    };
  };
  const convert = (item: StudioConnectorOptions): StudioConnectorOptions => ({
    ...item,
    startCoordinates: rotate(item.startCoordinates),
    endCoordinates: rotate(item.endCoordinates),
  });
  return Array.isArray(value) ? value.map(convert) : convert(value);
}

function pathDetectionPoint(
  node: VisualNode,
  point: { x: number; y: number },
): { x: number; y: number } {
  const options = pathOperationOptions(node);
  const transform = options.transform ?? {};
  const scaleX = transform.scaleX ?? 1;
  const scaleY = transform.scaleY ?? 1;
  const rotation = ((transform.rotate ?? 0) * Math.PI) / 180;

  if (transform.originX !== undefined && transform.originY !== undefined) {
    const dx = point.x - (transform.translateX ?? 0) - transform.originX;
    const dy = point.y - (transform.translateY ?? 0) - transform.originY;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    return {
      x: transform.originX + rotatedX / (scaleX || 1),
      y: transform.originY + rotatedY / (scaleY || 1),
    };
  }

  const translatedX = point.x - (transform.translateX ?? 0);
  const translatedY = point.y - (transform.translateY ?? 0);
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;
  return {
    x: rotatedX / (scaleX || 1),
    y: rotatedY / (scaleY || 1),
  };
}

export function lowerVisualProject(project: VisualProject): StudioOperationPlan {
  const normalized = normalizeVisualProject(project);
  assertValidVisualProject(normalized);
  const resolved = resolvePhase9References(normalized);
  const registry = phase9RegistryRecords(normalized);

  const operations: StudioOperation[] = [];

  for (const asset of registry.assets) {
    const name =
      typeof asset.value?.registryName === 'string'
        ? asset.value.registryName
        : (asset.name ?? asset.id).replace(/[^A-Za-z0-9_]/g, '_');
    const uri = asset.value?.uri;
    if (typeof uri === 'string' && uri) {
      operations.push({
        id: 'asset_' + asset.id,
        kind: 'register-asset',
        registryKind: 'image',
        name,
        value: uri,
      });
    }
  }
  for (const variable of registry.variables) {
    const name =
      typeof variable.value?.registryName === 'string'
        ? variable.value.registryName
        : (variable.name ?? variable.id).replace(/[^A-Za-z0-9_]/g, '_');
    operations.push({
      id: 'variable_' + variable.id,
      kind: 'register-asset',
      registryKind: 'value',
      name,
      value: variable.value?.value ?? null,
    });
  }
  for (const palette of registry.palettes) {
    const name =
      typeof palette.value?.registryName === 'string'
        ? palette.value.registryName
        : (palette.name ?? palette.id).replace(/[^A-Za-z0-9_]/g, '_');
    const colors =
      palette.value?.colors && typeof palette.value.colors === 'object' && !Array.isArray(palette.value.colors)
        ? palette.value.colors
        : palette.value ?? {};
    operations.push({
      id: 'palette_' + palette.id,
      kind: 'register-asset',
      registryKind: 'palette',
      name,
      value: colors as VisualValue,
    });
  }

  operations.push(
    {
      id: 'document_canvas',
      kind: 'create-canvas',
      source: 'document',
      target: 'canvas',
      options: {
        width: normalized.document.width,
        height: normalized.document.height,
        ...(normalized.document.canvas ?? {}),
      },
    },
  );

  const produced = new Map<string, { target: string; member: 'buffer' | null }>([
    ['document_canvas', { target: 'canvas', member: 'buffer' }],
  ]);

  let base: StudioTargetReference = { $studioTarget: 'canvas', member: 'buffer' };
  let lastTarget = 'canvas';
  let lastMember: 'buffer' | null = 'buffer';

  const deferredOutputUtilities: Array<{
    nodeId: string;
    nodeName: string;
    utilityIndex: number;
    utility: Extract<VisualImageUtilityOperation, { type: 'imgConverter' | 'compress' }>;
  }> = [];

  for (const node of orderedAuthoringNodes(normalized)) {
    const target = node.id;

    if (node.kind === 'scene' || node.kind === 'surface') {
      operations.push({
        id: 'scene_' + node.id,
        kind: 'create-scene',
        sourceNodeId: node.id,
        target,
        preferredName: node.name || (node.kind === 'surface' ? 'surface' : 'scene'),
        base,
        definition: phase9SceneDefinition(normalized, node),
        placement: {
          x: node.transform?.x ?? 0,
          y: node.transform?.y ?? 0,
          width: Math.max(1, node.transform?.width ?? normalized.document.width),
          height: Math.max(1, node.transform?.height ?? normalized.document.height),
          ...(node.transform?.rotation !== undefined ? { rotation: node.transform.rotation } : {}),
          ...(node.transform?.opacity !== undefined ? { opacity: node.transform.opacity } : {}),
        },
      });
      produced.set(node.id, { target, member: null });
      base = { $studioTarget: target };
      lastTarget = target;
      lastMember = null;
      continue;
    }

    if (node.kind === 'component' || node.kind === 'template-instance') {
      const definitionId =
        typeof node.props.definitionId === 'string' ? node.props.definitionId : '';
      const definition = phase9Definition(normalized, definitionId);
      if (!definition) {
        throw new Error('Component/template instance "' + node.id + '" references a missing definition.');
      }
      const data =
        node.props.data && typeof node.props.data === 'object' && !Array.isArray(node.props.data)
          ? node.props.data as Record<string, VisualValue>
          : {};
      const overrides =
        node.props.overrides && typeof node.props.overrides === 'object' && !Array.isArray(node.props.overrides)
          ? node.props.overrides as Record<string, Record<string, VisualValue>>
          : {};
      const insertions = Array.isArray(node.props.insertions)
        ? node.props.insertions
        : [];
      operations.push({
        id: 'template_' + node.id,
        kind: 'render-template',
        sourceNodeId: node.id,
        target,
        preferredName: node.name || definition.name,
        base,
        definitionId,
        definitionName: definition.name,
        definition: phase9TemplateSceneDefinition(normalized, definition),
        data,
        overrides,
        insertions,
        placement: {
          x: node.transform?.x ?? 0,
          y: node.transform?.y ?? 0,
          width: Math.max(1, node.transform?.width ?? definition.width),
          height: Math.max(1, node.transform?.height ?? definition.height),
          ...(node.transform?.rotation !== undefined ? { rotation: node.transform.rotation } : {}),
          ...(node.transform?.opacity !== undefined ? { opacity: node.transform.opacity } : {}),
        },
      });
      produced.set(node.id, { target, member: null });
      base = { $studioTarget: target };
      lastTarget = target;
      lastMember = null;
      continue;
    }

    const resolvedNode = resolved.document.nodes[node.id] ?? node;

    if (node.kind === 'chart') {
      const props = visualChartProps(resolvedNode);
      const chartTarget = node.id + '_chart_buffer';
      if (props.family === 'comparison') {
        operations.push({
          id: 'chart_' + node.id,
          kind: 'create-comparison-chart',
          sourceNodeId: node.id,
          target: chartTarget,
          preferredName: node.name || 'comparisonChart',
          options: props.options,
        });
      } else if (props.family === 'combo') {
        operations.push({
          id: 'chart_' + node.id,
          kind: 'create-combo-chart',
          sourceNodeId: node.id,
          target: chartTarget,
          preferredName: node.name || 'comboChart',
          options: props.options,
        });
      } else {
        operations.push({
          id: 'chart_' + node.id,
          kind: 'create-chart',
          sourceNodeId: node.id,
          target: chartTarget,
          preferredName: node.name || props.family + 'Chart',
          family: props.family === 'donut' ? 'pie' : props.family,
          data: props.data ?? [],
          options: props.options,
        });
      }

      const dimensions =
        props.options && typeof props.options.dimensions === 'object' && props.options.dimensions && !Array.isArray(props.options.dimensions)
          ? props.options.dimensions as Record<string, VisualValue>
          : {};
      operations.push({
        id: 'chart_compose_' + node.id,
        kind: 'create-image',
        sourceNodeId: node.id,
        target,
        preferredName: node.name || 'chartLayer',
        base,
        properties: {
          source: { $studioTarget: chartTarget },
          x: node.transform?.x ?? 0,
          y: node.transform?.y ?? 0,
          width:
            node.transform?.width ??
            (typeof dimensions.width === 'number' ? dimensions.width : 640),
          height:
            node.transform?.height ??
            (typeof dimensions.height === 'number' ? dimensions.height : 400),
          rotation: node.transform?.rotation ?? 0,
          opacity: node.transform?.opacity ?? 1,
          fit: 'fill',
        },
      });

      produced.set(node.id, { target: chartTarget, member: null });
      base = { $studioTarget: target };
      lastTarget = target;
      lastMember = null;
      continue;
    }

    if (node.kind === 'text') {
      operations.push({
        id: 'text_' + node.id,
        kind: 'create-text',
        sourceNodeId: node.id,
        target,
        preferredName: node.name || 'text',
        base,
        properties: textOperationProperties(resolvedNode),
      });
    } else if (node.kind === 'path' || node.kind === 'freehand') {
      const props = visualPathProps(node);
      if (props.tool === 'connector') {
        if (!props.connector) throw new Error('Connector path is missing connector options.');
        operations.push({
          id: 'path_' + node.id,
          kind: 'path-custom',
          sourceNodeId: node.id,
          target,
          preferredName: node.name || 'connector',
          base,
          options: translatedConnector(resolvedNode, props.connector),
        });
      } else {
        operations.push({
          id: 'path_' + node.id,
          kind: 'path-draw',
          sourceNodeId: node.id,
          target,
          preferredName: node.name || (node.kind === 'freehand' ? 'freehand' : 'path'),
          base,
          commands: props.commands ?? [],
          options: pathOperationOptions(resolvedNode),
        });
      }
    } else {
      const props = visualImageProps(resolvedNode);
      const imageProperties = imageOperationProperties(resolved, resolvedNode, produced);
      let utilitySource = imageProperties.source;

      for (const [utilityIndex, utility] of (props.utilityStack ?? []).entries()) {
        if (utility.enabled === false) continue;
        if (utility.type === 'imgConverter' || utility.type === 'compress') {
          deferredOutputUtilities.push({
            nodeId: node.id,
            nodeName: node.name || 'image',
            utilityIndex,
            utility,
          });
          continue;
        }
        const utilityTarget = node.id + '__utility_' + utilityIndex;
        operations.push({
          id: 'image_utility_' + node.id + '_' + utility.id,
          kind: 'image-utility',
          sourceNodeId: node.id,
          target: utilityTarget,
          preferredName: (node.name || 'image') + '_' + utility.type,
          method: utility.type,
          args: imageUtilityArgs(resolved, utility, utilitySource, produced),
        });
        utilitySource = { $studioTarget: utilityTarget };
      }

      for (const analysis of props.utilityAnalyses ?? []) {
        if (analysis.enabled === false) continue;
        operations.push({
          id: 'image_analysis_' + node.id + '_' + analysis.id,
          kind: 'image-analysis',
          sourceNodeId: node.id,
          target: node.id + '__analysis_' + analysis.id,
          preferredName: (node.name || 'image') + '_' + analysis.type,
          resultName: analysis.id,
          method: analysis.type,
          args: imageAnalysisArgs(analysis, utilitySource),
        });
      }

      operations.push({
        id: 'image_' + node.id,
        kind: 'create-image',
        sourceNodeId: node.id,
        target,
        preferredName: node.name || (node.kind === 'shape' ? 'shape' : 'image'),
        base,
        properties: { ...imageProperties, source: utilitySource },
        ...(props.createOptions ? { options: props.createOptions } : {}),
      });
    }

    produced.set(node.id, { target, member: null });
    base = { $studioTarget: target };
    lastTarget = target;
    lastMember = null;
  }

  for (const record of normalized.operations) {
    const pixel = pixelOperation(record);
    if (pixel) {
      const target = record.id;
      if (pixel.type === 'manipulate') {
        operations.push({
          id: 'pixel_' + record.id,
          kind: 'pixels-manipulate',
          sourceOperationId: record.id,
          target,
          preferredName: record.name || 'pixels',
          base,
          options: {
            filter: pixel.filter,
            ...(pixel.intensity !== undefined ? { intensity: pixel.intensity } : {}),
            ...(pixel.region ? { region: pixel.region } : {}),
          },
        });
      } else {
        operations.push({
          id: 'pixel_' + record.id,
          kind: 'pixels-set-color',
          sourceOperationId: record.id,
          target,
          preferredName: record.name || 'pixel',
          base,
          x: pixel.x,
          y: pixel.y,
          color: pixel.color,
        });
      }
      base = { $studioTarget: target };
      lastTarget = target;
      lastMember = null;
      continue;
    }

    const inspection = detectionOperation(record);
    if (!inspection) continue;
    const target = record.id + '_result';
    const preferredName = inspection.resultName || record.name || 'result';
    if (inspection.type === 'pixelColor') {
      operations.push({
        id: 'inspect_' + record.id,
        kind: 'pixels-get-color',
        sourceOperationId: record.id,
        target,
        preferredName,
        base,
        x: inspection.x,
        y: inspection.y,
      });
    } else if (inspection.type === 'pixelData') {
      operations.push({
        id: 'inspect_' + record.id,
        kind: 'pixels-get-data',
        sourceOperationId: record.id,
        target,
        preferredName,
        base,
        ...(inspection.region ? { region: inspection.region } : {}),
      });
    } else if (inspection.type === 'detectPath') {
      const node = normalized.document.nodes[inspection.pathNodeId];
      if (!node || (node.kind !== 'path' && node.kind !== 'freehand')) {
        throw new Error('Detection path operation references an unavailable path node.');
      }
      const path = visualPathProps(node);
      if (!path.commands) throw new Error('Detection requires Path2D commands; custom connectors are not path regions.');
      const localPoint = pathDetectionPoint(node, {
        x: inspection.x,
        y: inspection.y,
      });
      operations.push({
        id: 'inspect_' + record.id,
        kind: 'detect-path',
        sourceOperationId: record.id,
        target,
        preferredName,
        base,
        pathSourceNodeId: node.id,
        commands: path.commands,
        x: localPoint.x,
        y: localPoint.y,
        options: {
          ...(inspection.includeStroke !== undefined ? { includeStroke: inspection.includeStroke } : {}),
          ...(inspection.strokeWidth !== undefined ? { strokeWidth: inspection.strokeWidth } : {}),
          ...(inspection.tolerance !== undefined ? { tolerance: inspection.tolerance } : {}),
          ...(inspection.fillRule ? { fillRule: inspection.fillRule } : {}),
        },
      });
    } else if (inspection.type === 'detectRegion') {
      operations.push({
        id: 'inspect_' + record.id,
        kind: 'detect-region',
        sourceOperationId: record.id,
        target,
        preferredName,
        base,
        region: inspection.region,
        x: inspection.x,
        y: inspection.y,
        options: {
          ...(inspection.includeStroke !== undefined ? { includeStroke: inspection.includeStroke } : {}),
          ...(inspection.strokeWidth !== undefined ? { strokeWidth: inspection.strokeWidth } : {}),
          ...(inspection.tolerance !== undefined ? { tolerance: inspection.tolerance } : {}),
          ...(inspection.fillRule ? { fillRule: inspection.fillRule } : {}),
        },
      });
    } else if (inspection.type === 'detectAnyRegion') {
      operations.push({
        id: 'inspect_' + record.id,
        kind: 'detect-any-region',
        sourceOperationId: record.id,
        target,
        preferredName,
        base,
        regions: inspection.regions,
        x: inspection.x,
        y: inspection.y,
        options: {
          ...(inspection.includeStroke !== undefined ? { includeStroke: inspection.includeStroke } : {}),
          ...(inspection.strokeWidth !== undefined ? { strokeWidth: inspection.strokeWidth } : {}),
          ...(inspection.tolerance !== undefined ? { tolerance: inspection.tolerance } : {}),
          ...(inspection.fillRule ? { fillRule: inspection.fillRule } : {}),
        },
      });
    } else {
      operations.push({
        id: 'inspect_' + record.id,
        kind: 'detect-distance',
        sourceOperationId: record.id,
        target,
        preferredName,
        base,
        region: inspection.region,
        x: inspection.x,
        y: inspection.y,
      });
    }
  }

  for (const entry of deferredOutputUtilities) {
    const outputTarget =
      entry.nodeId + '__output_' + entry.utilityIndex;
    operations.push({
      id: 'image_output_' + entry.nodeId + '_' + entry.utility.id,
      kind: 'image-utility',
      sourceNodeId: entry.nodeId,
      target: outputTarget,
      preferredName: entry.nodeName + '_' + entry.utility.type,
      method: entry.utility.type,
      args: imageUtilityArgs(resolved, entry.utility, base, produced),
    });
    base = { $studioTarget: outputTarget };
    lastTarget = outputTarget;
    lastMember = null;
  }

  return {
    version: STUDIO_OPERATION_PLAN_VERSION,
    projectId: normalized.id,
    schemaVersion: normalized.schemaVersion,
    operations,
    result: {
      target: lastTarget,
      member: lastMember,
    },
  };
}
