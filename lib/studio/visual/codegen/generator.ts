import type { VisualProject } from '../model';
import { lowerVisualProject } from '../compiler/plan';
import { emitStudioOperationPlan } from './emitter';
import {
  generatePhase9NativeSource,
  generatePhase9PreviewSource,
  hasPhase9Authoring,
} from '../phase9-codegen';
import {
  generatePhase10NativeSource,
  generatePhase10PreviewSource,
  hasPhase10Authoring,
} from '../phase10-codegen';

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
  const source = hasPhase10Authoring(project)
    ? generatePhase10NativeSource(project)
    : hasPhase9Authoring(project)
      ? generatePhase9NativeSource(project)
      : emitStudioOperationPlan(lowerVisualProject(project));
  return {
    language: 'typescript',
    fileName: `${safeFileStem(project.name)}.ts`,
    source,
  };
}

export function generateVisualProjectPreviewCode(project: VisualProject): GeneratedVisualCode {
  const source = hasPhase10Authoring(project)
    ? generatePhase10PreviewSource(project)
    : hasPhase9Authoring(project)
      ? generatePhase9PreviewSource(project)
      : emitStudioOperationPlan(lowerVisualProject(project));
  return {
    language: 'typescript',
    fileName: `${safeFileStem(project.name)}.preview.ts`,
    source,
  };
}
