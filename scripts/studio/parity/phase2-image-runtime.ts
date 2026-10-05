import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { groupNodes } from '../../../lib/studio/visual/editor';
import {
  imageBatchGroupPropsRecord,
  imagePropsRecord,
  visualImageProps,
} from '../../../lib/studio/visual/image-contract';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import type {
  VisualImageNodeProps,
  VisualNode,
  VisualProject,
} from '../../../lib/studio/visual/model';

const root = process.cwd();
const runtimeRoot = path.resolve(
  process.env.APEXIFY_RUNTIME_ROOT ?? path.join(root, '..', 'Apexify.js'),
);
const pin = JSON.parse(
  fs.readFileSync(
    path.join(root, 'scripts', 'studio', 'parity', 'runtime-source.json'),
    'utf8',
  ),
) as { commit: string };

if (
  process.env.APEXIFY_RUNTIME_COMMIT &&
  process.env.APEXIFY_RUNTIME_COMMIT !== pin.commit
) {
  throw new Error(
    'STUDIO-PARITY-2 runtime commit mismatch: expected ' +
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

const runtime = (await import(pathToFileURL(runtimeEntry).href)) as {
  ApexPainter: new () => {
    assets: {
      loadValue(name: string, value: unknown): unknown;
    };
    createCanvas(
      options: Record<string, unknown>,
      painterOpts?: { resolveAssetRefs?: boolean },
    ): Promise<{ buffer: Uint8Array }>;
    createImage(
      images: Record<string, unknown> | Array<Record<string, unknown>>,
      canvasBuffer: Uint8Array,
      options?: Record<string, unknown>,
      painterOpts?: { resolveAssetRefs?: boolean },
    ): Promise<Uint8Array>;
  };
};
const { ApexPainter } = runtime;

const digest = (buffer: Uint8Array) =>
  createHash('sha256').update(buffer).digest('hex');

function stripApexifyImport(source: string): string {
  return source.replace(
    /^import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"];?\s*/m,
    '',
  );
}

async function executeGenerated(project: VisualProject): Promise<Uint8Array> {
  const generated = generateVisualProjectCode(project);
  const AsyncFunction = Object.getPrototypeOf(
    async function () {},
  ).constructor as new (...args: string[]) => (
    ...values: unknown[]
  ) => Promise<Uint8Array>;
  const run = new AsyncFunction(
    'ApexPainter',
    stripApexifyImport(generated.source),
  );
  return run(ApexPainter);
}

function semanticImageProject(project: VisualProject) {
  const roots = project.document.rootNodeIds.map((id) => {
    const node = project.document.nodes[id]!;
    if (node.kind === 'group') {
      return {
        kind: node.kind,
        childCount: node.childIds?.length ?? 0,
        props: node.props,
        children: (node.childIds ?? []).map((childId) => {
          const child = project.document.nodes[childId]!;
          return {
            kind: child.kind,
            transform: child.transform,
            props: child.props,
          };
        }),
      };
    }
    return {
      kind: node.kind,
      transform: node.transform,
      props: node.props,
    };
  });
  return {
    width: project.document.width,
    height: project.document.height,
    canvas: project.document.canvas ?? {},
    roots,
  };
}

function baseProject(name: string): VisualProject {
  return createVisualProject({
    id: 'phase2_' + name.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    name,
    width: 320,
    height: 220,
    now: '2026-10-05T00:00:00.000Z',
  });
}

function makeImage(
  id: string,
  source: string,
  props: Partial<VisualImageNodeProps> = {},
  x = 20,
  y = 20,
  width = 120,
  height = 90,
): VisualNode {
  const node = createVisualNode(
    'image',
    imagePropsRecord({
      source,
      fit: 'cover',
      align: 'center',
      ...props,
    }),
    { id, name: id },
  );
  node.transform = {
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
  return node;
}

async function proveProject(
  painter: InstanceType<typeof ApexPainter>,
  name: string,
  project: VisualProject,
) {
  const validation = validateVisualProject(project);
  assert.equal(
    validation.ok,
    true,
    name + ': ' + JSON.stringify(validation.issues),
  );

  const preview = await executeStudioOperationPlan(lowerVisualProject(project), {
    createCanvas: async (options, painterOpts) => {
      const result = await painter.createCanvas(
        options as unknown as Record<string, unknown>,
        painterOpts,
      );
      return { buffer: result.buffer };
    },
    createImage: async (properties, base, options, painterOpts) =>
      painter.createImage(
        properties as unknown as
          | Record<string, unknown>
          | Array<Record<string, unknown>>,
        base,
        options as unknown as Record<string, unknown> | undefined,
        painterOpts,
      ),
  });

  const generated = await executeGenerated(project);
  assert.equal(
    digest(preview),
    digest(generated),
    name + ': Studio preview plan and generated source must be byte-equivalent',
  );

  const source = generateVisualProjectCode(project).source;
  const reconciled = reconcileVisualProjectFromCode(baseProject(name), source);
  if (!reconciled.ok) {
    throw new Error(
      name + ': canonical source must reverse-sync: ' + reconciled.error,
    );
  }

  assert.deepEqual(
    semanticImageProject(reconciled.project),
    semanticImageProject(project),
    name + ': Visual -> Code -> Visual must preserve image semantics',
  );
  assert.equal(
    generateVisualProjectCode(reconciled.project).source,
    source,
    name + ': canonical image regeneration must be stable',
  );

  return {
    name,
    bytes: preview.byteLength,
    sha256: digest(preview),
  };
}

const painter = new ApexPainter();
const seed = await painter.createCanvas({
  width: 96,
  height: 72,
  colorBg: '#3b82f6',
});
const sourceDataUrl =
  'data:image/png;base64,' + Buffer.from(seed.buffer).toString('base64');

const maskSeed = await painter.createCanvas({
  width: 96,
  height: 72,
  colorBg: '#ffffff',
});
const maskDataUrl =
  'data:image/png;base64,' + Buffer.from(maskSeed.buffer).toString('base64');

const fixtures: Array<{ name: string; project: VisualProject }> = [];

{
  const project = baseProject('single-complete-image');
  const node = makeImage(
    'image_complete',
    sourceDataUrl,
    {
      fit: 'contain',
      align: 'bottom-right',
      blur: 1,
      borderRadius: 8,
      blendMode: 'source-over',
      filters: [
        { type: 'brightness', value: 1.05 },
        { type: 'contrast', value: 1.1 },
      ],
      filterOrder: 'post',
      filterIntensity: 1,
      mask: { source: maskDataUrl, mode: 'alpha' },
      clipPath: [
        { x: 20, y: 20 },
        { x: 140, y: 20 },
        { x: 140, y: 110 },
        { x: 20, y: 110 },
      ],
      distortion: {
        type: 'twirl',
        centerX: 60,
        centerY: 45,
        radius: 40,
        angle: 12,
        interpolation: 'bilinear',
        edgeMode: 'clamp',
      },
      effects: {
        vignette: { intensity: 0.2, size: 0.7 },
        filmGrain: { intensity: 0.03 },
      },
      stroke: {
        color: '#ffffff',
        width: 2,
        style: 'solid',
      },
      shadow: {
        color: '#000000',
        offsetX: 2,
        offsetY: 4,
        blur: 6,
        opacity: 0.4,
      },
      boxBackground: { color: '#0f172a' },
    },
    24,
    26,
    128,
    92,
  );
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  fixtures.push({ name: 'single-complete-image', project });
}

{
  const project = baseProject('warp-handles');
  const node = makeImage('image_warp', sourceDataUrl, {
    distortion: {
      type: 'warp',
      controlPoints: [
        {
          from: { x: 48, y: 36 },
          to: { x: 55, y: 32 },
          radius: 24,
          strength: 0.8,
          falloff: 'smooth',
        },
      ],
      interpolation: 'bicubic',
      edgeMode: 'mirror',
    },
  });
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  fixtures.push({ name: 'warp-handles', project });
}

{
  const project = baseProject('wave-distortion');
  const node = makeImage('image_wave', sourceDataUrl, {
    distortion: {
      type: 'wave',
      amplitudeX: 2,
      amplitudeY: 2,
      wavelengthX: 40,
      wavelengthY: 32,
      phaseX: 10,
      phaseY: 20,
      interpolation: 'bilinear',
      edgeMode: 'wrap',
    },
  });
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  fixtures.push({ name: 'wave-distortion', project });
}

{
  const project = baseProject('mesh-warp');
  const node = makeImage('image_mesh', sourceDataUrl, {
    meshWarp: {
      gridX: 2,
      gridY: 2,
      interpolation: 'bilinear',
      edgeMode: 'transparent',
      controlPoints: [
        [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 120, y: 0 }],
        [{ x: 0, y: 45 }, { x: 64, y: 42 }, { x: 120, y: 45 }],
        [{ x: 0, y: 90 }, { x: 60, y: 90 }, { x: 120, y: 90 }],
      ],
    },
  });
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds = [node.id];
  fixtures.push({ name: 'mesh-warp', project });
}

{
  let project = baseProject('image-batch-group');
  const first = makeImage('image_batch_a', sourceDataUrl, {
    filters: [{ type: 'grayscale' }],
  }, 20, 30, 110, 80);
  const second = makeImage(
    'image_batch_b',
    sourceDataUrl,
    {},
    145,
    58,
    110,
    80,
  );
  second.transform = {
    ...second.transform,
    opacity: 0.85,
  };
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [first.id, second.id];
  project = groupNodes(
    project,
    [first.id, second.id],
    'image_batch_group',
    'Image batch',
  );
  project.document.nodes.image_batch_group.props =
    imageBatchGroupPropsRecord({
      imageBatch: true,
      createOptions: {
        isGrouped: true,
        groupTransform: {
          rotation: 4,
          scaleX: 1,
          scaleY: 1,
          opacity: 0.9,
          blendMode: 'source-over',
          filters: [{ type: 'brightness', value: 1.02 }],
          filterOrder: 'post',
          effects: {
            filmGrain: { intensity: 0.02 },
          },
        },
      },
    });
  fixtures.push({ name: 'image-batch-group', project });
}

const proofs = [];
for (const fixture of fixtures) {
  proofs.push(await proveProject(painter, fixture.name, fixture.project));
}

const assetPainter = new ApexPainter();
assetPainter.assets.loadValue('phase2ImageSource', sourceDataUrl);
const assetBase = await assetPainter.createCanvas({
  width: 180,
  height: 120,
  colorBg: '#020617',
});
const resolved = await assetPainter.createImage(
  {
    source: '$phase2ImageSource',
    x: 10,
    y: 10,
    width: 96,
    height: 72,
  },
  assetBase.buffer,
  undefined,
  { resolveAssetRefs: true },
);
const direct = await assetPainter.createImage(
  {
    source: sourceDataUrl,
    x: 10,
    y: 10,
    width: 96,
    height: 72,
  },
  assetBase.buffer,
);
assert.equal(
  digest(resolved),
  digest(direct),
  'createImage painterOpts.resolveAssetRefs must resolve named image sources',
);

console.log(
  '[studio-parity-2] pinned createImage runtime proof',
  JSON.stringify(
    {
      runtimeCommit: pin.commit,
      fixtures: proofs,
      assetRefSha256: digest(resolved),
    },
    null,
    2,
  ),
);
