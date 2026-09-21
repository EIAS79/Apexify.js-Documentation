import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import {
  defaultImageNodeProps,
  CREATE_IMAGE_OPTIONS_CLASSIFICATION,
  GROUP_TRANSFORM_CLASSIFICATION,
  IMAGE_AUTHORING_CLASSIFICATION,
  SHAPE_PROPERTIES_CLASSIFICATION,
  defaultShapeNodeProps,
  imagePropsRecord,
  visualImageProps,
} from '../../../lib/studio/visual/image-contract';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

function phase5Project() {
  const project = createVisualProject({
    id: 'project_phase5',
    name: 'Image Shape Proof',
    width: 900,
    height: 560,
    now: '2026-09-21T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };

  const shape = createVisualNode(
    'shape',
    imagePropsRecord({
      ...defaultShapeNodeProps('star'),
      stroke: { color: '#ffffff', width: 2, opacity: .8 },
      shadow: { color: '#000000', offsetX: 0, offsetY: 10, blur: 18, opacity: .3 },
    }),
    { id: 'shape_star', name: 'Hero Star' },
  );
  shape.transform = {
    x: 90,
    y: 80,
    width: 180,
    height: 180,
    rotation: 12,
    opacity: .9,
    visible: true,
    locked: false,
    zIndex: 0,
  };

  const image = createVisualNode(
    'image',
    imagePropsRecord({
      ...defaultImageNodeProps('https://example.com/hero.png'),
      fit: 'cover',
      align: 'center',
      borderRadius: 22,
      filters: [{ type: 'contrast', value: 1.1 }],
      filterIntensity: 1,
      filterOrder: 'post',
      mask: { source: 'https://example.com/mask.png', mode: 'alpha' },
      distortion: { type: 'bulge', intensity: .15 },
      effects: { vignette: { intensity: .2, size: .7 } },
      boxBackground: { color: '#101d32' },
      createOptions: {
        isGrouped: false,
        groupTransform: { opacity: .95, rotation: 0 },
      },
    }),
    { id: 'image_hero', name: 'Hero Image' },
  );
  image.transform = {
    x: 330,
    y: 110,
    width: 420,
    height: 260,
    rotation: -4,
    opacity: .96,
    visible: true,
    locked: false,
    zIndex: 1,
  };

  project.document.nodes[shape.id] = shape;
  project.document.nodes[image.id] = image;
  project.document.rootNodeIds = [shape.id, image.id];
  return project;
}

test('Phase 5 lowers image and shape nodes in semantic layer order', () => {
  const project = phase5Project();
  const validation = validateVisualProject(project);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  const plan = lowerVisualProject(project);
  assert.deepEqual(
    plan.operations.map((operation) => operation.kind),
    ['create-canvas', 'create-image', 'create-image'],
  );

  const shape = plan.operations[1];
  assert.equal(shape.kind, 'create-image');
  if (shape.kind !== 'create-image') return;
  assert.equal(shape.properties.source, 'star');
  assert.equal(shape.properties.x, 90);
  assert.equal(shape.properties.width, 180);
  assert.equal(shape.properties.rotation, 12);

  const image = plan.operations[2];
  assert.equal(image.kind, 'create-image');
  if (image.kind !== 'create-image') return;
  assert.equal(image.properties.source, 'https://example.com/hero.png');
  assert.equal(image.properties.fit, 'cover');
  assert.equal(image.properties.borderRadius, 22);
  assert.equal(image.options?.isGrouped, false);
  assert.deepEqual(image.base, { $studioTarget: 'shape_star' });
});

test('Phase 5 emits clean canonical createImage calls and preserves deep options', () => {
  const source = generateVisualProjectCode(phase5Project()).source;
  assert.match(source, /\.createImage\(/);
  assert.match(source, /source: "star"/);
  assert.match(source, /source: "https:\/\/example\.com\/hero\.png"/);
  assert.match(source, /fit: "cover"/);
  assert.match(source, /distortion:/);
  assert.match(source, /groupTransform:/);
  assert.match(source, /return heroImage;/);
});

test('Phase 5 canonical code reconciles back into image and shape Visual nodes', () => {
  const source = generateVisualProjectCode(phase5Project()).source;
  const empty = createVisualProject({
    id: 'project_phase5',
    name: 'Image Shape Proof',
    width: 100,
    height: 100,
    now: '2026-09-21T00:00:00.000Z',
  });
  const result = reconcileVisualProjectFromCode(empty, source);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const nodes = result.project.document.rootNodeIds.map(
    (id) => result.project.document.nodes[id],
  );
  assert.equal(nodes.length, 2);
  assert.equal(nodes[0].kind, 'shape');
  assert.equal(visualImageProps(nodes[0]).source, 'star');
  assert.equal(nodes[0].transform?.x, 90);
  assert.equal(nodes[1].kind, 'image');
  assert.equal(
    visualImageProps(nodes[1]).source,
    'https://example.com/hero.png',
  );
  assert.equal(visualImageProps(nodes[1]).borderRadius, 22);
});

test('Phase 5 generated-buffer references emit real earlier output identifiers and round-trip', () => {
  const project = createVisualProject({
    id: 'project_generated_image',
    width: 500,
    height: 400,
    now: '2026-09-21T00:00:00.000Z',
  });
  const first = createVisualNode(
    'shape',
    imagePropsRecord(defaultShapeNodeProps('circle')),
    { id: 'shape_source', name: 'Circle Source' },
  );
  first.transform = { x: 20, y: 20, width: 100, height: 100, opacity: 1, visible: true };

  const second = createVisualNode(
    'image',
    imagePropsRecord({
      ...defaultImageNodeProps(''),
      source: { $generated: first.id },
      borderRadius: 12,
    }),
    { id: 'image_generated', name: 'Generated Copy' },
  );
  second.transform = { x: 170, y: 40, width: 180, height: 140, opacity: 1, visible: true };
  project.document.nodes[first.id] = first;
  project.document.nodes[second.id] = second;
  project.document.rootNodeIds = [first.id, second.id];

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /source: circleSource/);

  const result = reconcileVisualProjectFromCode(
    createVisualProject({
      id: project.id,
      name: project.name,
      width: 500,
      height: 400,
      now: project.createdAt,
    }),
    source,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const ids = result.project.document.rootNodeIds;
  const generated = visualImageProps(result.project.document.nodes[ids[1]]).source;
  assert.equal(typeof generated, 'object');
  if (typeof generated === 'object') {
    assert.equal(generated.$generated, ids[0]);
  }
});

test('Phase 5 validation rejects invalid source and generated-buffer forward reference', () => {
  const project = createVisualProject({ width: 500, height: 300 });
  const invalid = createVisualNode(
    'image',
    imagePropsRecord(defaultImageNodeProps('')),
    { id: 'image_invalid' },
  );
  invalid.transform = { x: 0, y: 0, width: 100, height: 80 };
  project.document.nodes[invalid.id] = invalid;
  project.document.rootNodeIds = [invalid.id];

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'image-source'));

  invalid.props = imagePropsRecord({
    ...defaultImageNodeProps(''),
    source: { $generated: 'missing_node' },
  });
  const missing = validateVisualProject(project);
  assert.equal(missing.ok, false);
  assert.ok(missing.issues.some((issue) => issue.code === 'image-generated-source'));
});

test('Phase 5 permanent shell exposes image shape asset workflows and authoritative artboard', () => {
  const shell = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );
  for (const contract of [
    'data-visual-images-context',
    'data-visual-shapes-context',
    'data-visual-assets-context',
    'data-image-drop-target',
    'data-authoritative-apexify-frame',
    'data-image-section="appearance"',
    'data-image-section="stroke"',
    'data-image-section="filters"',
    'data-image-section="mask"',
    'data-image-section="source"',
    'data-image-section="complete-config"',
    'Generated-buffer source',
    'Replace with Studio asset',
  ]) {
    assert.ok(shell.includes(contract), 'missing Phase 5 UI contract: ' + contract);
  }
});


test('Phase 5 classifies every pinned image, shape and createImage option into the permanent UI', () => {
  assert.deepEqual(Object.keys(IMAGE_AUTHORING_CLASSIFICATION).sort(), [
    'align','blendMode','blur','borderPosition','borderRadius','boxBackground',
    'clipPath','distortion','effects','filterIntensity','filterOrder','filters',
    'fit','height','inherit','mask','meshWarp','opacity','rotation','shadow',
    'shape','source','stroke','width','x','y',
  ].sort());
  assert.deepEqual(Object.keys(CREATE_IMAGE_OPTIONS_CLASSIFICATION).sort(), [
    'groupTransform','isGrouped',
  ]);
  assert.deepEqual(Object.keys(GROUP_TRANSFORM_CLASSIFICATION).sort(), [
    'blendMode','blur','borderPosition','borderRadius','boxBackground',
    'clipPath','distortion','effects','filterIntensity','filterOrder','filters',
    'mask','meshWarp','opacity','pivotX','pivotY','rotation','scaleX','scaleY',
    'shadow','stroke','translateX','translateY',
  ].sort());
  assert.deepEqual(Object.keys(SHAPE_PROPERTIES_CLASSIFICATION).sort(), [
    'centerX','centerY','color','endAngle','fill','gradient','innerRadius',
    'outerRadius','points','radius','sides','startAngle',
  ].sort());

  for (const entry of Object.values(IMAGE_AUTHORING_CLASSIFICATION)) {
    assert.ok(['Transform','Style','Effects','Data','Advanced'].includes(entry.surface));
    assert.ok(['canonical-literal','stable-source','generated-buffer'].includes(entry.reverse));
  }
});
