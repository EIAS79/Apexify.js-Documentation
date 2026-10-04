import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

const read = (file: string) => fs.readFileSync(file, 'utf8');

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
  const patternStart = generated.indexOf('patternBg:');
  const patternEnd = generated.indexOf('noiseBg:', patternStart);
  const patternBlock =
    patternStart >= 0
      ? generated.slice(patternStart, patternEnd >= 0 ? patternEnd : undefined)
      : '';
  assert.ok(patternBlock.includes('gradient:'));
  assert.ok(!patternBlock.includes('secondaryColor: "#152943"'));
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

test('Phase 4 preserves circular clipping when inherited media becomes rectangular', () => {
  const shell = read('components/studio/visual/VisualStudioPre4.tsx');
  const inspector = read('components/studio/visual/VisualCanvasInspector.tsx');

  assert.doesNotMatch(shell, /resetsCircularClip/);
  assert.doesNotMatch(shell, /next\.document\.canvas\.borderRadius = 0/);
  assert.match(inspector, /Circular \/ oval canvas/);
  assert.match(inspector, /rectangular canvas becomes an ellipse/);
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
  assert.match(shell, /'loading'/);
  assert.match(shell, /File too large/);
  assert.match(shell, /Uploading asset/);
  assert.match(shell, /Asset uploaded/);
  assert.match(css, /\.apx-pre4-confirm-dialog/);
  assert.match(css, /\.apx-pre4-render-progress/);
  assert.match(css, /\.apx-pre4-toast/);
  assert.match(css, /data-kind="loading"/);
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

test('Phase 4 keeps video authoring and extraction in one Style surface', () => {
  const inspector = fs.readFileSync('components/studio/visual/VisualCanvasInspector.tsx', 'utf8');

  assert.equal((inspector.match(/data-canvas-video-extract/g) ?? []).length, 1);
  assert.match(inspector, /Extract selected frame/);
  assert.doesNotMatch(inspector, /title="Video background & frame extraction"/);
  assert.match(inspector, /Advanced is intentionally non-duplicative/);
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
      filters: [{ type: 'grayscale' }],
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

test('Phase 4 validates exact canvas background ImageFilter contracts', () => {
  const valid = createVisualProject({
    width: 800,
    height: 450,
    now: '2026-09-29T00:00:00.000Z',
  });
  valid.document.canvas = {
    customBg: {
      source: 'studio://asset/image-filter-proof',
      filters: [
        { type: 'hueShift', value: 3600 },
        { type: 'posterize', levels: 2 },
        { type: 'invert' },
        { type: 'radialBlur', intensity: 8, centerX: 800, centerY: 450 },
      ],
    },
  };
  assert.equal(validateVisualProject(valid).ok, true);

  const outOfRange = structuredClone(valid);
  outOfRange.document.canvas!.customBg!.filters = [
    { type: 'hueShift', value: 3601 },
    { type: 'posterize', levels: 2.5 },
    { type: 'radialBlur', intensity: 8, centerX: 801, centerY: 225 },
  ];
  const invalidRanges = validateVisualProject(outOfRange);
  assert.equal(invalidRanges.ok, false);
  assert.ok(
    invalidRanges.issues.some((issue) => issue.code === 'canvas-background-filter-range'),
  );

  const invalidParameter = structuredClone(valid);
  invalidParameter.document.canvas!.customBg!.filters = [
    { type: 'grayscale', intensity: 1 },
  ];
  const invalidFields = validateVisualProject(invalidParameter);
  assert.equal(invalidFields.ok, false);
  assert.ok(
    invalidFields.issues.some(
      (issue) => issue.code === 'canvas-background-filter-parameter',
    ),
  );

  const pixelateRegion = structuredClone(valid);
  pixelateRegion.document.canvas!.customBg!.filters = [
    { type: 'pixelate', size: 12, x: 700, y: 0, width: 200, height: 200 },
  ];
  const invalidRegion = validateVisualProject(pixelateRegion);
  assert.equal(invalidRegion.ok, false);
  assert.ok(
    invalidRegion.issues.some(
      (issue) => issue.code === 'canvas-background-filter-range',
    ),
  );
});

test('Phase 4 filter editor exposes runtime ranges and boolean filters', () => {
  const inspector = fs.readFileSync(
    'components/studio/visual/VisualCanvasInspector.tsx',
    'utf8',
  );

  assert.match(inspector, /data-image-filter-contract="strict"/);
  assert.match(inspector, /IMAGE_FILTER_PARAMETERLESS_TYPES/);
  assert.match(inspector, /data-filter-boolean/);
  assert.match(inspector, /Allowed: \{field\.help\}/);
  assert.match(inspector, /updateVisualImageFilterValue/);
  assert.match(inspector, /data-pixelate-region-controls/);
  assert.match(inspector, /Pixelate region/);
  assert.match(inspector, /\['x', 'y', 'width', 'height'\]/);
  assert.match(inspector, /Full image/);
  assert.doesNotMatch(inspector, /FILTER_FIELDS/);
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
    'Extract selected frame',
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
    'Border position / rounded mask',
    'By frame',
    'By time',
    'data-canvas-video-extract',
    'Extract selected frame',
  ]) {
    assert.ok(inspector.includes(runtimeContract), 'missing Canvas interaction contract: ' + runtimeContract);
  }
  assert.doesNotMatch(inspector, /Edit full video/);
  assert.match(inspector, /data-canvas-video-compatibility/);
  assert.match(inspector, /Deprecated compatibility flags/);
  assert.match(inspector, /Legacy video background loop flag/);
  assert.match(inspector, /Legacy video background autoplay flag/);
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
  assert.match(inspector, /configuredVideoDuration/);
  assert.match(inspector, /videoPositionError/);
  assert.match(shell, /delete next\.videoBg/);
  assert.match(inspector, /delete next\.videoBg/);
  assert.match(inspector, /data-canvas-video-background/);
  assert.match(inspector, /apx-canvas-v2-segmented--6/);
  assert.doesNotMatch(inspector, /const frameExtractionEnabled = Boolean\(legacyVideoBg\)/);
  assert.doesNotMatch(inspector, /mutateExtractionVideoBg/);
  assert.doesNotMatch(inspector, /title="Video background & frame extraction"/);
  assert.match(inspector, /Video background frame selector/);
  assert.match(inspector, /Video background time selector/);
  assert.match(inspector, /Advanced is intentionally non-duplicative/);
  assert.match(shell, /setArtboardPreviewUrl\(studioAssetDataUrl\(extractedAsset\)\)/);
  assert.match(shell, /projectRef\.current = next/);
  assert.match(shell, /validateVirtualCanvasSource/);
  assert.match(shell, /customBg\.source/);
  assert.match(shell, /videoBg\.source/);
  assert.match(shell, /backgroundWarning/);
  assert.match(shell, /customBg = \{/);
  assert.match(shell, /videoBg\?\.filters \?\? previousCustomBg\?\.filters \?\? \[\]/);
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


test('STUDIO-PARITY-1 mirrors pinned canvas dimension and collection limits', () => {
  const oversized = createVisualProject({
    width: 16_384,
    height: 4_097,
    now: '2026-10-04T00:00:00.000Z',
  });
  const pixelLimit = validateVisualProject(oversized);
  assert.equal(pixelLimit.ok, false);
  assert.ok(pixelLimit.issues.some((issue) => issue.code === 'document-pixel-limit'));

  const nonInteger = createVisualProject({
    width: 640,
    height: 480,
    now: '2026-10-04T00:00:00.000Z',
  });
  nonInteger.document.width = 640.5;
  const invalidInteger = validateVisualProject(nonInteger);
  assert.equal(invalidInteger.ok, false);
  assert.ok(invalidInteger.issues.some((issue) => issue.code === 'document-width'));

  const layers = createVisualProject({
    width: 640,
    height: 480,
    now: '2026-10-04T00:00:00.000Z',
  });
  layers.document.canvas = {
    bgLayers: Array.from({ length: 129 }, () => ({
      type: 'color' as const,
      value: '#000000',
    })),
  };
  const layerLimit = validateVisualProject(layers);
  assert.equal(layerLimit.ok, false);
  assert.ok(layerLimit.issues.some((issue) => issue.code === 'canvas-layer-limit'));

  const filters = createVisualProject({
    width: 640,
    height: 480,
    now: '2026-10-04T00:00:00.000Z',
  });
  filters.document.canvas = {
    customBg: {
      source: 'studio://asset/filter-limit',
      filters: Array.from({ length: 65 }, () => ({ type: 'grayscale' as const })),
    },
  };
  const filterLimit = validateVisualProject(filters);
  assert.equal(filterLimit.ok, false);
  assert.ok(
    filterLimit.issues.some(
      (issue) => issue.code === 'canvas-background-filter-limit',
    ),
  );
});

test('STUDIO-PARITY-1 mirrors runtime gradient and pattern validation semantics', () => {
  const project = createVisualProject({
    width: 640,
    height: 480,
    now: '2026-10-04T00:00:00.000Z',
  });
  project.document.canvas = {
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      colors: [
        { stop: 0.8, color: '#ffffff' },
        { stop: 0.2, color: '#000000' },
      ],
    },
    patternBg: {
      type: 'grid',
      size: 0,
      scale: 0,
      spacing: -1,
      repeat: 'repeat',
      color: '#ffffff',
    },
  };

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  for (const code of [
    'canvas-gradient-stop-order',
    'canvas-gradient-geometry',
    'canvas-pattern-size',
    'canvas-pattern-scale',
    'canvas-pattern-spacing',
  ]) {
    assert.ok(validation.issues.some((issue) => issue.code === code), code);
  }

  const radial = structuredClone(project);
  radial.document.canvas = {
    gradientBg: {
      type: 'radial',
      startX: 10,
      startY: 10,
      startRadius: -1,
      endX: 10,
      endY: 10,
      endRadius: -1,
      colors: [
        { stop: 0, color: '#000000' },
        { stop: 1, color: '#ffffff' },
      ],
    },
  };
  const radialValidation = validateVisualProject(radial);
  assert.equal(radialValidation.ok, false);
  assert.ok(
    radialValidation.issues.some(
      (issue) => issue.code === 'canvas-gradient-radius',
    ),
  );
});

test('STUDIO-PARITY-1 validates background-layer variant contracts', () => {
  const project = createVisualProject({
    width: 640,
    height: 480,
    now: '2026-10-04T00:00:00.000Z',
  });
  project.document.canvas = {
    bgLayers: [
      {
        type: 'image',
        source: 'studio://asset/image',
        fit: 'fill',
        align: 'center',
      },
      {
        type: 'pattern',
        source: 'studio://asset/pattern',
        repeat: 'repeat',
      },
    ],
  };

  (project.document.canvas.bgLayers![0] as unknown as { fit: string }).fit = 'stretch';
  (project.document.canvas.bgLayers![0] as unknown as { align: string }).align = 'middle';
  (project.document.canvas.bgLayers![1] as unknown as { repeat: string }).repeat = 'mirror';

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'canvas-layer-fit'));
  assert.ok(validation.issues.some((issue) => issue.code === 'canvas-layer-align'));
  assert.ok(validation.issues.some((issue) => issue.code === 'canvas-layer-repeat'));
});

test('STUDIO-PARITY-1 reconciles Apexify omitted dimensions to the runtime 500px defaults', () => {
  const base = createVisualProject({
    width: 320,
    height: 180,
    now: '2026-10-04T00:00:00.000Z',
  });
  const result = reconcileVisualProjectFromCode(
    base,
    `
      import { ApexPainter } from 'apexify.js';
      const painter = new ApexPainter();
      const canvas = await painter.createCanvas({ colorBg: '#123456' });
      return canvas.buffer;
    `,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.project.document.width, 500);
  assert.equal(result.project.document.height, 500);
  assert.equal(result.project.document.canvas?.colorBg, '#123456');

  const canonical = generateVisualProjectCode(result.project).source;
  assert.match(canonical, /width: 500/);
  assert.match(canonical, /height: 500/);
});

test('STUDIO-PARITY-1 reconciles videoBg.inherit through the same source-dimension resolver', () => {
  const base = createVisualProject({
    width: 320,
    height: 180,
    now: '2026-10-04T00:00:00.000Z',
  });
  const source = `
    import { ApexPainter } from 'apexify.js';
    const painter = new ApexPainter();
    const canvas = await painter.createCanvas({
      videoBg: {
        source: 'studio://asset/video-inherit',
        inherit: true,
        frame: 1,
        format: 'jpg',
        quality: 2
      }
    });
    return canvas.buffer;
  `;
  const result = reconcileVisualProjectFromCode(
    base,
    source,
    (asset) =>
      asset === 'studio://asset/video-inherit'
        ? { width: 1920, height: 1080 }
        : null,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.project.document.width, 1920);
  assert.equal(result.project.document.height, 1080);
  assert.equal(result.project.document.canvas?.videoBg?.inherit, true);
});

test('STUDIO-PARITY-1 preserves deprecated video compatibility flags through code round-trip', () => {
  const project = createVisualProject({
    width: 640,
    height: 360,
    now: '2026-10-04T00:00:00.000Z',
  });
  project.document.canvas = {
    videoBg: {
      source: 'studio://asset/video-legacy',
      frame: 1,
      format: 'jpg',
      quality: 2,
      loop: true,
      autoplay: false,
    },
  };

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /loop: true/);
  assert.match(source, /autoplay: false/);

  const empty = createVisualProject({
    width: 10,
    height: 10,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.project.document.canvas?.videoBg?.loop, true);
  assert.equal(result.project.document.canvas?.videoBg?.autoplay, false);
});

test('STUDIO-PARITY-1 canvas inspector exposes ordered layer editing and runtime limits', () => {
  const inspector = fs.readFileSync(
    'components/studio/visual/VisualCanvasInspector.tsx',
    'utf8',
  );

  assert.match(inspector, /Move background layer down/);
  assert.match(inspector, /Move background layer up/);
  assert.match(inspector, /Duplicate background layer/);
  assert.match(inspector, /CANVAS_RUNTIME_LIMITS\.maxBackgroundLayers/);
  assert.match(inspector, /data-canvas-video-compatibility/);
  assert.match(inspector, /Studio preserves and round-trips them explicitly/);
});


test('STUDIO-PARITY-1 displays runtime pattern blend fallbacks without forcing model values', () => {
  const inspector = fs.readFileSync(
    'components/studio/visual/VisualCanvasInspector.tsx',
    'utf8',
  );

  assert.match(inspector, /effectiveBlendMode = 'overlay'/);
  assert.match(inspector, /pattern\.blendMode \?\? effectiveBlendMode \?\? 'overlay'/);
  assert.match(inspector, /effectiveBlendMode=\{layer\.blendMode \?\? 'source-over'\}/);
  assert.match(inspector, /Apexify defaults it to overlay/);

  const project = createVisualProject({
    width: 320,
    height: 180,
    now: '2026-10-04T00:00:00.000Z',
  });
  project.document.canvas = {
    patternBg: {
      type: 'dots',
      color: '#ffffff',
      size: 4,
      spacing: 8,
    },
  };
  const generated = generateVisualProjectCode(project).source;
  assert.match(generated, /patternBg:/);
  assert.doesNotMatch(generated, /blendMode:/);
});
