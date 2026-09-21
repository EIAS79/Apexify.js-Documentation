import {
  VISUAL_PROJECT_FILE_SUFFIX,
  type VisualProject,
} from './model';
import { normalizeVisualProject } from './compiler/normalize';
import { assertValidVisualProject } from './compiler/validate';

export function serializeVisualProject(project: VisualProject): string {
  const normalized = normalizeVisualProject(project);
  assertValidVisualProject(normalized);
  return JSON.stringify(normalized, null, 2) + '\n';
}

export function parseVisualProject(source: string): VisualProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(
      `Invalid .apexstudio.json: ${error instanceof Error ? error.message : 'invalid JSON'}`,
    );
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid .apexstudio.json: project root must be an object.');
  }
  const project = parsed as VisualProject;
  assertValidVisualProject(project);
  return normalizeVisualProject(project);
}

export function visualProjectFileName(project: Pick<VisualProject, 'name'>): string {
  const stem = project.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${stem || 'apexify-visual-project'}${VISUAL_PROJECT_FILE_SUFFIX}`;
}

export function downloadVisualProject(project: VisualProject): void {
  const blob = new Blob([serializeVisualProject(project)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = visualProjectFileName(project);
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 0);
}

export async function loadVisualProjectFile(file: File): Promise<VisualProject> {
  if (!file.name.toLowerCase().endsWith(VISUAL_PROJECT_FILE_SUFFIX)) {
    throw new Error(`Visual Studio project files must end with ${VISUAL_PROJECT_FILE_SUFFIX}.`);
  }
  return parseVisualProject(await file.text());
}
