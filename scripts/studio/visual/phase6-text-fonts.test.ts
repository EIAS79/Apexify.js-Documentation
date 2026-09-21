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
  textPropsRecord,
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
    'bold','color','decorations','effects','fill','font','fontFamily','fontName',
    'fontPath','fontSize','glow','gradient','highlight','includeCharMetrics',
    'italic','layout','letterSpacing','lineHeight','maxHeight','maxWidth',
    'measurementCanvas','opacity','overline','placement','rotation','shadow',
    'strikethrough','stroke','text','textAlign','textBaseline','textOnCurve',
    'underline','wordSpacing',
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

test('Phase 6 permanent shell exposes text fonts metrics and direct editing', () => {
  const shell = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );
  for (const contract of [
    'data-visual-text-context',
    'data-text-insert',
    'data-text-content-editor',
    'data-text-font-select',
    'data-text-font-asset-select',
    'data-text-section="typography"',
    'data-text-section="wrapping"',
    'data-text-section="metrics"',
    'data-text-section="curve"',
    'data-text-section="complete-config"',
    'data-inline-text-editor',
    'measureVisualTextInBrowser',
    'onInsertFontAsset={applyFontAsset}',
  ]) {
    assert.ok(shell.includes(contract), 'missing Phase 6 UI contract: ' + contract);
  }
});
