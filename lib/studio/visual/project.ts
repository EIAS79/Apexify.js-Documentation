import {
  VISUAL_PROJECT_FORMAT,
  VISUAL_PROJECT_SCHEMA_VERSION,
  type VisualNode,
  type VisualNodeKind,
  type VisualProject,
  type VisualValue,
} from './model';
import { createVisualId } from './ids';

export type CreateVisualProjectOptions = {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  now?: string;
};

export function createVisualProject(options: CreateVisualProjectOptions = {}): VisualProject {
  const now = options.now ?? new Date().toISOString();
  return {
    format: VISUAL_PROJECT_FORMAT,
    schemaVersion: VISUAL_PROJECT_SCHEMA_VERSION,
    id: options.id ?? createVisualId('project'),
    name: options.name ?? 'Untitled Visual Project',
    createdAt: now,
    updatedAt: now,
    document: {
      width: options.width ?? 1440,
      height: options.height ?? 900,
      pixelRatioPolicy: 'auto',
      rootNodeIds: [],
      nodes: {},
    },
    assets: [],
    palettes: [],
    variables: [],
    timelines: [],
    outputs: [],
    operations: [],
    codegen: {
      language: 'typescript',
      singleFile: true,
      assetBasePath: './assets/',
    },
    editor: {
      selectedNodeIds: [],
      zoom: 0.78,
      panX: 0,
      panY: 0,
    },
  };
}

export function createVisualNode(
  kind: VisualNodeKind,
  props: Record<string, VisualValue> = {},
  options: { id?: string; name?: string } = {},
): VisualNode {
  return {
    id: options.id ?? createVisualId(kind),
    kind,
    ...(options.name ? { name: options.name } : {}),
    props,
  };
}
