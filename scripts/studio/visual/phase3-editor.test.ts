import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createVisualNode,
  createVisualProject,
} from '../../../lib/studio/visual/project';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import {
  VisualHistory,
  alignNodes,
  copyNodes,
  deleteNodes,
  duplicateNodes,
  flattenLayerIds,
  groupNodes,
  moveNodeInStack,
  moveNodes,
  nodeRect,
  pasteNodes,
  reorderNode,
  resizeNode,
  rotateNode,
  setNodeLocked,
  setNodeVisibility,
  setSelection,
  snapPosition,
  ungroupNodes,
} from '../../../lib/studio/visual/editor';

function fixture() {
  const project = createVisualProject({
    id: 'project_phase3',
    now: '2026-09-21T00:00:00.000Z',
    width: 800,
    height: 600,
  });

  for (const [id, x, y] of [
    ['node_a', 10, 20],
    ['node_b', 250, 120],
    ['node_c', 500, 240],
  ] as const) {
    const node = createVisualNode('group', {}, { id, name: id });
    node.transform = {
      x,
      y,
      width: 100,
      height: 80,
      visible: true,
      locked: false,
    };
    project.document.nodes[id] = node;
    project.document.rootNodeIds.push(id);
  }

  return project;
}

test('selection and transform operations remain generic', () => {
  let project = fixture();
  project = setSelection(project, ['node_a', 'node_b']);
  assert.deepEqual(project.editor?.selectedNodeIds, ['node_a', 'node_b']);

  project = moveNodes(project, ['node_a'], 15, -5);
  assert.deepEqual(nodeRect(project.document.nodes.node_a), {
    x: 25,
    y: 15,
    width: 100,
    height: 80,
  });

  project = resizeNode(project, 'node_a', 'se', 20, 10);
  assert.equal(nodeRect(project.document.nodes.node_a).width, 120);

  project = rotateNode(project, 'node_a', 405);
  assert.equal(project.document.nodes.node_a.transform?.rotation, 45);
});

test('locked nodes reject geometry but visibility and lock remain editor state', () => {
  let project = fixture();
  project = setNodeLocked(project, 'node_a', true);
  const same = moveNodes(project, ['node_a'], 20, 20);
  assert.deepEqual(
    nodeRect(same.document.nodes.node_a),
    nodeRect(project.document.nodes.node_a),
  );

  project = setNodeVisibility(project, 'node_a', false);
  assert.equal(project.document.nodes.node_a.transform?.visible, false);
});

test('layer reorder duplicate and delete preserve hierarchy lists', () => {
  let project = fixture();
  project = reorderNode(project, 'node_c', 0);
  assert.deepEqual(project.document.rootNodeIds, [
    'node_c',
    'node_a',
    'node_b',
  ]);

  project = duplicateNodes(project, ['node_a'], () => 'node_copy');
  assert.ok(project.document.nodes.node_copy);
  assert.equal(
    project.document.rootNodeIds[
      project.document.rootNodeIds.indexOf('node_a') + 1
    ],
    'node_copy',
  );

  project = deleteNodes(project, ['node_a']);
  assert.equal(project.document.nodes.node_a, undefined);
  assert.ok(!project.document.rootNodeIds.includes('node_a'));
});

test('grouping, nested layer order and ungrouping preserve semantic hierarchy', () => {
  let project = fixture();
  project = groupNodes(project, ['node_a', 'node_b'], 'group_ab', 'AB');

  assert.deepEqual(project.document.rootNodeIds, ['group_ab', 'node_c']);
  assert.deepEqual(project.document.nodes.group_ab.childIds, [
    'node_a',
    'node_b',
  ]);
  assert.equal(project.document.nodes.node_a.parentId, 'group_ab');
  assert.deepEqual(flattenLayerIds(project), [
    'group_ab',
    'node_a',
    'node_b',
    'node_c',
  ]);

  project = moveNodes(project, ['group_ab'], 10, 5);
  assert.equal(nodeRect(project.document.nodes.group_ab).x, 20);
  assert.equal(nodeRect(project.document.nodes.node_a).x, 20);
  assert.equal(nodeRect(project.document.nodes.node_b).x, 260);

  project = ungroupNodes(project, ['group_ab']);
  assert.deepEqual(project.document.rootNodeIds, [
    'node_a',
    'node_b',
    'node_c',
  ]);
  assert.equal(project.document.nodes.node_a.parentId, null);
  assert.equal(project.document.nodes.group_ab, undefined);
});

test('clipboard paste remaps ids and duplicated groups keep descendants', () => {
  let project = groupNodes(
    fixture(),
    ['node_a', 'node_b'],
    'group_ab',
    'AB',
  );
  let id = 0;
  project = duplicateNodes(
    project,
    ['group_ab'],
    () => 'dup_' + String(++id),
  );

  const duplicatedGroupId = project.editor?.selectedNodeIds?.[0];
  assert.ok(duplicatedGroupId);
  const duplicatedGroup = project.document.nodes[duplicatedGroupId!];
  assert.equal(duplicatedGroup.childIds?.length, 2);
  for (const childId of duplicatedGroup.childIds ?? []) {
    assert.equal(project.document.nodes[childId].parentId, duplicatedGroupId);
  }

  const clipboard = copyNodes(project, ['node_c']);
  project = pasteNodes(project, clipboard, () => 'paste_' + String(++id));
  assert.ok(
    project.document.rootNodeIds.some((rootId) => rootId.startsWith('paste_')),
  );
});

test('stack actions expose forward backward and front back semantics', () => {
  let project = fixture();
  project = moveNodeInStack(project, 'node_a', 'front');
  assert.equal(project.document.rootNodeIds.at(-1), 'node_a');
  project = moveNodeInStack(project, 'node_a', 'back');
  assert.equal(project.document.rootNodeIds[0], 'node_a');
  project = moveNodeInStack(project, 'node_a', 'forward');
  assert.equal(project.document.rootNodeIds[1], 'node_a');
});

test('alignment and distribution update only semantic transforms', () => {
  let project = fixture();
  project = alignNodes(project, ['node_a', 'node_b', 'node_c'], 'top');
  assert.equal(nodeRect(project.document.nodes.node_b).y, 20);

  project = fixture();
  project = alignNodes(
    project,
    ['node_a', 'node_b', 'node_c'],
    'distribute-horizontal',
  );
  const a = nodeRect(project.document.nodes.node_a);
  const b = nodeRect(project.document.nodes.node_b);
  const c = nodeRect(project.document.nodes.node_c);
  assert.ok(b.x > a.x + a.width);
  assert.ok(c.x > b.x + b.width);
});

test('snapping distinguishes canvas object and grid guides without persistence', () => {
  const project = fixture();

  const objectSnap = snapPosition(project, 'node_a', 249, 121, 2, 1000);
  assert.equal(objectSnap.x, 250);
  assert.equal(objectSnap.y, 120);
  assert.ok(objectSnap.guides.some((guide) => guide.source === 'object'));

  const canvasSnap = snapPosition(project, 'node_a', 1, 1, 2, 1000);
  assert.equal(canvasSnap.x, 0);
  assert.equal(canvasSnap.y, 0);
  assert.ok(canvasSnap.guides.some((guide) => guide.source === 'canvas'));

  const gridSnap = snapPosition(project, 'node_a', 81, 81, 2, 8);
  assert.equal(gridSnap.x, 80);
  assert.equal(gridSnap.y, 80);
  assert.ok(gridSnap.guides.some((guide) => guide.source === 'grid'));

  assert.equal(
    (project.document.nodes.node_a.props as { guides?: unknown }).guides,
    undefined,
  );
});

test('bounded command history groups semantic mutations into one undo redo step', () => {
  const project = fixture();
  const moved = moveNodes(project, ['node_a'], 100, 0);
  const history = new VisualHistory(2);

  history.commit(project, moved, 'Move');
  const undone = history.undo(moved);
  assert.equal(nodeRect(undone!.project.document.nodes.node_a).x, 10);

  const redone = history.redo(undone!.project);
  assert.equal(nodeRect(redone!.project.document.nodes.node_a).x, 110);
  assert.equal(history.entries[0], 'Move');
});

test('phase 3 persisted editor state rejects invalid transforms and dangling selection', () => {
  const project = fixture();
  project.document.nodes.node_a.transform!.width = 0;
  project.editor = {
    ...project.editor,
    selectedNodeIds: ['missing'],
  };

  const result = validateVisualProject(project);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === 'invalid-transform'));
  assert.ok(result.issues.some((issue) => issue.code === 'missing-selection'));
});
