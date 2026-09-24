import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { createVisualProject } from '../../../lib/studio/visual/project';
import {
  PHASE17_AUTOSAVE_VERSION,
  PHASE17_BROWSER_MATRIX,
  PHASE17_PERFORMANCE_BUDGETS,
  Phase17AssetDataUrlCache,
  Phase17LatestTransaction,
  createPhase17AutosaveEnvelope,
  phase17AssetManifestMatches,
  phase17LargeDocumentMode,
  phase17LayerTreeMode,
  recoverPhase17Autosave,
  visualProjectSemanticSignature,
} from '../../../lib/studio/visual/hardening';

const root = process.cwd();

function fixture() {
  const project = createVisualProject({
    id: 'phase17-project',
    name: 'Phase 17 recovery fixture',
    width: 800,
    height: 600,
    now: '2026-09-24T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };
  return project;
}

test('Phase 17 autosave round-trips project, linked code, UI and asset manifest', () => {
  const project = fixture();
  const signature = visualProjectSemanticSignature(project);
  const envelope = createPhase17AutosaveEnvelope({
    project,
    code: {
      source: 'const phase17 = true;',
      fileName: 'phase17.ts',
      savedAt: 123,
      baseProjectSignature: signature,
      syncState: 'synced',
      syncError: null,
    },
    ui: {
      zoom: 125,
      pan: { x: 42, y: -18 },
      activeTool: 'video',
      inspectorTab: 'advanced',
      dockTab: 'timeline',
      dockCollapsed: false,
      layersCollapsed: true,
      inspectorCollapsed: false,
      layersWidth: 318,
      inspectorWidth: 352,
      dockHeight: 286,
      collapsedLayerIds: ['group-a'],
    },
    assets: [
      { id: 'asset-b', mime: 'image/png', size: 2 },
      { id: 'asset-a', mime: 'font/woff2', size: 1 },
    ],
    savedAt: 123,
  });

  assert.equal(envelope.version, PHASE17_AUTOSAVE_VERSION);
  const recovered = recoverPhase17Autosave(JSON.stringify(envelope));
  assert.equal(recovered.ok, true);
  if (!recovered.ok) return;
  assert.equal(recovered.codeMayApply, true);
  assert.equal(recovered.envelope.projectSignature, signature);
  assert.equal(recovered.envelope.code.source, 'const phase17 = true;');
  assert.equal(recovered.envelope.ui.zoom, 125);
  assert.equal(recovered.envelope.ui.layersWidth, 318);
  assert.equal(recovered.envelope.ui.inspectorWidth, 352);
  assert.equal(recovered.envelope.ui.dockHeight, 286);
  assert.deepEqual(recovered.envelope.ui.collapsedLayerIds, ['group-a']);
  assert.deepEqual(recovered.envelope.assets.map((asset) => asset.id), ['asset-a', 'asset-b']);
});

test('Phase 17 never auto-applies stale linked code over a newer Visual Project', () => {
  const envelope = createPhase17AutosaveEnvelope({
    project: fixture(),
    code: {
      source: 'const stale = true;',
      fileName: 'stale.ts',
      savedAt: 200,
      baseProjectSignature: 'v1-old-project',
      syncState: 'saving',
    },
    savedAt: 200,
  });

  const recovered = recoverPhase17Autosave(JSON.stringify(envelope));
  assert.equal(recovered.ok, true);
  if (!recovered.ok) return;
  assert.equal(recovered.codeMayApply, false);
  assert.match(recovered.warnings.join(' '), /older than the recovered Visual Project/i);
});

test('Phase 17 isolates corrupt and unsupported autosaves', () => {
  const corrupt = recoverPhase17Autosave('{bad json');
  assert.equal(corrupt.ok, false);
  if (!corrupt.ok) assert.ok(corrupt.corruptBackup);

  const future = recoverPhase17Autosave(JSON.stringify({ version: 999 }));
  assert.equal(future.ok, false);

  const legacyCodeOnly = recoverPhase17Autosave(JSON.stringify({
    source: 'const legacy = true;',
    fileName: 'legacy.ts',
  }));
  assert.equal(legacyCodeOnly.ok, false);
  if (!legacyCodeOnly.ok) assert.match(legacyCodeOnly.error, /cannot safely overwrite/i);
});

test('Phase 17 clamps recovered panel geometry instead of trusting corrupt UI values', () => {
  const envelope = createPhase17AutosaveEnvelope({
    project: fixture(),
    code: {
      source: 'const safe = true;',
      fileName: 'safe.ts',
      savedAt: 1,
    },
    ui: {
      zoom: 9_999,
      pan: { x: 1, y: 2 },
      activeTool: 'canvas',
      inspectorTab: 'style',
      dockTab: 'generated',
      dockCollapsed: false,
      layersCollapsed: false,
      inspectorCollapsed: false,
      layersWidth: 9_999,
      inspectorWidth: -10,
      dockHeight: 9_999,
      collapsedLayerIds: [],
    },
  });
  assert.equal(envelope.ui.zoom, 200);
  assert.equal(envelope.ui.layersWidth, 420);
  assert.equal(envelope.ui.inspectorWidth, 240);
  assert.equal(envelope.ui.dockHeight, 480);
});

test('Phase 17 asset manifest and bounded LRU cache remain coherent', () => {
  const assets = [
    { id: 'a', name: 'a.png', mime: 'image/png', size: 1, base64: 'YQ==' },
    { id: 'b', name: 'b.png', mime: 'image/png', size: 1, base64: 'Yg==' },
    { id: 'c', name: 'c.png', mime: 'image/png', size: 1, base64: 'Yw==' },
  ];
  const envelope = createPhase17AutosaveEnvelope({
    project: fixture(),
    code: { source: '', fileName: 'x.ts', savedAt: 1 },
    assets,
  });
  assert.equal(phase17AssetManifestMatches(envelope.assets, assets), true);
  assert.equal(
    phase17AssetManifestMatches(envelope.assets, assets.slice(0, 2)),
    false,
  );

  const cache = new Phase17AssetDataUrlCache(2);
  assert.equal(cache.get(assets[0]!), 'data:image/png;base64,YQ==');
  cache.get(assets[1]!);
  cache.get(assets[0]!);
  cache.get(assets[2]!);
  assert.equal(cache.size, 2);
  cache.prune([assets[2]!]);
  assert.equal(cache.size, 1);
  cache.clear();
  assert.equal(cache.size, 0);
});

test('Phase 17 latest-transaction guard rejects delayed stale reconciliation', () => {
  const transactions = new Phase17LatestTransaction();
  const first = transactions.begin();
  const second = transactions.begin();
  assert.equal(transactions.isCurrent(first), false);
  assert.equal(transactions.isCurrent(second), true);
  transactions.cancel();
  assert.equal(transactions.isCurrent(second), false);
});

test('Phase 17 browser matrix covers desktop, laptop, tablet and mobile widths', () => {
  assert.deepEqual(
    PHASE17_BROWSER_MATRIX.map((entry) => entry.name),
    ['desktop', 'laptop', 'tablet', 'mobile'],
  );
  assert.deepEqual(
    PHASE17_BROWSER_MATRIX.map((entry) => entry.width),
    [1440, 1100, 820, 390],
  );
});

test('Phase 17 performance budgets classify large code and layer trees', () => {
  assert.equal(phase17LayerTreeMode(10), 'normal');
  assert.equal(
    phase17LayerTreeMode(PHASE17_PERFORMANCE_BUDGETS.largeLayerTreeThreshold),
    'large',
  );
  assert.equal(
    phase17LayerTreeMode(PHASE17_PERFORMANCE_BUDGETS.maxInteractiveLayers + 1),
    'over-budget',
  );
  assert.equal(phase17LargeDocumentMode('small'), false);
  assert.equal(
    phase17LargeDocumentMode('x'.repeat(PHASE17_PERFORMANCE_BUDGETS.largeCodeThresholdBytes)),
    true,
  );
});

test('Phase 17 shipped UI contains crash isolation, accessible resizing and modal focus trapping', () => {
  const visual = fs.readFileSync(
    path.join(root, 'components/studio/visual/VisualStudioPre4.tsx'),
    'utf8',
  );
  const modals = fs.readFileSync(
    path.join(root, 'components/studio/visual/VisualStudioModals.tsx'),
    'utf8',
  );
  const boundary = fs.readFileSync(
    path.join(root, 'components/studio/visual/VisualStudio.tsx'),
    'utf8',
  );
  const editor = fs.readFileSync(
    path.join(root, 'components/docs/playground/CodeMirrorEditor.tsx'),
    'utf8',
  );
  const css = fs.readFileSync(path.join(root, 'styles/studio-calm.css'), 'utf8');

  for (const marker of [
    'PHASE17_AUTOSAVE_STORAGE_KEY',
    'Legacy linked code was recovered without a matching Visual Project snapshot',
    'beforeunload',
    'phase17CodeTransactionsRef',
    'data-phase17-layer-mode',
    'data-phase17-collapse-layers',
    'data-phase17-collapse-inspector',
    'Resize bottom dock and Timeline',
    'role="separator"',
  ]) {
    assert.equal(visual.includes(marker), true, 'missing hardening marker: ' + marker);
  }
  assert.match(modals, /useModalFocusTrap/);
  assert.match(modals, /event\.key !== 'Tab'/);
  assert.match(modals, /event\.key === 'Escape'/);
  assert.match(modals, /restoreFocusRef/);
  assert.match(boundary, /VisualStudioCrashBoundary/);
  assert.match(boundary, /data-visual-crash-boundary/);
  assert.match(editor, /largeDocument/);
  assert.match(editor, /foldGutter: false/);
  assert.match(css, /content-visibility:auto/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
