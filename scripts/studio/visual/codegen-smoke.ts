import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ApexPainter } from 'apexify.js';
import { createPhase2ProofProject } from '../../../lib/studio/visual/sample';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';

async function run() {
  const project = createPhase2ProofProject();
  const plan = lowerVisualProject(project);
  const painter = new ApexPainter();

  const previewBuffer = await executeStudioOperationPlan(plan, {
    createCanvas: async (options) => {
      const canvas = await painter.createCanvas(options);
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
}

run().catch((error) => {
  console.error('[studio-visual:phase2] proof failed', error);
  process.exitCode = 1;
});
