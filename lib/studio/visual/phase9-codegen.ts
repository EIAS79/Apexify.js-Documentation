import type { VisualNode, VisualProject, VisualProjectRecord, VisualValue } from './model';
import { sanitizeVisualIdPart } from './ids';
import {
  PHASE9_NAMED_ASSET_KIND,
  PHASE9_VARIABLE_KIND,
  flattenPhase9PreviewContainers,
  materializePhase9Project,
  phase9Definitions,
  phase9RegistryRecords,
  phase9RootSceneDefinition,
  phase9SceneLayersForNodeIds,
  phase9TemplateSceneDefinition,
  resolvePhase9References,
  type Phase9InstanceProps,
} from './scene-component-contract';
import { lowerVisualProject } from './compiler/plan';
import { emitStudioOperationPlan } from './codegen/emitter';

export const PHASE9_SOURCE_MARKER = 'apexify-studio-v9:';

function emitString(value: string): string {
  return JSON.stringify(value);
}

function emitValue(value: unknown, indent = 0): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return emitString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const body = value
      .map((item) => ' '.repeat(indent + 2) + emitValue(item, indent + 2))
      .join(',\n');
    return '[\n' + body + ',\n' + ' '.repeat(indent) + ']';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined);
    if (!entries.length) return '{}';
    const body = entries
      .map(([key, item]) =>
        ' '.repeat(indent + 2) +
        (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)) +
        ': ' +
        emitValue(item, indent + 2),
      )
      .join(',\n');
    return '{\n' + body + ',\n' + ' '.repeat(indent) + '}';
  }
  throw new Error('Unsupported Phase 9 code value: ' + String(value));
}

function identifier(value: string, fallback: string) {
  const safe = sanitizeVisualIdPart(value, fallback).replace(/-/g, '_');
  return /^[A-Za-z_$]/.test(safe) ? safe : '_' + safe;
}

function semanticPayload(project: VisualProject) {
  return encodeURIComponent(JSON.stringify(project)).replace(/\*/g, '%2A');
}

export function phase9ProjectFromSourceMarker(source: string): VisualProject | null {
  const match = source.match(/\/\*\s*apexify-studio-v9:([^*]+)\*\//);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1].trim())) as VisualProject;
  } catch {
    return null;
  }
}

export function hasPhase9Authoring(project: VisualProject): boolean {
  if (phase9Definitions(project).length) return true;
  if (project.assets.some((item) => item.kind === PHASE9_NAMED_ASSET_KIND)) return true;
  if (project.variables.some((item) => item.kind === PHASE9_VARIABLE_KIND)) return true;
  return Object.values(project.document.nodes).some((node) =>
    node.kind === 'scene' ||
    node.kind === 'surface' ||
    node.kind === 'component' ||
    node.kind === 'template-instance',
  );
}

function registryName(record: VisualProjectRecord, fallback: string) {
  const configured = record.value?.registryName;
  return typeof configured === 'string' && configured
    ? configured
    : identifier(record.name ?? record.id, fallback);
}

function emitRegistry(project: VisualProject): string[] {
  const lines: string[] = [];
  const registry = phase9RegistryRecords(project);

  for (const asset of registry.assets) {
    const name = registryName(asset, 'asset');
    const uri = asset.value?.uri;
    if (typeof uri !== 'string' || !uri) continue;
    const mime = typeof asset.value?.mime === 'string' ? asset.value.mime : '';
    if (mime.startsWith('font/')) {
      lines.push('painter.assets.loadFont(' + emitString(name) + ', ' + emitString(uri) + ');');
    } else if (mime.startsWith('image/') || !mime) {
      lines.push('painter.assets.loadImage(' + emitString(name) + ', ' + emitString(uri) + ');');
    } else {
      lines.push('painter.assets.loadValue(' + emitString(name) + ', ' + emitString(uri) + ');');
    }
  }

  for (const variable of registry.variables) {
    const name = registryName(variable, 'value');
    lines.push(
      'painter.assets.loadValue(' +
        emitString(name) +
        ', ' +
        emitValue(variable.value?.value ?? null) +
        ');',
    );
  }

  for (const palette of registry.palettes) {
    const name = registryName(palette, 'palette');
    const colors =
      palette.value?.colors &&
      typeof palette.value.colors === 'object' &&
      !Array.isArray(palette.value.colors)
        ? palette.value.colors
        : palette.value ?? {};
    lines.push(
      'painter.assets.loadPalette(' +
        emitString(name) +
        ', ' +
        emitValue(colors) +
        ');',
    );
  }

  return lines;
}

function stripSceneMeta(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSceneMeta);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'id' || key === 'visible') continue;
    out[key] = stripSceneMeta(child);
  }
  return out;
}

function instanceRenderOptions(project: VisualProject, node: VisualNode) {
  const props = node.props as unknown as Phase9InstanceProps;
  const insertions = (props.insertions ?? []).map((insertion) => ({
    targetId: insertion.targetId,
    position: insertion.position,
    layers: insertion.layers,
  }));
  return {
    ...(props.overrides && Object.keys(props.overrides).length
      ? { overrides: props.overrides }
      : {}),
    ...(insertions.length ? { insertions } : {}),
  };
}

function instancePlacement(node: VisualNode) {
  return {
    x: node.transform?.x ?? 0,
    y: node.transform?.y ?? 0,
    width: node.transform?.width ?? 320,
    height: node.transform?.height ?? 180,
    opacity: node.transform?.opacity ?? 1,
    rotation: node.transform?.rotation ?? 0,
    scaleX: node.transform?.scaleX ?? 1,
    scaleY: node.transform?.scaleY ?? 1,
  };
}

function definitionIdentifiers(project: VisualProject) {
  const used = new Set<string>();
  const map = new Map<string, string>();
  for (const definition of phase9Definitions(project)) {
    let name = identifier(definition.name, definition.kind);
    let suffix = 2;
    while (used.has(name)) name = identifier(definition.name, definition.kind) + '_' + suffix++;
    used.add(name);
    map.set(definition.id, name);
  }
  return map;
}

function emitDynamicSurface(instanceName: string, placement: Record<string, unknown>) {
  const placementText = emitValue(placement, 2);
  return [
    'scene.addLayer({',
    '  type: "surface",',
    '  placement: ' + placementText.replace(/\n/g, '\n  ') + ',',
    '  layers: ' + instanceName + '.layers,',
    '});',
  ].join('\n');
}

export function generatePhase9NativeSource(project: VisualProject): string {
  const definitions = phase9Definitions(project);
  const definitionNames = definitionIdentifiers(project);
  const root = phase9RootSceneDefinition(project);
  const lines: string[] = [
    "import { ApexPainter } from 'apexify.js';",
    '',
    '/* ' + PHASE9_SOURCE_MARKER + semanticPayload(project) + ' */',
    '',
    'const painter = new ApexPainter();',
  ];

  const registry = emitRegistry(project);
  if (registry.length) lines.push('', ...registry);

  for (const definition of definitions) {
    const scene = phase9TemplateSceneDefinition(project, definition);
    const name = definitionNames.get(definition.id)!;
    lines.push(
      '',
      'const ' +
        name +
        ' = painter.createTemplate(' +
        emitValue({
          width: scene.width,
          height: scene.height,
          ...(scene.background ? { background: scene.background } : {}),
          layers: scene.layers,
        }) +
        ');',
    );
  }

  lines.push(
    '',
    'async function main() {',
    '  const scene = painter.createScene(' + root.width + ', ' + root.height + ');',
  );
  if (root.background && Object.keys(root.background).length) {
    lines.push('  scene.setBackground(' + emitValue(root.background, 2).replace(/\n/g, '\n  ') + ');');
  }

  for (const rootId of project.document.rootNodeIds) {
    const node = project.document.nodes[rootId];
    if (!node || node.transform?.visible === false) continue;

    if (node.kind === 'component' || node.kind === 'template-instance') {
      const props = node.props as unknown as Phase9InstanceProps;
      const definitionName = definitionNames.get(props.definitionId);
      if (!definitionName) throw new Error('Missing definition for Phase 9 instance ' + node.id + '.');
      const instanceName = identifier(node.name ?? node.id, 'instance') + '_scene';
      const options = instanceRenderOptions(project, node);
      lines.push(
        '  const ' +
          instanceName +
          ' = await ' +
          definitionName +
          '.toRenderInput(' +
          emitValue(props.data ?? {}, 2).replace(/\n/g, '\n  ') +
          (Object.keys(options).length
            ? ', ' + emitValue(options, 2).replace(/\n/g, '\n  ')
            : '') +
          ');',
      );
      lines.push(
        emitDynamicSurface(instanceName, instancePlacement(node))
          .split('\n')
          .map((line) => '  ' + line)
          .join('\n'),
      );
      continue;
    }

    const layers = phase9SceneLayersForNodeIds(project, [rootId]).map(stripSceneMeta);
    if (layers.length) {
      lines.push(
        '  scene.addLayers(' +
          emitValue(layers, 2).replace(/\n/g, '\n  ') +
          ');',
      );
    }
  }

  lines.push(
    '  return await scene.render({ resolveAssetRefs: true });',
    '}',
    '',
    'return await main();',
    '',
  );
  return lines.join('\n');
}

export function generatePhase9PreviewSource(project: VisualProject): string {
  const materialized = materializePhase9Project(project);
  const flattened = flattenPhase9PreviewContainers(materialized);
  const preview = resolvePhase9References(flattened);
  return emitStudioOperationPlan(lowerVisualProject(preview));
}
