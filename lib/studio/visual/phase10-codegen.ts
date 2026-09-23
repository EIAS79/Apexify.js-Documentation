import type { VisualProject } from './model';
import { emitStudioOperationPlan } from './codegen/emitter';
import { lowerVisualProject } from './compiler/plan';
import {
  flattenPhase9PreviewContainers,
  materializePhase9Project,
  resolvePhase9References,
} from './scene-component-contract';
import { hasPhase9Authoring } from './phase9-codegen';

export const PHASE10_SOURCE_MARKER = 'apexify-studio-v10:';

function semanticPayload(project: VisualProject) {
  return encodeURIComponent(JSON.stringify(project)).replace(/\*/g, '%2A');
}

export function phase10ProjectFromSourceMarker(source: string): VisualProject | null {
  const match = source.match(/\/\*\s*apexify-studio-v10:([^*]+)\*\//);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1].trim())) as VisualProject;
  } catch {
    return null;
  }
}

export function hasPhase10Authoring(project: VisualProject): boolean {
  return Object.values(project.document.nodes).some((node) => {
    if (node.kind !== 'image' && node.kind !== 'shape') return false;
    const props = node.props as {
      utilityStack?: unknown[];
      utilityAnalyses?: unknown[];
    };
    return Boolean(props.utilityStack?.length || props.utilityAnalyses?.length);
  });
}

/**
 * Phase 10 utilities execute through the full Apexify runtime. When Phase 9
 * semantic containers are present, materialize them only for executable raster
 * code; the v10 marker retains the exact nested Visual Project for round-trip.
 */
function executablePhase10Project(project: VisualProject): VisualProject {
  if (!hasPhase9Authoring(project)) return project;
  const materialized = materializePhase9Project(project);
  const flattened = flattenPhase9PreviewContainers(materialized);
  return resolvePhase9References(flattened);
}

export function generatePhase10NativeSource(project: VisualProject): string {
  const executable = executablePhase10Project(project);
  const source = emitStudioOperationPlan(lowerVisualProject(executable));
  return '/* ' + PHASE10_SOURCE_MARKER + semanticPayload(project) + ' */\n' + source;
}

export function generatePhase10PreviewSource(project: VisualProject): string {
  return generatePhase10NativeSource(project);
}
