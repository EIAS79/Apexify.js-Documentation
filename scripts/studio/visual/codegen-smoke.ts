import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ApexPainter } from 'apexify.js';
import { createPhase2ProofProject } from '../../../lib/studio/visual/sample';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import {
  defaultImageNodeProps,
  defaultShapeNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';
import {
  defaultTextNodeProps,
  textPropsRecord,
} from '../../../lib/studio/visual/text-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import {
  defaultPhase11Timeline,
  setPhase11Timeline,
} from '../../../lib/studio/visual/gif-animation-contract';

async function run() {
  const project = createPhase2ProofProject();
  const plan = lowerVisualProject(project);
  const painter = new ApexPainter();

  const previewBuffer = await executeStudioOperationPlan(plan, {
    createCanvas: async (options) => {
      const canvas = await painter.createCanvas(options as Parameters<ApexPainter['createCanvas']>[0]);
      return { buffer: canvas.buffer };
    },
  });

  const generated = generateVisualProjectCode(project);
  const executableBody = generated.source.replace(
    /^import \{ ApexPainter \} from 'apexify\.js';\n\n/,
    '',
  );
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
    ...args: string[]
  ) => (...values: unknown[]) => Promise<Uint8Array>;
  const executeGenerated = new AsyncFunction('ApexPainter', executableBody);
  const generatedBuffer = await executeGenerated(ApexPainter);

  const digest = (buffer: Uint8Array) => createHash('sha256').update(buffer).digest('hex');
  assert.equal(digest(generatedBuffer), digest(previewBuffer));
  assert.ok(previewBuffer.byteLength > 0);

  console.log(
    '[studio-visual:phase2] equivalent preview/codegen proof passed',
    JSON.stringify({
      bytes: previewBuffer.byteLength,
      sha256: digest(previewBuffer),
      generatedFile: generated.fileName,
    }),
  );

  const canvasProject = createVisualProject({
    id: 'project_phase4_runtime',
    name: 'Phase 4 Runtime',
    width: 320,
    height: 180,
    now: '2026-09-21T00:00:00.000Z',
  });
  canvasProject.document.canvas = {
    colorBg: '#07172d',
    borderRadius: 18,
    patternBg: {
      type: 'grid',
      color: '#315078',
      secondaryColor: '#14233a',
      opacity: 0.35,
      size: 1,
      spacing: 24,
    },
    bgLayers: [
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
        opacity: 0.28,
      },
    ],
    stroke: { color: '#8fb5ff', width: 2, opacity: 0.8 },
    shadow: { color: '#000000', offsetX: 0, offsetY: 8, blur: 14, opacity: 0.25 },
  };

  const canvasPlan = lowerVisualProject(canvasProject);
  const canvasPreview = await executeStudioOperationPlan(canvasPlan, {
    createCanvas: async (options) => {
      const canvas = await painter.createCanvas(options as Parameters<ApexPainter['createCanvas']>[0]);
      return { buffer: canvas.buffer };
    },
  });
  const canvasGenerated = generateVisualProjectCode(canvasProject);
  const canvasBody = canvasGenerated.source.replace(
    /^import \{ ApexPainter \} from 'apexify\.js';\n\n/,
    '',
  );
  const executeCanvasGenerated = new AsyncFunction('ApexPainter', canvasBody);
  const canvasGeneratedBuffer = await executeCanvasGenerated(ApexPainter);
  assert.equal(digest(canvasGeneratedBuffer), digest(canvasPreview));
  assert.ok(canvasPreview.byteLength > 0);

  console.log(
    '[studio-visual:phase4] equivalent canvas preview/codegen proof passed',
    JSON.stringify({
      bytes: canvasPreview.byteLength,
      sha256: digest(canvasPreview),
      generatedFile: canvasGenerated.fileName,
    }),
  );

  const imageProject = createVisualProject({
    id: 'project_phase5_runtime',
    name: 'Phase 5 Runtime',
    width: 420,
    height: 280,
    now: '2026-09-21T00:00:00.000Z',
  });
  imageProject.document.canvas = {
    colorBg: '#07172d',
    borderRadius: 16,
  };
  const star = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('star'),
      shape: {
        ...defaultShapeNodeProps('star').shape,
        color: '#6f86ff',
        innerRadius: 34,
        outerRadius: 72,
      },
      stroke: { color: '#dbe7ff', width: 2, opacity: .9 },
      shadow: { color: '#000000', offsetX: 0, offsetY: 8, blur: 14, opacity: .3 },
    }),
    { id: 'shape_runtime_star', name: 'Runtime Star' },
  );
  star.transform = {
    x: 120,
    y: 54,
    width: 180,
    height: 180,
    rotation: 8,
    opacity: .95,
    visible: true,
    locked: false,
  };
  imageProject.document.nodes[star.id] = star;
  imageProject.document.rootNodeIds = [star.id];

  const imagePlan = lowerVisualProject(imageProject);
  const imagePreview = await executeStudioOperationPlan(imagePlan, {
    createCanvas: async (options) => {
      const canvas = await painter.createCanvas(options as Parameters<ApexPainter['createCanvas']>[0]);
      return { buffer: canvas.buffer };
    },
    createImage: async (properties, base, options) => {
      const buffer = await painter.createImage(
        properties as Parameters<ApexPainter['createImage']>[0],
        base as Parameters<ApexPainter['createImage']>[1],
        options as Parameters<ApexPainter['createImage']>[2],
      );
      return buffer;
    },
  });

  const imageGenerated = generateVisualProjectCode(imageProject);
  const imageBody = imageGenerated.source.replace(
    /^import \{ ApexPainter \} from 'apexify\.js';\n\n/,
    '',
  );
  const executeImageGenerated = new AsyncFunction('ApexPainter', imageBody);
  const imageGeneratedBuffer = await executeImageGenerated(ApexPainter);
  assert.equal(digest(imageGeneratedBuffer), digest(imagePreview));
  assert.ok(imagePreview.byteLength > 0);

  console.log(
    '[studio-visual:phase5] equivalent image/shape preview-codegen proof passed',
    JSON.stringify({
      bytes: imagePreview.byteLength,
      sha256: digest(imagePreview),
      generatedFile: imageGenerated.fileName,
    }),
  );


  const textProject = createVisualProject({
    id: 'project_phase6_runtime',
    name: 'Phase 6 Runtime',
    width: 640,
    height: 360,
    now: '2026-09-21T00:00:00.000Z',
  });
  textProject.document.canvas = {
    colorBg: '#07172d',
    borderRadius: 18,
  };
  const runtimeTextProps = {
    ...defaultTextNodeProps('Apexify Studio\nText and fonts.'),
    font: {
      size: 48,
      family: 'Arial',
      name: 'Arial',
    },
    decorations: {
      bold: true,
      italic: false,
      underline: { color: '#7dd3fc', width: 2 },
    },
    layout: {
      lineHeight: 1.3,
      letterSpacing: 1,
      wordSpacing: 1,
      maxWidth: 420,
      maxHeight: 150,
    },
    placement: {
      textAlign: 'left' as const,
      textBaseline: 'top' as const,
      rotation: -3,
    },
    fill: {
      color: '#f8fafc',
      opacity: .96,
    },
    effects: {
      shadow: {
        color: '#000000',
        offsetX: 0,
        offsetY: 6,
        blur: 12,
        opacity: .35,
      },
    },
    stroke: {
      color: '#0b1730',
      width: 1,
      opacity: .8,
      style: 'solid' as const,
    },
    includeCharMetrics: true,
    measurementCanvas: { width: 1000, height: 500 },
  };
  const runtimeText = createVisualNode(
    'text',
    textPropsRecord(runtimeTextProps),
    { id: 'text_runtime_copy', name: 'Runtime Copy' },
  );
  runtimeText.transform = {
    x: 100,
    y: 95,
    width: 420,
    height: 150,
    rotation: -3,
    opacity: .96,
    visible: true,
    locked: false,
  };
  textProject.document.nodes[runtimeText.id] = runtimeText;
  textProject.document.rootNodeIds = [runtimeText.id];

  const textPlan = lowerVisualProject(textProject);
  const textPreview = await executeStudioOperationPlan(textPlan, {
    createCanvas: async (options) => {
      const canvas = await painter.createCanvas(
        options as Parameters<ApexPainter['createCanvas']>[0],
      );
      return { buffer: canvas.buffer };
    },
    createText: async (properties, base) => {
      const buffer = await painter.createText(
        properties as Parameters<ApexPainter['createText']>[0],
        base as Parameters<ApexPainter['createText']>[1],
      );
      return buffer;
    },
  });

  const textGenerated = generateVisualProjectCode(textProject);
  const textBody = textGenerated.source.replace(
    /^import \{ ApexPainter \} from 'apexify\.js';\n\n/,
    '',
  );
  const executeTextGenerated = new AsyncFunction('ApexPainter', textBody);
  const textGeneratedBuffer = await executeTextGenerated(ApexPainter);
  assert.equal(digest(textGeneratedBuffer), digest(textPreview));
  assert.ok(textPreview.byteLength > 0);

  const metrics = await painter.measureText(
    {
      ...runtimeTextProps,
      x: 100,
      y: 95,
    } as Parameters<ApexPainter['measureText']>[0],
  );
  assert.ok(metrics.width > 0);
  assert.ok(metrics.height > 0);
  assert.ok((metrics.lines?.length ?? 0) >= 2);
  assert.ok((metrics.charWidths?.length ?? 0) > 0);
  assert.ok((metrics.charPositions?.length ?? 0) > 0);

  console.log(
    '[studio-visual:phase6] equivalent text preview-codegen + metrics proof passed',
    JSON.stringify({
      bytes: textPreview.byteLength,
      sha256: digest(textPreview),
      width: metrics.width,
      height: metrics.height,
      lines: metrics.lines?.length ?? 0,
      chars: metrics.charWidths?.length ?? 0,
      generatedFile: textGenerated.fileName,
    }),
  );

  const phase10Project = createVisualProject({
    id: 'project_phase10_runtime',
    name: 'Phase 10 Runtime',
    width: 360,
    height: 240,
    now: '2026-09-23T00:00:00.000Z',
  });
  phase10Project.document.canvas = { colorBg: '#07172d' };

  const phase10SourceShape = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('rectangle'),
      shape: {
        ...defaultShapeNodeProps('rectangle').shape,
        color: '#6482ff',
      },
      borderRadius: 18,
    }),
    { id: 'shape_phase10_source', name: 'Phase 10 Source' },
  );
  phase10SourceShape.transform = {
    x: 52,
    y: 42,
    width: 150,
    height: 110,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };

  const phase10Image = createVisualNode(
    'image',
    imagePropsRecord({
      ...defaultImageNodeProps(''),
      source: { $generated: phase10SourceShape.id },
      utilityStack: [
        {
          id: 'runtime-effects',
          type: 'effects',
          filters: [
            { type: 'contrast', value: 1.05 },
            { type: 'saturation', value: 1.08 },
          ],
        },
        {
          id: 'runtime-compress',
          type: 'compress',
          options: { quality: 88, format: 'webp', maxWidth: 360 },
        },
      ],
      utilityAnalyses: [
        {
          id: 'runtime-color-analysis',
          type: 'colorAnalysis',
        },
      ],
      fit: 'contain',
    }),
    { id: 'image_phase10_processed', name: 'Processed Runtime Image' },
  );
  phase10Image.transform = {
    x: 175,
    y: 72,
    width: 150,
    height: 110,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
  phase10Project.document.nodes[phase10SourceShape.id] = phase10SourceShape;
  phase10Project.document.nodes[phase10Image.id] = phase10Image;
  phase10Project.document.rootNodeIds = [phase10SourceShape.id, phase10Image.id];

  const phase10Plan = lowerVisualProject(phase10Project);
  const imageFacet = painter.image as unknown as Record<
    string,
    (...args: unknown[]) => unknown
  >;
  const phase10Preview = await executeStudioOperationPlan(phase10Plan, {
    createCanvas: async (options) => {
      const canvas = await painter.createCanvas(
        options as Parameters<ApexPainter['createCanvas']>[0],
      );
      return { buffer: canvas.buffer };
    },
    createImage: async (properties, base, options) => {
      return painter.createImage(
        properties as Parameters<ApexPainter['createImage']>[0],
        base as Parameters<ApexPainter['createImage']>[1],
        options as Parameters<ApexPainter['createImage']>[2],
      );
    },
    runImageUtility: async (method, args) => {
      const value = await imageFacet[method]!(...args);
      if (!(value instanceof Uint8Array)) {
        throw new Error('Phase 10 image utility did not return image bytes: ' + method);
      }
      return value;
    },
    runImageAnalysis: async (method, args) => {
      return imageFacet[method]!(...args);
    },
  });

  const phase10Generated = generateVisualProjectCode(phase10Project);
  const phase10Body = phase10Generated.source
    .replace(/^\/\* apexify-studio-v10:[^\n]+\*\/\n/, '')
    .replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');
  const executePhase10Generated = new AsyncFunction('ApexPainter', phase10Body);
  const phase10GeneratedBuffer = await executePhase10Generated(ApexPainter);
  assert.equal(digest(phase10GeneratedBuffer), digest(phase10Preview));
  assert.ok(phase10Preview.byteLength > 0);

  console.log(
    '[studio-visual:phase10] equivalent full-runtime image utility preview/codegen proof passed',
    JSON.stringify({
      bytes: phase10Preview.byteLength,
      sha256: digest(phase10Preview),
      operations: phase10Plan.operations
        .filter((operation) =>
          operation.kind === 'image-utility' || operation.kind === 'image-analysis',
        )
        .map((operation) => operation.kind + ':' + operation.method),
      generatedFile: phase10Generated.fileName,
    }),
  );


  const phase11Base = createVisualProject({
    id: 'project_phase11_runtime',
    name: 'Phase 11 Runtime',
    width: 64,
    height: 48,
    now: '2026-09-23T00:00:00.000Z',
  });
  const phase11Project = setPhase11Timeline(phase11Base, {
    ...defaultPhase11Timeline(phase11Base, 'gif-timeline-runtime'),
    mode: 'animate',
    width: 64,
    height: 48,
    delay: 10,
    quality: 10,
    repeat: 0,
    frames: [
      {
        id: 'gif-frame-runtime-a',
        backgroundColor: '#ff3366',
        duration: 10,
        repeat: 1,
      },
      {
        id: 'gif-frame-runtime-b',
        backgroundColor: '#3366ff',
        duration: 20,
        repeat: 1,
      },
    ],
  });

  const manualAnimationFrames = [
    { backgroundColor: '#ff3366', duration: 10, width: 64, height: 48 },
    { backgroundColor: '#3366ff', duration: 20, width: 64, height: 48 },
  ];
  const manualRendered = await painter.animate(
    manualAnimationFrames,
    10,
    64,
    48,
  );
  assert.ok(manualRendered?.length === 2);
  const manualGif = await painter.createGIF(
    manualRendered!.map((buffer, index) => ({
      buffer,
      duration: manualAnimationFrames[index]!.duration,
    })),
    {
      outputFormat: 'buffer',
      width: 64,
      height: 48,
      delay: 10,
      repeat: 0,
      quality: 10,
    },
  );
  assert.ok(manualGif instanceof Uint8Array);

  const phase11Generated = generateVisualProjectCode(phase11Project);
  const phase11Body = phase11Generated.source
    .replace(/^\/\* apexify-studio-v11:[^\n]+\*\/\n/, '')
    .replace(/^import \{ ApexPainter \} from 'apexify\.js';\n\n/, '');
  const executePhase11Generated = new AsyncFunction('ApexPainter', phase11Body);
  const phase11GeneratedBuffer = await executePhase11Generated(ApexPainter);
  assert.ok(phase11GeneratedBuffer instanceof Uint8Array);
  assert.equal(
    Buffer.from(phase11GeneratedBuffer).subarray(0, 3).toString('ascii'),
    'GIF',
  );
  assert.equal(digest(phase11GeneratedBuffer), digest(manualGif as Uint8Array));

  console.log(
    '[studio-visual:phase11] equivalent Linux GIF animation preview/codegen proof passed',
    JSON.stringify({
      bytes: phase11GeneratedBuffer.byteLength,
      sha256: digest(phase11GeneratedBuffer),
      frames: 2,
      operations: ['animate', 'createGIF'],
      generatedFile: phase11Generated.fileName,
    }),
  );
}

run().catch((error) => {
  console.error('[studio-visual] proof failed', error);
  process.exitCode = 1;
});
