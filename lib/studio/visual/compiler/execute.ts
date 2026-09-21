import type { StudioOperationPlan } from './plan';

export interface StudioOperationRuntime {
  createCanvas(options: { width: number; height: number }): Promise<{ buffer: Uint8Array }>;
}

export async function executeStudioOperationPlan(
  plan: StudioOperationPlan,
  runtime: StudioOperationRuntime,
): Promise<Uint8Array> {
  const values = new Map<string, { buffer: Uint8Array }>();

  for (const operation of plan.operations) {
    switch (operation.kind) {
      case 'create-canvas': {
        const value = await runtime.createCanvas(operation.options);
        values.set(operation.target, value);
        break;
      }
      default:
        throw new Error(`Unsupported Studio operation: ${JSON.stringify(operation)}`);
    }
  }

  const result = values.get(plan.result.target);
  if (!result) throw new Error(`Studio operation plan did not produce "${plan.result.target}".`);
  return result.buffer;
}
