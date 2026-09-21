import type { VisualNode, VisualProject, VisualTransform } from '../model';
import { createVisualNode } from '../project';
import { createVisualId } from '../ids';
import { clampTransform, nodeRect, resolvedTransform } from './geometry';

function touch(project: VisualProject): VisualProject {
  return { ...project, updatedAt: new Date().toISOString() };
}

function cloneNodes(project: VisualProject): Record<string, VisualNode> {
  return { ...project.document.nodes };
}

function withDocument(project: VisualProject, nodes: Record<string, VisualNode>, rootNodeIds = project.document.rootNodeIds): VisualProject {
  return touch({
    ...project,
    document: {
      ...project.document,
      nodes,
      rootNodeIds: [...rootNodeIds],
    },
  });
}

export function selectedNodeIds(project: VisualProject): string[] {
  return project.editor?.selectedNodeIds?.filter((id) => Boolean(project.document.nodes[id])) ?? [];
}

export function setVisualSelection(project: VisualProject, ids: string[]): VisualProject {
  const unique = [...new Set(ids)].filter((id) => Boolean(project.document.nodes[id]));
  return {
    ...project,
    editor: {
      ...project.editor,
      selectedNodeIds: unique,
    },
  };
}

export function addEditorPlaceholder(
  project: VisualProject,
  options: { id?: string; name?: string; x?: number; y?: number; width?: number; height?: number } = {},
): VisualProject {
  const index = project.document.rootNodeIds.length + 1;
  const node = createVisualNode(
    'group',
    {
      editorCorePlaceholder: true,
      label: options.name ?? `Layer ${index}`,
    },
    {
      id: options.id ?? createVisualId('layer'),
      name: options.name ?? `Layer ${index}`,
    },
  );
  node.transform = {
    x: options.x ?? 80 + ((index - 1) * 28) % Math.max(1, project.document.width - 260),
    y: options.y ?? 80 + ((index - 1) * 24) % Math.max(1, project.document.height - 180),
    width: options.width ?? 220,
    height: options.height ?? 132,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    zIndex: project.document.rootNodeIds.length,
  };

  const nodes = cloneNodes(project);
  nodes[node.id] = node;
  return setVisualSelection(
    withDocument(project, nodes, [...project.document.rootNodeIds, node.id]),
    [node.id],
  );
}

export function updateNodeTransform(
  project: VisualProject,
  nodeId: string,
  patch: Partial<VisualTransform>,
): VisualProject {
  const node = project.document.nodes[nodeId];
  if (!node) return project;
  const nodes = cloneNodes(project);
  nodes[nodeId] = {
    ...node,
    transform: clampTransform(
      { ...resolvedTransform(node.transform), ...patch },
      project.document.width,
      project.document.height,
    ),
  };
  return withDocument(project, nodes);
}

export function updateSelectedTransforms(
  project: VisualProject,
  patcher: (transform: Required<VisualTransform>, node: VisualNode) => Partial<VisualTransform>,
): VisualProject {
  let next = project;
  for (const id of selectedNodeIds(project)) {
    const node = next.document.nodes[id];
    if (!node || resolvedTransform(node.transform).locked) continue;
    next = updateNodeTransform(next, id, patcher(resolvedTransform(node.transform), node));
  }
  return next;
}

export function updateSelectedNodeState(
  project: VisualProject,
  patch: Partial<Pick<VisualTransform, 'visible' | 'locked'>>,
): VisualProject {
  let next = project;
  for (const id of selectedNodeIds(project)) {
    if (!next.document.nodes[id]) continue;
    next = updateNodeTransform(next, id, patch);
  }
  return next;
}

function descendantIds(project: VisualProject, id: string, out = new Set<string>()): Set<string> {
  if (out.has(id)) return out;
  out.add(id);
  for (const childId of project.document.nodes[id]?.childIds ?? []) descendantIds(project, childId, out);
  return out;
}

export function deleteSelectedNodes(project: VisualProject): VisualProject {
  const selected = selectedNodeIds(project);
  if (!selected.length) return project;
  const remove = new Set<string>();
  selected.forEach((id) => descendantIds(project, id, remove));
  const nodes = cloneNodes(project);

  for (const id of remove) delete nodes[id];
  for (const [id, node] of Object.entries(nodes)) {
    if (!node.childIds?.some((childId) => remove.has(childId))) continue;
    nodes[id] = { ...node, childIds: node.childIds.filter((childId) => !remove.has(childId)) };
  }

  const rootNodeIds = project.document.rootNodeIds.filter((id) => !remove.has(id));
  return setVisualSelection(withDocument(project, nodes, rootNodeIds), []);
}

export function duplicateSelectedNodes(project: VisualProject, offset = 24): VisualProject {
  const selected = selectedNodeIds(project);
  if (!selected.length) return project;
  const nodes = cloneNodes(project);
  const roots = [...project.document.rootNodeIds];
  const newSelection: string[] = [];

  for (const id of selected) {
    const source = project.document.nodes[id];
    if (!source) continue;
    const newId = createVisualId(source.kind);
    const transform = resolvedTransform(source.transform);
    nodes[newId] = {
      ...source,
      id: newId,
      name: source.name ? `${source.name} copy` : 'Layer copy',
      parentId: null,
      childIds: [],
      transform: clampTransform(
        { ...transform, x: transform.x + offset, y: transform.y + offset, zIndex: roots.length },
        project.document.width,
        project.document.height,
      ),
      props: { ...source.props },
    };
    roots.push(newId);
    newSelection.push(newId);
  }

  return setVisualSelection(withDocument(project, nodes, roots), newSelection);
}

export function reorderRootNode(project: VisualProject, nodeId: string, direction: 'forward' | 'backward' | 'front' | 'back'): VisualProject {
  const roots = [...project.document.rootNodeIds];
  const index = roots.indexOf(nodeId);
  if (index < 0) return project;

  if (direction === 'forward' && index < roots.length - 1) {
    [roots[index], roots[index + 1]] = [roots[index + 1], roots[index]];
  } else if (direction === 'backward' && index > 0) {
    [roots[index], roots[index - 1]] = [roots[index - 1], roots[index]];
  } else if (direction === 'front' && index < roots.length - 1) {
    roots.splice(index, 1);
    roots.push(nodeId);
  } else if (direction === 'back' && index > 0) {
    roots.splice(index, 1);
    roots.unshift(nodeId);
  } else {
    return project;
  }

  const nodes = cloneNodes(project);
  roots.forEach((id, zIndex) => {
    const node = nodes[id];
    if (node) nodes[id] = { ...node, transform: { ...resolvedTransform(node.transform), zIndex } };
  });
  return withDocument(project, nodes, roots);
}

export function moveSelectedNodes(project: VisualProject, dx: number, dy: number): VisualProject {
  return updateSelectedTransforms(project, (transform) => ({
    x: transform.x + dx,
    y: transform.y + dy,
  }));
}

export type AlignMode = 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom';
export type DistributeMode = 'horizontal' | 'vertical';

export function alignSelectedNodes(project: VisualProject, mode: AlignMode): VisualProject {
  const ids = selectedNodeIds(project);
  if (ids.length < 2) return project;
  const rects = ids
    .filter((id) => !resolvedTransform(project.document.nodes[id]?.transform).locked)
    .map((id) => ({ id, rect: nodeRect(project.document.nodes[id]?.transform) }));
  if (rects.length < 2) return project;
  const left = Math.min(...rects.map(({ rect }) => rect.x));
  const right = Math.max(...rects.map(({ rect }) => rect.x + rect.width));
  const top = Math.min(...rects.map(({ rect }) => rect.y));
  const bottom = Math.max(...rects.map(({ rect }) => rect.y + rect.height));
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  let next = project;
  for (const { id, rect } of rects) {
    let patch: Partial<VisualTransform> = {};
    if (mode === 'left') patch = { x: left };
    if (mode === 'center-x') patch = { x: centerX - rect.width / 2 };
    if (mode === 'right') patch = { x: right - rect.width };
    if (mode === 'top') patch = { y: top };
    if (mode === 'center-y') patch = { y: centerY - rect.height / 2 };
    if (mode === 'bottom') patch = { y: bottom - rect.height };
    next = updateNodeTransform(next, id, patch);
  }
  return next;
}

export function distributeSelectedNodes(project: VisualProject, mode: DistributeMode): VisualProject {
  const ids = selectedNodeIds(project);
  if (ids.length < 3) return project;

  const items = ids
    .filter((id) => !resolvedTransform(project.document.nodes[id]?.transform).locked)
    .map((id) => ({ id, rect: nodeRect(project.document.nodes[id]?.transform) }));
  if (items.length < 3) return project;
  const sorted = [...items].sort((a, b) =>
    mode === 'horizontal' ? a.rect.x - b.rect.x : a.rect.y - b.rect.y,
  );

  if (mode === 'horizontal') {
    const first = sorted[0].rect;
    const last = sorted[sorted.length - 1].rect;
    const occupied = sorted.reduce((sum, item) => sum + item.rect.width, 0);
    const span = last.x + last.width - first.x;
    const gap = (span - occupied) / (sorted.length - 1);
    let cursor = first.x;
    let next = project;
    for (const item of sorted) {
      next = updateNodeTransform(next, item.id, { x: cursor });
      cursor += item.rect.width + gap;
    }
    return next;
  }

  const first = sorted[0].rect;
  const last = sorted[sorted.length - 1].rect;
  const occupied = sorted.reduce((sum, item) => sum + item.rect.height, 0);
  const span = last.y + last.height - first.y;
  const gap = (span - occupied) / (sorted.length - 1);
  let cursor = first.y;
  let next = project;
  for (const item of sorted) {
    next = updateNodeTransform(next, item.id, { y: cursor });
    cursor += item.rect.height + gap;
  }
  return next;
}
