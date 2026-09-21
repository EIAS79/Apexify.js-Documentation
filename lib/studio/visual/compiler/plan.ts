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

export type StudioOperation =
  | StudioCreateCanvasOperation
  | StudioCreateImageOperation
  | StudioCreateTextOperation;

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

    if (node.kind === 'image' || node.kind === 'shape' || node.kind === 'text') {
      out.push(node);
      return;
    }

    throw new Error(
      `STUDIO-VISUAL-6 cannot lower node kind "${node.kind}" yet. It belongs to a later authoring phase.`,
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
