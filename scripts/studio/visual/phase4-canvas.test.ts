import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

function createCanvasProject() {
  const project = createVisualProject({
    id: 'project_canvas_phase4',
    name: 'Canvas Phase 4',
    width: 960,
    height: 540,
    now: '2026-09-21T00:00:00.000Z',
  });
  project.document.canvas = {
    colorBg: '#081426',
    opacity: 0.92,
    blur: 2,
    rotation: 3,
    borderRadius: 24,
    borderPosition: 'all',
    blendMode: 'source-over',
    zoom: { scale: 1.05, centerX: 480, centerY: 270 },
    patternBg: {
      type: 'grid',
      color: '#315078',
      secondaryColor: '#152943',
      opacity: 0.35,
      size: 1,
      spacing: 28,
      rotation: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      gradient: {
        type: 'linear',
        startX: 0,
        startY: 0,
        endX: 960,
        endY: 0,
        angle: 0,
        repeat: 'no-repeat',
        colors: [
          { stop: 0, color: '#315078' },
          { stop: 1, color: '#7c3aed' },
        ],
      },
    },
    noiseBg: { intensity: 0.03 },
    bgLayers: [
      { type: 'color', value: '#102a56', opacity: 0.2, blendMode: 'screen' },
      {
        type: 'gradient',
        value: {
          type: 'linear',
          rotate: 45,
          colors: [
            { stop: 0, color: '#2563eb' },
            { stop: 1, color: '#7c3aed' },
          ],
        },
        opacity: 0.4,
      },
      {
        type: 'presetPattern',
        pattern: {
          type: 'dots',
          color: '#ffffff',
          opacity: 0.18,
          size: 2,
          spacing: 20,
        },
        opacity: 0.5,
      },
      { type: 'noise', intensity: 0.02, blendMode: 'soft-light' },
    ],
    stroke: {
      color: '#b7c9ff',
      width: 2,
      opacity: 0.8,
      blur: 0,
      position: 0,
      borderRadius: 24,
      borderPosition: 'all',
      roundedCorners: 'all',
      style: 'solid',
    },
    shadow: {
      color: '#000000',
      offsetX: 0,
      offsetY: 12,
      blur: 28,
      opacity: 0.35,
      borderRadius: 24,
      roundedCorners: 'all',
    },
  };
  return project;
}

test('Phase 4 lowers the complete deterministic canvas contract', () => {
  const project = createCanvasProject();
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  const operation = plan.operations[0];
  assert.equal(operation.kind, 'create-canvas');
  assert.equal(operation.options.width, 960);
  assert.equal(operation.options.height, 540);
  assert.equal(operation.options.colorBg, '#081426');
  assert.equal(operation.options.patternBg?.type, 'grid');
  assert.equal(operation.options.bgLayers?.length, 4);
  assert.equal(operation.options.stroke?.width, 2);
  assert.equal(operation.options.shadow?.blur, 28);
});

test('Phase 4 generated createCanvas source contains canvas appearance and effects', () => {
  const generated = generateVisualProjectCode(createCanvasProject()).source;
  for (const expected of [
    'colorBg: "#081426"',
    'patternBg:',
    'noiseBg:',
    'bgLayers:',
    'blendMode: "source-over"',
    'borderRadius: 24',
    'zoom:',
    'stroke:',
    'shadow:',
  ]) {
    assert.ok(generated.includes(expected), 'missing generated source fragment: ' + expected);
  }
});

test('Phase 4 generated canvas source round-trips back to equivalent Visual canvas state', () => {
  const project = createCanvasProject();
  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    id: project.id,
    name: project.name,
    width: 300,
    height: 200,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.project.document.width, project.document.width);
  assert.equal(result.project.document.height, project.document.height);
  assert.deepEqual(result.project.document.canvas, project.document.canvas);
});

test('Phase 4 rejects conflicting primary backgrounds and unsafe dynamic canvas expressions', () => {
  const invalid = createCanvasProject();
  invalid.document.canvas = {
    colorBg: '#000000',
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#000000' },
        { stop: 1, color: '#ffffff' },
      ],
    },
  };
  const validation = validateVisualProject(invalid);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'canvas-base-background'));

  const dynamic = reconcileVisualProjectFromCode(
    createVisualProject({ width: 400, height: 300 }),
    `
      import { ApexPainter } from 'apexify.js';
      const painter = new ApexPainter();
      const color = '#123456';
      const canvas = await painter.createCanvas({ width: 400, height: 300, colorBg: color });
    `,
  );
  assert.equal(dynamic.ok, false);
});

test('Phase 4 shell exposes the complete createCanvas inspector contract', () => {
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');
  const inspector = fs.readFileSync('components/studio/visual/VisualCanvasInspector.tsx', 'utf8');

  assert.match(shell, /VisualCanvasInspector/);
  assert.doesNotMatch(shell, /renderCanvasStyle/);
  assert.doesNotMatch(shell, /Apply complete CanvasConfig/);

  for (const contract of [
    'data-canvas-inspector-v2',
    'createCanvas()',
    'Base surface',
    'customBg.source',
    'Inherit source dimensions',
    'Image filters',
    'Video background',
    'Pattern overlay',
    'Noise overlay',
    'Background layers',
    'Internal zoom',
    'Stroke',
    'Shadow',
    'Blend mode',
    'Border position',
    'Canvas opacity',
    'width / height',
    'transparentBase',
    'bgLayers',
    'patternBg',
    'noiseBg',
    'videoBg',
    'customBg',
  ]) {
    assert.ok(inspector.includes(contract), 'missing Canvas V2 UI contract: ' + contract);
  }

  for (const filterType of [
    'gaussianBlur','motionBlur','radialBlur','sharpen','noise','grain',
    'edgeDetection','emboss','invert','grayscale','sepia','pixelate',
    'brightness','contrast','saturation','hueShift','posterize',
  ]) {
    assert.ok(inspector.includes(filterType), 'missing Canvas filter UI: ' + filterType);
  }
});
