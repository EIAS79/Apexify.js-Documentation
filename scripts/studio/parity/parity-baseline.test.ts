import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { GapSummary } from './model';

const root = process.cwd();
const dir = path.join(root, 'generated', 'studio', 'runtime-parity');

function read<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) as T;
}

test('STUDIO-PARITY-0 is pinned to the intended Apexify runtime commit', () => {
  const pin = JSON.parse(
    fs.readFileSync(path.join(root, 'scripts', 'studio', 'parity', 'runtime-source.json'), 'utf8'),
  ) as { commit: string };
  const summary = read<GapSummary>('gap-summary.json');
  assert.equal(summary.runtime.commit, pin.commit);
  assert.equal(summary.runtime.commit, 'a62a68d0582e08c603d2eb8cd5f4f806cd0fe92a');
});

test('baseline inventories public surfaces and recursive runtime records', () => {
  const summary = read<GapSummary>('gap-summary.json');
  assert.ok(summary.counts.publicSurfaces > 0);
  assert.ok(summary.counts.recursiveRecords > summary.counts.publicSurfaces);
  assert.ok(summary.counts.inputRecords > 0);
  assert.ok(summary.counts.outputRecords > 0);
  assert.equal(summary.gates.apexPainterFound, true);
  assert.equal(summary.gates.zeroSilentPublicSurfaceOmissions, true);
  assert.equal(summary.gates.deepRecursiveTypeResolution, true);
  assert.equal(summary.gates.surfaceReconciliationComplete, true);
  assert.equal(summary.gates.sourceMappingVerified, true);
});

test('legacy classification can never become FULL during phase 0', () => {
  const summary = read<GapSummary>('gap-summary.json');
  assert.equal(summary.counts.status.FULL, 0);
  assert.equal(summary.gates.noBootstrapFullClaims, true);
});

test('unproven capability-level evidence remains UNKNOWN at leaf level', () => {
  const summary = read<GapSummary>('gap-summary.json');
  assert.ok(
    summary.counts.status.UNKNOWN > 0,
    'Phase 0 must not infer leaf parity from capability-level classification',
  );
});

test('runtime/package source drift is explicit instead of hidden', () => {
  const summary = read<GapSummary>('gap-summary.json');
  if (!summary.studio.runtimePinMatchesInstalledPackage) {
    assert.ok(summary.drift.some((item) => item.code === 'PARITY-RUNTIME-PIN-DRIFT'));
  }
});

test('generated index and all required baseline artifacts exist', () => {
  for (const name of ['index.json', 'public-surface.json', 'runtime-source-map.json', 'surface-reconciliation.json', 'gap-summary.json', 'BASELINE.md']) {
    assert.equal(fs.existsSync(path.join(dir, name)), true, name + ' should exist');
  }
});

test('createCanvas is recursively expanded into real CanvasConfig leaves', () => {
  const canvas = JSON.parse(
    fs.readFileSync(path.join(dir, 'domains', 'canvas.json'), 'utf8'),
  ) as {
    surfaces: Array<{ publicSymbol: string; inputRecordCount: number }>;
    records: Array<{ publicSymbol: string; optionPath: string }>;
  };

  const surface = canvas.surfaces.find((item) => item.publicSymbol === 'ApexPainter.createCanvas');
  assert.ok(surface, 'ApexPainter.createCanvas must be inventoried');
  assert.ok(
    (surface?.inputRecordCount ?? 0) >= 40,
    'createCanvas must expand recursively; shallow signature-only inventory is invalid',
  );

  const paths = canvas.records
    .filter((item) => item.publicSymbol === 'ApexPainter.createCanvas')
    .map((item) => item.optionPath);

  const requiredSuffixes = [
    '.canvas.width',
    '.canvas.height',
    '.canvas.customBg.source',
    '.canvas.customBg.filters[]',
    '.canvas.videoBg.frame',
    '.canvas.videoBg.time',
    '.canvas.bgLayers[]',
    '.canvas.zoom.scale',
  ];

  for (const suffix of requiredSuffixes) {
    assert.ok(
      paths.some((item) => item.includes(suffix)),
      'missing recursively expanded CanvasConfig path containing ' + suffix,
    );
  }

  assert.ok(
    paths.some((item) => item.includes('.canvas.stroke.')),
    'stroke nested fields must be expanded',
  );
  assert.ok(
    paths.some((item) => item.includes('.canvas.shadow.')),
    'shadow nested fields must be expanded',
  );
});


test('createImage and createText recursively expose nested authoring contracts', () => {
  const image = read<{
    records: Array<{ publicSymbol: string; optionPath: string }>;
  }>('domains/image.json');
  const text = read<{
    records: Array<{ publicSymbol: string; optionPath: string }>;
  }>('domains/text.json');

  const imagePaths = image.records
    .filter((item) => item.publicSymbol === 'ApexPainter.createImage')
    .map((item) => item.optionPath);
  const textPaths = text.records
    .filter((item) => item.publicSymbol === 'ApexPainter.createText')
    .map((item) => item.optionPath);

  for (const fragment of [
    '.images.distortion.controlPoints[].from.x',
    '.images.distortion.wavelengthX',
    '.images.distortion.edgeMode',
    '.images.meshWarp.gridX',
    '.images.meshWarp.interpolation',
    '.options.groupTransform',
  ]) {
    assert.ok(
      imagePaths.some((item) => item.includes(fragment)),
      'missing recursively expanded createImage path containing ' + fragment,
    );
  }

  for (const fragment of [
    '.textArray.decorations.underline',
    '.textArray.decorations.strikethrough',
    '.textArray.effects.shadow',
    '.textArray.font',
  ]) {
    assert.ok(
      textPaths.some((item) => item.includes(fragment)),
      'missing recursively expanded createText path containing ' + fragment,
    );
  }
});

test('surface reconciliation explains the old 187-row gap without dropping legacy capabilities', () => {
  const reconciliation = read<{
    summary: {
      legacyRows: number;
      runtimeSurfaces: number;
      exactMatches: number;
      aliasMatches: number;
      publicNameDriftOrReachableAlias: number;
      removedFromCurrentRuntime: number;
      legacyNotCurrentPublicSurface: number;
      runtimeOnly: number;
    };
    runtimeOnly: Array<{ runtimeSymbol: string; result: string; reason: string }>;
  }>('surface-reconciliation.json');

  assert.equal(reconciliation.summary.legacyRows, 187);
  assert.equal(reconciliation.summary.exactMatches, 187);
  assert.equal(reconciliation.summary.aliasMatches, 0);
  assert.equal(reconciliation.summary.publicNameDriftOrReachableAlias, 0);
  assert.equal(reconciliation.summary.removedFromCurrentRuntime, 0);
  assert.equal(reconciliation.summary.legacyNotCurrentPublicSurface, 0);
  assert.equal(reconciliation.summary.runtimeSurfaces, 226);
  assert.equal(reconciliation.summary.runtimeOnly, 39);

  const runtimeOnly = new Set(reconciliation.runtimeOnly.map((item) => item.runtimeSymbol));
  for (const symbol of [
    'VideoPipeline.fromJSON',
    'VideoOperations.runtime.outputArgs',
    'VideoOperations.runtime.probeFile',
    'VideoOperations.runtime.resolve',
    'VideoOperations.runtime.runFfmpeg',
    'VideoOperations.runtime.withWorkspace',
  ]) {
    assert.ok(runtimeOnly.has(symbol), 'expected newly exposed runtime surface: ' + symbol);
  }

  for (const item of reconciliation.runtimeOnly) {
    assert.ok(item.reason.length > 0, item.runtimeSymbol + ' must have an explicit reconciliation reason');
  }
});


test('core authoring surfaces use call-graph-backed validation mappings', () => {
  const publicSurface = read<{
    surfaces: Array<{
      publicSymbol: string;
      implementationFiles: string[];
      validationFiles: string[];
      sourceEvidence: {
        implementation: Array<{ file: string }>;
        validation: Array<{ file: string }>;
      };
    }>;
  }>('public-surface.json');

  const expected = new Map([
    ['ApexPainter.createCanvas', 'lib-next/canvas/canvas-validation.ts'],
    ['ApexPainter.createImage', 'lib-next/image/image-validation.ts'],
    ['ApexPainter.createText', 'lib-next/text/text-validation.ts'],
    ['ApexPainter.measureText', 'lib-next/text/text-validation.ts'],
  ]);

  for (const [symbol, validator] of expected) {
    const surface = publicSurface.surfaces.find((item) => item.publicSymbol === symbol);
    assert.ok(surface, symbol + ' must exist');
    assert.ok((surface?.implementationFiles.length ?? 0) >= 2, symbol + ' must have a real implementation call graph');
    assert.ok(surface?.validationFiles.includes(validator), symbol + ' must reach ' + validator);
    assert.ok(surface?.sourceEvidence.validation.some((item) => item.file === validator), symbol + ' must store validator source evidence');
  }
});
