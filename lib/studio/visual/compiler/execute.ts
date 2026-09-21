import type {
  VisualCanvasConfig,
  VisualCreateImageOptions,
} from '../model';
import type {
  StudioImageProperties,
  StudioOperationPlan,
  StudioTargetReference,
} from './plan';

export interface StudioOperationRuntime {
  createCanvas(
    options: { width: number; height: number } & VisualCanvasConfig,
  ): Promise<{ buffer: Uint8Array }>;
  createImage(
    properties: Omit<StudioImageProperties, 'source'> & { source: string | Uint8Array },
    canvasBuffer: Uint8Array,
    options?: VisualCreateImageOptions,
  ): Promise<Uint8Array>;
}

type RuntimeValue = { buffer: Uint8Array } | Uint8Array;

function targetValue(
  ref: StudioTargetReference,
  values: ReadonlyMap<string, RuntimeValue>,
): Uint8Array {
  const value = values.get(ref.$studioTarget);
  if (!value) {
    throw new Error(
      `Studio operation target "${ref.$studioTarget}" is not available.`,
    );
  }
  if (ref.member === 'buffer') {
    if (value instanceof Uint8Array) return value;
    return value.buffer;
  }
  if (value instanceof Uint8Array) return value;
  return value.buffer;
}

function resolveOperationValue(
  value: unknown,
  values: ReadonlyMap<string, RuntimeValue>,
): unknown {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as { $studioTarget?: unknown }).$studioTarget === 'string'
  ) {
    return targetValue(value as StudioTargetReference, values);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveOperationValue(item, values));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        resolveOperationValue(child, values),
      ]),
    );
  }
  return value;
}

export async function executeStudioOperationPlan(
  plan: StudioOperationPlan,
  runtime: StudioOperationRuntime,
): Promise<Uint8Array> {
  const values = new Map<string, RuntimeValue>();

  for (const operation of plan.operations) {
    switch (operation.kind) {
      case 'create-canvas': {
        const value = await runtime.createCanvas(operation.options);
        values.set(operation.target, value);
        break;
      }
      case 'create-image': {
        const properties = resolveOperationValue(
          operation.properties,
          values,
        ) as Omit<StudioImageProperties, 'source'> & {
          source: string | Uint8Array;
        };
        const base = targetValue(operation.base, values);
        const value = await runtime.createImage(
          properties,
          base,
          operation.options,
        );
        values.set(operation.target, value);
        break;
      }
      default:
        throw new Error(
          `Unsupported Studio operation: ${JSON.stringify(operation)}`,
        );
    }
  }

  const result = values.get(plan.result.target);
  if (!result) {
    throw new Error(
      `Studio operation plan did not produce "${plan.result.target}".`,
    );
  }
  if (plan.result.member === 'buffer') {
    return result instanceof Uint8Array ? result : result.buffer;
  }
  return result instanceof Uint8Array ? result : result.buffer;
}
