import type {
  VisualNode,
  VisualProject,
  VisualProjectIssue,
  VisualProjectRecord,
  VisualTransform,
  VisualValue,
} from './model';
import { createVisualId, sanitizeVisualIdPart } from './ids';
import { visualImageProps } from './image-contract';
import { visualTextProps } from './text-contract';
import { visualChartProps } from './chart-contract';
import { visualPathProps } from './path-pixel-contract';

export const PHASE9_COMPONENT_DEFINITION_KIND = 'component-definition';
export const PHASE9_TEMPLATE_DEFINITION_KIND = 'template-definition';
export const PHASE9_NAMED_ASSET_KIND = 'named-asset';
export const PHASE9_VARIABLE_KIND = 'studio-variable';

export type Phase9Placeholder = {
  id: string;
  name: string;
  nodeId: string;
  path: string;
  defaultValue?: VisualValue;
};

export type Phase9Definition = {
  id: string;
  kind: 'component' | 'template';
  name: string;
  width: number;
  height: number;
  rootNodeIds: string[];
  nodes: Record<string, VisualNode>;
  placeholders: Phase9Placeholder[];
};

export type Phase9InstanceProps = {
  definitionId: string;
  data?: Record<string, VisualValue>;
  overrides?: Record<string, Record<string, VisualValue>>;
  insertions?: Array<{
    targetId: string;
    position: 'before' | 'after';
    layers: Phase9SceneLayer | Phase9SceneLayer[];
  }>;
};

export type Phase9CaptureResult = {
  project: VisualProject;
  definitionId: string;
  instanceId: string;
};

export type Phase9SceneLayer = Record<string, VisualValue>;
export type Phase9SceneDefinition = {
  width: number;
  height: number;
  background?: Record<string, VisualValue>;
  layers: Phase9SceneLayer[];
};

const DEFINITION_KINDS = new Set([
  PHASE9_COMPONENT_DEFINITION_KIND,
  PHASE9_TEMPLATE_DEFINITION_KIND,
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nowProject(project: VisualProject): VisualProject {
  project.updatedAt = new Date().toISOString();
  return project;
}

function recordObject(value: unknown): Record<string, VisualValue> {
  return (value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {}) as Record<string, VisualValue>;
}

function recordArray(value: unknown): Array<Record<string, VisualValue>> {
  return Array.isArray(value)
    ? value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as Array<Record<string, VisualValue>>
    : [];
}

function definitionRecord(definition: Phase9Definition): VisualProjectRecord {
  return {
    id: definition.id,
    kind:
      definition.kind === 'template'
        ? PHASE9_TEMPLATE_DEFINITION_KIND
        : PHASE9_COMPONENT_DEFINITION_KIND,
    name: definition.name,
    value: {
      width: definition.width,
      height: definition.height,
      rootNodeIds: definition.rootNodeIds,
      nodes: definition.nodes as unknown as Record<string, VisualValue>,
      placeholders: definition.placeholders as unknown as VisualValue[],
    },
  };
}

function parseDefinition(record: VisualProjectRecord): Phase9Definition | null {
  if (!DEFINITION_KINDS.has(record.kind)) return null;
  const value = record.value ?? {};
  const nodesRaw = value.nodes;
  const rootsRaw = value.rootNodeIds;
  if (
    !nodesRaw ||
    typeof nodesRaw !== 'object' ||
    Array.isArray(nodesRaw) ||
    !Array.isArray(rootsRaw)
  ) {
    return null;
  }
  const nodes = nodesRaw as unknown as Record<string, VisualNode>;
  const rootNodeIds = rootsRaw.filter((item): item is string => typeof item === 'string');
  const placeholders = recordArray(value.placeholders).map((item) => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    nodeId: String(item.nodeId ?? ''),
    path: String(item.path ?? ''),
    ...(item.defaultValue !== undefined ? { defaultValue: item.defaultValue } : {}),
  })).filter((item) => item.id && item.name && item.nodeId && item.path);
  return {
    id: record.id,
    kind: record.kind === PHASE9_TEMPLATE_DEFINITION_KIND ? 'template' : 'component',
    name: record.name ?? (record.kind === PHASE9_TEMPLATE_DEFINITION_KIND ? 'Template' : 'Component'),
    width: typeof value.width === 'number' ? value.width : 1,
    height: typeof value.height === 'number' ? value.height : 1,
    rootNodeIds,
    nodes: clone(nodes),
    placeholders,
  };
}

export function phase9Definitions(project: VisualProject): Phase9Definition[] {
  return project.operations.map(parseDefinition).filter((item): item is Phase9Definition => Boolean(item));
}

export function phase9Definition(project: VisualProject, id: string): Phase9Definition | null {
  return phase9Definitions(project).find((item) => item.id === id) ?? null;
}

export function phase9ComponentDefinitions(project: VisualProject): Phase9Definition[] {
  return phase9Definitions(project).filter((item) => item.kind === 'component');
}

export function phase9TemplateDefinitions(project: VisualProject): Phase9Definition[] {
  return phase9Definitions(project).filter((item) => item.kind === 'template');
}

function nodeRect(node: VisualNode) {
  const transform = node.transform ?? {};
  const width = Math.max(1, (transform.width ?? 160) * (transform.scaleX ?? 1));
  const height = Math.max(1, (transform.height ?? 100) * (transform.scaleY ?? 1));
  return {
    x: transform.x ?? 0,
    y: transform.y ?? 0,
    width,
    height,
  };
}

function collectSubtree(project: VisualProject, rootIds: string[]): Record<string, VisualNode> {
  const out: Record<string, VisualNode> = {};
  const visit = (id: string) => {
    const node = project.document.nodes[id];
    if (!node || out[id]) return;
    out[id] = clone(node);
    for (const childId of node.childIds ?? []) visit(childId);
  };
  rootIds.forEach(visit);
  return out;
}

function topLevelSelection(project: VisualProject, selectedIds: string[]) {
  const selected = new Set(selectedIds.filter((id) => Boolean(project.document.nodes[id])));
  return [...selected].filter((id) => {
    let parentId = project.document.nodes[id]?.parentId ?? null;
    while (parentId) {
      if (selected.has(parentId)) return false;
      parentId = project.document.nodes[parentId]?.parentId ?? null;
    }
    return true;
  });
}

function parentList(project: VisualProject, parentId: string | null): string[] {
  return parentId
    ? project.document.nodes[parentId]?.childIds ?? []
    : project.document.rootNodeIds;
}

function setParentList(project: VisualProject, parentId: string | null, ids: string[]) {
  if (parentId) {
    const parent = project.document.nodes[parentId];
    if (parent) parent.childIds = ids;
  } else {
    project.document.rootNodeIds = ids;
  }
}

function selectionBounds(nodes: Record<string, VisualNode>, rootIds: string[]) {
  const rects = rootIds.map((id) => nodeRect(nodes[id])).filter(Boolean);
  if (!rects.length) return { x: 0, y: 0, width: 1, height: 1 };
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function rebaseSnapshot(nodes: Record<string, VisualNode>, dx: number, dy: number) {
  for (const node of Object.values(nodes)) {
    node.transform = {
      ...(node.transform ?? {}),
      x: (node.transform?.x ?? 0) - dx,
      y: (node.transform?.y ?? 0) - dy,
    };
  }
  return nodes;
}

function removeSubtree(project: VisualProject, rootId: string) {
  const node = project.document.nodes[rootId];
  if (!node) return;
  for (const childId of node.childIds ?? []) removeSubtree(project, childId);
  delete project.document.nodes[rootId];
}

function captureDefinition(
  project: VisualProject,
  selectedIds: string[],
  kind: 'component' | 'template',
  name: string,
): Phase9CaptureResult {
  const roots = topLevelSelection(project, selectedIds);
  if (!roots.length) throw new Error('Select at least one layer to create a ' + kind + '.');
  const parentId = project.document.nodes[roots[0]]?.parentId ?? null;
  if (roots.some((id) => (project.document.nodes[id]?.parentId ?? null) !== parentId)) {
    throw new Error('A component/template selection must share one parent.');
  }

  const siblings = parentList(project, parentId);
  const insertionIndex = Math.min(...roots.map((id) => siblings.indexOf(id)).filter((index) => index >= 0));
  const snapshot = collectSubtree(project, roots);
  const bounds = selectionBounds(snapshot, roots);
  rebaseSnapshot(snapshot, bounds.x, bounds.y);

  for (const rootId of roots) {
    if (snapshot[rootId]) snapshot[rootId].parentId = null;
  }

  const definitionId = createVisualId(kind === 'template' ? 'template' : 'component');
  const definition: Phase9Definition = {
    id: definitionId,
    kind,
    name: name.trim() || (kind === 'template' ? 'Template' : 'Component'),
    width: bounds.width,
    height: bounds.height,
    rootNodeIds: roots,
    nodes: snapshot,
    placeholders: [],
  };

  const next = clone(project);
  next.operations = [
    ...next.operations.filter((record) => record.id !== definitionId),
    definitionRecord(definition),
  ];
  roots.forEach((id) => removeSubtree(next, id));

  const instanceId = createVisualId(kind === 'template' ? 'template-instance' : 'component');
  next.document.nodes[instanceId] = {
    id: instanceId,
    kind: kind === 'template' ? 'template-instance' : 'component',
    name: definition.name,
    parentId,
    transform: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
    props: {
      definitionId,
      data: {},
      overrides: {},
      insertions: [],
    },
  };
  const nextSiblings = siblings.filter((id) => !roots.includes(id));
  nextSiblings.splice(Math.max(0, insertionIndex), 0, instanceId);
  setParentList(next, parentId, nextSiblings);
  next.editor = { ...next.editor, selectedNodeIds: [instanceId] };
  return {
    project: nowProject(next),
    definitionId,
    instanceId,
  };
}

export function capturePhase9Component(
  project: VisualProject,
  selectedIds: string[],
  name = 'Component',
): Phase9CaptureResult {
  return captureDefinition(project, selectedIds, 'component', name);
}

export function capturePhase9Template(
  project: VisualProject,
  selectedIds: string[],
  name = 'Template',
): Phase9CaptureResult {
  return captureDefinition(project, selectedIds, 'template', name);
}

export function instantiatePhase9Definition(
  project: VisualProject,
  definitionId: string,
  options: { x?: number; y?: number; parentId?: string | null; name?: string } = {},
): VisualProject {
  const definition = phase9Definition(project, definitionId);
  if (!definition) throw new Error('Unknown component/template definition "' + definitionId + '".');
  const next = clone(project);
  const id = createVisualId(definition.kind === 'template' ? 'template-instance' : 'component');
  const parentId = options.parentId ?? null;
  if (parentId && !next.document.nodes[parentId]) throw new Error('Unknown instance parent "' + parentId + '".');
  next.document.nodes[id] = {
    id,
    kind: definition.kind === 'template' ? 'template-instance' : 'component',
    name: options.name ?? definition.name,
    parentId,
    transform: {
      x: options.x ?? 80,
      y: options.y ?? 80,
      width: definition.width,
      height: definition.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
    props: {
      definitionId,
      data: Object.fromEntries(
        definition.placeholders.map((placeholder) => [
          placeholder.name,
          placeholder.defaultValue ?? '',
        ]),
      ) as Record<string, VisualValue>,
      overrides: {},
      insertions: [],
    },
  };
  if (parentId) {
    const parent = next.document.nodes[parentId]!;
    parent.childIds = [...(parent.childIds ?? []), id];
  } else {
    next.document.rootNodeIds.push(id);
  }
  next.editor = { ...next.editor, selectedNodeIds: [id] };
  return nowProject(next);
}

export function createPhase9Scene(
  project: VisualProject,
  options: { name?: string; x?: number; y?: number; width?: number; height?: number; parentId?: string | null } = {},
): VisualProject {
  const next = clone(project);
  const id = createVisualId('scene');
  const parentId = options.parentId ?? null;
  next.document.nodes[id] = {
    id,
    kind: 'scene',
    name: options.name ?? 'Scene',
    parentId,
    childIds: [],
    transform: {
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? next.document.width,
      height: options.height ?? next.document.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
    props: { background: {} },
  };
  if (parentId) {
    const parent = next.document.nodes[parentId];
    if (!parent) throw new Error('Unknown scene parent "' + parentId + '".');
    parent.childIds = [...(parent.childIds ?? []), id];
  } else {
    next.document.rootNodeIds.push(id);
  }
  next.editor = { ...next.editor, selectedNodeIds: [id] };
  return nowProject(next);
}

export function createPhase9Surface(
  project: VisualProject,
  options: { name?: string; x?: number; y?: number; width?: number; height?: number; parentId?: string | null } = {},
): VisualProject {
  const next = clone(project);
  const parentId = options.parentId ?? null;
  if (parentId && !next.document.nodes[parentId]) throw new Error('Unknown surface parent "' + parentId + '".');
  const id = createVisualId('surface');
  next.document.nodes[id] = {
    id,
    kind: 'surface',
    name: options.name ?? 'Surface',
    parentId,
    childIds: [],
    transform: {
      x: options.x ?? 40,
      y: options.y ?? 40,
      width: options.width ?? 480,
      height: options.height ?? 320,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    },
    props: { background: {} },
  };
  if (parentId) {
    const parent = next.document.nodes[parentId]!;
    parent.childIds = [...(parent.childIds ?? []), id];
  } else {
    next.document.rootNodeIds.push(id);
  }
  next.editor = { ...next.editor, selectedNodeIds: [id] };
  return nowProject(next);
}

export function updatePhase9Definition(
  project: VisualProject,
  definition: Phase9Definition,
): VisualProject {
  const next = clone(project);
  const record = definitionRecord(definition);
  const index = next.operations.findIndex((item) => item.id === definition.id);
  if (index >= 0) next.operations[index] = record;
  else next.operations.push(record);
  return nowProject(next);
}

export function addPhase9TemplatePlaceholder(
  project: VisualProject,
  definitionId: string,
  input: { name: string; nodeId: string; path?: string; defaultValue?: VisualValue },
): VisualProject {
  const definition = phase9Definition(project, definitionId);
  if (!definition || definition.kind !== 'template') throw new Error('Placeholder target must be a template definition.');
  if (!definition.nodes[input.nodeId]) throw new Error('Placeholder target node is not part of the template.');
  const safeName = sanitizeVisualIdPart(input.name, 'value').replace(/-/g, '_');
  const placeholder: Phase9Placeholder = {
    id: createVisualId('placeholder'),
    name: safeName,
    nodeId: input.nodeId,
    path: input.path ?? 'props.text',
    ...(input.defaultValue !== undefined ? { defaultValue: input.defaultValue } : {}),
  };
  return updatePhase9Definition(project, {
    ...definition,
    placeholders: [...definition.placeholders.filter((item) => item.name !== safeName), placeholder],
  });
}

export function removePhase9TemplatePlaceholder(
  project: VisualProject,
  definitionId: string,
  placeholderId: string,
): VisualProject {
  const definition = phase9Definition(project, definitionId);
  if (!definition || definition.kind !== 'template') return project;
  return updatePhase9Definition(project, {
    ...definition,
    placeholders: definition.placeholders.filter((item) => item.id !== placeholderId),
  });
}

function instanceProps(node: VisualNode): Phase9InstanceProps {
  return node.props as unknown as Phase9InstanceProps;
}

export function setPhase9InstanceData(
  project: VisualProject,
  instanceId: string,
  key: string,
  value: VisualValue,
): VisualProject {
  const next = clone(project);
  const node = next.document.nodes[instanceId];
  if (!node || (node.kind !== 'component' && node.kind !== 'template-instance')) {
    throw new Error('Instance data can only be set on a component/template instance.');
  }
  const props = instanceProps(node);
  node.props = {
    ...node.props,
    data: { ...(props.data ?? {}), [key]: value },
  };
  return nowProject(next);
}

export function setPhase9InstanceOverrides(
  project: VisualProject,
  instanceId: string,
  overrides: Record<string, Record<string, VisualValue>>,
): VisualProject {
  const next = clone(project);
  const node = next.document.nodes[instanceId];
  if (!node || (node.kind !== 'component' && node.kind !== 'template-instance')) {
    throw new Error('Overrides can only be set on a component/template instance.');
  }
  node.props = { ...node.props, overrides };
  return nowProject(next);
}

export function addPhase9Insertion(
  project: VisualProject,
  instanceId: string,
  insertion: {
    targetId: string;
    position: 'before' | 'after';
    layers: Phase9SceneLayer | Phase9SceneLayer[];
  },
): VisualProject {
  const next = clone(project);
  const node = next.document.nodes[instanceId];
  if (!node || (node.kind !== 'component' && node.kind !== 'template-instance')) {
    throw new Error('Insertions can only be set on a component/template instance.');
  }
  const props = instanceProps(node);
  node.props = {
    ...node.props,
    insertions: [...(props.insertions ?? []), clone(insertion)] as unknown as VisualValue[],
  };
  return nowProject(next);
}

export function setPhase9InstanceInsertions(
  project: VisualProject,
  instanceId: string,
  insertions: Array<{
    targetId: string;
    position: 'before' | 'after';
    layers: Phase9SceneLayer | Phase9SceneLayer[];
  }>,
): VisualProject {
  const next = clone(project);
  const node = next.document.nodes[instanceId];
  if (!node || (node.kind !== 'component' && node.kind !== 'template-instance')) {
    throw new Error('Insertions can only be set on a component/template instance.');
  }
  node.props = {
    ...node.props,
    insertions: clone(insertions) as unknown as VisualValue[],
  };
  return nowProject(next);
}

function setPath(root: Record<string, unknown>, path: string, value: VisualValue) {
  const parts = path.split('.').filter(Boolean);
  if (!parts.length) return;
  let current = root;
  for (const part of parts.slice(0, -1)) {
    const previous = current[part];
    if (!previous || typeof previous !== 'object' || Array.isArray(previous)) current[part] = {};
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
}

function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, VisualValue>,
): Record<string, unknown> {
  const out: Record<string, unknown> = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    const before = out[key];
    if (
      before &&
      typeof before === 'object' &&
      !Array.isArray(before) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !('$ref' in value)
    ) {
      out[key] = deepMerge(
        before as Record<string, unknown>,
        value as Record<string, VisualValue>,
      );
    } else {
      out[key] = clone(value);
    }
  }
  return out;
}

function materializedDefinitionNodes(
  project: VisualProject,
  instance: VisualNode,
  stack: string[],
): { nodes: Record<string, VisualNode>; rootIds: string[] } {
  const props = instanceProps(instance);
  const definition = phase9Definition(project, props.definitionId);
  if (!definition) throw new Error('Instance "' + instance.id + '" references missing definition "' + props.definitionId + '".');
  if (stack.includes(definition.id)) throw new Error('Recursive component/template definition "' + definition.id + '".');
  if (stack.length > 16) throw new Error('Component/template nesting exceeds 16 levels.');

  const nodes = clone(definition.nodes);
  const prefix = instance.id + '__';
  const idMap = new Map(Object.keys(nodes).map((id) => [id, prefix + id] as const));
  const instanceX = instance.transform?.x ?? 0;
  const instanceY = instance.transform?.y ?? 0;
  const scaleX = (instance.transform?.width ?? definition.width) / Math.max(1, definition.width);
  const scaleY = (instance.transform?.height ?? definition.height) / Math.max(1, definition.height);

  const remapped: Record<string, VisualNode> = {};
  for (const [sourceId, sourceNode] of Object.entries(nodes)) {
    const id = idMap.get(sourceId)!;
    const transform = sourceNode.transform ?? {};
    remapped[id] = {
      ...sourceNode,
      id,
      parentId: sourceNode.parentId ? idMap.get(sourceNode.parentId) ?? null : null,
      childIds: sourceNode.childIds?.map((childId) => idMap.get(childId) ?? childId),
      transform: {
        ...transform,
        x: instanceX + (transform.x ?? 0) * scaleX,
        y: instanceY + (transform.y ?? 0) * scaleY,
        ...(transform.width !== undefined ? { width: transform.width * scaleX } : {}),
        ...(transform.height !== undefined ? { height: transform.height * scaleY } : {}),
        opacity: (transform.opacity ?? 1) * (instance.transform?.opacity ?? 1),
        rotation: (transform.rotation ?? 0) + (instance.transform?.rotation ?? 0),
      },
      props: clone(sourceNode.props),
    };

    const override = props.overrides?.[sourceId];
    if (override) {
      remapped[id] = deepMerge(remapped[id] as unknown as Record<string, unknown>, override) as unknown as VisualNode;
    }
  }

  for (const placeholder of definition.placeholders) {
    const targetId = idMap.get(placeholder.nodeId);
    if (!targetId || !remapped[targetId]) continue;
    const value = props.data?.[placeholder.name] ?? placeholder.defaultValue;
    if (value !== undefined) setPath(remapped[targetId] as unknown as Record<string, unknown>, placeholder.path, value);
  }

  return {
    nodes: remapped,
    rootIds: definition.rootNodeIds.map((id) => idMap.get(id)!).filter(Boolean),
  };
}

export function materializePhase9Project(project: VisualProject): VisualProject {
  const next = clone(project);
  const visitContainer = (ids: string[], parentId: string | null, stack: string[]): string[] => {
    const output: string[] = [];
    for (const id of ids) {
      const node = next.document.nodes[id];
      if (!node) continue;
      if (node.kind !== 'component' && node.kind !== 'template-instance') {
        if (node.childIds?.length) node.childIds = visitContainer(node.childIds, node.id, stack);
        output.push(id);
        continue;
      }

      const props = instanceProps(node);
      const definition = phase9Definition(next, props.definitionId);
      const materialized = materializedDefinitionNodes(next, node, stack);
      delete next.document.nodes[id];
      for (const [materializedId, materializedNode] of Object.entries(materialized.nodes)) {
        next.document.nodes[materializedId] = materializedNode;
      }
      const roots = materialized.rootIds;
      for (const rootId of roots) {
        next.document.nodes[rootId]!.parentId = parentId;
      }
      const nested = visitContainer(roots, parentId, [...stack, definition?.id ?? props.definitionId]);
      output.push(...nested);
    }
    return output;
  };

  next.document.rootNodeIds = visitContainer(next.document.rootNodeIds, null, []);
  next.editor = {
    ...next.editor,
    selectedNodeIds: (next.editor?.selectedNodeIds ?? []).filter((id) => Boolean(next.document.nodes[id])),
  };
  return next;
}

export function expandPhase9Instance(project: VisualProject, instanceId: string): VisualProject {
  const instance = project.document.nodes[instanceId];
  if (!instance || (instance.kind !== 'component' && instance.kind !== 'template-instance')) return project;
  const parentId = instance.parentId ?? null;
  const siblings = parentList(project, parentId);
  const index = siblings.indexOf(instanceId);
  const materialized = materializedDefinitionNodes(project, instance, []);
  const next = clone(project);
  delete next.document.nodes[instanceId];
  for (const [id, node] of Object.entries(materialized.nodes)) next.document.nodes[id] = node;
  const groupId = createVisualId('group');
  const roots = materialized.rootIds;
  next.document.nodes[groupId] = {
    id: groupId,
    kind: 'group',
    name: (instance.name ?? 'Instance') + ' · expanded',
    parentId,
    childIds: roots,
    transform: {
      x: instance.transform?.x ?? 0,
      y: instance.transform?.y ?? 0,
      width: instance.transform?.width ?? 1,
      height: instance.transform?.height ?? 1,
      visible: instance.transform?.visible ?? true,
      locked: false,
    },
    props: {},
  };
  roots.forEach((id) => { next.document.nodes[id]!.parentId = groupId; });
  const updated = siblings.filter((id) => id !== instanceId);
  updated.splice(Math.max(0, index), 0, groupId);
  setParentList(next, parentId, updated);
  next.editor = { ...next.editor, selectedNodeIds: [groupId] };
  return nowProject(next);
}

export function detachPhase9Instance(project: VisualProject, instanceId: string): VisualProject {
  const instance = project.document.nodes[instanceId];
  if (!instance || (instance.kind !== 'component' && instance.kind !== 'template-instance')) return project;
  const parentId = instance.parentId ?? null;
  const siblings = parentList(project, parentId);
  const index = siblings.indexOf(instanceId);
  const materialized = materializedDefinitionNodes(project, instance, []);
  const next = clone(project);
  delete next.document.nodes[instanceId];
  for (const [id, node] of Object.entries(materialized.nodes)) next.document.nodes[id] = node;
  materialized.rootIds.forEach((id) => { next.document.nodes[id]!.parentId = parentId; });
  const updated = siblings.filter((id) => id !== instanceId);
  updated.splice(Math.max(0, index), 0, ...materialized.rootIds);
  setParentList(next, parentId, updated);
  next.editor = { ...next.editor, selectedNodeIds: materialized.rootIds };
  return nowProject(next);
}

export function registerPhase9NamedAsset(
  project: VisualProject,
  input: { name: string; uri: string; mime?: string },
): { project: VisualProject; assetId: string } {
  const next = clone(project);
  const id = createVisualId('asset');
  const registryName = sanitizeVisualIdPart(input.name, 'asset').replace(/-/g, '_');
  next.assets.push({
    id,
    kind: PHASE9_NAMED_ASSET_KIND,
    name: input.name,
    value: {
      uri: input.uri,
      registryName,
      ...(input.mime ? { mime: input.mime } : {}),
    },
  });
  return { project: nowProject(next), assetId: id };
}

export function registerPhase9Variable(
  project: VisualProject,
  input: { name: string; value: VisualValue },
): { project: VisualProject; variableId: string } {
  const next = clone(project);
  const id = createVisualId('variable');
  const registryName = sanitizeVisualIdPart(input.name, 'value').replace(/-/g, '_');
  next.variables.push({
    id,
    kind: PHASE9_VARIABLE_KIND,
    name: input.name,
    value: { value: input.value, registryName },
  });
  return { project: nowProject(next), variableId: id };
}

export function bindPhase9Reference(
  project: VisualProject,
  nodeId: string,
  path: string,
  reference: { kind: 'asset' | 'variable' | 'palette'; id: string },
): VisualProject {
  const next = clone(project);
  const node = next.document.nodes[nodeId];
  if (!node) throw new Error('Unknown node "' + nodeId + '".');
  setPath(node as unknown as Record<string, unknown>, path, { $ref: reference.kind + ':' + reference.id });
  return nowProject(next);
}

function referenceRecord(project: VisualProject, kind: string, id: string): VisualProjectRecord | undefined {
  if (kind === 'asset') return project.assets.find((item) => item.id === id);
  if (kind === 'variable') return project.variables.find((item) => item.id === id);
  if (kind === 'palette') return project.palettes.find((item) => item.id === id);
  return undefined;
}

function referenceValue(record: VisualProjectRecord, kind: string): VisualValue {
  if (kind === 'asset') return record.value?.uri ?? record.value?.value ?? '';
  return record.value?.value ?? record.value ?? null;
}

export function resolvePhase9References(project: VisualProject): VisualProject {
  const next = clone(project);
  const active = new Set<string>();
  const resolve = (value: VisualValue): VisualValue => {
    if (Array.isArray(value)) return value.map(resolve);
    if (!value || typeof value !== 'object') return value;
    if ('$ref' in value && typeof value.$ref === 'string') {
      const match = value.$ref.match(/^(asset|variable|palette):(.+)$/);
      if (!match) return value;
      const key = match[1] + ':' + match[2];
      if (active.has(key)) throw new Error('Cyclic Phase 9 reference "' + key + '".');
      const record = referenceRecord(next, match[1], match[2]);
      if (!record) throw new Error('Unknown Phase 9 reference "' + key + '".');
      active.add(key);
      const resolved = resolve(referenceValue(record, match[1]));
      active.delete(key);
      return resolved;
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, resolve(child as VisualValue)]),
    ) as Record<string, VisualValue>;
  };

  for (const node of Object.values(next.document.nodes)) {
    node.props = resolve(node.props) as Record<string, VisualValue>;
  }
  if (next.document.background !== undefined) next.document.background = resolve(next.document.background);
  return next;
}

function sceneReferenceToken(project: VisualProject, value: VisualValue): VisualValue {
  if (Array.isArray(value)) return value.map((item) => sceneReferenceToken(project, item));
  if (!value || typeof value !== 'object') return value;
  if ('$ref' in value && typeof value.$ref === 'string') {
    const match = value.$ref.match(/^(asset|variable|palette):(.+)$/);
    if (!match) return value;
    const record = referenceRecord(project, match[1], match[2]);
    const registryName =
      typeof record?.value?.registryName === 'string'
        ? record.value.registryName
        : sanitizeVisualIdPart(record?.name ?? match[2], 'value').replace(/-/g, '_');
    return '$' + registryName;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, sceneReferenceToken(project, child as VisualValue)]),
  ) as Record<string, VisualValue>;
}

function nodeTransformXY(node: VisualNode, offsetX: number, offsetY: number) {
  return {
    x: (node.transform?.x ?? 0) - offsetX,
    y: (node.transform?.y ?? 0) - offsetY,
  };
}

function sceneLayersForIds(
  project: VisualProject,
  ids: string[],
  offsetX: number,
  offsetY: number,
  stack: string[],
): Phase9SceneLayer[] {
  const layers: Phase9SceneLayer[] = [];
  for (const id of ids) {
    const node = project.document.nodes[id];
    if (!node || node.transform?.visible === false) continue;
    if (node.kind === 'group') {
      layers.push(...sceneLayersForIds(project, node.childIds ?? [], offsetX, offsetY, stack));
      continue;
    }
    if (node.kind === 'scene') {
      const xy = nodeTransformXY(node, offsetX, offsetY);
      layers.push({
        id: node.id,
        type: 'surface',
        placement: {
          ...xy,
          width: node.transform?.width ?? project.document.width,
          height: node.transform?.height ?? project.document.height,
          opacity: node.transform?.opacity ?? 1,
          rotation: node.transform?.rotation ?? 0,
        },
        background: sceneReferenceToken(project, (node.props.background ?? {}) as VisualValue),
        layers: sceneLayersForIds(
          project,
          node.childIds ?? [],
          node.transform?.x ?? 0,
          node.transform?.y ?? 0,
          stack,
        ),
      });
      continue;
    }
    if (node.kind === 'surface') {
      const xy = nodeTransformXY(node, offsetX, offsetY);
      layers.push({
        id: node.id,
        type: 'surface',
        placement: {
          ...xy,
          width: node.transform?.width ?? 480,
          height: node.transform?.height ?? 320,
          opacity: node.transform?.opacity ?? 1,
          rotation: node.transform?.rotation ?? 0,
          scaleX: node.transform?.scaleX ?? 1,
          scaleY: node.transform?.scaleY ?? 1,
        },
        background: sceneReferenceToken(project, (node.props.background ?? {}) as VisualValue),
        layers: sceneLayersForIds(
          project,
          node.childIds ?? [],
          node.transform?.x ?? 0,
          node.transform?.y ?? 0,
          stack,
        ),
      });
      continue;
    }
    if (node.kind === 'component' || node.kind === 'template-instance') {
      const props = instanceProps(node);
      if (stack.includes(props.definitionId)) throw new Error('Recursive component/template definition "' + props.definitionId + '".');
      const materialized = materializedDefinitionNodes(project, node, stack);
      const temp = clone(project);
      for (const [childId, child] of Object.entries(materialized.nodes)) temp.document.nodes[childId] = child;
      layers.push(...sceneLayersForIds(temp, materialized.rootIds, offsetX, offsetY, [...stack, props.definitionId]));
      continue;
    }

    const xy = nodeTransformXY(node, offsetX, offsetY);
    if (node.kind === 'text') {
      const props = sceneReferenceToken(project, visualTextProps(node) as unknown as VisualValue) as Record<string, VisualValue>;
      layers.push({
        id: node.id,
        type: 'text',
        texts: {
          ...props,
          ...xy,
          ...(node.transform?.width !== undefined ? { maxWidth: node.transform.width } : {}),
          ...(node.transform?.height !== undefined ? { maxHeight: node.transform.height } : {}),
          rotation: node.transform?.rotation ?? 0,
          opacity: node.transform?.opacity ?? 1,
        },
      });
      continue;
    }
    if (node.kind === 'image' || node.kind === 'shape') {
      const props = sceneReferenceToken(project, visualImageProps(node) as unknown as VisualValue) as Record<string, VisualValue>;
      layers.push({
        id: node.id,
        type: 'image',
        images: {
          ...props,
          ...xy,
          ...(node.transform?.width !== undefined ? { width: node.transform.width } : {}),
          ...(node.transform?.height !== undefined ? { height: node.transform.height } : {}),
          rotation: node.transform?.rotation ?? 0,
          opacity: node.transform?.opacity ?? 1,
        },
      });
      continue;
    }
    if (node.kind === 'chart') {
      const props = visualChartProps(node);
      const family = props.family === 'donut' ? 'pie' : props.family;
      const dimensions =
        props.options && typeof props.options.dimensions === 'object' && props.options.dimensions && !Array.isArray(props.options.dimensions)
          ? props.options.dimensions as Record<string, VisualValue>
          : {};
      if (props.family === 'comparison') {
        layers.push({
          id: node.id,
          type: 'chartComparison',
          options: sceneReferenceToken(project, props.options),
          ...xy,
          width: node.transform?.width ?? (typeof dimensions.width === 'number' ? dimensions.width : 640),
          height: node.transform?.height ?? (typeof dimensions.height === 'number' ? dimensions.height : 400),
          opacity: node.transform?.opacity ?? 1,
        });
      } else if (props.family === 'combo') {
        layers.push({
          id: node.id,
          type: 'chartCombo',
          options: sceneReferenceToken(project, props.options),
          ...xy,
          width: node.transform?.width ?? (typeof dimensions.width === 'number' ? dimensions.width : 640),
          height: node.transform?.height ?? (typeof dimensions.height === 'number' ? dimensions.height : 400),
          opacity: node.transform?.opacity ?? 1,
        });
      } else {
        layers.push({
          id: node.id,
          type: 'chart',
          chartType: family,
          data: sceneReferenceToken(project, (props.data ?? []) as VisualValue),
          options: sceneReferenceToken(project, props.options),
          ...xy,
          width: node.transform?.width ?? (typeof dimensions.width === 'number' ? dimensions.width : 640),
          height: node.transform?.height ?? (typeof dimensions.height === 'number' ? dimensions.height : 400),
          opacity: node.transform?.opacity ?? 1,
        });
      }
      continue;
    }
    if (node.kind === 'path' || node.kind === 'freehand') {
      const props = visualPathProps(node);
      if (props.tool === 'connector' && props.connector) {
        layers.push({
          id: node.id,
          type: 'customLines',
          lines: sceneReferenceToken(project, props.connector as unknown as VisualValue),
        });
      } else {
        layers.push({
          id: node.id,
          type: 'path',
          path: sceneReferenceToken(project, (props.commands ?? []) as unknown as VisualValue),
          options: sceneReferenceToken(project, {
            ...(props.draw ?? {}),
            transform: {
              ...(props.draw?.transform ?? {}),
              translateX: (props.draw?.transform?.translateX ?? 0) + xy.x,
              translateY: (props.draw?.transform?.translateY ?? 0) + xy.y,
              rotate: (props.draw?.transform?.rotate ?? 0) + (node.transform?.rotation ?? 0),
              scaleX: (props.draw?.transform?.scaleX ?? 1) * (node.transform?.scaleX ?? 1),
              scaleY: (props.draw?.transform?.scaleY ?? 1) * (node.transform?.scaleY ?? 1),
            },
            opacity: (props.draw?.opacity ?? 1) * (node.transform?.opacity ?? 1),
          } as unknown as VisualValue),
        });
      }
    }
  }
  return layers;
}

export function phase9RootSceneDefinition(
  project: VisualProject,
): Phase9SceneDefinition {
  return {
    width: project.document.width,
    height: project.document.height,
    ...(project.document.canvas && Object.keys(project.document.canvas).length
      ? { background: sceneReferenceToken(project, project.document.canvas as unknown as VisualValue) as Record<string, VisualValue> }
      : {}),
    layers: sceneLayersForIds(project, project.document.rootNodeIds, 0, 0, []),
  };
}

export function phase9SceneLayersForNodeIds(
  project: VisualProject,
  nodeIds: string[],
): Phase9SceneLayer[] {
  return sceneLayersForIds(project, nodeIds, 0, 0, []);
}

export function phase9SceneDefinition(
  project: VisualProject,
  sceneNode: VisualNode,
): Phase9SceneDefinition {
  if (sceneNode.kind !== 'scene' && sceneNode.kind !== 'surface') {
    throw new Error('Scene definition requires a scene/surface node.');
  }
  return {
    width: Math.max(1, sceneNode.transform?.width ?? project.document.width),
    height: Math.max(1, sceneNode.transform?.height ?? project.document.height),
    ...(sceneNode.props.background && typeof sceneNode.props.background === 'object' && !Array.isArray(sceneNode.props.background)
      ? { background: sceneReferenceToken(project, sceneNode.props.background) as Record<string, VisualValue> }
      : {}),
    layers: sceneLayersForIds(
      project,
      sceneNode.childIds ?? [],
      sceneNode.transform?.x ?? 0,
      sceneNode.transform?.y ?? 0,
      [],
    ),
  };
}

export function phase9TemplateSceneDefinition(
  project: VisualProject,
  definition: Phase9Definition,
): Phase9SceneDefinition {
  const temp = clone(project);
  for (const [id, node] of Object.entries(definition.nodes)) temp.document.nodes[id] = clone(node);
  const layers = sceneLayersForIds(temp, definition.rootNodeIds, 0, 0, [definition.id]);

  const byId = new Map<string, Phase9SceneLayer>();
  const indexLayers = (items: Phase9SceneLayer[]) => {
    for (const item of items) {
      if (typeof item.id === 'string') byId.set(item.id, item);
      if (Array.isArray(item.layers)) indexLayers(item.layers as Phase9SceneLayer[]);
    }
  };
  indexLayers(layers);

  for (const placeholder of definition.placeholders) {
    const layer = byId.get(placeholder.nodeId);
    if (!layer) continue;
    const path = placeholder.path.startsWith('props.') ? placeholder.path.slice(6) : placeholder.path;
    const token = '{{' + placeholder.name + '}}';
    if (path === 'text' && layer.type === 'text' && layer.texts && typeof layer.texts === 'object' && !Array.isArray(layer.texts)) {
      (layer.texts as Record<string, VisualValue>).text = token;
    } else {
      setPath(layer as unknown as Record<string, unknown>, path, token);
    }
  }

  return {
    width: definition.width,
    height: definition.height,
    layers,
  };
}

export function phase9RegistryRecords(project: VisualProject) {
  return {
    assets: project.assets.filter((item) => item.kind === PHASE9_NAMED_ASSET_KIND),
    variables: project.variables.filter((item) => item.kind === PHASE9_VARIABLE_KIND),
    palettes: project.palettes,
  };
}

export function validatePhase9Project(project: VisualProject): VisualProjectIssue[] {
  const issues: VisualProjectIssue[] = [];
  const definitions = phase9Definitions(project);
  const byId = new Map(definitions.map((item) => [item.id, item] as const));

  const push = (code: string, path: string, message: string) => {
    issues.push({ severity: 'error', code, path, message });
  };

  for (const definition of definitions) {
    if (!(definition.width > 0) || !(definition.height > 0)) {
      push('phase9-definition-size', 'operations.' + definition.id, 'Component/template dimensions must be positive.');
    }
    for (const rootId of definition.rootNodeIds) {
      if (!definition.nodes[rootId]) push('phase9-definition-root', 'operations.' + definition.id, 'Definition root "' + rootId + '" is missing.');
    }
    for (const placeholder of definition.placeholders) {
      if (!definition.nodes[placeholder.nodeId]) {
        push('phase9-placeholder-node', 'operations.' + definition.id, 'Placeholder "' + placeholder.name + '" targets a missing node.');
      }
      if (!placeholder.path.trim()) {
        push('phase9-placeholder-path', 'operations.' + definition.id, 'Placeholder "' + placeholder.name + '" needs a target path.');
      }
    }
  }

  for (const node of Object.values(project.document.nodes)) {
    if (node.kind !== 'component' && node.kind !== 'template-instance') continue;
    const props = instanceProps(node);
    const definition = byId.get(props.definitionId);
    if (!definition) {
      push('phase9-missing-definition', 'document.nodes.' + node.id + '.props.definitionId', 'Instance references unknown definition "' + String(props.definitionId) + '".');
      continue;
    }
    if (node.kind === 'component' && definition.kind !== 'component') {
      push('phase9-definition-kind', 'document.nodes.' + node.id, 'Component node must reference a component definition.');
    }
    if (node.kind === 'template-instance' && definition.kind !== 'template') {
      push('phase9-definition-kind', 'document.nodes.' + node.id, 'Template instance must reference a template definition.');
    }
    for (const targetId of Object.keys(props.overrides ?? {})) {
      if (!definition.nodes[targetId]) {
        push('phase9-override-target', 'document.nodes.' + node.id + '.props.overrides.' + targetId, 'Override targets an unknown definition node.');
      }
    }
    for (const insertion of props.insertions ?? []) {
      if (!definition.nodes[insertion.targetId]) {
        push('phase9-insertion-target', 'document.nodes.' + node.id + '.props.insertions', 'Insertion targets unknown definition node "' + insertion.targetId + '".');
      }
    }
  }

  try {
    materializePhase9Project(project);
  } catch (error) {
    push('phase9-materialization', 'document.nodes', error instanceof Error ? error.message : 'Phase 9 materialization failed.');
  }
  return issues;
}
