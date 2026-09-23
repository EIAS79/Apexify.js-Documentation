import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import {
  createPhase11Frame,
  defaultPhase11Timeline,
  phase11ExpandedFrames,
  phase11Timeline,
  setPhase11Timeline,
  validatePhase11Project,
} from '../../../lib/studio/visual/gif-animation-contract';
import {
  generateVisualProjectCode,
  generateVisualProjectPreviewCode,
} from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { planStudioExecution } from '../../../lib/studio/runtime/capabilities';
import {
  defaultShapeNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8Dwn4GBgYGJAQoAHgQCAfKf6qAAAAAASUVORK5CYII=';

function phase11Project(mode: 'create-gif' | 'animate' | 'scene-gif' = 'create-gif') {
  const project = createVisualProject({
    id: 'project_phase11',
    name: 'Phase 11 Timeline',
    width: 320,
    height: 180,
    now: '2026-09-23T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#08192b' };
  const timeline = {
    ...defaultPhase11Timeline(project, 'gif-timeline-phase11'),
    mode,
    width: 320,
    height: 180,
    delay: 90,
    repeat: 0,
    quality: 8,
    frames: [
      {
        ...createPhase11Frame(PNG),
        id: 'gif-frame-a',
        duration: 70,
        repeat: 2,
      },
      {
        ...createPhase11Frame(PNG),
        id: 'gif-frame-b',
        duration: 130,
        repeat: 1,
      },
    ],
  };
  return setPhase11Timeline(project, timeline);
}

test('Phase 11 defaults and frame expansion are deterministic', () => {
  const project = phase11Project();
  const timeline = phase11Timeline(project);
  assert.ok(timeline);
  assert.equal(timeline?.mode, 'create-gif');
  assert.equal(timeline?.width, 320);
  assert.equal(timeline?.height, 180);
  assert.deepEqual(
    phase11ExpandedFrames(timeline!).map((frame) => frame.id),
    ['gif-frame-a', 'gif-frame-a', 'gif-frame-b'],
  );
  assert.deepEqual(
    phase11ExpandedFrames(timeline!).map((frame) => frame.duration),
    [70, 70, 130],
  );
});

test('Phase 11 createGIF generation preserves authored order and timing', () => {
  const project = phase11Project('create-gif');
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /apexify-studio-v11:/);
  assert.ok(source.includes('painter.createGIF('));
  assert.equal(source.includes('painter.animate('), false);
  assert.equal(source.includes('painter.renderSceneToGIF('), false);
  assert.ok(source.indexOf('duration: 70') < source.indexOf('duration: 130'));
  assert.ok(source.includes('repeat: 0'));
  assert.ok(source.includes('quality: 8'));

  const execution = planStudioExecution(source);
  assert.equal(execution.backend, 'full-runtime');
  assert.ok(execution.families.includes('gif'));
});

test('Phase 11 animate mode uses animate before GIF encoding', () => {
  const source = generateVisualProjectCode(phase11Project('animate')).source;
  const animate = source.indexOf('painter.animate(');
  const createGif = source.indexOf('painter.createGIF(');
  assert.ok(animate >= 0);
  assert.ok(createGif > animate);
  assert.ok(source.includes('renderedFrames.map'));
  const execution = planStudioExecution(source);
  assert.ok(execution.families.includes('animation'));
  assert.ok(execution.families.includes('gif'));
});

test('Phase 11 scene mode emits real renderSceneToGIF from the current Visual scene', () => {
  let project = phase11Project('scene-gif');
  const shape = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('rectangle'),
      shape: {
        ...defaultShapeNodeProps('rectangle').shape,
        color: '#6d7cff',
      },
    }),
    { id: 'phase11-scene-shape', name: 'Scene frame shape' },
  );
  shape.transform = {
    x: 20,
    y: 20,
    width: 140,
    height: 90,
    visible: true,
  };
  project.document.nodes[shape.id] = shape;
  project.document.rootNodeIds = [shape.id];

  const source = generateVisualProjectCode(project).source;
  assert.ok(source.includes('painter.renderSceneToGIF('));
  assert.ok(source.includes('prependComposedRaster: true'));
  assert.ok(source.includes('composedFrameDuration: 100'));
  assert.ok(source.includes('type: "image"'));
  assert.ok(source.includes('source: "rectangle"'));

  const execution = planStudioExecution(source);
  assert.equal(execution.backend, 'full-runtime');
  assert.ok(execution.families.includes('gif'));
});

test('Phase 11 canonical generated source round-trips timeline semantics exactly', () => {
  const project = phase11Project('animate');
  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    id: project.id,
    name: project.name,
    width: 1,
    height: 1,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(phase11Timeline(result.project), phase11Timeline(project));
  assert.equal(result.project.document.width, project.document.width);
  assert.equal(result.project.document.height, project.document.height);
});

test('Phase 11 preview uses the same native GIF runtime path', () => {
  const source = generateVisualProjectPreviewCode(phase11Project()).source;
  assert.match(source, /apexify-studio-v11:/);
  assert.ok(source.includes('painter.createGIF('));
  assert.equal(planStudioExecution(source).backend, 'full-runtime');
});

test('Phase 11 rejects invalid temporal state before code generation', () => {
  const project = phase11Project();
  const timeline = phase11Timeline(project)!;
  timeline.quality = 31;
  timeline.repeat = -2;
  timeline.frames[0]!.duration = 0;
  timeline.frames[1]!.repeat = 0;
  project.timelines[0]!.value = {
    ...(project.timelines[0]!.value ?? {}),
    quality: timeline.quality,
    repeat: timeline.repeat,
    frames: timeline.frames,
  };

  const issues = validatePhase11Project(project);
  assert.ok(issues.some((item) => item.code === 'phase11-quality'));
  assert.ok(issues.some((item) => item.code === 'phase11-repeat'));
  assert.ok(issues.some((item) => item.code === 'phase11-frame-duration'));
  assert.ok(issues.some((item) => item.code === 'phase11-frame-repeat'));
  assert.equal(validateVisualProject(project).ok, false);
});

test('Phase 11 scene-to-GIF supports a composed-scene-only timeline', () => {
  const project = phase11Project('scene-gif');
  const timeline = phase11Timeline(project)!;
  timeline.frames = [];
  timeline.scene = {
    prependComposedRaster: true,
    composedFrameDuration: 110,
    composedFrameRepeat: 3,
  };
  const next = setPhase11Timeline(project, timeline);
  assert.equal(validateVisualProject(next).ok, true);
  const source = generateVisualProjectCode(next).source;
  assert.ok(source.includes('gifFrames: []'));
  assert.ok(source.includes('composedFrameRepeat: 3'));
});

test('Phase 11 permanent GIF rail and conditional Timeline dock are present', () => {
  const ui = fs.readFileSync('components/studio/visual/VisualGifAuthoring.tsx', 'utf8');
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');

  for (const marker of [
    'data-phase11-gif-context',
    'data-phase11-create-timeline',
    'data-phase11-modes',
    'data-phase11-settings',
    'data-phase11-frame-rail',
    'data-phase11-timeline',
    'data-phase11-preview',
  ]) {
    assert.ok(ui.includes(marker), marker + ' missing');
  }

  assert.ok(shell.includes("['gif', FilmIcon, 'GIF']"));
  assert.ok(shell.includes("['timeline', 'Timeline']"));
  assert.ok(shell.includes('<VisualGifContext'));
  assert.ok(shell.includes('<VisualGifTimeline'));
  assert.ok(shell.includes("if (id === 'gif')"));
  assert.ok(shell.includes("phase11Active || phase10Active"));
});
