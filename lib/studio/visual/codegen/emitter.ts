import type { StudioOperationPlan } from '../compiler/plan';
import { ImportRegistry } from './imports';
import { StableNameRegistry } from './names';

function emitString(value: string): string {
  return JSON.stringify(value);
}

function emitValue(value: unknown, indent = 0): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return emitString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = value.map((item) => `${' '.repeat(indent + 2)}${emitValue(item, indent + 2)}`).join(',\n');
    return `[\n${inner},\n${' '.repeat(indent)}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const inner = entries
      .map(([key, item]) => `${' '.repeat(indent + 2)}${key}: ${emitValue(item, indent + 2)}`)
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
      const targetName = names.allocate(operation.target, 'canvas');
      targetNames.set(operation.target, targetName);
      body.push(
        `  const ${targetName} = await ${painterName}.createCanvas(${emitValue(operation.options, 2)});`,
      );
    }
  }

  const resultName = targetNames.get(plan.result.target);
  if (!resultName) throw new Error(`No generated identifier for plan target "${plan.result.target}".`);
  body.push('');
  body.push(`  return ${resultName}.${plan.result.member};`);

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
