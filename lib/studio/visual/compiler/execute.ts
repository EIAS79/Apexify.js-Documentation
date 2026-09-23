import type {
  VisualCanvasConfig,
  VisualCreateImageOptions,
} from '../model';
import type {
  StudioImageAnalysisOperation,
  StudioImageProperties,
  StudioImageUtilityOperation,
  StudioOperationPlan,
  StudioTargetReference,
  StudioTextProperties,
} from './plan';
import type {
  StudioConnectorOptions,
  StudioPathCommand,
  StudioPathDrawOptions,
} from '../path-pixel-contract';

export interface StudioOperationRuntime {
  createCanvas(
    options: { width: number; height: number } & VisualCanvasConfig,
  ): Promise<{ buffer: Uint8Array }>;
  createImage?(
    properties: Omit<StudioImageProperties, 'source'> & { source: string | Uint8Array },
    canvasBuffer: Uint8Array,
    options?: VisualCreateImageOptions,
  ): Promise<Uint8Array>;
  createText?(
    properties: StudioTextProperties,
    canvasBuffer: Uint8Array,
  ): Promise<Uint8Array>;
  runImageUtility?(
    method: StudioImageUtilityOperation['method'],
    args: unknown[],
  ): Promise<Uint8Array>;
  runImageAnalysis?(
    method: StudioImageAnalysisOperation['method'],
    args: unknown[],
  ): Promise<unknown>;
  createChart?(
    family: 'pie' | 'bar' | 'horizontalBar' | 'line' | 'scatter' | 'radar' | 'polarArea',
    data: unknown[],
    options: Record<string, unknown>,
  ): Promise<Uint8Array>;
  createComparisonChart?(
    options: Record<string, unknown>,
  ): Promise<Uint8Array>;
  createComboChart?(
    options: Record<string, unknown>,
  ): Promise<Uint8Array>;
  drawPath?(
    canvasBuffer: Uint8Array,
    commands: StudioPathCommand[],
    options?: StudioPathDrawOptions,
  ): Promise<Uint8Array>;
  customPath?(
    options: StudioConnectorOptions | StudioConnectorOptions[],
    canvasBuffer: Uint8Array,
  ): Promise<Uint8Array>;
  manipulatePixels?(
    canvasBuffer: Uint8Array,
    options: {
      filter: 'grayscale' | 'invert' | 'sepia' | 'brightness' | 'contrast' | 'saturate';
      intensity?: number;
      region?: { x: number; y: number; width: number; height: number };
    },
  ): Promise<Uint8Array>;
  setPixelColor?(
    canvasBuffer: Uint8Array,
    x: number,
    y: number,
    color: { r: number; g: number; b: number; a?: number },
  ): Promise<Uint8Array>;
  getPixelColor?(canvasBuffer: Uint8Array, x: number, y: number): Promise<unknown>;
  getPixelData?(
    canvasBuffer: Uint8Array,
    region?: { x: number; y: number; width: number; height: number },
  ): Promise<unknown>;
  detectPath?(
    commands: StudioPathCommand[],
    x: number,
    y: number,
    options?: { includeStroke?: boolean; strokeWidth?: number; tolerance?: number; fillRule?: 'nonzero' | 'evenodd' },
  ): Promise<unknown>;
  detectRegion?(
    region: unknown,
    x: number,
    y: number,
    options?: { includeStroke?: boolean; strokeWidth?: number; tolerance?: number; fillRule?: 'nonzero' | 'evenodd' },
  ): Promise<unknown>;
  detectAnyRegion?(
    regions: unknown[],
    x: number,
    y: number,
    options?: { includeStroke?: boolean; strokeWidth?: number; tolerance?: number; fillRule?: 'nonzero' | 'evenodd' },
  ): Promise<unknown>;
  detectDistance?(region: unknown, x: number, y: number): Promise<unknown>;
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
        if (!runtime.createImage) {
          throw new Error('Studio runtime does not implement createImage().');
        }
        const value = await runtime.createImage(
          properties,
          base,
          operation.options,
        );
        values.set(operation.target, value);
        break;
      }
      case 'create-text': {
        const base = targetValue(operation.base, values);
        if (!runtime.createText) {
          throw new Error('Studio runtime does not implement createText().');
        }
        const value = await runtime.createText(operation.properties, base);
        values.set(operation.target, value);
        break;
      }
      case 'image-utility': {
        if (!runtime.runImageUtility) {
          throw new Error('Studio runtime does not implement image utility operations.');
        }
        const args = resolveOperationValue(operation.args, values) as unknown[];
        values.set(
          operation.target,
          await runtime.runImageUtility(operation.method, args),
        );
        break;
      }
      case 'image-analysis': {
        if (!runtime.runImageAnalysis) {
          throw new Error('Studio runtime does not implement image analysis operations.');
        }
        const args = resolveOperationValue(operation.args, values) as unknown[];
        await runtime.runImageAnalysis(operation.method, args);
        break;
      }
      case 'create-chart': {
        if (!runtime.createChart) {
          throw new Error('Studio runtime does not implement createChart().');
        }
        const family = operation.family === 'donut' ? 'pie' : operation.family;
        const options =
          operation.family === 'donut'
            ? { ...operation.options, type: 'donut' }
            : operation.options;
        values.set(
          operation.target,
          await runtime.createChart(
            family,
            operation.data as unknown[],
            options as Record<string, unknown>,
          ),
        );
        break;
      }
      case 'create-comparison-chart': {
        if (!runtime.createComparisonChart) {
          throw new Error('Studio runtime does not implement createComparisonChart().');
        }
        values.set(
          operation.target,
          await runtime.createComparisonChart(
            operation.options as Record<string, unknown>,
          ),
        );
        break;
      }
      case 'create-combo-chart': {
        if (!runtime.createComboChart) {
          throw new Error('Studio runtime does not implement createComboChart().');
        }
        values.set(
          operation.target,
          await runtime.createComboChart(
            operation.options as Record<string, unknown>,
          ),
        );
        break;
      }
      case 'path-draw': {
        const base = targetValue(operation.base, values);
        if (!runtime.drawPath) throw new Error('Studio runtime does not implement path2d.draw().');
        values.set(operation.target, await runtime.drawPath(base, operation.commands, operation.options));
        break;
      }
      case 'path-custom': {
        const base = targetValue(operation.base, values);
        if (!runtime.customPath) throw new Error('Studio runtime does not implement path2d.custom().');
        values.set(operation.target, await runtime.customPath(operation.options, base));
        break;
      }
      case 'pixels-manipulate': {
        const base = targetValue(operation.base, values);
        if (!runtime.manipulatePixels) throw new Error('Studio runtime does not implement pixels.manipulate().');
        values.set(operation.target, await runtime.manipulatePixels(base, operation.options));
        break;
      }
      case 'pixels-set-color': {
        const base = targetValue(operation.base, values);
        if (!runtime.setPixelColor) throw new Error('Studio runtime does not implement pixels.setColor().');
        values.set(operation.target, await runtime.setPixelColor(base, operation.x, operation.y, operation.color));
        break;
      }
      case 'pixels-get-color': {
        const base = targetValue(operation.base, values);
        if (!runtime.getPixelColor) throw new Error('Studio runtime does not implement pixels.getColor().');
        await runtime.getPixelColor(base, operation.x, operation.y);
        break;
      }
      case 'pixels-get-data': {
        const base = targetValue(operation.base, values);
        if (!runtime.getPixelData) throw new Error('Studio runtime does not implement pixels.getData().');
        await runtime.getPixelData(base, operation.region);
        break;
      }
      case 'detect-path': {
        if (!runtime.detectPath) throw new Error('Studio runtime does not implement detect.path().');
        await runtime.detectPath(operation.commands, operation.x, operation.y, operation.options);
        break;
      }
      case 'detect-region': {
        if (!runtime.detectRegion) throw new Error('Studio runtime does not implement detect.region().');
        await runtime.detectRegion(operation.region, operation.x, operation.y, operation.options);
        break;
      }
      case 'detect-any-region': {
        if (!runtime.detectAnyRegion) throw new Error('Studio runtime does not implement detect.anyRegion().');
        await runtime.detectAnyRegion(operation.regions, operation.x, operation.y, operation.options);
        break;
      }
      case 'detect-distance': {
        if (!runtime.detectDistance) throw new Error('Studio runtime does not implement detect.distance().');
        await runtime.detectDistance(operation.region, operation.x, operation.y);
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
