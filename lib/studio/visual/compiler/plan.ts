import type { VisualCanvasConfig, VisualProject } from '../model';
import { normalizeVisualProject } from './normalize';
import { assertValidVisualProject } from './validate';

export const STUDIO_OPERATION_PLAN_VERSION = 1 as const;

export type StudioCreateCanvasOperation = {
  id: string;
  kind: 'create-canvas';
  source: 'document';
  target: string;
  options: {
    width: number;
    height: number;
  } & VisualCanvasConfig;
};

export type StudioOperation = StudioCreateCanvasOperation;

export interface StudioOperationPlan {
  version: typeof STUDIO_OPERATION_PLAN_VERSION;
  projectId: string;
  schemaVersion: number;
  operations: StudioOperation[];
  result: {
    target: string;
    member: 'buffer';
  };
}

export function lowerVisualProject(project: VisualProject): StudioOperationPlan {
  const normalized = normalizeVisualProject(project);
  assertValidVisualProject(normalized);

  if (normalized.document.rootNodeIds.length > 0) {
    throw new Error(
      'STUDIO-VISUAL-2 lowers the document canvas only. Visual nodes are compiled by their owning authoring phases.',
    );
  }

  return {
    version: STUDIO_OPERATION_PLAN_VERSION,
    projectId: normalized.id,
    schemaVersion: normalized.schemaVersion,
    operations: [
      {
        id: 'document_canvas',
        kind: 'create-canvas',
        source: 'document',
        target: 'canvas',
        options: {
          width: normalized.document.width,
          height: normalized.document.height,
          ...(normalized.document.canvas ?? {}),
        },
      },
    ],
    result: {
      target: 'canvas',
      member: 'buffer',
    },
  };
}
