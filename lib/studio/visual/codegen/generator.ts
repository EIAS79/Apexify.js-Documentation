import type { VisualProject } from '../model';
import { lowerVisualProject } from '../compiler/plan';
import { emitStudioOperationPlan } from './emitter';
import {
  generatePhase9NativeSource,
  generatePhase9PreviewSource,
  hasPhase9Authoring,
} from '../phase9-codegen';
import {
  generatePhase10DisplayPreviewSource,
  generatePhase10NativeSource,
  generatePhase10PreviewSource,
  hasPhase10Authoring,
} from '../phase10-codegen';
import {
  generatePhase11NativeSource,
  generatePhase11PreviewSource,
  hasPhase11Authoring,
} from '../phase11-codegen';
import {
  generatePhase12NativeSource,
  generatePhase12PreviewSource,
  hasPhase12Authoring,
} from '../phase12-codegen';

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
  const source = hasPhase12Authoring(project)
    ? generatePhase12NativeSource(project)
    : hasPhase11Authoring(project)
    ? generatePhase11NativeSource(project)
    : hasPhase10Authoring(project)
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
  const source = hasPhase12Authoring(project)
    ? generatePhase12PreviewSource(project)
    : hasPhase11Authoring(project)
    ? generatePhase11PreviewSource(project)
    : hasPhase10Authoring(project)
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


export function generateVisualProjectDisplayPreviewCode(project: VisualProject): GeneratedVisualCode {
  const source = hasPhase12Authoring(project)
    ? generatePhase12PreviewSource(project)
    : hasPhase11Authoring(project)
    ? generatePhase11PreviewSource(project)
    : hasPhase10Authoring(project)
      ? generatePhase10DisplayPreviewSource(project)
      : hasPhase9Authoring(project)
      ? generatePhase9PreviewSource(project)
      : emitStudioOperationPlan(lowerVisualProject(project));
  return {
    language: 'typescript',
    fileName: `${safeFileStem(project.name)}.display-preview.ts`,
    source,
  };
}
