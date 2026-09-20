import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DOC8_RESOURCE_LIMITS,
  type InteractiveSession,
} from '../../lib/docs/playground/contracts';
import {
  createInteractiveSession,
  parseInteractiveSession,
  resetInteractiveSession,
  serializeInteractiveSession,
} from '../../lib/docs/playground/session';
import { planStudioExecution } from '../../lib/studio/runtime/capabilities';
import {
  studioWorkspaceFileName,
  validateStudioWorkspaceFiles,
} from '../../lib/studio/runtime/workspace';

function sampleSession(): InteractiveSession {
  return createInteractiveSession({
    source: "import { ApexPainter } from 'apexify.js';",
    language: 'ts',
    runtime: 'node',
    options: { width: 640, transparent: false },
    selectedFile: 'example.ts',
    layout: { activePanel: 'editor' },
  });
}

test('shared session serializer round-trips versioned state', () => {
  const session = sampleSession();
  const serialized = serializeInteractiveSession(session);
  assert.deepEqual(parseInteractiveSession(serialized), session);
});

test('shared session parser rejects unsupported versions and runtimes', () => {
  const base = sampleSession();
  assert.throws(
    () => parseInteractiveSession(JSON.stringify({ ...base, schemaVersion: 2 })),
    /version is unsupported/,
  );
  assert.throws(
    () => parseInteractiveSession(JSON.stringify({ ...base, runtime: 'browser-fake' })),
    /runtime is invalid/,
  );
});

test('share state is bounded', () => {
  const oversized = createInteractiveSession({
    source: 'x'.repeat(DOC8_RESOURCE_LIMITS.shareStateBytes + 1024),
    language: 'ts',
    runtime: 'node',
    options: {},
  });
  assert.throws(() => serializeInteractiveSession(oversized), /exceeds/);
});

test('reset returns a fresh deterministic copy of initial structured state', () => {
  const initial = sampleSession();
  const reset = resetInteractiveSession(initial);
  assert.deepEqual(reset, initial);
  assert.notEqual(reset.options, initial.options);
  assert.notEqual(reset.layout, initial.layout);
});

test('resource limits preserve bounded current runner ceilings', () => {
  assert.equal(DOC8_RESOURCE_LIMITS.executionMs, 55_000);
  assert.equal(DOC8_RESOURCE_LIMITS.sourceChars, 280_000);
  assert.equal(DOC8_RESOURCE_LIMITS.outputBytes, 32 * 1024 * 1024);
  assert.equal(DOC8_RESOURCE_LIMITS.totalOutputBytes, 64 * 1024 * 1024);
  assert.equal(DOC8_RESOURCE_LIMITS.processBufferBytes, 20 * 1024 * 1024);
  assert.equal(DOC8_RESOURCE_LIMITS.maxOutputs, 24);
  assert.ok(DOC8_RESOURCE_LIMITS.shareStateBytes < DOC8_RESOURCE_LIMITS.sourceChars);
});

test('Studio planner keeps https URLs intact while detecting later full-runtime APIs', () => {
  const source = [
    "import { ApexPainter } from 'apexify.js';",
    'async function main() {',
    '  const p = new ApexPainter();',
    "  const image = 'https://example.com/photo.png';",
    '  const base = await p.createCanvas({ width: 100, height: 100 });',
    '  await p.createImage({ source: image }, base);',
    "  return p.createVideo({ output: 'out.mp4', width: 100, height: 100, fps: 24 });",
    '}',
  ].join('\n');
  const plan = planStudioExecution(source);
  assert.equal(plan.backend, 'full-runtime');
  assert.ok(plan.families.includes('video'));
});

test('Studio planner detects ApexPainter facets regardless of local instance name', () => {
  const plan = planStudioExecution([
    'const renderer = new ApexPainter();',
    'const result = await renderer.image.resize(source, { width: 320 });',
    'return result;',
  ].join('\n'));
  assert.equal(plan.backend, 'full-runtime');
  assert.ok(plan.families.includes('image-utils'));
});

test('Studio planner blocks host persistence for aliased ApexPainter instances', () => {
  const plan = planStudioExecution([
    'const renderer = new ApexPainter();',
    'const canvas = await renderer.createCanvas({ width: 64, height: 64 });',
    "await renderer.save(canvas.buffer, { filename: 'host.png' });",
    'return canvas.buffer;',
  ].join('\n'));
  assert.deepEqual(plan.hostPersistenceOnly, ['save()']);
  assert.deepEqual(
    plan.excludedOperations.map((operation) => [operation.label, operation.category]),
    [['save()', 'host-persistence']],
  );
  assert.ok(plan.families.includes('host-persistence'));
});

test('Studio planner rejects credentialed external transfer while preserving local output conversions', () => {
  const excluded = planStudioExecution([
    'const renderer = new ApexPainter();',
    'const canvas = await renderer.createCanvas({ width: 64, height: 64 });',
    'return renderer.output.url(canvas.buffer);',
  ].join('\n'));
  assert.ok(excluded.families.includes('external-service'));
  assert.deepEqual(
    excluded.excludedOperations.map((operation) => [operation.label, operation.category]),
    [['output.url()', 'external-service']],
  );

  const aliased = planStudioExecution([
    'const renderer = new ApexPainter();',
    'const transfer = renderer.output;',
    'const canvas = await renderer.createCanvas({ width: 64, height: 64 });',
    'return transfer.url(canvas.buffer);',
  ].join('\n'));
  assert.deepEqual(
    aliased.excludedOperations.map((operation) => [operation.label, operation.category]),
    [['output.url()', 'external-service']],
  );

  const local = planStudioExecution([
    'const renderer = new ApexPainter();',
    'const canvas = await renderer.createCanvas({ width: 64, height: 64 });',
    'return renderer.output.base64(canvas.buffer);',
  ].join('\n'));
  assert.equal(local.excludedOperations.length, 0);
  assert.ok(local.families.includes('output'));
});

test('Studio planner routes generated raster buffers reused as sources to full runtime', () => {
  const plan = planStudioExecution([
    'const painter = new ApexPainter();',
    'const base = await painter.createCanvas({ width: 320, height: 180 });',
    "const badge = await painter.createImage({ source: 'circle', width: 40, height: 40 }, base);",
    'return painter.createImage({ source: badge, x: 20, y: 20 }, base);',
  ].join('\n'));
  assert.equal(plan.backend, 'full-runtime');
  assert.match(plan.reasons.join('\n'), /preserve buffer identity/);
});


test('Studio workspace normalizes sibling filenames and rejects unsafe collisions', () => {
  assert.equal(studioWorkspaceFileName('helpers', 'ts'), 'helpers.ts');
  assert.equal(studioWorkspaceFileName('My helper file', 'js'), 'My-helper-file.js');

  const files = validateStudioWorkspaceFiles([
    { name: 'helpers.ts', source: 'export const answer = 42;', language: 'ts' },
    { name: 'palette', source: 'export const color = "#60a5fa";', language: 'ts' },
  ]);
  assert.deepEqual(files.map((file) => file.name), ['helpers.ts', 'palette.ts']);

  assert.throws(
    () => validateStudioWorkspaceFiles([
      { name: 'same.ts', source: 'export {};', language: 'ts' },
      { name: 'same.ts', source: 'export {};', language: 'ts' },
    ]),
    /Duplicate Studio workspace filename/,
  );
  assert.throws(
    () => validateStudioWorkspaceFiles([
      { name: 'snippet.ts', source: 'export {};', language: 'ts' },
    ]),
    /reserved by the runner/,
  );
});

test('Studio planner routes relative project imports to the full runtime', () => {
  const plan = planStudioExecution([
    "import { makeScene } from './helpers.ts';",
    "import { ApexPainter } from 'apexify.js';",
    'async function main() {',
    '  const painter = new ApexPainter();',
    '  return makeScene(painter);',
    '}',
  ].join('\n'));
  assert.equal(plan.backend, 'full-runtime');
  assert.match(plan.reasons.join('\n'), /imports a module/);
});

test('Studio planner keeps generated chart-buffer reuse browser-direct', () => {
  const plan = planStudioExecution([
    'const painter = new ApexPainter();',
    'const base = await painter.createCanvas({ width: 640, height: 360 });',
    "const chartBuf = await painter.createChart('bar', [{ label: 'A', value: 4, xStart: 0, xEnd: 1 }]);",
    'return painter.createImage({ source: chartBuf, x: 20, y: 20, width: 320, height: 180 }, base);',
  ].join('\n'));
  assert.equal(plan.backend, 'browser');
  assert.ok(plan.families.includes('chart'));
  assert.ok(plan.families.includes('image'));
});
