import type { VisualProject, VisualTransform } from '../model';

export type VisualRect = Required<Pick<VisualTransform, 'x' | 'y' | 'width' | 'height'>>;

export type SnapGuide = {
  axis: 'x' | 'y';
  value: number;
  source: 'grid' | 'document' | 'node';
};

export interface SnapResult {
  transform: VisualTransform;
  guides: SnapGuide[];
}

export const DEFAULT_NODE_WIDTH = 180;
export const DEFAULT_NODE_HEIGHT = 110;
export const DEFAULT_GRID_SIZE = 8;
export const DEFAULT_SNAP_THRESHOLD = 6;

export function resolvedTransform(transform: VisualTransform | undefined): Required<VisualTransform> {
  return {
    x: transform?.x ?? 0,
    y: transform?.y ?? 0,
    width: Math.max(1, transform?.width ?? DEFAULT_NODE_WIDTH),
    height: Math.max(1, transform?.height ?? DEFAULT_NODE_HEIGHT),
    scaleX: transform?.scaleX ?? 1,
    scaleY: transform?.scaleY ?? 1,
    rotation: transform?.rotation ?? 0,
    anchorX: transform?.anchorX ?? 0.5,
    anchorY: transform?.anchorY ?? 0.5,
    opacity: transform?.opacity ?? 1,
    visible: transform?.visible ?? true,
    locked: transform?.locked ?? false,
    zIndex: transform?.zIndex ?? 0,
  };
}

export function nodeRect(transform: VisualTransform | undefined): VisualRect {
  const resolved = resolvedTransform(transform);
  return {
    x: resolved.x,
    y: resolved.y,
    width: resolved.width,
    height: resolved.height,
  };
}

export function rectCenter(rect: VisualRect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function clampTransform(
  transform: VisualTransform,
  documentWidth: number,
  documentHeight: number,
): VisualTransform {
  const resolved = resolvedTransform(transform);
  const width = Math.max(8, Math.min(resolved.width, documentWidth));
  const height = Math.max(8, Math.min(resolved.height, documentHeight));
  return {
    ...transform,
    x: Math.min(documentWidth - width, Math.max(0, resolved.x)),
    y: Math.min(documentHeight - height, Math.max(0, resolved.y)),
    width,
    height,
    opacity: Math.min(1, Math.max(0, resolved.opacity)),
  };
}

function snapScalar(value: number, candidates: Array<{ value: number; source: SnapGuide['source'] }>, threshold: number) {
  let best: { value: number; source: SnapGuide['source']; distance: number } | null = null;
  for (const candidate of candidates) {
    const distance = Math.abs(value - candidate.value);
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = { ...candidate, distance };
    }
  }
  return best;
}

export function snapNodeTransform(
  project: VisualProject,
  nodeId: string,
  transform: VisualTransform,
  options: { gridSize?: number; threshold?: number; enabled?: boolean } = {},
): SnapResult {
  if (options.enabled === false) return { transform, guides: [] };

  const grid = options.gridSize ?? DEFAULT_GRID_SIZE;
  const threshold = options.threshold ?? DEFAULT_SNAP_THRESHOLD;
  const resolved = resolvedTransform(transform);
  const width = resolved.width;
  const height = resolved.height;

  const xCandidates: Array<{ value: number; source: SnapGuide['source'] }> = [];
  const yCandidates: Array<{ value: number; source: SnapGuide['source'] }> = [];

  const gridX = Math.round(resolved.x / grid) * grid;
  const gridY = Math.round(resolved.y / grid) * grid;
  xCandidates.push({ value: gridX, source: 'grid' });
  yCandidates.push({ value: gridY, source: 'grid' });

  const docCenterX = project.document.width / 2;
  const docCenterY = project.document.height / 2;
  xCandidates.push({ value: 0, source: 'document' });
  xCandidates.push({ value: project.document.width - width, source: 'document' });
  xCandidates.push({ value: docCenterX - width / 2, source: 'document' });
  yCandidates.push({ value: 0, source: 'document' });
  yCandidates.push({ value: project.document.height - height, source: 'document' });
  yCandidates.push({ value: docCenterY - height / 2, source: 'document' });

  for (const [otherId, node] of Object.entries(project.document.nodes)) {
    if (otherId === nodeId || node.transform?.visible === false) continue;
    const other = nodeRect(node.transform);
    xCandidates.push({ value: other.x, source: 'node' });
    xCandidates.push({ value: other.x + other.width, source: 'node' });
    xCandidates.push({ value: other.x + other.width / 2 - width / 2, source: 'node' });
    yCandidates.push({ value: other.y, source: 'node' });
    yCandidates.push({ value: other.y + other.height, source: 'node' });
    yCandidates.push({ value: other.y + other.height / 2 - height / 2, source: 'node' });
  }

  const xSnap = snapScalar(resolved.x, xCandidates, threshold);
  const ySnap = snapScalar(resolved.y, yCandidates, threshold);
  const guides: SnapGuide[] = [];
  if (xSnap) guides.push({ axis: 'x', value: xSnap.value, source: xSnap.source });
  if (ySnap) guides.push({ axis: 'y', value: ySnap.value, source: ySnap.source });

  return {
    transform: clampTransform(
      {
        ...transform,
        x: xSnap?.value ?? resolved.x,
        y: ySnap?.value ?? resolved.y,
      },
      project.document.width,
      project.document.height,
    ),
    guides,
  };
}

export function snapRotation(rotation: number, enabled = true): number {
  if (!enabled) return rotation;
  const step = 15;
  const snapped = Math.round(rotation / step) * step;
  return Math.abs(snapped - rotation) <= 3 ? snapped : rotation;
}
