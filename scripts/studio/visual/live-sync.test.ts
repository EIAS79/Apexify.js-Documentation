import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

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
