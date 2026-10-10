import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import {
  TEXT_AUTHORING_CLASSIFICATION,
  defaultTextNodeProps,
  textBatchGroupPropsRecord,
  textPropsRecord,
  visualTextBatchGroupProps,
  visualTextProps,
} from '../../../lib/studio/visual/text-contract';
import {
  defaultShapeNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

function phase6Project() {
  const project = createVisualProject({
    id: 'project_phase6',
    name: 'Text Font Proof',
    width: 960,
    height: 600,
    now: '2026-09-21T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };

  const shape = createVisualNode(
    'shape',
    imagePropsRecord(defaultShapeNodeProps('rectangle')),
    { id: 'shape_panel', name: 'Panel' },
  );
  shape.transform = {
    x: 80,
    y: 80,
    width: 800,
    height: 420,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
  };

  const text = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Apexify Studio\nText from code.'),
      font: {
        size: 54,
        family: 'Arial',
        name: 'Arial',
      },
      decorations: {
        bold: true,
        italic: false,
        underline: { color: '#7dd3fc', width: 2 },
      },
      layout: {
        lineHeight: 1.25,
        letterSpacing: 1,
        wordSpacing: 2,
        maxWidth: 560,
        maxHeight: 180,
      },
      placement: {
        textAlign: 'left',
        textBaseline: 'top',
        rotation: 4,
      },
      fill: {
        color: '#f8fafc',
        opacity: .94,
      },
      effects: {
        shadow: {
          color: '#000000',
          offsetX: 0,
          offsetY: 8,
          blur: 18,
          opacity: .35,
        },
        glow: {
          color: '#60a5fa',
          intensity: 7,
          opacity: .4,
        },
      },
      stroke: {
        color: '#0b1730',
        width: 1,
        opacity: .7,
        style: 'solid',
      },
      includeCharMetrics: true,
      measurementCanvas: { width: 1200, height: 600 },
    }),
    { id: 'text_hero', name: 'Hero Copy' },
  );
  text.transform = {
    x: 160,
    y: 180,
    width: 560,
    height: 180,
    rotation: 4,
    opacity: .94,
    visible: true,
    locked: false,
    zIndex: 1,
  };

  project.document.nodes[shape.id] = shape;
  project.document.nodes[text.id] = text;
  project.document.rootNodeIds = [shape.id, text.id];
  return project;
}

test('Phase 6 lowers text after earlier visual output and preserves modern typography', () => {
  const project = phase6Project();
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  assert.deepEqual(
    plan.operations.map((operation) => operation.kind),
    ['create-canvas', 'create-image', 'create-text'],
  );

  const text = plan.operations[2];
  assert.equal(text.kind, 'create-text');
  if (text.kind !== 'create-text') return;
  assert.equal(Array.isArray(text.properties), false);
  if (Array.isArray(text.properties)) return;
  assert.equal(text.base.$studioTarget, 'shape_panel');
  assert.equal(text.properties.text, 'Apexify Studio\nText from code.');
  assert.equal(text.properties.x, 160);
  assert.equal(text.properties.y, 180);
  assert.equal(text.properties.font?.size, 54);
  assert.equal(text.properties.layout?.maxWidth, 560);
  assert.equal(text.properties.layout?.maxHeight, 180);
  assert.equal(text.properties.placement?.rotation, 4);
  assert.equal(text.properties.fill?.opacity, .94);
});

test('Phase 6 emits clean canonical createText source', () => {
  const source = generateVisualProjectCode(phase6Project()).source;
  assert.match(source, /\.createText\(/);
  assert.match(source, /text: "Apexify Studio\\nText from code\."/);
  assert.match(source, /font:/);
  assert.match(source, /decorations:/);
  assert.match(source, /layout:/);
  assert.match(source, /placement:/);
  assert.match(source, /effects:/);
  assert.match(source, /measurementCanvas:/);
  assert.match(source, /createText\([\s\S]+panel\)/);
});

test('Phase 6 canonical createText round-trips into a semantic text node', () => {
  const project = phase6Project();
  const source = generateVisualProjectCode(project).source;
  const empty = createVisualProject({
    id: project.id,
    name: project.name,
    width: 320,
    height: 200,
    now: project.createdAt,
  });

  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const ids = result.project.document.rootNodeIds;
  assert.equal(ids.length, 2);
  const text = result.project.document.nodes[ids[1]];
  assert.equal(text.kind, 'text');
  const props = visualTextProps(text);
  assert.equal(props.text, 'Apexify Studio\nText from code.');
  assert.equal(props.font?.size, 54);
  assert.equal(props.decorations?.bold, true);
  assert.equal(props.layout?.lineHeight, 1.25);
  assert.equal(props.effects?.shadow?.blur, 18);
  assert.equal(text.transform?.x, 160);
  assert.equal(text.transform?.y, 180);
  assert.equal(text.transform?.width, 560);
  assert.equal(text.transform?.height, 180);
  assert.equal(text.transform?.rotation, 4);
  assert.equal(text.transform?.opacity, .94);
});

test('Phase 6 preserves uploaded font identity in canonical linked source', () => {
  const project = createVisualProject({
    id: 'project_phase6_font',
    width: 640,
    height: 360,
    now: '2026-09-21T00:00:00.000Z',
  });
  const text = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Custom font'),
      font: {
        size: 42,
        family: 'ApexifyCustom',
        name: 'ApexifyCustom',
        path: 'studio://asset/font_abc123',
      },
    }),
    { id: 'text_font', name: 'Custom Font' },
  );
  text.transform = {
    x: 80,
    y: 100,
    width: 420,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
  };
  project.document.nodes[text.id] = text;
  project.document.rootNodeIds = [text.id];

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /family: "ApexifyCustom"/);
  assert.match(source, /path: "studio:\/\/asset\/font_abc123"/);

  const result = reconcileVisualProjectFromCode(
    createVisualProject({
      id: project.id,
      width: 640,
      height: 360,
      now: project.createdAt,
    }),
    source,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const node = result.project.document.nodes[result.project.document.rootNodeIds[0]];
  assert.equal(visualTextProps(node).font?.path, 'studio://asset/font_abc123');
});

test('Phase 6 validates text bounds curve and metrics options', () => {
  const project = createVisualProject({ width: 640, height: 360 });
  const text = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Broken'),
      font: { size: 0, family: 'Arial' },
      layout: { lineHeight: 0, maxWidth: -1 },
      textOnCurve: { sweepAngle: 400, radius: 0, layoutMode: 'clamp' },
      measurementCanvas: { width: 0, height: 1.2 },
    }),
    { id: 'text_invalid' },
  );
  text.transform = { x: 0, y: 0, width: 100, height: 80 };
  project.document.nodes[text.id] = text;
  project.document.rootNodeIds = [text.id];

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  for (const code of [
    'text-font-size',
    'text-line-height',
    'text-layout-bound',
    'text-curve-sweep',
    'text-curve-radius',
    'text-measurement-canvas',
  ]) {
    assert.ok(
      validation.issues.some((issue) => issue.code === code),
      'missing validation issue ' + code,
    );
  }
});

test('Phase 6 classifies every pinned TextProperties field', () => {
  assert.deepEqual(Object.keys(TEXT_AUTHORING_CLASSIFICATION).sort(), [
    'bold','color','decorations','effects','fill','font',
    'fontFamily','fontName','fontPath','fontSize','glow','gradient','highlight',
    'includeCharMetrics','italic','layout','letterSpacing','lineHeight',
    'maxHeight','maxWidth','measurementCanvas','opacity','overline','painterOpts',
    'placement','rotation','shadow','strikethrough','stroke','text','textAlign',
    'textBaseline','textOnCurve','underline','wordSpacing',
  ].sort());

  for (const entry of Object.values(TEXT_AUTHORING_CLASSIFICATION)) {
    assert.ok(
      ['Transform','Style','Effects','Data','Advanced','Metrics'].includes(entry.surface),
    );
    assert.ok(
      ['canonical-literal','font-asset','legacy-normalized'].includes(entry.reverse),
    );
  }
});

test('Phase 6 permanent shell exposes the dedicated text authoring workflow', () => {
  const shell = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );
  const inspector = fs.readFileSync(
    'components/studio/visual/VisualTextInspector.tsx',
    'utf8',
  );

  for (const contract of [
    'data-visual-text-context',
    'data-text-insert',
    'data-inline-text-editor',
    '<VisualTextInspector',
    '<VisualTextBatchInspector',
  ]) {
    assert.ok(shell.includes(contract), 'missing Phase 6 shell contract: ' + contract);
  }

  for (const contract of [
    'data-text-content-editor',
    'data-text-gradient-editor',
    'measureVisualTextInBrowser',
    'Typography',
    'Layout',
    'Text on curve',
    'Runtime contract',
    'Legacy TextProperties aliases',
    'createText(textPropertiesOrArray, canvasBuffer, painterOpts?)',
    'Resolve asset references',
    'No hidden group transform options',
    'createText([...])',
  ]) {
    assert.ok(inspector.includes(contract), 'missing rebuilt text inspector contract: ' + contract);
  }

  for (const forbidden of [
    'CreateTextOptions',
    'Text group transform',
    'Perspective text',
  ]) {
    assert.equal(
      inspector.includes(forbidden),
      false,
      'unsupported pinned createText surface leaked into Studio: ' + forbidden,
    );
  }
});


test('Phase 6 lowers a text batch to one two-argument createText array call', () => {
  const project = createVisualProject({
    id: 'project_phase6_batch',
    width: 640,
    height: 360,
    now: '2026-09-21T00:00:00.000Z',
  });

  const group = createVisualNode(
    'group',
    textBatchGroupPropsRecord({ textBatch: true }),
    { id: 'text_batch', name: 'Text batch (2)' },
  );
  const first = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('First')),
    { id: 'text_first', name: 'First' },
  );
  const second = createVisualNode(
    'text',
    textPropsRecord({
      ...defaultTextNodeProps('Second'),
      decorations: { bold: true, italic: true },
      fill: { color: '#22d3ee', opacity: 0.8 },
    }),
    { id: 'text_second', name: 'Second' },
  );
  first.parentId = group.id;
  second.parentId = group.id;
  first.transform = { x: 30, y: 40, width: 220, height: 80 };
  second.transform = { x: 60, y: 120, width: 260, height: 90 };
  group.childIds = [first.id, second.id];

  project.document.nodes[group.id] = group;
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [group.id];

  const plan = lowerVisualProject(project);
  const textOps = plan.operations.filter((operation) => operation.kind === 'create-text');
  assert.equal(textOps.length, 1);
  const operation = textOps[0];
  assert.equal(operation.kind, 'create-text');
  if (operation.kind !== 'create-text') return;
  assert.equal(Array.isArray(operation.properties), true);
  if (!Array.isArray(operation.properties)) return;
  assert.equal(operation.properties.length, 2);
  assert.equal(operation.properties[0]?.text, 'First');
  assert.equal(operation.properties[1]?.text, 'Second');
  assert.equal('options' in operation, false);
  assert.equal('painterOpts' in operation, false);

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /\.createText\(\s*\[/);
  assert.doesNotMatch(source, /createText\([\s\S]*isGrouped/);
  assert.doesNotMatch(source, /createText\([\s\S]*resolveAssetRefs/);

  const empty = createVisualProject({
    id: project.id,
    width: 640,
    height: 360,
    now: project.createdAt,
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const root = result.project.document.nodes[result.project.document.rootNodeIds[0]];
  assert.equal(root.kind, 'group');
  assert.equal(visualTextBatchGroupProps(root)?.textBatch, true);
  assert.equal(root.childIds?.length, 2);
  assert.equal(
    root.childIds?.map((id) => visualTextProps(result.project.document.nodes[id]).text).join('|'),
    'First|Second',
  );
});

test('Phase 6 reverse sync owns the public createText painterOpts argument', () => {
  const project = createVisualProject({
    id: 'project_phase6_painter_opts',
    width: 320,
    height: 200,
    now: '2026-09-21T00:00:00.000Z',
  });
  const source = [
    "import { ApexPainter } from 'apexify.js';",
    "const painter = new ApexPainter();",
    "const canvas = await painter.createCanvas({ width: 320, height: 200 });",
    "const text = await painter.createText({ text: 'Refs', x: 10, y: 20 }, canvas.buffer, { resolveAssetRefs: true });",
  ].join('\n');
  const result = reconcileVisualProjectFromCode(project, source);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;
  const node = result.project.document.nodes[result.project.document.rootNodeIds[0]!];
  assert.deepEqual(visualTextProps(node).painterOpts, { resolveAssetRefs: true });
  const regenerated = generateVisualProjectCode(result.project).source;
  assert.match(regenerated, /createText\([\s\S]*resolveAssetRefs: true/);
});

test('Phase 6 reverse sync rejects non-public createText options', () => {
  const project = createVisualProject({
    id: 'project_phase6_invalid_call',
    width: 320,
    height: 200,
    now: '2026-09-21T00:00:00.000Z',
  });
  const source = [
    "import { ApexPainter } from 'apexify.js';",
    "const painter = new ApexPainter();",
    "const canvas = await painter.createCanvas({ width: 320, height: 200 });",
    "const text = await painter.createText({ text: 'Wrong', x: 10, y: 20 }, canvas.buffer, { isGrouped: true });",
  ].join('\n');
  const result = reconcileVisualProjectFromCode(project, source);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /painterOpts\.isGrouped.*not part of the public runtime contract/i);
});
