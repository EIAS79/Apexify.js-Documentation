import type {
  VisualCanvasConfig,
  VisualCreateImageOptions,
  VisualImageNodeProps,
  VisualNode,
  VisualProject,
  VisualTextNodeProps,
} from '../model';
import { isGeneratedImageSource, visualImageProps } from '../image-contract';
import { visualTextProps } from '../text-contract';
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
  | StudioCreateTextOperation
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

    if (node.kind === 'group' || node.kind === 'surface') {
      for (const childId of node.childIds ?? []) visit(childId);
      return;
    }

    if (
      node.kind === 'image' ||
      node.kind === 'shape' ||
      node.kind === 'text' ||
      node.kind === 'path' ||
      node.kind === 'freehand'
    ) {
      out.push(node);
      return;
    }

    throw new Error(
      `STUDIO-VISUAL-7 cannot lower node kind "${node.kind}" yet. It belongs to a later authoring phase.`,
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

function imageOperationProperties(
  project: VisualProject,
  node: VisualNode,
  produced: Map<string, { target: string; member: 'buffer' | null }>,
): StudioImageProperties {
  const props = visualImageProps(node);
  const { source: _source, createOptions: _options, ...rest } = props;
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
    const dx = point.x - transform.originX;
    const dy = point.y - transform.originY;
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

  const operations: StudioOperation[] = [
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
  ];

  const produced = new Map<string, { target: string; member: 'buffer' | null }>([
    ['document_canvas', { target: 'canvas', member: 'buffer' }],
  ]);

  let base: StudioTargetReference = { $studioTarget: 'canvas', member: 'buffer' };
  let lastTarget = 'canvas';
  let lastMember: 'buffer' | null = 'buffer';

  for (const node of orderedAuthoringNodes(normalized)) {
    const target = node.id;

    if (node.kind === 'text') {
      operations.push({
        id: 'text_' + node.id,
        kind: 'create-text',
        sourceNodeId: node.id,
        target,
        preferredName: node.name || 'text',
        base,
        properties: textOperationProperties(node),
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
          options: translatedConnector(node, props.connector),
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
          options: pathOperationOptions(node),
        });
      }
    } else {
      const props = visualImageProps(node);
      operations.push({
        id: 'image_' + node.id,
        kind: 'create-image',
        sourceNodeId: node.id,
        target,
        preferredName: node.name || (node.kind === 'shape' ? 'shape' : 'image'),
        base,
        properties: imageOperationProperties(normalized, node, produced),
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
    if (!pixel) continue;
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
  }

  for (const record of normalized.operations) {
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
