'use client';

import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChartBarIcon,
  ClockIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderIcon,
  FolderOpenIcon,
  HandRaisedIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PhotoIcon,
  PlayIcon,
  PlusIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  TrashIcon,
  VideoCameraIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { useStudioSharedSession } from '@/components/studio/StudioSharedSession';
import { StudioModeSwitch, type StudioMode } from '@/components/studio/StudioModeSwitch';
import { createVisualId } from '@/lib/studio/visual/ids';
import { createVisualProject } from '@/lib/studio/visual/project';
import { generateVisualProjectCode } from '@/lib/studio/visual/codegen/generator';
import {
  downloadVisualProject,
  loadVisualProjectFile,
} from '@/lib/studio/visual/persistence';
import { useVisualEditor } from '@/components/studio/visual/useVisualEditor';
import {
  addEditorPlaceholder,
  alignSelectedNodes,
  deleteSelectedNodes,
  distributeSelectedNodes,
  duplicateSelectedNodes,
  moveSelectedNodes,
  reorderRootNode,
  selectedNodeIds,
  setVisualSelection,
  updateNodeTransform,
  updateSelectedTransforms,
} from '@/lib/studio/visual/editor/mutations';
import {
  resolvedTransform,
  snapNodeTransform,
  snapRotation,
  type SnapGuide,
} from '@/lib/studio/visual/editor/geometry';
import type { VisualProject, VisualTransform } from '@/lib/studio/visual/model';
import {
  STUDIO_ASSET_LIMITS,
  fileToStudioAsset,
  isStudioFontAsset,
  studioAssetDataUrl,
  totalStudioAssetBytes,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';

type Props = { active: boolean; mode: StudioMode; onModeChange: (mode: StudioMode) => void };
type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type ToolId =
  | 'canvas'
  | 'images'
  | 'text'
  | 'charts'
  | 'shapes'
  | 'paths'
  | 'layers'
  | 'components'
  | 'assets'
  | 'audio'
  | 'video';
type InspectorTab = 'Style' | 'Transform' | 'Effects' | 'Data' | 'Advanced';
type DockTab = 'Preview' | 'Generated Code' | 'Diagnostics' | 'History';

const TOOL_ITEMS: Array<{ id: ToolId; label: string; icon: Icon }> = [
  { id: 'canvas', label: 'Canvas', icon: RectangleGroupIcon },
  { id: 'images', label: 'Images', icon: PhotoIcon },
  { id: 'text', label: 'Text', icon: DocumentTextIcon },
  { id: 'charts', label: 'Charts', icon: ChartBarIcon },
  { id: 'shapes', label: 'Shapes', icon: CubeIcon },
  { id: 'paths', label: 'Paths', icon: CursorArrowRaysIcon },
  { id: 'layers', label: 'Layers', icon: RectangleStackIcon },
  { id: 'components', label: 'Components', icon: Squares2X2Icon },
  { id: 'assets', label: 'Assets', icon: FolderOpenIcon },
  { id: 'audio', label: 'Audio', icon: MusicalNoteIcon },
  { id: 'video', label: 'Video', icon: VideoCameraIcon },
];

const INSPECTOR_TABS: InspectorTab[] = ['Style', 'Transform', 'Effects', 'Data', 'Advanced'];
const DOCK_TABS: DockTab[] = ['Preview', 'Generated Code', 'Diagnostics', 'History'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function ActionButton({
  icon: IconComponent,
  children,
  active = false,
  disabled = false,
  onClick,
  title,
}: {
  icon: Icon;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="apx-vw-action"
      data-active={active ? 'true' : undefined}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <IconComponent className="h-4 w-4" aria-hidden />
      <span>{children}</span>
    </button>
  );
}

function NumericField({
  label,
  value,
  onCommit,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 1000) / 1000));

  useEffect(() => {
    setDraft(String(Math.round(value * 1000) / 1000));
  }, [value]);

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, parsed));
    onCommit(next);
    setDraft(String(next));
  };

  return (
    <div className="apx-vw-number-field">
      <label>{label}</label>
      <input
        type="number"
        value={draft}
        step={step}
        min={min}
        max={max}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          } else if (event.key === 'Escape') {
            setDraft(String(value));
            event.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}

export default function VisualStudio({ active, mode, onModeChange }: Props) {
  const {
    assets,
    setAssets,
    previewArtifacts,
    activeArtifactId,
    setActiveArtifactId,
    error,
    previewWarnings,
    elapsedMs,
    history,
    setCodeHandoff,
  } = useStudioSharedSession();

  const editor = useVisualEditor(createVisualProject());
  const { project, projectRef } = editor;
  const [projectError, setProjectError] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolId>('canvas');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('Transform');
  const [dockTab, setDockTab] = useState<DockTab>('Generated Code');
  const [zoom, setZoom] = useState(78);
  const [viewportMode, setViewportMode] = useState<'select' | 'pan'>('select');
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [assetFilter, setAssetFilter] = useState<'all' | 'image' | 'audio' | 'video' | 'font'>('all');
  const [assetQuery, setAssetQuery] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [snapping, setSnapping] = useState(true);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);
  const panDragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const nodeDragRef = useRef<{ nodeId: string; startX: number; startY: number; before: VisualProject } | null>(null);
  const resizeRef = useRef<{ nodeId: string; handle: 'nw' | 'ne' | 'se' | 'sw'; startX: number; startY: number; before: VisualProject } | null>(null);
  const rotateRef = useRef<{ nodeId: string; centerX: number; centerY: number; offset: number; before: VisualProject } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const projectFileRef = useRef<HTMLInputElement>(null);

  const generated = useMemo(() => {
    try {
      return { value: generateVisualProjectCode(project), error: null as string | null };
    } catch (err) {
      return {
        value: null,
        error: err instanceof Error ? err.message : 'Visual Project code generation failed.',
      };
    }
  }, [project]);

  const activeArtifact =
    previewArtifacts.find((artifact) => artifact.id === activeArtifactId) ??
    previewArtifacts[0] ??
    null;

  const selection = selectedNodeIds(project);
  const selectedNodes = selection
    .map((id) => project.document.nodes[id])
    .filter(Boolean);
  const primaryNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const primaryTransform = primaryNode ? resolvedTransform(primaryNode.transform) : null;

  const filteredAssets = useMemo(() => {
    const query = assetQuery.trim().toLowerCase();
    return assets.filter((asset) => {
      const typeMatches =
        assetFilter === 'all' ||
        (assetFilter === 'image' && asset.mime.startsWith('image/')) ||
        (assetFilter === 'audio' && asset.mime.startsWith('audio/')) ||
        (assetFilter === 'video' && asset.mime.startsWith('video/')) ||
        (assetFilter === 'font' && isStudioFontAsset(asset));
      return typeMatches && (!query || asset.name.toLowerCase().includes(query));
    });
  }, [assets, assetFilter, assetQuery]);

  const addAssets = async (files: FileList | File[]) => {
    const incoming = Array.from(files);
    if (!incoming.length) return;
    setUploadError(null);

    if (assets.length + incoming.length > STUDIO_ASSET_LIMITS.maxCount) {
      setUploadError(`Studio accepts at most ${STUDIO_ASSET_LIMITS.maxCount} assets.`);
      return;
    }

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
      setAssets((current) => [...current, ...created]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not add Studio asset.');
    } finally {
      if (uploadRef.current) uploadRef.current.value = '';
    }
  };

  const resetViewport = () => {
    const viewport = viewportRef.current;
    const artboard = artboardRef.current;
    if (viewport && artboard) {
      const horizontal = (viewport.clientWidth - 64) / Math.max(1, artboard.offsetWidth);
      const vertical = (viewport.clientHeight - 64) / Math.max(1, artboard.offsetHeight);
      setZoom(Math.round(Math.min(1.4, Math.max(0.4, Math.min(horizontal, vertical))) * 100));
    } else {
      setZoom(78);
    }
    setPan({ x: 0, y: 0 });
  };

  const saveProject = () => {
    const next = {
      ...project,
      updatedAt: new Date().toISOString(),
      editor: {
        ...project.editor,
        zoom: zoom / 100,
        panX: pan.x,
        panY: pan.y,
      },
    };
    editor.replaceProject(next);
    setProjectError(null);
    downloadVisualProject(next);
  };

  const loadProject = async (file: File) => {
    try {
      const loaded = await loadVisualProjectFile(file);
      editor.replaceProject(loaded, true);
      setZoom(Math.round((loaded.editor?.zoom ?? 0.78) * 100));
      setPan({
        x: loaded.editor?.panX ?? 0,
        y: loaded.editor?.panY ?? 0,
      });
      setProjectError(null);
      setDockTab('Generated Code');
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : 'Could not load Visual Project.');
      setDockTab('Diagnostics');
    } finally {
      if (projectFileRef.current) projectFileRef.current.value = '';
    }
  };

  const handoffToCode = () => {
    if (!generated.value) {
      setProjectError(generated.error ?? 'Generated code is unavailable.');
      setDockTab('Diagnostics');
      return;
    }
    setCodeHandoff({
      id: createVisualId('handoff'),
      name: `${project.name} — Generated`,
      source: generated.value.source,
    });
    onModeChange('code');
  };

  const commitProject = (label: string, updater: (current: VisualProject) => VisualProject) => {
    editor.commit(label, updater);
    setProjectError(null);
  };

  const commitTransform = (nodeId: string, patch: Partial<VisualTransform>, label = 'Transform layer') => {
    commitProject(label, (current) => updateNodeTransform(current, nodeId, patch));
  };

  const addPlaceholder = () => {
    commitProject('Add layer', (current) => addEditorPlaceholder(current));
    setTool('layers');
    setInspectorTab('Transform');
  };

  const selectLayer = (nodeId: string, additive = false) => {
    const current = selectedNodeIds(projectRef.current);
    if (!additive) {
      editor.select([nodeId]);
      return;
    }
    editor.select(current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId]);
  };

  const undo = () => {
    const label = editor.undo();
    if (label) {
      setSnapGuides([]);
      setProjectError(null);
    }
  };

  const redo = () => {
    const label = editor.redo();
    if (label) {
      setSnapGuides([]);
      setProjectError(null);
    }
  };

  const pointerToDocumentDelta = (dx: number, dy: number) => {
    const artboard = artboardRef.current;
    if (!artboard) return { dx: 0, dy: 0 };
    const rect = artboard.getBoundingClientRect();
    return {
      dx: dx * (projectRef.current.document.width / Math.max(1, rect.width)),
      dy: dy * (projectRef.current.document.height / Math.max(1, rect.height)),
    };
  };

  const beginNodeMove = (event: React.PointerEvent<HTMLElement>, nodeId: string) => {
    if (viewportMode !== 'select') return;
    event.stopPropagation();
    const current = projectRef.current;
    const node = current.document.nodes[nodeId];
    if (!node || resolvedTransform(node.transform).locked) {
      selectLayer(nodeId, event.metaKey || event.ctrlKey || event.shiftKey);
      return;
    }

    const additive = event.metaKey || event.ctrlKey || event.shiftKey;
    if (!selectedNodeIds(current).includes(nodeId)) selectLayer(nodeId, additive);
    const before = editor.beginInteraction('Move layer');
    nodeDragRef.current = {
      nodeId,
      startX: event.clientX,
      startY: event.clientY,
      before,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveNodePointer = (event: React.PointerEvent<HTMLElement>) => {
    const drag = nodeDragRef.current;
    if (!drag) return;
    const delta = pointerToDocumentDelta(event.clientX - drag.startX, event.clientY - drag.startY);
    const original = resolvedTransform(drag.before.document.nodes[drag.nodeId]?.transform);
    const candidate = {
      ...original,
      x: original.x + delta.dx,
      y: original.y + delta.dy,
    };
    const snapped = snapNodeTransform(drag.before, drag.nodeId, candidate, { enabled: snapping });
    const snappedTransform = resolvedTransform(snapped.transform);
    const next = moveSelectedNodes(
      drag.before,
      snappedTransform.x - original.x,
      snappedTransform.y - original.y,
    );
    setSnapGuides(snapped.guides);
    editor.updateInteraction(next);
  };

  const finishNodeMove = () => {
    if (!nodeDragRef.current) return;
    nodeDragRef.current = null;
    setSnapGuides([]);
    editor.finishInteraction();
  };

  const beginResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    nodeId: string,
    handle: 'nw' | 'ne' | 'se' | 'sw',
  ) => {
    event.stopPropagation();
    const node = projectRef.current.document.nodes[nodeId];
    if (!node || resolvedTransform(node.transform).locked) return;
    resizeRef.current = {
      nodeId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      before: editor.beginInteraction('Resize layer'),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const resizePointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = resizeRef.current;
    if (!drag) return;
    const delta = pointerToDocumentDelta(event.clientX - drag.startX, event.clientY - drag.startY);
    const original = resolvedTransform(drag.before.document.nodes[drag.nodeId]?.transform);
    let x = original.x;
    let y = original.y;
    let width = original.width;
    let height = original.height;

    if (drag.handle.includes('e')) width = Math.max(8, original.width + delta.dx);
    if (drag.handle.includes('s')) height = Math.max(8, original.height + delta.dy);
    if (drag.handle.includes('w')) {
      width = Math.max(8, original.width - delta.dx);
      x = original.x + (original.width - width);
    }
    if (drag.handle.includes('n')) {
      height = Math.max(8, original.height - delta.dy);
      y = original.y + (original.height - height);
    }

    const grid = snapping ? 8 : 1;
    width = Math.round(width / grid) * grid;
    height = Math.round(height / grid) * grid;
    x = Math.round(x / grid) * grid;
    y = Math.round(y / grid) * grid;

    editor.updateInteraction(updateNodeTransform(drag.before, drag.nodeId, { x, y, width, height }));
  };

  const finishResize = () => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    editor.finishInteraction();
  };

  const beginRotate = (event: React.PointerEvent<HTMLButtonElement>, nodeId: string) => {
    event.stopPropagation();
    const nodeElement = event.currentTarget.closest('[data-visual-node]') as HTMLElement | null;
    const node = projectRef.current.document.nodes[nodeId];
    if (!nodeElement || !node || resolvedTransform(node.transform).locked) return;
    const rect = nodeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pointerAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
    rotateRef.current = {
      nodeId,
      centerX,
      centerY,
      offset: resolvedTransform(node.transform).rotation - pointerAngle,
      before: editor.beginInteraction('Rotate layer'),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const rotatePointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = rotateRef.current;
    if (!drag) return;
    const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * 180 / Math.PI;
    const rotation = snapRotation(angle + drag.offset, snapping);
    editor.updateInteraction(updateNodeTransform(drag.before, drag.nodeId, { rotation }));
  };

  const finishRotate = () => {
    if (!rotateRef.current) return;
    rotateRef.current = null;
    editor.finishInteraction();
  };

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      ) return;

      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (command && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
        return;
      }
      if (command && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        commitProject('Duplicate layer', duplicateSelectedNodes);
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!selectedNodeIds(projectRef.current).length) return;
        event.preventDefault();
        commitProject('Delete layer', deleteSelectedNodes);
        return;
      }
      if (event.key === 'Escape') {
        editor.select([]);
        return;
      }

      const amount = event.shiftKey ? 10 : 1;
      const movement: Record<string, [number, number]> = {
        ArrowLeft: [-amount, 0],
        ArrowRight: [amount, 0],
        ArrowUp: [0, -amount],
        ArrowDown: [0, amount],
      };
      const delta = movement[event.key];
      if (delta && selectedNodeIds(projectRef.current).length) {
        event.preventDefault();
        commitProject('Nudge layer', (current) => moveSelectedNodes(current, delta[0], delta[1]));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, editor, snapping]);

  return (
    <div
      className="apx-visual-workspace"
      data-studio-visual-workspace
      data-active={active ? 'true' : 'false'}
      data-layers-collapsed={layersCollapsed ? 'true' : 'false'}
      data-inspector-collapsed={inspectorCollapsed ? 'true' : 'false'}
      data-dock-collapsed={dockCollapsed ? 'true' : 'false'}
    >
      <header className="apx-vw-header">
        <div className="apx-vw-brand">
          <span className="apx-vw-brandmark">A</span>
          <span>
            <strong>Visual Workspace</strong>
            <small>Design · Visualize · Generate</small>
          </span>
        </div>

        <StudioModeSwitch mode={mode} onChange={onModeChange} className="studio-mode-switch--visualbar" />

        <div className="apx-vw-header-actions">
          <ActionButton icon={EyeIcon} active={dockTab === 'Preview'} onClick={() => setDockTab('Preview')}>
            Preview
          </ActionButton>
          <ActionButton
            icon={CodeBracketIcon}
            active={dockTab === 'Generated Code'}
            onClick={() => setDockTab('Generated Code')}
          >
            Generated Code
          </ActionButton>

          <details className="apx-vw-project-menu">
            <summary className="apx-vw-action">
              <FolderOpenIcon className="h-4 w-4" aria-hidden />
              <span>Project</span>
            </summary>
            <div className="apx-vw-project-menu__panel">
              <button type="button" data-visual-project-load onClick={() => projectFileRef.current?.click()}>
                <FolderOpenIcon className="h-4 w-4" aria-hidden />
                <span>Load .apexstudio.json</span>
              </button>
              <button type="button" data-visual-project-save onClick={saveProject}>
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
                <span>Save project</span>
              </button>
              <button
                type="button"
                data-visual-open-generated-code
                onClick={handoffToCode}
                disabled={!generated.value}
              >
                <CodeBracketIcon className="h-4 w-4" aria-hidden />
                <span>Open generated code</span>
              </button>
              <small>{generated.value?.fileName ?? 'Code generation unavailable'}</small>
            </div>
            <input
              ref={projectFileRef}
              type="file"
              hidden
              accept=".apexstudio.json,application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadProject(file);
              }}
            />
          </details>
        </div>
      </header>

      <div className="apx-vw-layout">
        <nav className="apx-vw-toolrail" aria-label="Visual authoring categories">
          {TOOL_ITEMS.map((item) => {
            const IconComponent = item.icon;
            const selected = tool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className="apx-vw-tool"
                data-active={selected ? 'true' : undefined}
                onClick={() => setTool(item.id)}
                aria-pressed={selected}
              >
                <IconComponent className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <aside className="apx-vw-layers" aria-label="Visual layers">
          <div className="apx-vw-panel-heading">
            <div>
              <strong>Layers</strong>
              <small>{tool[0].toUpperCase() + tool.slice(1)} workspace</small>
            </div>
            <div className="apx-vw-heading-actions">
              <button
                type="button"
                className="apx-vw-iconbutton"
                onClick={() => setLayersCollapsed(true)}
                title="Collapse layers"
                aria-label="Collapse layers panel"
              >
                <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" className="apx-vw-iconbutton" onClick={addPlaceholder} title="Add generic layer" aria-label="Add generic layer">
                <PlusIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="apx-vw-layer-tree" data-visual-layer-tree>
            <div className="apx-vw-layer-row apx-vw-layer-row--root">
              <FolderIcon className="h-4 w-4" aria-hidden />
              <span>Visual Project</span>
              <span className="ml-auto apx-vw-layer-count">{project.document.rootNodeIds.length}</span>
            </div>
            <div className="apx-vw-layer-row">
              <RectangleGroupIcon className="h-4 w-4" aria-hidden />
              <span>Canvas</span>
            </div>

            {project.document.rootNodeIds.length ? (
              [...project.document.rootNodeIds].reverse().map((nodeId) => {
                const node = project.document.nodes[nodeId];
                if (!node) return null;
                const transform = resolvedTransform(node.transform);
                const selected = selection.includes(nodeId);
                return (
                  <div
                    key={nodeId}
                    className="apx-vw-layer-row apx-vw-layer-row--editable"
                    data-selected={selected ? 'true' : undefined}
                    data-visual-layer-id={nodeId}
                    onClick={(event) => selectLayer(nodeId, event.metaKey || event.ctrlKey || event.shiftKey)}
                  >
                    <RectangleStackIcon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="apx-vw-layer-name">{node.name ?? node.kind}</span>
                    <div className="apx-vw-layer-actions" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        title={transform.visible ? 'Hide layer' : 'Show layer'}
                        aria-label={transform.visible ? 'Hide layer' : 'Show layer'}
                        onClick={() =>
                          commitTransform(nodeId, { visible: !transform.visible }, transform.visible ? 'Hide layer' : 'Show layer')
                        }
                      >
                        {transform.visible ? <EyeIcon className="h-3.5 w-3.5" aria-hidden /> : <EyeSlashIcon className="h-3.5 w-3.5" aria-hidden />}
                      </button>
                      <button
                        type="button"
                        title={transform.locked ? 'Unlock layer' : 'Lock layer'}
                        aria-label={transform.locked ? 'Unlock layer' : 'Lock layer'}
                        onClick={() =>
                          commitTransform(nodeId, { locked: !transform.locked }, transform.locked ? 'Unlock layer' : 'Lock layer')
                        }
                      >
                        {transform.locked ? <LockClosedIcon className="h-3.5 w-3.5" aria-hidden /> : <LockOpenIcon className="h-3.5 w-3.5" aria-hidden />}
                      </button>
                      <button
                        type="button"
                        title="Move layer forward"
                        aria-label="Move layer forward"
                        onClick={() => commitProject('Reorder layer', (current) => reorderRootNode(current, nodeId, 'forward'))}
                      >
                        <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        title="Move layer backward"
                        aria-label="Move layer backward"
                        onClick={() => commitProject('Reorder layer', (current) => reorderRootNode(current, nodeId, 'backward'))}
                      >
                        <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="apx-vw-empty-list">
                <RectangleStackIcon className="h-6 w-6" aria-hidden />
                <strong>No layers yet</strong>
                <span>Add generic layers to exercise selection, transforms, history and snapping.</span>
              </div>
            )}
          </div>

          <div className="apx-vw-mini-card apx-vw-layer-toolbar">
            <div className="apx-vw-layer-toolbar__row">
              <button type="button" onClick={addPlaceholder} data-visual-add-layer>
                <PlusIcon className="h-4 w-4" aria-hidden />
                Add layer
              </button>
              <button
                type="button"
                disabled={!selection.length}
                onClick={() => commitProject('Duplicate layer', duplicateSelectedNodes)}
                title="Duplicate selected layer(s)"
              >
                <DocumentDuplicateIcon className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled={!selection.length}
                onClick={() => commitProject('Delete layer', deleteSelectedNodes)}
                title="Delete selected layer(s)"
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <span>{selection.length ? `${selection.length} selected` : 'Select a layer to edit'}</span>
          </div>
        </aside>

        <main className="apx-vw-stage">
          <div className="apx-vw-stagebar">
            {layersCollapsed ? (
              <button
                type="button"
                className="apx-vw-panel-reveal"
                onClick={() => setLayersCollapsed(false)}
                title="Show layers"
              >
                <ChevronRightIcon className="h-4 w-4" aria-hidden />
                <RectangleStackIcon className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <div className="apx-vw-device">
              <RectangleGroupIcon className="h-4 w-4" aria-hidden />
              <span>Desktop ({project.document.width} × {project.document.height})</span>
            </div>

            <div className="apx-vw-zoom">
              <button type="button" onClick={() => setZoom((value) => Math.max(40, value - 10))} aria-label="Zoom out">−</button>
              <span>{zoom}%</span>
              <button type="button" onClick={() => setZoom((value) => Math.min(140, value + 10))} aria-label="Zoom in">+</button>
            </div>

            <div className="apx-vw-history-controls">
              <button type="button" onClick={undo} disabled={!editor.canUndo} aria-label="Undo" title="Undo · Ctrl/Cmd+Z">
                <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" onClick={redo} disabled={!editor.canRedo} aria-label="Redo" title="Redo · Ctrl/Cmd+Shift+Z">
                <ArrowUturnRightIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="apx-vw-viewtools">
              <button
                type="button"
                data-active={viewportMode === 'pan' ? 'true' : undefined}
                onClick={() => setViewportMode('pan')}
                aria-label="Pan viewport"
                title="Pan viewport"
              >
                <HandRaisedIcon className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                data-active={viewportMode === 'select' ? 'true' : undefined}
                onClick={() => setViewportMode('select')}
                aria-label="Select mode"
                title="Select mode"
              >
                <CursorArrowRaysIcon className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" aria-label="Fit viewport" title="Fit viewport" onClick={resetViewport}>
                <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                data-active={snapping ? 'true' : undefined}
                onClick={() => setSnapping((value) => !value)}
                aria-label="Toggle snapping"
                title={snapping ? 'Snapping on' : 'Snapping off'}
                data-visual-snapping
              >
                <span className="apx-vw-snap-icon">⌁</span>
              </button>
              <button
                type="button"
                data-active={!inspectorCollapsed ? 'true' : undefined}
                onClick={() => setInspectorCollapsed((value) => !value)}
                aria-label="Toggle inspector"
                title="Toggle inspector"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="apx-vw-viewport"
            data-visual-viewport
            onPointerDown={(event) => {
              if (viewportMode !== 'pan') return;
              event.currentTarget.setPointerCapture(event.pointerId);
              panDragRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                originX: pan.x,
                originY: pan.y,
              };
            }}
            onPointerMove={(event) => {
              const drag = panDragRef.current;
              if (!drag || viewportMode !== 'pan') return;
              setPan({
                x: drag.originX + event.clientX - drag.startX,
                y: drag.originY + event.clientY - drag.startY,
              });
            }}
            onPointerUp={() => {
              panDragRef.current = null;
            }}
            onPointerCancel={() => {
              panDragRef.current = null;
            }}
            onWheel={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              event.preventDefault();
              setZoom((value) => Math.min(140, Math.max(40, value + (event.deltaY < 0 ? 5 : -5))));
            }}
          >
            <div
              ref={artboardRef}
              className="apx-vw-artboard"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` }}
              data-viewport-mode={viewportMode}
              onPointerDown={(event) => {
                if (viewportMode === 'select' && !(event.target as HTMLElement).closest('[data-visual-node]')) {
                  editor.select([]);
                }
              }}
            >
              <div className="apx-vw-artboard-grid" />

              {snapGuides.map((guide, index) => (
                <div
                  key={`${guide.axis}-${guide.value}-${index}`}
                  className={`apx-vw-snap-guide apx-vw-snap-guide--${guide.axis}`}
                  data-source={guide.source}
                  style={
                    guide.axis === 'x'
                      ? { left: `${(guide.value / project.document.width) * 100}%` }
                      : { top: `${(guide.value / project.document.height) * 100}%` }
                  }
                />
              ))}

              {project.document.rootNodeIds.map((nodeId) => {
                const node = project.document.nodes[nodeId];
                if (!node) return null;
                const transform = resolvedTransform(node.transform);
                if (!transform.visible) return null;
                const selected = selection.includes(nodeId);
                return (
                  <div
                    key={nodeId}
                    className="apx-vw-editor-node"
                    data-visual-node={nodeId}
                    data-selected={selected ? 'true' : undefined}
                    data-locked={transform.locked ? 'true' : undefined}
                    style={{
                      left: `${(transform.x / project.document.width) * 100}%`,
                      top: `${(transform.y / project.document.height) * 100}%`,
                      width: `${(transform.width / project.document.width) * 100}%`,
                      height: `${(transform.height / project.document.height) * 100}%`,
                      opacity: transform.opacity,
                      zIndex: transform.zIndex + 2,
                      transform: `rotate(${transform.rotation}deg)`,
                    }}
                    onPointerDown={(event) => beginNodeMove(event, nodeId)}
                    onPointerMove={moveNodePointer}
                    onPointerUp={finishNodeMove}
                    onPointerCancel={() => {
                      nodeDragRef.current = null;
                      setSnapGuides([]);
                      editor.cancelInteraction();
                    }}
                  >
                    <div className="apx-vw-editor-node__content">
                      <span>{node.name ?? node.kind}</span>
                      <small>{Math.round(transform.width)} × {Math.round(transform.height)}</small>
                      {transform.locked ? <LockClosedIcon className="h-4 w-4" aria-hidden /> : null}
                    </div>

                    {selected && selection.length === 1 && !transform.locked ? (
                      <>
                        {(['nw', 'ne', 'se', 'sw'] as const).map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            className={`apx-vw-resize-handle apx-vw-resize-handle--${handle}`}
                            aria-label={`Resize ${handle}`}
                            onPointerDown={(event) => beginResize(event, nodeId, handle)}
                            onPointerMove={resizePointer}
                            onPointerUp={finishResize}
                            onPointerCancel={() => {
                              resizeRef.current = null;
                              editor.cancelInteraction();
                            }}
                          />
                        ))}
                        <button
                          type="button"
                          className="apx-vw-rotate-handle"
                          aria-label="Rotate layer"
                          title="Rotate layer"
                          onPointerDown={(event) => beginRotate(event, nodeId)}
                          onPointerMove={rotatePointer}
                          onPointerUp={finishRotate}
                          onPointerCancel={() => {
                            rotateRef.current = null;
                            editor.cancelInteraction();
                          }}
                        >
                          ↻
                        </button>
                      </>
                    ) : null}
                  </div>
                );
              })}

              {!project.document.rootNodeIds.length ? (
                <div className="apx-vw-empty-canvas">
                  <span className="apx-vw-empty-logo">A</span>
                  <span className="apx-vw-kicker">Apexify Studio</span>
                  <h2>Editor core ready</h2>
                  <p>
                    Add generic layers to exercise selection, drag, resize, rotation, snapping, history and keyboard editing before domain-specific tools arrive.
                  </p>
                  <button type="button" className="apx-vw-empty-add" onClick={addPlaceholder}>
                    <PlusIcon className="h-4 w-4" aria-hidden />
                    Add first layer
                  </button>
                  <div className="apx-vw-empty-pills">
                    <span>{project.document.width} × {project.document.height}</span>
                    <span>Undo / redo</span>
                    <span>Grid + object snapping</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </main>

        <aside className="apx-vw-inspector" aria-label="Inspector">
          <div className="apx-vw-inspector-top">
            <span>Inspector</span>
            <button
              type="button"
              className="apx-vw-iconbutton"
              onClick={() => setInspectorCollapsed(true)}
              title="Collapse inspector"
              aria-label="Collapse inspector panel"
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="apx-vw-inspector-tabs" role="tablist" aria-label="Inspector sections">
            {INSPECTOR_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={inspectorTab === tab}
                data-active={inspectorTab === tab ? 'true' : undefined}
                onClick={() => setInspectorTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="apx-vw-inspector-body" data-visual-inspector>
            <div className="apx-vw-inspector-title">
              <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden />
              <div>
                <strong>{inspectorTab}</strong>
                <small>
                  {primaryNode
                    ? primaryNode.name ?? primaryNode.kind
                    : selection.length
                      ? `${selection.length} layers selected`
                      : 'No layer selected'}
                </small>
              </div>
            </div>

            {!selection.length ? (
              <>
                <div className="apx-vw-fieldgroup">
                  <label>Document</label>
                  <div className="apx-vw-field apx-vw-field--disabled">
                    {project.document.width} × {project.document.height}
                  </div>
                </div>
                <div className="apx-vw-inspector-note">
                  Select a generic layer to edit transforms. Domain-specific properties arrive in their owning phases.
                </div>
              </>
            ) : null}

            {primaryNode && primaryTransform ? (
              <>
                <div className="apx-vw-fieldgroup">
                  <label>Type</label>
                  <div className="apx-vw-field apx-vw-field--disabled">{primaryNode.kind}</div>
                </div>

                {inspectorTab === 'Transform' ? (
                  <>
                    <div className="apx-vw-number-grid">
                      <NumericField
                        label="X"
                        value={primaryTransform.x}
                        onCommit={(value) => commitTransform(primaryNode.id, { x: value })}
                      />
                      <NumericField
                        label="Y"
                        value={primaryTransform.y}
                        onCommit={(value) => commitTransform(primaryNode.id, { y: value })}
                      />
                      <NumericField
                        label="W"
                        value={primaryTransform.width}
                        min={8}
                        onCommit={(value) => commitTransform(primaryNode.id, { width: value })}
                      />
                      <NumericField
                        label="H"
                        value={primaryTransform.height}
                        min={8}
                        onCommit={(value) => commitTransform(primaryNode.id, { height: value })}
                      />
                      <NumericField
                        label="Rotation"
                        value={primaryTransform.rotation}
                        onCommit={(value) => commitTransform(primaryNode.id, { rotation: value })}
                      />
                      <NumericField
                        label="Opacity"
                        value={Math.round(primaryTransform.opacity * 100)}
                        min={0}
                        max={100}
                        onCommit={(value) => commitTransform(primaryNode.id, { opacity: value / 100 })}
                      />
                    </div>

                    <div className="apx-vw-inspector-actions">
                      <button
                        type="button"
                        data-active={primaryTransform.visible ? 'true' : undefined}
                        onClick={() =>
                          commitTransform(primaryNode.id, { visible: !primaryTransform.visible }, primaryTransform.visible ? 'Hide layer' : 'Show layer')
                        }
                      >
                        {primaryTransform.visible ? <EyeIcon className="h-4 w-4" aria-hidden /> : <EyeSlashIcon className="h-4 w-4" aria-hidden />}
                        {primaryTransform.visible ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        data-active={primaryTransform.locked ? 'true' : undefined}
                        onClick={() =>
                          commitTransform(primaryNode.id, { locked: !primaryTransform.locked }, primaryTransform.locked ? 'Unlock layer' : 'Lock layer')
                        }
                      >
                        {primaryTransform.locked ? <LockClosedIcon className="h-4 w-4" aria-hidden /> : <LockOpenIcon className="h-4 w-4" aria-hidden />}
                        {primaryTransform.locked ? 'Locked' : 'Unlocked'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="apx-vw-inspector-note">
                    Phase 3 exposes geometry and editor state only. {inspectorTab} properties remain reserved for later visual domains.
                  </div>
                )}
              </>
            ) : null}

            {selection.length > 1 ? (
              <div className="apx-vw-multiselect-tools" data-visual-multiselect-tools>
                <strong>Align</strong>
                <div className="apx-vw-align-grid">
                  <button type="button" onClick={() => commitProject('Align left', (current) => alignSelectedNodes(current, 'left'))}>Left</button>
                  <button type="button" onClick={() => commitProject('Align center', (current) => alignSelectedNodes(current, 'center-x'))}>Center</button>
                  <button type="button" onClick={() => commitProject('Align right', (current) => alignSelectedNodes(current, 'right'))}>Right</button>
                  <button type="button" onClick={() => commitProject('Align top', (current) => alignSelectedNodes(current, 'top'))}>Top</button>
                  <button type="button" onClick={() => commitProject('Align middle', (current) => alignSelectedNodes(current, 'center-y'))}>Middle</button>
                  <button type="button" onClick={() => commitProject('Align bottom', (current) => alignSelectedNodes(current, 'bottom'))}>Bottom</button>
                </div>

                <strong>Distribute</strong>
                <div className="apx-vw-align-grid apx-vw-align-grid--two">
                  <button
                    type="button"
                    disabled={selection.length < 3}
                    onClick={() => commitProject('Distribute horizontally', (current) => distributeSelectedNodes(current, 'horizontal'))}
                  >
                    Horizontal
                  </button>
                  <button
                    type="button"
                    disabled={selection.length < 3}
                    onClick={() => commitProject('Distribute vertically', (current) => distributeSelectedNodes(current, 'vertical'))}
                  >
                    Vertical
                  </button>
                </div>

                <div className="apx-vw-inspector-actions">
                  <button
                    type="button"
                    onClick={() => commitProject('Show selection', (current) => updateSelectedTransforms(current, () => ({ visible: true })))}
                  >
                    <EyeIcon className="h-4 w-4" aria-hidden />
                    Show
                  </button>
                  <button
                    type="button"
                    onClick={() => commitProject('Unlock selection', (current) => updateSelectedTransforms(current, () => ({ locked: false })))}
                  >
                    <LockOpenIcon className="h-4 w-4" aria-hidden />
                    Unlock
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="apx-vw-dock" aria-label="Visual Studio bottom dock">
          <div className="apx-vw-dock-tabs" role="tablist" aria-label="Visual workspace output">
            <span className="apx-vw-dock-label">Output</span>
            {DOCK_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={dockTab === tab}
                data-active={dockTab === tab ? 'true' : undefined}
                onClick={() => setDockTab(tab)}
              >
                {tab === 'Preview' ? <EyeIcon className="h-4 w-4" aria-hidden /> : null}
                {tab === 'Generated Code' ? <CodeBracketIcon className="h-4 w-4" aria-hidden /> : null}
                {tab === 'Diagnostics' ? <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden /> : null}
                {tab === 'History' ? <ClockIcon className="h-4 w-4" aria-hidden /> : null}
                <span>{tab}</span>
                {tab === 'Diagnostics' && (error || previewWarnings.length) ? (
                  <span className="apx-vw-badge">{error ? 1 : previewWarnings.length}</span>
                ) : null}
              </button>
            ))}
            <button
              type="button"
              className="apx-vw-dock-toggle"
              onClick={() => setDockCollapsed((value) => !value)}
              title={dockCollapsed ? 'Expand bottom dock' : 'Collapse bottom dock'}
              aria-label={dockCollapsed ? 'Expand bottom dock' : 'Collapse bottom dock'}
            >
              {dockCollapsed ? (
                <ChevronUpIcon className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronDownIcon className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          <div className="apx-vw-dock-content">
            <div className="apx-vw-dock-primary">
              {dockTab === 'Generated Code' ? (
                generated.value ? (
                  <div className="apx-vw-code-preview" data-visual-generated-code>
                    {generated.value.source.split('\n').map((line, index) => (
                      <div key={index}>
                        <span>{index + 1}</span>
                        <code>{line}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="apx-vw-dock-empty">
                    <CodeBracketIcon className="h-7 w-7" aria-hidden />
                    <strong>Code generation blocked</strong>
                    <span>{generated.error}</span>
                  </div>
                )
              ) : null}

              {dockTab === 'Preview' ? (
                <div className="apx-vw-preview-browser">
                  <div className="apx-vw-preview-main">
                    {activeArtifact?.url && activeArtifact.mime.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeArtifact.url} alt={activeArtifact.name} />
                    ) : (
                      <div className="apx-vw-dock-empty">
                        <PlayIcon className="h-7 w-7" aria-hidden />
                        <strong>{activeArtifact ? activeArtifact.name : 'Preview awaiting Visual Project'}</strong>
                        <span>{previewArtifacts.length} shared session artifact{previewArtifacts.length === 1 ? '' : 's'} available.</span>
                      </div>
                    )}
                  </div>
                  {previewArtifacts.length > 1 ? (
                    <div className="apx-vw-preview-strip">
                      {previewArtifacts.map((artifact) => (
                        <button
                          type="button"
                          key={artifact.id}
                          data-active={artifact.id === activeArtifact?.id ? 'true' : undefined}
                          onClick={() => setActiveArtifactId(artifact.id)}
                          title={artifact.name}
                        >
                          {artifact.url && artifact.mime.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={artifact.url} alt="" />
                          ) : (
                            <PhotoIcon className="h-5 w-5" aria-hidden />
                          )}
                          <span>{artifact.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {dockTab === 'Diagnostics' ? (
                <div className="apx-vw-dock-empty">
                  <AdjustmentsHorizontalIcon className="h-7 w-7" aria-hidden />
                  <strong>{projectError || generated.error || error ? 'Visual diagnostics' : 'Diagnostics clear'}</strong>
                  <span>
                    {projectError ?? generated.error ?? error ?? (previewWarnings.length ? previewWarnings.join(' · ') : elapsedMs != null ? 'Last run ' + elapsedMs + ' ms' : 'Visual Project v1 validates and code generation is ready.')}
                  </span>
                </div>
              ) : null}

              {dockTab === 'History' ? (
                <div className="apx-vw-history-list">
                  <div className="apx-vw-history-section">
                    <div className="apx-vw-history-section__title">
                      <strong>Visual edits</strong>
                      <span>{editor.history.past.length}</span>
                    </div>
                    {editor.history.past.length ? [...editor.history.past].reverse().slice(0, 8).map((entry, index) => (
                      <div className="apx-vw-history-row" key={`${entry.label}-${index}`}>
                        <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden />
                        <strong>{entry.label}</strong>
                        <span>{index === 0 ? 'current−1' : `−${index + 1}`}</span>
                      </div>
                    )) : (
                      <div className="apx-vw-history-empty">No Visual edits yet.</div>
                    )}
                  </div>

                  <div className="apx-vw-history-section">
                    <div className="apx-vw-history-section__title">
                      <strong>Code runs</strong>
                      <span>{history.length}</span>
                    </div>
                    {history.length ? history.slice(0, 6).map((entry) => (
                      <div className="apx-vw-history-row" key={entry.id}>
                        <ClockIcon className="h-4 w-4" aria-hidden />
                        <strong>{entry.bufferName}</strong>
                        <span>{entry.ok ? 'success' : 'failed'}</span>
                      </div>
                    )) : (
                      <div className="apx-vw-history-empty">No Code Studio runs yet.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="apx-vw-assets">
              <div className="apx-vw-assets-heading">
                <div>
                  <strong>Assets</strong>
                  <span>{assets.length}</span>
                  <small>Shared Studio assets</small>
                </div>
                <button
                  type="button"
                  className="apx-vw-assets-upload"
                  onClick={() => uploadRef.current?.click()}
                >
                  <ArrowUpTrayIcon className="h-4 w-4" aria-hidden />
                  Upload
                </button>
                <input
                  ref={uploadRef}
                  type="file"
                  multiple
                  hidden
                  accept="image/*,audio/*,video/*,.ttf,.otf,.woff,.woff2"
                  onChange={(event) => {
                    if (event.target.files) void addAssets(event.target.files);
                  }}
                />
              </div>

              <div className="apx-vw-assets-tools">
                <input
                  type="search"
                  value={assetQuery}
                  onChange={(event) => setAssetQuery(event.target.value)}
                  placeholder="Filter assets…"
                  aria-label="Filter assets"
                />
                <div className="apx-vw-assets-filters" role="group" aria-label="Asset type filter">
                  {(['all', 'image', 'audio', 'video', 'font'] as const).map((filter) => (
                    <button
                      type="button"
                      key={filter}
                      data-active={assetFilter === filter ? 'true' : undefined}
                      onClick={() => setAssetFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                {uploadError ? <p className="apx-vw-assets-error">{uploadError}</p> : null}
              </div>

              <div
                className="apx-vw-asset-grid"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void addAssets(event.dataTransfer.files);
                }}
              >
                {filteredAssets.length ? filteredAssets.slice(0, 12).map((asset) => (
                  <div className="apx-vw-asset-card" key={asset.id} title={asset.name}>
                    <div className="apx-vw-asset-thumb">
                      {asset.mime.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={studioAssetDataUrl(asset)} alt="" />
                      ) : asset.mime.startsWith('audio/') ? (
                        <MusicalNoteIcon className="h-6 w-6" aria-hidden />
                      ) : asset.mime.startsWith('video/') ? (
                        <VideoCameraIcon className="h-6 w-6" aria-hidden />
                      ) : (
                        <FolderOpenIcon className="h-6 w-6" aria-hidden />
                      )}
                    </div>
                    <strong>{asset.name}</strong>
                    <span>{formatBytes(asset.size)}</span>
                  </div>
                )) : (
                  <div className="apx-vw-assets-empty">
                    <FolderOpenIcon className="h-6 w-6" aria-hidden />
                    <strong>{assets.length ? 'No matching assets' : 'Drop or upload assets'}</strong>
                    <span>
                      {assets.length
                        ? 'Change the filter or search query.'
                        : 'Images, audio, video and fonts are shared with Code Studio.'}
                    </span>
                  </div>
                )}
              </div>
              <div className="apx-vw-assets-foot">
                <span>{assets.length}/{STUDIO_ASSET_LIMITS.maxCount}</span>
                <span>{formatBytes(totalStudioAssetBytes(assets))}</span>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <footer className="apx-vw-statusbar">
        <span>Apexify Studio Visual</span>
        <span className="apx-vw-status-ok">● Project v1 · codegen ready</span>
        <span className="ml-auto">{project.name} · schema v{project.schemaVersion}</span>
      </footer>
    </div>
  );
}
