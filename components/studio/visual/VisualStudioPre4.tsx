'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { useStudioSharedSession } from '@/components/studio/StudioSharedSession';
import { StudioAssetShelf } from '@/components/studio/StudioAssetShelf';
import {
  STUDIO_ASSET_LIMITS,
  fileToStudioAsset,
  studioAssetDataUrl,
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
import { generateVisualProjectCode } from '@/lib/studio/visual/codegen/generator';
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
  VisualTransform,
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
type Gesture = {
  kind: 'move' | 'resize' | 'rotate' | 'pan' | 'marquee';
  id?: string;
  ids?: string[];
  handle?: ResizeHandle;
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
    'generated' | 'diagnostics' | 'assets' | 'history'
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
  const [modalPreviewMime, setModalPreviewMime] = useState('image/png');
  const [modalPreviewLoading, setModalPreviewLoading] = useState(false);
  const [modalPreviewError, setModalPreviewError] = useState<string | null>(null);
  const [canvasFiltersDraft, setCanvasFiltersDraft] = useState('[]');
  const [canvasFiltersError, setCanvasFiltersError] = useState<string | null>(null);
  const [canvasConfigDraft, setCanvasConfigDraft] = useState('{}');
  const [canvasConfigError, setCanvasConfigError] = useState<string | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [imageConfigDraft, setImageConfigDraft] = useState('{}');
  const [imageConfigError, setImageConfigError] = useState<string | null>(null);
  const [artboardPreviewUrl, setArtboardPreviewUrl] = useState<string | null>(null);
  const [artboardPreviewBusy, setArtboardPreviewBusy] = useState(false);

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

  if (!cleanSignature.current) cleanSignature.current = semanticSignature(project);

  const projectSemanticSignature = useMemo(() => semanticSignature(project), [project]);
  const selected = project.editor?.selectedNodeIds ?? [];
  const primary = selected.length
    ? project.document.nodes[selected[selected.length - 1]]
    : undefined;
  const layerIds = useMemo(() => flattenLayerIds(project), [project]);
  const drawableIds = useMemo(
    () =>
      layerIds.filter((id) => {
        const node = project.document.nodes[id];
        return Boolean(
          node &&
            node.transform?.visible !== false &&
            !(node.kind === 'group' && (node.childIds?.length ?? 0) > 0),
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

  useEffect(() => {
    window.clearTimeout(artboardPreviewTimerRef.current);
    if (!active || !generated.value) return;

    let cancelled = false;
    artboardPreviewTimerRef.current = window.setTimeout(() => {
      void (async () => {
        setArtboardPreviewBusy(true);
        try {
          const runtime =
            artboardRuntimeRef.current ??
            (artboardRuntimeRef.current = createApexifyWebRuntime());
          await runtime.registerFonts(assets);
          const result = await runtime.renderStudioSource(
            generated.value!.source,
            assets,
          );
          if (cancelled) return;
          if (result.ok) setArtboardPreviewUrl(result.dataUrl);
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
  }, [active, assets, generated.value?.source]);

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

  const beginMove = (event: ReactPointerEvent, id: string) => {
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

    if (
      currentGesture.kind !== 'pan' &&
      currentGesture.kind !== 'marquee'
    ) {
      const label =
        currentGesture.kind === 'move'
          ? 'Move'
          : currentGesture.kind === 'resize'
            ? 'Resize'
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
    const source = codeSource || generated.value?.source;
    if (openModal) setPreviewModalOpen(true);
    if (!source) {
      setModalPreviewError(generated.error ?? 'Code unavailable');
      return;
    }

    setModalPreviewLoading(true);
    setModalPreviewError(null);
    try {
      const runtime =
        webRuntimeRef.current ?? (webRuntimeRef.current = createApexifyWebRuntime());
      await runtime.registerFonts(assets);
      const result = await runtime.renderStudioSource(source, assets);
      if (!result.ok) {
        setModalPreviewUrl(null);
        setModalPreviewError(result.error);
        setMessage('Preview failed');
        return;
      }
      setModalPreviewUrl(result.dataUrl);
      setModalPreviewMime(result.mime);
      setMessage('Preview rendered');
    } catch (error) {
      setModalPreviewUrl(null);
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
    if (!modalPreviewUrl) return;
    const extension =
      modalPreviewMime === 'image/jpeg' ? 'jpg' :
      modalPreviewMime === 'image/webp' ? 'webp' :
      modalPreviewMime === 'image/gif' ? 'gif' : 'png';
    const link = document.createElement('a');
    link.href = modalPreviewUrl;
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

  const renderInspector = () => {
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
      return diagnostics.length ? (
        <div className="apx-pre4-diagnostics">
          {diagnostics.map((item, index) => <div key={index}>{item}</div>)}
        </div>
      ) : (
        <div className="apx-pre4-dock-empty">
          <strong>No diagnostics</strong>
          <span>The Visual source, project model and runtime currently agree.</span>
        </div>
      );
    }

    if (dockTab === 'assets') {
      return (
        <StudioAssetShelf
          assets={assets}
          onChange={setAssets}
          onInsertReference={(value) => setMessage('Asset reference: ' + value)}
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
                data-active={activeTool === id ? 'true' : undefined}
                onClick={() => {
                  setActiveTool(id);
                  if (id === 'assets') setDockTab('assets');
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

        <aside className="apx-pre4-layers">
          <div className="apx-pre4-panel-head">
            <div>
              <strong>Layers</strong>
              <small>{layerIds.length ? layerIds.length + ' layers' : 'Layer structure'}{selected.length ? ' · ' + selected.length + ' selected' : ''}</small>
            </div>
            <button type="button" onClick={addPlaceholder} title="Add layer">＋</button>
          </div>
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
              <div className="apx-pre4-artboard-grid" />

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
                    data-selected={isSelected ? 'true' : undefined}
                    onPointerDown={(event) => beginMove(event, id)}
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
                    <span>{node.name ?? node.kind}</span>
                    {isSelected && !node.transform?.locked && handles.map((handle) => (
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
                    {isSelected && !node.transform?.locked && (
                      <button
                        aria-label="Rotate"
                        className="apx-pre4-rotate"
                        onPointerDown={(event) => beginRotate(event, id)}
                      />
                    )}
                  </div>
                );
              })}

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
                  <button key={asset.id} type="button" title={asset.name} onClick={() => setDockTab('assets')}>
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
