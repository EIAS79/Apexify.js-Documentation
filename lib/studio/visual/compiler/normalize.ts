import type {
  VisualNode,
  VisualProject,
  VisualProjectRecord,
  VisualValue,
} from '../model';

function stableValue(value: VisualValue): VisualValue {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    const source = value as Record<string, VisualValue>;
    const sorted: Record<string, VisualValue> = {};
    for (const key of Object.keys(source).sort()) sorted[key] = stableValue(source[key]);
    return sorted;
  }
  return value;
}

function normalizeRecord(record: VisualProjectRecord): VisualProjectRecord {
  return {
    id: record.id,
    kind: record.kind,
    ...(record.name !== undefined ? { name: record.name } : {}),
    ...(record.value !== undefined
      ? { value: stableValue(record.value as VisualValue) as Record<string, VisualValue> }
      : {}),
  };
}

function normalizeNode(node: VisualNode): VisualNode {
  const transform = node.transform;
  return {
    id: node.id,
    kind: node.kind,
    ...(node.name !== undefined ? { name: node.name } : {}),
    ...(node.parentId !== undefined ? { parentId: node.parentId } : {}),
    ...(node.childIds !== undefined ? { childIds: [...node.childIds] } : {}),
    ...(transform !== undefined
      ? {
          transform: {
            ...(transform.x !== undefined ? { x: transform.x } : {}),
            ...(transform.y !== undefined ? { y: transform.y } : {}),
            ...(transform.width !== undefined ? { width: transform.width } : {}),
            ...(transform.height !== undefined ? { height: transform.height } : {}),
            ...(transform.scaleX !== undefined ? { scaleX: transform.scaleX } : {}),
            ...(transform.scaleY !== undefined ? { scaleY: transform.scaleY } : {}),
            ...(transform.rotation !== undefined ? { rotation: transform.rotation } : {}),
            ...(transform.anchorX !== undefined ? { anchorX: transform.anchorX } : {}),
            ...(transform.anchorY !== undefined ? { anchorY: transform.anchorY } : {}),
            ...(transform.opacity !== undefined ? { opacity: transform.opacity } : {}),
            ...(transform.visible !== undefined ? { visible: transform.visible } : {}),
            ...(transform.locked !== undefined ? { locked: transform.locked } : {}),
            ...(transform.zIndex !== undefined ? { zIndex: transform.zIndex } : {}),
          },
        }
      : {}),
    props: stableValue(node.props as VisualValue) as Record<string, VisualValue>,
  };
}

export function normalizeVisualProject(project: VisualProject): VisualProject {
  const nodeEntries = Object.entries(project.document.nodes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, node]) => [id, normalizeNode(node)] as const);

  const sortRecords = (records: VisualProjectRecord[]) =>
    records.map(normalizeRecord).sort((left, right) => left.id.localeCompare(right.id));

  return {
    format: project.format,
    schemaVersion: project.schemaVersion,
    id: project.id,
    name: project.name.trim(),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    document: {
      width: project.document.width,
      height: project.document.height,
      ...(project.document.pixelRatioPolicy
        ? { pixelRatioPolicy: project.document.pixelRatioPolicy }
        : {}),
      ...(project.document.background !== undefined
        ? { background: stableValue(project.document.background) }
        : {}),
      rootNodeIds: [...project.document.rootNodeIds],
      nodes: Object.fromEntries(nodeEntries),
    },
    assets: sortRecords(project.assets),
    palettes: sortRecords(project.palettes),
    variables: sortRecords(project.variables),
    timelines: sortRecords(project.timelines),
    outputs: sortRecords(project.outputs),
    operations: sortRecords(project.operations),
    codegen: {
      language: 'typescript',
      singleFile: project.codegen.singleFile,
      assetBasePath: './assets/',
    },
    ...(project.editor
      ? {
          editor: {
            ...(project.editor.selectedNodeIds
              ? { selectedNodeIds: [...project.editor.selectedNodeIds] }
              : {}),
            ...(project.editor.zoom !== undefined ? { zoom: project.editor.zoom } : {}),
            ...(project.editor.panX !== undefined ? { panX: project.editor.panX } : {}),
            ...(project.editor.panY !== undefined ? { panY: project.editor.panY } : {}),
          },
        }
      : {}),
  };
}
