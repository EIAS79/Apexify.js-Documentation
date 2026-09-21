import {
  VISUAL_PROJECT_FORMAT,
  VISUAL_PROJECT_SCHEMA_VERSION,
  type VisualProject,
  type VisualProjectIssue,
  type VisualProjectRecord,
  type VisualProjectValidation,
  type VisualValue,
} from '../model';
import { isStableVisualId } from '../ids';

const REF_PATTERN = /^(asset|variable|palette):(.+)$/;

function push(
  issues: VisualProjectIssue[],
  code: string,
  path: string,
  message: string,
): void {
  issues.push({ severity: 'error', code, path, message });
}

function validateRecordIds(
  issues: VisualProjectIssue[],
  records: VisualProjectRecord[],
  path: string,
): Set<string> {
  const ids = new Set<string>();
  records.forEach((record, index) => {
    if (!isStableVisualId(record.id)) push(issues, 'invalid-id', `${path}[${index}].id`, 'Record id is invalid.');
    if (ids.has(record.id)) push(issues, 'duplicate-id', `${path}[${index}].id`, `Duplicate record id "${record.id}".`);
    ids.add(record.id);
  });
  return ids;
}

function visitReferences(
  value: VisualValue,
  path: string,
  known: Record<'asset' | 'variable' | 'palette', Set<string>>,
  issues: VisualProjectIssue[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitReferences(item, `${path}[${index}]`, known, issues));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const object = value as Record<string, VisualValue>;
  if (typeof object.$ref === 'string') {
    const match = object.$ref.match(REF_PATTERN);
    if (!match) {
      push(issues, 'invalid-reference', `${path}.$ref`, `Invalid Visual reference "${object.$ref}".`);
      return;
    }
    const kind = match[1] as keyof typeof known;
    const id = match[2];
    if (!known[kind].has(id)) {
      push(issues, 'missing-reference', `${path}.$ref`, `Unknown ${kind} reference "${id}".`);
    }
  }

  for (const [key, child] of Object.entries(object)) {
    if (key === '$ref') continue;
    visitReferences(child, `${path}.${key}`, known, issues);
  }
}

export function validateVisualProject(project: VisualProject): VisualProjectValidation {
  const issues: VisualProjectIssue[] = [];

  if (project.format !== VISUAL_PROJECT_FORMAT) push(issues, 'format', 'format', 'Unsupported Visual Project format.');
  if (project.schemaVersion !== VISUAL_PROJECT_SCHEMA_VERSION) push(issues, 'schema-version', 'schemaVersion', 'Unsupported Visual Project schema version.');
  if (!isStableVisualId(project.id)) push(issues, 'invalid-id', 'id', 'Project id is invalid.');
  if (!project.name.trim()) push(issues, 'name', 'name', 'Project name must not be empty.');
  if (!Number.isFinite(project.document.width) || project.document.width <= 0) push(issues, 'document-width', 'document.width', 'Document width must be positive.');
  if (!Number.isFinite(project.document.height) || project.document.height <= 0) push(issues, 'document-height', 'document.height', 'Document height must be positive.');

  const nodeIds = new Set(Object.keys(project.document.nodes));
  for (const [key, node] of Object.entries(project.document.nodes)) {
    if (node.id !== key) push(issues, 'node-key-mismatch', `document.nodes.${key}.id`, 'Node id must match its nodes-map key.');
    if (!isStableVisualId(node.id)) push(issues, 'invalid-id', `document.nodes.${key}.id`, 'Node id is invalid.');
    if (node.transform) {
      for (const field of ['x','y','width','height','scaleX','scaleY','rotation','anchorX','anchorY','opacity','zIndex'] as const) {
        const value = node.transform[field];
        if (value !== undefined && !Number.isFinite(value)) push(issues, 'invalid-transform', `document.nodes.${key}.transform.${field}`, 'Transform values must be finite numbers.');
      }
      if (node.transform.width !== undefined && node.transform.width <= 0) push(issues, 'invalid-transform', `document.nodes.${key}.transform.width`, 'Width must be positive.');
      if (node.transform.height !== undefined && node.transform.height <= 0) push(issues, 'invalid-transform', `document.nodes.${key}.transform.height`, 'Height must be positive.');
      if (node.transform.opacity !== undefined && (node.transform.opacity < 0 || node.transform.opacity > 1)) push(issues, 'invalid-transform', `document.nodes.${key}.transform.opacity`, 'Opacity must be between 0 and 1.');
    }
    if (node.parentId && !nodeIds.has(node.parentId)) push(issues, 'missing-parent', `document.nodes.${key}.parentId`, `Unknown parent node "${node.parentId}".`);
    const seenChildren = new Set<string>();
    for (const childId of node.childIds ?? []) {
      if (!nodeIds.has(childId)) push(issues, 'missing-child', `document.nodes.${key}.childIds`, `Unknown child node "${childId}".`);
      if (seenChildren.has(childId)) push(issues, 'duplicate-child', `document.nodes.${key}.childIds`, `Duplicate child node "${childId}".`);
      seenChildren.add(childId);
      const child = project.document.nodes[childId];
      if (child && child.parentId !== node.id) push(issues, 'parent-child-mismatch', `document.nodes.${childId}.parentId`, `Child "${childId}" must point back to parent "${node.id}".`);
    }
  }

  const rootSeen = new Set<string>();
  for (const rootId of project.document.rootNodeIds) {
    if (!nodeIds.has(rootId)) push(issues, 'missing-root', 'document.rootNodeIds', `Unknown root node "${rootId}".`);
    if (rootSeen.has(rootId)) push(issues, 'duplicate-root', 'document.rootNodeIds', `Duplicate root node "${rootId}".`);
    rootSeen.add(rootId);
    const root = project.document.nodes[rootId];
    if (root?.parentId) push(issues, 'root-has-parent', `document.nodes.${rootId}.parentId`, 'Root nodes cannot have a parent.');
  }

  for (const selectedId of project.editor?.selectedNodeIds ?? []) {
    if (!nodeIds.has(selectedId)) push(issues, 'missing-selection', 'editor.selectedNodeIds', `Unknown selected node "${selectedId}".`);
  }

  const visitState = new Map<string, 0 | 1 | 2>();
  const visitNode = (id: string) => {
    const state = visitState.get(id) ?? 0;
    if (state === 1) {
      push(issues, 'node-cycle', `document.nodes.${id}`, 'Node hierarchy contains a cycle.');
      return;
    }
    if (state === 2) return;
    visitState.set(id, 1);
    for (const childId of project.document.nodes[id]?.childIds ?? []) {
      if (nodeIds.has(childId)) visitNode(childId);
    }
    visitState.set(id, 2);
  };
  for (const id of nodeIds) visitNode(id);

  const assets = validateRecordIds(issues, project.assets, 'assets');
  const variables = validateRecordIds(issues, project.variables, 'variables');
  const palettes = validateRecordIds(issues, project.palettes, 'palettes');
  validateRecordIds(issues, project.timelines, 'timelines');
  validateRecordIds(issues, project.outputs, 'outputs');
  validateRecordIds(issues, project.operations, 'operations');

  const known = { asset: assets, variable: variables, palette: palettes };
  for (const [id, node] of Object.entries(project.document.nodes)) {
    visitReferences(node.props as VisualValue, `document.nodes.${id}.props`, known, issues);
  }
  if (project.document.background !== undefined) {
    visitReferences(project.document.background, 'document.background', known, issues);
  }

  if (project.codegen.language !== 'typescript') push(issues, 'codegen-language', 'codegen.language', 'Only TypeScript code generation is supported in v1.');
  if (project.codegen.assetBasePath !== './assets/') push(issues, 'asset-base-path', 'codegen.assetBasePath', 'Visual Project v1 uses ./assets/.');

  return { ok: issues.every((issue) => issue.severity !== 'error'), issues };
}

export function assertValidVisualProject(project: VisualProject): void {
  const result = validateVisualProject(project);
  if (result.ok) return;
  const detail = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
  throw new Error(`Invalid Apexify Studio Visual Project:\n${detail}`);
}
