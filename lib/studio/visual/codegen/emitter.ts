import type {
  StudioOperationPlan,
  StudioTargetReference,
} from '../compiler/plan';
import { ImportRegistry } from './imports';
import { StableNameRegistry } from './names';

function emitString(value: string): string {
  return JSON.stringify(value);
}

function isTargetReference(value: unknown): value is StudioTargetReference {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as { $studioTarget?: unknown }).$studioTarget === 'string',
  );
}

function emitTargetReference(
  value: StudioTargetReference,
  targetNames: ReadonlyMap<string, string>,
): string {
  const name = targetNames.get(value.$studioTarget);
  if (!name) {
    throw new Error(
      `Generated source references target "${value.$studioTarget}" before it is available.`,
    );
  }
  return value.member ? `${name}.${value.member}` : name;
}

function emitValue(
  value: unknown,
  indent = 0,
  targetNames: ReadonlyMap<string, string> = new Map(),
): string {
  if (isTargetReference(value)) return emitTargetReference(value, targetNames);
  if (value === null) return 'null';
  if (typeof value === 'string') return emitString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = value
      .map((item) => `${' '.repeat(indent + 2)}${emitValue(item, indent + 2, targetNames)}`)
      .join(',\n');
    return `[\n${inner},\n${' '.repeat(indent)}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, item]) => item !== undefined,
    );
    if (entries.length === 0) return '{}';
    const inner = entries
      .map(
        ([key, item]) =>
          `${' '.repeat(indent + 2)}${key}: ${emitValue(item, indent + 2, targetNames)}`,
      )
      .join(',\n');
    return `{\n${inner},\n${' '.repeat(indent)}}`;
  }
  throw new Error(`Unsupported code-generation value: ${String(value)}`);
}

export function emitStudioOperationPlan(plan: StudioOperationPlan): string {
  const imports = new ImportRegistry();
  imports.add('apexify.js', 'ApexPainter');

  const names = new StableNameRegistry();
  const painterName = names.allocate('painter');
  const targetNames = new Map<string, string>();

  const body: string[] = [];
  for (const operation of plan.operations) {
    if (operation.kind === 'create-canvas') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'canvas',
      );
      targetNames.set(operation.target, targetName);
      body.push(
        `  const ${targetName} = await ${painterName}.createCanvas(${emitValue(operation.options, 2, targetNames)});`,
      );
      continue;
    }

    if (operation.kind === 'create-image') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        operation.sourceNodeId.startsWith('shape') ? 'shape' : 'image',
      );
      const base = emitTargetReference(operation.base, targetNames);
      const properties = emitValue(operation.properties, 2, targetNames);
      const options = operation.options
        ? `, ${emitValue(operation.options, 2, targetNames)}`
        : '';
      body.push(
        `  const ${targetName} = await ${painterName}.createImage(${properties}, ${base}${options});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'create-text') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'text',
      );
      const base = emitTargetReference(operation.base, targetNames);
      const properties = emitValue(operation.properties, 2, targetNames);
      body.push(
        `  const ${targetName} = await ${painterName}.createText(${properties}, ${base});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }
  }

  const resultName = targetNames.get(plan.result.target);
  if (!resultName) {
    throw new Error(
      `No generated identifier for plan target "${plan.result.target}".`,
    );
  }
  body.push('');
  body.push(
    plan.result.member
      ? `  return ${resultName}.${plan.result.member};`
      : `  return ${resultName};`,
  );

  return [
    imports.emit(),
    '',
    `const ${painterName} = new ApexPainter();`,
    '',
    'async function main() {',
    ...body,
    '}',
    '',
    'return await main();',
    '',
  ].join('\n');
}
