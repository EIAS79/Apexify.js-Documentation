import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ApexPainter } from 'apexify.js';
import { createPhase2ProofProject } from '../../../lib/studio/visual/sample';
import { createVisualProject } from '../../../lib/studio/visual/project';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';

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
}

run().catch((error) => {
  console.error('[studio-visual:phase2] proof failed', error);
  process.exitCode = 1;
});
