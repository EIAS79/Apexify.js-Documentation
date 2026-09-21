import type { VisualNode, VisualProject, VisualTransform } from '../model';

export type AlignMode =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'
  | 'distribute-horizontal'
  | 'distribute-vertical';
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export type EditorSnapshot = { project: VisualProject; label: string };
export type SnapGuide = { axis: 'x' | 'y'; value: number; source: 'canvas' | 'object' | 'grid' };
export type SnapResult = { x: number; y: number; guides: SnapGuide[] };
export type VisualClipboard = { roots: string[]; nodes: Record<string, VisualNode> };

export const DEFAULT_NODE_SIZE = { width: 160, height: 100 };
export const DEFAULT_SNAP_THRESHOLD = 6;

const clone = <T>(value: T): T => structuredClone(value);
const n = (value: number | undefined, fallback: number) =>
  Number.isFinite(value) ? value! : fallback;

export const nodeRect = (node: VisualNode) => ({
  x: n(node.transform?.x, 0),
  y: n(node.transform?.y, 0),
  width: Math.max(1, n(node.transform?.width, DEFAULT_NODE_SIZE.width)),
  height: Math.max(1, n(node.transform?.height, DEFAULT_NODE_SIZE.height)),
});

const roots = (project: VisualProject) => project.document.rootNodeIds;
const siblings = (project: VisualProject, node: VisualNode): string[] =>
  node.parentId
    ? (project.document.nodes[node.parentId]?.childIds ?? [])
    : roots(project);

function collectDescendants(project: VisualProject, id: string, out: Set<string>) {
  if (out.has(id)) return;
  const node = project.document.nodes[id];
  if (!node) return;
  out.add(id);
  for (const childId of node.childIds ?? []) collectDescendants(project, childId, out);
}

export function flattenLayerIds(project: VisualProject): string[] {
  const result: string[] = [];
  const visit = (id: string) => {
    const node = project.document.nodes[id];
    if (!node) return;
    result.push(id);
    for (const childId of node.childIds ?? []) visit(childId);
  };
  for (const rootId of project.document.rootNodeIds) visit(rootId);
  return result;
}

export function patchNodeTransform(
  project: VisualProject,
  id: string,
  patch: Partial<VisualTransform>,
): VisualProject {
  const node = project.document.nodes[id];
  if (!node || node.transform?.locked) return project;
  const next = clone(project);
  next.document.nodes[id].transform = {
    ...next.document.nodes[id].transform,
    ...patch,
  };
  return next;
}

export function setSelection(project: VisualProject, ids: string[]): VisualProject {
  const next = clone(project);
  next.editor = {
    ...next.editor,
    selectedNodeIds: [
      ...new Set(ids.filter((id) => Boolean(next.document.nodes[id]))),
    ],
  };
  return next;
}

export function toggleSelection(project: VisualProject, id: string): VisualProject {
  const selected = project.editor?.selectedNodeIds ?? [];
  return setSelection(
    project,
    selected.includes(id)
      ? selected.filter((currentId) => currentId !== id)
      : [...selected, id],
  );
}

function moveNodeAndDescendants(
  project: VisualProject,
  id: string,
  dx: number,
  dy: number,
  visited: Set<string>,
): VisualProject {
  if (visited.has(id)) return project;
  const node = project.document.nodes[id];
  if (!node || node.transform?.locked) return project;
  visited.add(id);
  let next = project;
  const rect = nodeRect(node);
  next = patchNodeTransform(next, id, { x: rect.x + dx, y: rect.y + dy });
  for (const childId of node.childIds ?? []) {
    next = moveNodeAndDescendants(next, childId, dx, dy, visited);
  }
  return next;
}

export function moveNodes(
  project: VisualProject,
  ids: string[],
  dx: number,
  dy: number,
): VisualProject {
  let next = project;
  const visited = new Set<string>();
  for (const id of ids) next = moveNodeAndDescendants(next, id, dx, dy, visited);
  return next;
}

export function resizeNode(
  project: VisualProject,
  id: string,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  keepAspect = false,
): VisualProject {
  const node = project.document.nodes[id];
  if (!node || node.transform?.locked) return project;
  const rect = nodeRect(node);
  let { x, y, width, height } = rect;

  if (handle.includes('e')) width += dx;
  if (handle.includes('s')) height += dy;
  if (handle.includes('w')) {
    x += dx;
    width -= dx;
  }
  if (handle.includes('n')) {
    y += dy;
    height -= dy;
  }

  width = Math.max(8, width);
  height = Math.max(8, height);

  if (keepAspect) {
    const ratio = rect.width / rect.height;
    if (Math.abs(dx) >= Math.abs(dy)) height = width / ratio;
    else width = height * ratio;
  }

  return patchNodeTransform(project, id, { x, y, width, height });
}

export function rotateNode(
  project: VisualProject,
  id: string,
  rotation: number,
): VisualProject {
  return patchNodeTransform(project, id, {
    rotation: ((rotation % 360) + 360) % 360,
  });
}

export function setNodeVisibility(
  project: VisualProject,
  id: string,
  visible: boolean,
): VisualProject {
  const node = project.document.nodes[id];
  if (!node) return project;
  const next = clone(project);
  next.document.nodes[id].transform = { ...node.transform, visible };
  return next;
}

export function setNodeLocked(
  project: VisualProject,
  id: string,
  locked: boolean,
): VisualProject {
  const node = project.document.nodes[id];
  if (!node) return project;
  const next = clone(project);
  next.document.nodes[id].transform = { ...node.transform, locked };
  return next;
}

export function renameNode(
  project: VisualProject,
  id: string,
  name: string,
): VisualProject {
  if (!project.document.nodes[id]) return project;
  const next = clone(project);
  next.document.nodes[id].name =
    name.trim() || next.document.nodes[id].kind;
  return next;
}

export function reorderNode(
  project: VisualProject,
  id: string,
  toIndex: number,
): VisualProject {
  const node = project.document.nodes[id];
  if (!node) return project;
  const next = clone(project);
  const nextNode = next.document.nodes[id];
  const list = siblings(next, nextNode);
  const from = list.indexOf(id);
  if (from < 0) return project;
  list.splice(from, 1);
  list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, id);
  list.forEach((nodeId, index) => {
    next.document.nodes[nodeId].transform = {
      ...next.document.nodes[nodeId].transform,
      zIndex: index,
    };
  });
  return next;
}

export function moveNodeInStack(
  project: VisualProject,
  id: string,
  mode: 'forward' | 'backward' | 'front' | 'back',
): VisualProject {
  const node = project.document.nodes[id];
  if (!node) return project;
  const list = siblings(project, node);
  const index = list.indexOf(id);
  if (index < 0) return project;
  const target =
    mode === 'front'
      ? list.length - 1
      : mode === 'back'
        ? 0
        : mode === 'forward'
          ? Math.min(list.length - 1, index + 1)
          : Math.max(0, index - 1);
  return reorderNode(project, id, target);
}

function duplicateSubtree(
  project: VisualProject,
  next: VisualProject,
  sourceId: string,
  parentId: string | null | undefined,
  idFactory: (source: VisualNode) => string,
  offset: number,
): string | null {
  const source = project.document.nodes[sourceId];
  if (!source) return null;
  const copy = clone(source);
  const newId = idFactory(source);
  copy.id = newId;
  copy.name = (source.name ?? source.kind) + ' copy';
  copy.parentId = parentId ?? null;
  copy.childIds = [];
  const rect = nodeRect(source);
  copy.transform = {
    ...source.transform,
    x: rect.x + offset,
    y: rect.y + offset,
  };
  next.document.nodes[newId] = copy;
  for (const childId of source.childIds ?? []) {
    const duplicatedChild = duplicateSubtree(
      project,
      next,
      childId,
      newId,
      idFactory,
      offset,
    );
    if (duplicatedChild) copy.childIds.push(duplicatedChild);
  }
  return newId;
}

export function duplicateNodes(
  project: VisualProject,
  ids: string[],
  idFactory: (source: VisualNode) => string,
): VisualProject {
  const next = clone(project);
  const selected = new Set(ids);
  const rootsToDuplicate = ids.filter((id) => {
    let parentId = project.document.nodes[id]?.parentId ?? null;
    while (parentId) {
      if (selected.has(parentId)) return false;
      parentId = project.document.nodes[parentId]?.parentId ?? null;
    }
    return Boolean(project.document.nodes[id]);
  });
  const created: string[] = [];

  for (const id of rootsToDuplicate) {
    const source = project.document.nodes[id];
    if (!source) continue;
    const newId = duplicateSubtree(
      project,
      next,
      id,
      source.parentId,
      idFactory,
      16,
    );
    if (!newId) continue;
    const list = source.parentId
      ? (next.document.nodes[source.parentId]?.childIds ??
        next.document.rootNodeIds)
      : next.document.rootNodeIds;
    const at = list.indexOf(id);
    list.splice(at + 1, 0, newId);
    created.push(newId);
  }

  next.editor = { ...next.editor, selectedNodeIds: created };
  return next;
}

export function deleteNodes(
  project: VisualProject,
  ids: string[],
): VisualProject {
  const next = clone(project);
  const doomed = new Set<string>();
  ids.forEach((id) => collectDescendants(next, id, doomed));

  for (const id of doomed) delete next.document.nodes[id];
  next.document.rootNodeIds = next.document.rootNodeIds.filter(
    (id) => !doomed.has(id),
  );
  for (const node of Object.values(next.document.nodes)) {
    node.childIds = node.childIds?.filter((id) => !doomed.has(id));
  }
  next.editor = {
    ...next.editor,
    selectedNodeIds: (next.editor?.selectedNodeIds ?? []).filter(
      (id) => !doomed.has(id),
    ),
  };
  return next;
}

export function groupNodes(
  project: VisualProject,
  ids: string[],
  groupId: string,
  name = 'Group',
): VisualProject {
  const unique = [...new Set(ids)].filter((id) => Boolean(project.document.nodes[id]));
  if (unique.length < 2) return project;
  const first = project.document.nodes[unique[0]];
  const parentId = first.parentId ?? null;
  if (
    unique.some(
      (id) => (project.document.nodes[id]?.parentId ?? null) !== parentId,
    )
  ) {
    return project;
  }

  const next = clone(project);
  const list = parentId
    ? (next.document.nodes[parentId]?.childIds ?? [])
    : next.document.rootNodeIds;
  const selectedSet = new Set(unique);
  const selectedIndices = unique
    .map((id) => list.indexOf(id))
    .filter((index) => index >= 0);
  if (selectedIndices.length !== unique.length) return project;

  const rects = unique.map((id) => nodeRect(next.document.nodes[id]));
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
  const insertionIndex = Math.min(...selectedIndices);

  const group: VisualNode = {
    id: groupId,
    kind: 'group',
    name,
    parentId,
    childIds: unique,
    transform: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
    props: {},
  };
  next.document.nodes[groupId] = group;

  for (const id of unique) next.document.nodes[id].parentId = groupId;
  const remaining = list.filter((id) => !selectedSet.has(id));
  remaining.splice(insertionIndex, 0, groupId);
  if (parentId) next.document.nodes[parentId].childIds = remaining;
  else next.document.rootNodeIds = remaining;

  next.editor = { ...next.editor, selectedNodeIds: [groupId] };
  return next;
}

export function ungroupNodes(
  project: VisualProject,
  ids: string[],
): VisualProject {
  let next = clone(project);
  const groups = ids
    .map((id) => next.document.nodes[id])
    .filter(
      (node): node is VisualNode =>
        Boolean(node && node.kind === 'group' && (node.childIds?.length ?? 0) > 0),
    );

  if (!groups.length) return project;

  const selectedAfter: string[] = [];
  for (const group of groups) {
    const parentId = group.parentId ?? null;
    const list = parentId
      ? (next.document.nodes[parentId]?.childIds ?? [])
      : next.document.rootNodeIds;
    const index = list.indexOf(group.id);
    if (index < 0) continue;
    const children = group.childIds ?? [];
    list.splice(index, 1, ...children);
    for (const childId of children) {
      const child = next.document.nodes[childId];
      if (child) child.parentId = parentId;
      selectedAfter.push(childId);
    }
    delete next.document.nodes[group.id];
  }

  next.editor = { ...next.editor, selectedNodeIds: selectedAfter };
  return next;
}

export function copyNodes(
  project: VisualProject,
  ids: string[],
): VisualClipboard {
  const selected = new Set(ids);
  const rootIds = ids.filter((id) => {
    const node = project.document.nodes[id];
    if (!node) return false;
    let parentId = node.parentId ?? null;
    while (parentId) {
      if (selected.has(parentId)) return false;
      parentId = project.document.nodes[parentId]?.parentId ?? null;
    }
    return true;
  });

  const copiedIds = new Set<string>();
  for (const id of rootIds) collectDescendants(project, id, copiedIds);
  const nodes: Record<string, VisualNode> = {};
  for (const id of copiedIds) nodes[id] = clone(project.document.nodes[id]);
  return { roots: rootIds, nodes };
}

export function pasteNodes(
  project: VisualProject,
  clipboard: VisualClipboard,
  idFactory: (source: VisualNode) => string,
): VisualProject {
  if (!clipboard.roots.length) return project;
  const next = clone(project);
  const idMap = new Map<string, string>();
  for (const [oldId, source] of Object.entries(clipboard.nodes)) {
    idMap.set(oldId, idFactory(source));
  }

  for (const [oldId, source] of Object.entries(clipboard.nodes)) {
    const copy = clone(source);
    const newId = idMap.get(oldId)!;
    copy.id = newId;
    copy.name = (source.name ?? source.kind) + ' copy';
    copy.parentId =
      source.parentId && idMap.has(source.parentId)
        ? idMap.get(source.parentId)!
        : null;
    copy.childIds = (source.childIds ?? [])
      .map((childId) => idMap.get(childId))
      .filter((childId): childId is string => Boolean(childId));
    const rect = nodeRect(source);
    copy.transform = {
      ...source.transform,
      x: rect.x + 20,
      y: rect.y + 20,
    };
    next.document.nodes[newId] = copy;
  }

  const newRoots = clipboard.roots
    .map((id) => idMap.get(id))
    .filter((id): id is string => Boolean(id));
  next.document.rootNodeIds.push(...newRoots);
  next.editor = { ...next.editor, selectedNodeIds: newRoots };
  return next;
}

export function alignNodes(
  project: VisualProject,
  ids: string[],
  mode: AlignMode,
): VisualProject {
  const nodes = ids
    .map((id) => project.document.nodes[id])
    .filter((node): node is VisualNode => Boolean(node));
  if (nodes.length < 2) return project;

  const rects = nodes.map(nodeRect);
  let next = project;

  if (mode === 'distribute-horizontal' || mode === 'distribute-vertical') {
    if (nodes.length < 3) return project;
    const horizontal = mode === 'distribute-horizontal';
    const sorted = nodes
      .map((node, index) => ({ node, rect: rects[index] }))
      .sort((a, b) =>
        horizontal ? a.rect.x - b.rect.x : a.rect.y - b.rect.y,
      );
    const first = sorted[0].rect;
    const last = sorted[sorted.length - 1].rect;
    const span = horizontal
      ? last.x + last.width - first.x
      : last.y + last.height - first.y;
    const occupied = sorted.reduce(
      (sum, item) =>
        sum + (horizontal ? item.rect.width : item.rect.height),
      0,
    );
    const gap = (span - occupied) / (sorted.length - 1);
    let cursor = horizontal ? first.x : first.y;
    for (const item of sorted) {
      next = patchNodeTransform(
        next,
        item.node.id,
        horizontal ? { x: cursor } : { y: cursor },
      );
      cursor +=
        (horizontal ? item.rect.width : item.rect.height) + gap;
    }
    return next;
  }

  const minX = Math.min(...rects.map((rect) => rect.x));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

  for (const node of nodes) {
    const rect = nodeRect(node);
    let patch: Partial<VisualTransform> = {};
    if (mode === 'left') patch = { x: minX };
    if (mode === 'center') patch = { x: (minX + maxX - rect.width) / 2 };
    if (mode === 'right') patch = { x: maxX - rect.width };
    if (mode === 'top') patch = { y: minY };
    if (mode === 'middle') patch = { y: (minY + maxY - rect.height) / 2 };
    if (mode === 'bottom') patch = { y: maxY - rect.height };
    next = patchNodeTransform(next, node.id, patch);
  }
  return next;
}

type SnapCandidate = {
  value: number;
  source: SnapGuide['source'];
};

function nearestCandidate(
  candidates: SnapCandidate[],
  value: number,
): SnapCandidate {
  return candidates.reduce((nearest, candidate) =>
    Math.abs(candidate.value - value) < Math.abs(nearest.value - value)
      ? candidate
      : nearest,
  );
}

export function snapPosition(
  project: VisualProject,
  id: string,
  x: number,
  y: number,
  threshold = DEFAULT_SNAP_THRESHOLD,
  grid = 8,
): SnapResult {
  const node = project.document.nodes[id];
  if (!node) return { x, y, guides: [] };

  const rect = nodeRect(node);
  const guides: SnapGuide[] = [];
  let snappedX = x;
  let snappedY = y;

  const xCandidates: SnapCandidate[] = [
    { value: 0, source: 'canvas' },
    {
      value: project.document.width / 2 - rect.width / 2,
      source: 'canvas',
    },
    { value: project.document.width - rect.width, source: 'canvas' },
  ];
  const yCandidates: SnapCandidate[] = [
    { value: 0, source: 'canvas' },
    {
      value: project.document.height / 2 - rect.height / 2,
      source: 'canvas',
    },
    { value: project.document.height - rect.height, source: 'canvas' },
  ];

  for (const other of Object.values(project.document.nodes)) {
    if (
      other.id === id ||
      other.transform?.visible === false ||
      (other.kind === 'group' && (other.childIds?.length ?? 0) > 0)
    ) {
      continue;
    }
    const otherRect = nodeRect(other);
    xCandidates.push(
      { value: otherRect.x, source: 'object' },
      {
        value: otherRect.x + otherRect.width / 2 - rect.width / 2,
        source: 'object',
      },
      {
        value: otherRect.x + otherRect.width - rect.width,
        source: 'object',
      },
    );
    yCandidates.push(
      { value: otherRect.y, source: 'object' },
      {
        value: otherRect.y + otherRect.height / 2 - rect.height / 2,
        source: 'object',
      },
      {
        value: otherRect.y + otherRect.height - rect.height,
        source: 'object',
      },
    );
  }

  xCandidates.push({ value: Math.round(x / grid) * grid, source: 'grid' });
  yCandidates.push({ value: Math.round(y / grid) * grid, source: 'grid' });

  const targetX = nearestCandidate(xCandidates, x);
  const targetY = nearestCandidate(yCandidates, y);

  if (Math.abs(targetX.value - x) <= threshold) {
    snappedX = targetX.value;
    guides.push({
      axis: 'x',
      value: targetX.value,
      source: targetX.source,
    });
  }
  if (Math.abs(targetY.value - y) <= threshold) {
    snappedY = targetY.value;
    guides.push({
      axis: 'y',
      value: targetY.value,
      source: targetY.source,
    });
  }

  return { x: snappedX, y: snappedY, guides };
}

export class VisualHistory {
  private past: EditorSnapshot[] = [];
  private future: EditorSnapshot[] = [];

  constructor(private limit = 100) {}

  commit(before: VisualProject, after: VisualProject, label: string) {
    if (before === after || JSON.stringify(before) === JSON.stringify(after)) {
      return;
    }
    this.past.push({ project: clone(before), label });
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: VisualProject) {
    const item = this.past.pop();
    if (!item) return null;
    this.future.push({ project: clone(current), label: item.label });
    return { project: clone(item.project), label: item.label };
  }

  redo(current: VisualProject) {
    const item = this.future.pop();
    if (!item) return null;
    this.past.push({ project: clone(current), label: item.label });
    return { project: clone(item.project), label: item.label };
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }

  get entries() {
    return [...this.past].reverse().map((entry) => entry.label);
  }
}
