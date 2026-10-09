'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
  type ReactNode,
  type CSSProperties,
} from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowsPointingOutIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleStackIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  HandRaisedIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlayIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  TrashIcon,
  VideoCameraIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  createApexifyWebRuntime,
  type ApexifyWebRuntime,
  type WebStudioPreviewBounds,
} from '@apexify/web';
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
  GradientEditor,
  VisualImageBatchInspector,
  VisualImageInspector,
} from '@/components/studio/visual/VisualImageInspector';
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
import {
  VisualAdvancedContext,
  VisualAdvancedInspector,
} from '@/components/studio/visual/VisualAdvancedAuthoring';
import {
  VisualCanvasInspector,
  type CanvasVideoFrameExtractionRequest,
} from '@/components/studio/visual/VisualCanvasInspector';
import { useStudioSharedSession } from '@/components/studio/StudioSharedSession';
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
import {
  defaultPhase13Timeline,
  phase13Timeline,
  setPhase13Timeline,
} from '@/lib/studio/visual/video-authoring-contract';
import { hasPhase14Authoring } from '@/lib/studio/visual/phase14-codegen';
import {
  PHASE14_HOSTED_EXCLUSIONS,
  phase14AdvancedState,
  phase14OutputSettings,
} from '@/lib/studio/visual/advanced-authoring-contract';
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
import {
  createPhase15ProjectExport,
  lintGeneratedTypeScript,
  phase15CleanGeneratedSource,
  phase15ExportedCode,
  type Phase15AssetExportStrategy,
} from '@/lib/studio/visual/export-contract';
import {
  PHASE17_AUTOSAVE_STORAGE_KEY,
  PHASE17_CODE_DEBOUNCE_MS,
  PHASE17_PERFORMANCE_BUDGETS,
  PHASE17_PROJECT_AUTOSAVE_MS,
  Phase17AssetDataUrlCache,
  Phase17LatestTransaction,
  createPhase17AutosaveEnvelope,
  phase17AssetManifestMatches,
  phase17LargeDocumentMode,
  phase17LayerTreeMode,
  recoverPhase17Autosave,
  visualProjectSemanticSignature,
  type Phase17AssetManifestEntry,
} from '@/lib/studio/visual/hardening';
import type {
  VisualBlendMode,
  VisualCanvasConfig,
  VisualImageFilter,
  VisualGradient,
  VisualImageNodeProps,
  VisualNode,
  VisualProject,
  VisualShapeType,
  VisualTextNodeProps,
  VisualTransform,
  VisualValue,
} from '@/lib/studio/visual/model';
import {
  IMAGE_ALIGNS,
  IMAGE_BLEND_MODES,
  IMAGE_FILTER_TYPES,
  IMAGE_FILTER_PARAMETERLESS_TYPES,
  IMAGE_FITS,
  defaultVisualImageFilter,
  imageFilterFieldSpecs,
  updateVisualImageFilterValue,
  IMAGE_SHAPE_TYPES,
  defaultImageNodeProps,
  defaultShapeNodeProps,
  imageBatchGroupPropsRecord,
  imagePropsRecord,
  visualImageBatchGroupProps,
  visualImageProps,
} from '@/lib/studio/visual/image-contract';
import {
  TEXT_ALIGNMENTS,
  TEXT_BASELINES,
  TEXT_CURVE_MODES,
  defaultTextNodeProps,
  isTextBatchGroup,
  measureVisualTextInBrowser,
  textBatchGroupPropsRecord,
  textPropsRecord,
  visualTextBatchGroupProps,
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
  return visualProjectSemanticSignature(project);
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

type VisualNoticeKind = 'info' | 'success' | 'warning' | 'error' | 'loading';
type VisualNotice = {
  id: number;
  kind: VisualNoticeKind;
  title: string;
  text?: string;
} | null;

type BrowserVideoFrame = {
  base64: string;
  mime: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  duration: number;
  fps: number;
  time: number;
};

type FrameCallbackMetadataLike = { mediaTime: number };
type FrameCapableVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: FrameCallbackMetadataLike) => void,
  ) => number;
};

function waitForMediaEvent(
  media: HTMLMediaElement,
  eventName: 'loadedmetadata' | 'seeked' | 'loadeddata',
  timeoutMs = 8000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Video decoding timed out while waiting for ' + eventName + '.'));
    }, timeoutMs);
    const cleanup = () => {
      window.clearTimeout(timer);
      media.removeEventListener(eventName, onReady);
      media.removeEventListener('error', onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('The browser could not decode this video asset.'));
    };
    media.addEventListener(eventName, onReady, { once: true });
    media.addEventListener('error', onError, { once: true });
  });
}

async function estimateBrowserVideoFps(video: HTMLVideoElement): Promise<number> {
  const frameVideo = video as FrameCapableVideo;
  if (!frameVideo.requestVideoFrameCallback) return 30;

  const mediaTimes: number[] = [];
  video.muted = true;
  video.playsInline = true;
  video.currentTime = 0;
  try {
    await waitForMediaEvent(video, 'seeked', 3500);
  } catch {
    // Some browsers do not emit seeked when currentTime is already zero.
  }

  return new Promise<number>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.pause();
      const deltas = mediaTimes
        .slice(1)
        .map((value, index) => value - mediaTimes[index]!)
        .filter((value) => Number.isFinite(value) && value > 0.001 && value < 0.2)
        .sort((a, b) => a - b);
      const median = deltas.length ? deltas[Math.floor(deltas.length / 2)]! : 0;
      const fps = median > 0 ? 1 / median : 30;
      resolve(Math.max(1, Math.min(240, Math.round(fps * 1000) / 1000)));
    };
    const timer = window.setTimeout(finish, 1100);
    const sample = (_now: number, metadata: FrameCallbackMetadataLike) => {
      mediaTimes.push(metadata.mediaTime);
      if (mediaTimes.length >= 10) {
        window.clearTimeout(timer);
        finish();
        return;
      }
      frameVideo.requestVideoFrameCallback?.(sample);
    };
    void video.play().then(
      () => frameVideo.requestVideoFrameCallback?.(sample),
      () => {
        window.clearTimeout(timer);
        finish();
      },
    );
  });
}

function browserCanvasBlob(
  canvas: HTMLCanvasElement,
  format: 'jpg' | 'png',
  quality: number,
): Promise<Blob> {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const jpegQuality =
    format === 'jpg'
      ? Math.max(0.12, Math.min(1, 1 - ((quality - 1) / 30) * 0.88))
      : undefined;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Could not encode the extracted video frame.')),
      mime,
      jpegQuality,
    );
  });
}

function bytesAsBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function extractStudioVideoFrameInBrowser(
  asset: StudioVirtualAsset,
  request: CanvasVideoFrameExtractionRequest,
  fpsHint?: number,
): Promise<BrowserVideoFrame> {
  if (!asset.mime.startsWith('video/')) {
    throw new Error(asset.name + ' is not a video asset.');
  }

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = studioAssetDataUrl(asset);

  try {
    await waitForMediaEvent(video, 'loadedmetadata', 9000);
    const duration = Number.isFinite(video.duration) ? video.duration : asset.metadata?.duration ?? 0;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Could not determine the uploaded video duration.');
    }

    let fps =
      typeof fpsHint === 'number' && Number.isFinite(fpsHint) && fpsHint > 0
        ? fpsHint
        : typeof asset.metadata?.fps === 'number' &&
            Number.isFinite(asset.metadata.fps) &&
            asset.metadata.fps > 0
          ? asset.metadata.fps
          : 0;

    if (request.mode === 'frame' && fps <= 0) {
      fps = await estimateBrowserVideoFps(video);
    }
    if (fps <= 0) fps = 30;

    const targetTime =
      request.mode === 'time'
        ? request.time
        : (Math.max(1, Math.round(request.frame)) - 1) / fps;

    if (targetTime < 0 || targetTime >= duration) {
      throw new Error(
        request.mode === 'frame'
          ? 'Requested frame ' + request.frame + ' is outside this video.'
          : 'Requested time ' + request.time + 's is outside this video.',
      );
    }

    video.pause();
    const safeTime = Math.min(targetTime, Math.max(0, duration - 0.001));
    const seekPromise = waitForMediaEvent(video, 'seeked', 9000);
    video.currentTime = safeTime;
    await seekPromise;

    const width = video.videoWidth || asset.metadata?.width || 0;
    const height = video.videoHeight || asset.metadata?.height || 0;
    if (width < 1 || height < 1) {
      throw new Error('The browser decoded the video but did not expose frame dimensions.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable for local frame extraction.');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await browserCanvasBlob(canvas, request.format, request.quality);
    const base64 = bytesAsBase64(new Uint8Array(await blob.arrayBuffer()));
    return {
      base64,
      mime: request.format === 'png' ? 'image/png' : 'image/jpeg',
      width: canvas.width,
      height: canvas.height,
      duration,
      fps,
      time: safeTime,
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
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
    assetStorageReady,
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
  const [autosaveState, setAutosaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastAutosavedAt, setLastAutosavedAt] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState('canvas');
  const [inspectorTab, setInspectorTab] = useState<
    'style' | 'transform' | 'effects' | 'data' | 'advanced'
  >('style');
  const [dockTab, setDockTab] = useState<
    'generated' | 'diagnostics' | 'assets' | 'history' | 'timeline'
  >('generated');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(true);
  const [leftPanelMode, setLeftPanelMode] = useState<'layers' | 'context'>('layers');
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [layersWidth, setLayersWidth] = useState(274);
  const [inspectorWidth, setInspectorWidth] = useState(372);
  const [dockHeight, setDockHeight] = useState(204);
  const [assetFilter, setAssetFilter] = useState<'image' | 'font' | 'audio' | 'video'>('image');
  const [codeSource, setCodeSource] = useState('');
  const [codeFileName, setCodeFileName] = useState('landing-page.ts');
  const [codeSyncState, setCodeSyncState] = useState<'synced' | 'saving' | 'error'>('synced');
  const [codeSyncError, setCodeSyncError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [assetExportStrategy, setAssetExportStrategy] = useState<Phase15AssetExportStrategy>('files');
  const [includeProjectSource, setIncludeProjectSource] = useState(true);
  const [includePackageScaffold, setIncludePackageScaffold] = useState(true);
  const [includeCodeProvenance, setIncludeCodeProvenance] = useState(false);
  const [modalPreviewUrl, setModalPreviewUrl] = useState<string | null>(null);
  const [modalPreviewDownloadUrl, setModalPreviewDownloadUrl] = useState<string | null>(null);
  const [modalPreviewMime, setModalPreviewMime] = useState('image/png');
  const [modalPreviewFileName, setModalPreviewFileName] = useState('preview.png');
  const [modalPreviewLoading, setModalPreviewLoading] = useState(false);
  const [modalPreviewError, setModalPreviewError] = useState<string | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [imageConfigDraft, setImageConfigDraft] = useState('{}');
  const [imageConfigError, setImageConfigError] = useState<string | null>(null);
  const [textConfigDraft, setTextConfigDraft] = useState('{}');
  const [textConfigError, setTextConfigError] = useState<string | null>(null);
  const [pathConfigDraft, setPathConfigDraft] = useState('{}');
  const [pathConfigError, setPathConfigError] = useState<string | null>(null);
  const [inlineTextEditId, setInlineTextEditId] = useState<string | null>(null);
  const [artboardPreviewUrl, setArtboardPreviewUrl] = useState<string | null>(null);
  const [artboardPreviewBounds, setArtboardPreviewBounds] = useState<WebStudioPreviewBounds | null>(null);
  const [artboardPreviewBusy, setArtboardPreviewBusy] = useState(false);
  const [canvasFrameExtracting, setCanvasFrameExtracting] = useState(false);
  const [visualNotice, setVisualNotice] = useState<VisualNotice>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
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
  const assetInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const cleanSignature = useRef('');
  const propertyBefore = useRef<VisualProject | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const didInitialFit = useRef(false);
  const webRuntimeRef = useRef<ApexifyWebRuntime | null>(null);
  const artboardRuntimeRef = useRef<ApexifyWebRuntime | null>(null);
  const codeSaveTimerRef = useRef<number>(0);
  const phase17AutosaveTimerRef = useRef<number>(0);
  const phase17PersistSnapshotRef = useRef<() => void>(() => {});
  const phase17HydratedRef = useRef(false);
  const phase17CodeBaseSignatureRef = useRef('');
  const phase17RecoveredAssetManifestRef = useRef<Phase17AssetManifestEntry[] | null>(null);
  const phase17RecoverySignatureRef = useRef('');
  const phase17AssetManifestCheckedRef = useRef(false);
  const phase17CodeTransactionsRef = useRef(new Phase17LatestTransaction());
  const phase17AssetCacheRef = useRef(new Phase17AssetDataUrlCache());
  const panelResizeRef = useRef<{
    kind: 'layers' | 'inspector' | 'dock';
    start: number;
    initial: number;
  } | null>(null);
  const globalKeyboardHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});
  const codeAppliedSignatureRef = useRef('');
  const codeHydratedRef = useRef(false);
  const fileNameTouchedRef = useRef(false);
  const artboardPreviewTimerRef = useRef<number>(0);
  const visualNoticeTimerRef = useRef<number>(0);
  const browserVideoFpsCacheRef = useRef(new Map<string, number>());
  const phase10RenderTailRef = useRef<Promise<void>>(Promise.resolve());
  const freehandDraftRef = useRef<Point[]>([]);

  if (!cleanSignature.current) cleanSignature.current = semanticSignature(project);

  const flashVisualNotice = (
    kind: VisualNoticeKind,
    title: string,
    text?: string,
    timeoutMs = kind === 'loading' ? 0 : kind === 'error' ? 6500 : 4200,
  ) => {
    window.clearTimeout(visualNoticeTimerRef.current);
    setVisualNotice({ id: Date.now(), kind, title, text });
    visualNoticeTimerRef.current = 0;
    if (timeoutMs > 0) {
      visualNoticeTimerRef.current = window.setTimeout(
        () => setVisualNotice(null),
        timeoutMs,
      );
    }
  };

  const projectSemanticSignature = useMemo(() => semanticSignature(project), [project]);
  const selected = project.editor?.selectedNodeIds ?? [];
  const selectedParentId = selected.length
    ? project.document.nodes[selected[0]]?.parentId ?? null
    : null;
  const canGroupSelection =
    selected.length >= 2 &&
    selected.every((id) => {
      const node = project.document.nodes[id];
      return Boolean(node) && (node?.parentId ?? null) === selectedParentId;
    });
  const canUngroupSelection = selected.some((id) => {
    const node = project.document.nodes[id];
    return Boolean(
      node &&
        node.kind === 'group' &&
        (node.childIds?.length ?? 0) > 0,
    );
  });
  const primary = selected.length
    ? project.document.nodes[selected[selected.length - 1]]
    : undefined;
  const primaryText = primary?.kind === 'text' ? primary : undefined;
  const primaryTextBatch =
    primary?.kind === 'group' && isTextBatchGroup(primary)
      ? primary
      : undefined;
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
  const layerIds = useMemo(
    () => flattenLayerIds(project),
    [projectSemanticSignature],
  );
  const layerTreeMode = phase17LayerTreeMode(layerIds.length);
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
    [layerIds, projectSemanticSignature],
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

  const resolveInheritedCanvasDimensions = (source: string) => {
    const assetId = studioAssetIdFromReference(source);
    if (!assetId) return null;
    const asset = assets.find((item) => item.id === assetId);
    const width = asset?.metadata?.width;
    const height = asset?.metadata?.height;
    if (
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 1 ||
      height < 1
    ) {
      return null;
    }
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  };

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
  }, [projectSemanticSignature]);

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
  }, [projectSemanticSignature]);

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
  }, [projectSemanticSignature]);

  const phase9Active = useMemo(() => hasPhase9Authoring(project), [projectSemanticSignature]);
  const imageNativeRuntimeActive = useMemo(
    () =>
      Object.values(project.document.nodes).some((node) => {
        if (node.kind === 'group') {
          const batch = visualImageBatchGroupProps(node);
          return Boolean(
            batch?.createOptions.isGrouped === true &&
              batch.createOptions.groupTransform,
          );
        }
        if (node.kind !== 'image' && node.kind !== 'shape') return false;
        const image = visualImageProps(node);
        const complexStroke = Boolean(image.stroke);
        const complexShadow = Boolean(image.shadow);
        return Boolean(
          image.blur ||
            image.borderPosition ||
            image.boxBackground ||
            image.mask ||
            image.clipPath?.length ||
            image.distortion ||
            image.meshWarp ||
            image.effects ||
            complexStroke ||
            complexShadow ||
            (image.filterIntensity !== undefined && image.filterIntensity !== 1) ||
            (image.filterOrder !== undefined && image.filterOrder !== 'post')
        );
      }),
    [projectSemanticSignature],
  );
  const phase10Active = useMemo(() => hasPhase10Authoring(project), [projectSemanticSignature]);
  const phase11Active = useMemo(() => hasPhase11Authoring(project), [projectSemanticSignature]);
  const phase12Active = useMemo(() => hasPhase12Authoring(project), [projectSemanticSignature]);
  const phase13Active = useMemo(() => hasPhase13Authoring(project), [projectSemanticSignature]);
  const phase14Active = useMemo(() => hasPhase14Authoring(project), [projectSemanticSignature]);
  const canonicalLinkedSource = generated.value?.source ?? codeSource;
  const exportedCodeSource = useMemo(
    () => phase15ExportedCode(project, canonicalLinkedSource, includeCodeProvenance),
    [projectSemanticSignature, canonicalLinkedSource, includeCodeProvenance],
  );
  const exportCodeQuality = useMemo(
    () => lintGeneratedTypeScript(exportedCodeSource),
    [exportedCodeSource],
  );
  const largeCodeMode = phase17LargeDocumentMode(codeSource);

  useEffect(() => {
    setDirty(projectSemanticSignature !== cleanSignature.current);
    projectRef.current = project;
  }, [project, projectSemanticSignature]);

  useEffect(() => {
    if (phase17HydratedRef.current) return;
    phase17HydratedRef.current = true;

    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(PHASE17_AUTOSAVE_STORAGE_KEY);
    } catch {}

    if (!raw) {
      try {
        const legacyRaw = window.localStorage.getItem(VISUAL_CODE_STORAGE_KEY);
        if (legacyRaw) {
          const legacy = JSON.parse(legacyRaw) as {
            source?: unknown;
            fileName?: unknown;
          };
          if (typeof legacy.source === 'string' && legacy.source.trim()) {
            const currentSignature = semanticSignature(projectRef.current);
            codeHydratedRef.current = true;
            phase17RecoverySignatureRef.current = currentSignature;
            phase17CodeBaseSignatureRef.current = 'legacy-code-without-project-snapshot';
            setCodeSource(legacy.source);
            if (typeof legacy.fileName === 'string' && legacy.fileName) {
              setCodeFileName(legacy.fileName);
            }
            setDockTab('generated');
            setDockCollapsed(false);
            setCodeSyncState('error');
            setCodeSyncError(
              'Legacy linked code was recovered without a matching Visual Project snapshot. It was quarantined and will not overwrite Visual state; fork it to Code Studio or restore canonical Visual code.',
            );
            setMessage('Legacy linked code recovered safely · Visual overwrite blocked');
            return;
          }
        }
      } catch {}
    }

    const recovered = recoverPhase17Autosave(raw);
    if (recovered.ok) {
      const { envelope } = recovered;
      let recoveredProject = envelope.project;
      let recoveredCodeSource = envelope.code.source;
      let recoveredCodeFileName = envelope.code.fileName || 'visual-project.ts';
      let recoveredSyncState = recovered.codeMayApply
        ? (envelope.code.syncState ?? 'synced')
        : 'error';
      let recoveredSyncError = recovered.codeMayApply
        ? envelope.code.syncError ?? null
        : 'Recovered code was based on an older Visual Project. Restore canonical Visual code or fork the stale edit to Code Studio.';
      let recoveredMessage = recovered.warnings.length
        ? 'Recovered Visual session · ' + recovered.warnings.join(' ')
        : 'Recovered Visual session';

      // A previous build may have autosaved a legitimate live-code edit as a
      // Phase-11 conflict. Re-run reconciliation during recovery so the fix
      // takes effect immediately instead of forcing the user to discard code.
      if (
        recovered.codeMayApply &&
        recoveredCodeSource &&
        recoveredSyncState === 'error'
      ) {
        const retried = reconcileVisualProjectFromCode(
          recoveredProject,
          recoveredCodeSource,
          resolveInheritedCanvasDimensions,
        );
        if (retried.ok) {
          recoveredProject = retried.project;
          const canonical = generateVisualProjectCode(recoveredProject);
          recoveredCodeSource = canonical.source;
          recoveredCodeFileName = canonical.fileName;
          recoveredSyncState = 'synced';
          recoveredSyncError = null;
          recoveredMessage = 'Recovered Visual session · live code reconciled';
        }
      }

      setAutosaveState('saved');
      setLastAutosavedAt(envelope.savedAt);
      const recoveredSignature = semanticSignature(recoveredProject);
      projectRef.current = recoveredProject;
      cleanSignature.current = recoveredSignature;
      setProject(recoveredProject);
      setZoom(envelope.ui.zoom);
      setPan(envelope.ui.pan);
      setActiveTool(envelope.ui.activeTool);
      setInspectorTab(envelope.ui.inspectorTab);
      if (recoveredSyncState !== 'error') {
        setDockTab(envelope.ui.dockTab === 'assets' ? 'generated' : envelope.ui.dockTab);
        setDockCollapsed(envelope.ui.dockCollapsed);
      } else {
        setDockTab('generated');
        setDockCollapsed(false);
      }
      setLayersCollapsed(envelope.ui.layersCollapsed);
      setInspectorCollapsed(envelope.ui.inspectorCollapsed);
      setLayersWidth(envelope.ui.layersWidth);
      setInspectorWidth(envelope.ui.inspectorWidth);
      setDockHeight(envelope.ui.dockHeight);
      setCollapsed(new Set(envelope.ui.collapsedLayerIds));
      didInitialFit.current = true;
      phase17RecoveredAssetManifestRef.current = envelope.assets;
      phase17CodeBaseSignatureRef.current = recoveredSignature;
      codeHydratedRef.current = true;
      phase17RecoverySignatureRef.current = recoveredSignature;
      codeAppliedSignatureRef.current = recoveredSignature;
      setCodeSource(recoveredCodeSource);
      setCodeFileName(recoveredCodeFileName);
      setCodeSyncState(recoveredSyncState);
      setCodeSyncError(recoveredSyncError);
      setMessage(recoveredMessage);
      return;
    }

    if (raw) {
      try {
        window.localStorage.setItem(
          PHASE17_AUTOSAVE_STORAGE_KEY + '-corrupt-' + Date.now(),
          raw,
        );
        window.localStorage.removeItem(PHASE17_AUTOSAVE_STORAGE_KEY);
      } catch {}
      setMessage('Corrupt Visual autosave was isolated; a fresh project was opened.');
    }
  }, []);

  const persistLiveCode = (source: string, fileName: string) => {
    try {
      window.localStorage.setItem(
        VISUAL_CODE_STORAGE_KEY,
        JSON.stringify({ source, fileName, savedAt: Date.now() }),
      );
    } catch {}
  };

  const persistPhase17Snapshot = () => {
    if (!phase17HydratedRef.current || !codeHydratedRef.current) return;
    const current = projectRef.current;
    const currentSignature = semanticSignature(current);
    try {
      const envelope = createPhase17AutosaveEnvelope({
        project: current,
        code: {
          source: codeSource,
          fileName: codeFileName,
          savedAt: Date.now(),
          baseProjectSignature:
            phase17CodeBaseSignatureRef.current || currentSignature,
          syncState: codeSyncState,
          syncError: codeSyncError,
        },
        ui: {
          zoom,
          pan,
          activeTool,
          inspectorTab,
          dockTab,
          dockCollapsed,
          layersCollapsed,
          inspectorCollapsed,
          layersWidth,
          inspectorWidth,
          dockHeight,
          collapsedLayerIds: [...collapsed],
        },
        assets,
      });
      window.localStorage.setItem(
        PHASE17_AUTOSAVE_STORAGE_KEY,
        JSON.stringify(envelope),
      );
      setAutosaveState('saved');
      setLastAutosavedAt(envelope.savedAt);
    } catch (error) {
      const autosaveError =
        error instanceof Error ? error.message : 'Browser storage failed.';
      setAutosaveState('error');
      setMessage('Autosave unavailable · ' + autosaveError);
      flashVisualNotice(
        'error',
        'Autosave failed',
        autosaveError + ' Your current in-memory canvas is still open.',
      );
    }
  };

  phase17PersistSnapshotRef.current = persistPhase17Snapshot;

  const applyCodeToVisual = (
    source: string,
    expectedProjectSignature = phase17CodeBaseSignatureRef.current,
  ) => {
    const current = projectRef.current;
    const currentSignature = semanticSignature(current);
    if (
      expectedProjectSignature &&
      expectedProjectSignature !== currentSignature
    ) {
      setCodeSyncState('error');
      setCodeSyncError(
        'Linked code is stale because the Visual Project changed after this edit began. Restore canonical Visual code or fork the edit to Code Studio.',
      );
      return false;
    }

    const result = reconcileVisualProjectFromCode(
      current,
      source,
      resolveInheritedCanvasDimensions,
    );
    if (!result.ok) {
      setCodeSyncState('error');
      setCodeSyncError(result.error);
      return false;
    }

    setCodeSyncError(null);
    setCodeSyncState('synced');
    const resultSignature = semanticSignature(result.project);
    phase17CodeBaseSignatureRef.current = resultSignature;

    const markerBacked =
      /\/\*\s*apexify-studio-v(?:9|10|11|12|13|14):/.test(source);
    if (markerBacked) {
      try {
        const canonical = generateVisualProjectCode(result.project);
        setCodeSource(canonical.source);
        if (!fileNameTouchedRef.current) setCodeFileName(canonical.fileName);
        persistLiveCode(
          canonical.source,
          fileNameTouchedRef.current ? codeFileName : canonical.fileName,
        );
      } catch {
        // The reconciled Visual project remains authoritative. The regular
        // generated-code effect will repair the linked source if needed.
      }
    }

    if (!result.changed) return true;

    history.current.commit(current, result.project, 'Code → Visual');
    codeAppliedSignatureRef.current = resultSignature;
    projectRef.current = result.project;
    setProject(result.project);
    setHistoryTick((value) => value + 1);
    setMessage('Code synced to canvas');
    return true;
  };

  const saveLiveCode = (source = codeSource, fileName = codeFileName) => {
    window.clearTimeout(codeSaveTimerRef.current);
    phase17CodeTransactionsRef.current.cancel();
    persistLiveCode(source, fileName);
    const ok = applyCodeToVisual(source);
    if (ok) setMessage('Code autosaved · canvas synced');
  };

  const updateLiveCode = (next: string) => {
    const nextBytes = new TextEncoder().encode(next).byteLength;
    if (nextBytes > PHASE17_PERFORMANCE_BUDGETS.maxLinkedCodeBytes) {
      window.clearTimeout(codeSaveTimerRef.current);
      phase17CodeTransactionsRef.current.cancel();
      setCodeSource(next);
      setCodeSyncState('error');
      setCodeSyncError(
        'Linked code exceeds the Phase-17 automatic reconciliation budget. Fork it to Code Studio or reduce the document before syncing.',
      );
      return;
    }
    if (codeSyncState === 'synced' || !phase17CodeBaseSignatureRef.current) {
      phase17CodeBaseSignatureRef.current = semanticSignature(projectRef.current);
    }
    const expectedSignature = phase17CodeBaseSignatureRef.current;
    const transaction = phase17CodeTransactionsRef.current.begin();
    setCodeSource(next);
    setCodeSyncState('saving');
    setCodeSyncError(null);
    window.clearTimeout(codeSaveTimerRef.current);
    codeSaveTimerRef.current = window.setTimeout(() => {
      if (!phase17CodeTransactionsRef.current.isCurrent(transaction)) return;
      persistLiveCode(next, codeFileName);
      applyCodeToVisual(next, expectedSignature);
    }, PHASE17_CODE_DEBOUNCE_MS);
  };

  useEffect(() => {
    if (codeHydratedRef.current || !generated.value) return;
    codeHydratedRef.current = true;
    phase17CodeBaseSignatureRef.current = projectSemanticSignature;
    setCodeSource(generated.value.source);
    setCodeFileName(generated.value.fileName);
    setCodeSyncState('synced');
    setCodeSyncError(null);
    persistLiveCode(generated.value.source, generated.value.fileName);
  }, [generated.value, projectSemanticSignature]);

  useEffect(() => {
    if (!codeHydratedRef.current || !generated.value) return;
    const signature = semanticSignature(project);
    if (phase17RecoverySignatureRef.current) {
      if (signature !== phase17RecoverySignatureRef.current) return;
      phase17RecoverySignatureRef.current = '';
      codeAppliedSignatureRef.current = '';
      return;
    }
    if (codeAppliedSignatureRef.current === signature) {
      codeAppliedSignatureRef.current = '';
      return;
    }

    window.clearTimeout(codeSaveTimerRef.current);
    phase17CodeTransactionsRef.current.cancel();
    phase17CodeBaseSignatureRef.current = signature;
    setCodeSource(generated.value.source);
    if (!fileNameTouchedRef.current) setCodeFileName(generated.value.fileName);
    setCodeSyncState('synced');
    setCodeSyncError(null);
    persistLiveCode(
      generated.value.source,
      fileNameTouchedRef.current ? codeFileName : generated.value.fileName,
    );
  }, [generated.value?.source, generated.value?.fileName, projectSemanticSignature]);

  useEffect(() => {
    if (!phase17HydratedRef.current || !codeHydratedRef.current) return;
    setAutosaveState('saving');
    window.clearTimeout(phase17AutosaveTimerRef.current);
    phase17AutosaveTimerRef.current = window.setTimeout(
      persistPhase17Snapshot,
      PHASE17_PROJECT_AUTOSAVE_MS,
    );
    return () => window.clearTimeout(phase17AutosaveTimerRef.current);
  }, [
    projectSemanticSignature,
    codeSource,
    codeFileName,
    codeSyncState,
    codeSyncError,
    zoom,
    pan.x,
    pan.y,
    activeTool,
    inspectorTab,
    dockTab,
    dockCollapsed,
    layersCollapsed,
    inspectorCollapsed,
    layersWidth,
    inspectorWidth,
    dockHeight,
    collapsed,
    assets,
  ]);

  useEffect(() => {
    const flush = () => phase17PersistSnapshotRef.current();
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  useEffect(() => {
    phase17AssetCacheRef.current.prune(assets);
  }, [assets]);

  useEffect(() => {
    if (!assetStorageReady || phase17AssetManifestCheckedRef.current) return;
    const expected = phase17RecoveredAssetManifestRef.current;
    if (!expected) {
      phase17AssetManifestCheckedRef.current = true;
      return;
    }
    phase17AssetManifestCheckedRef.current = true;
    if (!phase17AssetManifestMatches(expected, assets)) {
      setMessage(
        'Recovered project references assets that differ from persisted Studio assets. Missing bytes were not fabricated.',
      );
    }
  }, [assetStorageReady, assets]);

  useEffect(() => {
    if (!assetStorageReady) return;
    const current = projectRef.current;
    const canvas = current.document.canvas;
    const inheritedBg =
      canvas?.customBg?.inherit
        ? canvas.customBg
        : canvas?.videoBg?.inherit
          ? canvas.videoBg
          : null;
    if (!inheritedBg) return;
    const dimensions = resolveInheritedCanvasDimensions(inheritedBg.source);
    if (!dimensions) return;
    if (
      current.document.width === dimensions.width &&
      current.document.height === dimensions.height
    ) {
      return;
    }

    didInitialFit.current = false;
    setProject((projectState) => {
      const activeCanvas = projectState.document.canvas;
      const activeBg =
        activeCanvas?.customBg?.inherit
          ? activeCanvas.customBg
          : activeCanvas?.videoBg?.inherit
            ? activeCanvas.videoBg
            : null;
      if (!activeBg || activeBg.source !== inheritedBg.source) {
        return projectState;
      }
      const next = structuredClone(projectState);
      next.document.width = dimensions.width;
      next.document.height = dimensions.height;
      next.updatedAt = new Date().toISOString();
      projectRef.current = next;
      return next;
    });
    setMessage(
      'Canvas inherited source resolution · ' +
        dimensions.width +
        ' × ' +
        dimensions.height,
    );
  }, [
    assetStorageReady,
    assets,
    project.document.canvas?.customBg?.source,
    project.document.canvas?.customBg?.inherit,
    project.document.canvas?.videoBg?.source,
    project.document.canvas?.videoBg?.inherit,
  ]);

  useEffect(() => {
    if (
      !assetStorageReady ||
      codeSyncState !== 'error' ||
      !codeSource.includes('inherit')
    ) {
      return;
    }
    applyCodeToVisual(
      codeSource,
      semanticSignature(projectRef.current),
    );
  }, [assetStorageReady, assets]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const resize = panelResizeRef.current;
      if (!resize) return;
      if (resize.kind === 'layers') {
        setLayersWidth(Math.max(190, Math.min(420, resize.initial + event.clientX - resize.start)));
      } else if (resize.kind === 'inspector') {
        setInspectorWidth(Math.max(300, Math.min(540, resize.initial - (event.clientX - resize.start))));
      } else {
        setDockHeight(Math.max(120, Math.min(480, resize.initial - (event.clientY - resize.start))));
      }
    };
    const onPointerUp = () => {
      panelResizeRef.current = null;
      document.body.removeAttribute('data-phase17-resizing');
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(codeSaveTimerRef.current);
      window.clearTimeout(phase17AutosaveTimerRef.current);
      phase17CodeTransactionsRef.current.cancel();
      phase17AssetCacheRef.current.clear();
      webRuntimeRef.current?.dispose();
      webRuntimeRef.current = null;
      artboardRuntimeRef.current?.dispose();
      artboardRuntimeRef.current = null;
      window.clearTimeout(artboardPreviewTimerRef.current);
      window.clearTimeout(visualNoticeTimerRef.current);
      browserVideoFpsCacheRef.current.clear();
    };
  }, []);

  const beginPanelResize = (
    kind: 'layers' | 'inspector' | 'dock',
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    event.preventDefault();
    const initial =
      kind === 'layers'
        ? layersWidth
        : kind === 'inspector'
          ? inspectorWidth
          : dockHeight;
    panelResizeRef.current = {
      kind,
      start: kind === 'dock' ? event.clientY : event.clientX,
      initial,
    };
    document.body.setAttribute('data-phase17-resizing', kind);
  };

  const resizePanelByKeyboard = (
    kind: 'layers' | 'inspector' | 'dock',
    event: ReactKeyboardEvent<HTMLElement>,
  ) => {
    const horizontal = kind !== 'dock';
    const negativeKey = horizontal ? 'ArrowLeft' : 'ArrowDown';
    const positiveKey = horizontal ? 'ArrowRight' : 'ArrowUp';
    if (event.key !== negativeKey && event.key !== positiveKey) return;
    event.preventDefault();
    const delta = (event.shiftKey ? 32 : 12) * (event.key === positiveKey ? 1 : -1);
    if (kind === 'layers') {
      setLayersWidth((value) => Math.max(190, Math.min(420, value + delta)));
    } else if (kind === 'inspector') {
      setInspectorWidth((value) => Math.max(300, Math.min(540, value + delta)));
    } else {
      setDockHeight((value) => Math.max(120, Math.min(480, value + delta)));
    }
  };

  const renderAuthoritativeVisualSource = async (
    source: string,
    displaySource = source,
  ) => {
    const activeCanvasConfig = projectRef.current.document.canvas ?? {};

    const validateVirtualCanvasSource = (
      value: string | undefined,
      expectedPrefix: 'image/' | 'video/',
      label: string,
    ) => {
      const sourceValue = value?.trim() ?? '';
      if (!sourceValue) return null;
      const id = studioAssetIdFromReference(sourceValue);
      if (!id) return null;
      const asset = assets.find((item) => item.id === id);
      if (!asset) {
        return label + ' references a Studio asset that is not loaded in this session.';
      }
      if (!asset.mime.startsWith(expectedPrefix)) {
        return (
          label +
          ' expects ' +
          expectedPrefix.slice(0, -1) +
          ' media, but ' +
          asset.name +
          ' is ' +
          asset.mime +
          '.'
        );
      }
      if (!asset.base64) {
        return label + ' references ' + asset.name + ', but its bytes are unavailable.';
      }
      return null;
    };

    const customBgSourceError = validateVirtualCanvasSource(
      activeCanvasConfig.customBg?.source,
      'image/',
      'customBg.source',
    );
    if (customBgSourceError) {
      return { ok: false as const, error: customBgSourceError };
    }

    const videoBgSourceError = validateVirtualCanvasSource(
      activeCanvasConfig.videoBg?.source,
      'video/',
      'videoBg.source',
    );
    if (videoBgSourceError) {
      return { ok: false as const, error: videoBgSourceError };
    }

    const activeVideoBg = activeCanvasConfig.videoBg;
    const activeVideoAssetId = activeVideoBg
      ? studioAssetIdFromReference(activeVideoBg.source)
      : null;
    const activeVideoAsset = activeVideoAssetId
      ? assets.find((asset) => asset.id === activeVideoAssetId)
      : undefined;
    const canRenderLocalVideoBg =
      codeSyncState === 'synced' &&
      Boolean(activeVideoBg && activeVideoAsset?.mime.startsWith('video/')) &&
      !phase10Active &&
      !phase11Active &&
      !phase12Active &&
      !phase13Active &&
      !phase14Active;

    if (canRenderLocalVideoBg && activeVideoBg && activeVideoAsset) {
      const frameRequest: CanvasVideoFrameExtractionRequest = {
        source: activeVideoBg.source,
        mode:
          activeVideoBg.time !== undefined && activeVideoBg.frame === undefined
            ? 'time'
            : 'frame',
        frame: Math.max(1, Math.round(activeVideoBg.frame ?? 1)),
        time: Math.max(0, activeVideoBg.time ?? 0),
        format: activeVideoBg.format ?? 'jpg',
        quality: Math.max(1, Math.min(31, Math.round(activeVideoBg.quality ?? 2))),
      };
      const localFrame = await extractStudioVideoFrameInBrowser(
        activeVideoAsset,
        frameRequest,
        browserVideoFpsCacheRef.current.get(activeVideoAsset.id),
      );
      browserVideoFpsCacheRef.current.set(activeVideoAsset.id, localFrame.fps);

      const previewAsset: StudioVirtualAsset = {
        id: '__visual-video-preview-' + activeVideoAsset.id,
        name: 'video-background-preview.' + frameRequest.format,
        mime: localFrame.mime,
        size: Math.max(0, Math.floor((localFrame.base64.length * 3) / 4)),
        base64: localFrame.base64,
        metadata: {
          width: localFrame.width,
          height: localFrame.height,
        },
      };
      const previewProject = structuredClone(projectRef.current);
      const previewCanvas = { ...(previewProject.document.canvas ?? {}) };
      delete previewCanvas.videoBg;
      previewCanvas.customBg = {
        source: studioAssetReference(previewAsset),
        inherit: activeVideoBg.inherit,
        fit: activeVideoBg.fit ?? 'fill',
        align: activeVideoBg.align ?? 'center',
        filters: activeVideoBg.filters ?? [],
        opacity: activeVideoBg.opacity ?? 1,
      };
      if (activeVideoBg.inherit) {
        previewProject.document.width = localFrame.width;
        previewProject.document.height = localFrame.height;
      }
      previewProject.document.canvas = previewCanvas;
      const previewSource =
        generateVisualProjectDisplayPreviewCode(previewProject).source;
      const previewAssets = [...assets, previewAsset];
      const runtime =
        webRuntimeRef.current ?? (webRuntimeRef.current = createApexifyWebRuntime());
      await runtime.registerFonts(previewAssets);
      const localResult = await runtime.renderStudioSource(
        previewSource,
        previewAssets,
      );
      if (!localResult.ok) {
        return { ok: false as const, error: localResult.error };
      }
      return {
        ok: true as const,
        dataUrl: localResult.dataUrl,
        downloadDataUrl: localResult.dataUrl,
        mime: localResult.mime,
        fileName: 'video-background-preview.' + frameRequest.format,
        warnings: localResult.warnings,
        results:
          ((localResult as typeof localResult & { results?: Record<string, unknown> }).results ?? {}),
        renderBounds: localResult.renderBounds,
      };
    }

    const canvasNeedsNodeRuntime =
      Boolean(activeCanvasConfig.videoBg) ||
      Boolean(activeCanvasConfig.customBg?.filters?.length) ||
      /\bvideoBg\s*:/.test(source);

    if (
      phase14Active ||
      phase13Active ||
      phase12Active ||
      phase11Active ||
      phase10Active ||
      imageNativeRuntimeActive ||
      canvasNeedsNodeRuntime
    ) {
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
        (phase13Active
          ? result.output.artifacts?.find((item) => item.base64 && item.mime.startsWith('video/'))
          : phase12Active
            ? result.output.artifacts?.find((item) => item.base64 && item.mime.startsWith('audio/'))
            : result.output.artifacts?.find((item) => item.base64 && item.mime.startsWith('image/'))) ??
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
          renderBounds: null as WebStudioPreviewBounds | null,
        };
      } finally {
        releasePhase10Render();
      }
    }

    const runtime =
      webRuntimeRef.current ?? (webRuntimeRef.current = createApexifyWebRuntime());
    await runtime.registerFonts(assets);

    // @apexify/web resolves studio://asset/<id> against the Studio asset
    // collection itself. Keep those virtual references intact: rewriting them
    // to data: URLs bypasses the runtime resolver and makes customBg/bgLayers
    // look like unsupported local sources, producing a transparent canvas.
    const result = await runtime.renderStudioSource(source, assets);
    if (!result.ok) return { ok: false as const, error: result.error };

    // A configured background must never silently degrade to a transparent
    // canvas. The web runtime reports decode/missing-source problems as
    // warnings so other layers can still render; for the primary background,
    // surface that warning as a render failure instead.
    if (activeCanvasConfig.customBg?.source) {
      const backgroundWarning = result.warnings.find(
        (warning) =>
          warning.startsWith('customBg:') ||
          warning.startsWith('customBg inherit:'),
      );
      if (backgroundWarning) {
        return { ok: false as const, error: backgroundWarning };
      }
    }

    return {
      ok: true as const,
      dataUrl: result.dataUrl,
      downloadDataUrl: result.dataUrl,
      mime: result.mime,
      fileName: 'preview',
      warnings: result.warnings,
      results:
        ((result as typeof result & { results?: Record<string, unknown> }).results ?? {}),
      renderBounds: result.renderBounds,
    };
  };

  useEffect(() => {
    window.clearTimeout(artboardPreviewTimerRef.current);
    if (!active || (!codeSource.trim() && !previewGenerated.value)) return;
    if (phase13Active || phase12Active) {
      setArtboardPreviewUrl(null);
      setArtboardPreviewBounds(null);
      return;
    }

    // The lower editor is a live rendering source, not merely generated text.
    // Render edited code directly so valid code changes become visible even
    // while reverse reconciliation is still deciding whether the Visual model
    // can represent the same edit.
    const source = codeSource.trim()
      ? codeSource
      : previewGenerated.value!.source;
    const displaySource =
      codeSyncState === 'synced'
        ? displayPreviewGenerated.value?.source ?? source
        : source;

    let cancelled = false;
    artboardPreviewTimerRef.current = window.setTimeout(() => {
      void (async () => {
        setArtboardPreviewBusy(true);
        try {
          const result = await renderAuthoritativeVisualSource(
            source,
            displaySource,
          );
          if (cancelled) return;
          if (result.ok) {
            setArtboardPreviewUrl(result.dataUrl);
            setArtboardPreviewBounds(result.renderBounds);
            setPhase7Results(result.results);
          } else {
            setMessage(result.error);
            flashVisualNotice('error', 'Preview could not render', result.error);
          }
        } catch (error) {
          const text =
            error instanceof Error ? error.message : 'The canvas preview failed.';
          setMessage(text);
          flashVisualNotice('error', 'Preview could not render', text);
          // Keep the last valid frame while the user is between valid edits.
        } finally {
          if (!cancelled) setArtboardPreviewBusy(false);
        }
      })();
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(artboardPreviewTimerRef.current);
    };
  }, [
    active,
    assets,
    codeSource,
    codeSyncState,
    previewGenerated.value?.source,
    displayPreviewGenerated.value?.source,
    phase10Active,
    imageNativeRuntimeActive,
    phase11Active,
    phase12Active,
    phase13Active,
    phase14Active,
  ]);

  const mutate = (
    label: string,
    mutation: (current: VisualProject) => VisualProject,
  ) =>
    setProject((current) => {
      const next = mutation(current);
      history.current.commit(current, next, label);
      projectRef.current = next;
      setHistoryTick((value) => value + 1);
      return next;
    });

  const updateCanvasDraft = (
    updater: (canvas: VisualCanvasConfig) => VisualCanvasConfig,
  ) => {
    setProject((current) => {
      const next = {
        ...current,
        updatedAt: new Date().toISOString(),
        document: {
          ...current.document,
          canvas: updater(current.document.canvas ?? {}),
        },
      };
      projectRef.current = next;
      return next;
    });
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

  const extractCanvasVideoFrame = async (
    request: CanvasVideoFrameExtractionRequest,
  ) => {
    if (canvasFrameExtracting) return;

    const source = request.source.trim();
    const warn = (title: string, text: string) => {
      setMessage(text);
      flashVisualNotice('warning', title, text);
    };

    if (!source) {
      warn('Video source required', 'Choose a video source before extracting a frame.');
      return;
    }
    if (request.mode === 'frame' && (!Number.isInteger(request.frame) || request.frame < 1)) {
      warn('Invalid frame', 'Frame number must be an integer starting at 1.');
      return;
    }
    if (request.mode === 'time' && (!Number.isFinite(request.time) || request.time < 0)) {
      warn('Invalid time', 'Time must be a non-negative number.');
      return;
    }
    if (!Number.isInteger(request.quality) || request.quality < 1 || request.quality > 31) {
      warn('Invalid quality', 'Frame quality must be an integer from 1 to 31.');
      return;
    }

    const sourceAssetId = studioAssetIdFromReference(source);
    const sourceAsset = sourceAssetId
      ? assets.find((asset) => asset.id === sourceAssetId)
      : undefined;
    if (sourceAsset && !sourceAsset.mime.startsWith('video/')) {
      warn('Wrong asset type', sourceAsset.name + ' is not a video asset.');
      return;
    }

    setCanvasFrameExtracting(true);
    const extractionStatus = sourceAsset
      ? 'Decoding the uploaded video locally in your browser.'
      : 'Using the full Apexify runtime for this external video source.';
    setMessage(
      sourceAsset
        ? 'Extracting selected frame locally…'
        : 'Extracting selected frame with the full runtime…',
    );
    flashVisualNotice(
      'loading',
      'Extracting video frame',
      extractionStatus,
    );

    try {
      let artifact: {
        base64: string;
        mime: string;
        metadata?: Record<string, unknown>;
      };

      if (sourceAsset) {
        const localFrame = await extractStudioVideoFrameInBrowser(
          sourceAsset,
          request,
          browserVideoFpsCacheRef.current.get(sourceAsset.id),
        );
        browserVideoFpsCacheRef.current.set(sourceAsset.id, localFrame.fps);
        artifact = {
          base64: localFrame.base64,
          mime: localFrame.mime,
          metadata: {
            width: localFrame.width,
            height: localFrame.height,
            duration: localFrame.duration,
            fps: localFrame.fps,
            extractedTime: localFrame.time,
          },
        };
      } else {
        const method =
          request.mode === 'frame'
            ? 'extractFrameByNumber'
            : 'extractFrameAtTime';
        const position =
          request.mode === 'frame' ? request.frame : request.time;
        const extractionSource = [
          "import { ApexPainter } from 'apexify.js';",
          '',
          'const painter = new ApexPainter();',
          '',
          'async function main() {',
          '  const info = await painter.createVideo({ source: ' +
            JSON.stringify(source) +
            ', getInfo: true });',
          '  const duration = Number(info?.duration);',
          '  const fps = Number(info?.fps);',
          "  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not determine video duration before extraction.');",
          request.mode === 'time'
            ? '  if (' +
              JSON.stringify(position) +
              " >= duration) throw new Error('Requested time ' + " +
              JSON.stringify(position) +
              " + 's is outside this video (duration: ' + duration.toFixed(3) + 's).');"
            : '  const maxFrame = Number.isFinite(fps) && fps > 0 ? Math.max(1, Math.ceil(duration * fps)) : null;',
          request.mode === 'frame'
            ? '  if (maxFrame !== null && ' +
              JSON.stringify(position) +
              " > maxFrame) throw new Error('Requested frame ' + " +
              JSON.stringify(position) +
              " + ' is outside this video (approximately ' + maxFrame + ' frames at ' + fps.toFixed(3) + ' fps).');"
            : '',
          '  return painter.' +
            method +
            '(' +
            JSON.stringify(source) +
            ', ' +
            JSON.stringify(position) +
            ', ' +
            JSON.stringify(request.format) +
            ', ' +
            JSON.stringify(request.quality) +
            ');',
          '}',
        ].filter(Boolean).join('\n');

        const result = await currentNodeServerExecutionAdapter.run({
          session: createInteractiveSession({
            source: extractionSource,
            language: 'ts',
            runtime: 'node',
            options: { studioAssets: assets },
            layout: { activePanel: 'editor' },
          }),
        });

        if (result.status !== 'ready' || !result.output) {
          throw new Error(
            result.diagnostics[0]?.message ??
              'Apexify/FFmpeg frame extraction is unavailable.',
          );
        }

        const runtimeArtifact =
          result.output.artifacts?.find(
            (item) => item.base64 && item.mime.startsWith('image/'),
          ) ??
          (result.output.base64
            ? {
                base64: result.output.base64,
                mime:
                  result.output.mime ||
                  (request.format === 'png' ? 'image/png' : 'image/jpeg'),
                metadata: undefined,
              }
            : null);
        if (!runtimeArtifact?.base64 || !runtimeArtifact.mime.startsWith('image/')) {
          throw new Error('Frame extraction completed without an image artifact.');
        }
        artifact = {
          base64: runtimeArtifact.base64,
          mime: runtimeArtifact.mime,
          metadata: runtimeArtifact.metadata,
        };
      }

      const normalizedBase64 = artifact.base64.replace(/\s+/g, '');
      const padding = normalizedBase64.endsWith('==')
        ? 2
        : normalizedBase64.endsWith('=')
          ? 1
          : 0;
      const size = Math.max(
        0,
        Math.floor((normalizedBase64.length * 3) / 4) - padding,
      );
      const width =
        typeof artifact.metadata?.width === 'number'
          ? artifact.metadata.width
          : sourceAsset?.metadata?.width;
      const height =
        typeof artifact.metadata?.height === 'number'
          ? artifact.metadata.height
          : sourceAsset?.metadata?.height;
      const extractedAsset: StudioVirtualAsset = {
        id: createVisualId('asset'),
        name:
          (sourceAsset?.name.replace(/\.[^.]+$/, '') || 'video') +
          '-' +
          (request.mode === 'frame'
            ? 'frame-' + request.frame
            : 'time-' + String(request.time).replace(/\./g, '_')) +
          '.' +
          request.format,
        mime: artifact.mime,
        size,
        base64: normalizedBase64,
        metadata: {
          width,
          height,
        },
      };

      const withoutExisting = assets.filter((asset) => asset.id !== extractedAsset.id);
      const nextAssets = [...withoutExisting, extractedAsset];
      if (nextAssets.length > STUDIO_ASSET_LIMITS.maxCount) {
        throw new Error(
          'The extracted frame would exceed the Studio asset count limit. Remove an unused asset first.',
        );
      }
      if (totalStudioAssetBytes(nextAssets) > STUDIO_ASSET_LIMITS.maxTotalBytes) {
        throw new Error(
          'The extracted frame would exceed the Studio asset storage limit. Remove an unused asset first.',
        );
      }

      setAssets(nextAssets);
      setArtboardPreviewUrl(studioAssetDataUrl(extractedAsset));
      setArtboardPreviewBounds(null);

      mutateCanvas('Extract video frame background', (current) => {
        const videoBg = current.videoBg;
        const previousCustomBg = current.customBg;
        const next = { ...current };
        delete next.videoBg;
        delete next.colorBg;
        delete next.gradientBg;
        delete next.transparentBase;
        next.customBg = {
          source: studioAssetReference(extractedAsset),
          inherit: videoBg?.inherit ?? previousCustomBg?.inherit,
          fit: videoBg?.fit ?? previousCustomBg?.fit ?? 'fill',
          align: videoBg?.align ?? previousCustomBg?.align ?? 'center',
          opacity: videoBg?.opacity ?? previousCustomBg?.opacity ?? 1,
          filters: videoBg?.filters ?? previousCustomBg?.filters ?? [],
        };
        return next;
      });

      setAssetFilter('image');
      setActiveTool('canvas');
      setInspectorTab('effects');
      const successText =
        'Frame extracted locally · saved as ' +
        extractedAsset.name +
        ' · customBg ready';
      setMessage(successText);
      flashVisualNotice(
        'success',
        'Video frame extracted',
        'The selected frame is now the canvas custom background.',
      );
    } catch (error) {
      const raw =
        error instanceof Error ? error.message : 'Video frame extraction failed.';
      const text =
        /413|too large|request.*large/i.test(raw)
          ? 'This media is too large for the hosted runtime request. Uploaded Studio videos now extract locally in your browser; reselect the uploaded video asset instead of an external server-only source.'
          : /429|runtime is busy|full runtime is busy/i.test(raw)
            ? 'The full runtime stayed busy after automatic retries. Wait for the active render to finish and retry.'
            : raw;
      setMessage(text);
      flashVisualNotice('error', 'Frame extraction failed', text);
    } finally {
      setCanvasFrameExtracting(false);
    }
  };

  const primaryMedia =
    primary && (primary.kind === 'image' || primary.kind === 'shape')
      ? primary
      : undefined;

  const primaryImageBatch =
    primary?.kind === 'group' && visualImageBatchGroupProps(primary)
      ? primary
      : undefined;

  const resolveVisualImageIntrinsicDimensions = async (
    node: VisualNode,
  ): Promise<{ width: number; height: number } | null> => {
    const image = visualImageProps(node);
    const source = image.source;
    const normalize = (width: unknown, height: unknown) => {
      if (
        typeof width !== 'number' ||
        typeof height !== 'number' ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 1 ||
        height < 1
      ) {
        return null;
      }
      return {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      };
    };

    if (typeof source === 'object' && source && '$generated' in source) {
      if (source.$generated === 'document_canvas') {
        return normalize(project.document.width, project.document.height);
      }
      const generatedNode = project.document.nodes[source.$generated];
      if (generatedNode) {
        const rect = nodeRect(generatedNode);
        return normalize(rect.width, rect.height);
      }
      return null;
    }

    if (typeof source !== 'string' || !source.trim()) return null;

    const assetId = studioAssetIdFromReference(source);
    const asset = assetId ? assets.find((item) => item.id === assetId) : undefined;
    const assetDimensions = normalize(
      asset?.metadata?.width,
      asset?.metadata?.height,
    );
    if (assetDimensions) return assetDimensions;

    let browserSource = source.trim();
    if (asset) browserSource = studioAssetDataUrl(asset);
    if (/^studio:\/\//i.test(browserSource)) return null;

    return new Promise((resolve) => {
      const imageElement = new window.Image();
      let settled = false;
      const finish = (value: { width: number; height: number } | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(value);
      };
      const timeout = window.setTimeout(() => finish(null), 5000);
      imageElement.onload = () =>
        finish(
          normalize(
            imageElement.naturalWidth || imageElement.width,
            imageElement.naturalHeight || imageElement.height,
          ),
        );
      imageElement.onerror = () => finish(null);
      imageElement.src = browserSource;
    });
  };

  const setPrimaryImageInherit = async (enabled: boolean) => {
    if (!primaryMedia || primaryMedia.kind !== 'image') return;
    const targetId = primaryMedia.id;

    if (!enabled) {
      mutate('Disable image source-size inheritance', (current) => {
        const node = current.document.nodes[targetId];
        if (!node || node.kind !== 'image') return current;
        const next = structuredClone(current);
        const nextNode = next.document.nodes[targetId];
        nextNode.props = imagePropsRecord({
          ...visualImageProps(nextNode),
          inherit: false,
        });
        next.updatedAt = new Date().toISOString();
        return next;
      });
      setMessage('Image source-size inheritance disabled');
      return;
    }

    const dimensions = await resolveVisualImageIntrinsicDimensions(primaryMedia);
    mutate('Inherit image source dimensions', (current) => {
      const node = current.document.nodes[targetId];
      if (!node || node.kind !== 'image') return current;
      const next = structuredClone(current);
      const nextNode = next.document.nodes[targetId];
      nextNode.props = imagePropsRecord({
        ...visualImageProps(nextNode),
        inherit: true,
        fit: 'fill',
      });
      if (dimensions) {
        nextNode.transform = {
          ...(nextNode.transform ?? {}),
          width: dimensions.width,
          height: dimensions.height,
          scaleX: 1,
          scaleY: 1,
        };
      }
      next.updatedAt = new Date().toISOString();
      return next;
    });

    setMessage(
      dimensions
        ? 'Inherited source size · ' + dimensions.width + ' × ' + dimensions.height
        : 'Inherit enabled, but Studio could not resolve this source size in the browser',
    );
  };

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

  const mutateImageBatch = (
    label: string,
    updater: (
      value: NonNullable<ReturnType<typeof visualImageBatchGroupProps>>,
    ) => NonNullable<ReturnType<typeof visualImageBatchGroupProps>>,
  ) => {
    if (!primaryImageBatch) return;
    mutate(label, (current) => {
      const next = structuredClone(current);
      const group = next.document.nodes[primaryImageBatch.id];
      if (!group) return current;
      const value = visualImageBatchGroupProps(group);
      if (!value) return current;
      group.props = imageBatchGroupPropsRecord(updater(value));
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const mutateTextBatch = (
    label: string,
    updater: (
      value: NonNullable<ReturnType<typeof visualTextBatchGroupProps>>,
    ) => NonNullable<ReturnType<typeof visualTextBatchGroupProps>>,
  ) => {
    if (!primaryTextBatch) return;
    mutate(label, (current) => {
      const next = structuredClone(current);
      const group = next.document.nodes[primaryTextBatch.id];
      if (!group) return current;
      const value = visualTextBatchGroupProps(group);
      if (!value) return current;
      group.props = textBatchGroupPropsRecord(updater(value));
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
      const text = 'Drop or choose an image file such as PNG, JPG, WebP, GIF or SVG.';
      setMessage(text);
      flashVisualNotice('warning', 'Image file required', text);
      return;
    }
    if (assets.length + incoming.length > STUDIO_ASSET_LIMITS.maxCount) {
      const text =
        'Studio accepts at most ' +
        STUDIO_ASSET_LIMITS.maxCount +
        ' assets per session. Remove an unused asset and retry.';
      setMessage(text);
      flashVisualNotice('error', 'Asset limit reached', text);
      return;
    }

    const incomingBytes = incoming.reduce((sum, file) => sum + file.size, 0);
    flashVisualNotice(
      'loading',
      incoming.length === 1 ? 'Uploading image' : 'Uploading images',
      incoming.length +
        ' file' +
        (incoming.length === 1 ? '' : 's') +
        ' · ' +
        (incomingBytes / (1024 * 1024)).toFixed(2) +
        ' MiB',
    );

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
      if (!created.length) {
        throw new Error('No supported image assets were created from the selected files.');
      }
      setAssets([...assets, ...created]);
      created.forEach((asset, index) =>
        insertImageAsset(
          asset,
          point
            ? { x: point.x + index * 18, y: point.y + index * 18 }
            : undefined,
        ),
      );
      const text =
        'Added ' +
        created.length +
        ' image asset' +
        (created.length === 1 ? '' : 's');
      setMessage(text);
      flashVisualNotice(
        'success',
        created.length === 1 ? 'Image added' : 'Images added',
        text + ' and placed on the canvas.',
      );
    } catch (uploadError) {
      const text =
        uploadError instanceof Error
          ? uploadError.message
          : 'Could not add image asset';
      const title = /exceeds.*MiB|too large/i.test(text)
        ? 'File too large'
        : /limit/i.test(text)
          ? 'Asset storage limit'
          : 'Image upload failed';
      setMessage(text);
      flashVisualNotice('error', title, text);
    }
  };

  const openAssetWorkspace = (
    filter?: 'image' | 'font' | 'audio' | 'video',
  ) => {
    if (filter) setAssetFilter(filter);
    setDockCollapsed(false);
  };

  const addStudioAssetFiles = async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (!incoming.length) return;

    if (assets.length + incoming.length > STUDIO_ASSET_LIMITS.maxCount) {
      const text =
        'Studio accepts at most ' +
        STUDIO_ASSET_LIMITS.maxCount +
        ' assets per session. Remove an unused asset and retry.';
      setMessage(text);
      flashVisualNotice('error', 'Asset limit reached', text);
      if (assetInputRef.current) assetInputRef.current.value = '';
      return;
    }

    const incomingBytes = incoming.reduce((sum, file) => sum + file.size, 0);
    flashVisualNotice(
      'loading',
      incoming.length === 1 ? 'Uploading asset' : 'Uploading assets',
      incoming.length +
        ' file' +
        (incoming.length === 1 ? '' : 's') +
        ' · ' +
        (incomingBytes / (1024 * 1024)).toFixed(2) +
        ' MiB · validating media and metadata',
    );

    try {
      const created: StudioVirtualAsset[] = [];
      let total = totalStudioAssetBytes(assets);
      for (const file of incoming) {
        const asset = await fileToStudioAsset(file);
        total += asset.size;
        if (total > STUDIO_ASSET_LIMITS.maxTotalBytes) {
          throw new Error('Combined Studio assets exceed the 24 MiB session limit.');
        }
        created.push(asset);
      }

      if (!created.length) {
        throw new Error('No supported Studio assets were created from the selected files.');
      }
      setAssets([...assets, ...created]);
      setAssetFilter(assetKind(created[0].mime));
      const text =
        'Added ' +
        created.length +
        ' Studio asset' +
        (created.length === 1 ? '' : 's');
      setMessage(text);
      flashVisualNotice(
        'success',
        created.length === 1 ? 'Asset uploaded' : 'Assets uploaded',
        text + ' successfully.',
      );
    } catch (uploadError) {
      const text =
        uploadError instanceof Error
          ? uploadError.message
          : 'Could not add Studio asset';
      const title = /exceeds.*MiB|too large/i.test(text)
        ? 'File too large'
        : /limit/i.test(text)
          ? 'Asset storage limit'
          : 'Upload failed';
      setMessage(text);
      flashVisualNotice('error', title, text);
    } finally {
      if (assetInputRef.current) assetInputRef.current.value = '';
    }
  };

  const activateStudioAsset = (asset: StudioVirtualAsset) => {
    if (asset.mime.startsWith('image/')) {
      insertImageAsset(asset);
      return;
    }
    if (isStudioFontAsset(asset)) {
      applyFontAsset(asset);
      return;
    }
    if (asset.mime.startsWith('audio/')) setActiveTool('audio');
    if (asset.mime.startsWith('video/')) setActiveTool('video');
    setMessage('Asset ready · ' + studioAssetReference(asset));
  };

  const copyStudioAssetReference = (asset: StudioVirtualAsset) => {
    const reference = studioAssetReference(asset);
    void navigator.clipboard.writeText(reference).then(
      () => setMessage('Copied ' + reference),
      () => setMessage('Clipboard access was blocked'),
    );
  };

  const removeStudioAsset = (asset: StudioVirtualAsset) => {
    setAssets(assets.filter((item) => item.id !== asset.id));
    setMessage('Removed asset · ' + asset.name);
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
        props.painterOpts = { resolveAssetRefs: true };
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
      painterOpts: {
        ...(current.painterOpts ?? {}),
        resolveAssetRefs: true,
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
    projectRef.current = result.project;
    setProject(result.project);
    setMessage('Undo: ' + result.label);
    setHistoryTick((value) => value + 1);
  };

  const redo = () => {
    const result = history.current.redo(project);
    if (!result) return;
    projectRef.current = result.project;
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

  const resetCanvas = () => {
    setResetConfirmOpen(false);
    mutate('Reset canvas', (current) => {
      const next = createVisualProject({
        id: current.id,
        name: current.name,
        width: current.document.width,
        height: current.document.height,
        now: current.createdAt,
      });
      next.createdAt = current.createdAt;
      next.updatedAt = new Date().toISOString();
      return next;
    });
    setGuides([]);
    setMarquee(null);
    setCollapsed(new Set());
    setInlineTextEditId(null);
    setArtboardPreviewUrl(null);
    setArtboardPreviewBounds(null);
    setArtboardPreviewBusy(false);
    setModalPreviewUrl(null);
    setModalPreviewDownloadUrl(null);
    setModalPreviewError(null);
    setActiveTool('canvas');
    setInspectorTab('style');
    setDockTab('generated');
    setDockCollapsed(false);
    setCodeSyncError(null);
    setPhase7Results({});
    setMessage('Canvas reset · Undo restores the previous canvas');
    flashVisualNotice(
      'success',
      'Canvas reset',
      'The previous canvas is still available through Undo.',
    );
  };

  const requestCanvasReset = () => {
    setResetConfirmOpen(true);
  };

  useEffect(() => {
    if (!resetConfirmOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setResetConfirmOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [resetConfirmOpen]);

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
    if (!canGroupSelection) {
      setMessage('Select at least two sibling layers before grouping.');
      return;
    }
    const groupId = createVisualId('group');
    mutate('Group', (current) => {
      const imageOnly = selected.every((id) => {
        const node = current.document.nodes[id];
        return node?.kind === 'image' || node?.kind === 'shape';
      });
      const textOnly = selected.every((id) => {
        const node = current.document.nodes[id];
        return node?.kind === 'text';
      });
      const next = groupNodes(current, selected, groupId);
      if (imageOnly && next !== current) {
        const group = next.document.nodes[groupId];
        if (group) {
          let resolveAssetRefs = false;
          for (const childId of group.childIds ?? []) {
            const child = next.document.nodes[childId];
            if (!child || (child.kind !== 'image' && child.kind !== 'shape')) continue;
            const childProps = visualImageProps(child);
            resolveAssetRefs ||= childProps.painterOpts?.resolveAssetRefs === true;
            const {
              createOptions: _createOptions,
              painterOpts: _painterOpts,
              ...rest
            } = childProps;
            child.props = imagePropsRecord(rest as VisualImageNodeProps);
          }
          group.name = 'Image batch (' + (group.childIds?.length ?? 0) + ')';
          group.props = imageBatchGroupPropsRecord({
            imageBatch: true,
            createOptions: {
              isGrouped: true,
              groupTransform: {
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
              },
            },
            ...(resolveAssetRefs
              ? { painterOpts: { resolveAssetRefs: true } }
              : {}),
          });
        }
      } else if (textOnly && next !== current) {
        const group = next.document.nodes[groupId];
        if (group) {
          let resolveAssetRefs = false;
          for (const childId of group.childIds ?? []) {
            const child = next.document.nodes[childId];
            if (!child || child.kind !== 'text') continue;
            const childProps = visualTextProps(child);
            resolveAssetRefs ||=
              childProps.painterOpts?.resolveAssetRefs === true ||
              Boolean(childProps.font?.path?.startsWith('studio://asset/'));
            const {
              createOptions: _createOptions,
              painterOpts: _painterOpts,
              ...rest
            } = childProps;
            child.props = textPropsRecord(rest as VisualTextNodeProps);
          }
          group.name = 'Text batch (' + (group.childIds?.length ?? 0) + ')';
          group.props = textBatchGroupPropsRecord({
            textBatch: true,
            createOptions: {
              isGrouped: true,
              groupTransform: {
                scaleX: 1,
                scaleY: 1,
                opacity: 1,
              },
            },
            ...(resolveAssetRefs
              ? { painterOpts: { resolveAssetRefs: true } }
              : {}),
          });
        }
      }
      return next;
    });
    setCollapsed((current) => {
      const next = new Set(current);
      next.add(groupId);
      return next;
    });
    setMessage(
      selected.every((id) => {
        const node = project.document.nodes[id];
        return node?.kind === 'image' || node?.kind === 'shape';
      })
        ? 'Created one createImage([...]) batch'
        : selected.every((id) => project.document.nodes[id]?.kind === 'text')
          ? 'Created one createText([...]) batch'
          : 'Grouped selection',
    );
  };

  const ungroupSelection = () => {
    if (!canUngroupSelection) {
      setMessage('Select a parent group to ungroup it.');
      return;
    }
    const expandedChildren = selected.flatMap(
      (id) => project.document.nodes[id]?.childIds ?? [],
    );
    mutate('Ungroup', (current) => ungroupNodes(current, selected));
    setCollapsed((current) => {
      const next = new Set(current);
      selected.forEach((id) => next.delete(id));
      expandedChildren.forEach((id) => next.delete(id));
      return next;
    });
    setMessage('Ungrouped selected group');
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

  globalKeyboardHandlerRef.current = (event: KeyboardEvent) => {
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => globalKeyboardHandlerRef.current(event);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      const resized = patchNodeTransform(current, primary.id, { [key]: value });

      // Width/height fields in Studio are explicit transforms. If an image was
      // previously using contain/cover, the runtime preserves source aspect and
      // can visually change the other axis. Manual dimension edits must instead
      // mean exactly W × H, so switch the image to free/stretch sizing.
      if (
        currentNode.kind === 'image' &&
        (key === 'width' || key === 'height')
      ) {
        const resizedNode = resized.document.nodes[primary.id];
        if (!resizedNode) return resized;
        const image = visualImageProps(resizedNode);
        return {
          ...resized,
          document: {
            ...resized.document,
            nodes: {
              ...resized.document.nodes,
              [primary.id]: {
                ...resizedNode,
                props: imagePropsRecord({ ...image, fit: 'fill' }),
              },
            },
          },
        };
      }

      return resized;
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
    const source = generated.value?.source ?? codeSource;
    if (!source) {
      setMessage(generated.error ?? 'Code unavailable');
      return;
    }
    setCodeHandoff({
      id: createVisualId('handoff'),
      name: project.name + ' — Generated',
      source: phase15ExportedCode(project, source, includeCodeProvenance),
    });
    onModeChange('code');
  };

  const restoreCanonicalCode = () => {
    if (!generated.value) {
      setMessage(generated.error ?? 'Canonical Visual code unavailable');
      return;
    }
    const source = generated.value.source;
    window.clearTimeout(codeSaveTimerRef.current);
    phase17CodeTransactionsRef.current.cancel();
    phase17CodeBaseSignatureRef.current = projectSemanticSignature;
    setCodeSource(source);
    if (!fileNameTouchedRef.current) setCodeFileName(generated.value.fileName);
    setCodeSyncState('synced');
    setCodeSyncError(null);
    persistLiveCode(source, fileNameTouchedRef.current ? codeFileName : generated.value.fileName);
    setMessage('Canonical Visual code restored');
  };

  const forkConflictingCode = () => {
    const source = phase15CleanGeneratedSource(codeSource || generated.value?.source || '');
    if (!source.trim()) {
      setMessage('No edited code is available to fork');
      return;
    }
    setCodeHandoff({
      id: createVisualId('handoff'),
      name: project.name + ' — Code fork',
      source,
    });
    onModeChange('code');
  };

  const renderVisualPreview = async (openModal = true) => {
    const source = phase14Active || phase13Active || phase12Active || phase11Active || phase10Active || phase9Active
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

  const downloadProjectBundle = () => {
    const source = generated.value?.source;
    if (!source) {
      setMessage(generated.error ?? 'Canonical Visual code unavailable');
      return;
    }
    try {
      const bundle = createPhase15ProjectExport(project, source, assets, {
        assetStrategy: assetExportStrategy,
        includeProjectSource,
        includePackageJson: includePackageScaffold,
        includeProvenance: includeCodeProvenance,
      });
      const bytes = Uint8Array.from(bundle.zip);
      const blob = new Blob([bytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = bundle.fileName;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(
        'Project bundle exported · ' +
          bundle.files.length +
          ' files' +
          (bundle.manifest.warnings.length ? ' · ' + bundle.manifest.warnings.length + ' warning(s)' : ''),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Project export failed');
    }
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

  const renderLayerRows = (
    ids: string[],
    depth = 0,
    budget = { remaining: PHASE17_PERFORMANCE_BUDGETS.maxInteractiveLayers },
  ): ReactNode =>
    ids.map((id, index) => {
      if (budget.remaining <= 0) return null;
      const node = project.document.nodes[id];
      if (!node) return null;
      budget.remaining -= 1;
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
            data-kind={node.kind}
            data-has-children={hasChildren ? 'true' : undefined}
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
              paddingLeft: 6 + Math.min(depth, 4) * 10,
              background: isSelected ? '#17345a' : undefined,
            }}
          >
            <button
              title={
                hasChildren
                  ? 'Collapse / expand group'
                  : isSelected
                    ? 'Remove from multi-selection'
                    : 'Add to multi-selection'
              }
              data-layer-multiselect={!hasChildren ? 'true' : undefined}
              data-selected={!hasChildren && isSelected ? 'true' : undefined}
              onClick={(event) => {
                event.stopPropagation();
                if (hasChildren) {
                  setCollapsed((current) => {
                    const next = new Set(current);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                  });
                  return;
                }
                setProject((current) => toggleSelection(current, id));
              }}
            >
              {hasChildren ? (isCollapsed ? '▸' : '▾') : isSelected ? '✓' : '+'}
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
                className="apx-pre4-layer-name"
                title={(node.name ?? node.kind) + ' · double-click to rename'}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  setRenamingId(id);
                  setRenameDraft(node.name ?? node.kind);
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
            renderLayerRows(node.childIds ?? [], depth + 1, budget)}
        </div>
      );
    });

  const selectedGroups = selected
    .map((id) => project.document.nodes[id])
    .filter(
      (node): node is VisualNode =>
        Boolean(node && node.kind === 'group' && (node.childIds?.length ?? 0) > 0),
    );

  const featureGroups = [
    {
      id: 'create',
      label: 'Create',
      tools: [
        ['canvas', ComputerDesktopIcon, 'Canvas'],
        ['images', PhotoIcon, 'Images'],
        ['text', DocumentTextIcon, 'Text'],
        ['shapes', Squares2X2Icon, 'Shapes'],
        ['paths', PencilSquareIcon, 'Paths'],
        ['charts', ChartBarIcon, 'Charts'],
      ],
    },
    {
      id: 'structure',
      label: 'Structure',
      tools: [
        ['components', CubeIcon, 'Components'],
        ['assets', CircleStackIcon, 'Assets'],
      ],
    },
    {
      id: 'media',
      label: 'Motion & media',
      tools: [
        ['gif', FilmIcon, 'GIF'],
        ['audio', MusicalNoteIcon, 'Audio'],
        ['video', VideoCameraIcon, 'Video'],
      ],
    },
    {
      id: 'system',
      label: 'System',
      tools: [
        ['advanced', WrenchScrewdriverIcon, 'Advanced'],
      ],
    },
  ] as const;

  const mediaContextActive =
    leftPanelMode === 'context' &&
    (activeTool === 'images' ||
      activeTool === 'shapes' ||
      activeTool === 'text' ||
      activeTool === 'charts' ||
      activeTool === 'paths' ||
      activeTool === 'components' ||
      activeTool === 'assets' ||
      activeTool === 'gif' ||
      activeTool === 'audio' ||
      activeTool === 'video' ||
      activeTool === 'advanced');

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
    if (activeTool === 'advanced') {
      return (
        <VisualAdvancedContext
          project={project}
          onMutate={mutate}
          onPreview={() => void renderVisualPreview(true)}
          onInspector={() => {
            setInspectorTab('advanced');
            setProject((current) => ({
              ...current,
              editor: { ...current.editor, selectedNodeIds: [] },
            }));
          }}
        />
      );
    }

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
                openAssetWorkspace('font');
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
                openAssetWorkspace('font');
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
            <button type="button" onClick={() => openAssetWorkspace('image')}>Open Assets</button>
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
                <img src={phase17AssetCacheRef.current.get(asset)} alt="" />
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
          onClick={() => openAssetWorkspace()}
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
              <img src={phase17AssetCacheRef.current.get(asset)} alt="" />
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

  const renderCanvasInspector = () => (
    <VisualCanvasInspector
      project={project}
      tab={inspectorTab}
      assets={assets}
      onRename={renameCanvas}
      onBeginEdit={beginPropertyEdit}
      onEndEdit={endPropertyEdit}
      onDraft={updateCanvasDraft}
      onMutate={mutateCanvas}
      onResizeDraft={(key, value) => {
        setProject((current) => {
          const next = {
            ...current,
            updatedAt: new Date().toISOString(),
            document: {
              ...current.document,
              [key]: value,
            },
          };
          projectRef.current = next;
          return next;
        });
      }}
      onResolveAssetRefsChange={(checked) =>
        mutate('Canvas asset reference resolution', (current) => ({
          ...current,
          updatedAt: new Date().toISOString(),
          document: {
            ...current.document,
            canvasPainterOpts: checked
              ? { resolveAssetRefs: true }
              : undefined,
          },
        }))
      }
      onMessage={setMessage}
      onExtractVideoFrame={extractCanvasVideoFrame}
      videoFrameExtracting={canvasFrameExtracting}
    />
  );

  // STUDIO-PARITY-2: selected image/shape authoring is owned exclusively by
  // VisualImageInspector / VisualImageBatchInspector. The legacy media
  // inspector implementation was deleted rather than kept as a second source
  // of UI/runtime truth.


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
    if (activeTool === 'canvas') {
      return renderCanvasInspector();
    }

    if (activeTool === 'advanced' && !primary) {
      return (
        <VisualAdvancedInspector
          project={project}
          onMutate={mutate}
          inspectorTab={inspectorTab}
          onMessage={setMessage}
        />
      );
    }

    if ((activeTool === 'video' || phase13Active) && !primary) {
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

    if (primaryImageBatch) {
      const batchIndex = layerIds.indexOf(primaryImageBatch.id);
      const generatedNodes = layerIds
        .slice(0, Math.max(0, batchIndex))
        .map((id) => project.document.nodes[id])
        .filter(
          (node): node is VisualNode =>
            Boolean(
              node &&
                (node.kind === 'image' ||
                  node.kind === 'shape' ||
                  node.kind === 'text' ||
                  node.kind === 'chart' ||
                  node.kind === 'scene' ||
                  node.kind === 'surface'),
            ),
        );
      return (
        <VisualImageBatchInspector
          project={project}
          node={primaryImageBatch}
          tab={inspectorTab}
          imageAssets={imageAssets}
          generatedNodes={generatedNodes}
          onChange={mutateImageBatch}
          onRename={(name) =>
            mutate('Rename image group', (current) =>
              renameNode(current, primaryImageBatch.id, name),
            )
          }
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
      const primaryIndex = layerIds.indexOf(primaryMedia.id);
      const generatedNodes = layerIds
        .slice(0, Math.max(0, primaryIndex))
        .map((id) => project.document.nodes[id])
        .filter(
          (node): node is VisualNode =>
            Boolean(
              node &&
                (node.kind === 'image' ||
                  node.kind === 'shape' ||
                  node.kind === 'text' ||
                  node.kind === 'chart' ||
                  node.kind === 'scene' ||
                  node.kind === 'surface'),
            ),
        );
      return (
        <VisualImageInspector
          project={project}
          node={primaryMedia}
          tab={inspectorTab}
          imageAssets={imageAssets}
          generatedNodes={generatedNodes}
          onChange={mutateImage}
          onRename={(name) =>
            mutate('Rename image layer', (current) =>
              renameNode(current, primaryMedia.id, name),
            )
          }
          onInheritChange={(enabled) => {
            void setPrimaryImageInherit(enabled);
          }}
          renderTransform={renderTransformFields}
        />
      );
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
            <div className="apx-live-code-error apx-phase15-code-conflict" data-phase15-code-conflict>
              <strong>Linked-code conflict</strong>
              <span>{codeSyncError}</span>
              <div>
                <button type="button" data-phase15-recover-canonical onClick={restoreCanonicalCode}>
                  Restore canonical Visual code
                </button>
                <button type="button" data-phase15-fork-code onClick={forkConflictingCode}>
                  Fork edit to Code Studio
                </button>
              </div>
            </div>
          ) : null}
          <div
            className="apx-live-code-editor"
            data-phase17-large-document={largeCodeMode ? 'true' : undefined}
          >
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
      const advancedDiagnostics = phase14Active
        ? {
            execution: phase14AdvancedState(project)?.execution ?? null,
            output: phase14OutputSettings(project) ?? null,
            plugins: phase14AdvancedState(project)?.plugins.map((item) => ({
              id: item.id,
              action: item.action,
              sync: item.sync,
            })) ?? [],
            hostedRuntimeExclusions: PHASE14_HOSTED_EXCLUSIONS,
          }
        : null;
      return diagnostics.length || entries.length || advancedDiagnostics ? (
        <div className="apx-pre4-diagnostics" data-phase7-results>
          {advancedDiagnostics ? (
            <div data-phase14-results>
              <strong>Advanced structured result contract</strong>
              <pre>{JSON.stringify(advancedDiagnostics, null, 2)}</pre>
            </div>
          ) : null}
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
      data-phase17-layer-mode={layerTreeMode}
      data-phase17-large-code={largeCodeMode ? 'true' : undefined}
      data-phase17-layers-collapsed={layersCollapsed ? 'true' : undefined}
      data-phase17-inspector-collapsed={inspectorCollapsed ? 'true' : undefined}
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
            <div className="apx-vw-project-menu__panel apx-phase15-export-menu" data-phase15-export-menu>
              <button
                data-phase15-single-file-export
                disabled={!generated.value}
                onClick={() => downloadTextFile(exportedCodeSource, codeFileName)}
              >
                Download TypeScript · one file
              </button>
              <button
                data-phase15-project-export
                disabled={!generated.value}
                onClick={downloadProjectBundle}
              >
                Download project bundle · .zip
              </button>
              <label className="apx-phase15-export-field">
                <span>Assets</span>
                <select
                  data-phase15-asset-strategy
                  value={assetExportStrategy}
                  onChange={(event) => setAssetExportStrategy(event.target.value as Phase15AssetExportStrategy)}
                >
                  <option value="files">Portable files · ./assets/</option>
                  <option value="manifest">Round-trip manifest</option>
                  <option value="omit">Omit asset bytes</option>
                </select>
              </label>
              <label className="apx-phase15-export-check">
                <input
                  type="checkbox"
                  checked={includeProjectSource}
                  onChange={(event) => setIncludeProjectSource(event.target.checked)}
                />
                <span>Include .apexstudio.json</span>
              </label>
              <label className="apx-phase15-export-check">
                <input
                  type="checkbox"
                  checked={includePackageScaffold}
                  onChange={(event) => setIncludePackageScaffold(event.target.checked)}
                />
                <span>Include package scaffold</span>
              </label>
              <label className="apx-phase15-export-check">
                <input
                  type="checkbox"
                  checked={includeCodeProvenance}
                  onChange={(event) => setIncludeCodeProvenance(event.target.checked)}
                  data-phase15-provenance-toggle
                />
                <span>Generated-code provenance</span>
              </label>
              <div className="apx-phase15-quality" data-phase15-code-quality={exportCodeQuality.some((item) => item.severity === 'error') ? 'error' : 'ok'}>
                {exportCodeQuality.length
                  ? exportCodeQuality.map((item) => item.message).join(' · ')
                  : 'Canonical formatting · public Apexify APIs · no Studio runtime internals'}
              </div>
              <button data-visual-project-save onClick={save}>Save .apexstudio.json</button>
              <button data-visual-project-load onClick={() => fileRef.current?.click()}>Load .apexstudio.json</button>
              <button
                data-visual-open-generated-code
                onClick={handoff}
                disabled={!codeSource && !generated.value}
              >
                Open in Code Studio
              </button>
              <button
                data-advanced-export-settings
                onClick={() => {
                  setActiveTool('advanced');
                  setInspectorTab('advanced');
                  setProject((current) => ({
                    ...current,
                    editor: { ...current.editor, selectedNodeIds: [] },
                  }));
                }}
              >
                Runtime output · {phase14OutputSettings(project)?.format ?? 'configure'}
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

      <div
        className="apx-pre4-layout"
        style={{
          '--pre4-dock-size': dockCollapsed ? '38px' : dockHeight + 'px',
          '--pre4-layers-size': layersWidth + 'px',
          '--pre4-inspector-size': inspectorWidth + 'px',
        } as CSSProperties}
      >
        <nav className="apx-pre4-feature-rail" aria-label="Visual Studio features">
          <div className="apx-pre4-feature-list">
            {featureGroups.map((group) => (
              <section
                key={group.id}
                className="apx-pre4-feature-group"
                data-feature-group={group.id}
                aria-label={group.label}
              >
                <div className="apx-pre4-feature-group-title" aria-hidden="true">
                  <span>{group.label}</span>
                </div>
                <div className="apx-pre4-feature-group-tools">
                  {group.tools.map(([id, Icon, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-label={label}
                      title={label}
                      data-feature-tool={id}
                      data-active={activeTool === id ? 'true' : undefined}
                      onClick={() => {
                        setActiveTool(id);
                        if (id === 'canvas') {
                          setLeftPanelMode('layers');
                          setLayersCollapsed(true);
                          setInspectorTab('style');
                          setProject((current) => ({
                            ...current,
                            editor: { ...current.editor, selectedNodeIds: [] },
                          }));
                          setMessage('Canvas inspector active');
                          return;
                        }
                        setLeftPanelMode('context');
                        setLayersCollapsed(false);
                        if (id === 'assets') openAssetWorkspace();
                        if (id === 'gif') {
                          setDockTab('timeline');
                          setDockCollapsed(false);
                        }
                        if (id === 'audio') {
                          setDockTab('timeline');
                          setDockCollapsed(false);
                        }
                        if (id === 'video') {
                          setProject((current) => ({
                            ...current,
                            editor: { ...current.editor, selectedNodeIds: [] },
                          }));
                          setDockTab('timeline');
                          setDockCollapsed(false);
                        }
                        if (id === 'advanced') {
                          setProject((current) => ({
                            ...current,
                            editor: { ...current.editor, selectedNodeIds: [] },
                          }));
                          setInspectorTab('advanced');
                          setMessage('Advanced operations · batch, chain, plugins and output');
                        }
                      }}
                    >
                      <span className="apx-pre4-feature-icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="apx-pre4-feature-label">{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="apx-pre4-feature-footer" aria-label="Visual Studio workspace">
            <span className="apx-pre4-feature-footer-dot" aria-hidden="true" />
            <span className="apx-pre4-feature-footer-copy">
              <strong>Visual Studio</strong>
              <small>Live workspace</small>
            </span>
          </div>
        </nav>

        <button
          type="button"
          className="apx-pre4-layers-dock-toggle"
          data-phase17-layers-toggle
          data-phase17-collapse-layers={!layersCollapsed ? '' : undefined}
          data-phase17-show-layers={layersCollapsed ? '' : undefined}
          data-state={layersCollapsed ? 'collapsed' : 'expanded'}
          onClick={() => setLayersCollapsed((value) => !value)}
          aria-controls="apx-pre4-layers-panel"
          aria-expanded={!layersCollapsed}
          aria-label={layersCollapsed ? 'Open Layers panel' : 'Collapse Layers panel'}
          title={layersCollapsed ? 'Open Layers panel' : 'Collapse Layers panel'}
        >
          <span className="apx-pre4-layers-dock-grip" aria-hidden="true" />
          {layersCollapsed ? (
            <ChevronRightIcon aria-hidden="true" />
          ) : (
            <ChevronLeftIcon aria-hidden="true" />
          )}
        </button>

        <aside
          id="apx-pre4-layers-panel"
          className="apx-pre4-layers"
          data-context-mode={mediaContextActive ? activeTool : 'layers'}
        >
          <div
            className="apx-phase17-resizer apx-phase17-resizer--layers"
            role="separator"
            aria-label="Resize Layers panel"
            aria-orientation="vertical"
            aria-valuemin={190}
            aria-valuemax={420}
            aria-valuenow={layersWidth}
            tabIndex={0}
            onPointerDown={(event) => beginPanelResize('layers', event)}
            onKeyDown={(event) => resizePanelByKeyboard('layers', event)}
          />
          <div className="apx-pre4-panel-head">
            <div>
              <strong>
                {!mediaContextActive
                  ? 'Layers'
                  : activeTool === 'images'
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
                                    : activeTool === 'advanced'
                                      ? 'Advanced'
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
                                  : activeTool === 'advanced'
                                    ? 'Batch · chain · plugins · output'
                                    : assets.length + ' shared assets'
                  : (layerIds.length ? layerIds.length + ' layers' : 'Layer structure') +
                    (selected.length ? ' · ' + selected.length + ' selected' : '')}
              </small>
            </div>
            {!mediaContextActive ? (
              <button type="button" onClick={addPlaceholder} title="Add layer">＋</button>
            ) : activeTool === 'images' ? (
              <button type="button" onClick={() => openAssetWorkspace('image')} title="Open Assets">＋</button>
            ) : activeTool === 'text' ? (
              <button type="button" onClick={() => insertText('Text')} title="Add text">＋</button>
            ) : null}
          </div>

          {mediaContextActive ? (
            renderMediaContext()
          ) : (
            <>
              <div className="apx-pre4-layer-tree" data-phase17-layer-tree={layerTreeMode}>
                <div className="apx-pre4-root-row">
                  <span>▾</span>
                  <strong>{project.name || 'Landing Page'}</strong>
                </div>
                {renderLayerRows(project.document.rootNodeIds)}
                {layerTreeMode === 'over-budget' ? (
                  <div className="apx-phase17-budget-note" role="status">
                    Showing the first {PHASE17_PERFORMANCE_BUDGETS.maxInteractiveLayers.toLocaleString()} layers to keep the editor responsive.
                  </div>
                ) : null}
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
                  <button
                    type="button"
                    onClick={groupSelection}
                    disabled={!canGroupSelection}
                    title={canGroupSelection ? 'Group selected sibling layers' : 'Select 2+ sibling layers'}
                  >
                    Group
                  </button>
                  <button
                    type="button"
                    onClick={ungroupSelection}
                    disabled={!canUngroupSelection}
                    title={canUngroupSelection ? 'Ungroup selected parent group' : 'Select a group layer'}
                  >
                    Ungroup
                  </button>
                </div>
              ) : null}
            </>
          )}
        </aside>
        <main className="apx-pre4-stage">
          <div className="apx-pre4-stagebar">
            <div className="apx-phase17-stage-left">
              <div className="apx-phase17-panel-reveals">
                <button
                  type="button"
                  className="apx-pre4-stage-panel-button"
                  data-top-layers-toggle
                  data-active={!layersCollapsed && leftPanelMode === 'layers' ? 'true' : undefined}
                  aria-pressed={!layersCollapsed && leftPanelMode === 'layers'}
                  onClick={() => {
                    if (!layersCollapsed && leftPanelMode === 'layers') {
                      setLayersCollapsed(true);
                      return;
                    }
                    setLeftPanelMode('layers');
                    setLayersCollapsed(false);
                    setMessage('Layers panel active');
                  }}
                  title={layersCollapsed || leftPanelMode !== 'layers' ? 'Open Layers' : 'Close Layers'}
                >
                  <RectangleStackIcon className="apx-pre4-toolbar-icon" aria-hidden />
                  <span>Layers</span>
                </button>
              </div>
              <button className="apx-pre4-device" type="button">
                <ComputerDesktopIcon className="apx-pre4-control-icon" aria-hidden />
                Desktop ({project.document.width} × {project.document.height})
                <span>⌄</span>
              </button>
            </div>

            <div className="apx-pre4-zoom">
              <button type="button" onClick={() => setZoom((value) => clampZoom(value - 10))}>−</button>
              <span>{zoom}%</span>
              <button type="button" onClick={() => setZoom((value) => clampZoom(value + 10))}>+</button>
            </div>

            <div className="apx-pre4-view-tools">
              <div className="apx-pre4-history-tools" role="group" aria-label="Canvas history">
                <button
                  type="button"
                  data-visual-undo
                  onClick={undo}
                  disabled={!history.current.canUndo}
                  title="Undo · Ctrl/Cmd+Z"
                  aria-label="Undo previous canvas change"
                >
                  <ArrowUturnLeftIcon className="apx-pre4-toolbar-icon" aria-hidden />
                </button>
                <button
                  type="button"
                  data-visual-redo
                  onClick={redo}
                  disabled={!history.current.canRedo}
                  title="Redo · Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y"
                  aria-label="Redo next canvas change"
                >
                  <ArrowUturnRightIcon className="apx-pre4-toolbar-icon" aria-hidden />
                </button>
                <button
                  type="button"
                  className="apx-pre4-reset-canvas"
                  data-visual-reset-canvas
                  onClick={requestCanvasReset}
                  title="Reset entire canvas"
                  aria-label="Reset entire canvas"
                >
                  <TrashIcon className="apx-pre4-toolbar-icon" aria-hidden />
                </button>
              </div>
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
                  // The CSS surface is only a fallback while no authoritative
                  // Apexify frame exists. Keeping it behind a rendered frame
                  // duplicates the canvas background, making x/y/zoom appear to
                  // move only the shadow while the stale CSS copy stays fixed.
                  background: artboardPreviewUrl
                    ? 'transparent'
                    : canvasArtboardBackground(project.document.canvas ?? {}),
                  borderRadius:
                    project.document.canvas?.borderRadius === 'circular'
                      ? '50%'
                      : project.document.canvas?.borderRadius ?? 0,
                  // Canvas opacity is already baked into the authoritative
                  // render. Do not multiply the entire preview (shadow/layers)
                  // by the canvas opacity a second time.
                  opacity: artboardPreviewUrl
                    ? 1
                    : project.document.canvas?.opacity ?? 1,
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
                  style={{
                    left: artboardPreviewBounds?.x ?? 0,
                    top: artboardPreviewBounds?.y ?? 0,
                    width: artboardPreviewBounds?.width ?? project.document.width,
                    height: artboardPreviewBounds?.height ?? project.document.height,
                  }}
                />
              ) : null}
              <div className="apx-pre4-artboard-grid" />

              {artboardPreviewBusy || canvasFrameExtracting ? (
                <div
                  className="apx-pre4-render-progress"
                  data-render-progress
                  role="status"
                  aria-live="polite"
                >
                  <ArrowPathIcon aria-hidden />
                  <span>
                    <strong>
                      {canvasFrameExtracting
                        ? 'Extracting selected frame'
                        : project.document.canvas?.videoBg
                          ? 'Decoding video frame'
                          : 'Rendering preview'}
                    </strong>
                    <small>
                      {project.document.canvas?.videoBg
                        ? 'Local Studio video stays in your browser; no large runtime upload.'
                        : 'Apexify is preparing the latest canvas.'}
                    </small>
                  </span>
                  <i aria-hidden><b /></i>
                </div>
              ) : null}

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

        <button
          type="button"
          className="apx-pre4-inspector-dock-toggle"
          data-phase17-inspector-toggle
          data-phase17-collapse-inspector={!inspectorCollapsed ? '' : undefined}
          data-phase17-show-inspector={inspectorCollapsed ? '' : undefined}
          data-state={inspectorCollapsed ? 'collapsed' : 'expanded'}
          onClick={() => setInspectorCollapsed((value) => !value)}
          aria-controls="apx-pre4-inspector-panel"
          aria-expanded={!inspectorCollapsed}
          aria-label={inspectorCollapsed ? 'Open Inspector panel' : 'Collapse Inspector panel'}
          title={inspectorCollapsed ? 'Open Inspector panel' : 'Collapse Inspector panel'}
        >
          <span className="apx-pre4-inspector-dock-grip" aria-hidden="true" />
          {inspectorCollapsed ? (
            <ChevronLeftIcon aria-hidden="true" />
          ) : (
            <ChevronRightIcon aria-hidden="true" />
          )}
        </button>

        <aside id="apx-pre4-inspector-panel" className="apx-pre4-inspector">
          <div
            className="apx-phase17-resizer apx-phase17-resizer--inspector"
            role="separator"
            aria-label="Resize Inspector panel"
            aria-orientation="vertical"
            aria-valuemin={300}
            aria-valuemax={540}
            aria-valuenow={inspectorWidth}
            tabIndex={0}
            onPointerDown={(event) => beginPanelResize('inspector', event)}
            onKeyDown={(event) => resizePanelByKeyboard('inspector', event)}
          />
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
          {!dockCollapsed ? (
            <div
              className="apx-phase17-resizer apx-phase17-resizer--dock"
              role="separator"
              aria-label="Resize bottom dock and Timeline"
              aria-orientation="horizontal"
              aria-valuemin={120}
              aria-valuemax={480}
              aria-valuenow={dockHeight}
              tabIndex={0}
              onPointerDown={(event) => beginPanelResize('dock', event)}
              onKeyDown={(event) => resizePanelByKeyboard('dock', event)}
            />
          ) : null}
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
            <aside
              className="apx-pre4-assets-pane"
              data-unified-assets-pane
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={(event) => {
                event.preventDefault();
                void addStudioAssetFiles(event.dataTransfer.files);
              }}
            >
              <input
                ref={assetInputRef}
                type="file"
                hidden
                multiple
                accept="image/*,audio/*,video/*,.ttf,.otf,.woff,.woff2"
                onChange={(event) => {
                  if (event.target.files) void addStudioAssetFiles(event.target.files);
                }}
              />
              <div className="apx-pre4-assets-head">
                <div>
                  <strong>Assets</strong>
                  <span>{assets.length}</span>
                </div>
                <button type="button" onClick={() => assetInputRef.current?.click()}>
                  ＋ Upload
                </button>
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
                {filteredAssets.length ? filteredAssets.map((asset) => (
                  <article key={asset.id} className="apx-pre4-asset-card">
                    <button
                      className="apx-pre4-asset-primary"
                      type="button"
                      title={
                        asset.mime.startsWith('image/')
                          ? 'Insert ' + asset.name
                          : isStudioFontAsset(asset)
                            ? 'Apply ' + studioAssetFontFamily(asset)
                            : 'Use ' + asset.name
                      }
                      onClick={() => activateStudioAsset(asset)}
                    >
                      {asset.mime.startsWith('image/') ? (
                        <img src={'data:' + asset.mime + ';base64,' + asset.base64} alt="" />
                      ) : (
                        <span className="apx-pre4-asset-glyph">
                          {asset.mime.startsWith('video/')
                            ? '▷'
                            : asset.mime.startsWith('audio/')
                              ? '♪'
                              : assetKind(asset.mime) === 'font'
                                ? 'Aa'
                                : '◆'}
                        </span>
                      )}
                      <small title={asset.name}>{asset.name}</small>
                    </button>
                    <div className="apx-pre4-asset-actions">
                      <button
                        type="button"
                        onClick={() => copyStudioAssetReference(asset)}
                        title="Copy Studio asset reference"
                        aria-label={'Copy reference for ' + asset.name}
                      >
                        <ClipboardDocumentIcon aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStudioAsset(asset)}
                        title="Remove asset"
                        aria-label={'Remove ' + asset.name}
                      >
                        <TrashIcon aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                )) : (
                  <button
                    type="button"
                    onClick={() => assetInputRef.current?.click()}
                    className="apx-pre4-assets-empty"
                  >
                    <span>＋</span>
                    <small>Upload {assetFilter} assets</small>
                  </button>
                )}
              </div>
            </aside>
          )}
        </section>
      </div>

      {resetConfirmOpen ? (
        <div
          className="apx-pre4-confirm-backdrop"
          role="presentation"
          onMouseDown={() => setResetConfirmOpen(false)}
        >
          <section
            className="apx-pre4-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="apx-reset-canvas-title"
            aria-describedby="apx-reset-canvas-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="apx-pre4-confirm-icon" aria-hidden>
              <TrashIcon />
            </div>
            <div className="apx-pre4-confirm-copy">
              <span className="apx-pre4-confirm-eyebrow">Destructive action</span>
              <h2 id="apx-reset-canvas-title">Reset this canvas?</h2>
              <p id="apx-reset-canvas-description">
                Layers, backgrounds, timelines, operations and generated visual state
                will be cleared. You can restore the previous canvas with Undo.
              </p>
            </div>
            <div className="apx-pre4-confirm-actions">
              <button
                type="button"
                className="apx-pre4-confirm-cancel"
                onClick={() => setResetConfirmOpen(false)}
              >
                Keep canvas
              </button>
              <button
                type="button"
                className="apx-pre4-confirm-danger"
                onClick={resetCanvas}
                autoFocus
              >
                <TrashIcon aria-hidden />
                Reset canvas
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {visualNotice ? (
        <aside
          key={visualNotice.id}
          className="apx-pre4-toast"
          data-kind={visualNotice.kind}
          role={visualNotice.kind === 'error' ? 'alert' : 'status'}
          aria-live={visualNotice.kind === 'error' ? 'assertive' : 'polite'}
        >
          <span className="apx-pre4-toast-icon" aria-hidden>
            {visualNotice.kind === 'loading' ? (
              <ArrowPathIcon />
            ) : visualNotice.kind === 'success' ? (
              <CheckCircleIcon />
            ) : visualNotice.kind === 'error' || visualNotice.kind === 'warning' ? (
              <ExclamationTriangleIcon />
            ) : (
              <InformationCircleIcon />
            )}
          </span>
          <span className="apx-pre4-toast-copy">
            <strong>{visualNotice.title}</strong>
            {visualNotice.text ? <small>{visualNotice.text}</small> : null}
          </span>
          <button
            type="button"
            className="apx-pre4-toast-close"
            onClick={() => setVisualNotice(null)}
            aria-label="Dismiss notification"
          >
            <XMarkIcon aria-hidden />
          </button>
        </aside>
      ) : null}

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
        source={exportedCodeSource}
        fileName={codeFileName}
        onFileNameChange={updateCodeFileName}
        onCopy={() => void navigator.clipboard.writeText(exportedCodeSource)}
        onDownload={() => downloadTextFile(exportedCodeSource, codeFileName)}
        provenanceEnabled={includeCodeProvenance}
        onProvenanceChange={setIncludeCodeProvenance}
        qualityMessage={
          exportCodeQuality.length
            ? exportCodeQuality.map((item) => item.message).join(' · ')
            : 'Canonical one-file TypeScript · ready to copy or download'
        }
        qualityOk={!exportCodeQuality.some((item) => item.severity === 'error')}
      />

      <footer className="apx-pre4-statusbar">
        <span className="apx-pre4-status-product">Apexify Studio</span>
        <span
          className="apx-pre4-save-state"
          data-state={autosaveState}
          data-export-dirty={dirty ? 'true' : undefined}
          title={
            autosaveState === 'saved' && lastAutosavedAt
              ? 'Browser autosave completed at ' + new Date(lastAutosavedAt).toLocaleTimeString()
              : autosaveState === 'error'
                ? 'Browser autosave failed'
                : 'Saving Studio session'
          }
        >
          <i />
          {autosaveState === 'saving'
            ? 'Autosaving…'
            : autosaveState === 'error'
              ? 'Autosave failed'
              : 'Autosaved'}
        </span>
        <span className="apx-pre4-status-message" title={message}>{message}</span>
        <span className="apx-pre4-build-motto">Build something extraordinary. ✦</span>
        <span className="sr-only">Visual workspace ready · Code · Diagnostics · History · unified Assets pane</span>
      </footer>
    </div>
  );
}