import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import {
  defaultShapeNodeProps,
  imagePropsRecord,
} from '../../../lib/studio/visual/image-contract';
import {
  defaultTextNodeProps,
  textPropsRecord,
} from '../../../lib/studio/visual/text-contract';
import {
  PHASE9_NAMED_ASSET_KIND,
  PHASE9_VARIABLE_KIND,
  addPhase9TemplatePlaceholder,
  capturePhase9Component,
  capturePhase9Template,
  createPhase9Scene,
  createPhase9Surface,
  detachPhase9Instance,
  expandPhase9Instance,
  instantiatePhase9Definition,
  materializePhase9Project,
  phase9ComponentDefinitions,
  phase9Definition,
  phase9SceneDefinition,
  phase9TemplateDefinitions,
  registerPhase9NamedAsset,
  registerPhase9Variable,
  resolvePhase9References,
  setPhase9InstanceData,
  setPhase9InstanceInsertions,
  setPhase9InstanceOverrides,
} from '../../../lib/studio/visual/scene-component-contract';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import {
  generateVisualProjectCode,
  generateVisualProjectPreviewCode,
} from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';

function phase9BaseProject() {
  const project = createVisualProject({
    id: 'project_phase9',
    name: 'Phase 9 Scenes Components',
    width: 900,
    height: 620,
    now: '2026-09-23T00:00:00.000Z',
  });
  project.document.canvas = { colorBg: '#071426' };

  const title = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('Reusable title')),
    { id: 'text_phase9_title', name: 'Title' },
  );
  title.transform = {
    x: 90,
    y: 80,
    width: 360,
    height: 90,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 0,
  };

  const card = createVisualNode(
    'shape',
    imagePropsRecord(defaultShapeNodeProps('rectangle')),
    { id: 'shape_phase9_card', name: 'Card' },
  );
  card.transform = {
    x: 70,
    y: 60,
    width: 430,
    height: 210,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: 1,
  };

  project.document.nodes[card.id] = card;
  project.document.nodes[title.id] = title;
  project.document.rootNodeIds = [card.id, title.id];
  project.editor = {
    ...project.editor,
    selectedNodeIds: [card.id, title.id],
  };
  return project;
}

test('Phase 9 captures a semantic component and inserts reusable instances', () => {
  const source = phase9BaseProject();
  const captured = capturePhase9Component(
    source,
    source.editor?.selectedNodeIds ?? [],
    'Metric Card',
  );
  const project = captured.project;
  const definitions = phase9ComponentDefinitions(project);

  assert.equal(definitions.length, 1);
  assert.equal(definitions[0].name, 'Metric Card');
  assert.deepEqual(
    new Set(Object.keys(definitions[0].nodes)),
    new Set(['shape_phase9_card', 'text_phase9_title']),
  );
  assert.equal(project.document.rootNodeIds.length, 1);
  assert.equal(project.document.nodes[captured.instanceId].kind, 'component');

  const inserted = instantiatePhase9Definition(project, captured.definitionId, {
    x: 520,
    y: 90,
  });
  assert.equal(
    Object.values(inserted.document.nodes).filter((node) => node.kind === 'component').length,
    2,
  );
  assert.equal(validateVisualProject(inserted).ok, true);
});

test('Phase 9 materializes overrides deterministically and supports detach/expand', () => {
  const captured = capturePhase9Component(
    phase9BaseProject(),
    ['shape_phase9_card', 'text_phase9_title'],
    'Metric Card',
  );
  const definition = phase9Definition(captured.project, captured.definitionId);
  assert.ok(definition);

  const withOverride = setPhase9InstanceOverrides(
    captured.project,
    captured.instanceId,
    {
      text_phase9_title: {
        props: {
          text: 'Overridden title',
        },
      },
    },
  );

  const first = materializePhase9Project(withOverride);
  const second = materializePhase9Project(withOverride);
  assert.deepEqual(first.document.rootNodeIds, second.document.rootNodeIds);
  assert.deepEqual(first.document.nodes, second.document.nodes);
  const renderedTitle = Object.values(first.document.nodes).find(
    (node) => node.name === 'Title',
  );
  assert.equal(renderedTitle?.props.text, 'Overridden title');

  const expanded = expandPhase9Instance(withOverride, captured.instanceId);
  const expandedRoot = expanded.document.nodes[expanded.document.rootNodeIds[0]];
  assert.equal(expandedRoot.kind, 'group');
  assert.equal((expandedRoot.childIds?.length ?? 0) >= 2, true);

  const detached = detachPhase9Instance(withOverride, captured.instanceId);
  assert.equal(
    Object.values(detached.document.nodes).some((node) => node.kind === 'component'),
    false,
  );
  assert.equal(detached.document.rootNodeIds.length >= 2, true);
});

test('Phase 9 templates expose placeholders data overrides and native insertions', () => {
  const captured = capturePhase9Template(
    phase9BaseProject(),
    ['shape_phase9_card', 'text_phase9_title'],
    'Hero Template',
  );
  let project = addPhase9TemplatePlaceholder(
    captured.project,
    captured.definitionId,
    {
      name: 'headline',
      nodeId: 'text_phase9_title',
      path: 'props.text',
      defaultValue: 'Default headline',
    },
  );
  project = setPhase9InstanceData(
    project,
    captured.instanceId,
    'headline',
    'Runtime headline',
  );
  project = setPhase9InstanceOverrides(project, captured.instanceId, {
    shape_phase9_card: {
      transform: { opacity: 0.82 },
    },
  });
  project = setPhase9InstanceInsertions(project, captured.instanceId, [
    {
      targetId: 'text_phase9_title',
      position: 'after',
      layers: {
        id: 'inserted_caption',
        type: 'text',
        texts: {
          text: 'Inserted caption',
          x: 120,
          y: 180,
        },
      },
    },
  ]);

  const definitions = phase9TemplateDefinitions(project);
  assert.equal(definitions.length, 1);
  assert.equal(definitions[0].placeholders[0].name, 'headline');

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /createTemplate\(/);
  assert.match(source, /\.render\(/);
  assert.match(source, /\{\{headline\}\}/);
  assert.match(source, /Runtime headline/);
  assert.match(source, /shape_phase9_card/);
  assert.match(source, /inserted_caption/);

  const preview = generateVisualProjectPreviewCode(project).source;
  assert.match(preview, /createCanvas\(/);
  assert.match(preview, /Runtime headline/);

  const reconciled = reconcileVisualProjectFromCode(project, source);
  assert.equal(reconciled.ok, true);
  if (reconciled.ok) {
    assert.deepEqual(reconciled.project.document.nodes, project.document.nodes);
    assert.deepEqual(reconciled.project.operations, project.operations);
  }
  assert.equal(validateVisualProject(project).ok, true);
});

test('Phase 9 scenes lower nested surfaces to native SceneBuilder layers', () => {
  let project = createVisualProject({
    id: 'project_phase9_scene',
    name: 'Nested scene',
    width: 860,
    height: 560,
    now: '2026-09-23T00:00:00.000Z',
  });
  project = createPhase9Scene(project, {
    name: 'Dashboard Scene',
    x: 30,
    y: 20,
    width: 760,
    height: 500,
  });
  const sceneId = project.editor?.selectedNodeIds?.[0];
  assert.ok(sceneId);

  project = createPhase9Surface(project, {
    name: 'Card Surface',
    parentId: sceneId,
    x: 80,
    y: 70,
    width: 420,
    height: 260,
  });
  const surfaceId = project.editor?.selectedNodeIds?.[0];
  assert.ok(surfaceId);

  const title = createVisualNode(
    'text',
    textPropsRecord(defaultTextNodeProps('Nested scene title')),
    { id: 'scene_nested_title', name: 'Nested title', parentId: surfaceId },
  );
  title.parentId = surfaceId;
  title.transform = {
    x: 120,
    y: 110,
    width: 260,
    height: 70,
    visible: true,
    locked: false,
    opacity: 1,
  };
  project.document.nodes[title.id] = title;
  project.document.nodes[surfaceId!].childIds = [
    ...(project.document.nodes[surfaceId!].childIds ?? []),
    title.id,
  ];

  const scene = project.document.nodes[sceneId!];
  const definition = phase9SceneDefinition(project, scene);
  assert.equal(definition.layers.length, 1);
  assert.equal(definition.layers[0].type, 'surface');
  const nestedLayers = definition.layers[0].layers as unknown[];
  assert.equal(Array.isArray(nestedLayers), true);
  assert.equal(nestedLayers.length, 1);

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /createScene\(/);
  assert.match(source, /\.render\(\{ resolveAssetRefs: true \}\)/);
  assert.match(source, /type: "surface"/);
  assert.match(source, /Nested scene title/);
  const preview = generateVisualProjectPreviewCode(project).source;
  assert.match(preview, /createCanvas\(/);
  assert.match(preview, /Nested scene title/);
  assert.equal(validateVisualProject(project).ok, true);
});

test('Phase 9 named assets and variables compile through painter.assets and stable refs', () => {
  let project = phase9BaseProject();
  const named = registerPhase9NamedAsset(project, {
    name: 'Hero image',
    uri: 'https://example.test/hero.png',
    mime: 'image/png',
  });
  project = named.project;
  const variable = registerPhase9Variable(project, {
    name: 'Headline',
    value: 'Bound headline',
  });
  project = variable.project;

  const titleId = 'text_phase9_title';
  project.document.nodes[titleId].props.text = {
    $ref: 'variable:' + variable.variableId,
  };

  const resolved = resolvePhase9References(project);
  assert.equal(resolved.document.nodes[titleId].props.text, 'Bound headline');
  assert.equal(
    project.assets.find((item) => item.id === named.assetId)?.kind,
    PHASE9_NAMED_ASSET_KIND,
  );
  assert.equal(
    project.variables.find((item) => item.id === variable.variableId)?.kind,
    PHASE9_VARIABLE_KIND,
  );

  const source = generateVisualProjectCode(project).source;
  assert.match(source, /\.assets\.loadImage\(/);
  assert.match(source, /\.assets\.loadValue\(/);
  assert.match(source, /Bound headline/);
  assert.equal(validateVisualProject(project).ok, true);
});

test('Phase 9 rejects missing definitions and unknown override targets', () => {
  const project = phase9BaseProject();
  project.document.nodes.text_phase9_title.kind = 'component';
  project.document.nodes.text_phase9_title.props = {
    definitionId: 'component_missing',
    overrides: {
      missing_layer: { props: { text: 'bad' } },
    },
  };
  project.document.rootNodeIds = ['text_phase9_title'];
  delete project.document.nodes.shape_phase9_card;
  project.editor = { ...project.editor, selectedNodeIds: ['text_phase9_title'] };

  const validation = validateVisualProject(project);
  assert.equal(validation.ok, false);
  assert.ok(
    validation.issues.some((issue) => issue.code === 'phase9-missing-definition'),
  );
});

test('Phase 9 permanent UI owns Components, placeholders, refs and lifecycle actions', () => {
  const studio = fs.readFileSync(
    'components/studio/visual/VisualStudioPre4.tsx',
    'utf8',
  );
  const ui = fs.readFileSync(
    'components/studio/visual/VisualSceneComponentAuthoring.tsx',
    'utf8',
  );

  assert.match(studio, /\['components', CubeIcon, 'Components'\]/);
  assert.match(studio, /activeTool === 'components'/);
  assert.match(studio, /<VisualComponentsContext/);
  assert.match(studio, /<VisualPhase9Inspector/);

  for (const marker of [
    'data-visual-components-context',
    'data-scene-add',
    'data-surface-add',
    'data-component-create',
    'data-template-create',
    'data-component-library',
    'data-template-library',
    'data-template-placeholder-editor',
    'data-template-add-placeholder',
    'data-instance-overrides',
    'data-instance-insertions',
    'data-reference-bind',
    'data-instance-expand',
    'data-instance-detach',
    'data-named-asset-register',
    'data-phase9-variable-register',
  ]) {
    assert.ok(ui.includes(marker), 'missing Phase 9 UI marker ' + marker);
  }
});
