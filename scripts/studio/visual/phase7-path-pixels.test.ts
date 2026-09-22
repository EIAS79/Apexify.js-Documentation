import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import {
  defaultPathNodeProps,
  operationRecord,
  pathPropsRecord,
  visualPathProps,
} from '../../../lib/studio/visual/path-pixel-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { executeStudioOperationPlan } from '../../../lib/studio/visual/compiler/execute';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

function phase7Project() {
  const project = createVisualProject({
    id: 'project_phase7',
    name: 'Paths Pixels Detection Proof',
    width: 800,
    height: 520,
    now: '2026-09-22T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };

  const pathProps = defaultPathNodeProps('path');
  pathProps.commands = [
    { type: 'moveTo', x: 10, y: 100 },
    { type: 'bezierCurveTo', cp1x: 60, cp1y: 0, cp2x: 170, cp2y: 150, x: 230, y: 40 },
    { type: 'roundedRect', x: 80, y: 45, width: 80, height: 50, radius: { tl: 10, tr: 5, br: 15, bl: 2 } },
    { type: 'arrow', x: 30, y: 110, length: 90, angle: 90, headAngle: 35 },
  ];
  pathProps.viewport = { width: 260, height: 150 };
  pathProps.draw = {
    stroke: {
      color: '#7dd3fc',
      width: 5,
      lineCap: 'round',
      lineJoin: 'round',
      style: 'dashed',
      dashOffset: 2,
    },
    fill: { color: '#2563eb', opacity: 0.25, rule: 'evenodd' },
    shadow: { color: 'rgba(0,0,0,.4)', blur: 8, offsetX: 2, offsetY: 4 },
  };

  const path = createVisualNode('path', pathPropsRecord(pathProps), {
    id: 'path_primary',
    name: 'Primary Path',
  });
  path.transform = {
    x: 70,
    y: 80,
    width: 312,
    height: 165,
    rotation: 12,
    opacity: 0.9,
    visible: true,
    locked: false,
    zIndex: 0,
  };

  const connectorProps = defaultPathNodeProps('connector');
  connectorProps.connector = {
    startCoordinates: { x: 0, y: 20 },
    endCoordinates: { x: 220, y: 80 },
    arrow: { start: true, end: true, size: 14, style: 'outline', color: '#f8fafc' },
    markers: [{ position: 0.5, shape: 'diamond', size: 9, color: '#22d3ee' }],
    lineStyle: {
      width: 4,
      color: '#a78bfa',
      lineCap: 'round',
      lineJoin: 'round',
      lineDash: { dashArray: [10, 6], offset: 1 },
    },
  };
  const connector = createVisualNode(
    'path',
    pathPropsRecord(connectorProps),
    { id: 'path_connector', name: 'Connector' },
  );
  connector.transform = {
    x: 430,
    y: 90,
    width: 242,
    height: 110,
    rotation: 30,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
  };

  const freehandProps = defaultPathNodeProps('freehand');
  freehandProps.commands = [
    { type: 'moveTo', x: 6, y: 30 },
    { type: 'lineTo', x: 35, y: 12 },
    { type: 'lineTo', x: 72, y: 48 },
    { type: 'lineTo', x: 110, y: 18 },
    { type: 'lineTo', x: 156, y: 44 },
  ];
  freehandProps.viewport = { width: 165, height: 60 };
  const freehand = createVisualNode(
    'freehand',
    pathPropsRecord(freehandProps),
    { id: 'freehand_signature', name: 'Doodle' },
  );
  freehand.transform = {
    x: 120,
    y: 330,
    width: 165,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 2,
  };

  project.document.nodes[path.id] = path;
  project.document.nodes[connector.id] = connector;
  project.document.nodes[freehand.id] = freehand;
  project.document.rootNodeIds = [path.id, connector.id, freehand.id];

  project.operations.push(
    operationRecord(
      'pixel-operation',
      { type: 'manipulate', filter: 'invert', intensity: 0.4, region: { x: 0, y: 0, width: 400, height: 260 } },
      { id: 'operation_pixels', name: 'Invert pixels' },
    ),
    operationRecord(
      'pixel-operation',
      { type: 'setColor', x: 20, y: 24, color: { r: 255, g: 64, b: 32, a: 255 } },
      { id: 'operation_set_pixel', name: 'Set pixel' },
    ),
    operationRecord(
      'detection-operation',
      { type: 'pixelColor', x: 20, y: 24, resultName: 'pixelColor' },
      { id: 'operation_probe', name: 'Pixel probe' },
    ),
    operationRecord(
      'detection-operation',
      {
        type: 'detectPath',
        pathNodeId: path.id,
        x: 120,
        y: 110,
        includeStroke: true,
        strokeWidth: 5,
        tolerance: 2,
        fillRule: 'evenodd',
        resultName: 'pathHit',
      },
      { id: 'operation_path_hit', name: 'Path hit test' },
    ),
    operationRecord(
      'detection-operation',
      {
        type: 'detectRegion',
        region: { type: 'ellipse', x: 520, y: 280, radiusX: 90, radiusY: 50, rotation: 0.2 },
        x: 530,
        y: 285,
        tolerance: 1,
        resultName: 'ellipseHit',
      },
      { id: 'operation_region_hit', name: 'Ellipse hit test' },
    ),
    operationRecord(
      'detection-operation',
      {
        type: 'detectAnyRegion',
        regions: [
          { type: 'rect', x: 20, y: 20, width: 80, height: 70 },
          { type: 'polygon', points: [{ x: 300, y: 250 }, { x: 390, y: 280 }, { x: 340, y: 360 }] },
        ],
        x: 340,
        y: 300,
        resultName: 'anyRegionHit',
      },
      { id: 'operation_any_hit', name: 'Any region hit test' },
    ),
    operationRecord(
      'detection-operation',
      {
        type: 'detectDistance',
        region: { type: 'polygon', points: [{ x: 500, y: 350 }, { x: 610, y: 355 }, { x: 560, y: 440 }] },
        x: 700,
        y: 450,
        resultName: 'distance',
      },
      { id: 'operation_distance', name: 'Region distance' },
    ),
  );

  return project;
}

test('Phase 7 validates and lowers paths pixels and detection in semantic order', () => {
  const project = phase7Project();
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  assert.deepEqual(
    plan.operations.map((operation) => operation.kind),
    [
      'create-canvas',
      'path-draw',
      'path-custom',
      'path-draw',
      'pixels-manipulate',
      'pixels-set-color',
      'pixels-get-color',
      'detect-path',
      'detect-region',
      'detect-any-region',
      'detect-distance',
    ],
  );

  const primary = plan.operations[1];
  assert.equal(primary.kind, 'path-draw');
  if (primary.kind !== 'path-draw') return;
  assert.equal(primary.options?.transform?.translateX, 70);
  assert.equal(primary.options?.transform?.translateY, 80);
  assert.equal(primary.options?.transform?.rotate, 12);
  assert.equal(primary.options?.transform?.scaleX, 1.2);
  assert.equal(primary.options?.transform?.scaleY, 1.1);
  assert.equal(primary.options?.fill?.rule, 'evenodd');
  assert.equal(primary.options?.stroke?.style, 'dashed');

  const connector = plan.operations[2];
  assert.equal(connector.kind, 'path-custom');
  if (connector.kind === 'path-custom') {
    const options = Array.isArray(connector.options)
      ? connector.options[0]
      : connector.options;
    assert.notEqual(options.startCoordinates.x, 430);
    assert.notEqual(options.startCoordinates.y, 112);
    assert.ok(Math.abs(options.startCoordinates.x - 462.71) < 0.02);
    assert.ok(Math.abs(options.startCoordinates.y - 55.92) < 0.02);
  }

  const detection = plan.operations.find(
    (operation) => operation.kind === 'detect-path',
  );
  assert.ok(detection && detection.kind === 'detect-path');
  if (detection?.kind === 'detect-path') {
    const radians = (12 * Math.PI) / 180;
    const dx = 120 - 70;
    const dy = 110 - 80;
    const expectedX = (dx * Math.cos(-radians) - dy * Math.sin(-radians)) / 1.2;
    const expectedY = (dx * Math.sin(-radians) + dy * Math.cos(-radians)) / 1.1;
    assert.ok(Math.abs(detection.x - expectedX) < 1e-9);
    assert.ok(Math.abs(detection.y - expectedY) < 1e-9);
    assert.notEqual(detection.x, 120);
    assert.notEqual(detection.y, 110);
  }
});

test('Phase 7 emits canonical user-facing facet code', () => {
  const source = generateVisualProjectCode(phase7Project()).source;
  for (const pattern of [
    /\.path2d\.create\(/,
    /\.path2d\.draw\(/,
    /\.path2d\.custom\(/,
    /\.pixels\.manipulate\(/,
    /\.pixels\.setColor\(/,
    /\.pixels\.getColor\(/,
    /\.detect\.path\(/,
    /\.detect\.region\(/,
    /\.detect\.anyRegion\(/,
    /\.detect\.distance\(/,
    /rule: "evenodd"/,
    /dashArray:/,
    /markers:/,
    /angle: 90/,
  ]) {
    assert.match(source, pattern);
  }
  assert.doesNotMatch(source, /StudioOperationPlan|runtime proxy|artifact collector/i);
});

test('Phase 7 canonical code reconciles back into paths and structured operations', () => {
  const project = phase7Project();
  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    id: project.id,
    name: project.name,
    width: 320,
    height: 200,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;

  const nodes = result.project.document.rootNodeIds.map(
    (id) => result.project.document.nodes[id],
  );
  assert.equal(nodes.length, 3);
  assert.equal(nodes.filter((node) => node.kind === 'path' || node.kind === 'freehand').length, 3);
  const first = nodes[0];
  const firstProps = visualPathProps(first);
  assert.equal(firstProps.commands?.some((command) => command.type === 'bezierCurveTo'), true);
  assert.equal(firstProps.draw?.fill?.rule, 'evenodd');
  assert.equal(first.transform?.x, 70);
  assert.equal(first.transform?.y, 80);
  assert.equal(first.transform?.rotation, 12);

  assert.deepEqual(
    result.project.operations.map((record) => record.kind),
    [
      'pixel-operation',
      'pixel-operation',
      'detection-operation',
      'detection-operation',
      'detection-operation',
      'detection-operation',
      'detection-operation',
    ],
  );
  const regenerated = generateVisualProjectCode(result.project).source;
  for (const token of [
    '.path2d.draw(',
    '.path2d.custom(',
    '.pixels.manipulate(',
    '.pixels.setColor(',
    '.detect.path(',
    '.detect.anyRegion(',
  ]) {
    assert.ok(regenerated.includes(token), 'missing regenerated token ' + token);
  }
});

test('Phase 7 executor routes canonical operations through one runtime plan', async () => {
  const plan = lowerVisualProject(phase7Project());
  const calls: string[] = [];
  let counter = 0;
  const next = () => new Uint8Array([++counter]);

  const result = await executeStudioOperationPlan(plan, {
    async createCanvas() {
      calls.push('createCanvas');
      return { buffer: next() };
    },
    async drawPath() {
      calls.push('path2d.draw');
      return next();
    },
    async customPath() {
      calls.push('path2d.custom');
      return next();
    },
    async manipulatePixels() {
      calls.push('pixels.manipulate');
      return next();
    },
    async setPixelColor() {
      calls.push('pixels.setColor');
      return next();
    },
    async getPixelColor() {
      calls.push('pixels.getColor');
      return { r: 1, g: 2, b: 3, a: 255 };
    },
    async detectPath() {
      calls.push('detect.path');
      return { hit: true, hitType: 'stroke' };
    },
    async detectRegion() {
      calls.push('detect.region');
      return { hit: true, hitType: 'fill' };
    },
    async detectAnyRegion() {
      calls.push('detect.anyRegion');
      return { hit: true, hitType: 'fill', hitRegion: 1 };
    },
    async detectDistance() {
      calls.push('detect.distance');
      return 12;
    },
  });

  assert.ok(result instanceof Uint8Array);
  assert.deepEqual(calls, [
    'createCanvas',
    'path2d.draw',
    'path2d.custom',
    'path2d.draw',
    'pixels.manipulate',
    'pixels.setColor',
    'pixels.getColor',
    'detect.path',
    'detect.region',
    'detect.anyRegion',
    'detect.distance',
  ]);
});

test('Phase 7 rejects malformed imported operation payloads before lowering', () => {
  const project = createVisualProject({ width: 320, height: 200 });
  project.operations.push({
    id: 'bad_pixel',
    kind: 'pixel-operation',
    value: {
      type: 'setColor',
      x: 2.5,
      y: -1,
      color: { r: 400, g: 0, b: 0 },
    },
  });
  project.operations.push({
    id: 'bad_detect',
    kind: 'detection-operation',
    value: {
      type: 'detectDistance',
      region: { type: 'path', path: [{ type: 'moveTo', x: 0, y: 0 }] },
      x: Number.NaN,
      y: 10,
    },
  });

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(
    validation.issues.filter((issue) => issue.code === 'phase7-operation').length >= 4,
  );
  assert.throws(() => lowerVisualProject(project));
});

test('Phase 7 permanent shell exposes authoring, pixel tools and structured results', () => {
  const shell = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );
  for (const contract of [
    'data-visual-paths-context',
    'data-path-insert={tool}',
    'data-path-freehand',
    'data-path-stroke',
    'data-path-fill',
    'data-path-fill-rule',
    'data-connector-style',
    'data-connector-arrows',
    'data-pixel-filter={filter}',
    'data-pixel-set-tool',
    'data-pixel-inspector',
    'data-pixel-data-tool',
    'data-detect-path-tool',
    'data-detect-region-tool',
    'data-detect-distance-tool',
    'data-detect-any-tool',
    'data-phase7-results',
    'data-freehand-draft',
  ]) {
    assert.ok(shell.includes(contract), 'missing Phase 7 UI contract: ' + contract);
  }
});
