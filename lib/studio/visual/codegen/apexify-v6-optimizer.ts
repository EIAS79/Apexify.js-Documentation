import type {
  StudioCreateImageOperation,
  StudioCreateTextOperation,
  StudioOperation,
  StudioOperationPlan,
  StudioTargetReference,
} from '../compiler/plan';

/**
 * Apexify.js v6 composition optimizer.
 *
 * v6 createImage(ImageProperties[]) / createText(TextProperties[]) paint ordered
 * elements onto the SAME input buffer. painter.batch() instead produces
 * independent canvases: never substitute it for a visual layer stack.
 *
 * This pass is restricted to consecutive compatible authoring operations.
 * In particular, do not move utility or analysis calls, reorder layers,
 * coalesce grouped transforms or silently turn preprocessing into in-layer
 * filters. Such transformations can change raster semantics.
 */
export const APEXIFY_V6_AUTOBATCH_MAX_ITEMS = 32;

export type ApexifyV6AutoBatch = (
  StudioCreateImageOperation | StudioCreateTextOperation
) & { autoBatchNodeIds: string[] };

type LayerOperation = StudioCreateImageOperation | StudioCreateTextOperation;

function eligible(operation: StudioOperation): operation is LayerOperation {
  return (operation.kind === 'create-image' || operation.kind === 'create-text') &&
    !Array.isArray(operation.properties) &&
    operation.options === undefined &&
    operation.painterOpts === undefined;
}

function referenceCounts(plan: StudioOperationPlan): Map<string, number> {
  const counts = new Map<string, number>();
  const visit = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }
    const obj = value as Record<string, unknown>;
    if (typeof obj.$studioTarget === 'string') {
      counts.set(obj.$studioTarget, (counts.get(obj.$studioTarget) ?? 0) + 1);
      return;
    }
    for (const child of Object.values(obj)) visit(child);
  };
  for (const operation of plan.operations) visit(operation);
  counts.set(plan.result.target, (counts.get(plan.result.target) ?? 0) + 1);
  return counts;
}

function batchCompatible(
  previous: LayerOperation,
  next: StudioOperation,
  references: ReadonlyMap<string, number>,
): next is LayerOperation {
  if (!eligible(next) || next.kind !== previous.kind) return false;
  const base: StudioTargetReference = next.base;
  return base.$studioTarget === previous.target &&
    base.member === undefined &&
    references.get(previous.target) === 1;
}

function mergeLayers(layers: LayerOperation[]): ApexifyV6AutoBatch {
  const first = layers[0]!;
  const last = layers[layers.length - 1]!;
  const autoBatchNodeIds = layers.map((layer) => layer.sourceNodeId);
  if (first.kind === 'create-image') {
    return {
      ...(last as StudioCreateImageOperation),
      base: first.base,
      properties: layers.flatMap((layer) =>
        (layer as StudioCreateImageOperation).properties as
          StudioCreateImageOperation['properties'][],
      ),
      autoBatchNodeIds,
    };
  }
  return {
    ...(last as StudioCreateTextOperation),
    base: first.base,
    properties: layers.flatMap((layer) =>
      (layer as StudioCreateTextOperation).properties as
        StudioCreateTextOperation['properties'][],
    ),
    autoBatchNodeIds,
  };
}

/** Pure, deterministic; original plan and preview execution remain untouched. */
export function optimizeApexifyV6Plan(plan: StudioOperationPlan): StudioOperationPlan {
  const references = referenceCounts(plan);
  const operations: StudioOperation[] = [];

  for (let index = 0; index < plan.operations.length;) {
    const first = plan.operations[index]!;
    if (!eligible(first)) {
      operations.push(first);
      index++;
      continue;
    }

    const layers: LayerOperation[] = [first];
    let cursor = index + 1;
    while (cursor < plan.operations.length && layers.length < APEXIFY_V6_AUTOBATCH_MAX_ITEMS) {
      const next = plan.operations[cursor]!;
      if (!batchCompatible(layers[layers.length - 1]!, next, references)) break;
      layers.push(next);
      cursor++;
    }
    if (layers.length < 2) {
      operations.push(first);
      index++;
      continue;
    }
    operations.push(mergeLayers(layers));
    index = cursor;
  }
  return { ...plan, operations };
}
