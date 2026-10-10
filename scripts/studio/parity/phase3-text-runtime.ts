import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { ApexPainter } from 'apexify.js';

import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import {
  defaultTextNodeProps,
  textBatchGroupPropsRecord,
  textPropsRecord,
  visualTextBatchGroupProps,
  visualTextProps,
} from '../../../lib/studio/visual/text-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import type { VisualProject, VisualTextNodeProps } from '../../../lib/studio/visual/model';

const root = process.cwd();
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
) as { dependencies?: Record<string, string> };
const dependency = packageJson.dependencies?.['apexify.js'] ?? '';
const expectedPackageCommit = 'db96446ef51ede70febb03892d86b599483a4302';
assert.match(
  dependency,
  new RegExp(expectedPackageCommit + '$'),
  'Studio must execute the pinned Apexify.js package commit',
);

const packageMeta = JSON.parse(
  fs.readFileSync(
    path.join(root, 'node_modules', 'apexify.js', 'package.json'),
    'utf8',
  ),
) as { version?: string };

const digest = (buffer: Uint8Array) =>
  createHash('sha256').update(buffer).digest('hex');

const fontPath = path.join(
  root,
  'node_modules',
  'dejavu-fonts-ttf',
  'ttf',
  'DejaVuSans.ttf',
);
const boldFontPath = path.join(
  root,
  'node_modules',
  'dejavu-fonts-ttf',
  'ttf',
  'DejaVuSans-Bold.ttf',
);

function baseProject(name: string): VisualProject {
  return createVisualProject({
    id: 'phase3_' + name.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    name,
    width: 640,
    height: 420,
    now: '2026-10-10T00:00:00.000Z',
  });
}

function makeText(
  id: string,
  text: string,
  x: number,
  y: number,
  props: Partial<VisualTextNodeProps> = {},
) {
  const node = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps(text),
      font: {
        size: 42,
        family: 'ParityDejaVu',
        name: 'ParityDejaVu',
        path: fontPath,
      },
      layout: {
        lineHeight: 1.25,
        letterSpacing: 1,
        wordSpacing: 2,
        maxWidth: 420,
      },
      placement: {
        textAlign: 'left',
        textBaseline: 'top',
        rotation: 0,
      },
      fill: { color: '#e2e8f0', opacity: 1 },
      ...props,
    }),
    { id, name: id },
  );
  node.transform = {
    x,
    y,
    width: props.layout?.maxWidth ?? 420,
    height: props.layout?.maxHeight ?? 150,
    rotation: props.placement?.rotation ?? 0,
    opacity: props.fill?.opacity ?? 1,
    visible: true,
    locked: false,
  };
  return node;
}

function runtimeRelevantTransform(transform: VisualProject['document']['nodes'][string]['transform']) {
  if (!transform) return undefined;
  const {
    zIndex: _zIndex,
    visible: _visible,
    locked: _locked,
    ...runtimeRelevant
  } = transform;
  return runtimeRelevant;
}

function semanticTextProject(project: VisualProject) {
  const roots = project.document.rootNodeIds.map((id) => {
    const node = project.document.nodes[id]!;
    if (node.kind === 'group') {
      return {
        kind: node.kind,
        props: visualTextBatchGroupProps(node),
        children: (node.childIds ?? []).map((childId) => {
          const child = project.document.nodes[childId]!;
          return {
            kind: child.kind,
            props: visualTextProps(child),
            transform: runtimeRelevantTransform(child.transform),
          };
        }),
      };
    }
    return {
      kind: node.kind,
      props: node.kind === 'text' ? visualTextProps(node) : node.props,
      transform: runtimeRelevantTransform(node.transform),
    };
  });
  return {
    width: project.document.width,
    height: project.document.height,
    canvas: project.document.canvas ?? {},
    roots,
  };
}

function stripImport(source: string) {
  return source.replace(
    /^import\s*\{\s*ApexPainter\s*\}\s*from\s*['"]apexify\.js['"];?\s*/m,
    '',
  );
}

async function executeGenerated(project: VisualProject): Promise<Uint8Array> {
  const source = generateVisualProjectCode(project).source;
  const AsyncFunction = Object.getPrototypeOf(
    async function () {},
  ).constructor as new (...args: string[]) => (...values: unknown[]) => Promise<Uint8Array>;
  const run = new AsyncFunction('ApexPainter', stripImport(source));
  return run(ApexPainter);
}

async function proveProject(name: string, project: VisualProject) {
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, name + ': ' + JSON.stringify(validation.issues));

  const painter = new ApexPainter();
  const preview = await executeStudioOperationPlan(lowerVisualProject(project), {
    createCanvas: async (options, painterOpts) => {
      const result = await painter.createCanvas(options, painterOpts);
      return { buffer: result.buffer };
    },
    createText: async (properties, base, painterOpts) =>
      painter.createText(properties as never, Buffer.from(base), painterOpts),
  });
  const generated = await executeGenerated(project);
  assert.equal(
    digest(preview),
    digest(generated),
    name + ': operation-plan and generated-source output must be byte-equivalent',
  );

  const source = generateVisualProjectCode(project).source;
  const reconciled = reconcileVisualProjectFromCode(baseProject(name), source);
  if (!reconciled.ok) {
    throw new Error(name + ': canonical source failed reverse sync: ' + reconciled.error);
  }
  assert.equal(
    generateVisualProjectCode(reconciled.project).source,
    source,
    name + ': canonical regeneration is not stable',
  );
  const expectedSemantic = semanticTextProject(project);
  const actualSemantic = semanticTextProject(reconciled.project);
  assert.equal(
    actualSemantic.roots.length,
    expectedSemantic.roots.length,
    name + ': Visual -> Code -> Visual root count changed',
  );
  assert.deepEqual(
    actualSemantic.roots.map((root) =>
      root.kind === 'group'
        ? {
            kind: root.kind,
            texts: root.children.map((child) =>
              child.kind === 'text' ? child.props.text : null,
            ),
          }
        : {
            kind: root.kind,
            text:
              root.kind === 'text'
                ? (root.props as VisualTextNodeProps).text
                : null,
          },
    ),
    expectedSemantic.roots.map((root) =>
      root.kind === 'group'
        ? {
            kind: root.kind,
            texts: root.children.map((child) =>
              child.kind === 'text' ? child.props.text : null,
            ),
          }
        : {
            kind: root.kind,
            text:
              root.kind === 'text'
                ? (root.props as VisualTextNodeProps).text
                : null,
          },
    ),
    name + ': Visual -> Code -> Visual text membership changed',
  );

  return { name, bytes: preview.byteLength, sha256: digest(preview) };
}

async function main() {
  const single = baseProject('single-modern-text');
  single.document.canvas = { colorBg: '#0b1220' };
  const singleNode = makeText('text_modern', 'Apexify\nTypography', 58, 56, {
    font: {
      size: 44,
      family: 'ParityDejaVu',
      name: 'ParityDejaVu',
      path: boldFontPath,
    },
    decorations: {
      bold: true,
      italic: false,
      underline: {
        color: '#38bdf8',
        width: 2,
        gradient: {
          type: 'linear',
          startX: 0,
          startY: 0,
          endX: 220,
          endY: 0,
          colors: [
            { stop: 0, color: '#38bdf8' },
            { stop: 1, color: '#a78bfa' },
          ],
        },
      },
    },
    fill: {
      color: '#f8fafc',
      opacity: 0.95,
      gradient: {
        type: 'linear',
        startX: 0,
        startY: 0,
        endX: 300,
        endY: 0,
        colors: [
          { stop: 0, color: '#22d3ee' },
          { stop: 1, color: '#8b5cf6' },
        ],
      },
    },
    stroke: {
      color: '#0f172a',
      width: 1.5,
      opacity: 0.8,
      style: 'solid',
    },
    effects: {
      highlight: { color: '#f59e0b', opacity: 0.15 },
      glow: { color: '#22d3ee', intensity: 6, opacity: 0.35 },
      shadow: {
        color: '#000000',
        offsetX: 3,
        offsetY: 5,
        blur: 8,
        opacity: 0.55,
      },
    },
    layout: {
      lineHeight: 1.2,
      letterSpacing: 1.25,
      wordSpacing: 2,
      maxWidth: 420,
      maxHeight: 140,
    },
    placement: {
      textAlign: 'left',
      textBaseline: 'top',
      rotation: 4,
    },
    includeCharMetrics: true,
    measurementCanvas: { width: 640, height: 420 },
  });
  single.document.nodes[singleNode.id] = singleNode;
  single.document.rootNodeIds = [singleNode.id];

  const batch = baseProject('text-array');
  batch.document.canvas = { colorBg: '#111827' };
  const first = makeText('text_first', 'First', 60, 70, {
    fill: { color: '#38bdf8', opacity: 1 },
  });
  const second = makeText('text_second', 'Second', 88, 155, {
    font: {
      size: 38,
      family: 'ParityDejaVu',
      name: 'ParityDejaVu',
      path: boldFontPath,
    },
    decorations: { bold: true, italic: true },
    fill: { color: '#f472b6', opacity: 0.9 },
  });
  first.parentId = 'text_batch';
  second.parentId = 'text_batch';
  const group = createVisualNode(
    'group',
    textBatchGroupPropsRecord({ textBatch: true }),
    { id: 'text_batch', name: 'Text batch (2)' },
  );
  group.childIds = [first.id, second.id];
  batch.document.nodes[group.id] = group;
  batch.document.nodes[first.id] = first;
  batch.document.nodes[second.id] = second;
  batch.document.rootNodeIds = [group.id];

  const curve = baseProject('curved-text');
  curve.document.canvas = { colorBg: '#020617' };
  const curveNode = makeText('text_curve', 'CURVED TEXT', 115, 80, {
    font: {
      size: 30,
      family: 'ParityDejaVu',
      name: 'ParityDejaVu',
      path: boldFontPath,
    },
    decorations: { bold: true },
    fill: { color: '#f8fafc', opacity: 1 },
    textOnCurve: {
      sweepAngle: 220,
      radius: 120,
      up: true,
      layoutMode: 'clamp',
      baselineOffset: 2,
      startAngleDeg: -20,
    },
  });
  curve.document.nodes[curveNode.id] = curveNode;
  curve.document.rootNodeIds = [curveNode.id];

  const projectProofs = [];
  for (const fixture of [
    ['single-modern-text', single],
    ['text-array', batch],
    ['curved-text', curve],
  ] as const) {
    projectProofs.push(await proveProject(fixture[0], fixture[1]));
  }

  const painter = new ApexPainter();
  const metricProps = {
    text: 'Hello longwordwithoutbreak\nMetrics',
    x: 12,
    y: 18,
    font: {
      size: 32,
      family: 'ParityDejaVu',
      name: 'ParityDejaVu',
      path: fontPath,
    },
    decorations: { bold: true },
    layout: {
      lineHeight: 1.3,
      letterSpacing: 1,
      wordSpacing: 2,
      maxWidth: 190,
      maxHeight: 180,
    },
    placement: { textAlign: 'left', textBaseline: 'top' },
    fill: { color: '#ffffff', opacity: 1 },
    includeCharMetrics: true,
    measurementCanvas: { width: 640, height: 420 },
  } as const;
  const metrics = await painter.measureText(metricProps as never);
  for (const key of [
    'width',
    'height',
    'lineHeight',
    'baseline',
    'top',
    'bottom',
    'centerX',
    'centerY',
    'totalHeight',
    'lineCount',
    'lines',
    'charWidths',
    'charPositions',
  ]) {
    assert.ok(key in metrics, 'measureText result missing ' + key);
  }
  assert.ok((metrics.lineCount ?? metrics.lines?.length ?? 0) >= 2);
  assert.equal(metrics.charWidths?.length, Array.from(metricProps.text).length);
  assert.equal(metrics.charPositions?.length, metrics.charWidths?.length);
  assert.ok(metrics.lines?.every((line) => typeof line.text === 'string'));
  assert.ok(metrics.lines?.every((line) => typeof line.metrics.width === 'number'));

  const assets = (painter as unknown as {
    assets?: { loadValue(name: string, value: unknown): unknown };
  }).assets;
  assert.ok(assets, 'ApexPainter assets facade is required for resolveAssetRefs proof');
  assets!.loadValue('phase3Text', metricProps);
  const resolvedMetrics = await painter.measureText(
    '$phase3Text' as never,
    { resolveAssetRefs: true },
  );
  assert.equal(resolvedMetrics.width, metrics.width);

  const canvas = await painter.createCanvas({ width: 640, height: 420, colorBg: '#020617' });
  const resolvedBuffer = await painter.createText(
    '$phase3Text' as never,
    canvas.buffer,
    { resolveAssetRefs: true },
  );
  assert.ok(resolvedBuffer.byteLength > 0);

  const outDir = path.join(root, 'generated', 'studio', 'runtime-parity', 'phases');
  fs.mkdirSync(outDir, { recursive: true });
  const report = {
    schemaVersion: 1,
    phase: 'STUDIO-PARITY-3',
    packageDependency: dependency,
    packageVersion: packageMeta.version ?? null,
    packageCommit: expectedPackageCommit,
    inventoryRuntimeCommit: JSON.parse(
      fs.readFileSync(
        path.join(root, 'scripts', 'studio', 'parity', 'runtime-source.json'),
        'utf8',
      ),
    ).commit,
    proofs: {
      projectProofs,
      measureText: {
        width: metrics.width,
        height: metrics.height,
        lineCount: metrics.lineCount,
        lineCountObserved: metrics.lines?.length ?? 0,
        charMetrics: metrics.charWidths?.length ?? 0,
        painterOptsResolveAssetRefs: true,
      },
      createTextPainterOpts: {
        resolveAssetRefs: true,
        bytes: resolvedBuffer.byteLength,
        sha256: digest(resolvedBuffer),
      },
    },
  };
  fs.writeFileSync(
    path.join(outDir, 'phase-3-text-runtime.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log('[studio-parity-3] pinned package runtime proof green');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
