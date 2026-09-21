import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import {
  addEditorPlaceholder,
  alignSelectedNodes,
  deleteSelectedNodes,
  distributeSelectedNodes,
  duplicateSelectedNodes,
  moveSelectedNodes,
  reorderRootNode,
  setVisualSelection,
  updateNodeTransform,
} from '../../../lib/studio/visual/editor/mutations';
import {
  createVisualHistory,
  commitVisualHistory,
  redoVisualHistory,
  undoVisualHistory,
} from '../../../lib/studio/visual/editor/history';
import {
  resolvedTransform,
  snapNodeTransform,
  snapRotation,
} from '../../../lib/studio/visual/editor/geometry';

function makeProject() {
  let project = createVisualProject({
    id: 'project_phase3',
    name: 'Phase 3 editor proof',
    width: 800,
    height: 600,
    now: '2026-09-21T00:00:00.000Z',
  });
  project = addEditorPlaceholder(project, { id: 'layer_a', name: 'A', x: 40, y: 60, width: 120, height: 80 });
  project = addEditorPlaceholder(project, { id: 'layer_b', name: 'B', x: 240, y: 160, width: 120, height: 80 });
  project = addEditorPlaceholder(project, { id: 'layer_c', name: 'C', x: 500, y: 300, width: 120, height: 80 });
  return project;
}

test('generic placeholders are first-class Visual Project nodes', () => {
  const project = makeProject();
  assert.deepEqual(project.document.rootNodeIds, ['layer_a', 'layer_b', 'layer_c']);
  assert.equal(project.document.nodes.layer_a.kind, 'group');
  assert.equal(project.document.nodes.layer_a.props.editorCorePlaceholder, true);
  assert.equal(project.editor?.selectedNodeIds?.[0], 'layer_c');
});

test('multi-selection moves unlocked nodes and preserves locked nodes', () => {
  let project = makeProject();
  project = updateNodeTransform(project, 'layer_b', { locked: true });
  project = setVisualSelection(project, ['layer_a', 'layer_b']);
  project = moveSelectedNodes(project, 25, -10);

  const a = resolvedTransform(project.document.nodes.layer_a.transform);
  const b = resolvedTransform(project.document.nodes.layer_b.transform);
  assert.equal(a.x, 65);
  assert.equal(a.y, 50);
  assert.equal(b.x, 240);
  assert.equal(b.y, 160);
});

test('duplicate and delete preserve root ordering and selection', () => {
  let project = makeProject();
  project = setVisualSelection(project, ['layer_a']);
  project = duplicateSelectedNodes(project, 16);
  assert.equal(project.document.rootNodeIds.length, 4);
  const duplicateId = project.editor?.selectedNodeIds?.[0];
  assert.ok(duplicateId);
  assert.match(project.document.nodes[duplicateId!].name ?? '', /copy/);

  project = deleteSelectedNodes(project);
  assert.equal(project.document.rootNodeIds.length, 3);
  assert.deepEqual(project.editor?.selectedNodeIds, []);
});

test('root reordering updates semantic order and z indices', () => {
  let project = makeProject();
  project = reorderRootNode(project, 'layer_a', 'front');
  assert.deepEqual(project.document.rootNodeIds, ['layer_b', 'layer_c', 'layer_a']);
  assert.equal(resolvedTransform(project.document.nodes.layer_a.transform).zIndex, 2);
  project = reorderRootNode(project, 'layer_a', 'backward');
  assert.deepEqual(project.document.rootNodeIds, ['layer_b', 'layer_a', 'layer_c']);
});

test('alignment and distribution operate on generic transforms', () => {
  let project = makeProject();
  project = setVisualSelection(project, ['layer_a', 'layer_b', 'layer_c']);
  project = alignSelectedNodes(project, 'top');
  assert.equal(resolvedTransform(project.document.nodes.layer_a.transform).y, 60);
  assert.equal(resolvedTransform(project.document.nodes.layer_b.transform).y, 60);
  assert.equal(resolvedTransform(project.document.nodes.layer_c.transform).y, 60);

  project = updateNodeTransform(project, 'layer_a', { x: 0 });
  project = updateNodeTransform(project, 'layer_b', { x: 300 });
  project = updateNodeTransform(project, 'layer_c', { x: 680 });
  project = distributeSelectedNodes(project, 'horizontal');
  const a = resolvedTransform(project.document.nodes.layer_a.transform);
  const b = resolvedTransform(project.document.nodes.layer_b.transform);
  const c = resolvedTransform(project.document.nodes.layer_c.transform);
  const gap1 = b.x - (a.x + a.width);
  const gap2 = c.x - (b.x + b.width);
  assert.equal(gap1, gap2);
});

test('transform normalization is canonical and validation rejects malformed geometry', async () => {
  const project = makeProject();
  project.document.nodes.layer_a.transform = {
    locked: false,
    y: 10,
    x: 20,
    width: 120,
    height: 80,
    opacity: 1,
    rotation: 0,
  };
  const { normalizeVisualProject } = await import('../../../lib/studio/visual/compiler/normalize');
  const { validateVisualProject } = await import('../../../lib/studio/visual/compiler/validate');
  const normalized = normalizeVisualProject(project);
  assert.deepEqual(Object.keys(normalized.document.nodes.layer_a.transform ?? {}), [
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'opacity',
    'locked',
  ]);

  normalized.document.nodes.layer_a.transform = {
    ...normalized.document.nodes.layer_a.transform,
    width: 0,
    opacity: 2,
  };
  const result = validateVisualProject(normalized);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === 'invalid-transform-size'));
  assert.ok(result.issues.some((issue) => issue.code === 'invalid-transform-opacity'));
});

test('snapping supports grid, document, sibling and rotation guides', () => {
  const project = makeProject();
  const snapped = snapNodeTransform(project, 'layer_a', {
    ...project.document.nodes.layer_a.transform,
    x: 243,
    y: 163,
  });
  assert.equal(resolvedTransform(snapped.transform).x, 240);
  assert.equal(resolvedTransform(snapped.transform).y, 160);
  assert.ok(snapped.guides.length >= 2);
  assert.equal(snapRotation(44), 45);
  assert.equal(snapRotation(39), 39);
});

test('undo/redo command stack restores immutable project snapshots', () => {
  const before = makeProject();
  const after = moveSelectedNodes(setVisualSelection(before, ['layer_c']), 20, 10);
  let history = createVisualHistory();
  history = commitVisualHistory(history, before, after, 'Move layer');
  assert.equal(history.past.length, 1);

  const undo = undoVisualHistory(history, after);
  assert.ok(undo);
  assert.equal(resolvedTransform(undo!.project.document.nodes.layer_c.transform).x, 500);

  const redo = redoVisualHistory(undo!.history, undo!.project);
  assert.ok(redo);
  assert.equal(resolvedTransform(redo!.project.document.nodes.layer_c.transform).x, 520);
});
