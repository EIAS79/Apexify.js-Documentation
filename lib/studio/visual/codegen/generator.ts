import type { VisualProject } from '../model';
import { lowerVisualProject } from '../compiler/plan';
import { emitStudioOperationPlan } from './emitter';

export interface GeneratedVisualCode {
  language: 'typescript';
  fileName: string;
  source: string;
}

function safeFileStem(value: string): string {
  const stem = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return stem || 'apexify-visual-project';
}

export function generateVisualProjectCode(project: VisualProject): GeneratedVisualCode {
  const plan = lowerVisualProject(project);
  return {
    language: 'typescript',
    fileName: `${safeFileStem(project.name)}.ts`,
    source: emitStudioOperationPlan(plan),
  };
}
