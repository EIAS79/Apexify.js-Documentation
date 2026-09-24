'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
  type ReactNode,
  type CSSProperties,
} from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ChartBarIcon,
  CircleStackIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  FilmIcon,
  HandRaisedIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlayIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { createApexifyWebRuntime, type ApexifyWebRuntime } from '@apexify/web';
import { BrandIcon } from '@/components/Brand';
import { InteractiveCodeEditor } from '@/components/docs/playground/InteractiveCodeEditor';
import {
  VisualCodeModal,
  VisualPreviewModal,
} from '@/components/studio/visual/VisualStudioModals';
import {
  ChartFamilyPicker,
  VisualChartInspector,
} from '@/components/studio/visual/VisualChartAuthoring';
import {
  VisualComponentsContext,
  VisualPhase9Inspector,
} from '@/components/studio/visual/VisualSceneComponentAuthoring';
import { VisualImageUtilityAuthoring } from '@/components/studio/visual/VisualImageUtilityAuthoring';
import {
  VisualGifContext,
  VisualGifTimeline,
} from '@/components/studio/visual/VisualGifAuthoring';
import {
  VisualAudioContext,
  VisualAudioInspector,
  VisualAudioTimeline,
} from '@/components/studio/visual/VisualAudioAuthoring';
import {
  VisualVideoContext,
  VisualVideoInspector,
  VisualVideoTimeline,
} from '@/components/studio/visual/VisualVideoAuthoring';
import { useStudioSharedSession } from '@/components/studio/StudioSharedSession';
import { StudioAssetShelf } from '@/components/studio/StudioAssetShelf';
import {
  STUDIO_ASSET_LIMITS,
  fileToStudioAsset,
  isStudioFontAsset,
  studioAssetDataUrl,
  studioAssetFontFamily,
  studioAssetIdFromReference,
  studioAssetReference,
  totalStudioAssetBytes,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';
import {
  StudioModeSwitch,
  type StudioMode,
} from '@/components/studio/StudioModeSwitch';
import { createVisualId } from '@/lib/studio/visual/ids';
import {
  createVisualNode,
  createVisualProject,
} from '@/lib/studio/visual/project';
import {
  generateVisualProjectCode,
  generateVisualProjectDisplayPreviewCode,
  generateVisualProjectPreviewCode,
} from '@/lib/studio/visual/codegen/generator';
import { hasPhase9Authoring } from '@/lib/studio/visual/phase9-codegen';
import { hasPhase10Authoring } from '@/lib/studio/visual/phase10-codegen';
import { hasPhase11Authoring } from '@/lib/studio/visual/phase11-codegen';
import { hasPhase12Authoring } from '@/lib/studio/visual/phase12-codegen';
import { hasPhase13Authoring } from '@/lib/studio/visual/phase13-codegen';
import { createInteractiveSession } from '@/lib/docs/playground/session';
import { currentNodeServerExecutionAdapter } from '@/lib/docs/playground/serverClientAdapter';
import { validateVisualProject } from '@/lib/studio/visual/compiler/validate';
import {
  reconcileVisualProjectFromCode,
  safeVisualDownloadStem,
} from '@/lib/studio/visual/codegen/reconcile';
import {
  downloadVisualProject,
  loadVisualProjectFile,
} from '@/lib/studio/visual/persistence';
import type {
  VisualBackgroundLayer,
  VisualBlendMode,
  VisualCanvasConfig,
  VisualGradient,
  VisualImageFilter,
  VisualImageNodeProps,
  VisualNode,
  VisualPatternOptions,
  VisualProject,
  VisualShapeType,
  VisualTextNodeProps,
  VisualTransform,
  VisualValue,
} from '@/lib/studio/visual/model';
import {
  CANVAS_ALIGNMENTS,
  CANVAS_BLEND_MODES,
  CANVAS_FITS,
  CANVAS_PATTERN_TYPES,
  defaultBackgroundLayer,
  defaultCanvasGradient,
  defaultCanvasPattern,
} from '@/lib/studio/visual/canvas-contract';
import {
  IMAGE_ALIGNS,
  IMAGE_BLEND_MODES,
  IMAGE_FILTER_TYPES,
  IMAGE_FITS,
  IMAGE_SHAPE_TYPES,
  defaultImageNodeProps,
  defaultShapeNodeProps,
  imagePropsRecord,
  visualImageProps,
} from '@/lib/studio/visual/image-contract';
import {
  TEXT_ALIGNMENTS,
  TEXT_BASELINES,
  TEXT_CURVE_MODES,
  defaultTextNodeProps,
  measureVisualTextInBrowser,
  textPropsRecord,
  visualTextProps,
} from '@/lib/studio/visual/text-contract';
import {
  defaultChartNodeProps,
  chartPropsRecord,
  visualChartProps,
  type VisualChartFamily,
  type VisualChartNodeProps,
} from '@/lib/studio/visual/chart-contract';
import {
  defaultPathNodeProps,
  detectionOperation,
  operationRecord,
  pathPropsRecord,
  visualPathProps,
  type StudioDetectionOperation,
  type StudioPathCommand,
  type StudioPixelOperation,
  type VisualPathNodeProps,
} from '@/lib/studio/visual/path-pixel-contract';
import {
  VisualHistory,
  alignNodes,
  copyNodes,
  deleteNodes,
  duplicateNodes,
  flattenLayerIds,
  groupNodes,
  moveNodeInStack,
  moveNodes,
  nodeRect,
  pasteNodes,
  patchNodeTransform,
  renameNode,
  reorderNode,
  resizeNode,
  rotateNode,
  setNodeLocked,
  setNodeVisibility,
  setSelection,
  snapPosition,
  toggleSelection,
  ungroupNodes,
  type ResizeHandle,
  type VisualClipboard,
} from '@/lib/studio/visual/editor';

type Props = {
  active: boolean;
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
};

type Point = { x: number; y: number };
type SelectionRect = { x: number; y: number; width: number; height: number };
type PathXKey = 'x' | 'x1' | 'x2' | 'cpx' | 'cp1x' | 'cp2x';
type PathYKey = 'y' | 'y1' | 'y2' | 'cpy' | 'cp1y' | 'cp2y';
type PathHandleTarget = {
  commandIndex: number;
  pointIndex?: number;
  xKey: PathXKey;
  yKey: PathYKey;
  role: 'anchor' | 'control';
  label: string;
};
type PathHandle = PathHandleTarget & Point;
type Gesture = {
  kind: 'move' | 'resize' | 'rotate' | 'pan' | 'marquee' | 'freehand' | 'path-point';
  id?: string;
  ids?: string[];
  handle?: ResizeHandle;
  pathHandle?: PathHandleTarget;
  startX: number;
  startY: number;
  before: VisualProject;
  originPan?: Point;
  origin?: Point;
  startDocument?: Point;
  baseSelection?: string[];
  center?: Point;
};

const VISUAL_CODE_STORAGE_KEY = 'apexify-visual-live-code-v1';

const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const handlePos: Record<
  ResizeHandle,
  { left: string; top: string; cursor: string }
> = {
  nw: { left: '0%', top: '0%', cursor: 'nwse-resize' },
  n: { left: '50%', top: '0%', cursor: 'ns-resize' },
  ne: { left: '100%', top: '0%', cursor: 'nesw-resize' },
  e: { left: '100%', top: '50%', cursor: 'ew-resize' },
  se: { left: '100%', top: '100%', cursor: 'nwse-resize' },
  s: { left: '50%', top: '100%', cursor: 'ns-resize' },
  sw: { left: '0%', top: '100%', cursor: 'nesw-resize' },
  w: { left: '0%', top: '50%', cursor: 'ew-resize' },
};

function clampZoom(value: number) {
  return Math.max(20, Math.min(200, Math.round(value)));
}

function semanticSignature(project: VisualProject) {
  const { editor: _editor, updatedAt: _updatedAt, ...semantic } = project;
  return JSON.stringify(semantic);
}

function rectsIntersect(a: SelectionRect, b: SelectionRect) {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}

function distance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function effectivePathTransform(node: VisualNode, props: VisualPathNodeProps) {
  const transform = node.transform ?? {};
  const authored = props.draw?.transform ?? {};
  const width = Math.max(1, props.viewport.width);
  const height = Math.max(1, props.viewport.height);
  const nodeScaleX =
    ((transform.width ?? width) * (transform.scaleX ?? 1)) / width;
  const nodeScaleY =
    ((transform.height ?? height) * (transform.scaleY ?? 1)) / height;
  return {
    translateX: (authored.translateX ?? 0) + (transform.x ?? 0),
    translateY: (authored.translateY ?? 0) + (transform.y ?? 0),
    rotate: (authored.rotate ?? 0) + (transform.rotation ?? 0),
    scaleX: (authored.scaleX ?? 1) * nodeScaleX,
    scaleY: (authored.scaleY ?? 1) * nodeScaleY,
    originX: authored.originX,
    originY: authored.originY,
  };
}

function pathLocalToDocumentPoint(
  node: VisualNode,
  props: VisualPathNodeProps,
  point: Point,
): Point {
  const transform = effectivePathTransform(node, props);
  const radians = (transform.rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  if (transform.originX !== undefined && transform.originY !== undefined) {
    const dx = (point.x - transform.originX) * transform.scaleX;
    const dy = (point.y - transform.originY) * transform.scaleY;
    return {
      x: transform.translateX + transform.originX + dx * cos - dy * sin,
      y: transform.translateY + transform.originY + dx * sin + dy * cos,
    };
  }

  const scaledX = point.x * transform.scaleX;
  const scaledY = point.y * transform.scaleY;
  return {
    x: transform.translateX + scaledX * cos - scaledY * sin,
    y: transform.translateY + scaledX * sin + scaledY * cos,
  };
}

function pathDocumentToLocalPoint(
  node: VisualNode,
  props: VisualPathNodeProps,
  point: Point,
): Point {
  const transform = effectivePathTransform(node, props);
  const radians = (-transform.rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const scaleX = transform.scaleX || 1;
  const scaleY = transform.scaleY || 1;

  if (transform.originX !== undefined && transform.originY !== undefined) {
    const dx = point.x - transform.translateX - transform.originX;
    const dy = point.y - transform.translateY - transform.originY;
    return {
      x: transform.originX + (dx * cos - dy * sin) / scaleX,
      y: transform.originY + (dx * sin + dy * cos) / scaleY,
    };
  }

  const dx = point.x - transform.translateX;
  const dy = point.y - transform.translateY;
  return {
    x: (dx * cos - dy * sin) / scaleX,
    y: (dx * sin + dy * cos) / scaleY,
  };
}

function editablePathHandles(props: VisualPathNodeProps): PathHandle[] {
  const handles: PathHandle[] = [];
  const add = (
    commandIndex: number,
    xKey: PathXKey,
    yKey: PathYKey,
    x: number,
    y: number,
    role: PathHandleTarget['role'],
    label: string,
    pointIndex?: number,
  ) => {
    handles.push({
      commandIndex,
      ...(pointIndex === undefined ? {} : { pointIndex }),
      xKey,
      yKey,
      x,
      y,
      role,
      label,
    });
  };

  (props.commands ?? []).forEach((command, commandIndex) => {
    switch (command.type) {
      case 'moveTo':
      case 'lineTo':
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'quadraticCurveTo':
        add(commandIndex, 'cpx', 'cpy', command.cpx, command.cpy, 'control', 'control');
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'bezierCurveTo':
        add(commandIndex, 'cp1x', 'cp1y', command.cp1x, command.cp1y, 'control', 'cp1');
        add(commandIndex, 'cp2x', 'cp2y', command.cp2x, command.cp2y, 'control', 'cp2');
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'arcTo':
        add(commandIndex, 'x1', 'y1', command.x1, command.y1, 'anchor', 'point1');
        add(commandIndex, 'x2', 'y2', command.x2, command.y2, 'anchor', 'point2');
        break;
      case 'polygon':
        command.points.forEach((point, pointIndex) =>
          add(commandIndex, 'x', 'y', point.x, point.y, 'anchor', 'point', pointIndex),
        );
        break;
      case 'arc':
      case 'rect':
      case 'ellipse':
      case 'circle':
      case 'roundedRect':
      case 'star':
      case 'arrow':
        add(commandIndex, 'x', 'y', command.x, command.y, 'anchor', 'point');
        break;
      case 'closePath':
        break;
    }
  });

  return handles;
}

function roundedPathCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

function movePathHandle(
  project: VisualProject,
  nodeId: string,
  target: PathHandleTarget,
  localPoint: Point,
): VisualProject {
  const sourceNode = project.document.nodes[nodeId];
  if (!sourceNode || (sourceNode.kind !== 'path' && sourceNode.kind !== 'freehand')) {
    return project;
  }
  const next = structuredClone(project);
  const node = next.document.nodes[nodeId];
  const props = visualPathProps(node);
  const commands = structuredClone(props.commands ?? []);
  const command = commands[target.commandIndex];
  if (!command) return project;

  const x = roundedPathCoordinate(localPoint.x);
  const y = roundedPathCoordinate(localPoint.y);
  if (target.pointIndex !== undefined && command.type === 'polygon') {
    const point = command.points[target.pointIndex];
    if (!point) return project;
    command.points[target.pointIndex] = { x, y };
  } else {
    const draft = command as unknown as Record<string, unknown>;
    draft[target.xKey] = x;
    draft[target.yKey] = y;
  }

  node.props = pathPropsRecord({ ...props, commands: commands as StudioPathCommand[] });
  next.updatedAt = new Date().toISOString();
  return next;
}

function canvasBaseMode(canvas: VisualCanvasConfig): 'default' | 'color' | 'gradient' | 'image' | 'transparent' {
  if (canvas.customBg) return 'image';
  if (canvas.gradientBg) return 'gradient';
  if (canvas.colorBg !== undefined) return 'color';
  if (canvas.transparentBase) return 'transparent';
  return 'default';
}

function canvasArtboardBackground(canvas: VisualCanvasConfig): string {
  if (canvas.transparentBase) return 'transparent';
  if (canvas.colorBg !== undefined) return canvas.colorBg || '#000000';
  const gradient = canvas.gradientBg;
  if (gradient?.colors?.length) {
    const stops = gradient.colors
      .map((item) => item.color + ' ' + Math.round(item.stop * 100) + '%')
      .join(', ');
    if (gradient.type === 'conic') return 'conic-gradient(from ' + (gradient.startAngle ?? 0) + 'deg, ' + stops + ')';
    if (gradient.type === 'radial') return 'radial-gradient(circle, ' + stops + ')';
    return 'linear-gradient(' + (gradient.rotate ?? 90) + 'deg, ' + stops + ')';
  }
  return '#000000';
}

function parseFilterJson(value: string): VisualImageFilter[] {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Filters JSON must be an array.');
  return parsed as VisualImageFilter[];
}

export default function VisualStudioPre4({
  active,
  mode,
  onModeChange,
}: Props) {
  const {
    setCodeHandoff,
    assets,
    setAssets,
    error,
    previewWarnings,
    history: runHistory,
  } = useStudioSharedSession();
  const [project, setProject] = useState(() => createVisualProject({ name: 'Landing Page' }));
  const [zoom, setZoom] = useState(78);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [viewportMode, setViewportMode] = useState<'select' | 'pan'>('select');
  const [message, setMessage] = useState('Ready');
  const [historyTick, setHistoryTick] = useState(0);
  const [guides, setGuides] = useState<
    Array<{ axis: 'x' | 'y'; value: number }>
  >([]);
  const [marquee, setMarquee] = useState<SelectionRect | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [dirty, setDirty] = useState(false);
  const [activeTool, setActiveTool] = useState('canvas');
  const [inspectorTab, setInspectorTab] = useState<
    'style' | 'transform' | 'effects' | 'data' | 'advanced'
  >('style');
  const [dockTab, setDockTab] = useState<
    'generated' | 'diagnostics' | 'assets' | 'history' | 'timeline'
  >('generated');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [assetFilter, setAssetFilter] = useState<'image' | 'font' | 'audio' | 'video'>('image');
  const [codeSource, setCodeSource] = useState('');
  const [codeFileName, setCodeFileName] = useState('landing-page.ts');
  const [codeSyncState, setCodeSyncState] = useState<'synced' | 'saving' | 'error'>('synced');
  const [codeSyncError, setCodeSyncError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [modalPreviewUrl, setModalPreviewUrl] = useState<string | null>(null);
  const [modalPreviewDownloadUrl, setModalPreviewDownloadUrl] = useState<string | null>(null);
  const [modalPreviewMime, setModalPreviewMime] = useState('image/png');
  const [modalPreviewFileName, setModalPreviewFileName] = useState('preview.png');
  const [modalPreviewLoading, setModalPreviewLoading] = useState(false);
  const [modalPreviewError, setModalPreviewError] = useState<string | null>(null);
  const [canvasFiltersDraft, setCanvasFiltersDraft] = useState('[]');
  const [canvasFiltersError, setCanvasFiltersError] = useState<string | null>(null);
  const [canvasConfigDraft, setCanvasConfigDraft] = useState('{}');
  const [canvasConfigError, setCanvasConfigError] = useState<string | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [imageConfigDraft, setImageConfigDraft] = useState('{}');
  const [imageConfigError, setImageConfigError] = useState<string | null>(null);
  const [textConfigDraft, setTextConfigDraft] = useState('{}');
  const [textConfigError, setTextConfigError] = useState<string | null>(null);
  const [pathConfigDraft, setPathConfigDraft] = useState('{}');
  const [pathConfigError, setPathConfigError] = useState<string | null>(null);
  const [inlineTextEditId, setInlineTextEditId] = useState<string | null>(null);
  const [artboardPreviewUrl, setArtboardPreviewUrl] = useState<string | null>(null);
  const [artboardPreviewBusy, setArtboardPreviewBusy] = useState(false);
  const [phase7Results, setPhase7Results] = useState<Record<string, unknown>>({});
  const [phase7Action, setPhase7Action] = useState<
    'freehand' | 'pixel-probe' | 'pixel-data' | 'pixel-set' | 'path-detect' | 'region-detect' | 'region-distance' | 'any-region' | null
  >(null);
  const [pixelColorDraft, setPixelColorDraft] = useState('#ffffff');
  const [freehandDraft, setFreehandDraft] = useState<Point[]>([]);

  const history = useRef(new VisualHistory(100));
  const projectRef = useRef(project);
  const gesture = useRef<Gesture | null>(null);
  const clipboard = useRef<VisualClipboard | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const cleanSignature = useRef('');
  const propertyBefore = useRef<VisualProject | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const didInitialFit = useRef(false);
  const webRuntimeRef = useRef<ApexifyWebRuntime | null>(null);
  const artboardRuntimeRef = useRef<ApexifyWebRuntime | null>(null);
  const codeSaveTimerRef = useRef<number>(0);
  const codeAppliedSignatureRef = useRef('');
  const codeHydratedRef = useRef(false);
  const fileNameTouchedRef = useRef(false);
  const artboardPreviewTimerRef = useRef<number>(0);
  const phase10RenderTailRef = useRef<Promise<void>>(Promise.resolve());
  const freehandDraftRef = useRef<Point[]>([]);

  if (!cleanSignature.current) cleanSignature.current = semanticSignature(project);

  const projectSemanticSignature = useMemo(() => semanticSignature(project), [project]);
  const selected = project.editor?.selectedNodeIds ?? [];
  const primary = selected.length
    ? project.document.nodes[selected[selected.length - 1]]
    : undefined;
  const primaryText = primary?.kind === 'text' ? primary : undefined;
  const primaryPath =
    primary && (primary.kind === 'path' || primary.kind === 'freehand')
      ? primary
      : undefined;
  const primaryChart = primary?.kind === 'chart' ? primary : undefined;
  const textMetrics = useMemo(() => {
    if (!primaryText) return null;
    const props = visualTextProps(primaryText);
    return measureVisualTextInBrowser({
      ...props,
      layout: {
        ...(props.layout ?? {}),
        ...(primaryText.transform?.width !== undefined
          ? { maxWidth: primaryText.transform.width * (primaryText.transform.scaleX ?? 1) }
          : {}),
        ...(primaryText.transform?.height !== undefined
          ? { maxHeight: primaryText.transform.height * (primaryText.transform.scaleY ?? 1) }
          : {}),
      },
    });
  }, [
    primaryText?.props,
    primaryText?.transform?.width,
    primaryText?.transform?.height,
    primaryText?.transform?.scaleX,
    primaryText?.transform?.scaleY,
    assets,
  ]);
  const layerIds = useMemo(() => flattenLayerIds(project), [project]);
  const drawableIds = useMemo(
    () =>
      layerIds.filter((id) => {
        const node = project.document.nodes[id];
        return Boolean(
          node &&
            node.transform?.visible !== false &&
            !(
              (node.kind === 'group' ||
                node.kind === 'scene' ||
                node.kind === 'surface') &&
              (node.childIds?.length ?? 0) > 0
            ),
        );
      }),
    [layerIds, project],
  );

  const assetKind = (mime: string) =>
    mime.startsWith('image/')
      ? 'image'
      : mime.startsWith('audio/')
        ? 'audio'
        : mime.startsWith('video/')
          ? 'video'
          : mime.startsWith('font/') || /woff|ttf|otf/i.test(mime)
            ? 'font'
            : 'image';

  const filteredAssets = assets.filter((asset) => assetKind(asset.mime) === assetFilter);

  const generated = useMemo(() => {
    try {
      return { value: generateVisualProjectCode(project), error: null };
    } catch (error) {
      return {
        value: null,
        error:
          error instanceof Error ? error.message : 'Code generation unavailable',
      };
    }
  }, [project]);

  const previewGenerated = useMemo(() => {
    try {
      return { value: generateVisualProjectPreviewCode(project), error: null };
    } catch (error) {
      return {
        value: null,
        error:
          error instanceof Error ? error.message : 'Preview code generation unavailable',
      };
    }
  }, [project]);

  const displayPreviewGenerated = useMemo(() => {
    try {
      return { value: generateVisualProjectDisplayPreviewCode(project), error: null };
    } catch (error) {
      return {
        value: null,
        error:
          error instanceof Error ? error.message : 'Display preview code generation unavailable',
      };
    }
  }, [project]);

  const phase9Active = useMemo(() => hasPhase9Authoring(project), [project]);
  const phase10Active = useMemo(() => hasPhase10Authoring(project), [project]);
  const phase11Active = useMemo(() => hasPhase11Authoring(project), [project]);
  const phase12Active = useMemo(() => hasPhase12Authoring(project), [project]);
  const phase13Active = useMemo(() => hasPhase13Authoring(project), [project]);

  useEffect(() => {
    setDirty(projectSemanticSignature !== cleanSignature.current);
    projectRef.current = project;
  }, [project, projectSemanticSignature]);

  const persistLiveCode = (source: string, fileName: string) => {
    try {
      window.localStorage.setItem(
        VISUAL_CODE_STORAGE_KEY,
        JSON.stringify({ source, fileName, savedAt: Date.now() }),
      );
    } catch {}
  };

  const applyCodeToVisual = (source: string) => {
    const current = projectRef.current;
    const result = reconcileVisualProjectFromCode(current, source);
    if (!result.ok) {
      setCodeSyncState('error');
      setCodeSyncError(result.error);
      return false;
    }

    setCodeSyncError(null);
    setCodeSyncState('synced');
    if (!result.changed) return true;

    history.current.commit(current, result.project, 'Code → Visual');
    codeAppliedSignatureRef.current = semanticSignature(result.project);
    projectRef.current = result.project;
    setProject(result.project);
    setHistoryTick((value) => value + 1);
    setMessage('Code synced to canvas');
    return true;
  };

  const saveLiveCode = (source = codeSource, fileName = codeFileName) => {
    window.clearTimeout(codeSaveTimerRef.current);
    persistLiveCode(source, fileName);
    const ok = applyCodeToVisual(source);
    if (ok) setMessage('Code autosaved · canvas synced');
  };

  const updateLiveCode = (next: string) => {
    setCodeSource(next);
    setCodeSyncState('saving');
    setCodeSyncError(null);
    window.clearTimeout(codeSaveTimerRef.current);
    codeSaveTimerRef.current = window.setTimeout(() => {
      persistLiveCode(next, codeFileName);
      applyCodeToVisual(next);
    }, 320);
  };

  useEffect(() => {
    if (codeHydratedRef.current || !generated.value) return;
    codeHydratedRef.current = true;

    let source = generated.value.source;
    let fileName = generated.value.fileName;
    try {
      const raw = window.localStorage.getItem(VISUAL_CODE_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { source?: string; fileName?: string };
        if (stored.source) {
          const reconciled = reconcileVisualProjectFromCode(projectRef.current, stored.source);
          if (reconciled.ok) {
            source = stored.source;
            fileName = stored.fileName || fileName;
            if (reconciled.changed) {
              codeAppliedSignatureRef.current = semanticSignature(reconciled.project);
              projectRef.current = reconciled.project;
              setProject(reconciled.project);
            }
          }
        }
      }
    } catch {}

    setCodeSource(source);
    setCodeFileName(fileName);
    setCodeSyncState('synced');
  }, [generated.value]);

  useEffect(() => {
    if (!codeHydratedRef.current || !generated.value) return;
    const signature = semanticSignature(project);
    if (codeAppliedSignatureRef.current === signature) {
      codeAppliedSignatureRef.current = '';
      return;
    }
    setCodeSource(generated.value.source);
    if (!fileNameTouchedRef.current) setCodeFileName(generated.value.fileName);
    setCodeSyncState('synced');
    setCodeSyncError(null);
    persistLiveCode(generated.value.source, fileNameTouchedRef.current ? codeFileName : generated.value.fileName);
  }, [generated.value?.source, generated.value?.fileName, projectSemanticSignature]);

  useEffect(() => {
    return () => {
      window.clearTimeout(codeSaveTimerRef.current);
      webRuntimeRef.current?.dispose();
      webRuntimeRef.current = null;
      artboardRuntimeRef.current?.dispose();
      artboardRuntimeRef.current = null;
      window.clearTimeout(artboardPreviewTimerRef.current);
    };
  }, []);

  const renderAuthoritativeVisualSource = async (
    source: string,
    displaySource = source,
  ) => {
    if (phase13Active || phase12Active || phase11Active || phase10Active) {
      let releasePhase10Render!: () => void;
      const previousPhase10Render = phase10RenderTailRef.current;
      phase10RenderTailRef.current = new Promise<void>((resolve) => {
        releasePhase10Render = resolve;
      });
      await previousPhase10Render.catch(() => undefined);

      try {
        const result = await currentNodeServerExecutionAdapter.run({
        session: createInteractiveSession({
          source,
          language: 'ts',
          runtime: 'node',
          options: { studioAssets: assets },
          layout: { activePanel: 'editor' },
        }),
      });
      if (result.status !== 'ready' || !result.output) {
        return {
          ok: false as const,
          error: result.diagnostics[0]?.message ?? 'Full Apexify runtime preview is unavailable.',
        };
      }
      const artifact =
        result.output.artifacts?.find((item) => item.base64 && item.mime.startsWith('image/')) ??
        result.output.artifacts?.find((item) => item.base64) ??
        (result.output.base64
          ? {
              mime: result.output.mime,
              base64: result.output.base64,
            }
          : null);
      if (!artifact?.base64) {
        return {
          ok: false as const,
          error: 'Full Apexify runtime execution completed without a preview artifact.',
        };
      }
      let analysisResults: Record<string, unknown> = {};
      const metadata =
        'metadata' in artifact &&
        artifact.metadata &&
        typeof artifact.metadata === 'object' &&
        !Array.isArray(artifact.metadata)
          ? artifact.metadata
          : undefined;
      const rawResults = metadata?.studioResultsJson;
      if (typeof rawResults === 'string') {
        try {
          const parsed = JSON.parse(rawResults) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            analysisResults = parsed as Record<string, unknown>;
          }
        } catch {
          // Invalid structured-result metadata must never block the image artifact.
        }
      }
        const exactDataUrl = 'data:' + artifact.mime + ';base64,' + artifact.base64;
        const browserPreviewable = new Set([
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/gif',
          'image/avif',
        ]);
        let displayDataUrl = exactDataUrl;

        if (!browserPreviewable.has(artifact.mime) && displaySource !== source) {
          const displayResult = await currentNodeServerExecutionAdapter.run({
            session: createInteractiveSession({
              source: displaySource,
              language: 'ts',
              runtime: 'node',
              options: { studioAssets: assets },
              layout: { activePanel: 'editor' },
            }),
          });
          if (displayResult.status === 'ready' && displayResult.output) {
            const displayArtifact =
              displayResult.output.artifacts?.find(
                (item) => item.base64 && item.mime.startsWith('image/'),
              ) ??
              (displayResult.output.base64
                ? {
                    mime: displayResult.output.mime,
                    base64: displayResult.output.base64,
                  }
                : null);
            if (displayArtifact?.base64) {
              displayDataUrl =
                'data:' + displayArtifact.mime + ';base64,' + displayArtifact.base64;
            }
          }
        }

        return {
          ok: true as const,
          dataUrl: displayDataUrl,
          downloadDataUrl: exactDataUrl,
          mime: artifact.mime,
          fileName: 'name' in artifact && typeof artifact.name === 'string'
            ? artifact.name
            : 'preview',
          warnings: [] as string[],
          results: analysisResults,
        };
      } finally {
        releasePhase10Render();
      }
    }

    const runtime =
      webRuntimeRef.current ?? (webRuntimeRef.current = createApexifyWebRuntime());
    await runtime.registerFonts(assets);
    const result = await runtime.renderStudioSource(source, assets);
    if (!result.ok) return { ok: false as const, error: result.error };
    return {
      ok: true as const,
      dataUrl: result.dataUrl,
      downloadDataUrl: result.dataUrl,
      mime: result.mime,
      fileName: 'preview',
      warnings: result.warnings,
      results:
        ((result as typeof result & { results?: Record<string, unknown> }).results ?? {}),
    };
  };

  useEffect(() => {
    window.clearTimeout(artboardPreviewTimerRef.current);
    if (!active || !previewGenerated.value) return;
    if (phase12Active) {
      setArtboardPreviewUrl(null);
      return;
    }

    let cancelled = false;
    artboardPreviewTimerRef.current = window.setTimeout(() => {
      void (async () => {
        setArtboardPreviewBusy(true);
        try {
          const result = await renderAuthoritativeVisualSource(
            previewGenerated.value!.source,
            displayPreviewGenerated.value?.source ?? previewGenerated.value!.source,
          );
          if (cancelled) return;
          if (result.ok) {
            setArtboardPreviewUrl(result.dataUrl);
            setPhase7Results(result.results);
          }
        } catch {
          // Keep the last authoritative frame while the next valid frame is built.
        } finally {
          if (!cancelled) setArtboardPreviewBusy(false);
        }
      })();
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(artboardPreviewTimerRef.current);
    };
  }, [
    active,
    assets,
    previewGenerated.value?.source,
    displayPreviewGenerated.value?.source,
    phase10Active,
    phase11Active,
    phase12Active,
  ]);

  const mutate = (
    label: string,
    mutation: (current: VisualProject) => VisualProject,
  ) =>
    setProject((current) => {
      const next = mutation(current);
      history.current.commit(current, next, label);
      setHistoryTick((value) => value + 1);
      return next;
    });

  const updateCanvasDraft = (
    updater: (canvas: VisualCanvasConfig) => VisualCanvasConfig,
  ) => {
    setProject((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      document: {
        ...current.document,
        canvas: updater(current.document.canvas ?? {}),
      },
    }));
  };

  const mutateCanvas = (
    label: string,
    updater: (canvas: VisualCanvasConfig) => VisualCanvasConfig,
  ) =>
    mutate(label, (current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      document: {
        ...current.document,
        canvas: updater(current.document.canvas ?? {}),
      },
    }));

  const setCanvasBaseMode = (
    mode: 'default' | 'color' | 'gradient' | 'image' | 'transparent',
  ) =>
    mutateCanvas('Canvas background', (current) => {
      const next = { ...current };
      delete next.colorBg;
      delete next.gradientBg;
      delete next.customBg;
      next.transparentBase = mode === 'transparent';
      if (mode === 'color') next.colorBg = '#0b1730';
      if (mode === 'gradient') next.gradientBg = defaultCanvasGradient();
      if (mode === 'image') {
        next.customBg = {
          source: '',
          fit: 'cover',
          align: 'center',
          opacity: 1,
          filters: [],
        };
      }
      if (mode === 'default') delete next.transparentBase;
      return next;
    });

  const setGradientStop = (
    index: number,
    patch: Partial<VisualGradient['colors'][number]>,
  ) => {
    updateCanvasDraft((current) => {
      const gradient = current.gradientBg ?? defaultCanvasGradient();
      const colors = gradient.colors.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, ...patch } : stop,
      );
      return { ...current, gradientBg: { ...gradient, colors } as VisualGradient };
    });
  };

  const updatePattern = (patch: Partial<VisualPatternOptions>) =>
    updateCanvasDraft((current) => ({
      ...current,
      patternBg: { ...(current.patternBg ?? defaultCanvasPattern()), ...patch },
    }));

  const updateBackgroundLayer = (
    index: number,
    updater: (layer: VisualBackgroundLayer) => VisualBackgroundLayer,
  ) =>
    updateCanvasDraft((current) => ({
      ...current,
      bgLayers: (current.bgLayers ?? []).map((layer, layerIndex) =>
        layerIndex === index ? updater(layer) : layer,
      ),
    }));

  useEffect(() => {
    setCanvasFiltersDraft(
      JSON.stringify(project.document.canvas?.customBg?.filters ?? [], null, 2),
    );
    setCanvasFiltersError(null);
  }, [project.document.canvas?.customBg?.filters]);

  useEffect(() => {
    setCanvasConfigDraft(JSON.stringify(project.document.canvas ?? {}, null, 2));
    setCanvasConfigError(null);
  }, [project.document.canvas]);

  const primaryMedia =
    primary && (primary.kind === 'image' || primary.kind === 'shape')
      ? primary
      : undefined;

  const updateImageDraft = (
    updater: (props: VisualImageNodeProps) => VisualImageNodeProps,
  ) => {
    if (!primaryMedia) return;
    setProject((current) => {
      const node = current.document.nodes[primaryMedia.id];
      if (!node || (node.kind !== 'image' && node.kind !== 'shape')) return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[primaryMedia.id];
      nextNode.props = imagePropsRecord(updater(visualImageProps(nextNode)));
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const mutateImage = (
    label: string,
    updater: (props: VisualImageNodeProps) => VisualImageNodeProps,
  ) => {
    if (!primaryMedia) return;
    mutate(label, (current) => {
      const node = current.document.nodes[primaryMedia.id];
      if (!node || (node.kind !== 'image' && node.kind !== 'shape')) return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[primaryMedia.id];
      nextNode.props = imagePropsRecord(updater(visualImageProps(nextNode)));
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const insertImageSource = (
    source: string,
    name = 'Image',
    metadata?: { width?: number; height?: number },
    point?: Point,
  ) => {
    if (!source.trim()) {
      setMessage('Image source is required');
      return;
    }
    mutate('Add image', (current) => {
      const next = structuredClone(current);
      const node = createVisualNode(
        'image',
        imagePropsRecord(defaultImageNodeProps(source.trim())),
        { name },
      );
      const sourceWidth = Math.max(1, metadata?.width ?? 640);
      const sourceHeight = Math.max(1, metadata?.height ?? 360);
      const maxWidth = Math.min(360, next.document.width * 0.55);
      const scale = Math.min(1, maxWidth / sourceWidth);
      const width = Math.max(48, Math.round(sourceWidth * scale));
      const height = Math.max(48, Math.round(sourceHeight * scale));
      const x = point?.x ?? Math.max(0, (next.document.width - width) / 2);
      const y = point?.y ?? Math.max(0, (next.document.height - height) / 2);
      node.transform = {
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: next.document.rootNodeIds.length,
      };
      next.document.nodes[node.id] = node;
      next.document.rootNodeIds.push(node.id);
      next.editor = { ...next.editor, selectedNodeIds: [node.id] };
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setActiveTool('images');
    setInspectorTab('style');
    setMessage('Image added');
  };

  const insertImageAsset = (
    asset: StudioVirtualAsset,
    point?: Point,
  ) => {
    if (!asset.mime.startsWith('image/')) {
      setMessage(asset.name + ' is not an image asset');
      return;
    }
    insertImageSource(
      studioAssetReference(asset),
      asset.name.replace(/\.[^.]+$/, '') || 'Image',
      asset.metadata,
      point,
    );
  };

  const insertShape = (shape: VisualShapeType, point?: Point) => {
    mutate('Add shape', (current) => {
      const next = structuredClone(current);
      const node = createVisualNode(
        'shape',
        imagePropsRecord(defaultShapeNodeProps(shape)),
        { name: shape.charAt(0).toUpperCase() + shape.slice(1) },
      );
      const size = shape === 'square' || shape === 'circle' ? 160 : 190;
      const width = size;
      const height =
        shape === 'square' || shape === 'circle' ? size : 140;
      node.transform = {
        x: point?.x ?? Math.max(0, (next.document.width - width) / 2),
        y: point?.y ?? Math.max(0, (next.document.height - height) / 2),
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: next.document.rootNodeIds.length,
      };
      next.document.nodes[node.id] = node;
      next.document.rootNodeIds.push(node.id);
      next.editor = { ...next.editor, selectedNodeIds: [node.id] };
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setActiveTool('shapes');
    setInspectorTab('style');
    setMessage('Shape added');
  };

  const mutateChart = (
    label: string,
    updater: (props: VisualChartNodeProps) => VisualChartNodeProps,
  ) => {
    if (!primaryChart) return;
    mutate(label, (current) => {
      const node = current.document.nodes[primaryChart.id];
      if (!node || node.kind !== 'chart') return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[primaryChart.id];
      nextNode.props = chartPropsRecord(updater(visualChartProps(nextNode)));
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const insertChart = (family: VisualChartFamily, point?: Point) => {
    mutate('Add ' + family + ' chart', (current) => {
      const next = structuredClone(current);
      const props = defaultChartNodeProps(family);
      const dimensions =
        props.options.dimensions &&
        typeof props.options.dimensions === 'object' &&
        !Array.isArray(props.options.dimensions)
          ? props.options.dimensions as Record<string, VisualValue>
          : {};
      const width =
        typeof dimensions.width === 'number'
          ? Math.min(dimensions.width, Math.max(240, next.document.width * 0.72))
          : Math.min(640, Math.max(240, next.document.width * 0.72));
      const height =
        typeof dimensions.height === 'number'
          ? Math.min(dimensions.height, Math.max(180, next.document.height * 0.62))
          : Math.min(400, Math.max(180, next.document.height * 0.62));
      const node = createVisualNode(
        'chart',
        chartPropsRecord(props),
        {
          name:
            family === 'comparison'
              ? 'Comparison chart'
              : family === 'combo'
                ? 'Combo chart'
                : family.charAt(0).toUpperCase() + family.slice(1) + ' chart',
        },
      );
      node.transform = {
        x: point?.x ?? Math.max(16, (next.document.width - width) / 2),
        y: point?.y ?? Math.max(16, (next.document.height - height) / 2),
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: next.document.rootNodeIds.length,
      };
      next.document.nodes[node.id] = node;
      next.document.rootNodeIds.push(node.id);
      next.editor = { ...next.editor, selectedNodeIds: [node.id] };
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setActiveTool('charts');
    setInspectorTab('data');
    setMessage(
      family === 'comparison'
        ? 'Comparison chart added'
        : family === 'combo'
          ? 'Combo chart added'
          : family + ' chart added',
    );
  };

  const addImageFiles = async (
    files: FileList | File[],
    point?: Point,
  ) => {
    const incoming = Array.from(files).filter((file) =>
      (file.type || '').startsWith('image/'),
    );
    if (!incoming.length) {
      setMessage('Drop an image file onto the canvas');
      return;
    }
    if (assets.length + incoming.length > STUDIO_ASSET_LIMITS.maxCount) {
      setMessage('Studio asset count limit reached');
      return;
    }

    try {
      const created: StudioVirtualAsset[] = [];
      let total = totalStudioAssetBytes(assets);
      for (const file of incoming) {
        const asset = await fileToStudioAsset(file);
        if (!asset.mime.startsWith('image/')) continue;
        total += asset.size;
        if (total > STUDIO_ASSET_LIMITS.maxTotalBytes) {
          throw new Error('Combined Studio assets exceed the 24 MiB session limit.');
        }
        created.push(asset);
      }
      if (!created.length) return;
      setAssets([...assets, ...created]);
      created.forEach((asset, index) =>
        insertImageAsset(
          asset,
          point
            ? { x: point.x + index * 18, y: point.y + index * 18 }
            : undefined,
        ),
      );
      setMessage(
        'Added ' +
          created.length +
          ' image asset' +
          (created.length === 1 ? '' : 's'),
      );
    } catch (uploadError) {
      setMessage(
        uploadError instanceof Error
          ? uploadError.message
          : 'Could not add image asset',
      );
    }
  };

  useEffect(() => {
    if (!primaryMedia) {
      setImageConfigDraft('{}');
      setImageConfigError(null);
      return;
    }
    setImageConfigDraft(
      JSON.stringify(visualImageProps(primaryMedia), null, 2),
    );
    setImageConfigError(null);
  }, [primaryMedia?.id, primaryMedia?.props]);

  const updateTextDraft = (
    updater: (props: VisualTextNodeProps) => VisualTextNodeProps,
  ) => {
    if (!primaryText) return;
    setProject((current) => {
      const node = current.document.nodes[primaryText.id];
      if (!node || node.kind !== 'text') return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[primaryText.id];
      nextNode.props = textPropsRecord(updater(visualTextProps(nextNode)));
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const mutateText = (
    label: string,
    updater: (props: VisualTextNodeProps) => VisualTextNodeProps,
  ) => {
    if (!primaryText) return;
    mutate(label, (current) => {
      const node = current.document.nodes[primaryText.id];
      if (!node || node.kind !== 'text') return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[primaryText.id];
      nextNode.props = textPropsRecord(updater(visualTextProps(nextNode)));
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const insertText = (
    value = 'Text',
    point?: Point,
    fontAsset?: StudioVirtualAsset,
    fontFamily?: string,
  ) => {
    mutate('Add text', (current) => {
      const next = structuredClone(current);
      const props = defaultTextNodeProps(value);
      if (fontAsset && isStudioFontAsset(fontAsset)) {
        const family = studioAssetFontFamily(fontAsset);
        props.font = {
          ...(props.font ?? {}),
          family,
          name: family,
          path: studioAssetReference(fontAsset),
        };
      } else if (fontFamily) {
        props.font = {
          ...(props.font ?? {}),
          family: fontFamily,
          name: fontFamily,
        };
      }
      const node = createVisualNode(
        'text',
        textPropsRecord(props),
        { name: value.length > 24 ? value.slice(0, 24) + '…' : value },
      );
      const width = props.layout?.maxWidth ?? 360;
      const fontSize = props.font?.size ?? 48;
      const height = Math.max(64, fontSize * (props.layout?.lineHeight ?? 1.2) * 2);
      node.transform = {
        x: point?.x ?? Math.max(32, (next.document.width - width) / 2),
        y: point?.y ?? Math.max(32, (next.document.height - height) / 2),
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: next.document.rootNodeIds.length,
      };
      next.document.nodes[node.id] = node;
      next.document.rootNodeIds.push(node.id);
      next.editor = { ...next.editor, selectedNodeIds: [node.id] };
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setActiveTool('text');
    setInspectorTab('style');
    setMessage('Text added');
  };

  const applyFontAsset = (asset: StudioVirtualAsset) => {
    if (!isStudioFontAsset(asset)) {
      setMessage(asset.name + ' is not a font asset');
      return;
    }
    const family = studioAssetFontFamily(asset);
    if (!primaryText) {
      insertText('Text', undefined, asset);
      return;
    }
    mutateText('Apply font asset', (current) => ({
      ...current,
      font: {
        ...(current.font ?? {}),
        family,
        name: family,
        path: studioAssetReference(asset),
      },
    }));
    setAssetFilter('font');
    setMessage('Applied font ' + family);
  };

  useEffect(() => {
    if (!primaryText) {
      setTextConfigDraft('{}');
      setTextConfigError(null);
      return;
    }
    setTextConfigDraft(
      JSON.stringify(visualTextProps(primaryText), null, 2),
    );
    setTextConfigError(null);
  }, [primaryText?.id, primaryText?.props]);

  const beginInlineTextEdit = (node: VisualNode) => {
    if (node.kind !== 'text') return;
    propertyBefore.current = structuredClone(project);
    setInlineTextEditId(node.id);
  };

  const updateInlineText = (id: string, value: string) => {
    setProject((current) => {
      const node = current.document.nodes[id];
      if (!node || node.kind !== 'text') return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[id];
      nextNode.props = textPropsRecord({
        ...visualTextProps(nextNode),
        text: value,
      });
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const finishInlineTextEdit = () => {
    if (!inlineTextEditId) return;
    endPropertyEdit('Edit text');
    setInlineTextEditId(null);
  };


  useEffect(() => {
    if (!primaryPath) {
      setPathConfigDraft('{}');
      setPathConfigError(null);
      return;
    }
    setPathConfigDraft(JSON.stringify(visualPathProps(primaryPath), null, 2));
    setPathConfigError(null);
  }, [primaryPath?.id, primaryPath?.props]);

  const mutatePath = (
    label: string,
    updater: (props: VisualPathNodeProps) => VisualPathNodeProps,
  ) => {
    if (!primaryPath) return;
    mutate(label, (current) => {
      const node = current.document.nodes[primaryPath.id];
      if (!node || (node.kind !== 'path' && node.kind !== 'freehand')) return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[primaryPath.id];
      nextNode.props = pathPropsRecord(updater(visualPathProps(nextNode)));
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const insertPath = (
    tool: VisualPathNodeProps['tool'],
    point?: Point,
  ) => {
    if (tool === 'freehand') {
      setPhase7Action('freehand');
      setActiveTool('paths');
      setMessage('Freehand active · drag on the artboard');
      return;
    }
    mutate('Add ' + tool, (current) => {
      const next = structuredClone(current);
      const props = defaultPathNodeProps(tool);
      const node = createVisualNode(
        'path',
        pathPropsRecord(props),
        { name: tool === 'connector' ? 'Connector' : tool.charAt(0).toUpperCase() + tool.slice(1) },
      );
      const width = props.viewport.width;
      const height = props.viewport.height;
      node.transform = {
        x: point?.x ?? Math.max(24, (next.document.width - width) / 2),
        y: point?.y ?? Math.max(24, (next.document.height - height) / 2),
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: next.document.rootNodeIds.length,
      };
      next.document.nodes[node.id] = node;
      next.document.rootNodeIds.push(node.id);
      next.editor = { ...next.editor, selectedNodeIds: [node.id] };
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setPhase7Action(null);
    setActiveTool('paths');
    setInspectorTab('style');
    setMessage((tool === 'connector' ? 'Connector' : 'Path') + ' added');
  };

  const finishFreehand = (points: Point[]) => {
    if (points.length < 2) return;
    const sampled = points.length <= 1200
      ? points
      : points.filter((_, index) => index % Math.ceil(points.length / 1200) === 0);
    const minX = Math.min(...sampled.map((point) => point.x));
    const minY = Math.min(...sampled.map((point) => point.y));
    const maxX = Math.max(...sampled.map((point) => point.x));
    const maxY = Math.max(...sampled.map((point) => point.y));
    const padding = 6;
    const width = Math.max(12, maxX - minX + padding * 2);
    const height = Math.max(12, maxY - minY + padding * 2);
    const commands = sampled.map((point, index) => ({
      type: index === 0 ? 'moveTo' as const : 'lineTo' as const,
      x: point.x - minX + padding,
      y: point.y - minY + padding,
    }));
    mutate('Draw freehand', (current) => {
      const next = structuredClone(current);
      const props = defaultPathNodeProps('freehand');
      props.commands = commands;
      props.viewport = { width, height };
      const node = createVisualNode(
        'freehand',
        pathPropsRecord(props),
        { name: 'Freehand' },
      );
      node.transform = {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width,
        height,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: next.document.rootNodeIds.length,
      };
      next.document.nodes[node.id] = node;
      next.document.rootNodeIds.push(node.id);
      next.editor = { ...next.editor, selectedNodeIds: [node.id] };
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setInspectorTab('style');
    setMessage('Freehand path created');
  };

  const appendPixelOperation = (value: StudioPixelOperation, name: string) => {
    mutate(name, (current) => {
      const next = structuredClone(current);
      next.operations.push(
        operationRecord('pixel-operation', value, {
          id: createVisualId('operation'),
          name,
        }),
      );
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setMessage(name + ' applied');
  };

  const upsertDetectionOperation = (
    value: StudioDetectionOperation,
    name: string,
  ) => {
    mutate(name, (current) => {
      const next = structuredClone(current);
      const index = next.operations.findIndex(
        (item) => item.kind === 'detection-operation' && item.name === name,
      );
      const id =
        index >= 0
          ? next.operations[index].id
          : createVisualId('operation');
      const record = operationRecord('detection-operation', value, { id, name });
      if (index >= 0) next.operations.splice(index, 1);
      next.operations.push(record);
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setDockTab('diagnostics');
    setMessage(name + ' queued');
  };

  const pixelColorFromHex = (value: string) => {
    const normalized = value.replace('#', '').trim();
    const expanded =
      normalized.length === 3
        ? normalized.split('').map((item) => item + item).join('')
        : normalized;
    const parsed = Number.parseInt(expanded, 16);
    if (!Number.isFinite(parsed) || expanded.length !== 6) {
      return { r: 255, g: 255, b: 255, a: 255 };
    }
    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
      a: 255,
    };
  };

  const runPhase7PointAction = (point: Point) => {
    const x = Math.max(0, Math.min(project.document.width - 1, Math.floor(point.x)));
    const y = Math.max(0, Math.min(project.document.height - 1, Math.floor(point.y)));
    if (phase7Action === 'pixel-probe') {
      upsertDetectionOperation({ type: 'pixelColor', x, y, resultName: 'pixelColor' }, 'Pixel probe');
      return true;
    }
    if (phase7Action === 'pixel-data') {
      const width = Math.max(1, Math.min(16, project.document.width - x));
      const height = Math.max(1, Math.min(16, project.document.height - y));
      upsertDetectionOperation(
        { type: 'pixelData', region: { x, y, width, height }, resultName: 'pixelData' },
        'Pixel sample',
      );
      return true;
    }
    if (phase7Action === 'pixel-set') {
      appendPixelOperation(
        { type: 'setColor', x, y, color: pixelColorFromHex(pixelColorDraft) },
        'Set pixel color',
      );
      return true;
    }
    if (phase7Action === 'path-detect') {
      if (!primaryPath) {
        setMessage('Select a path before using path detection');
        return true;
      }
      upsertDetectionOperation(
        {
          type: 'detectPath',
          pathNodeId: primaryPath.id,
          x,
          y,
          includeStroke: true,
          strokeWidth: visualPathProps(primaryPath).draw?.stroke?.width ?? 4,
          tolerance: 2,
          fillRule: visualPathProps(primaryPath).draw?.fill?.rule ?? 'nonzero',
          resultName: 'pathHit',
        },
        'Path hit test',
      );
      return true;
    }
    if (
      phase7Action === 'region-detect' ||
      phase7Action === 'region-distance'
    ) {
      if (!primary) {
        setMessage('Select a layer before using region detection');
        return true;
      }
      const rect = nodeRect(primary);
      const region = {
        type: 'rect' as const,
        x: rect.x,
        y: rect.y,
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      };
      if (phase7Action === 'region-detect') {
        upsertDetectionOperation(
          { type: 'detectRegion', region, x, y, tolerance: 2, resultName: 'regionHit' },
          'Region hit test',
        );
      } else {
        upsertDetectionOperation(
          { type: 'detectDistance', region, x, y, resultName: 'distance' },
          'Region distance',
        );
      }
      return true;
    }
    if (phase7Action === 'any-region') {
      const regions = drawableIds
        .map((id) => nodeRect(project.document.nodes[id]))
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => ({
          type: 'rect' as const,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        }));
      if (!regions.length) {
        setMessage('Add at least one drawable layer first');
        return true;
      }
      upsertDetectionOperation(
        { type: 'detectAnyRegion', regions, x, y, tolerance: 1, resultName: 'anyRegionHit' },
        'Any-region hit test',
      );
      return true;
    }
    return false;
  };

  const addPlaceholder = () =>
    mutate('Add placeholder', (current) => {
      const next = structuredClone(current);
      const node = createVisualNode('group', {}, { name: 'Placeholder' });
      node.transform = {
        x: 80 + next.document.rootNodeIds.length * 24,
        y: 80 + next.document.rootNodeIds.length * 24,
        width: 180,
        height: 110,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        zIndex: next.document.rootNodeIds.length,
      };
      next.document.nodes[node.id] = node;
      next.document.rootNodeIds.push(node.id);
      next.editor = { ...next.editor, selectedNodeIds: [node.id] };
      return next;
    });

  const undo = () => {
    const result = history.current.undo(project);
    if (!result) return;
    setProject(result.project);
    setMessage('Undo: ' + result.label);
    setHistoryTick((value) => value + 1);
  };

  const redo = () => {
    const result = history.current.redo(project);
    if (!result) return;
    setProject(result.project);
    setMessage('Redo: ' + result.label);
    setHistoryTick((value) => value + 1);
  };

  const fit = () => {
    const viewport = viewportRef.current?.getBoundingClientRect();
    if (!viewport) {
      setZoom(78);
      setPan({ x: 0, y: 0 });
      return;
    }
    const widthScale = (viewport.width - 80) / project.document.width;
    const heightScale = (viewport.height - 80) / project.document.height;
    setZoom(clampZoom(Math.min(widthScale, heightScale, 1) * 100));
    setPan({ x: 0, y: 0 });
  };

  const resetView = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!active || didInitialFit.current) return;
    const frame = window.requestAnimationFrame(() => {
      const viewport = viewportRef.current?.getBoundingClientRect();
      if (!viewport) return;
      const widthScale = (viewport.width - 64) / project.document.width;
      const heightScale = (viewport.height - 64) / project.document.height;
      setZoom(clampZoom(Math.min(widthScale, heightScale, 1) * 100));
      setPan({ x: 0, y: 0 });
      didInitialFit.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [active, project.document.height, project.document.width]);

  const documentPoint = (clientX: number, clientY: number): Point | null => {
    const rect = artboardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const scale = zoom / 100;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const dropImagesOnCanvas = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const point = documentPoint(event.clientX, event.clientY) ?? undefined;
    if (event.dataTransfer.files.length) {
      void addImageFiles(event.dataTransfer.files, point);
    }
  };

  const copySelection = () => {
    if (!selected.length) return;
    clipboard.current = copyNodes(project, selected);
    setMessage(
      'Copied ' + clipboard.current.roots.length + ' layer' +
        (clipboard.current.roots.length === 1 ? '' : 's'),
    );
  };

  const cutSelection = () => {
    if (!selected.length) return;
    clipboard.current = copyNodes(project, selected);
    mutate('Cut', (current) => deleteNodes(current, selected));
    setMessage('Cut selection');
  };

  const pasteSelection = () => {
    if (!clipboard.current) return;
    mutate('Paste', (current) =>
      pasteNodes(current, clipboard.current!, () => createVisualId('node')),
    );
    setMessage('Pasted selection');
  };

  const groupSelection = () => {
    if (selected.length < 2) return;
    mutate('Group', (current) =>
      groupNodes(current, selected, createVisualId('group')),
    );
    setMessage('Grouped selection');
  };

  const ungroupSelection = () => {
    if (!selected.length) return;
    mutate('Ungroup', (current) => ungroupNodes(current, selected));
    setMessage('Ungrouped selection');
  };

  const movePrimaryInStack = (
    stackMode: 'forward' | 'backward' | 'front' | 'back',
  ) => {
    if (!primary) return;
    mutate('Layer ' + stackMode, (current) =>
      moveNodeInStack(current, primary.id, stackMode),
    );
  };

  const cycleSelectionAtPoint = (point: Point) => {
    const hits = [...drawableIds]
      .reverse()
      .filter((id) => {
        const node = project.document.nodes[id];
        const rect = nodeRect(node);
        return (
          point.x >= rect.x &&
          point.x <= rect.x + rect.width &&
          point.y >= rect.y &&
          point.y <= rect.y + rect.height
        );
      });
    if (!hits.length) return false;
    const currentIndex = primary ? hits.indexOf(primary.id) : -1;
    const nextId = hits[(currentIndex + 1 + hits.length) % hits.length];
    setProject((current) => setSelection(current, [nextId]));
    setMessage('Cycled overlapping selection');
    return true;
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input,textarea,[contenteditable=true]')) return;

      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (mod && key === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }
      if (mod && key === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (mod && key === 'c') {
        event.preventDefault();
        copySelection();
        return;
      }
      if (mod && key === 'x') {
        event.preventDefault();
        cutSelection();
        return;
      }
      if (mod && key === 'v') {
        event.preventDefault();
        pasteSelection();
        return;
      }
      if (mod && key === 'd') {
        event.preventDefault();
        mutate('Duplicate', (current) =>
          duplicateNodes(current, selected, () => createVisualId('node')),
        );
        return;
      }
      if (mod && key === 'g') {
        event.preventDefault();
        event.shiftKey ? ungroupSelection() : groupSelection();
        return;
      }
      if (event.key === 'Tab' && layerIds.length) {
        event.preventDefault();
        const currentIndex = primary ? layerIds.indexOf(primary.id) : -1;
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex =
          (currentIndex + direction + layerIds.length) % layerIds.length;
        setProject((current) => setSelection(current, [layerIds[nextIndex]]));
        return;
      }
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selected.length
      ) {
        event.preventDefault();
        mutate('Delete', (current) => deleteNodes(current, selected));
        return;
      }
      if (event.key === 'Escape') {
        setProject((current) => setSelection(current, []));
        setMarquee(null);
        return;
      }
      if (
        selected.length &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        mutate('Nudge', (current) =>
          moveNodes(
            current,
            selected,
            event.key === 'ArrowLeft'
              ? -step
              : event.key === 'ArrowRight'
                ? step
                : 0,
            event.key === 'ArrowUp'
              ? -step
              : event.key === 'ArrowDown'
                ? step
                : 0,
          ),
        );
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const beginPhase7CanvasAction = (event: ReactPointerEvent) => {
    if (!phase7Action) return false;
    const point = documentPoint(event.clientX, event.clientY);
    if (!point) return false;
    event.preventDefault();
    event.stopPropagation();

    if (phase7Action === 'freehand') {
      freehandDraftRef.current = [point];
      setFreehandDraft([point]);
      gesture.current = {
        kind: 'freehand',
        startX: event.clientX,
        startY: event.clientY,
        before: project,
        startDocument: point,
      };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      return true;
    }

    runPhase7PointAction(point);
    return true;
  };

  const beginPathPointEdit = (
    event: ReactPointerEvent<SVGCircleElement>,
    id: string,
    pathHandle: PathHandleTarget,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const node = project.document.nodes[id];
    if (!node || node.transform?.locked) return;
    gesture.current = {
      kind: 'path-point',
      id,
      pathHandle,
      startX: event.clientX,
      startY: event.clientY,
      before: project,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const beginMove = (event: ReactPointerEvent, id: string) => {
    if (beginPhase7CanvasAction(event)) return;
    if (viewportMode !== 'select') return;
    event.stopPropagation();

    const node = project.document.nodes[id];
    if (!node || node.transform?.locked) return;

    const point = documentPoint(event.clientX, event.clientY);
    if (event.altKey && point && cycleSelectionAtPoint(point)) return;

    const next = event.shiftKey
      ? toggleSelection(project, id)
      : selected.includes(id)
        ? project
        : setSelection(project, [id]);
    if (next !== project) setProject(next);

    const movingIds = (next.editor?.selectedNodeIds ?? []).includes(id)
      ? next.editor?.selectedNodeIds ?? [id]
      : [id];
    const rect = nodeRect(node);
    gesture.current = {
      kind: 'move',
      id,
      ids: movingIds,
      startX: event.clientX,
      startY: event.clientY,
      before: next,
      origin: { x: rect.x, y: rect.y },
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const beginResize = (
    event: ReactPointerEvent,
    id: string,
    handle: ResizeHandle,
  ) => {
    event.stopPropagation();
    gesture.current = {
      kind: 'resize',
      id,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      before: project,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const beginRotate = (event: ReactPointerEvent, id: string) => {
    event.stopPropagation();
    const rect = (event.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    gesture.current = {
      kind: 'rotate',
      id,
      startX: event.clientX,
      startY: event.clientY,
      before: project,
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const beginViewportGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (beginPhase7CanvasAction(event)) return;

    if (viewportMode === 'pan') {
      gesture.current = {
        kind: 'pan',
        startX: event.clientX,
        startY: event.clientY,
        before: project,
        originPan: pan,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('[data-visual-node]')) return;

    const point = documentPoint(event.clientX, event.clientY);
    if (!point) {
      setProject((current) => setSelection(current, []));
      return;
    }

    gesture.current = {
      kind: 'marquee',
      startX: event.clientX,
      startY: event.clientY,
      before: project,
      startDocument: point,
      baseSelection: event.shiftKey ? selected : [],
    };
    setMarquee({ x: point.x, y: point.y, width: 0, height: 0 });
    if (!event.shiftKey) setProject((current) => setSelection(current, []));
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: ReactPointerEvent) => {
    const currentGesture = gesture.current;
    if (!currentGesture) return;

    if (currentGesture.kind === 'freehand') {
      const point = documentPoint(event.clientX, event.clientY);
      if (!point) return;
      const points = freehandDraftRef.current;
      const previous = points[points.length - 1];
      if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= 1.5) {
        const next = [...points, point];
        freehandDraftRef.current = next;
        setFreehandDraft(next);
      }
      return;
    }

    if (
      currentGesture.kind === 'path-point' &&
      currentGesture.id &&
      currentGesture.pathHandle
    ) {
      const point = documentPoint(event.clientX, event.clientY);
      const node = currentGesture.before.document.nodes[currentGesture.id];
      if (
        !point ||
        !node ||
        (node.kind !== 'path' && node.kind !== 'freehand')
      ) {
        return;
      }
      const localPoint = pathDocumentToLocalPoint(
        node,
        visualPathProps(node),
        point,
      );
      setProject(
        movePathHandle(
          currentGesture.before,
          currentGesture.id,
          currentGesture.pathHandle,
          localPoint,
        ),
      );
      return;
    }

    if (currentGesture.kind === 'pan' && currentGesture.originPan) {
      setPan({
        x:
          currentGesture.originPan.x +
          event.clientX -
          currentGesture.startX,
        y:
          currentGesture.originPan.y +
          event.clientY -
          currentGesture.startY,
      });
      return;
    }

    if (
      currentGesture.kind === 'marquee' &&
      currentGesture.startDocument
    ) {
      const point = documentPoint(event.clientX, event.clientY);
      if (!point) return;
      const selectionRect = {
        x: Math.min(currentGesture.startDocument.x, point.x),
        y: Math.min(currentGesture.startDocument.y, point.y),
        width: Math.abs(point.x - currentGesture.startDocument.x),
        height: Math.abs(point.y - currentGesture.startDocument.y),
      };
      setMarquee(selectionRect);
      const hits = drawableIds.filter((id) =>
        rectsIntersect(selectionRect, nodeRect(project.document.nodes[id])),
      );
      const ids = [
        ...new Set([...(currentGesture.baseSelection ?? []), ...hits]),
      ];
      setProject((current) => setSelection(current, ids));
      return;
    }

    if (!currentGesture.id) return;

    const scale = zoom / 100;
    const dx = (event.clientX - currentGesture.startX) / scale;
    const dy = (event.clientY - currentGesture.startY) / scale;

    if (currentGesture.kind === 'move' && currentGesture.origin) {
      const snap = snapPosition(
        currentGesture.before,
        currentGesture.id,
        currentGesture.origin.x + dx,
        currentGesture.origin.y + dy,
      );
      setGuides(snap.guides);
      const snappedDx = snap.x - currentGesture.origin.x;
      const snappedDy = snap.y - currentGesture.origin.y;
      setProject(
        moveNodes(
          currentGesture.before,
          currentGesture.ids ?? [currentGesture.id],
          snappedDx,
          snappedDy,
        ),
      );
    }

    if (currentGesture.kind === 'resize' && currentGesture.handle) {
      setProject(
        resizeNode(
          currentGesture.before,
          currentGesture.id,
          currentGesture.handle,
          dx,
          dy,
          event.shiftKey,
        ),
      );
    }

    if (currentGesture.kind === 'rotate' && currentGesture.center) {
      const angle =
        (Math.atan2(
          event.clientY - currentGesture.center.y,
          event.clientX - currentGesture.center.x,
        ) *
          180) /
          Math.PI +
        90;
      setProject(
        rotateNode(
          currentGesture.before,
          currentGesture.id,
          event.shiftKey ? Math.round(angle / 15) * 15 : angle,
        ),
      );
    }
  };

  const pointerUp = () => {
    const currentGesture = gesture.current;
    if (!currentGesture) return;

    if (currentGesture.kind === 'freehand') {
      const points = freehandDraftRef.current;
      freehandDraftRef.current = [];
      setFreehandDraft([]);
      gesture.current = null;
      if (points.length > 1) finishFreehand(points);
      return;
    }

    if (
      currentGesture.kind !== 'pan' &&
      currentGesture.kind !== 'marquee'
    ) {
      const label =
        currentGesture.kind === 'move'
          ? 'Move'
          : currentGesture.kind === 'resize'
            ? 'Resize'
            : currentGesture.kind === 'path-point'
              ? 'Edit path point'
              : 'Rotate';
      setProject((current) => {
        history.current.commit(currentGesture.before, current, label);
        return current;
      });
      setHistoryTick((value) => value + 1);
    }

    gesture.current = null;
    setGuides([]);
    setMarquee(null);
  };

  const beginPropertyEdit = () => {
    propertyBefore.current = project;
  };

  const endPropertyEdit = (label: string) => {
    const before = propertyBefore.current;
    propertyBefore.current = null;
    if (!before) return;
    setProject((current) => {
      history.current.commit(before, current, label);
      return current;
    });
    setHistoryTick((value) => value + 1);
  };

  const updateTransformDraft = (
    key: keyof VisualTransform,
    rawValue: number,
  ) => {
    if (!primary || !Number.isFinite(rawValue)) return;
    let value = rawValue;
    if (key === 'opacity') value = Math.max(0, Math.min(1, rawValue));
    if (key === 'width' || key === 'height') value = Math.max(1, rawValue);

    setProject((current) => {
      const currentNode = current.document.nodes[primary.id];
      if (!currentNode) return current;
      if (
        currentNode.kind === 'group' &&
        (currentNode.childIds?.length ?? 0) > 0 &&
        (key === 'x' || key === 'y')
      ) {
        const rect = nodeRect(currentNode);
        return moveNodes(
          current,
          [currentNode.id],
          key === 'x' ? value - rect.x : 0,
          key === 'y' ? value - rect.y : 0,
        );
      }
      return patchNodeTransform(current, primary.id, { [key]: value });
    });
  };

  const load = async (file: File) => {
    try {
      const loaded = await loadVisualProjectFile(file);
      setProject(loaded);
      setZoom(clampZoom((loaded.editor?.zoom ?? 0.78) * 100));
      setPan({
        x: loaded.editor?.panX ?? 0,
        y: loaded.editor?.panY ?? 0,
      });
      history.current = new VisualHistory(100);
      cleanSignature.current = semanticSignature(loaded);
      setDirty(false);
      setMessage('Project loaded');
      setHistoryTick((value) => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Load failed');
    }
  };

  const save = () => {
    const saved = {
      ...project,
      updatedAt: new Date().toISOString(),
      editor: {
        ...project.editor,
        zoom: zoom / 100,
        panX: pan.x,
        panY: pan.y,
      },
    };
    downloadVisualProject(saved);
    cleanSignature.current = semanticSignature(project);
    setDirty(false);
    setMessage('Project saved');
  };

  const handoff = () => {
    const source = codeSource || generated.value?.source;
    if (!source) {
      setMessage(generated.error ?? 'Code unavailable');
      return;
    }
    setCodeHandoff({
      id: createVisualId('handoff'),
      name: project.name + ' — Generated',
      source,
    });
    onModeChange('code');
  };

  const renderVisualPreview = async (openModal = true) => {
    const source = phase13Active || phase12Active || phase11Active || phase10Active || phase9Active
      ? previewGenerated.value?.source
      : codeSource || generated.value?.source;
    if (openModal) setPreviewModalOpen(true);
    if (!source) {
      setModalPreviewError((phase9Active ? previewGenerated.error : generated.error) ?? 'Code unavailable');
      return;
    }

    setModalPreviewLoading(true);
    setModalPreviewError(null);
    try {
      const result = await renderAuthoritativeVisualSource(
        source,
        phase10Active && !phase11Active && !phase12Active && !phase13Active
          ? displayPreviewGenerated.value?.source ?? source
          : source,
      );
      if (!result.ok) {
        setModalPreviewUrl(null);
        setModalPreviewError(result.error);
        setMessage('Preview failed');
        return;
      }
      setModalPreviewUrl(result.dataUrl);
      setModalPreviewDownloadUrl(result.downloadDataUrl);
      setModalPreviewMime(result.mime);
      setModalPreviewFileName(result.fileName);
      setPhase7Results(result.results);
      setMessage('Preview rendered');
    } catch (error) {
      setModalPreviewUrl(null);
      setModalPreviewDownloadUrl(null);
      setModalPreviewError(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setModalPreviewLoading(false);
    }
  };

  const downloadTextFile = (source: string, fileName: string) => {
    const blob = new Blob([source], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.ts') ? fileName : fileName + '.ts';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCanvasPreview = () => {
    const downloadUrl = modalPreviewDownloadUrl ?? modalPreviewUrl;
    if (!downloadUrl) return;
    const extensionFromName = modalPreviewFileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
    const extension =
      extensionFromName ??
      (modalPreviewMime === 'image/jpeg' ? 'jpg' :
      modalPreviewMime === 'image/webp' ? 'webp' :
      modalPreviewMime === 'image/gif' ? 'gif' :
      modalPreviewMime === 'image/avif' ? 'avif' :
      modalPreviewMime === 'image/tiff' ? 'tiff' :
      modalPreviewMime === 'image/heif' ? 'heif' :
      modalPreviewMime === 'image/jp2' ? 'jp2' :
      modalPreviewMime === 'image/jxl' ? 'jxl' :
      modalPreviewMime === 'audio/wav' ? 'wav' :
      modalPreviewMime === 'video/mp4' ? 'mp4' :
      modalPreviewMime === 'video/webm' ? 'webm' :
      modalPreviewMime === 'application/x-raw' ? 'raw' : 'png');
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeVisualDownloadStem(project.name) + '.' + extension;
    link.click();
  };

  const renameCanvas = (name: string) => {
    const nextName = name || 'Untitled Canvas';
    setProject((current) => {
      const next = { ...current, name: nextName, updatedAt: new Date().toISOString() };
      projectRef.current = next;
      return next;
    });
  };

  const updateCodeFileName = (name: string) => {
    fileNameTouchedRef.current = true;
    setCodeFileName(name);
    persistLiveCode(codeSource, name);
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      setZoom((value) =>
        clampZoom(value + (event.deltaY < 0 ? 5 : -5)),
      );
      return;
    }
    setPan((current) => ({
      x: current.x - event.deltaX,
      y: current.y - event.deltaY,
    }));
  };

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2) {
      pinch.current = null;
      return;
    }
    pinch.current = {
      distance: distance(event.touches[0], event.touches[1]),
      zoom,
    };
  };

  const onTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinch.current) return;
    event.preventDefault();
    const nextDistance = distance(event.touches[0], event.touches[1]);
    setZoom(
      clampZoom(
        pinch.current.zoom * (nextDistance / pinch.current.distance),
      ),
    );
  };

  const finishRename = (id: string) => {
    const value = renameDraft;
    setRenamingId(null);
    mutate('Rename', (current) => renameNode(current, id, value));
  };

  const renderLayerRows = (ids: string[], depth = 0): ReactNode =>
    ids.map((id, index) => {
      const node = project.document.nodes[id];
      if (!node) return null;
      const isSelected = selected.includes(id);
      const hasChildren = (node.childIds?.length ?? 0) > 0;
      const isCollapsed = collapsed.has(id);
      const siblingIds = node.parentId
        ? project.document.nodes[node.parentId]?.childIds ?? []
        : project.document.rootNodeIds;

      return (
        <div key={id}>
          <div
            className="apx-vw-layer-row"
            data-active={isSelected ? 'true' : undefined}
            draggable
            onDragStart={(event) => {
              setDraggedLayer(id);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', id);
            }}
            onDragEnd={() => setDraggedLayer(null)}
            onDragOver={(event) => {
              if (draggedLayer) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (!draggedLayer || draggedLayer === id) return;
              const source = project.document.nodes[draggedLayer];
              if (
                !source ||
                (source.parentId ?? null) !== (node.parentId ?? null)
              ) {
                setMessage('Drag reorder is limited to sibling layers');
                return;
              }
              mutate('Drag reorder', (current) =>
                reorderNode(current, draggedLayer, index),
              );
              setDraggedLayer(null);
            }}
            onClick={(event) =>
              setProject((current) =>
                event.shiftKey
                  ? toggleSelection(current, id)
                  : setSelection(current, [id]),
              )
            }
            style={{
              paddingLeft: 6 + depth * 14,
              background: isSelected ? '#17345a' : undefined,
            }}
          >
            <button
              title={hasChildren ? 'Collapse / expand' : 'Leaf layer'}
              disabled={!hasChildren}
              onClick={(event) => {
                event.stopPropagation();
                setCollapsed((current) => {
                  const next = new Set(current);
                  next.has(id) ? next.delete(id) : next.add(id);
                  return next;
                });
              }}
            >
              {hasChildren ? (isCollapsed ? '▸' : '▾') : '·'}
            </button>
            <button
              title="Visibility"
              onClick={(event) => {
                event.stopPropagation();
                mutate('Visibility', (current) =>
                  setNodeVisibility(
                    current,
                    id,
                    node.transform?.visible === false,
                  ),
                );
              }}
            >
              {node.transform?.visible === false ? '○' : '◉'}
            </button>
            <button
              title="Lock"
              onClick={(event) => {
                event.stopPropagation();
                mutate('Lock', (current) =>
                  setNodeLocked(current, id, !node.transform?.locked),
                );
              }}
            >
              {node.transform?.locked ? '🔒' : '◇'}
            </button>
            {renamingId === id ? (
              <input
                autoFocus
                className="apx-vw-field"
                value={renameDraft}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setRenameDraft(event.target.value)}
                onBlur={() => finishRename(id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setRenamingId(null);
                  }
                }}
                style={{ flex: 1, minWidth: 0, height: 24 }}
              />
            ) : (
              <span
                title="Double-click to rename"
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  setRenamingId(id);
                  setRenameDraft(node.name ?? node.kind);
                }}
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {node.name ?? node.kind}
              </span>
            )}
            <button
              title="Move backward"
              disabled={index === 0}
              onClick={(event) => {
                event.stopPropagation();
                mutate('Reorder', (current) =>
                  reorderNode(current, id, index - 1),
                );
              }}
            >
              ↑
            </button>
            <button
              title="Move forward"
              disabled={index === siblingIds.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                mutate('Reorder', (current) =>
                  reorderNode(current, id, index + 1),
                );
              }}
            >
              ↓
            </button>
          </div>
          {hasChildren &&
            !isCollapsed &&
            renderLayerRows(node.childIds ?? [], depth + 1)}
        </div>
      );
    });

  const selectedGroups = selected
    .map((id) => project.document.nodes[id])
    .filter(
      (node): node is VisualNode =>
        Boolean(node && node.kind === 'group' && (node.childIds?.length ?? 0) > 0),
    );

  const featureTools = [
    ['canvas', ComputerDesktopIcon, 'Canvas'],
    ['images', PhotoIcon, 'Images'],
    ['text', DocumentTextIcon, 'Text'],
    ['charts', ChartBarIcon, 'Charts'],
    ['shapes', Squares2X2Icon, 'Shapes'],
    ['paths', PencilSquareIcon, 'Paths'],
    ['layers', RectangleStackIcon, 'Layers'],
    ['components', CubeIcon, 'Components'],
    ['assets', CircleStackIcon, 'Assets'],
    ['gif', FilmIcon, 'GIF'],
    ['audio', MusicalNoteIcon, 'Audio'],
    ['video', VideoCameraIcon, 'Video'],
  ] as const;

  const mediaContextActive =
    activeTool === 'images' ||
    activeTool === 'shapes' ||
    activeTool === 'text' ||
    activeTool === 'charts' ||
    activeTool === 'paths' ||
    activeTool === 'components' ||
    activeTool === 'assets' ||
    activeTool === 'gif' ||
    activeTool === 'audio' ||
    activeTool === 'video';

  const imageAssets = assets.filter((asset) =>
    asset.mime.startsWith('image/'),
  );
  const fontAssets = assets.filter(isStudioFontAsset);
  const systemFontFamilies = [
    'Arial',
    'Helvetica',
    'Georgia',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
  ];

  const renderMediaContext = () => {
    if (activeTool === 'video') {
      return (
        <VisualVideoContext
          project={project}
          assets={assets}
          onMutate={mutate}
          onOpenTimeline={() => {
            setDockTab('timeline');
            setDockCollapsed(false);
          }}
          onPreview={() => void renderVisualPreview(true)}
          previewUrl={modalPreviewMime.startsWith('video/') ? modalPreviewUrl : null}
          previewMime={modalPreviewMime}
        />
      );
    }

    if (activeTool === 'audio') {
      return (
        <VisualAudioContext
          project={project}
          assets={assets}
          onMutate={mutate}
          onOpenTimeline={() => {
            setDockTab('timeline');
            setDockCollapsed(false);
          }}
          onPreview={() => void renderVisualPreview(true)}
          previewUrl={modalPreviewMime.startsWith('audio/') ? modalPreviewUrl : null}
          previewMime={modalPreviewMime}
        />
      );
    }

    if (activeTool === 'gif') {
      return (
        <VisualGifContext
          project={project}
          assets={assets}
          onMutate={mutate}
          onOpenTimeline={() => {
            setDockTab('timeline');
            setDockCollapsed(false);
          }}
          onPreview={() => void renderVisualPreview(true)}
        />
      );
    }

    if (activeTool === 'components') {
      return (
        <VisualComponentsContext
          project={project}
          selectedIds={selected}
          assets={assets}
          onMutate={mutate}
          onMessage={setMessage}
          onInspectorTab={setInspectorTab}
        />
      );
    }

    if (activeTool === 'charts') {
      return <ChartFamilyPicker onInsert={insertChart} />;
    }

    if (activeTool === 'paths') {
      const activatePointTool = (
        action: NonNullable<typeof phase7Action>,
        label: string,
      ) => {
        setPhase7Action(action);
        setViewportMode('select');
        setMessage(label + ' · click the artboard');
      };
      return (
        <div className="apx-media-context" data-visual-paths-context>
          <div className="apx-media-context-copy">
            <strong>Paths & pixels</strong>
            <span>Draw native Apexify paths, connectors and doodles, then inspect or mutate the rendered pixels.</span>
          </div>

          <div className="apx-media-context-heading">
            <strong>Path tools</strong>
            {phase7Action ? (
              <button
                type="button"
                onClick={() => {
                  setPhase7Action(null);
                  setFreehandDraft([]);
                  freehandDraftRef.current = [];
                  setMessage('Path tool action cancelled');
                }}
                data-phase7-action-cancel
              >
                Cancel action
              </button>
            ) : null}
          </div>
          <div className="apx-shape-picker" data-path-tool-picker>
            {(['line', 'polyline', 'bezier', 'path', 'connector'] as const).map((tool) => (
              <button
                key={tool}
                type="button"
                onClick={() => insertPath(tool)}
                data-path-insert={tool}
              >
                <span className="apx-shape-glyph">⌁</span>
                <small>{tool}</small>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setViewportMode('select');
                insertPath('freehand');
              }}
              data-path-freehand
              data-active={phase7Action === 'freehand' ? 'true' : undefined}
            >
              <span className="apx-shape-glyph">✎</span>
              <small>freehand</small>
            </button>
          </div>

          <div className="apx-media-context-heading">
            <strong>Pixel operations</strong>
            <span>destructive</span>
          </div>
          <div className="apx-pre4-disabled-grid" data-pixel-filters>
            {(['grayscale', 'invert', 'sepia', 'brightness', 'contrast', 'saturate'] as const).map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() =>
                  appendPixelOperation(
                    { type: 'manipulate', filter, intensity: 1 },
                    filter.charAt(0).toUpperCase() + filter.slice(1) + ' pixels',
                  )
                }
                data-pixel-filter={filter}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="apx-media-context-heading">
            <strong>Pixel edit</strong>
            <span>next click</span>
          </div>
          <div className="apx-media-url">
            <input
              type="color"
              value={pixelColorDraft}
              aria-label="Pixel color"
              onChange={(event) => setPixelColorDraft(event.target.value)}
              data-pixel-color
            />
            <button
              type="button"
              data-pixel-set-tool
              data-active={phase7Action === 'pixel-set' ? 'true' : undefined}
              onClick={() => activatePointTool('pixel-set', 'Set pixel color')}
            >
              Set pixel
            </button>
          </div>

          <div className="apx-media-context-heading">
            <strong>Inspect & detect</strong>
            <span>structured results</span>
          </div>
          <div className="apx-pre4-disabled-grid" data-detection-tools>
            <button
              type="button"
              data-pixel-inspector
              data-active={phase7Action === 'pixel-probe' ? 'true' : undefined}
              onClick={() => activatePointTool('pixel-probe', 'Pixel color probe')}
            >
              Pixel color
            </button>
            <button
              type="button"
              data-pixel-data-tool
              data-active={phase7Action === 'pixel-data' ? 'true' : undefined}
              onClick={() => activatePointTool('pixel-data', '16×16 pixel sample')}
            >
              Pixel data
            </button>
            <button
              type="button"
              data-detect-path-tool
              data-active={phase7Action === 'path-detect' ? 'true' : undefined}
              onClick={() => activatePointTool('path-detect', 'Path hit test')}
            >
              Path hit
            </button>
            <button
              type="button"
              data-detect-region-tool
              data-active={phase7Action === 'region-detect' ? 'true' : undefined}
              onClick={() => activatePointTool('region-detect', 'Selected bounds hit test')}
            >
              Region hit
            </button>
            <button
              type="button"
              data-detect-distance-tool
              data-active={phase7Action === 'region-distance' ? 'true' : undefined}
              onClick={() => activatePointTool('region-distance', 'Distance to selected bounds')}
            >
              Distance
            </button>
            <button
              type="button"
              data-detect-any-tool
              data-active={phase7Action === 'any-region' ? 'true' : undefined}
              onClick={() => activatePointTool('any-region', 'Any visible region hit test')}
            >
              Any region
            </button>
          </div>

          <div className="apx-live-sync-note">
            <strong>{phase7Action ? 'Canvas action active' : 'Runtime-backed authoring'}</strong>
            <span>
              {phase7Action
                ? 'The next artboard gesture/click writes a Visual Project operation and regenerates Apexify code.'
                : 'Paths render through @apexify/web; pixel and detection calls are generated from the same project model.'}
            </span>
          </div>
        </div>
      );
    }

    if (activeTool === 'text') {
      return (
        <div className="apx-media-context" data-visual-text-context>
          <div className="apx-media-context-copy">
            <strong>Text</strong>
            <span>Insert editable Apexify text, then style typography, wrapping, effects and curves from the Inspector.</span>
          </div>

          <button
            type="button"
            className="apx-media-open-assets"
            data-text-insert
            onClick={() => insertText('Text')}
          >
            <DocumentTextIcon />
            Add text layer
          </button>

          <div className="apx-media-context-heading">
            <strong>Font families</strong>
            <button
              type="button"
              onClick={() => {
                setAssetFilter('font');
                setDockTab('assets');
              }}
            >
              Fonts
            </button>
          </div>

          <div className="apx-text-font-list">
            {systemFontFamilies.map((family) => (
              <button
                type="button"
                key={family}
                onClick={() => {
                  if (!primaryText) {
                    insertText('Text', undefined, undefined, family);
                    return;
                  }
                  mutateText('Font family', (current) => ({
                    ...current,
                    font: {
                      ...(current.font ?? {}),
                      family,
                      name: family,
                      path: undefined,
                    },
                  }));
                }}
                data-text-font-family={family}
              >
                <strong style={{ fontFamily: family }}>{family}</strong>
                <small>System font</small>
              </button>
            ))}
          </div>

          <div className="apx-media-context-heading">
            <strong>Uploaded fonts</strong>
            <button
              type="button"
              onClick={() => {
                setAssetFilter('font');
                setDockTab('assets');
              }}
            >
              Upload
            </button>
          </div>
          <div className="apx-text-font-list">
            {fontAssets.length ? fontAssets.map((asset) => {
              const family = studioAssetFontFamily(asset);
              return (
                <button
                  type="button"
                  key={asset.id}
                  onClick={() => applyFontAsset(asset)}
                  data-font-asset-apply={asset.id}
                >
                  <strong style={{ fontFamily: family }}>{family}</strong>
                  <small>{asset.name}</small>
                </button>
              );
            }) : (
              <div className="apx-media-context-empty">
                <DocumentTextIcon />
                <strong>No uploaded fonts yet</strong>
                <span>Open Fonts in Assets to add TTF, OTF, WOFF or WOFF2 files.</span>
              </div>
            )}
          </div>

          <div className="apx-live-sync-note">
            <strong>Direct editing</strong>
            <span>Double-click a text layer on the canvas to edit its content in place.</span>
          </div>
        </div>
      );
    }

    if (activeTool === 'shapes') {
      return (
        <div className="apx-media-context" data-visual-shapes-context>
          <div className="apx-media-context-copy">
            <strong>Built-in shapes</strong>
            <span>Insert native Apexify shape sources. Every shape remains linked to createImage().</span>
          </div>
          <div className="apx-shape-picker">
            {IMAGE_SHAPE_TYPES.map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => insertShape(shape)}
                data-shape-insert={shape}
              >
                <span className={'apx-shape-glyph apx-shape-glyph--' + shape} />
                <small>{shape}</small>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeTool === 'images') {
      return (
        <div className="apx-media-context" data-visual-images-context>
          <div className="apx-media-context-copy">
            <strong>Images</strong>
            <span>Use a Studio asset, an HTTP(S) URL, or drop an image directly on the canvas.</span>
          </div>

          <div className="apx-media-url">
            <input
              className="apx-pre4-input"
              value={imageUrlDraft}
              placeholder="https://example.com/image.png"
              onChange={(event) => setImageUrlDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && imageUrlDraft.trim()) {
                  insertImageSource(imageUrlDraft.trim(), 'Remote image');
                  setImageUrlDraft('');
                }
              }}
            />
            <button
              type="button"
              disabled={!imageUrlDraft.trim()}
              onClick={() => {
                insertImageSource(imageUrlDraft.trim(), 'Remote image');
                setImageUrlDraft('');
              }}
              data-image-url-insert
            >
              Add
            </button>
          </div>

          <div className="apx-media-drop-hint">
            <ArrowDownTrayIcon />
            <span>Drop PNG, JPG, WebP, GIF or SVG directly onto the artboard.</span>
          </div>

          <div className="apx-media-context-heading">
            <strong>Image assets</strong>
            <button type="button" onClick={() => setDockTab('assets')}>Open Assets</button>
          </div>
          <div className="apx-media-asset-list">
            {imageAssets.length ? imageAssets.map((asset) => (
              <button
                type="button"
                key={asset.id}
                title={'Insert ' + asset.name}
                onClick={() => insertImageAsset(asset)}
                data-image-asset-insert={asset.id}
              >
                <img src={studioAssetDataUrl(asset)} alt="" />
                <span>
                  <strong>{asset.name}</strong>
                  <small>
                    {asset.metadata?.width && asset.metadata?.height
                      ? asset.metadata.width + '×' + asset.metadata.height
                      : asset.mime}
                  </small>
                </span>
              </button>
            )) : (
              <div className="apx-media-context-empty">
                <PhotoIcon />
                <strong>No image assets yet</strong>
                <span>Open Assets below to upload an image, or drop one on the artboard.</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="apx-media-context" data-visual-assets-context>
        <div className="apx-media-context-copy">
          <strong>Assets</strong>
          <span>Shared Studio assets keep stable studio://asset/… identities across Visual and Code modes.</span>
        </div>
        <button
          className="apx-media-open-assets"
          type="button"
          onClick={() => setDockTab('assets')}
        >
          <CircleStackIcon />
          Manage all assets
        </button>
        <div className="apx-media-asset-list">
          {imageAssets.map((asset) => (
            <button
              type="button"
              key={asset.id}
              onClick={() => insertImageAsset(asset)}
            >
              <img src={studioAssetDataUrl(asset)} alt="" />
              <span><strong>{asset.name}</strong><small>Insert image</small></span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const inspectorTabs = [
    ['style', 'Style'],
    ['transform', 'Transform'],
    ['effects', 'Effects'],
    ['data', 'Data'],
    ['advanced', 'Advanced'],
  ] as const;

  const dockTabs = [
    ['generated', 'Code'],
    ['diagnostics', 'Diagnostics'],
    ['assets', 'Assets'],
    ['history', 'History'],
    ...((activeTool === 'gif' || phase11Active || activeTool === 'audio' || phase12Active)
      ? [['timeline', 'Timeline'] as const]
      : []),
  ] as const;

  const renderTransformFields = () => {
    if (!primary) {
      return (
        <div className="apx-pre4-empty">
          <strong>No selection</strong>
          <span>Select a layer or object to edit its properties.</span>
        </div>
      );
    }

    return (
      <>
        <div className="apx-pre4-inspector-title">
          <div>
            <strong>{primary.name ?? primary.kind}</strong>
            <small>{selected.length > 1 ? selected.length + ' selected' : primary.kind}</small>
          </div>
          <span className="apx-pre4-type-pill">{primary.kind}</span>
        </div>

        <div className="apx-pre4-property">
          <label>Name</label>
          <input
            className="apx-pre4-input"
            value={primary.name ?? primary.kind}
            onChange={(event) =>
              setProject((current) =>
                renameNode(current, primary.id, event.target.value),
              )
            }
            onFocus={beginPropertyEdit}
            onBlur={() => endPropertyEdit('Rename')}
          />
        </div>

        <div className="apx-pre4-property-grid">
          {(['x', 'y'] as const).map((key) => (
            <label key={key}>
              <span>{key.toUpperCase()}</span>
              <input
                className="apx-pre4-input"
                type="number"
                value={primary.transform?.[key] ?? 0}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateTransformDraft(key, Number(event.target.value))}
                onBlur={() => endPropertyEdit('Transform ' + key)}
              />
            </label>
          ))}
        </div>

        <div className="apx-pre4-property-grid">
          {(['width', 'height'] as const).map((key) => (
            <label key={key}>
              <span>{key === 'width' ? 'W' : 'H'}</span>
              <input
                className="apx-pre4-input"
                type="number"
                min={1}
                value={primary.transform?.[key] ?? (key === 'width' ? 160 : 100)}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateTransformDraft(key, Number(event.target.value))}
                onBlur={() => endPropertyEdit('Transform ' + key)}
              />
            </label>
          ))}
        </div>

        <div className="apx-pre4-property">
          <label>Rotation</label>
          <div className="apx-pre4-inline-field">
            <span>↻</span>
            <input
              className="apx-pre4-input"
              type="number"
              value={primary.transform?.rotation ?? 0}
              onFocus={beginPropertyEdit}
              onChange={(event) => updateTransformDraft('rotation', Number(event.target.value))}
              onBlur={() => endPropertyEdit('Transform rotation')}
            />
            <span>°</span>
          </div>
        </div>

        <div className="apx-pre4-align-grid" aria-label="Alignment controls">
          {(['left','center','right','top','middle','bottom'] as const).map((alignment) => (
            <button
              key={alignment}
              type="button"
              title={'Align ' + alignment}
              disabled={selected.length < 2}
              onClick={() =>
                mutate('Align ' + alignment, (current) =>
                  alignNodes(current, selected, alignment),
                )
              }
            >
              {alignment === 'left' ? '┤' :
               alignment === 'center' ? '↔' :
               alignment === 'right' ? '├' :
               alignment === 'top' ? '⊥' :
               alignment === 'middle' ? '↕' : '⊤'}
            </button>
          ))}
        </div>

        <div className="apx-pre4-property">
          <div className="apx-pre4-property-heading">
            <label>Opacity</label>
            <span>{Math.round((primary.transform?.opacity ?? 1) * 100)}%</span>
          </div>
          <input
            className="apx-pre4-range"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={primary.transform?.opacity ?? 1}
            onPointerDown={beginPropertyEdit}
            onChange={(event) => updateTransformDraft('opacity', Number(event.target.value))}
            onPointerUp={() => endPropertyEdit('Transform opacity')}
          />
        </div>
      </>
    );
  };

  const renderCanvasHeader = () => (
    <div className="apx-pre4-inspector-title">
      <div>
        <strong>{project.name}</strong>
        <small>Canvas document · Phase 4</small>
      </div>
      <span className="apx-pre4-type-pill">canvas</span>
    </div>
  );

  const renderCanvasStyle = () => {
    const canvas = project.document.canvas ?? {};
    const mode = canvasBaseMode(canvas);
    const gradient = canvas.gradientBg ?? defaultCanvasGradient();
    const customBg = canvas.customBg;

    return (
      <>
        {renderCanvasHeader()}
        <div className="apx-pre4-property">
          <label>Canvas name</label>
          <input
            className="apx-pre4-input"
            value={project.name}
            onFocus={beginPropertyEdit}
            onChange={(event) => renameCanvas(event.target.value)}
            onBlur={() => endPropertyEdit('Rename canvas')}
          />
        </div>

        <div className="apx-pre4-section" data-canvas-section="background">
          <div className="apx-pre4-section-title">Base background</div>
          <select
            className="apx-pre4-input"
            data-canvas-base-mode
            value={mode}
            onChange={(event) => setCanvasBaseMode(event.target.value as typeof mode)}
          >
            <option value="default">Default black</option>
            <option value="color">Solid color</option>
            <option value="gradient">Gradient</option>
            <option value="image">Image / asset</option>
            <option value="transparent">Transparent</option>
          </select>

          {mode === 'color' ? (
            <div className="apx-canvas-color-row">
              <input
                aria-label="Canvas background color"
                type="color"
                value={canvas.colorBg || '#000000'}
                onChange={(event) => updateCanvasDraft((current) => ({ ...current, colorBg: event.target.value }))}
              />
              <input
                className="apx-pre4-input"
                data-canvas-color-text
                value={canvas.colorBg || '#000000'}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateCanvasDraft((current) => ({ ...current, colorBg: event.target.value }))}
                onBlur={() => endPropertyEdit('Canvas color')}
              />
            </div>
          ) : null}

          {mode === 'gradient' ? (
            <div className="apx-canvas-stack">
              <label className="apx-canvas-field">
                <span>Type</span>
                <select
                  className="apx-pre4-input"
                  value={gradient.type}
                  onChange={(event) => {
                    const type = event.target.value as VisualGradient['type'];
                    mutateCanvas('Gradient type', (current) => ({
                      ...current,
                      gradientBg:
                        type === 'radial'
                          ? { type, colors: gradient.colors, startX: 0, startY: 0, startRadius: 0, endX: project.document.width / 2, endY: project.document.height / 2, endRadius: Math.max(project.document.width, project.document.height) / 2 }
                          : type === 'conic'
                            ? { type, colors: gradient.colors, centerX: project.document.width / 2, centerY: project.document.height / 2, startAngle: 0 }
                            : { type, colors: gradient.colors, rotate: 90 },
                    }));
                  }}
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                  <option value="conic">Conic</option>
                </select>
              </label>
              {gradient.type !== 'radial' ? (
                <label className="apx-canvas-field">
                  <span>{gradient.type === 'conic' ? 'Start angle' : 'Rotation'}</span>
                  <input
                    className="apx-pre4-input"
                    type="number"
                    value={gradient.type === 'conic' ? (gradient.startAngle ?? 0) : (gradient.rotate ?? 90)}
                    onFocus={beginPropertyEdit}
                    onChange={(event) => updateCanvasDraft((current) => ({
                      ...current,
                      gradientBg: {
                        ...(current.gradientBg ?? gradient),
                        ...(gradient.type === 'conic'
                          ? { startAngle: Number(event.target.value) }
                          : { rotate: Number(event.target.value) }),
                      } as VisualGradient,
                    }))}
                    onBlur={() => endPropertyEdit('Gradient geometry')}
                  />
                </label>
              ) : null}
              <div className="apx-canvas-gradient-stops">
                {gradient.colors.map((stop, index) => (
                  <div key={index}>
                    <input
                      aria-label={'Gradient stop ' + (index + 1) + ' color'}
                      type="color"
                      value={stop.color}
                      onChange={(event) => setGradientStop(index, { color: event.target.value })}
                    />
                    <input
                      className="apx-pre4-input"
                      type="number"
                      min={0}
                      max={100}
                      value={Math.round(stop.stop * 100)}
                      onChange={(event) => setGradientStop(index, { stop: Math.max(0, Math.min(1, Number(event.target.value) / 100)) })}
                    />
                    <button
                      type="button"
                      disabled={gradient.colors.length <= 2}
                      onClick={() => mutateCanvas('Remove gradient stop', (current) => ({
                        ...current,
                        gradientBg: {
                          ...(current.gradientBg ?? gradient),
                          colors: (current.gradientBg ?? gradient).colors.filter((_, stopIndex) => stopIndex !== index),
                        } as VisualGradient,
                      }))}
                    >×</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => mutateCanvas('Add gradient stop', (current) => {
                    const active = current.gradientBg ?? gradient;
                    return {
                      ...current,
                      gradientBg: {
                        ...active,
                        colors: [...active.colors, { stop: 1, color: '#ffffff' }].sort((a, b) => a.stop - b.stop),
                      } as VisualGradient,
                    };
                  })}
                >＋ Add stop</button>
              </div>
            </div>
          ) : null}

          {mode === 'image' && customBg ? (
            <div className="apx-canvas-stack">
              <label className="apx-canvas-field">
                <span>Source</span>
                <input
                  className="apx-pre4-input"
                  placeholder="studio://asset/... or https://..."
                  value={customBg.source}
                  onFocus={beginPropertyEdit}
                  onChange={(event) => updateCanvasDraft((current) => ({
                    ...current,
                    customBg: { ...(current.customBg ?? customBg), source: event.target.value },
                  }))}
                  onBlur={() => endPropertyEdit('Canvas image source')}
                />
              </label>
              <div className="apx-pre4-property-grid">
                <label>
                  <span>Fit</span>
                  <select
                    className="apx-pre4-input"
                    value={customBg.fit ?? 'cover'}
                    onChange={(event) => mutateCanvas('Background fit', (current) => ({
                      ...current,
                      customBg: { ...(current.customBg ?? customBg), fit: event.target.value as 'fill' | 'contain' | 'cover' },
                    }))}
                  >
                    {CANVAS_FITS.map((fit) => <option key={fit} value={fit}>{fit}</option>)}
                  </select>
                </label>
                <label>
                  <span>Align</span>
                  <select
                    className="apx-pre4-input"
                    value={customBg.align ?? 'center'}
                    onChange={(event) => mutateCanvas('Background alignment', (current) => ({
                      ...current,
                      customBg: { ...(current.customBg ?? customBg), align: event.target.value as NonNullable<VisualCanvasConfig['customBg']>['align'] },
                    }))}
                  >
                    {CANVAS_ALIGNMENTS.map((align) => <option key={align} value={align}>{align}</option>)}
                  </select>
                </label>
              </div>
              <label className="apx-canvas-check">
                <input
                  type="checkbox"
                  checked={customBg.inherit ?? false}
                  onChange={(event) => mutateCanvas('Background inherit dimensions', (current) => ({
                    ...current,
                    customBg: { ...(current.customBg ?? customBg), inherit: event.target.checked },
                  }))}
                />
                <span>Inherit source dimensions</span>
              </label>
              <label className="apx-canvas-field">
                <span>Image opacity</span>
                <input
                  className="apx-pre4-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={customBg.opacity ?? 1}
                  onChange={(event) => updateCanvasDraft((current) => ({
                    ...current,
                    customBg: { ...(current.customBg ?? customBg), opacity: Number(event.target.value) },
                  }))}
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="apx-pre4-section" data-canvas-section="appearance">
          <div className="apx-pre4-section-title">Appearance</div>
          <label className="apx-canvas-field">
            <span>Canvas opacity · {Math.round((canvas.opacity ?? 1) * 100)}%</span>
            <input
              className="apx-pre4-range"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={canvas.opacity ?? 1}
              onPointerDown={beginPropertyEdit}
              onChange={(event) => updateCanvasDraft((current) => ({ ...current, opacity: Number(event.target.value) }))}
              onPointerUp={() => endPropertyEdit('Canvas opacity')}
            />
          </label>
          <div className="apx-pre4-property-grid">
            <label>
              <span>Radius</span>
              <input
                className="apx-pre4-input"
                type="number"
                min={0}
                disabled={canvas.borderRadius === 'circular'}
                value={typeof canvas.borderRadius === 'number' ? canvas.borderRadius : 0}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateCanvasDraft((current) => ({ ...current, borderRadius: Math.max(0, Number(event.target.value)) }))}
                onBlur={() => endPropertyEdit('Canvas radius')}
              />
            </label>
            <label className="apx-canvas-check">
              <input
                type="checkbox"
                checked={canvas.borderRadius === 'circular'}
                onChange={(event) => mutateCanvas('Circular canvas', (current) => ({ ...current, borderRadius: event.target.checked ? 'circular' : 0 }))}
              />
              <span>Circular</span>
            </label>
          </div>
        </div>

        <div className="apx-pre4-section" data-canvas-section="stroke">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Stroke</div>
            <label className="apx-canvas-switch">
              <input
                type="checkbox"
                checked={Boolean(canvas.stroke)}
                onChange={(event) => mutateCanvas('Canvas stroke', (current) => {
                  if (!event.target.checked) {
                    const next = { ...current };
                    delete next.stroke;
                    return next;
                  }
                  return { ...current, stroke: { color: '#ffffff', width: 1, opacity: 1, style: 'solid' } };
                })}
              />
              <span />
            </label>
          </div>
          {canvas.stroke ? (
            <>
              <div className="apx-canvas-color-row">
                <input type="color" value={canvas.stroke.color ?? '#ffffff'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, color: event.target.value } }))} />
                <input className="apx-pre4-input" value={canvas.stroke.color ?? '#ffffff'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, color: event.target.value } }))} />
              </div>
              <div className="apx-pre4-property-grid">
                <label><span>Width</span><input className="apx-pre4-input" type="number" min={0} value={canvas.stroke.width ?? 1} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, width: Number(event.target.value) } }))} /></label>
                <label><span>Blur</span><input className="apx-pre4-input" type="number" min={0} value={canvas.stroke.blur ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, blur: Number(event.target.value) } }))} /></label>
                <label><span>Position</span><input className="apx-pre4-input" type="number" value={canvas.stroke.position ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, position: Number(event.target.value) } }))} /></label>
                <label><span>Style</span><select className="apx-pre4-input" value={canvas.stroke.style ?? 'solid'} onChange={(event) => mutateCanvas('Stroke style', (current) => ({ ...current, stroke: { ...current.stroke, style: event.target.value as NonNullable<VisualCanvasConfig['stroke']>['style'] } }))}>{['solid','dashed','dotted','groove','ridge','double'].map((value) => <option key={value}>{value}</option>)}</select></label>
              </div>
              <label className="apx-canvas-field"><span>Stroke opacity</span><input className="apx-pre4-range" type="range" min={0} max={1} step={0.01} value={canvas.stroke.opacity ?? 1} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, opacity: Number(event.target.value) } }))} /></label>
            </>
          ) : null}
        </div>

        <div className="apx-pre4-section" data-canvas-section="shadow">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Shadow</div>
            <label className="apx-canvas-switch">
              <input
                type="checkbox"
                checked={Boolean(canvas.shadow)}
                onChange={(event) => mutateCanvas('Canvas shadow', (current) => {
                  if (!event.target.checked) {
                    const next = { ...current };
                    delete next.shadow;
                    return next;
                  }
                  return { ...current, shadow: { color: '#000000', offsetX: 0, offsetY: 12, blur: 28, opacity: 0.35 } };
                })}
              />
              <span />
            </label>
          </div>
          {canvas.shadow ? (
            <>
              <div className="apx-canvas-color-row">
                <input type="color" value={canvas.shadow.color ?? '#000000'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, shadow: { ...current.shadow, color: event.target.value } }))} />
                <input className="apx-pre4-input" value={canvas.shadow.color ?? '#000000'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, shadow: { ...current.shadow, color: event.target.value } }))} />
              </div>
              <div className="apx-pre4-property-grid">
                <label><span>X</span><input className="apx-pre4-input" type="number" value={canvas.shadow.offsetX ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, shadow: { ...current.shadow, offsetX: Number(event.target.value) } }))} /></label>
                <label><span>Y</span><input className="apx-pre4-input" type="number" value={canvas.shadow.offsetY ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, shadow: { ...current.shadow, offsetY: Number(event.target.value) } }))} /></label>
                <label><span>Blur</span><input className="apx-pre4-input" type="number" min={0} value={canvas.shadow.blur ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, shadow: { ...current.shadow, blur: Number(event.target.value) } }))} /></label>
                <label><span>Opacity</span><input className="apx-pre4-input" type="number" min={0} max={1} step={0.05} value={canvas.shadow.opacity ?? 1} onChange={(event) => updateCanvasDraft((current) => ({ ...current, shadow: { ...current.shadow, opacity: Number(event.target.value) } }))} /></label>
              </div>
            </>
          ) : null}
        </div>
      </>
    );
  };

  const renderCanvasTransform = () => {
    const canvas = project.document.canvas ?? {};
    return (
      <>
        {renderCanvasHeader()}
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Dimensions</div>
          <div className="apx-pre4-property-grid">
            {(['width', 'height'] as const).map((key) => (
              <label key={key}>
                <span>{key === 'width' ? 'W' : 'H'}</span>
                <input
                  className="apx-pre4-input"
                  type="number"
                  min={1}
                  max={16384}
                  data-canvas-dimension={key}
                  value={project.document[key]}
                  onFocus={beginPropertyEdit}
                  onChange={(event) => {
                    const value = Math.max(1, Math.min(16384, Number(event.target.value) || 1));
                    setProject((current) => ({ ...current, updatedAt: new Date().toISOString(), document: { ...current.document, [key]: value } }));
                  }}
                  onBlur={() => endPropertyEdit('Resize canvas')}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Placement</div>
          <div className="apx-pre4-property-grid">
            {(['x','y','rotation'] as const).map((key) => (
              <label key={key}>
                <span>{key === 'rotation' ? 'Rot' : key.toUpperCase()}</span>
                <input className="apx-pre4-input" type="number" value={canvas[key] ?? 0} onFocus={beginPropertyEdit} onChange={(event) => updateCanvasDraft((current) => ({ ...current, [key]: Number(event.target.value) }))} onBlur={() => endPropertyEdit('Canvas ' + key)} />
              </label>
            ))}
          </div>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Internal zoom</div>
          <div className="apx-pre4-property-grid">
            <label><span>Scale</span><input className="apx-pre4-input" type="number" min={0.01} step={0.05} value={canvas.zoom?.scale ?? 1} onChange={(event) => updateCanvasDraft((current) => ({ ...current, zoom: { ...current.zoom, scale: Number(event.target.value) } }))} /></label>
            <label><span>CX</span><input className="apx-pre4-input" type="number" value={canvas.zoom?.centerX ?? project.document.width / 2} onChange={(event) => updateCanvasDraft((current) => ({ ...current, zoom: { ...current.zoom, centerX: Number(event.target.value) } }))} /></label>
            <label><span>CY</span><input className="apx-pre4-input" type="number" value={canvas.zoom?.centerY ?? project.document.height / 2} onChange={(event) => updateCanvasDraft((current) => ({ ...current, zoom: { ...current.zoom, centerY: Number(event.target.value) } }))} /></label>
          </div>
        </div>
        <div className="apx-live-sync-note"><strong>Live Code Sync</strong><span>Dimensions, placement, rotation and internal zoom generate directly into createCanvas() and reconcile back from canonical code.</span></div>
      </>
    );
  };

  const renderCanvasEffects = () => {
    const canvas = project.document.canvas ?? {};
    const pattern = canvas.patternBg ?? defaultCanvasPattern();
    return (
      <>
        {renderCanvasHeader()}
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Surface effects</div>
          <div className="apx-pre4-property-grid">
            <label><span>Blur</span><input className="apx-pre4-input" type="number" min={0} value={canvas.blur ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, blur: Math.max(0, Number(event.target.value)) }))} /></label>
            <label><span>Blend</span><select className="apx-pre4-input" value={canvas.blendMode ?? 'source-over'} onChange={(event) => mutateCanvas('Canvas blend', (current) => ({ ...current, blendMode: event.target.value as VisualBlendMode }))}>{CANVAS_BLEND_MODES.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
        </div>

        <div className="apx-pre4-section" data-canvas-section="pattern">
          <div className="apx-canvas-section-heading"><div className="apx-pre4-section-title">Pattern</div><label className="apx-canvas-switch"><input type="checkbox" checked={Boolean(canvas.patternBg)} onChange={(event) => mutateCanvas('Canvas pattern', (current) => { if (!event.target.checked) { const next = { ...current }; delete next.patternBg; return next; } return { ...current, patternBg: defaultCanvasPattern() }; })}/><span /></label></div>
          {canvas.patternBg ? (
            <>
              <label className="apx-canvas-field"><span>Pattern type</span><select className="apx-pre4-input" value={pattern.type} onChange={(event) => mutateCanvas('Pattern type', (current) => ({ ...current, patternBg: { ...(current.patternBg ?? pattern), type: event.target.value as VisualPatternOptions['type'] } }))}>{CANVAS_PATTERN_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
              <div className="apx-canvas-color-row"><input type="color" value={pattern.color ?? '#315078'} onChange={(event) => updatePattern({ color: event.target.value })}/><input className="apx-pre4-input" value={pattern.color ?? '#315078'} onChange={(event) => updatePattern({ color: event.target.value })}/></div>
              <div className="apx-canvas-color-row"><input type="color" value={pattern.secondaryColor ?? '#152943'} onChange={(event) => updatePattern({ secondaryColor: event.target.value })}/><input className="apx-pre4-input" value={pattern.secondaryColor ?? '#152943'} onChange={(event) => updatePattern({ secondaryColor: event.target.value })}/></div>
              <div className="apx-pre4-property-grid">
                {(['size','spacing','rotation','scale','offsetX','offsetY'] as const).map((key) => <label key={key}><span>{key}</span><input className="apx-pre4-input" type="number" step={key === 'scale' ? 0.1 : 1} value={pattern[key] ?? (key === 'scale' ? 1 : 0)} onChange={(event) => updatePattern({ [key]: Number(event.target.value) })}/></label>)}
              </div>
              <label className="apx-canvas-field"><span>Pattern opacity</span><input className="apx-pre4-range" type="range" min={0} max={1} step={0.01} value={pattern.opacity ?? 1} onChange={(event) => updatePattern({ opacity: Number(event.target.value) })}/></label>
              {pattern.type === 'custom' ? <label className="apx-canvas-field"><span>Custom image</span><input className="apx-pre4-input" value={pattern.customPatternImage ?? ''} onChange={(event) => updatePattern({ customPatternImage: event.target.value })}/></label> : null}
            </>
          ) : null}
        </div>

        <div className="apx-pre4-section" data-canvas-section="noise">
          <div className="apx-canvas-section-heading"><div className="apx-pre4-section-title">Noise</div><label className="apx-canvas-switch"><input type="checkbox" checked={Boolean(canvas.noiseBg)} onChange={(event) => mutateCanvas('Canvas noise', (current) => { if (!event.target.checked) { const next = { ...current }; delete next.noiseBg; return next; } return { ...current, noiseBg: { intensity: 0.04 } }; })}/><span /></label></div>
          {canvas.noiseBg ? <label className="apx-canvas-field"><span>Intensity · {Math.round((canvas.noiseBg.intensity ?? 0.04) * 100)}%</span><input className="apx-pre4-range" type="range" min={0} max={1} step={0.01} value={canvas.noiseBg.intensity ?? 0.04} onChange={(event) => updateCanvasDraft((current) => ({ ...current, noiseBg: { intensity: Number(event.target.value) } }))}/></label> : null}
        </div>

        <div className="apx-pre4-section" data-canvas-section="background-layers">
          <div className="apx-canvas-section-heading"><div className="apx-pre4-section-title">Background layers</div><button className="apx-canvas-mini-button" type="button" onClick={() => mutateCanvas('Add background layer', (current) => ({ ...current, bgLayers: [...(current.bgLayers ?? []), defaultBackgroundLayer('color')] }))}>＋ Layer</button></div>
          <div className="apx-canvas-layer-stack">
            {(canvas.bgLayers ?? []).map((layer, index) => (
              <div className="apx-canvas-layer-card" key={index}>
                <div className="apx-canvas-layer-head">
                  <select className="apx-pre4-input" value={layer.type} onChange={(event) => updateBackgroundLayer(index, () => defaultBackgroundLayer(event.target.value as VisualBackgroundLayer['type']))}>
                    {['color','gradient','image','pattern','presetPattern','noise'].map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <button type="button" onClick={() => mutateCanvas('Remove background layer', (current) => ({ ...current, bgLayers: (current.bgLayers ?? []).filter((_, layerIndex) => layerIndex !== index) }))}>×</button>
                </div>
                {'opacity' in layer ? <label className="apx-canvas-field"><span>Opacity</span><input className="apx-pre4-range" type="range" min={0} max={1} step={0.01} value={layer.opacity ?? 1} onChange={(event) => updateBackgroundLayer(index, (current) => ({ ...current, opacity: Number(event.target.value) }))}/></label> : null}
                {layer.type === 'color' ? <div className="apx-canvas-color-row"><input type="color" value={layer.value} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'color' ? { ...current, value: event.target.value } : current)}/><input className="apx-pre4-input" value={layer.value} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'color' ? { ...current, value: event.target.value } : current)}/></div> : null}
                {layer.type === 'gradient' ? <div className="apx-canvas-color-row"><input type="color" value={layer.value.colors[0]?.color ?? '#000000'} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'gradient' ? { ...current, value: { ...current.value, colors: current.value.colors.map((stop, stopIndex) => stopIndex === 0 ? { ...stop, color: event.target.value } : stop) } as VisualGradient } : current)}/><span>Gradient layer</span></div> : null}
                {layer.type === 'image' ? <><input className="apx-pre4-input" placeholder="Image source" value={layer.source} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'image' ? { ...current, source: event.target.value } : current)}/><div className="apx-pre4-property-grid"><label><span>Fit</span><select className="apx-pre4-input" value={layer.fit ?? 'cover'} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'image' ? { ...current, fit: event.target.value as 'fill' | 'contain' | 'cover' } : current)}>{CANVAS_FITS.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Align</span><select className="apx-pre4-input" value={layer.align ?? 'center'} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'image' ? { ...current, align: event.target.value as NonNullable<typeof current.align> } : current)}>{CANVAS_ALIGNMENTS.map((value) => <option key={value}>{value}</option>)}</select></label></div></> : null}
                {layer.type === 'pattern' ? <><input className="apx-pre4-input" placeholder="Pattern image source" value={layer.source} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'pattern' ? { ...current, source: event.target.value } : current)}/><select className="apx-pre4-input" value={layer.repeat ?? 'repeat'} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'pattern' ? { ...current, repeat: event.target.value as NonNullable<typeof current.repeat> } : current)}>{['repeat','repeat-x','repeat-y','no-repeat'].map((value) => <option key={value}>{value}</option>)}</select></> : null}
                {layer.type === 'presetPattern' ? <><select className="apx-pre4-input" value={layer.pattern.type} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'presetPattern' ? { ...current, pattern: { ...current.pattern, type: event.target.value as VisualPatternOptions['type'] } } : current)}>{CANVAS_PATTERN_TYPES.map((value) => <option key={value}>{value}</option>)}</select><div className="apx-canvas-color-row"><input type="color" value={layer.pattern.color ?? '#315078'} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'presetPattern' ? { ...current, pattern: { ...current.pattern, color: event.target.value } } : current)}/><input className="apx-pre4-input" value={layer.pattern.color ?? '#315078'} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'presetPattern' ? { ...current, pattern: { ...current.pattern, color: event.target.value } } : current)}/></div></> : null}
                {layer.type === 'noise' ? <label className="apx-canvas-field"><span>Intensity</span><input className="apx-pre4-range" type="range" min={0} max={1} step={0.01} value={layer.intensity ?? 0.04} onChange={(event) => updateBackgroundLayer(index, (current) => current.type === 'noise' ? { ...current, intensity: Number(event.target.value) } : current)}/></label> : null}
                {'blendMode' in layer ? <select className="apx-pre4-input" value={layer.blendMode ?? 'source-over'} onChange={(event) => updateBackgroundLayer(index, (current) => ({ ...current, blendMode: event.target.value as VisualBlendMode }))}>{CANVAS_BLEND_MODES.map((value) => <option key={value}>{value}</option>)}</select> : null}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderCanvasAdvanced = () => {
    const canvas = project.document.canvas ?? {};
    const customBg = canvas.customBg;
    return (
      <>
        {renderCanvasHeader()}
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Clipping / border placement</div>
          <label className="apx-canvas-field"><span>Border position</span><input className="apx-pre4-input" value={canvas.borderPosition ?? 'all'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, borderPosition: event.target.value }))}/></label>
        </div>

        {customBg ? (
          <div className="apx-pre4-section">
            <div className="apx-pre4-section-title">Background image filters</div>
            <textarea className="apx-canvas-json" spellCheck={false} value={canvasFiltersDraft} onChange={(event) => { setCanvasFiltersDraft(event.target.value); setCanvasFiltersError(null); }} />
            {canvasFiltersError ? <div className="apx-live-code-error">{canvasFiltersError}</div> : null}
            <button className="apx-canvas-apply" type="button" onClick={() => {
              try {
                const filters = parseFilterJson(canvasFiltersDraft);
                mutateCanvas('Background filters', (current) => ({ ...current, customBg: { ...(current.customBg ?? customBg), filters } }));
                setCanvasFiltersError(null);
              } catch (error) {
                setCanvasFiltersError(error instanceof Error ? error.message : 'Invalid filters JSON.');
              }
            }}>Apply filter JSON</button>
            <small className="apx-canvas-hint">Advanced ImageFilter[] stays literal and round-trippable in generated code.</small>
          </div>
        ) : null}

        <div className="apx-pre4-section" data-canvas-section="complete-config">
          <div className="apx-pre4-section-title">Complete CanvasConfig</div>
          <textarea
            className="apx-canvas-json apx-canvas-json--config"
            spellCheck={false}
            value={canvasConfigDraft}
            onChange={(event) => {
              setCanvasConfigDraft(event.target.value);
              setCanvasConfigError(null);
            }}
          />
          {canvasConfigError ? <div className="apx-live-code-error">{canvasConfigError}</div> : null}
          <button
            className="apx-canvas-apply"
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(canvasConfigDraft);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                  throw new Error('CanvasConfig JSON must be an object.');
                }
                const nextProject = structuredClone(project);
                nextProject.document.canvas = parsed as VisualCanvasConfig;
                nextProject.updatedAt = new Date().toISOString();
                const validation = validateVisualProject(nextProject);
                if (!validation.ok) {
                  throw new Error(validation.issues[0]?.message ?? 'Invalid CanvasConfig.');
                }
                history.current.commit(project, nextProject, 'Advanced CanvasConfig');
                projectRef.current = nextProject;
                setProject(nextProject);
                setHistoryTick((value) => value + 1);
                setCanvasConfigError(null);
                setMessage('Complete CanvasConfig applied');
              } catch (error) {
                setCanvasConfigError(error instanceof Error ? error.message : 'Invalid CanvasConfig JSON.');
              }
            }}
          >
            Apply complete CanvasConfig
          </button>
          <small className="apx-canvas-hint">
            Exact declaration-level escape hatch for gradient geometry, stroke/shadow gradients,
            pattern gradient/repeat/blend details, background-layer variants and future-compatible
            literal CanvasConfig fields. Validated before it reaches the Visual Project.
          </small>
        </div>

        <div className="apx-pre4-section">
          <div className="apx-canvas-section-heading"><div className="apx-pre4-section-title">Video background</div><label className="apx-canvas-switch"><input type="checkbox" checked={Boolean(canvas.videoBg)} onChange={(event) => mutateCanvas('Video background', (current) => { if (!event.target.checked) { const next = { ...current }; delete next.videoBg; return next; } return { ...current, videoBg: { source: '', frame: 0, loop: false, autoplay: false, opacity: 1, format: 'jpg', quality: 90 } }; })}/><span /></label></div>
          {canvas.videoBg ? (
            <div className="apx-canvas-stack">
              <input className="apx-pre4-input" placeholder="Video source" value={canvas.videoBg.source} onChange={(event) => updateCanvasDraft((current) => ({ ...current, videoBg: { ...current.videoBg!, source: event.target.value } }))}/>
              <div className="apx-pre4-property-grid">
                <label><span>Frame</span><input className="apx-pre4-input" type="number" min={0} value={canvas.videoBg.frame ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, videoBg: { ...current.videoBg!, frame: Number(event.target.value) } }))}/></label>
                <label><span>Time</span><input className="apx-pre4-input" type="number" min={0} step={0.1} value={canvas.videoBg.time ?? 0} onChange={(event) => updateCanvasDraft((current) => ({ ...current, videoBg: { ...current.videoBg!, time: Number(event.target.value) } }))}/></label>
                <label><span>Format</span><select className="apx-pre4-input" value={canvas.videoBg.format ?? 'jpg'} onChange={(event) => mutateCanvas('Video format', (current) => ({ ...current, videoBg: { ...current.videoBg!, format: event.target.value as 'jpg' | 'png' } }))}><option>jpg</option><option>png</option></select></label>
                <label><span>Quality</span><input className="apx-pre4-input" type="number" min={1} max={100} value={canvas.videoBg.quality ?? 90} onChange={(event) => updateCanvasDraft((current) => ({ ...current, videoBg: { ...current.videoBg!, quality: Number(event.target.value) } }))}/></label>
              </div>
              <div className="apx-canvas-check-row"><label className="apx-canvas-check"><input type="checkbox" checked={canvas.videoBg.loop ?? false} onChange={(event) => mutateCanvas('Video loop', (current) => ({ ...current, videoBg: { ...current.videoBg!, loop: event.target.checked } }))}/><span>Loop</span></label><label className="apx-canvas-check"><input type="checkbox" checked={canvas.videoBg.autoplay ?? false} onChange={(event) => mutateCanvas('Video autoplay', (current) => ({ ...current, videoBg: { ...current.videoBg!, autoplay: event.target.checked } }))}/><span>Autoplay</span></label></div>
              <label className="apx-canvas-field"><span>Opacity</span><input className="apx-pre4-range" type="range" min={0} max={1} step={0.01} value={canvas.videoBg.opacity ?? 1} onChange={(event) => updateCanvasDraft((current) => ({ ...current, videoBg: { ...current.videoBg!, opacity: Number(event.target.value) } }))}/></label>
              <div className="apx-canvas-runtime-note"><strong>Node renderer capability</strong><span>Video frame extraction is part of Apexify CanvasConfig but is not executed by the current browser Preview runtime. Generated code remains exact and linked.</span></div>
            </div>
          ) : null}
        </div>

        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Stroke / shadow advanced geometry</div>
          <label className="apx-canvas-field"><span>Stroke border position</span><input className="apx-pre4-input" disabled={!canvas.stroke} value={canvas.stroke?.borderPosition ?? 'all'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, borderPosition: event.target.value } }))}/></label>
          <label className="apx-canvas-field"><span>Stroke rounded corners</span><input className="apx-pre4-input" disabled={!canvas.stroke} value={canvas.stroke?.roundedCorners ?? 'all'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, stroke: { ...current.stroke, roundedCorners: event.target.value } }))}/></label>
          <label className="apx-canvas-field"><span>Shadow rounded corners</span><input className="apx-pre4-input" disabled={!canvas.shadow} value={canvas.shadow?.roundedCorners ?? 'all'} onChange={(event) => updateCanvasDraft((current) => ({ ...current, shadow: { ...current.shadow, roundedCorners: event.target.value } }))}/></label>
        </div>
      </>
    );
  };

  const renderCanvasInspector = () => {
    if (inspectorTab === 'style') return renderCanvasStyle();
    if (inspectorTab === 'transform') return renderCanvasTransform();
    if (inspectorTab === 'effects') return renderCanvasEffects();
    if (inspectorTab === 'advanced') return renderCanvasAdvanced();
    return (
      <>
        {renderCanvasHeader()}
        <div className="apx-pre4-empty"><strong>Canvas data</strong><span>Canvas has no external data binding. Data controls activate for authoring domains that own data.</span></div>
      </>
    );
  };

  const renderMediaHeader = () => {
    if (!primaryMedia) return null;
    return (
      <div className="apx-pre4-inspector-title">
        <div>
          <strong>{primaryMedia.name ?? primaryMedia.kind}</strong>
          <small>{primaryMedia.kind === 'shape' ? 'Apexify built-in shape · Phase 5' : 'Apexify image layer · Phase 5 + 10'}</small>
        </div>
        <span className="apx-pre4-type-pill">{primaryMedia.kind}</span>
      </div>
    );
  };

  const renderMediaStyle = () => {
    if (!primaryMedia) return renderTransformFields();
    const props = visualImageProps(primaryMedia);
    const isShape = primaryMedia.kind === 'shape';
    const shape = props.shape ?? {};
    return (
      <>
        {renderMediaHeader()}
        <div className="apx-pre4-property">
          <label>Name</label>
          <input
            className="apx-pre4-input"
            value={primaryMedia.name ?? primaryMedia.kind}
            onFocus={beginPropertyEdit}
            onChange={(event) => setProject((current) => renameNode(current, primaryMedia.id, event.target.value))}
            onBlur={() => endPropertyEdit('Rename media')}
          />
        </div>

        {isShape ? (
          <div className="apx-pre4-section" data-image-section="shape">
            <div className="apx-pre4-section-title">Shape</div>
            <label className="apx-canvas-field">
              <span>Built-in source</span>
              <select
                className="apx-pre4-input"
                value={typeof props.source === 'string' ? props.source : 'rectangle'}
                onChange={(event) => {
                  const nextShape = event.target.value as VisualShapeType;
                  mutateImage('Shape type', (current) => ({
                    ...current,
                    source: nextShape,
                    shape: defaultShapeNodeProps(nextShape).shape,
                  }));
                }}
              >
                {IMAGE_SHAPE_TYPES.map((shapeType) => <option key={shapeType} value={shapeType}>{shapeType}</option>)}
              </select>
            </label>
            <label className="apx-canvas-check">
              <input
                type="checkbox"
                checked={shape.fill ?? true}
                onChange={(event) => mutateImage('Shape fill', (current) => ({
                  ...current,
                  shape: { ...(current.shape ?? {}), fill: event.target.checked },
                }))}
              />
              <span>Fill shape</span>
            </label>
            <div className="apx-canvas-color-row">
              <input
                type="color"
                value={shape.color ?? '#6f86ff'}
                onChange={(event) => updateImageDraft((current) => ({
                  ...current,
                  shape: { ...(current.shape ?? {}), color: event.target.value },
                }))}
              />
              <input
                className="apx-pre4-input"
                value={shape.color ?? '#6f86ff'}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateImageDraft((current) => ({
                  ...current,
                  shape: { ...(current.shape ?? {}), color: event.target.value },
                }))}
                onBlur={() => endPropertyEdit('Shape color')}
              />
            </div>
            {typeof props.source === 'string' && ['star','polygon','arc','pieSlice'].includes(props.source) ? (
              <div className="apx-pre4-property-grid">
                {props.source === 'polygon' ? (
                  <label><span>Sides</span><input className="apx-pre4-input" type="number" min={3} value={shape.sides ?? 6} onChange={(event) => updateImageDraft((current) => ({ ...current, shape: { ...(current.shape ?? {}), sides: Number(event.target.value) } }))}/></label>
                ) : null}
                {props.source === 'star' || props.source === 'arc' || props.source === 'pieSlice' ? (
                  <>
                    <label><span>Inner R</span><input className="apx-pre4-input" type="number" min={0} value={shape.innerRadius ?? 0} onChange={(event) => updateImageDraft((current) => ({ ...current, shape: { ...(current.shape ?? {}), innerRadius: Number(event.target.value) } }))}/></label>
                    <label><span>Outer R</span><input className="apx-pre4-input" type="number" min={0} value={shape.outerRadius ?? shape.radius ?? 72} onChange={(event) => updateImageDraft((current) => ({ ...current, shape: { ...(current.shape ?? {}), outerRadius: Number(event.target.value) } }))}/></label>
                  </>
                ) : null}
                {props.source === 'arc' || props.source === 'pieSlice' ? (
                  <>
                    <label><span>Start</span><input className="apx-pre4-input" type="number" step={0.1} value={shape.startAngle ?? 0} onChange={(event) => updateImageDraft((current) => ({ ...current, shape: { ...(current.shape ?? {}), startAngle: Number(event.target.value) } }))}/></label>
                    <label><span>End</span><input className="apx-pre4-input" type="number" step={0.1} value={shape.endAngle ?? Math.PI * 2} onChange={(event) => updateImageDraft((current) => ({ ...current, shape: { ...(current.shape ?? {}), endAngle: Number(event.target.value) } }))}/></label>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="apx-pre4-section" data-image-section="layout">
            <div className="apx-pre4-section-title">Image layout</div>
            <div className="apx-pre4-property-grid">
              <label>
                <span>Fit</span>
                <select className="apx-pre4-input" value={props.fit ?? 'cover'} onChange={(event) => mutateImage('Image fit', (current) => ({ ...current, fit: event.target.value as VisualImageNodeProps['fit'] }))}>
                  {IMAGE_FITS.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>Align</span>
                <select className="apx-pre4-input" value={props.align ?? 'center'} onChange={(event) => mutateImage('Image align', (current) => ({ ...current, align: event.target.value as VisualImageNodeProps['align'] }))}>
                  {IMAGE_ALIGNS.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <label className="apx-canvas-check">
              <input type="checkbox" checked={props.inherit ?? false} onChange={(event) => mutateImage('Image inherit', (current) => ({ ...current, inherit: event.target.checked }))}/>
              <span>Inherit source dimensions</span>
            </label>
          </div>
        )}

        <div className="apx-pre4-section" data-image-section="appearance">
          <div className="apx-pre4-section-title">Appearance</div>
          <div className="apx-pre4-property-grid">
            <label>
              <span>Radius</span>
              <input
                className="apx-pre4-input"
                type="number"
                min={0}
                disabled={props.borderRadius === 'circular'}
                value={typeof props.borderRadius === 'number' ? props.borderRadius : 0}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateImageDraft((current) => ({ ...current, borderRadius: Math.max(0, Number(event.target.value)) }))}
                onBlur={() => endPropertyEdit('Media radius')}
              />
            </label>
            <label className="apx-canvas-check">
              <input type="checkbox" checked={props.borderRadius === 'circular'} onChange={(event) => mutateImage('Circular media', (current) => ({ ...current, borderRadius: event.target.checked ? 'circular' : 0 }))}/>
              <span>Circular</span>
            </label>
          </div>
        </div>

        <div className="apx-pre4-section" data-image-section="stroke">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Stroke</div>
            <label className="apx-canvas-switch">
              <input type="checkbox" checked={Boolean(props.stroke)} onChange={(event) => mutateImage('Media stroke', (current) => {
                if (!event.target.checked) {
                  const next = { ...current };
                  delete next.stroke;
                  return next;
                }
                return { ...current, stroke: { color: '#ffffff', width: 2, opacity: 1, style: 'solid' } };
              })}/>
              <span />
            </label>
          </div>
          {props.stroke ? (
            <>
              <div className="apx-canvas-color-row">
                <input type="color" value={props.stroke.color ?? '#ffffff'} onChange={(event) => updateImageDraft((current) => ({ ...current, stroke: { ...current.stroke, color: event.target.value } }))}/>
                <input className="apx-pre4-input" value={props.stroke.color ?? '#ffffff'} onChange={(event) => updateImageDraft((current) => ({ ...current, stroke: { ...current.stroke, color: event.target.value } }))}/>
              </div>
              <div className="apx-pre4-property-grid">
                <label><span>Width</span><input className="apx-pre4-input" type="number" min={0} value={props.stroke.width ?? 2} onChange={(event) => updateImageDraft((current) => ({ ...current, stroke: { ...current.stroke, width: Number(event.target.value) } }))}/></label>
                <label><span>Style</span><select className="apx-pre4-input" value={props.stroke.style ?? 'solid'} onChange={(event) => mutateImage('Stroke style', (current) => ({ ...current, stroke: { ...current.stroke, style: event.target.value as NonNullable<VisualImageNodeProps['stroke']>['style'] } }))}>{['solid','dashed','dotted','groove','ridge','double'].map((value) => <option key={value}>{value}</option>)}</select></label>
              </div>
            </>
          ) : null}
        </div>

        <div className="apx-pre4-section" data-image-section="box-background">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Box background</div>
            <label className="apx-canvas-switch">
              <input type="checkbox" checked={Boolean(props.boxBackground)} onChange={(event) => mutateImage('Box background', (current) => {
                if (!event.target.checked) {
                  const next = { ...current };
                  delete next.boxBackground;
                  return next;
                }
                return { ...current, boxBackground: { color: '#0b1730' } };
              })}/>
              <span />
            </label>
          </div>
          {props.boxBackground ? (
            <div className="apx-canvas-color-row">
              <input type="color" value={props.boxBackground.color ?? '#0b1730'} onChange={(event) => updateImageDraft((current) => ({ ...current, boxBackground: { ...current.boxBackground, color: event.target.value } }))}/>
              <input className="apx-pre4-input" value={props.boxBackground.color ?? '#0b1730'} onChange={(event) => updateImageDraft((current) => ({ ...current, boxBackground: { ...current.boxBackground, color: event.target.value } }))}/>
            </div>
          ) : null}
        </div>
      </>
    );
  };

  const renderMediaEffects = () => {
    if (!primaryMedia) return renderTransformFields();
    const props = visualImageProps(primaryMedia);
    return (
      <>
        {renderMediaHeader()}
        <div className="apx-pre4-section" data-image-section="effects">
          <div className="apx-pre4-section-title">Layer effects</div>
          <div className="apx-pre4-property-grid">
            <label><span>Blur</span><input className="apx-pre4-input" type="number" min={0} value={props.blur ?? 0} onChange={(event) => updateImageDraft((current) => ({ ...current, blur: Math.max(0, Number(event.target.value)) }))}/></label>
            <label><span>Blend</span><select className="apx-pre4-input" value={props.blendMode ?? 'source-over'} onChange={(event) => mutateImage('Image blend', (current) => ({ ...current, blendMode: event.target.value as VisualBlendMode }))}>{IMAGE_BLEND_MODES.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
        </div>

        <div className="apx-pre4-section" data-image-section="filters">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Filters</div>
            <button className="apx-canvas-mini-button" type="button" onClick={() => mutateImage('Add image filter', (current) => ({ ...current, filters: [...(current.filters ?? []), { type: 'brightness', value: 1 }] }))}>＋ Filter</button>
          </div>
          <div className="apx-image-filter-stack">
            {(props.filters ?? []).map((filter, index) => (
              <div key={index} className="apx-image-filter-row">
                <select className="apx-pre4-input" value={filter.type} onChange={(event) => updateImageDraft((current) => ({
                  ...current,
                  filters: (current.filters ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as VisualImageFilter['type'] } : item),
                }))}>
                  {IMAGE_FILTER_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
                <input className="apx-pre4-input" type="number" step={0.1} value={filter.value ?? filter.intensity ?? 1} onChange={(event) => updateImageDraft((current) => ({
                  ...current,
                  filters: (current.filters ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, value: Number(event.target.value) } : item),
                }))}/>
                <button type="button" onClick={() => mutateImage('Remove image filter', (current) => ({ ...current, filters: (current.filters ?? []).filter((_, itemIndex) => itemIndex !== index) }))}>×</button>
              </div>
            ))}
          </div>
          <div className="apx-pre4-property-grid">
            <label><span>Intensity</span><input className="apx-pre4-input" type="number" step={0.1} value={props.filterIntensity ?? 1} onChange={(event) => updateImageDraft((current) => ({ ...current, filterIntensity: Number(event.target.value) }))}/></label>
            <label><span>Order</span><select className="apx-pre4-input" value={props.filterOrder ?? 'post'} onChange={(event) => mutateImage('Filter order', (current) => ({ ...current, filterOrder: event.target.value as 'pre' | 'post' }))}><option value="pre">pre</option><option value="post">post</option></select></label>
          </div>
        </div>

        <div className="apx-pre4-section" data-image-section="shadow">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Shadow</div>
            <label className="apx-canvas-switch">
              <input type="checkbox" checked={Boolean(props.shadow)} onChange={(event) => mutateImage('Image shadow', (current) => {
                if (!event.target.checked) {
                  const next = { ...current };
                  delete next.shadow;
                  return next;
                }
                return { ...current, shadow: { color: '#000000', offsetX: 0, offsetY: 10, blur: 24, opacity: 0.35 } };
              })}/>
              <span />
            </label>
          </div>
          {props.shadow ? (
            <>
              <div className="apx-canvas-color-row">
                <input type="color" value={props.shadow.color ?? '#000000'} onChange={(event) => updateImageDraft((current) => ({ ...current, shadow: { ...current.shadow, color: event.target.value } }))}/>
                <input className="apx-pre4-input" value={props.shadow.color ?? '#000000'} onChange={(event) => updateImageDraft((current) => ({ ...current, shadow: { ...current.shadow, color: event.target.value } }))}/>
              </div>
              <div className="apx-pre4-property-grid">
                <label><span>X</span><input className="apx-pre4-input" type="number" value={props.shadow.offsetX ?? 0} onChange={(event) => updateImageDraft((current) => ({ ...current, shadow: { ...current.shadow, offsetX: Number(event.target.value) } }))}/></label>
                <label><span>Y</span><input className="apx-pre4-input" type="number" value={props.shadow.offsetY ?? 10} onChange={(event) => updateImageDraft((current) => ({ ...current, shadow: { ...current.shadow, offsetY: Number(event.target.value) } }))}/></label>
                <label><span>Blur</span><input className="apx-pre4-input" type="number" min={0} value={props.shadow.blur ?? 24} onChange={(event) => updateImageDraft((current) => ({ ...current, shadow: { ...current.shadow, blur: Number(event.target.value) } }))}/></label>
                <label><span>Opacity</span><input className="apx-pre4-input" type="number" min={0} max={1} step={0.05} value={props.shadow.opacity ?? .35} onChange={(event) => updateImageDraft((current) => ({ ...current, shadow: { ...current.shadow, opacity: Number(event.target.value) } }))}/></label>
              </div>
            </>
          ) : null}
        </div>

        {primaryMedia.kind === 'image' ? (
          <VisualImageUtilityAuthoring
            value={props}
            mode="effects"
            onChange={(next, label) => mutateImage(label, () => next)}
          />
        ) : null}

        <div className="apx-pre4-section" data-image-section="mask">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Mask</div>
            <label className="apx-canvas-switch">
              <input type="checkbox" checked={Boolean(props.mask)} onChange={(event) => mutateImage('Image mask', (current) => {
                if (!event.target.checked) {
                  const next = { ...current };
                  delete next.mask;
                  return next;
                }
                return { ...current, mask: { source: '', mode: 'alpha' } };
              })}/>
              <span />
            </label>
          </div>
          {props.mask ? (
            <>
              <input className="apx-pre4-input" placeholder="Mask source URL or studio://asset/…" value={typeof props.mask.source === 'string' ? props.mask.source : ''} onChange={(event) => updateImageDraft((current) => ({ ...current, mask: { ...current.mask!, source: event.target.value } }))}/>
              <select className="apx-pre4-input" value={props.mask.mode ?? 'alpha'} onChange={(event) => mutateImage('Mask mode', (current) => ({ ...current, mask: { ...current.mask!, mode: event.target.value as NonNullable<VisualImageNodeProps['mask']>['mode'] } }))}><option value="alpha">alpha</option><option value="luminance">luminance</option><option value="inverse">inverse</option></select>
            </>
          ) : null}
        </div>
      </>
    );
  };

  const renderMediaData = () => {
    if (!primaryMedia) return renderTransformFields();
    const props = visualImageProps(primaryMedia);
    const source = props.source;
    const sourceString = typeof source === 'string' ? source : '';
    const sourceAssetId = typeof source === 'string' ? studioAssetIdFromReference(source) : null;
    const generatedId =
      typeof source === 'object' &&
      source &&
      '$generated' in source
        ? source.$generated
        : '';
    const primaryLayerIndex = layerIds.indexOf(primaryMedia.id);
    const availableGenerated = layerIds
      .slice(0, Math.max(0, primaryLayerIndex))
      .map((id) => project.document.nodes[id])
      .filter(
        (node): node is VisualNode =>
          Boolean(
            node &&
              (node.kind === 'image' ||
                node.kind === 'shape' ||
                node.kind === 'text'),
          ),
      );
    return (
      <>
        {renderMediaHeader()}
        <div className="apx-pre4-section" data-image-section="source">
          <div className="apx-pre4-section-title">Source</div>
          <label className="apx-canvas-field">
            <span>URL / path / shape source</span>
            <input
              className="apx-pre4-input"
              disabled={primaryMedia.kind === 'shape'}
              value={sourceString}
              placeholder="https://… or studio://asset/…"
              onFocus={beginPropertyEdit}
              onChange={(event) => updateImageDraft((current) => ({ ...current, source: event.target.value }))}
              onBlur={() => endPropertyEdit('Image source')}
            />
          </label>
          {primaryMedia.kind === 'image' ? (
            <>
              <label className="apx-canvas-field">
                <span>Replace with Studio asset</span>
                <select
                  className="apx-pre4-input"
                  value={sourceAssetId ?? ''}
                  onChange={(event) => {
                    const asset = imageAssets.find((item) => item.id === event.target.value);
                    if (asset) mutateImage('Replace image asset', (current) => ({ ...current, source: studioAssetReference(asset) }));
                  }}
                >
                  <option value="">Choose image asset…</option>
                  {imageAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </label>
              <label className="apx-canvas-field">
                <span>Generated-buffer source</span>
                <select
                  className="apx-pre4-input"
                  value={generatedId}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value) mutateImage('Generated buffer source', (current) => ({ ...current, source: { $generated: value } }));
                  }}
                >
                  <option value="">None</option>
                  <option value="document_canvas">Canvas buffer</option>
                  {availableGenerated.map((node) => <option key={node!.id} value={node!.id}>{node!.name ?? node!.kind}</option>)}
                </select>
              </label>
            </>
          ) : null}
        </div>
        <div className="apx-live-sync-note">
          <strong>Stable source identity</strong>
          <span>Studio assets generate as studio://asset/… strings. Generated buffers compile as real earlier output identifiers rather than editor-only placeholders.</span>
        </div>
      </>
    );
  };

  const renderMediaAdvanced = () => {
    if (!primaryMedia) return renderTransformFields();
    return (
      <>
        {renderMediaHeader()}
        {primaryMedia.kind === 'image' ? (
          <VisualImageUtilityAuthoring
            value={visualImageProps(primaryMedia)}
            mode="advanced"
            onChange={(next, label) => mutateImage(label, () => next)}
          />
        ) : null}
        <div className="apx-pre4-section" data-image-section="complete-config">
          <div className="apx-pre4-section-title">Complete ImageProperties / CreateImageOptions</div>
          <textarea
            className="apx-canvas-json apx-canvas-json--config"
            spellCheck={false}
            value={imageConfigDraft}
            onChange={(event) => {
              setImageConfigDraft(event.target.value);
              setImageConfigError(null);
            }}
          />
          {imageConfigError ? <div className="apx-live-code-error">{imageConfigError}</div> : null}
          <button
            className="apx-canvas-apply"
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(imageConfigDraft);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Image properties JSON must be an object.');
                const nextProject = structuredClone(project);
                const node = nextProject.document.nodes[primaryMedia.id];
                node.props = imagePropsRecord(parsed as VisualImageNodeProps);
                nextProject.updatedAt = new Date().toISOString();
                const validation = validateVisualProject(nextProject);
                if (!validation.ok) throw new Error(validation.issues[0]?.message ?? 'Invalid image configuration.');
                history.current.commit(project, nextProject, 'Advanced image config');
                projectRef.current = nextProject;
                setProject(nextProject);
                setHistoryTick((value) => value + 1);
                setImageConfigError(null);
                setMessage('Complete image configuration applied');
              } catch (configError) {
                setImageConfigError(configError instanceof Error ? configError.message : 'Invalid image configuration JSON.');
              }
            }}
          >
            Apply complete image config
          </button>
          <small className="apx-canvas-hint">
            Declaration-level escape hatch for gradient fills, clipPath, distortion, meshWarp, advanced effects, mask buffers, stroke/shadow gradients, boxBackground and CreateImageOptions/groupTransform.
          </small>
        </div>
      </>
    );
  };

  const renderMediaInspector = () => {
    if (inspectorTab === 'transform') return renderTransformFields();
    if (inspectorTab === 'style') return renderMediaStyle();
    if (inspectorTab === 'effects') return renderMediaEffects();
    if (inspectorTab === 'data') return renderMediaData();
    return renderMediaAdvanced();
  };

  const renderTextHeader = () => {
    if (!primaryText) return null;
    return (
      <div className="apx-pre4-inspector-title">
        <div>
          <strong>{primaryText.name ?? 'Text'}</strong>
          <small>Apexify text layer · Phase 6</small>
        </div>
        <span className="apx-pre4-type-pill">text</span>
      </div>
    );
  };

  const renderTextStyle = () => {
    if (!primaryText) return renderTransformFields();
    const props = visualTextProps(primaryText);
    const font = props.font ?? {};
    const decorations = props.decorations ?? {};
    const fill = props.fill ?? {};
    const layout = props.layout ?? {};
    const placement = props.placement ?? {};
    const fontAssetId = font.path ? studioAssetIdFromReference(font.path) : null;

    return (
      <>
        {renderTextHeader()}
        <div className="apx-pre4-section" data-text-section="content">
          <div className="apx-pre4-section-title">Content</div>
          <textarea
            className="apx-text-content"
            value={props.text}
            onFocus={beginPropertyEdit}
            onChange={(event) => updateTextDraft((current) => ({ ...current, text: event.target.value }))}
            onBlur={() => endPropertyEdit('Edit text')}
            data-text-content-editor
          />
        </div>

        <div className="apx-pre4-section" data-text-section="typography">
          <div className="apx-pre4-section-title">Typography</div>
          <label className="apx-canvas-field">
            <span>Font family</span>
            <select
              className="apx-pre4-input"
              value={fontAssetId ? 'asset:' + fontAssetId : (font.name ?? font.family ?? 'Arial')}
              onChange={(event) => {
                const value = event.target.value;
                if (value.startsWith('asset:')) {
                  const asset = fontAssets.find((item) => item.id === value.slice(6));
                  if (asset) applyFontAsset(asset);
                  return;
                }
                mutateText('Font family', (current) => ({
                  ...current,
                  font: {
                    ...(current.font ?? {}),
                    family: value,
                    name: value,
                    path: undefined,
                  },
                }));
              }}
              data-text-font-select
            >
              {systemFontFamilies.map((family) => (
                <option key={family} value={family}>{family}</option>
              ))}
              {fontAssets.map((asset) => (
                <option key={asset.id} value={'asset:' + asset.id}>
                  {studioAssetFontFamily(asset)} · uploaded
                </option>
              ))}
            </select>
          </label>

          <div className="apx-pre4-property-grid">
            <label>
              <span>Size</span>
              <input
                className="apx-pre4-input"
                type="number"
                min={1}
                value={font.size ?? props.fontSize ?? 16}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateTextDraft((current) => ({
                  ...current,
                  font: { ...(current.font ?? {}), size: Math.max(1, Number(event.target.value)) },
                }))}
                onBlur={() => endPropertyEdit('Font size')}
              />
            </label>
            <label>
              <span>Line height</span>
              <input
                className="apx-pre4-input"
                type="number"
                min={0.1}
                step={0.1}
                value={layout.lineHeight ?? props.lineHeight ?? 1.4}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateTextDraft((current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), lineHeight: Number(event.target.value) },
                }))}
                onBlur={() => endPropertyEdit('Line height')}
              />
            </label>
          </div>

          <div className="apx-text-toggle-row">
            <label className="apx-canvas-check">
              <input
                type="checkbox"
                checked={decorations.bold ?? props.bold ?? false}
                onChange={(event) => mutateText('Bold', (current) => ({
                  ...current,
                  decorations: { ...(current.decorations ?? {}), bold: event.target.checked },
                }))}
              />
              <span>Bold</span>
            </label>
            <label className="apx-canvas-check">
              <input
                type="checkbox"
                checked={decorations.italic ?? props.italic ?? false}
                onChange={(event) => mutateText('Italic', (current) => ({
                  ...current,
                  decorations: { ...(current.decorations ?? {}), italic: event.target.checked },
                }))}
              />
              <span>Italic</span>
            </label>
          </div>

          <div className="apx-pre4-property-grid">
            <label>
              <span>Letter</span>
              <input
                className="apx-pre4-input"
                type="number"
                step={0.25}
                value={layout.letterSpacing ?? props.letterSpacing ?? 0}
                onChange={(event) => updateTextDraft((current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), letterSpacing: Number(event.target.value) },
                }))}
              />
            </label>
            <label>
              <span>Word</span>
              <input
                className="apx-pre4-input"
                type="number"
                step={0.25}
                value={layout.wordSpacing ?? props.wordSpacing ?? 0}
                onChange={(event) => updateTextDraft((current) => ({
                  ...current,
                  layout: { ...(current.layout ?? {}), wordSpacing: Number(event.target.value) },
                }))}
              />
            </label>
          </div>
        </div>

        <div className="apx-pre4-section" data-text-section="fill">
          <div className="apx-pre4-section-title">Fill & placement</div>
          <div className="apx-canvas-color-row">
            <input
              type="color"
              value={fill.color ?? props.color ?? '#f4f7fb'}
              onChange={(event) => updateTextDraft((current) => ({
                ...current,
                fill: { ...(current.fill ?? {}), color: event.target.value },
              }))}
            />
            <input
              className="apx-pre4-input"
              value={fill.color ?? props.color ?? '#f4f7fb'}
              onChange={(event) => updateTextDraft((current) => ({
                ...current,
                fill: { ...(current.fill ?? {}), color: event.target.value },
              }))}
            />
          </div>
          <div className="apx-pre4-property-grid">
            <label>
              <span>Align</span>
              <select
                className="apx-pre4-input"
                value={placement.textAlign ?? props.textAlign ?? 'left'}
                onChange={(event) => mutateText('Text align', (current) => ({
                  ...current,
                  placement: {
                    ...(current.placement ?? {}),
                    textAlign: event.target.value as NonNullable<VisualTextNodeProps['placement']>['textAlign'],
                  },
                }))}
              >
                {TEXT_ALIGNMENTS.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span>Baseline</span>
              <select
                className="apx-pre4-input"
                value={placement.textBaseline ?? props.textBaseline ?? 'top'}
                onChange={(event) => mutateText('Text baseline', (current) => ({
                  ...current,
                  placement: {
                    ...(current.placement ?? {}),
                    textBaseline: event.target.value as NonNullable<VisualTextNodeProps['placement']>['textBaseline'],
                  },
                }))}
              >
                {TEXT_BASELINES.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <label className="apx-canvas-field">
            <span>Opacity · {Math.round((primaryText.transform?.opacity ?? fill.opacity ?? props.opacity ?? 1) * 100)}%</span>
            <input
              className="apx-pre4-range"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={primaryText.transform?.opacity ?? fill.opacity ?? props.opacity ?? 1}
              onChange={(event) => updateTransformDraft('opacity', Number(event.target.value))}
            />
          </label>
        </div>

        <div className="apx-pre4-section" data-text-section="wrapping">
          <div className="apx-pre4-section-title">Wrapping & layout</div>
          <div className="apx-pre4-property-grid">
            <label>
              <span>Max width</span>
              <input
                className="apx-pre4-input"
                type="number"
                min={1}
                value={primaryText.transform?.width ?? layout.maxWidth ?? props.maxWidth ?? 360}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateTransformDraft('width', Number(event.target.value))}
                onBlur={() => endPropertyEdit('Text max width')}
              />
            </label>
            <label>
              <span>Max height</span>
              <input
                className="apx-pre4-input"
                type="number"
                min={1}
                value={primaryText.transform?.height ?? layout.maxHeight ?? props.maxHeight ?? 120}
                onFocus={beginPropertyEdit}
                onChange={(event) => updateTransformDraft('height', Number(event.target.value))}
                onBlur={() => endPropertyEdit('Text max height')}
              />
            </label>
          </div>
        </div>

        <div className="apx-pre4-section" data-text-section="decorations">
          <div className="apx-pre4-section-title">Decorations</div>
          <div className="apx-text-toggle-row apx-text-toggle-row--wrap">
            {(['underline','overline','strikethrough'] as const).map((key) => (
              <label className="apx-canvas-check" key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(decorations[key] ?? props[key])}
                  onChange={(event) => mutateText('Text decoration', (current) => ({
                    ...current,
                    decorations: {
                      ...(current.decorations ?? {}),
                      [key]: event.target.checked,
                    },
                  }))}
                />
                <span>{key}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="apx-pre4-section" data-text-section="stroke">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Stroke</div>
            <label className="apx-canvas-switch">
              <input
                type="checkbox"
                checked={Boolean(props.stroke)}
                onChange={(event) => mutateText('Text stroke', (current) => {
                  if (!event.target.checked) {
                    const next = { ...current };
                    delete next.stroke;
                    return next;
                  }
                  return {
                    ...current,
                    stroke: { color: '#ffffff', width: 1, opacity: 1, style: 'solid' },
                  };
                })}
              />
              <span />
            </label>
          </div>
          {props.stroke ? (
            <>
              <div className="apx-canvas-color-row">
                <input
                  type="color"
                  value={props.stroke.color ?? '#ffffff'}
                  onChange={(event) => updateTextDraft((current) => ({
                    ...current,
                    stroke: { ...(current.stroke ?? {}), color: event.target.value },
                  }))}
                />
                <input
                  className="apx-pre4-input"
                  value={props.stroke.color ?? '#ffffff'}
                  onChange={(event) => updateTextDraft((current) => ({
                    ...current,
                    stroke: { ...(current.stroke ?? {}), color: event.target.value },
                  }))}
                />
              </div>
              <div className="apx-pre4-property-grid">
                <label>
                  <span>Width</span>
                  <input
                    className="apx-pre4-input"
                    type="number"
                    min={0}
                    value={props.stroke.width ?? 1}
                    onChange={(event) => updateTextDraft((current) => ({
                      ...current,
                      stroke: { ...(current.stroke ?? {}), width: Number(event.target.value) },
                    }))}
                  />
                </label>
                <label>
                  <span>Style</span>
                  <select
                    className="apx-pre4-input"
                    value={props.stroke.style ?? 'solid'}
                    onChange={(event) => mutateText('Text stroke style', (current) => ({
                      ...current,
                      stroke: {
                        ...(current.stroke ?? {}),
                        style: event.target.value as NonNullable<VisualTextNodeProps['stroke']>['style'],
                      },
                    }))}
                  >
                    {['solid','dashed','dotted','groove','ridge','double'].map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>
              </div>
            </>
          ) : null}
        </div>
      </>
    );
  };

  const renderTextEffects = () => {
    if (!primaryText) return renderTransformFields();
    const props = visualTextProps(primaryText);
    const effects = props.effects ?? {};
    const curve = props.textOnCurve;
    return (
      <>
        {renderTextHeader()}
        {(['shadow','glow','highlight'] as const).map((kind) => {
          const current = effects[kind];
          return (
            <div className="apx-pre4-section" data-text-effect={kind} key={kind}>
              <div className="apx-canvas-section-heading">
                <div className="apx-pre4-section-title">{kind}</div>
                <label className="apx-canvas-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(current)}
                    onChange={(event) => mutateText('Text ' + kind, (value) => {
                      const nextEffects = { ...(value.effects ?? {}) };
                      if (!event.target.checked) {
                        delete nextEffects[kind];
                      } else if (kind === 'shadow') {
                        nextEffects.shadow = { color: '#000000', offsetX: 0, offsetY: 8, blur: 18, opacity: .4 };
                      } else if (kind === 'glow') {
                        nextEffects.glow = { color: '#6f86ff', intensity: 12, opacity: .75 };
                      } else {
                        nextEffects.highlight = { color: '#1d4ed8', opacity: .35 };
                      }
                      return { ...value, effects: nextEffects };
                    })}
                  />
                  <span />
                </label>
              </div>
              {current ? (
                <>
                  <div className="apx-canvas-color-row">
                    <input
                      type="color"
                      value={current.color ?? (kind === 'shadow' ? '#000000' : '#6f86ff')}
                      onChange={(event) => updateTextDraft((value) => ({
                        ...value,
                        effects: {
                          ...(value.effects ?? {}),
                          [kind]: { ...(value.effects?.[kind] ?? {}), color: event.target.value },
                        },
                      }))}
                    />
                    <input
                      className="apx-pre4-input"
                      value={current.color ?? (kind === 'shadow' ? '#000000' : '#6f86ff')}
                      onChange={(event) => updateTextDraft((value) => ({
                        ...value,
                        effects: {
                          ...(value.effects ?? {}),
                          [kind]: { ...(value.effects?.[kind] ?? {}), color: event.target.value },
                        },
                      }))}
                    />
                  </div>
                  {kind === 'shadow' ? (
                    <div className="apx-pre4-property-grid">
                      <label><span>X</span><input className="apx-pre4-input" type="number" value={effects.shadow?.offsetX ?? 0} onChange={(event) => updateTextDraft((value) => ({ ...value, effects: { ...(value.effects ?? {}), shadow: { ...(value.effects?.shadow ?? {}), offsetX: Number(event.target.value) } } }))}/></label>
                      <label><span>Y</span><input className="apx-pre4-input" type="number" value={effects.shadow?.offsetY ?? 8} onChange={(event) => updateTextDraft((value) => ({ ...value, effects: { ...(value.effects ?? {}), shadow: { ...(value.effects?.shadow ?? {}), offsetY: Number(event.target.value) } } }))}/></label>
                      <label><span>Blur</span><input className="apx-pre4-input" type="number" min={0} value={effects.shadow?.blur ?? 18} onChange={(event) => updateTextDraft((value) => ({ ...value, effects: { ...(value.effects ?? {}), shadow: { ...(value.effects?.shadow ?? {}), blur: Number(event.target.value) } } }))}/></label>
                      <label><span>Opacity</span><input className="apx-pre4-input" type="number" min={0} max={1} step={.05} value={effects.shadow?.opacity ?? .4} onChange={(event) => updateTextDraft((value) => ({ ...value, effects: { ...(value.effects ?? {}), shadow: { ...(value.effects?.shadow ?? {}), opacity: Number(event.target.value) } } }))}/></label>
                    </div>
                  ) : kind === 'glow' ? (
                    <div className="apx-pre4-property-grid">
                      <label><span>Intensity</span><input className="apx-pre4-input" type="number" min={0} value={effects.glow?.intensity ?? 12} onChange={(event) => updateTextDraft((value) => ({ ...value, effects: { ...(value.effects ?? {}), glow: { ...(value.effects?.glow ?? {}), intensity: Number(event.target.value) } } }))}/></label>
                      <label><span>Opacity</span><input className="apx-pre4-input" type="number" min={0} max={1} step={.05} value={effects.glow?.opacity ?? .75} onChange={(event) => updateTextDraft((value) => ({ ...value, effects: { ...(value.effects ?? {}), glow: { ...(value.effects?.glow ?? {}), opacity: Number(event.target.value) } } }))}/></label>
                    </div>
                  ) : (
                    <label className="apx-canvas-field"><span>Opacity</span><input className="apx-pre4-range" type="range" min={0} max={1} step={.01} value={effects.highlight?.opacity ?? .35} onChange={(event) => updateTextDraft((value) => ({ ...value, effects: { ...(value.effects ?? {}), highlight: { ...(value.effects?.highlight ?? {}), opacity: Number(event.target.value) } } }))}/></label>
                  )}
                </>
              ) : null}
            </div>
          );
        })}

        <div className="apx-pre4-section" data-text-section="curve">
          <div className="apx-canvas-section-heading">
            <div className="apx-pre4-section-title">Text on curve</div>
            <label className="apx-canvas-switch">
              <input
                type="checkbox"
                checked={Boolean(curve)}
                onChange={(event) => mutateText('Text on curve', (current) => {
                  if (!event.target.checked) {
                    const next = { ...current };
                    delete next.textOnCurve;
                    return next;
                  }
                  return {
                    ...current,
                    textOnCurve: {
                      sweepAngle: 180,
                      radius: 180,
                      up: true,
                      layoutMode: 'clamp',
                      baselineOffset: 0,
                      startAngleDeg: 0,
                    },
                  };
                })}
              />
              <span />
            </label>
          </div>
          {curve ? (
            <>
              <div className="apx-pre4-property-grid">
                <label><span>Sweep</span><input className="apx-pre4-input" type="number" min={1} max={360} value={curve.sweepAngle} onChange={(event) => updateTextDraft((current) => ({ ...current, textOnCurve: { ...current.textOnCurve!, sweepAngle: Number(event.target.value) } }))}/></label>
                <label><span>Radius</span><input className="apx-pre4-input" type="number" min={1} value={curve.radius ?? 180} onChange={(event) => updateTextDraft((current) => ({ ...current, textOnCurve: { ...current.textOnCurve!, radius: Number(event.target.value) } }))}/></label>
                <label><span>Offset</span><input className="apx-pre4-input" type="number" value={curve.baselineOffset ?? 0} onChange={(event) => updateTextDraft((current) => ({ ...current, textOnCurve: { ...current.textOnCurve!, baselineOffset: Number(event.target.value) } }))}/></label>
                <label><span>Start °</span><input className="apx-pre4-input" type="number" value={curve.startAngleDeg ?? 0} onChange={(event) => updateTextDraft((current) => ({ ...current, textOnCurve: { ...current.textOnCurve!, startAngleDeg: Number(event.target.value) } }))}/></label>
              </div>
              <div className="apx-pre4-property-grid">
                <label><span>Mode</span><select className="apx-pre4-input" value={curve.layoutMode ?? 'clamp'} onChange={(event) => mutateText('Curve layout', (current) => ({ ...current, textOnCurve: { ...current.textOnCurve!, layoutMode: event.target.value as NonNullable<VisualTextNodeProps['textOnCurve']>['layoutMode'] } }))}>{TEXT_CURVE_MODES.map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className="apx-canvas-check"><input type="checkbox" checked={curve.up ?? true} onChange={(event) => mutateText('Curve direction', (current) => ({ ...current, textOnCurve: { ...current.textOnCurve!, up: event.target.checked } }))}/><span>Curve up</span></label>
              </div>
            </>
          ) : null}
        </div>
      </>
    );
  };

  const renderTextData = () => {
    if (!primaryText) return renderTransformFields();
    const props = visualTextProps(primaryText);
    const font = props.font ?? {};
    const fontAssetId = font.path ? studioAssetIdFromReference(font.path) : null;
    return (
      <>
        {renderTextHeader()}
        <div className="apx-pre4-section" data-text-section="font-registry">
          <div className="apx-pre4-section-title">Font registry</div>
          <label className="apx-canvas-field">
            <span>Registered family</span>
            <input className="apx-pre4-input" value={font.name ?? font.family ?? 'Arial'} onChange={(event) => updateTextDraft((current) => ({ ...current, font: { ...(current.font ?? {}), name: event.target.value, family: event.target.value } }))}/>
          </label>
          <label className="apx-canvas-field">
            <span>Uploaded font asset</span>
            <select
              className="apx-pre4-input"
              value={fontAssetId ?? ''}
              onChange={(event) => {
                const asset = fontAssets.find((item) => item.id === event.target.value);
                if (asset) applyFontAsset(asset);
                else mutateText('Detach font asset', (current) => ({
                  ...current,
                  font: { ...(current.font ?? {}), path: undefined },
                }));
              }}
              data-text-font-asset-select
            >
              <option value="">None / system font</option>
              {fontAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </label>
          <label className="apx-canvas-field">
            <span>Font path</span>
            <input className="apx-pre4-input" value={font.path ?? ''} placeholder="./assets/font.ttf" onChange={(event) => updateTextDraft((current) => ({ ...current, font: { ...(current.font ?? {}), path: event.target.value || undefined } }))}/>
          </label>
          <small className="apx-canvas-hint">
            Uploaded fonts use stable studio://asset/… identity in Studio. Phase 15 owns exported asset-path rewriting.
          </small>
        </div>

        <div className="apx-pre4-section" data-text-section="metrics">
          <div className="apx-pre4-section-title">Text metrics</div>
          {textMetrics ? (
            <div className="apx-text-metrics-grid">
              <div><span>Width</span><strong>{textMetrics.width.toFixed(1)} px</strong></div>
              <div><span>Height</span><strong>{textMetrics.height.toFixed(1)} px</strong></div>
              <div><span>Lines</span><strong>{textMetrics.lineCount}</strong></div>
              <div><span>Baseline</span><strong>{textMetrics.baseline.toFixed(1)} px</strong></div>
              <div><span>Line height</span><strong>{textMetrics.lineHeight.toFixed(1)} px</strong></div>
            </div>
          ) : (
            <div className="apx-pre4-empty"><strong>Metrics unavailable</strong><span>The browser canvas measurement context is unavailable.</span></div>
          )}
          <label className="apx-canvas-check">
            <input
              type="checkbox"
              checked={props.includeCharMetrics ?? false}
              onChange={(event) => mutateText('Character metrics', (current) => ({ ...current, includeCharMetrics: event.target.checked }))}
            />
            <span>Include per-character metrics in Apexify measurement</span>
          </label>
          <div className="apx-pre4-property-grid">
            <label><span>Measure W</span><input className="apx-pre4-input" type="number" min={1} value={props.measurementCanvas?.width ?? 1200} onChange={(event) => updateTextDraft((current) => ({ ...current, measurementCanvas: { ...(current.measurementCanvas ?? {}), width: Number(event.target.value) } }))}/></label>
            <label><span>Measure H</span><input className="apx-pre4-input" type="number" min={1} value={props.measurementCanvas?.height ?? 600} onChange={(event) => updateTextDraft((current) => ({ ...current, measurementCanvas: { ...(current.measurementCanvas ?? {}), height: Number(event.target.value) } }))}/></label>
          </div>
        </div>
      </>
    );
  };

  const renderTextAdvanced = () => {
    if (!primaryText) return renderTransformFields();
    return (
      <>
        {renderTextHeader()}
        <div className="apx-pre4-section" data-text-section="complete-config">
          <div className="apx-pre4-section-title">Complete TextProperties</div>
          <textarea
            className="apx-canvas-json apx-canvas-json--config"
            spellCheck={false}
            value={textConfigDraft}
            onChange={(event) => {
              setTextConfigDraft(event.target.value);
              setTextConfigError(null);
            }}
          />
          {textConfigError ? <div className="apx-live-code-error">{textConfigError}</div> : null}
          <button
            className="apx-canvas-apply"
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(textConfigDraft);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                  throw new Error('Text properties JSON must be an object.');
                }
                const nextProject = structuredClone(project);
                nextProject.document.nodes[primaryText.id].props =
                  textPropsRecord(parsed as VisualTextNodeProps);
                nextProject.updatedAt = new Date().toISOString();
                const validation = validateVisualProject(nextProject);
                if (!validation.ok) {
                  throw new Error(validation.issues[0]?.message ?? 'Invalid text configuration.');
                }
                history.current.commit(project, nextProject, 'Advanced text config');
                projectRef.current = nextProject;
                setProject(nextProject);
                setHistoryTick((value) => value + 1);
                setTextConfigError(null);
                setMessage('Complete text configuration applied');
              } catch (configError) {
                setTextConfigError(
                  configError instanceof Error
                    ? configError.message
                    : 'Invalid text configuration JSON.',
                );
              }
            }}
          >
            Apply complete text config
          </button>
          <small className="apx-canvas-hint">
            Covers declaration-level gradients, styled line decorations, legacy aliases and every pinned TextProperties field while the normal Inspector stays calm.
          </small>
        </div>
      </>
    );
  };

  const renderTextInspector = () => {
    if (inspectorTab === 'transform') return renderTransformFields();
    if (inspectorTab === 'style') return renderTextStyle();
    if (inspectorTab === 'effects') return renderTextEffects();
    if (inspectorTab === 'data') return renderTextData();
    return renderTextAdvanced();
  };


  const renderPathInspector = () => {
    if (!primaryPath) return null;
    const props = visualPathProps(primaryPath);
    const connector = props.connector
      ? Array.isArray(props.connector)
        ? props.connector[0]
        : props.connector
      : undefined;

    const patchConnector = (
      label: string,
      updater: (value: NonNullable<typeof connector>) => NonNullable<typeof connector>,
    ) => {
      if (!connector) return;
      mutatePath(label, (current) => {
        const currentValue = Array.isArray(current.connector)
          ? current.connector[0]
          : current.connector;
        if (!currentValue) return current;
        const updated = updater(currentValue);
        return {
          ...current,
          connector: Array.isArray(current.connector)
            ? [updated, ...current.connector.slice(1)]
            : updated,
        };
      });
    };

    if (inspectorTab === 'transform') return renderTransformFields();

    if (inspectorTab === 'style') {
      return (
        <>
          <div className="apx-pre4-inspector-title">
            <div>
              <strong>{primaryPath.name ?? 'Path'}</strong>
              <small>{props.tool} · Apexify Path2D</small>
            </div>
            <span className="apx-pre4-type-pill">{primaryPath.kind}</span>
          </div>

          {props.tool === 'connector' && connector ? (
            <>
              <div className="apx-pre4-section" data-connector-style>
                <div className="apx-pre4-section-title">Connector stroke</div>
                <label className="apx-pre4-field">
                  <span>Color</span>
                  <input
                    type="color"
                    value={connector.lineStyle?.color ?? '#7dd3fc'}
                    onChange={(event) =>
                      patchConnector('Connector color', (value) => ({
                        ...value,
                        lineStyle: {
                          ...(value.lineStyle ?? {}),
                          color: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <label className="apx-pre4-field">
                  <span>Width</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={connector.lineStyle?.width ?? 4}
                    onChange={(event) =>
                      patchConnector('Connector width', (value) => ({
                        ...value,
                        lineStyle: {
                          ...(value.lineStyle ?? {}),
                          width: Math.max(0, Number(event.target.value) || 0),
                        },
                      }))
                    }
                  />
                </label>
                <label className="apx-pre4-field">
                  <span>Dash</span>
                  <select
                    value={
                      connector.lineStyle?.lineDash?.dashArray?.length
                        ? connector.lineStyle.lineDash.dashArray.join(',') === '2,5'
                          ? 'dotted'
                          : 'dashed'
                        : 'solid'
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      patchConnector('Connector dash', (current) => ({
                        ...current,
                        lineStyle: {
                          ...(current.lineStyle ?? {}),
                          lineDash: {
                            dashArray:
                              value === 'dashed'
                                ? [10, 6]
                                : value === 'dotted'
                                  ? [2, 5]
                                  : [],
                            offset: current.lineStyle?.lineDash?.offset ?? 0,
                          },
                        },
                      }));
                    }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </label>
              </div>
              <div className="apx-pre4-section" data-connector-arrows>
                <div className="apx-pre4-section-title">Arrows & marker</div>
                <label className="apx-pre4-check">
                  <input
                    type="checkbox"
                    checked={connector.arrow?.start ?? false}
                    onChange={(event) =>
                      patchConnector('Start arrow', (value) => ({
                        ...value,
                        arrow: { ...(value.arrow ?? {}), start: event.target.checked },
                      }))
                    }
                  />
                  <span>Start arrow</span>
                </label>
                <label className="apx-pre4-check">
                  <input
                    type="checkbox"
                    checked={connector.arrow?.end ?? false}
                    onChange={(event) =>
                      patchConnector('End arrow', (value) => ({
                        ...value,
                        arrow: { ...(value.arrow ?? {}), end: event.target.checked },
                      }))
                    }
                  />
                  <span>End arrow</span>
                </label>
                <label className="apx-pre4-check">
                  <input
                    type="checkbox"
                    checked={Boolean(connector.markers?.length)}
                    onChange={(event) =>
                      patchConnector('Connector marker', (value) => ({
                        ...value,
                        markers: event.target.checked
                          ? [{ position: 0.5, shape: 'diamond', size: 8, color: '#f8fafc' }]
                          : [],
                      }))
                    }
                  />
                  <span>Midpoint marker</span>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="apx-pre4-section" data-path-stroke>
                <div className="apx-pre4-section-title">Stroke</div>
                <label className="apx-pre4-field">
                  <span>Color</span>
                  <input
                    type="color"
                    value={props.draw?.stroke?.color ?? '#7dd3fc'}
                    onChange={(event) =>
                      mutatePath('Path stroke color', (current) => ({
                        ...current,
                        draw: {
                          ...(current.draw ?? {}),
                          stroke: {
                            ...(current.draw?.stroke ?? {}),
                            color: event.target.value,
                          },
                        },
                      }))
                    }
                  />
                </label>
                <label className="apx-pre4-field">
                  <span>Width</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={props.draw?.stroke?.width ?? 4}
                    onChange={(event) =>
                      mutatePath('Path stroke width', (current) => ({
                        ...current,
                        draw: {
                          ...(current.draw ?? {}),
                          stroke: {
                            ...(current.draw?.stroke ?? {}),
                            width: Math.max(0, Number(event.target.value) || 0),
                          },
                        },
                      }))
                    }
                  />
                </label>
                <label className="apx-pre4-field">
                  <span>Dash</span>
                  <select
                    value={props.draw?.stroke?.style ?? 'solid'}
                    onChange={(event) =>
                      mutatePath('Path dash style', (current) => ({
                        ...current,
                        draw: {
                          ...(current.draw ?? {}),
                          stroke: {
                            ...(current.draw?.stroke ?? {}),
                            style: event.target.value as 'solid' | 'dashed' | 'dotted',
                            dashArray: undefined,
                          },
                        },
                      }))
                    }
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </label>
                <label className="apx-pre4-field">
                  <span>Line cap</span>
                  <select
                    value={props.draw?.stroke?.lineCap ?? 'round'}
                    onChange={(event) =>
                      mutatePath('Path line cap', (current) => ({
                        ...current,
                        draw: {
                          ...(current.draw ?? {}),
                          stroke: {
                            ...(current.draw?.stroke ?? {}),
                            lineCap: event.target.value as 'butt' | 'round' | 'square',
                          },
                        },
                      }))
                    }
                  >
                    <option value="butt">Butt</option>
                    <option value="round">Round</option>
                    <option value="square">Square</option>
                  </select>
                </label>
              </div>

              <div className="apx-pre4-section" data-path-fill>
                <div className="apx-pre4-section-title">Fill</div>
                <label className="apx-pre4-field">
                  <span>Color</span>
                  <input
                    type="color"
                    value={props.draw?.fill?.color ?? '#2563eb'}
                    onChange={(event) =>
                      mutatePath('Path fill color', (current) => ({
                        ...current,
                        draw: {
                          ...(current.draw ?? {}),
                          fill: {
                            ...(current.draw?.fill ?? { opacity: 0.18, rule: 'nonzero' }),
                            color: event.target.value,
                          },
                        },
                      }))
                    }
                  />
                </label>
                <label className="apx-pre4-field">
                  <span>Fill rule</span>
                  <select
                    value={props.draw?.fill?.rule ?? 'nonzero'}
                    onChange={(event) =>
                      mutatePath('Path fill rule', (current) => ({
                        ...current,
                        draw: {
                          ...(current.draw ?? {}),
                          fill: {
                            ...(current.draw?.fill ?? { color: '#2563eb', opacity: 0.18 }),
                            rule: event.target.value as 'nonzero' | 'evenodd',
                          },
                        },
                      }))
                    }
                    data-path-fill-rule
                  >
                    <option value="nonzero">Nonzero</option>
                    <option value="evenodd">Even-odd</option>
                  </select>
                </label>
              </div>
            </>
          )}
        </>
      );
    }

    if (inspectorTab === 'effects') {
      if (props.tool === 'connector') {
        return (
          <div className="apx-pre4-empty">
            <strong>Connector effects</strong>
            <span>Arrow, marker and dash styling are available in Style. Advanced connector semantics remain editable in Data.</span>
          </div>
        );
      }
      return (
        <div className="apx-pre4-section" data-path-effects>
          <div className="apx-pre4-section-title">Shadow</div>
          <label className="apx-pre4-field">
            <span>Color</span>
            <input
              type="text"
              value={props.draw?.shadow?.color ?? 'rgba(0,0,0,.45)'}
              onChange={(event) =>
                mutatePath('Path shadow color', (current) => ({
                  ...current,
                  draw: {
                    ...(current.draw ?? {}),
                    shadow: {
                      ...(current.draw?.shadow ?? {}),
                      color: event.target.value,
                    },
                  },
                }))
              }
            />
          </label>
          <label className="apx-pre4-field">
            <span>Blur</span>
            <input
              type="number"
              min="0"
              value={props.draw?.shadow?.blur ?? 0}
              onChange={(event) =>
                mutatePath('Path shadow blur', (current) => ({
                  ...current,
                  draw: {
                    ...(current.draw ?? {}),
                    shadow: {
                      ...(current.draw?.shadow ?? {}),
                      blur: Math.max(0, Number(event.target.value) || 0),
                    },
                  },
                }))
              }
            />
          </label>
        </div>
      );
    }

    return (
      <div className="apx-pre4-section" data-path-data>
        <div className="apx-pre4-section-title">
          {inspectorTab === 'data' ? 'Path data' : 'Complete Path2D configuration'}
        </div>
        <textarea
          className="apx-canvas-json apx-canvas-json--config"
          spellCheck={false}
          value={pathConfigDraft}
          onChange={(event) => {
            setPathConfigDraft(event.target.value);
            setPathConfigError(null);
          }}
          data-path-config
        />
        {pathConfigError ? <div className="apx-live-code-error">{pathConfigError}</div> : null}
        <button
          className="apx-canvas-apply"
          type="button"
          data-path-config-apply
          onClick={() => {
            try {
              const parsed = JSON.parse(pathConfigDraft);
              if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                throw new Error('Path configuration must be an object.');
              }
              const nextProject = structuredClone(project);
              nextProject.document.nodes[primaryPath.id].props =
                pathPropsRecord(parsed as VisualPathNodeProps);
              nextProject.updatedAt = new Date().toISOString();
              const validation = validateVisualProject(nextProject);
              if (!validation.ok) {
                throw new Error(validation.issues[0]?.message ?? 'Invalid path configuration.');
              }
              history.current.commit(project, nextProject, 'Advanced path config');
              projectRef.current = nextProject;
              setProject(nextProject);
              setHistoryTick((value) => value + 1);
              setPathConfigError(null);
              setMessage('Path configuration applied');
            } catch (configError) {
              setPathConfigError(
                configError instanceof Error
                  ? configError.message
                  : 'Invalid path configuration JSON.',
              );
            }
          }}
        >
          Apply path config
        </button>
        <small className="apx-canvas-hint">
          This is the complete serializable Phase 7 path contract: commands, connector geometry, arrows, markers, dash, fill rule and draw effects.
        </small>
      </div>
    );
  };

  const renderInspector = () => {
    if (activeTool === 'video' || phase13Active) {
      return (
        <VisualVideoInspector
          project={project}
          assets={assets}
          onMutate={mutate}
          inspectorTab={inspectorTab}
          onMessage={setMessage}
        />
      );
    }

    if (activeTool === 'audio' || phase12Active) {
      return (
        <VisualAudioInspector
          project={project}
          assets={assets}
          onMutate={mutate}
          inspectorTab={inspectorTab}
          onMessage={setMessage}
        />
      );
    }

    if (
      primary &&
      (primary.kind === 'scene' ||
        primary.kind === 'surface' ||
        primary.kind === 'component' ||
        primary.kind === 'template-instance')
    ) {
      return (
        <VisualPhase9Inspector
          project={project}
          node={primary}
          tab={inspectorTab}
          onMutate={mutate}
          onMessage={setMessage}
          renderTransform={renderTransformFields}
        />
      );
    }

    if (primaryChart) {
      if (inspectorTab === 'transform') return renderTransformFields();
      return (
        <VisualChartInspector
          node={primaryChart}
          tab={inspectorTab}
          onChange={mutateChart}
        />
      );
    }

    if (primaryPath) {
      return renderPathInspector();
    }

    if (primaryText) {
      return renderTextInspector();
    }

    if (primaryMedia) {
      return renderMediaInspector();
    }

    if (!primary && activeTool === 'canvas') {
      return renderCanvasInspector();
    }

    if ((inspectorTab === 'style' || inspectorTab === 'transform') && !primary) {
      return renderTransformFields();
    }

    if (inspectorTab === 'style' || inspectorTab === 'transform') {
      return (
        <>
          {renderTransformFields()}
          <div className="apx-pre4-section">
            <div className="apx-pre4-section-title">Fill</div>
            <button className="apx-pre4-future-row" type="button" disabled>
              <span>◫</span>
              <strong>Feature fill</strong>
              <small>Owned by the selected feature phase</small>
            </button>
          </div>
          <div className="apx-pre4-section">
            <div className="apx-pre4-section-title">Appearance</div>
            <div className="apx-pre4-disabled-grid">
              <button disabled>Corner radius</button>
              <button disabled>Stroke</button>
              <button disabled>Shadow</button>
              <button disabled>Blend mode</button>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="apx-pre4-empty">
        <strong>{inspectorTabs.find(([id]) => id === inspectorTab)?.[1]}</strong>
        <span>
          This permanent inspector surface is ready. Its authoring controls arrive in the owning feature phase.
        </span>
      </div>
    );
  };

  const renderDock = () => {
    if (dockTab === 'timeline') {
      if (activeTool === 'video' || phase13Active) {
        return (
          <VisualVideoTimeline
            project={project}
            assets={assets}
            onMutate={mutate}
          />
        );
      }
      if (activeTool === 'audio' || phase12Active) {
        return (
          <VisualAudioTimeline
            project={project}
            assets={assets}
            onMutate={mutate}
          />
        );
      }
      return (
        <VisualGifTimeline
          project={project}
          assets={assets}
          onMutate={mutate}
        />
      );
    }

    if (dockTab === 'generated') {
      return (
        <div className="apx-live-code-panel" data-visual-live-code>
          <div className="apx-live-code-toolbar">
            <div>
              <strong>Live Apexify Code</strong>
              <span
                className="apx-live-sync-state"
                data-state={codeSyncState}
                title={codeSyncError ?? undefined}
              >
                {codeSyncState === 'saving'
                  ? 'Autosaving…'
                  : codeSyncState === 'error'
                    ? 'Code not synced'
                    : 'Autosaved · canvas synced'}
              </span>
            </div>
            <div className="apx-live-code-actions">
              <button type="button" onClick={() => saveLiveCode()}>Save</button>
              <button type="button" onClick={() => setCodeModalOpen(true)}>Open Code</button>
            </div>
          </div>
          {codeSyncError ? (
            <div className="apx-live-code-error">{codeSyncError}</div>
          ) : null}
          <div className="apx-live-code-editor">
            <InteractiveCodeEditor
              value={codeSource}
              language="ts"
              onChange={updateLiveCode}
              fillParent
              ariaLabel="Live Apexify Visual code"
            />
          </div>
        </div>
      );
    }

    if (dockTab === 'diagnostics') {
      const diagnostics = [
        ...(codeSyncError ? [codeSyncError] : []),
        ...(error ? [error] : []),
        ...previewWarnings,
      ];
      const entries = Object.entries(phase7Results);
      return diagnostics.length || entries.length ? (
        <div className="apx-pre4-diagnostics" data-phase7-results>
          {entries.map(([name, value]) => (
            <div key={'result-' + name} data-phase7-result={name}>
              <strong>{name}</strong>
              <pre>{JSON.stringify(value, null, 2)}</pre>
            </div>
          ))}
          {diagnostics.map((item, index) => (
            <div key={'diagnostic-' + index}>{item}</div>
          ))}
        </div>
      ) : (
        <div className="apx-pre4-dock-empty" data-phase7-results-empty>
          <strong>No diagnostics</strong>
          <span>The Visual source, structured results, project model and runtime currently agree.</span>
        </div>
      );
    }

    if (dockTab === 'assets') {
      return (
        <StudioAssetShelf
          assets={assets}
          onChange={setAssets}
          onInsertReference={(value) => setMessage('Asset reference: ' + value)}
          onInsertAsset={insertImageAsset}
          onInsertFontAsset={applyFontAsset}
          onNotice={(_kind, text) => setMessage(text)}
        />
      );
    }

    return history.current.entries.length || runHistory.length ? (
      <div className="apx-pre4-history">
        {history.current.entries.slice(0, 12).map((label, index) => (
          <div key={'edit-' + index}>
            <span>↶</span>
            <strong>{label}</strong>
            <small>{index === 0 ? 'latest edit' : ''}</small>
          </div>
        ))}
        {runHistory.slice(0, 6).map((entry, index) => (
          <div key={'run-' + index}>
            <span>▶</span>
            <strong>{'Run ' + (index + 1)}</strong>
            <small>{entry.ok ? 'success' : 'failed'}</small>
          </div>
        ))}
      </div>
    ) : (
      <div className="apx-pre4-dock-empty">
        <strong>No history yet</strong>
        <span>Editor mutations and Studio executions appear here.</span>
      </div>
    );
  };

  void historyTick;

  return (
    <div
      className="apx-visual-workspace apx-pre4-workspace"
      data-studio-visual-workspace
      data-active={active ? 'true' : 'false'}
      data-active-tool={activeTool}
    >
      <header className="apx-pre4-topbar">
        <div className="apx-pre4-brand">
          <span className="apx-pre4-logo"><BrandIcon size={36} /></span>
          <span className="apx-pre4-brand-copy">
            <strong>Apexify Studio</strong>
            <small>Design. Visualize. Generate.</small>
          </span>
        </div>

        <StudioModeSwitch
          mode={mode}
          onChange={onModeChange}
          className="studio-mode-switch--pre4"
        />

        <div className="apx-pre4-top-actions">
          <button
            className="apx-pre4-top-button"
            type="button"
            disabled={!codeSource && !generated.value}
            onClick={() => void renderVisualPreview(false)}
            title="Render the current live Visual source"
          >
            <PlayIcon className="apx-pre4-control-icon" aria-hidden /> Run
          </button>
          <button
            className="apx-pre4-top-button"
            type="button"
            disabled={!codeSource && !generated.value}
            onClick={() => void renderVisualPreview(true)}
            data-visual-preview-modal-trigger
          >
            <MagnifyingGlassIcon className="apx-pre4-control-icon" aria-hidden /> Preview
          </button>
          <button
            className="apx-pre4-top-button apx-pre4-primary"
            type="button"
            data-visual-generate-code
            onClick={() => setCodeModalOpen(true)}
            disabled={!codeSource && !generated.value}
          >
            <CodeBracketIcon className="apx-pre4-control-icon" aria-hidden /> Generate Code
          </button>

          <details className="apx-vw-project-menu apx-pre4-export">
            <summary className="apx-pre4-top-button">
              <ArrowDownTrayIcon className="apx-pre4-control-icon" aria-hidden /> Export <span>⌄</span>
            </summary>
            <div className="apx-vw-project-menu__panel">
              <button data-visual-project-save onClick={save}>Save project</button>
              <button data-visual-project-load onClick={() => fileRef.current?.click()}>Load project</button>
              <button
                data-visual-open-generated-code
                onClick={handoff}
                disabled={!codeSource && !generated.value}
              >
                Open in Code Studio
              </button>
            </div>
          </details>

          <input
            ref={fileRef}
            hidden
            type="file"
            accept=".apexstudio.json,application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void load(file);
            }}
          />
        </div>

      </header>

      <div className="apx-pre4-layout" style={{ '--pre4-dock-size': dockCollapsed ? '38px' : '204px' } as CSSProperties}>
        <nav className="apx-pre4-feature-rail" aria-label="Visual Studio features">
          <div className="apx-pre4-feature-list">
            {featureTools.map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                data-feature-tool={id}
                data-active={activeTool === id ? 'true' : undefined}
                onClick={() => {
                  setActiveTool(id);
                  if (id === 'assets') setDockTab('assets');
                  if (id === 'gif') {
                    setDockTab('timeline');
                    setDockCollapsed(false);
                  }
                  if (id === 'audio') {
                    setDockTab('timeline');
                    setDockCollapsed(false);
                  }
                  if (id === 'video') {
                    setDockTab('timeline');
                    setDockCollapsed(false);
                  }
                  if (id === 'layers') setMessage('Layers panel active');
                }}
              >
                <span className="apx-pre4-feature-icon"><Icon aria-hidden /></span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="apx-pre4-feature-card">
            <strong>Turn ideas into interactive experiences.</strong>
            <span>Apexify.js ↗</span>
          </div>
        </nav>

        <aside className="apx-pre4-layers" data-context-mode={mediaContextActive ? activeTool : 'layers'}>
          <div className="apx-pre4-panel-head">
            <div>
              <strong>
                {activeTool === 'images'
                  ? 'Images'
                  : activeTool === 'shapes'
                    ? 'Shapes'
                    : activeTool === 'text'
                      ? 'Text'
                      : activeTool === 'paths'
                        ? 'Paths & pixels'
                        : activeTool === 'components'
                          ? 'Components'
                          : activeTool === 'assets'
                            ? 'Assets'
                            : activeTool === 'gif'
                              ? 'GIF & animation'
                              : activeTool === 'audio'
                                ? 'Audio'
                                : activeTool === 'video'
                                  ? 'Video'
                                  : 'Layers'}
              </strong>
              <small>
                {mediaContextActive
                  ? activeTool === 'images'
                    ? imageAssets.length + ' image assets'
                    : activeTool === 'shapes'
                      ? IMAGE_SHAPE_TYPES.length + ' built-in shapes'
                      : activeTool === 'text'
                        ? fontAssets.length + ' uploaded fonts'
                        : activeTool === 'paths'
                          ? 'Path · doodle · pixels · detection'
                          : activeTool === 'components'
                            ? 'Scenes · surfaces · components · templates'
                            : activeTool === 'gif'
                              ? 'Frames · timing · GIF output'
                              : activeTool === 'audio'
                                ? 'Presets · synthesis · mix · WAV'
                                : activeTool === 'video'
                                  ? 'Clips · operations · FFmpeg output'
                                  : assets.length + ' shared assets'
                  : (layerIds.length ? layerIds.length + ' layers' : 'Layer structure') +
                    (selected.length ? ' · ' + selected.length + ' selected' : '')}
              </small>
            </div>
            {!mediaContextActive ? (
              <button type="button" onClick={addPlaceholder} title="Add layer">＋</button>
            ) : activeTool === 'images' ? (
              <button type="button" onClick={() => setDockTab('assets')} title="Open Assets">＋</button>
            ) : activeTool === 'text' ? (
              <button type="button" onClick={() => insertText('Text')} title="Add text">＋</button>
            ) : null}
          </div>

          {mediaContextActive ? (
            renderMediaContext()
          ) : (
            <>
              <div className="apx-pre4-layer-tree">
                <div className="apx-pre4-root-row">
                  <span>▾</span>
                  <strong>{project.name || 'Landing Page'}</strong>
                </div>
                {renderLayerRows(project.document.rootNodeIds)}
                {!project.document.rootNodeIds.length && (
                  <div className="apx-pre4-empty apx-pre4-empty-layers">
                    <strong>No layers yet</strong>
                    <span>Add a layer to begin composing on the canvas.</span>
                    <button type="button" onClick={addPlaceholder}>Add layer</button>
                  </div>
                )}
              </div>
              {selected.length ? (
                <div className="apx-pre4-layer-actions">
                  <button type="button" onClick={() => mutate('Duplicate', (current) => duplicateNodes(current, selected, () => createVisualId('node')))}>Duplicate</button>
                  <button type="button" onClick={() => mutate('Delete', (current) => deleteNodes(current, selected))}>Delete</button>
                  <button type="button" onClick={groupSelection} disabled={selected.length < 2}>Group</button>
                  <button type="button" onClick={ungroupSelection}>Ungroup</button>
                </div>
              ) : null}
            </>
          )}
        </aside>
        <main className="apx-pre4-stage">
          <div className="apx-pre4-stagebar">
            <button className="apx-pre4-device" type="button">
              <ComputerDesktopIcon className="apx-pre4-control-icon" aria-hidden />
              Desktop ({project.document.width} × {project.document.height})
              <span>⌄</span>
            </button>

            <div className="apx-pre4-zoom">
              <button type="button" onClick={() => setZoom((value) => clampZoom(value - 10))}>−</button>
              <span>{zoom}%</span>
              <button type="button" onClick={() => setZoom((value) => clampZoom(value + 10))}>+</button>
            </div>

            <div className="apx-pre4-view-tools">
              <button
                type="button"
                data-active={viewportMode === 'pan' ? 'true' : undefined}
                onClick={() => setViewportMode('pan')}
                title="Pan"
              >
                <HandRaisedIcon className="apx-pre4-toolbar-icon" aria-hidden />
              </button>
              <button
                type="button"
                data-active={viewportMode === 'select' ? 'true' : undefined}
                onClick={() => setViewportMode('select')}
                title="Select"
              >
                <CursorArrowRaysIcon className="apx-pre4-toolbar-icon" aria-hidden />
              </button>
              <button className="apx-pre4-100" type="button" onClick={() => setZoom(100)} title="100%">100</button>
              <button type="button" onClick={fit} title="Fit"><ArrowsPointingOutIcon className="apx-pre4-toolbar-icon" aria-hidden /></button>
              <button type="button" onClick={resetView} title="Reset view"><ArrowPathIcon className="apx-pre4-toolbar-icon" aria-hidden /></button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="apx-pre4-viewport"
            data-pan-active={viewportMode === 'pan' ? 'true' : undefined}
            onPointerDown={beginViewportGesture}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            onWheel={onWheel}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={dropImagesOnCanvas}
            data-image-drop-target
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { pinch.current = null; }}
            style={{ touchAction: 'none' }}
          >
            <div
              className="apx-pre4-artboard-frame"
              style={{
                width: project.document.width * (zoom / 100),
                height: project.document.height * (zoom / 100),
                transform: 'translate(' + pan.x + 'px,' + pan.y + 'px)',
              }}
            >
              <div
                ref={artboardRef}
                className="apx-pre4-artboard"
                data-artboard-surface
                data-viewport-mode={viewportMode}
                style={{
                  width: project.document.width,
                  height: project.document.height,
                  background: canvasArtboardBackground(project.document.canvas ?? {}),
                  borderRadius:
                    project.document.canvas?.borderRadius === 'circular'
                      ? '50%'
                      : project.document.canvas?.borderRadius ?? 0,
                  opacity: project.document.canvas?.opacity ?? 1,
                  transform: 'scale(' + zoom / 100 + ')',
                  transformOrigin: 'top left',
                }}
              >
              {artboardPreviewUrl ? (
                <img
                  className="apx-pre4-authoritative-frame"
                  src={artboardPreviewUrl}
                  alt=""
                  draggable={false}
                  data-authoritative-apexify-frame
                  data-rendering={artboardPreviewBusy ? 'true' : undefined}
                />
              ) : null}
              <div className="apx-pre4-artboard-grid" />

              {freehandDraft.length > 1 ? (
                <svg
                  width={project.document.width}
                  height={project.document.height}
                  viewBox={'0 0 ' + project.document.width + ' ' + project.document.height}
                  aria-hidden
                  data-freehand-draft
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }}
                >
                  <polyline
                    points={freehandDraft.map((point) => point.x + ',' + point.y).join(' ')}
                    fill="none"
                    stroke="#7dd3fc"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}

              {guides.map((guide, index) => (
                <div
                  key={index}
                  className="apx-pre4-guide"
                  style={
                    guide.axis === 'x'
                      ? { left: guide.value, top: 0, bottom: 0, width: 1 }
                      : { top: guide.value, left: 0, right: 0, height: 1 }
                  }
                />
              ))}

              {drawableIds.map((id) => {
                const node = project.document.nodes[id];
                const rect = nodeRect(node);
                const isSelected = selected.includes(id);
                return (
                  <div
                    key={id}
                    data-visual-node={id}
                    className="apx-pre4-node"
                    data-kind={node.kind}
                    data-selected={isSelected ? 'true' : undefined}
                    data-inline-editing={inlineTextEditId === id ? 'true' : undefined}
                    onPointerDown={(event) => {
                      if (inlineTextEditId === id) return;
                      beginMove(event, id);
                    }}
                    onDoubleClick={(event) => {
                      if (node.kind !== 'text' || node.transform?.locked) return;
                      event.stopPropagation();
                      beginInlineTextEdit(node);
                    }}
                    style={{
                      left: rect.x,
                      top: rect.y,
                      width: rect.width,
                      height: rect.height,
                      transform: 'rotate(' + (node.transform?.rotation ?? 0) + 'deg)',
                      opacity: node.transform?.opacity ?? 1,
                      zIndex: node.transform?.zIndex ?? 0,
                    }}
                  >
                    {node.kind === 'text' && inlineTextEditId === id ? (
                      <textarea
                        autoFocus
                        className="apx-inline-text-editor"
                        data-inline-text-editor={id}
                        value={visualTextProps(node).text}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                        onDoubleClick={(event) => event.stopPropagation()}
                        onChange={(event) => updateInlineText(id, event.target.value)}
                        onBlur={finishInlineTextEdit}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                            event.preventDefault();
                            event.currentTarget.blur();
                          }
                        }}
                      />
                    ) : (
                      <span>{node.name ?? node.kind}</span>
                    )}
                    {isSelected && inlineTextEditId !== id && !node.transform?.locked && handles.map((handle) => (
                      <button
                        key={handle}
                        aria-label={'Resize ' + handle}
                        className="apx-pre4-handle"
                        onPointerDown={(event) => beginResize(event, id, handle)}
                        style={{
                          left: handlePos[handle].left,
                          top: handlePos[handle].top,
                          cursor: handlePos[handle].cursor,
                        }}
                      />
                    ))}
                    {isSelected && inlineTextEditId !== id && !node.transform?.locked && (
                      <button
                        aria-label="Rotate"
                        className="apx-pre4-rotate"
                        onPointerDown={(event) => beginRotate(event, id)}
                      />
                    )}
                  </div>
                );
              })}

              {activeTool === 'paths' &&
              primaryPath &&
              selected.includes(primaryPath.id) &&
              !primaryPath.transform?.locked &&
              visualPathProps(primaryPath).tool !== 'connector' ? (
                <svg
                  width={project.document.width}
                  height={project.document.height}
                  viewBox={'0 0 ' + project.document.width + ' ' + project.document.height}
                  aria-label="Path point editor"
                  data-path-edit-overlay={primaryPath.id}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                    pointerEvents: 'none',
                    zIndex: 10000,
                  }}
                >
                  {editablePathHandles(visualPathProps(primaryPath)).map((pathHandle) => {
                    const point = pathLocalToDocumentPoint(
                      primaryPath,
                      visualPathProps(primaryPath),
                      pathHandle,
                    );
                    const handleKey =
                      pathHandle.commandIndex +
                      ':' +
                      pathHandle.label +
                      (pathHandle.pointIndex === undefined
                        ? ''
                        : ':' + pathHandle.pointIndex);
                    return (
                      <circle
                        key={handleKey}
                        cx={point.x}
                        cy={point.y}
                        r={pathHandle.role === 'control' ? 5 : 6}
                        fill={pathHandle.role === 'control' ? '#f59e0b' : '#38bdf8'}
                        stroke="#020617"
                        strokeWidth="2"
                        pointerEvents="all"
                        style={{ cursor: 'move' }}
                        data-path-point-handle={handleKey}
                        data-path-control-handle={
                          pathHandle.role === 'control' ? handleKey : undefined
                        }
                        data-path-command-index={pathHandle.commandIndex}
                        onPointerDown={(event) =>
                          beginPathPointEdit(event, primaryPath.id, pathHandle)
                        }
                      />
                    );
                  })}
                </svg>
              ) : null}

              {selectedGroups.map((node) => {
                const rect = nodeRect(node);
                return (
                  <div
                    key={'group-overlay-' + node.id}
                    className="apx-pre4-group-overlay"
                    style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
                  >
                    <span>{node.name ?? 'Group'}</span>
                  </div>
                );
              })}

              {marquee && (
                <div
                  className="apx-pre4-marquee"
                  style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height }}
                />
              )}
              </div>
            </div>
          </div>
        </main>

        <aside className="apx-pre4-inspector">
          <div className="apx-pre4-inspector-tabs">
            {inspectorTabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-inspector-tab={id}
                data-active={inspectorTab === id ? 'true' : undefined}
                onClick={() => setInspectorTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="apx-pre4-inspector-body">
            {renderInspector()}
          </div>
        </aside>

        <section className="apx-pre4-dock" data-collapsed={dockCollapsed ? 'true' : undefined}>
          <div className="apx-pre4-dock-main">
            <div className="apx-pre4-dock-tabs">
              <div>
                {dockTabs.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    data-dock-tab={id}
                    data-active={dockTab === id ? 'true' : undefined}
                    onClick={() => {
                      setDockTab(id);
                      setDockCollapsed(false);
                    }}
                  >
                    {label}
                    {id === 'diagnostics' && (error || previewWarnings.length) ? (
                      <span className="apx-pre4-badge">{1 + previewWarnings.length}</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <button
                className="apx-pre4-dock-collapse"
                type="button"
                onClick={() => setDockCollapsed((value) => !value)}
                title={dockCollapsed ? 'Expand dock' : 'Collapse dock'}
              >
                {dockCollapsed ? '⌃' : '⌄'}
              </button>
            </div>
            {!dockCollapsed && <div className="apx-pre4-dock-content">{renderDock()}</div>}
          </div>

          {!dockCollapsed && (
            <aside className="apx-pre4-assets-pane">
              <div className="apx-pre4-assets-head">
                <div>
                  <strong>Assets</strong>
                  <span>{assets.length}</span>
                </div>
                <button type="button" onClick={() => setDockTab('assets')}>＋ Upload</button>
              </div>
              <div className="apx-pre4-asset-tabs" role="tablist" aria-label="Asset categories">
                {([
                  ['image', 'Images'],
                  ['font', 'Fonts'],
                  ['audio', 'Audio'],
                  ['video', 'Video'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={assetFilter === id}
                    data-active={assetFilter === id ? 'true' : undefined}
                    onClick={() => setAssetFilter(id)}
                  >
                    {label}
                    <span>{assets.filter((asset) => assetKind(asset.mime) === id).length}</span>
                  </button>
                ))}
              </div>
              <div className="apx-pre4-assets-grid">
                {filteredAssets.length ? filteredAssets.slice(0, 9).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    title={
                      asset.mime.startsWith('image/')
                        ? 'Insert ' + asset.name
                        : isStudioFontAsset(asset)
                          ? 'Apply ' + studioAssetFontFamily(asset)
                          : asset.name
                    }
                    onClick={() => {
                      if (asset.mime.startsWith('image/')) {
                        insertImageAsset(asset);
                        return;
                      }
                      if (isStudioFontAsset(asset)) {
                        applyFontAsset(asset);
                        return;
                      }
                      setDockTab('assets');
                    }}
                  >
                    {asset.mime.startsWith('image/') ? (
                      <img src={'data:' + asset.mime + ';base64,' + asset.base64} alt="" />
                    ) : (
                      <span>{asset.mime.startsWith('video/') ? '▷' : asset.mime.startsWith('audio/') ? '♪' : assetKind(asset.mime) === 'font' ? 'Aa' : '◆'}</span>
                    )}
                    <small>{asset.name}</small>
                  </button>
                )) : (
                  <button type="button" onClick={() => setDockTab('assets')} className="apx-pre4-assets-empty">
                    <span>＋</span>
                    <small>No {assetFilter} assets</small>
                  </button>
                )}
              </div>
            </aside>
          )}
        </section>
      </div>

      <VisualPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        name={project.name}
        onNameChange={renameCanvas}
        previewUrl={modalPreviewUrl}
        previewMime={modalPreviewMime}
        loading={modalPreviewLoading}
        error={modalPreviewError}
        onDownload={downloadCanvasPreview}
      />

      <VisualCodeModal
        open={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        source={codeSource || generated.value?.source || ''}
        fileName={codeFileName}
        onFileNameChange={updateCodeFileName}
        onCopy={() => void navigator.clipboard.writeText(codeSource || generated.value?.source || '')}
        onDownload={() => downloadTextFile(codeSource || generated.value?.source || '', codeFileName)}
      />

      <footer className="apx-pre4-statusbar">
        <span className="apx-pre4-status-product">Apexify Studio</span>
        <span className="apx-pre4-save-state" data-dirty={dirty ? 'true' : undefined}>
          <i /> {dirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <span className="apx-pre4-status-message" title={message}>{message}</span>
        <span className="apx-pre4-build-motto">Build something extraordinary. ✦</span>
        <span className="sr-only">Visual workspace ready · Code · Assets · Diagnostics · History</span>
      </footer>
    </div>
  );
}
