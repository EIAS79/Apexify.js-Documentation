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
  for (const name of ['index.json', 'public-surface.json', 'runtime-source-map.json', 'gap-summary.json', 'BASELINE.md']) {
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
