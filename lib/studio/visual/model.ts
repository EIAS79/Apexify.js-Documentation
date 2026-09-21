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


export type VisualGradientStop = { stop: number; color: string };

export type VisualGradient =
  | {
      type: 'linear';
      startX?: number;
      startY?: number;
      endX?: number;
      endY?: number;
      rotate?: number;
      pivotX?: number;
      pivotY?: number;
      repeat?: 'repeat' | 'reflect' | 'no-repeat';
      colors: VisualGradientStop[];
    }
  | {
      type: 'radial';
      startX?: number;
      startY?: number;
      startRadius?: number;
      endX?: number;
      endY?: number;
      endRadius?: number;
      rotate?: number;
      pivotX?: number;
      pivotY?: number;
      repeat?: 'repeat' | 'reflect' | 'no-repeat';
      colors: VisualGradientStop[];
    }
  | {
      type: 'conic';
      centerX?: number;
      centerY?: number;
      startAngle?: number;
      rotate?: number;
      pivotX?: number;
      pivotY?: number;
      colors: VisualGradientStop[];
    };

export type VisualPatternType =
  | 'grid'
  | 'dots'
  | 'diagonal'
  | 'stripes'
  | 'waves'
  | 'crosses'
  | 'hexagons'
  | 'checkerboard'
  | 'diamonds'
  | 'triangles'
  | 'stars'
  | 'polka'
  | 'custom';

export interface VisualPatternOptions {
  type: VisualPatternType;
  color?: string;
  secondaryColor?: string;
  opacity?: number;
  size?: number;
  spacing?: number;
  rotation?: number;
  customPatternImage?: string;
  repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  blendMode?: string;
  gradient?: VisualGradient;
}

export interface VisualStrokeOptions {
  color?: string;
  gradient?: VisualGradient;
  width?: number;
  position?: number;
  blur?: number;
  opacity?: number;
  borderRadius?: number | 'circular';
  borderPosition?: string;
  roundedCorners?: string;
  style?: 'solid' | 'dashed' | 'dotted' | 'groove' | 'ridge' | 'double';
}

export interface VisualShadowOptions {
  color?: string;
  gradient?: VisualGradient;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  opacity?: number;
  borderRadius?: number | 'circular';
  roundedCorners?: string;
  borderPosition?: string;
}

export type VisualBackgroundLayer =
  | { type: 'color'; value: string; opacity?: number; blendMode?: string }
  | { type: 'gradient'; value: VisualGradient; opacity?: number; blendMode?: string }
  | {
      type: 'image';
      source: string;
      opacity?: number;
      fit?: 'fill' | 'contain' | 'cover';
      align?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      blendMode?: string;
    }
  | {
      type: 'pattern';
      source: string;
      repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
      opacity?: number;
      blendMode?: string;
    }
  | { type: 'presetPattern'; pattern: VisualPatternOptions; opacity?: number; blendMode?: string }
  | { type: 'noise'; intensity?: number; blendMode?: string };

export interface VisualImageFilter {
  type:
    | 'gaussianBlur'
    | 'motionBlur'
    | 'radialBlur'
    | 'sharpen'
    | 'noise'
    | 'grain'
    | 'edgeDetection'
    | 'emboss'
    | 'invert'
    | 'grayscale'
    | 'sepia'
    | 'pixelate'
    | 'brightness'
    | 'contrast'
    | 'saturation'
    | 'hueShift'
    | 'posterize';
  intensity?: number;
  radius?: number;
  angle?: number;
  centerX?: number;
  centerY?: number;
  value?: number;
  levels?: number;
  size?: number;
}

export interface VisualCanvasConfig {
  x?: number;
  y?: number;
  customBg?: {
    source: string;
    inherit?: boolean;
    fit?: 'fill' | 'contain' | 'cover';
    align?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    filters?: VisualImageFilter[];
    opacity?: number;
  };
  videoBg?: {
    source: string;
    frame?: number;
    time?: number;
    loop?: boolean;
    autoplay?: boolean;
    opacity?: number;
    format?: 'jpg' | 'png';
    quality?: number;
  };
  colorBg?: string;
  gradientBg?: VisualGradient;
  patternBg?: VisualPatternOptions;
  noiseBg?: { intensity?: number };
  transparentBase?: boolean;
  bgLayers?: VisualBackgroundLayer[];
  blendMode?: string;
  opacity?: number;
  blur?: number;
  rotation?: number;
  borderRadius?: number | 'circular';
  borderPosition?: string;
  zoom?: { scale?: number; centerX?: number; centerY?: number };
  stroke?: VisualStrokeOptions;
  shadow?: VisualShadowOptions;
}

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
  canvas?: VisualCanvasConfig;
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
