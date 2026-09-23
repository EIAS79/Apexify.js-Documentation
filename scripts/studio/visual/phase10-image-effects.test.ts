import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import {
  defaultImageNodeProps,
  defaultShapeNodeProps,
  imagePropsRecord,
  visualImageProps,
} from '../../../lib/studio/visual/image-contract';
import {
  IMAGE_UTILITY_API_COVERAGE,
  IMAGE_UTILITY_ANALYSIS_TYPES,
  IMAGE_UTILITY_STACK_TYPES,
  defaultImageUtilityAnalysis,
  defaultImageUtilityOperation,
  normalizeImageUtilityAnalysisDraft,
  normalizeImageUtilityOperationDraft,
} from '../../../lib/studio/visual/image-utility-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import {
  generateVisualProjectCode,
  generateVisualProjectDisplayPreviewCode,
  generateVisualProjectPreviewCode,
} from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { planStudioExecution } from '../../../lib/studio/runtime/capabilities';
import { detectStudioMedia } from '../../../lib/studio/runtime/media';

function phase10Project() {
  const project = createVisualProject({
    id: 'project_phase10',
    name: 'Phase 10 Image Utilities',
    width: 960,
    height: 640,
    now: '2026-09-23T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };

  const image = createVisualNode(
    'image',
    imagePropsRecord({
      ...defaultImageNodeProps('https://example.com/phase10.png'),
      utilityStack: [
        {
          id: 'image-op-effects',
          type: 'effects',
          filters: [
            { type: 'contrast', value: 1.08 },
            { type: 'saturation', value: 1.12 },
          ],
        },
        {
          id: 'image-op-resize',
          type: 'resize',
          size: { width: 720 },
          maintainAspectRatio: true,
          quality: 90,
          outputFormat: 'png',
        },
        {
          id: 'image-op-gradient',
          type: 'gradientBlend',
          options: {
            type: 'linear',
            angle: 90,
            colors: [
              { stop: 0, color: '#00000000' },
              { stop: 1, color: '#000000' },
            ],
            blendMode: 'multiply',
          },
        },
        {
          id: 'image-op-compress',
          type: 'compress',
          options: { quality: 82, format: 'webp', maxWidth: 720 },
        },
      ],
      utilityAnalyses: [
        {
          id: 'image-analysis-palette',
          type: 'extractPalette',
          options: { count: 6, method: 'kmeans', format: 'hex' },
        },
        {
          id: 'image-analysis-color',
          type: 'colorAnalysis',
        },
      ],
    }),
    { id: 'image_phase10', name: 'Phase 10 Hero' },
  );
  image.transform = {
    x: 120,
    y: 90,
    width: 720,
    height: 420,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
  };
  project.document.nodes[image.id] = image;
  project.document.rootNodeIds = [image.id];
  return project;
}

test('Phase 10 classifies every public image utility member', () => {
  assert.deepEqual(Object.keys(IMAGE_UTILITY_API_COVERAGE).sort(), [
    'blend','colorAnalysis','colorsFilter','colorsRemover','compress',
    'createCollage','cropImage','effects','extractPalette','gradientBlend',
    'imgConverter','masking','removeBackground','resize','stitchImages','validHex',
  ].sort());
  assert.deepEqual(IMAGE_UTILITY_STACK_TYPES, [
    'resize','cropImage','effects','colorsFilter','colorsRemover','blend',
    'masking','gradientBlend','stitchImages','createCollage','imgConverter','compress',
  ]);
  assert.deepEqual(IMAGE_UTILITY_ANALYSIS_TYPES, ['extractPalette','colorAnalysis']);
  assert.equal(IMAGE_UTILITY_API_COVERAGE.removeBackground.authoring, 'excluded');
  assert.equal(IMAGE_UTILITY_API_COVERAGE.removeBackground.route, 'external-service');
  assert.equal(IMAGE_UTILITY_API_COVERAGE.validHex.authoring, 'not-applicable');
});

test('Phase 10 lowers raster operations before composition and output utilities after composition', () => {
  const project = phase10Project();
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  assert.deepEqual(
    plan.operations.map((operation) => operation.kind),
    [
      'create-canvas',
      'image-utility',
      'image-utility',
      'image-utility',
      'image-analysis',
      'image-analysis',
      'create-image',
      'image-utility',
    ],
  );

  const utilities = plan.operations.filter((operation) => operation.kind === 'image-utility');
  assert.deepEqual(utilities.map((operation) => operation.method), [
    'effects','resize','gradientBlend','compress',
  ]);
  const composed = plan.operations.find(
    (operation) => operation.kind === 'create-image' && operation.sourceNodeId === 'image_phase10',
  );
  assert.equal(composed?.kind, 'create-image');
  if (composed?.kind === 'create-image') {
    assert.deepEqual(composed.properties.source, { $studioTarget: 'image_phase10__utility_2' });
  }
  const final = plan.operations.at(-1);
  assert.equal(final?.kind, 'image-utility');
  if (final?.kind === 'image-utility') {
    assert.equal(final.method, 'compress');
    assert.deepEqual(final.args[0], { $studioTarget: 'image_phase10' });
    assert.equal(plan.result.target, final.target);
  }
});

test('Phase 10 emits direct ApexPainter.image calls in stack order and routes full runtime', () => {
  const source = generateVisualProjectCode(phase10Project()).source;
  const effects = source.indexOf('.image.effects(');
  const resize = source.indexOf('.image.resize(');
  const gradient = source.indexOf('.image.gradientBlend(');
  const compress = source.indexOf('.image.compress(');
  const compose = source.lastIndexOf('.createImage(');

  assert.ok(effects >= 0);
  assert.ok(effects < resize);
  assert.ok(resize < gradient);
  assert.ok(gradient < compose);
  assert.ok(compose < compress);
  assert.ok(source.includes('.image.extractPalette('));
  assert.ok(source.includes('.image.colorAnalysis('));
  assert.match(source, /apexify-studio-v10:/);

  const execution = planStudioExecution(source);
  assert.equal(execution.backend, 'full-runtime');
  assert.ok(execution.families.includes('image-utils'));
});

test('Phase 10 canonical source round-trips the same ordered semantic stack', () => {
  const project = phase10Project();
  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    id: project.id,
    name: project.name,
    width: 100,
    height: 100,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const node = result.project.document.nodes.image_phase10;
  assert.equal(node.kind, 'image');
  const props = visualImageProps(node);
  assert.deepEqual(props.utilityStack, visualImageProps(project.document.nodes.image_phase10).utilityStack);
  assert.deepEqual(props.utilityAnalyses, visualImageProps(project.document.nodes.image_phase10).utilityAnalyses);
});

test('Phase 10 preview source preserves full-runtime utilities and structured analyses', () => {
  const source = generateVisualProjectPreviewCode(phase10Project()).source;
  const nativeSource = generateVisualProjectCode(phase10Project()).source;
  assert.ok(source.includes('.image.effects('));
  assert.ok(source.includes('.image.compress('));
  assert.ok(source.includes('studioResultsJson'));
  assert.ok(source.includes('image-analysis-palette'));
  assert.ok(source.includes('image-analysis-color'));
  assert.equal(nativeSource.includes('studioResultsJson'), false);
  assert.equal(planStudioExecution(source).backend, 'full-runtime');
});

test('Phase 10 rejects invalid stack parameters before lowering', () => {
  const project = phase10Project();
  const node = project.document.nodes.image_phase10;
  const props = visualImageProps(node);
  props.utilityStack = [
    {
      ...defaultImageUtilityOperation('stitchImages', 'bad-grid'),
      type: 'stitchImages',
      images: [{ $current: true }],
      options: { direction: 'grid', overlap: 4 },
    },
    {
      ...defaultImageUtilityOperation('compress', 'bad-quality'),
      type: 'compress',
      options: { quality: 0, format: 'webp' },
    },
  ];
  node.props = imagePropsRecord(props);

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((item) => item.code === 'image-utility-stitch-grid-overlap'));
  assert.ok(validation.issues.some((item) => item.code === 'image-utility-compress-quality'));
});

test('Phase 10 rejects raster utility stacks on built-in shape tokens', () => {
  const project = createVisualProject({
    id: 'project_phase10_shape_guard',
    name: 'Phase 10 Shape Guard',
    width: 320,
    height: 240,
    now: '2026-09-23T00:00:00.000Z',
  });
  const shape = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('rectangle'),
      utilityStack: [defaultImageUtilityOperation('effects', 'shape-effects')],
    }),
    { id: 'shape_phase10_guard', name: 'Shape Guard' },
  );
  project.document.nodes[shape.id] = shape;
  project.document.rootNodeIds = [shape.id];

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((item) => item.code === 'image-utility-shape-source'));
});

test('Phase 10 JSON draft normalization keeps required operation structure safe', () => {
  const crop = normalizeImageUtilityOperationDraft('cropImage', 'crop-safe', {});
  assert.equal(crop.type, 'cropImage');
  if (crop.type === 'cropImage') {
    assert.ok(crop.coordinates.length >= 3);
    assert.equal(crop.crop, 'inner');
  }

  const gradient = normalizeImageUtilityOperationDraft('gradientBlend', 'gradient-safe', {
    options: { angle: 45 },
  });
  assert.equal(gradient.type, 'gradientBlend');
  if (gradient.type === 'gradientBlend') {
    assert.ok(gradient.options.colors.length > 0);
    assert.equal(gradient.options.angle, 45);
  }

  const palette = normalizeImageUtilityAnalysisDraft('extractPalette', 'palette-safe', {});
  assert.equal(palette.type, 'extractPalette');
  if (palette.type === 'extractPalette') {
    assert.equal(palette.options?.count, 8);
  }

  assert.throws(
    () => normalizeImageUtilityOperationDraft('cropImage', 'crop-bad', { coordinates: {} }),
    /coordinates must be an array/i,
  );
  assert.throws(
    () => normalizeImageUtilityOperationDraft('gradientBlend', 'gradient-bad', { options: { colors: {} } }),
    /colors must be an array/i,
  );
});

test('Phase 10 nested utility JSON rejects malformed collection entries', () => {
  assert.throws(
    () => normalizeImageUtilityOperationDraft('cropImage', 'crop-null', { coordinates: [null] }),
    /coordinate\[0\].*object/i,
  );
  assert.throws(
    () => normalizeImageUtilityOperationDraft('effects', 'effects-null', { filters: [null] }),
    /filter\[0\].*object/i,
  );
  assert.throws(
    () => normalizeImageUtilityOperationDraft('blend', 'blend-null', { layers: [null] }),
    /layer\[0\].*object/i,
  );
  assert.throws(
    () => normalizeImageUtilityOperationDraft('stitchImages', 'stitch-null', { images: [null] }),
    /stitch image\[0\]/i,
  );
  assert.throws(
    () => normalizeImageUtilityOperationDraft('createCollage', 'collage-null', { images: [null] }),
    /collage image\[0\].*object/i,
  );
  assert.throws(
    () => normalizeImageUtilityOperationDraft('gradientBlend', 'gradient-null', {
      options: { colors: [null] },
    }),
    /gradient blend colors\[0\].*object/i,
  );
});

test('Phase 10 preview analysis keys are namespaced by source layer', () => {
  const project = phase10Project();
  const original = project.document.nodes.image_phase10;
  const duplicate = structuredClone(original);
  duplicate.id = 'image_phase10_copy';
  duplicate.name = 'Phase 10 Hero Copy';
  project.document.nodes[duplicate.id] = duplicate;
  project.document.rootNodeIds.push(duplicate.id);

  const source = generateVisualProjectPreviewCode(project).source;
  assert.ok(source.includes('image_phase10:image-analysis-palette'));
  assert.ok(source.includes('image_phase10_copy:image-analysis-palette'));
  assert.ok(source.includes('image_phase10:image-analysis-color'));
  assert.ok(source.includes('image_phase10_copy:image-analysis-color'));
});

test('Phase 10 separates unsupported exact exports from browser-safe display previews', () => {
  const project = phase10Project();
  const node = project.document.nodes.image_phase10;
  const props = visualImageProps(node);
  props.utilityStack = [{
    id: 'convert-raw-display',
    type: 'imgConverter',
    newExtension: 'raw',
  }];
  props.utilityAnalyses = [];
  node.props = imagePropsRecord(props);

  const exactSource = generateVisualProjectPreviewCode(project).source;
  const displaySource = generateVisualProjectDisplayPreviewCode(project).source;

  assert.ok(exactSource.includes('.image.imgConverter('));
  assert.ok(exactSource.includes('"raw"'));
  assert.ok(exactSource.includes('mime: "application/x-raw"'));
  assert.ok(exactSource.includes('name: "preview.raw"'));

  assert.ok(displaySource.includes('.image.imgConverter('));
  assert.ok(displaySource.includes('"png"'));
  assert.ok(displaySource.includes('mime: "image/png"'));
  assert.ok(displaySource.includes('name: "preview.png"'));

  const recovered = reconcileVisualProjectFromCode(project, displaySource);
  assert.equal(recovered.ok, true);
  if (recovered.ok) {
    const recoveredProps = visualImageProps(recovered.project.document.nodes.image_phase10);
    assert.deepEqual(recoveredProps.utilityStack, props.utilityStack);
  }
});

test('Phase 10 preview preserves advanced image MIME and filename identity', () => {
  const project = phase10Project();
  const node = project.document.nodes.image_phase10;
  const props = visualImageProps(node);
  props.utilityStack = [{
    id: 'convert-avif',
    type: 'imgConverter',
    newExtension: 'avif',
  }];
  props.utilityAnalyses = [];
  node.props = imagePropsRecord(props);

  const source = generateVisualProjectPreviewCode(project).source;
  assert.ok(source.includes('mime: "image/avif"'));
  assert.ok(source.includes('name: "preview.avif"'));

  props.utilityStack = [{
    id: 'convert-raw',
    type: 'imgConverter',
    newExtension: 'raw',
  }];
  node.props = imagePropsRecord(props);
  const rawSource = generateVisualProjectPreviewCode(project).source;
  assert.ok(rawSource.includes('mime: "application/x-raw"'));
  assert.ok(rawSource.includes('name: "preview.raw"'));
});

test('Studio media detection recognizes all Phase 10 advanced image encodings', () => {
  const ftyp = (brand: string) => {
    const bytes = Buffer.alloc(24);
    bytes.writeUInt32BE(24, 0);
    bytes.write('ftyp', 4, 'ascii');
    bytes.write(brand, 8, 'ascii');
    return bytes;
  };
  assert.deepEqual(detectStudioMedia(ftyp('avif')), { kind: 'image', mime: 'image/avif' });
  assert.deepEqual(detectStudioMedia(ftyp('heic')), { kind: 'image', mime: 'image/heif' });
  assert.deepEqual(
    detectStudioMedia(Buffer.from([0x49,0x49,0x2a,0x00,0,0,0,0])),
    { kind: 'image', mime: 'image/tiff' },
  );
  assert.deepEqual(
    detectStudioMedia(Buffer.from([0x00,0x00,0x00,0x0c,0x6a,0x50,0x20,0x20,0x0d,0x0a,0x87,0x0a])),
    { kind: 'image', mime: 'image/jp2' },
  );
  assert.deepEqual(
    detectStudioMedia(Buffer.from([0xff,0x0a,0x00,0x00])),
    { kind: 'image', mime: 'image/jxl' },
  );
  assert.deepEqual(
    detectStudioMedia(Buffer.from([0x01,0x02,0x03]), 'preview.raw'),
    { kind: 'binary', mime: 'application/x-raw' },
  );
});

test('Phase 10 output-stage operations cannot be followed by raster manipulation', () => {
  const project = phase10Project();
  const node = project.document.nodes.image_phase10;
  const props = visualImageProps(node);
  props.utilityStack = [
    defaultImageUtilityOperation('compress', 'compress-first'),
    defaultImageUtilityOperation('effects', 'effects-after-output'),
  ];
  node.props = imagePropsRecord(props);
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((item) => item.code === 'image-utility-output-order'));
});

test('Phase 10 defaults cover every stack and analysis operation', () => {
  for (const type of IMAGE_UTILITY_STACK_TYPES) {
    const operation = defaultImageUtilityOperation(type, 'op-' + type);
    assert.equal(operation.type, type);
    assert.equal(operation.id, 'op-' + type);
  }
  for (const type of IMAGE_UTILITY_ANALYSIS_TYPES) {
    const analysis = defaultImageUtilityAnalysis(type, 'analysis-' + type);
    assert.equal(analysis.type, type);
  }
});

test('Phase 10 permanent Images workflow exposes stack, presets, analysis and full-runtime routing', () => {
  const ui = fs.readFileSync('components/studio/visual/VisualImageUtilityAuthoring.tsx', 'utf8');
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');
  for (const contract of [
    'data-phase10-image-stack',
    'data-phase10-presets',
    'data-phase10-analysis',
    'data-phase10-api-coverage',
    'removeBackground',
    'validHex',
  ]) {
    assert.match(ui, new RegExp(contract));
  }
  assert.match(shell, /VisualImageUtilityAuthoring/);
  assert.match(shell, /currentNodeServerExecutionAdapter/);
  assert.match(shell, /phase10Active/);
  assert.match(shell, /primaryMedia\.kind === 'image'/);
  assert.match(shell, /studioResultsJson/);
  assert.match(shell, /setPhase7Results\(result\.results\)/);
  assert.match(shell, /phase10RenderTailRef/);
  assert.match(shell, /await previousPhase10Render/);
  assert.match(shell, /releasePhase10Render\(\)/);
  assert.match(shell, /modalPreviewFileName/);
  assert.match(shell, /modalPreviewDownloadUrl/);
  assert.match(shell, /generateVisualProjectDisplayPreviewCode/);
  assert.match(shell, /browserPreviewable/);
  assert.match(shell, /downloadDataUrl: exactDataUrl/);
  const wrapper = fs.readFileSync('lib/studio/runtime/wrapStudioSnippetForRunner.ts', 'utf8');
  for (const mime of ['image/avif','image/tiff','image/heif','image/jp2','image/jxl','application/x-raw']) {
    assert.ok(wrapper.includes(mime), mime + ' missing from runner wrapper');
  }
});
