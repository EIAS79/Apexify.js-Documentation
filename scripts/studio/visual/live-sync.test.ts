import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import {
  createPhase11Frame,
  defaultPhase11Timeline,
  setPhase11Timeline,
} from '../../../lib/studio/visual/gif-animation-contract';

test('live code reconciler applies numeric createCanvas dimensions without evaluation', () => {
  const project = createVisualProject({
    id: 'project_sync',
    name: 'Sync',
    width: 1440,
    height: 900,
    now: '2026-09-21T00:00:00.000Z',
  });
  const source = generateVisualProjectCode(project).source
    .replace('width: 1440', 'width: 1024')
    .replace('height: 900', 'height: 768');

  const result = reconcileVisualProjectFromCode(project, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.changed, true);
  assert.equal(result.project.document.width, 1024);
  assert.equal(result.project.document.height, 768);
});



test('live code reconciler applies canvas edits inside Phase 11 marker-backed source', () => {
  let project = createVisualProject({
    id: 'project_sync_phase11',
    name: 'Marker Sync',
    width: 320,
    height: 180,
    now: '2026-09-25T00:00:00.000Z',
  });
  const pixel =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/XPq7WQAAAABJRU5ErkJggg==';
  const timeline = {
    ...defaultPhase11Timeline(project, 'sync-phase11'),
    mode: 'scene-gif' as const,
    frames: [createPhase11Frame(pixel)],
  };
  project = setPhase11Timeline(project, timeline);

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /apexify-studio-v11:/);

  const edited = source
    .replace('width: 320', 'width: 640')
    .replace('height: 180', 'height: 360');

  const result = reconcileVisualProjectFromCode(project, edited);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;
  assert.equal(result.changed, true);
  assert.equal(result.project.document.width, 640);
  assert.equal(result.project.document.height, 360);
  assert.equal(result.project.timelines.length, project.timelines.length);
});


test('Phase 11 scene GIF code edits round-trip into canvas dimensions and timeline frames', () => {
  let project = createVisualProject({
    id: 'project_sync_phase11_scene',
    name: 'Scene GIF live sync',
    width: 320,
    height: 180,
    now: '2026-09-25T00:00:00.000Z',
  });
  const pixel =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/XPq7WQAAAABJRU5ErkJggg==';
  project = setPhase11Timeline(project, {
    ...defaultPhase11Timeline(project, 'sync-phase11-scene'),
    mode: 'scene-gif',
    frames: [
      {
        ...createPhase11Frame(pixel),
        duration: 100,
        repeat: 1,
      },
    ],
  });

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /renderSceneToGIF/);
  assert.match(source, /repeat: 1/);

  const edited = source
    .replace('width: 320', 'width: 640')
    .replace('height: 180', 'height: 360')
    .replace('duration: 100', 'duration: 240')
    .replace('repeat: 1', 'repeat: 3');

  const result = reconcileVisualProjectFromCode(project, edited);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;

  assert.equal(result.project.document.width, 640);
  assert.equal(result.project.document.height, 360);
  const timelineRecord = result.project.timelines.find(
    (item) => item.kind === 'gif-animation-timeline',
  );
  assert.ok(timelineRecord);
  const frames = Array.isArray(timelineRecord?.value?.frames)
    ? timelineRecord.value.frames
    : [];
  const first = frames[0] as Record<string, unknown> | undefined;
  assert.equal(first?.duration, 240);
  assert.equal(first?.repeat, 3);

  const canonical = generateVisualProjectCode(result.project).source;
  assert.match(canonical, /width: 640/);
  assert.match(canonical, /height: 360/);
  assert.match(canonical, /duration: 240/);
  assert.match(canonical, /repeat: 3/);
});

test('marker-backed live sync still rejects unsupported advanced runtime edits', () => {
  let project = createVisualProject({
    id: 'project_sync_phase11_guard',
    name: 'Marker Guard',
    width: 320,
    height: 180,
    now: '2026-09-25T00:00:00.000Z',
  });
  const pixel =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/XPq7WQAAAABJRU5ErkJggg==';
  project = setPhase11Timeline(project, {
    ...defaultPhase11Timeline(project, 'sync-phase11-guard'),
    frames: [createPhase11Frame(pixel)],
  });

  const source = generateVisualProjectCode(project).source;
  const edited = source.replace('  return gif;', '  return new Uint8Array();');
  const result = reconcileVisualProjectFromCode(project, edited);
  assert.equal(result.ok, false);
});

test('live code reconciler rejects dynamic or missing canvas geometry truthfully', () => {
  const project = createVisualProject({ width: 640, height: 360 });
  const dynamic = `
    import { ApexPainter } from 'apexify.js';
    const painter = new ApexPainter();
    const width = 800;
    const canvas = await painter.createCanvas({ width, height: 450 });
  `;
  const missing = `
    import { ApexPainter } from 'apexify.js';
    const painter = new ApexPainter();
  `;

  const dynamicResult = reconcileVisualProjectFromCode(project, dynamic);
  const missingResult = reconcileVisualProjectFromCode(project, missing);

  assert.equal(dynamicResult.ok, false);
  assert.equal(missingResult.ok, false);
});

test('live code reconciler does not use eval-like execution', async () => {
  const fs = await import('node:fs');
  const source = fs.readFileSync('lib/studio/visual/codegen/reconcile.ts', 'utf8');
  assert.doesNotMatch(source, /\beval\s*\(/);
  assert.doesNotMatch(source, /new\s+Function\s*\(/);
});
