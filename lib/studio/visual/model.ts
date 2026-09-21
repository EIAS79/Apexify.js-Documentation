export const VISUAL_PROJECT_FORMAT = 'apexify-studio-visual' as const;
export const VISUAL_PROJECT_SCHEMA_VERSION = 1 as const;
export const VISUAL_PROJECT_FILE_SUFFIX = '.apexstudio.json' as const;

export type VisualNodeKind =
  | 'canvas'
  | 'group'
  | 'surface'
  | 'image'
  | 'shape'
  | 'text'
  | 'chart'
  | 'path'
  | 'freehand'
  | 'pixel-operation'
  | 'component'
  | 'template-instance'
  | 'scene'
  | 'gif-composition'
  | 'audio-composition'
  | 'video-composition'
  | 'generated-buffer';

export type VisualPrimitive = string | number | boolean | null;
export type VisualReferenceKind = 'asset' | 'variable' | 'palette';

export interface VisualReference {
  $ref: `${VisualReferenceKind}:${string}`;
}

export type VisualValue =
  | VisualPrimitive
  | VisualReference
  | VisualValue[]
  | { [key: string]: VisualValue };

export interface VisualTransform {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  anchorX?: number;
  anchorY?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  zIndex?: number;
}

export interface VisualNode {
  id: string;
  kind: VisualNodeKind;
  name?: string;
  parentId?: string | null;
  childIds?: string[];
  transform?: VisualTransform;
  props: Record<string, VisualValue>;
}

export interface VisualDocument {
  width: number;
  height: number;
  pixelRatioPolicy?: 'auto' | 'fixed' | 'capped-auto';
  background?: VisualValue;
  rootNodeIds: string[];
  nodes: Record<string, VisualNode>;
}

export interface VisualProjectRecord {
  id: string;
  kind: string;
  name?: string;
  value?: Record<string, VisualValue>;
}

export interface VisualCodegenSettings {
  language: 'typescript';
  singleFile: boolean;
  assetBasePath: './assets/';
}

export interface VisualEditorState {
  selectedNodeIds?: string[];
  zoom?: number;
  panX?: number;
  panY?: number;
}

export interface VisualProject {
  format: typeof VISUAL_PROJECT_FORMAT;
  schemaVersion: typeof VISUAL_PROJECT_SCHEMA_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  document: VisualDocument;
  assets: VisualProjectRecord[];
  palettes: VisualProjectRecord[];
  variables: VisualProjectRecord[];
  timelines: VisualProjectRecord[];
  outputs: VisualProjectRecord[];
  operations: VisualProjectRecord[];
  codegen: VisualCodegenSettings;
  editor?: VisualEditorState;
}

export type VisualProjectIssueSeverity = 'error' | 'warning';

export interface VisualProjectIssue {
  severity: VisualProjectIssueSeverity;
  code: string;
  path: string;
  message: string;
}

export interface VisualProjectValidation {
  ok: boolean;
  issues: VisualProjectIssue[];
}
