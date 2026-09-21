import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisualNode, createVisualProject } from '../../../lib/studio/visual/project';
import { normalizeVisualProject } from '../../../lib/studio/visual/compiler/normalize';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import { lowerVisualProject } from '../../../lib/studio/visual/compiler/plan';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { parseVisualProject, serializeVisualProject } from '../../../lib/studio/visual/persistence';
import { StableNameRegistry } from '../../../lib/studio/visual/codegen/names';
import { createPhase2ProofProject } from '../../../lib/studio/visual/sample';

test('VisualProject factory creates a versioned single-file project', () => {
  const project = createVisualProject({
    id: 'project_test',
    name: 'Test',
    width: 640,
    height: 360,
    now: '2026-09-21T00:00:00.000Z',
  });
  assert.equal(project.format, 'apexify-studio-visual');
  assert.equal(project.schemaVersion, 1);
  assert.equal(project.codegen.singleFile, true);
  assert.equal(project.codegen.assetBasePath, './assets/');
  assert.deepEqual(project.document.rootNodeIds, []);
});

test('node factory creates persistent ids and valid references are accepted', () => {
  const project = createPhase2ProofProject();
  const asset = { id: 'asset_logo', kind: 'asset', value: { uri: './assets/logo.png' } };
  project.assets.push(asset);
  const node = createVisualNode(
    'image',
    { source: { $ref: 'asset:asset_logo' } },
    { id: 'node_logo', name: 'Logo' },
  );
  project.document.nodes[node.id] = node;
  project.document.rootNodeIds.push(node.id);
  const result = validateVisualProject(project);
  assert.equal(node.id, 'node_logo');
  assert.equal(result.ok, true, JSON.stringify(result.issues));
});

test('normalization is deterministic without changing semantic order', () => {
  const project = createPhase2ProofProject();
  project.variables = [
    { id: 'var_z', kind: 'variable', value: { z: 1, a: 2 } },
    { id: 'var_a', kind: 'variable', value: { b: 3 } },
  ];
  const first = normalizeVisualProject(project);
  const second = normalizeVisualProject(first);
  assert.deepEqual(first, second);
  assert.deepEqual(first.variables.map((item) => item.id), ['var_a', 'var_z']);
  assert.deepEqual(Object.keys(first.variables[1].value ?? {}), ['a', 'z']);
});

test('validation rejects broken hierarchy and missing references', () => {
  const project = createPhase2ProofProject();
  project.document.nodes.bad = {
    id: 'different',
    kind: 'text',
    props: { asset: { $ref: 'asset:missing' } },
  };
  project.document.rootNodeIds.push('bad');
  const result = validateVisualProject(project);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === 'node-key-mismatch'));
  assert.ok(result.issues.some((issue) => issue.code === 'missing-reference'));
});

test('persistence round trip is stable', () => {
  const project = createPhase2ProofProject();
  const first = serializeVisualProject(project);
  const loaded = parseVisualProject(first);
  const second = serializeVisualProject(loaded);
  assert.equal(second, first);
});

test('operation plan is deterministic and document-driven in Phase 2', () => {
  const project = createPhase2ProofProject();
  assert.deepEqual(lowerVisualProject(project), lowerVisualProject(project));
  const plan = lowerVisualProject(project);
  assert.equal(plan.operations.length, 1);
  assert.deepEqual(plan.operations[0], {
    id: 'document_canvas',
    kind: 'create-canvas',
    source: 'document',
    target: 'canvas',
    options: { width: 192, height: 108 },
  });
});

test('generated code is deterministic, readable and free of Studio runtime internals', () => {
  const project = createPhase2ProofProject();
  const first = generateVisualProjectCode(project);
  const second = generateVisualProjectCode(project);
  assert.deepEqual(second, first);
  assert.match(first.source, /import \{ ApexPainter \} from 'apexify\.js';/);
  assert.match(first.source, /new ApexPainter\(\)/);
  assert.match(first.source, /createCanvas/);
  assert.match(first.source, /width: 192/);
  assert.match(first.source, /height: 108/);
  assert.match(first.source, /return canvas\.buffer/);
  assert.doesNotMatch(first.source, /StudioOperationPlan|capability|proxy|artifact collector/i);
});

test('stable name registry resolves collisions deterministically', () => {
  const names = new StableNameRegistry();
  assert.equal(names.allocate('Hero Image'), 'heroImage');
  assert.equal(names.allocate('Hero Image'), 'heroImage2');
  assert.equal(names.allocate('class'), 'classValue');
});
