import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createVisualProject } from '../../../lib/studio/visual/project';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import type { VisualCanvasConfig, VisualProject } from '../../../lib/studio/visual/model';

const root = process.cwd();
const runtimeRoot = path.resolve(
  process.env.APEXIFY_RUNTIME_ROOT ?? path.join(root, '..', 'Apexify.js'),
);
const pin = JSON.parse(
  fs.readFileSync(path.join(root, 'scripts', 'studio', 'parity', 'runtime-source.json'), 'utf8'),
) as { commit: string };

if (process.env.APEXIFY_RUNTIME_COMMIT && process.env.APEXIFY_RUNTIME_COMMIT !== pin.commit) {
  throw new Error(
    'STUDIO-PARITY-1 runtime commit mismatch: expected ' +
      pin.commit +
      ', got ' +
      process.env.APEXIFY_RUNTIME_COMMIT,
  );
}

const runtimeEntry = path.join(runtimeRoot, 'lib-next', 'index.ts');
if (!fs.existsSync(runtimeEntry)) {
  throw new Error(
    'Pinned Apexify runtime checkout missing at ' +
      runtimeEntry +
      '. Set APEXIFY_RUNTIME_ROOT to EIAS79/Apexify.js@' +
      pin.commit +
      '.',
  );
}

async function main() {
const runtime = (await import(pathToFileURL(runtimeEntry).href)) as {
  ApexPainter: new () => {
    assets: {
      loadValue(name: string, value: unknown): unknown;
    };
    createCanvas(
      options: Record<string, unknown>,
      painterOpts?: { resolveAssetRefs?: boolean },
    ): Promise<{ buffer: Uint8Array }>;
  };
};
const { ApexPainter } = runtime;

const digest = (buffer: Uint8Array) =>
  createHash('sha256').update(buffer).digest('hex');

function semanticCanvas(project: VisualProject) {
  return {
    width: project.document.width,
    height: project.document.height,
    canvas: project.document.canvas ?? {},
    canvasPainterOpts: project.document.canvasPainterOpts ?? {},
  };
}

function stripApexifyImport(source: string): string {
  return source.replace(
    /^import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"];?\s*/m,
    '',
  );
}

async function executeGenerated(
  painterCtor: typeof ApexPainter,
  project: VisualProject,
): Promise<Uint8Array> {
  const generated = generateVisualProjectCode(project);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
    ...args: string[]
  ) => (...values: unknown[]) => Promise<Uint8Array>;
  const run = new AsyncFunction('ApexPainter', stripApexifyImport(generated.source));
  return run(painterCtor);
}

async function proveFixture(
  painter: InstanceType<typeof ApexPainter>,
  name: string,
  project: VisualProject,
  inheritedDimensions?: (source: string) => { width: number; height: number } | null,
) {
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, name + ': ' + JSON.stringify(validation.issues));

  const preview = await executeStudioOperationPlan(lowerVisualProject(project), {
    createCanvas: async (options, painterOpts) => {
      const result = await painter.createCanvas(
        options as unknown as Record<string, unknown>,
        painterOpts,
      );
      return { buffer: result.buffer };
    },
  });

  const generated = await executeGenerated(ApexPainter, project);
  assert.equal(
    digest(generated),
    digest(preview),
    name + ': generated code and preview plan must be byte-equivalent',
  );

  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    width: 1,
    height: 1,
    now: project.createdAt,
    id: project.id,
    name: project.name,
  });
  const reconciled = reconcileVisualProjectFromCode(
    empty,
    source,
    inheritedDimensions,
  );
  if (!reconciled.ok) {
    throw new Error(
      name + ': generated source must reverse-sync: ' + reconciled.error,
    );
  }

  assert.deepEqual(
    semanticCanvas(reconciled.project),
    semanticCanvas(project),
    name + ': Visual -> Code -> Visual must preserve canvas semantics',
  );
  assert.equal(
    generateVisualProjectCode(reconciled.project).source,
    source,
    name + ': canonical regeneration must be stable',
  );

  return {
    name,
    bytes: preview.byteLength,
    sha256: digest(preview),
  };
}

function canvasProject(
  name: string,
  width: number,
  height: number,
  canvas: VisualCanvasConfig,
): VisualProject {
  const project = createVisualProject({
    id: 'parity1_' + name.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    name,
    width,
    height,
    now: '2026-10-04T00:00:00.000Z',
  });
  project.document.canvas = canvas;
  return project;
}

const painter = new ApexPainter();

const sourceSeed = await painter.createCanvas({
  width: 24,
  height: 16,
  colorBg: '#3b82f6',
});
const sourceDataUrl =
  'data:image/png;base64,' + Buffer.from(sourceSeed.buffer).toString('base64');

const fixtures: Array<{
  name: string;
  project: VisualProject;
  inherited?: (source: string) => { width: number; height: number } | null;
}> = [
  {
    name: 'solid-transform-stroke-shadow',
    project: canvasProject('Canvas Solid', 320, 180, {
      colorBg: '#07172d',
      x: 2,
      y: 3,
      opacity: 0.9,
      blur: 1,
      rotation: 2,
      borderRadius: 16,
      borderPosition: 'all',
      blendMode: 'source-over',
      zoom: { scale: 1.05, centerX: 160, centerY: 90 },
      stroke: {
        color: '#93c5fd',
        width: 2,
        position: 0,
        blur: 0,
        opacity: 0.8,
        borderRadius: 16,
        borderPosition: 'all',
        roundedCorners: 'all',
        style: 'dashed',
      },
      shadow: {
        color: '#000000',
        offsetX: 0,
        offsetY: 8,
        blur: 12,
        opacity: 0.3,
        borderRadius: 16,
        roundedCorners: 'all',
      },
    }),
  },
  {
    name: 'gradient-pattern-noise-stack',
    project: canvasProject('Canvas Gradient Stack', 360, 220, {
      gradientBg: {
        type: 'linear',
        startX: 0,
        startY: 0,
        endX: 360,
        endY: 0,
        rotate: 5,
        pivotX: 180,
        pivotY: 110,
        repeat: 'no-repeat',
        colors: [
          { stop: 0, color: '#0f172a' },
          { stop: 0.5, color: '#1d4ed8' },
          { stop: 1, color: '#7c3aed' },
        ],
      },
      bgLayers: [
        {
          type: 'gradient',
          value: {
            type: 'radial',
            startX: 180,
            startY: 110,
            startRadius: 8,
            endX: 180,
            endY: 110,
            endRadius: 160,
            colors: [
              { stop: 0, color: '#ffffff' },
              { stop: 1, color: '#000000' },
            ],
          },
          opacity: 0.12,
          blendMode: 'screen',
        },
        {
          type: 'presetPattern',
          pattern: {
            type: 'dots',
            color: '#ffffff',
            opacity: 0.3,
            size: 4,
            spacing: 18,
          },
          opacity: 0.5,
          blendMode: 'overlay',
        },
        { type: 'noise', intensity: 0.03, blendMode: 'soft-light' },
      ],
      patternBg: {
        type: 'grid',
        color: '#93c5fd',
        secondaryColor: '#a78bfa',
        opacity: 0.22,
        size: 2,
        spacing: 24,
        rotation: 2,
        scale: 1,
        offsetX: 3,
        offsetY: 4,
      },
      noiseBg: { intensity: 0.02 },
    }),
  },
  {
    name: 'image-backed-layer-variants',
    project: canvasProject('Canvas Image Stack', 240, 160, {
      transparentBase: true,
      bgLayers: [
        { type: 'color', value: '#0b1730', opacity: 1 },
        {
          type: 'image',
          source: sourceDataUrl,
          fit: 'contain',
          align: 'top-left',
          opacity: 0.8,
          blendMode: 'source-over',
        },
        {
          type: 'pattern',
          source: sourceDataUrl,
          repeat: 'repeat-x',
          opacity: 0.2,
          blendMode: 'screen',
        },
        {
          type: 'presetPattern',
          pattern: {
            type: 'stripes',
            color: '#ffffff',
            secondaryColor: '#3b82f6',
            size: 6,
            spacing: 8,
            opacity: 0.3,
          },
          opacity: 0.4,
          blendMode: 'overlay',
        },
      ],
    }),
  },
  {
    name: 'custom-background-inherit-filters',
    project: canvasProject('Canvas Inherit', 24, 16, {
      customBg: {
        source: sourceDataUrl,
        inherit: true,
        fit: 'cover',
        align: 'bottom-right',
        opacity: 0.75,
        filters: [
          { type: 'grayscale' },
          { type: 'brightness', value: 1.1 },
        ],
      },
    }),
    inherited: (source) =>
      source === sourceDataUrl ? { width: 24, height: 16 } : null,
  },
  {
    name: 'painter-options-resolve-asset-refs',
    project: (() => {
      const project = canvasProject('Canvas Painter Options', 96, 64, {
        colorBg: '#1d4ed8',
      });
      project.document.canvasPainterOpts = { resolveAssetRefs: true };
      return project;
    })(),
  },
];

const proofs = [];
for (const fixture of fixtures) {
  proofs.push(
    await proveFixture(
      painter,
      fixture.name,
      fixture.project,
      fixture.inherited,
    ),
  );
}

const assetPainter = new ApexPainter();
assetPainter.assets.loadValue('parity1CanvasColor', '#6d28d9');
const resolvedAssetCanvas = await assetPainter.createCanvas(
  { width: 72, height: 48, colorBg: '$parity1CanvasColor' },
  { resolveAssetRefs: true },
);
const directAssetCanvas = await assetPainter.createCanvas({
  width: 72,
  height: 48,
  colorBg: '#6d28d9',
});
assert.equal(
  digest(resolvedAssetCanvas.buffer),
  digest(directAssetCanvas.buffer),
  'resolveAssetRefs=true must resolve named Canvas values through painter.assets',
);

const omitted = reconcileVisualProjectFromCode(
  createVisualProject({
    width: 8,
    height: 8,
    now: '2026-10-04T00:00:00.000Z',
  }),
  `
    import { ApexPainter } from 'apexify.js';
    const painter = new ApexPainter();
    const canvas = await painter.createCanvas({ colorBg: '#112233' });
    return canvas.buffer;
  `,
);
if (!omitted.ok) {
  throw new Error('Omitted-dimension reconciliation failed: ' + omitted.error);
}
assert.equal(omitted.project.document.width, 500);
assert.equal(omitted.project.document.height, 500);

const edgeCases: Array<{
  name: string;
  canvas: VisualCanvasConfig;
}> = [
  {
    name: 'negative-stroke-width',
    canvas: { colorBg: '#112233', stroke: { color: '#ffffff', width: -1 } },
  },
  {
    name: 'stroke-opacity-above-one',
    canvas: { colorBg: '#112233', stroke: { color: '#ffffff', opacity: 2 } },
  },
  {
    name: 'negative-shadow-blur',
    canvas: { colorBg: '#112233', shadow: { color: '#000000', blur: -1 } },
  },
  {
    name: 'shadow-opacity-above-one',
    canvas: { colorBg: '#112233', shadow: { color: '#000000', opacity: 2 } },
  },
];

const edgeResults = [];
for (const edge of edgeCases) {
  const visual = canvasProject('Canvas Edge ' + edge.name, 64, 64, edge.canvas);
  const studioAccepts = validateVisualProject(visual).ok;
  let runtimeAccepts = false;
  let runtimeError: string | null = null;
  try {
    await painter.createCanvas({ width: 64, height: 64, ...edge.canvas });
    runtimeAccepts = true;
  } catch (error) {
    runtimeError = error instanceof Error ? error.message : String(error);
  }
  edgeResults.push({
    name: edge.name,
    studioAccepts,
    runtimeAccepts,
    runtimeError,
  });
}

console.log(
  '[studio-parity-1] pinned canvas runtime proof',
  JSON.stringify(
    {
      runtimeCommit: pin.commit,
      fixtures: proofs,
      edgeResults,
    },
    null,
    2,
  ),
);

// Keep ambiguous stroke/shadow range behavior visible. The audit script consumes
// this result before Phase 1 can be marked complete.
if (edgeResults.some((item) => item.studioAccepts !== item.runtimeAccepts)) {
  process.exitCode = 2;
}


}

main().catch((error) => {
  console.error('[studio-parity-1] canvas runtime proof failed');
  console.error(error);
  process.exitCode = 1;
});
