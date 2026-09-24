import type { StudioVirtualAsset } from '../runtime/assets';
import type { VisualProject } from './model';
import { parseVisualProject, serializeVisualProject } from './persistence';

export const PHASE17_AUTOSAVE_STORAGE_KEY = 'apexify-visual-autosave-v2';
export const PHASE17_AUTOSAVE_VERSION = 2 as const;
export const PHASE17_CODE_DEBOUNCE_MS = 280;
export const PHASE17_PROJECT_AUTOSAVE_MS = 180;

export const PHASE17_BROWSER_MATRIX = Object.freeze([
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1100, height: 800 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
] as const);

export const PHASE17_PERFORMANCE_BUDGETS = Object.freeze({
  maxInteractiveLayers: 2500,
  largeLayerTreeThreshold: 400,
  maxLinkedCodeBytes: 750_000,
  largeCodeThresholdBytes: 200_000,
  maxAssetDataUrlCacheEntries: 48,
  codeSyncDebounceMs: PHASE17_CODE_DEBOUNCE_MS,
  autosaveDebounceMs: PHASE17_PROJECT_AUTOSAVE_MS,
  profileCodegenLayers: 1000,
  profileSoftCodegenMs: 5000,
});

export type Phase17DockTab =
  | 'generated'
  | 'diagnostics'
  | 'assets'
  | 'history'
  | 'timeline';

export type Phase17InspectorTab =
  | 'style'
  | 'transform'
  | 'effects'
  | 'data'
  | 'advanced';

export interface Phase17RecoveredUiState {
  zoom: number;
  pan: { x: number; y: number };
  activeTool: string;
  inspectorTab: Phase17InspectorTab;
  dockTab: Phase17DockTab;
  dockCollapsed: boolean;
  layersCollapsed: boolean;
  inspectorCollapsed: boolean;
  layersWidth: number;
  inspectorWidth: number;
  dockHeight: number;
  collapsedLayerIds: string[];
}

export interface Phase17LinkedCodeSnapshot {
  source: string;
  fileName: string;
  baseProjectSignature: string;
  savedAt: number;
  syncState?: 'synced' | 'saving' | 'error';
  syncError?: string | null;
}

export interface Phase17AssetManifestEntry {
  id: string;
  mime: string;
  size: number;
}

export interface Phase17AutosaveEnvelope {
  version: typeof PHASE17_AUTOSAVE_VERSION;
  savedAt: number;
  projectSignature: string;
  project: VisualProject;
  code: Phase17LinkedCodeSnapshot;
  ui: Phase17RecoveredUiState;
  assets: Phase17AssetManifestEntry[];
}

export type Phase17RecoveryResult =
  | {
      ok: true;
      envelope: Phase17AutosaveEnvelope;
      migrated: boolean;
      codeMayApply: boolean;
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
      corruptBackup?: string;
    };

const DEFAULT_UI: Phase17RecoveredUiState = {
  zoom: 78,
  pan: { x: 0, y: 0 },
  activeTool: 'canvas',
  inspectorTab: 'style',
  dockTab: 'generated',
  dockCollapsed: false,
  layersCollapsed: false,
  inspectorCollapsed: false,
  layersWidth: 274,
  inspectorWidth: 330,
  dockHeight: 204,
  collapsedLayerIds: [],
};

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function normalizeUi(value: unknown): Phase17RecoveredUiState {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const pan = raw.pan && typeof raw.pan === 'object' && !Array.isArray(raw.pan)
    ? raw.pan as Record<string, unknown>
    : {};
  const inspector = ['style','transform','effects','data','advanced'].includes(String(raw.inspectorTab))
    ? raw.inspectorTab as Phase17InspectorTab
    : DEFAULT_UI.inspectorTab;
  const dock = ['generated','diagnostics','assets','history','timeline'].includes(String(raw.dockTab))
    ? raw.dockTab as Phase17DockTab
    : DEFAULT_UI.dockTab;
  return {
    zoom: Math.max(20, Math.min(200, finiteNumber(raw.zoom, DEFAULT_UI.zoom))),
    pan: {
      x: finiteNumber(pan.x, 0),
      y: finiteNumber(pan.y, 0),
    },
    activeTool: typeof raw.activeTool === 'string' ? raw.activeTool : DEFAULT_UI.activeTool,
    inspectorTab: inspector,
    dockTab: dock,
    dockCollapsed: typeof raw.dockCollapsed === 'boolean' ? raw.dockCollapsed : false,
    layersCollapsed: typeof raw.layersCollapsed === 'boolean' ? raw.layersCollapsed : false,
    inspectorCollapsed: typeof raw.inspectorCollapsed === 'boolean' ? raw.inspectorCollapsed : false,
    layersWidth: Math.max(190, Math.min(420, finiteNumber(raw.layersWidth, DEFAULT_UI.layersWidth))),
    inspectorWidth: Math.max(240, Math.min(460, finiteNumber(raw.inspectorWidth, DEFAULT_UI.inspectorWidth))),
    dockHeight: Math.max(120, Math.min(480, finiteNumber(raw.dockHeight, DEFAULT_UI.dockHeight))),
    collapsedLayerIds: stringArray(raw.collapsedLayerIds),
  };
}

export function visualProjectSemanticSignature(project: VisualProject): string {
  const { editor: _editor, updatedAt: _updatedAt, ...semantic } = project;
  const source = JSON.stringify(semantic);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return 'v1-' + (hash >>> 0).toString(16).padStart(8, '0');
}

export function phase17AssetManifest(
  assets: readonly Pick<StudioVirtualAsset, 'id' | 'mime' | 'size'>[],
): Phase17AssetManifestEntry[] {
  return assets
    .map(({ id, mime, size }) => ({ id, mime, size }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function createPhase17AutosaveEnvelope(input: {
  project: VisualProject;
  code: Omit<Phase17LinkedCodeSnapshot, 'baseProjectSignature'> & {
    baseProjectSignature?: string;
  };
  ui?: Partial<Phase17RecoveredUiState>;
  assets?: readonly Pick<StudioVirtualAsset, 'id' | 'mime' | 'size'>[];
  savedAt?: number;
}): Phase17AutosaveEnvelope {
  const project = parseVisualProject(serializeVisualProject(input.project));
  const signature = visualProjectSemanticSignature(project);
  return {
    version: PHASE17_AUTOSAVE_VERSION,
    savedAt: input.savedAt ?? Date.now(),
    projectSignature: signature,
    project,
    code: {
      ...input.code,
      baseProjectSignature: input.code.baseProjectSignature ?? signature,
    },
    ui: normalizeUi({ ...DEFAULT_UI, ...(input.ui ?? {}) }),
    assets: phase17AssetManifest(input.assets ?? []),
  };
}

function parseV2(raw: Record<string, unknown>): Phase17RecoveryResult {
  try {
    const project = parseVisualProject(JSON.stringify(raw.project));
    const signature = visualProjectSemanticSignature(project);
    const codeRaw = raw.code && typeof raw.code === 'object' && !Array.isArray(raw.code)
      ? raw.code as Record<string, unknown>
      : {};
    const source = typeof codeRaw.source === 'string' ? codeRaw.source : '';
    const fileName = typeof codeRaw.fileName === 'string' ? codeRaw.fileName : 'visual-project.ts';
    const baseProjectSignature =
      typeof codeRaw.baseProjectSignature === 'string'
        ? codeRaw.baseProjectSignature
        : '';
    const assets = Array.isArray(raw.assets)
      ? raw.assets.flatMap((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
          const entry = item as Record<string, unknown>;
          if (
            typeof entry.id !== 'string' ||
            typeof entry.mime !== 'string' ||
            typeof entry.size !== 'number'
          ) return [];
          return [{ id: entry.id, mime: entry.mime, size: entry.size }];
        })
      : [];
    const warnings: string[] = [];
    if (raw.projectSignature !== signature) {
      warnings.push('Autosave project signature was repaired during recovery.');
    }
    const envelope: Phase17AutosaveEnvelope = {
      version: PHASE17_AUTOSAVE_VERSION,
      savedAt: finiteNumber(raw.savedAt, Date.now()),
      projectSignature: signature,
      project,
      code: {
        source,
        fileName,
        baseProjectSignature,
        savedAt: finiteNumber(codeRaw.savedAt, finiteNumber(raw.savedAt, Date.now())),
        syncState:
          codeRaw.syncState === 'saving' || codeRaw.syncState === 'error'
            ? codeRaw.syncState
            : 'synced',
        syncError: typeof codeRaw.syncError === 'string' ? codeRaw.syncError : null,
      },
      ui: normalizeUi(raw.ui),
      assets,
    };
    const codeMayApply =
      Boolean(source) &&
      Boolean(baseProjectSignature) &&
      baseProjectSignature === signature;
    if (source && !codeMayApply) {
      warnings.push('Recovered code is older than the recovered Visual Project and was quarantined.');
    }
    return { ok: true, envelope, migrated: false, codeMayApply, warnings };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid Phase-17 autosave.',
      corruptBackup: JSON.stringify(raw),
    };
  }
}

export function recoverPhase17Autosave(source: string | null): Phase17RecoveryResult {
  if (!source) return { ok: false, error: 'No autosave is available.' };
  let raw: unknown;
  try {
    raw = JSON.parse(source);
  } catch (error) {
    return {
      ok: false,
      error: 'Autosave JSON is corrupt: ' + (error instanceof Error ? error.message : 'invalid JSON'),
      corruptBackup: source,
    };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Autosave root must be an object.', corruptBackup: source };
  }
  const record = raw as Record<string, unknown>;
  if (record.version === PHASE17_AUTOSAVE_VERSION) return parseV2(record);

  // Migration for the pre-Phase-17 live-code-only payload.
  if (
    typeof record.source === 'string' &&
    typeof record.fileName === 'string'
  ) {
    return {
      ok: false,
      error: 'Legacy live-code autosave has no Visual Project snapshot and cannot safely overwrite a newer project.',
      corruptBackup: source,
    };
  }

  return {
    ok: false,
    error: 'Unsupported autosave version.',
    corruptBackup: source,
  };
}

export function phase17AssetManifestMatches(
  expected: readonly Phase17AssetManifestEntry[],
  actual: readonly Pick<StudioVirtualAsset, 'id' | 'mime' | 'size'>[],
): boolean {
  return JSON.stringify(expected) === JSON.stringify(phase17AssetManifest(actual));
}

export class Phase17AssetDataUrlCache {
  private readonly values = new Map<string, string>();

  constructor(
    private readonly maxEntries = PHASE17_PERFORMANCE_BUDGETS.maxAssetDataUrlCacheEntries,
  ) {}

  get(asset: Pick<StudioVirtualAsset, 'id' | 'mime' | 'size' | 'base64'>): string {
    const key = [asset.id, asset.mime, asset.size, asset.base64.length].join(':');
    const existing = this.values.get(key);
    if (existing) {
      this.values.delete(key);
      this.values.set(key, existing);
      return existing;
    }
    const value = `data:${asset.mime || 'application/octet-stream'};base64,${asset.base64}`;
    this.values.set(key, value);
    while (this.values.size > this.maxEntries) {
      const oldest = this.values.keys().next().value as string | undefined;
      if (!oldest) break;
      this.values.delete(oldest);
    }
    return value;
  }

  prune(assets: readonly Pick<StudioVirtualAsset, 'id'>[]) {
    const ids = new Set(assets.map((asset) => asset.id));
    for (const key of this.values.keys()) {
      if (!ids.has(key.split(':')[0]!)) this.values.delete(key);
    }
  }

  clear() {
    this.values.clear();
  }

  get size() {
    return this.values.size;
  }
}

export class Phase17LatestTransaction {
  private version = 0;

  begin(): number {
    this.version += 1;
    return this.version;
  }

  isCurrent(version: number): boolean {
    return version === this.version;
  }

  cancel() {
    this.version += 1;
  }
}

export function phase17LargeDocumentMode(source: string): boolean {
  return new TextEncoder().encode(source).byteLength >=
    PHASE17_PERFORMANCE_BUDGETS.largeCodeThresholdBytes;
}

export function phase17LayerTreeMode(layerCount: number): 'normal' | 'large' | 'over-budget' {
  if (layerCount > PHASE17_PERFORMANCE_BUDGETS.maxInteractiveLayers) return 'over-budget';
  if (layerCount >= PHASE17_PERFORMANCE_BUDGETS.largeLayerTreeThreshold) return 'large';
  return 'normal';
}
