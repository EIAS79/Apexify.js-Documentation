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
      opacity: 1,
      blendMode: 'source-over',
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

test('Phase 4 enforces exclusive pattern paint and source-over defaults', () => {
  const invalid = createCanvasProject();
  invalid.document.canvas!.patternBg = {
    type: 'stripes',
    color: '#ff0000',
    secondaryColor: '#ffff00',
    gradient: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 960,
      endY: 0,
      colors: [
        { stop: 0, color: '#ff0000' },
        { stop: 1, color: '#ffff00' },
      ],
    },
  };
  const validation = validateVisualProject(invalid);
  assert.equal(validation.ok, false);
  assert.ok(
    validation.issues.some(
      (issue) => issue.code === 'canvas-pattern-paint-exclusive',
    ),
  );

  const generated = generateVisualProjectCode(createCanvasProject()).source;
  assert.ok(generated.includes('blendMode: "source-over"'));
  assert.ok(generated.includes('gradient:'));
  assert.ok(!generated.includes('color: "#315078"'));
  assert.ok(!generated.includes('secondaryColor: "#152943"'));
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

test('Phase 4 treats videoBg as an exclusive primary background', () => {
  const invalid = createVisualProject({
    width: 640,
    height: 360,
    now: '2026-09-28T00:00:00.000Z',
  });
  invalid.document.canvas = {
    customBg: {
      source: 'studio://asset/image-one',
      fit: 'fill',
      align: 'center',
      opacity: 1,
    },
    videoBg: {
      source: 'studio://asset/video-one',
      time: 0,
      format: 'jpg',
      quality: 2,
      opacity: 1,
    },
  };

  const validation = validateVisualProject(invalid);
  assert.equal(validation.ok, false);
  assert.ok(
    validation.issues.some(
      (issue) => issue.code === 'canvas-base-background',
    ),
  );
});

test('Phase 4 generated code replaces the primary background instead of accumulating stale modes', () => {
  const project = createVisualProject({
    width: 800,
    height: 450,
    now: '2026-09-28T00:00:00.000Z',
  });
  const generated = () => generateVisualProjectCode(project).source;

  project.document.canvas = {
    customBg: {
      source: 'studio://asset/image-one',
      fit: 'cover',
      align: 'center',
      opacity: 1,
    },
  };
  assert.match(generated(), /customBg:/);
  assert.doesNotMatch(generated(), /videoBg:|gradientBg:|colorBg:/);

  project.document.canvas = {
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 800,
      endY: 0,
      colors: [
        { stop: 0, color: '#000000' },
        { stop: 1, color: '#ffffff' },
      ],
    },
  };
  assert.match(generated(), /gradientBg:/);
  assert.doesNotMatch(generated(), /customBg:|videoBg:|colorBg:/);

  project.document.canvas = { colorBg: '#123456' };
  assert.match(generated(), /colorBg: "#123456"/);
  assert.doesNotMatch(generated(), /customBg:|videoBg:|gradientBg:/);

  project.document.canvas = {
    videoBg: {
      source: 'studio://asset/video-one',
      frame: 13,
      format: 'jpg',
      quality: 2,
      opacity: 1,
    },
  };
  const videoSource = generated();
  assert.match(videoSource, /videoBg:/);
  assert.match(videoSource, /studio:\/\/asset\/video-one/);
  assert.match(videoSource, /frame: 13/);
  assert.doesNotMatch(videoSource, /customBg:|gradientBg:|colorBg:/);

  project.document.canvas = {};
  const defaultSource = generated();
  assert.doesNotMatch(
    defaultSource,
    /customBg:|videoBg:|gradientBg:|colorBg:|transparentBase:/,
  );
});

test('Phase 4 keeps uploaded video background preview/extraction in the browser', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const assets = read('lib/studio/runtime/assets.ts');

  assert.match(shell, /extractStudioVideoFrameInBrowser/);
  assert.match(shell, /canRenderLocalVideoBg/);
  assert.match(shell, /Local Studio video stays in your browser/);
  assert.match(shell, /browserVideoFpsCacheRef/);
  assert.match(shell, /setArtboardPreviewUrl\(studioAssetDataUrl\(extractedAsset\)\)/);
  assert.match(assets, /fps\?: number/);
});

test('Phase 4 uses modern async feedback and reset confirmation UI', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const css = read('styles/studio-calm.css');

  assert.doesNotMatch(shell, /window\.confirm\(/);
  assert.match(shell, /role="alertdialog"/);
  assert.match(shell, /apx-pre4-toast/);
  assert.match(shell, /data-render-progress/);
  assert.match(css, /\.apx-pre4-confirm-dialog/);
  assert.match(css, /\.apx-pre4-render-progress/);
  assert.match(css, /\.apx-pre4-toast/);
});

test('Phase 4 videoBg exposes current image-style background parity in Visual Studio', () => {
  const inspector = fs.readFileSync('components/studio/visual/VisualCanvasInspector.tsx', 'utf8');
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');

  assert.match(inspector, /data-canvas-video-image-parity/);
  assert.match(inspector, /Video background inherit dimensions/);
  assert.match(inspector, /Video background fit/);
  assert.match(inspector, /Video background alignment/);
  assert.match(inspector, /Background media filters/);
  assert.match(inspector, /legacyVideoBg\.filters/);
  assert.match(shell, /activeVideoBg\.inherit/);
  assert.match(shell, /activeVideoBg\.fit \?\? 'fill'/);
  assert.match(shell, /activeVideoBg\.align \?\? 'center'/);
  assert.match(shell, /activeVideoBg\.filters \?\? \[\]/);
  assert.match(shell, /videoBg\?\.filters \?\? previousCustomBg\?\.filters/);
});

test('Phase 4 codegen retains the latest videoBg image-style options', () => {
  const project = createVisualProject({
    width: 800,
    height: 450,
    now: '2026-09-28T00:00:00.000Z',
  });
  project.document.canvas = {
    videoBg: {
      source: 'studio://asset/video-parity',
      frame: 10,
      inherit: true,
      fit: 'contain',
      align: 'bottom-right',
      filters: [{ type: 'grayscale', intensity: 1 }],
      opacity: 0.6,
      format: 'png',
      quality: 2,
    },
  };

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /videoBg:/);
  assert.match(source, /frame: 10/);
  assert.match(source, /inherit: true/);
  assert.match(source, /fit: "contain"/);
  assert.match(source, /align: "bottom-right"/);
  assert.match(source, /filters:/);
  assert.match(source, /type: "grayscale"/);
  assert.match(source, /opacity: 0\.6/);
  assert.match(source, /format: "png"/);
  assert.match(source, /quality: 2/);
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
    'videoBg.source',
    'Video opacity',
    'Inherit source dimensions',
    'Image filters',
    'Video frame extraction',
    'Pattern overlay',
    'Pattern paint',
    'Primary / secondary',
    'Paint and blend are independent',
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

  for (const runtimeContract of [
    'MultiPositionField',
    'Stroke sides',
    'Rounded positions',
    'By frame',
    'By time',
    'data-canvas-video-extract',
    'Video → still image → customBg',
  ]) {
    assert.ok(inspector.includes(runtimeContract), 'missing Canvas interaction contract: ' + runtimeContract);
  }
  assert.doesNotMatch(inspector, /Edit full video/);
  assert.doesNotMatch(inspector, /Loop metadata/);
  assert.doesNotMatch(inspector, /Autoplay metadata/);
  assert.match(inspector, /frameExtractionMode === 'frame'/);
  assert.match(inspector, /max=\{31\}/);
  assert.match(
    fs.readFileSync('lib/studio/visual/model.ts', 'utf8'),
    /VisualCanvasImageBackgroundOptions[\s\S]*inherit\?: boolean[\s\S]*fit\?:[\s\S]*align\?:[\s\S]*filters\?: VisualImageFilter\[\]/,
  );
  assert.match(
    fs.readFileSync('lib/studio/visual/canvas-contract.ts', 'utf8'),
    /Video background must specify frame or time, not both/,
  );
  assert.match(shell, /extractFrameByNumber/);
  assert.match(shell, /extractFrameAtTime/);
  assert.match(shell, /getInfo: true/);
  assert.match(shell, /Requested time/);
  assert.match(shell, /Requested frame/);
  assert.match(shell, /sourceAsset\?\.metadata\?\.width/);
  assert.match(shell, /sourceAsset\?\.metadata\?\.height/);
  assert.match(inspector, /selectedVideoDuration/);
  assert.match(inspector, /extractionPositionError/);
  assert.match(shell, /delete next\.videoBg/);
  assert.match(inspector, /delete next\.videoBg/);
  assert.match(inspector, /data-canvas-video-background/);
  assert.match(inspector, /apx-canvas-v2-segmented--6/);
  assert.match(inspector, /const frameExtractionEnabled = Boolean\(legacyVideoBg\)/);
  assert.match(inspector, /mutateExtractionVideoBg/);
  assert.match(inspector, /Video background frame mode/);
  assert.match(inspector, /Video background time mode/);
  assert.match(shell, /setArtboardPreviewUrl\(studioAssetDataUrl\(extractedAsset\)\)/);
  assert.match(shell, /projectRef\.current = next/);
  assert.match(shell, /validateVirtualCanvasSource/);
  assert.match(shell, /customBg\.source/);
  assert.match(shell, /videoBg\.source/);
  assert.match(shell, /backgroundWarning/);
  assert.match(shell, /customBg = \{/);
  assert.match(shell, /filters: previousCustomBg\?\.filters \?\? \[\]/);
  assert.match(shell, /setInspectorTab\('effects'\)/);
  assert.match(shell, /canvasNeedsNodeRuntime/);
  assert.match(shell, /phase13Timeline/);
  assert.match(shell, /setPhase13Timeline/);

  for (const filterType of [
    'gaussianBlur','motionBlur','radialBlur','sharpen','noise','grain',
    'edgeDetection','emboss','invert','grayscale','sepia','pixelate',
    'brightness','contrast','saturation','hueShift','posterize',
  ]) {
    assert.ok(inspector.includes(filterType), 'missing Canvas filter UI: ' + filterType);
  }
});
