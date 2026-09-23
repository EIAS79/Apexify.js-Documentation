import type {
  StudioOperationPlan,
  StudioTargetReference,
} from '../compiler/plan';
import { ImportRegistry } from './imports';
import { StableNameRegistry } from './names';

function emitString(value: string): string {
  return JSON.stringify(value);
}

function emitObjectKey(value: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(value) ? value : emitString(value);
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
          `${' '.repeat(indent + 2)}${emitObjectKey(key)}: ${emitValue(item, indent + 2, targetNames)}`,
      )
      .join(',\n');
    return `{\n${inner},\n${' '.repeat(indent)}}`;
  }
  throw new Error(`Unsupported code-generation value: ${String(value)}`);
}

export function emitStudioOperationPlan(
  plan: StudioOperationPlan,
  options: { includeAnalysisResults?: boolean } = {},
): string {
  const imports = new ImportRegistry();
  imports.add('apexify.js', 'ApexPainter');

  const names = new StableNameRegistry();
  const painterName = names.allocate('painter');
  const targetNames = new Map<string, string>();
  const pathResourceNames = new Map<string, string>();
  const templateNames = new Map<string, string>();
  const analysisResultNames: Array<{ key: string; name: string }> = [];

  const body: string[] = [];
  for (const operation of plan.operations) {
    if (operation.kind === 'register-asset') {
      const method =
        operation.registryKind === 'image'
          ? 'loadImage'
          : operation.registryKind === 'font'
            ? 'loadFont'
            : operation.registryKind === 'palette'
              ? 'loadPalette'
              : 'loadValue';
      body.push(
        `  ${painterName}.assets.${method}(${emitString(operation.name)}, ${emitValue(operation.value, 2, targetNames)});`,
      );
      continue;
    }

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

    if (operation.kind === 'image-utility' || operation.kind === 'image-analysis') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        operation.kind === 'image-analysis' ? 'imageAnalysis' : 'imageUtility',
      );
      const args = operation.args
        .map((argument) => emitValue(argument, 2, targetNames))
        .join(', ');
      body.push(
        `  const ${targetName} = await ${painterName}.image.${operation.method}(${args});`,
      );
      targetNames.set(operation.target, targetName);
      if (operation.kind === 'image-analysis') {
        analysisResultNames.push({ key: operation.resultName, name: targetName });
      }
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

    if (operation.kind === 'create-chart') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'chart',
      );
      const chartType = operation.family === 'donut' ? 'pie' : operation.family;
      const options =
        operation.family === 'donut'
          ? { ...operation.options, type: 'donut' }
          : operation.options;
      body.push(
        `  const ${targetName} = await ${painterName}.createChart(${emitString(chartType)}, ${emitValue(operation.data, 2, targetNames)}, ${emitValue(options, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'create-comparison-chart') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'comparisonChart',
      );
      body.push(
        `  const ${targetName} = await ${painterName}.createComparisonChart(${emitValue(operation.options, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'create-combo-chart') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'comboChart',
      );
      body.push(
        `  const ${targetName} = await ${painterName}.createComboChart(${emitValue(operation.options, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'create-scene') {
      const builderName = names.allocate(
        (operation.preferredName || 'scene') + 'Builder',
        'sceneBuilder',
      );
      const bufferName = names.allocate(
        (operation.preferredName || 'scene') + 'Buffer',
        'sceneBuffer',
      );
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'sceneLayer',
      );
      const base = emitTargetReference(operation.base, targetNames);
      body.push(
        `  const ${builderName} = ${painterName}.createScene(${emitValue(operation.definition, 2, targetNames)});`,
      );
      body.push(
        `  const ${bufferName} = await ${builderName}.render({ resolveAssetRefs: true });`,
      );
      body.push(
        `  const ${targetName} = await ${painterName}.createImage(${emitValue({ source: { $studioTarget: operation.target + '__sceneBuffer' }, ...operation.placement }, 2, new Map([...targetNames, [operation.target + '__sceneBuffer', bufferName]]))}, ${base});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'render-template') {
      let templateName = templateNames.get(operation.definitionId);
      if (!templateName) {
        templateName = names.allocate(
          operation.definitionName + 'Template',
          'template',
        );
        templateNames.set(operation.definitionId, templateName);
        body.push(
          `  const ${templateName} = ${painterName}.createTemplate(${emitValue(operation.definition, 2, targetNames)});`,
        );
      }
      const bufferName = names.allocate(
        (operation.preferredName || 'template') + 'Buffer',
        'templateBuffer',
      );
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'templateLayer',
      );
      const renderOptions = {
        ...(Object.keys(operation.overrides).length
          ? { overrides: operation.overrides }
          : {}),
        ...(operation.insertions.length
          ? { insertions: operation.insertions }
          : {}),
      };
      body.push(
        `  const ${bufferName} = await ${templateName}.render(${emitValue(operation.data, 2, targetNames)}${Object.keys(renderOptions).length ? ', ' + emitValue(renderOptions, 2, targetNames) : ''});`,
      );
      const base = emitTargetReference(operation.base, targetNames);
      body.push(
        `  const ${targetName} = await ${painterName}.createImage(${emitValue({ source: { $studioTarget: operation.target + '__templateBuffer' }, ...operation.placement }, 2, new Map([...targetNames, [operation.target + '__templateBuffer', bufferName]]))}, ${base});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'path-draw') {
      const resourceName = names.allocate(
        (operation.preferredName || 'path') + 'Path',
        'path',
      );
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'pathResult',
      );
      const base = emitTargetReference(operation.base, targetNames);
      body.push(
        `  const ${resourceName} = ${painterName}.path2d.create(${emitValue(operation.commands, 2, targetNames)});`,
      );
      body.push(
        `  const ${targetName} = await ${painterName}.path2d.draw(${base}, ${resourceName}, ${emitValue(operation.options ?? {}, 2, targetNames)});`,
      );
      pathResourceNames.set(operation.sourceNodeId, resourceName);
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'path-custom') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'connector',
      );
      const base = emitTargetReference(operation.base, targetNames);
      body.push(
        `  const ${targetName} = await ${painterName}.path2d.custom(${emitValue(operation.options, 2, targetNames)}, ${base});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'pixels-manipulate') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'pixels',
      );
      const base = emitTargetReference(operation.base, targetNames);
      body.push(
        `  const ${targetName} = await ${painterName}.pixels.manipulate(${base}, ${emitValue(operation.options, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'pixels-set-color') {
      const targetName = names.allocate(
        operation.preferredName || operation.target,
        'pixel',
      );
      const base = emitTargetReference(operation.base, targetNames);
      body.push(
        `  const ${targetName} = await ${painterName}.pixels.setColor(${base}, ${operation.x}, ${operation.y}, ${emitValue(operation.color, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'pixels-get-color') {
      const targetName = names.allocate(operation.preferredName || operation.target, 'pixelColor');
      const base = emitTargetReference(operation.base, targetNames);
      body.push(
        `  const ${targetName} = await ${painterName}.pixels.getColor(${base}, ${operation.x}, ${operation.y});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'pixels-get-data') {
      const targetName = names.allocate(operation.preferredName || operation.target, 'pixelData');
      const base = emitTargetReference(operation.base, targetNames);
      const suffix = operation.region ? `, ${emitValue(operation.region, 2, targetNames)}` : '';
      body.push(
        `  const ${targetName} = await ${painterName}.pixels.getData(${base}${suffix});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'detect-path') {
      const resourceName = pathResourceNames.get(operation.pathSourceNodeId);
      if (!resourceName) {
        throw new Error(
          `Path detection references node "${operation.pathSourceNodeId}" before its Path2D resource is available.`,
        );
      }
      const targetName = names.allocate(operation.preferredName || operation.target, 'pathHit');
      body.push(
        `  const ${targetName} = await ${painterName}.detect.path(${resourceName}, ${operation.x}, ${operation.y}, ${emitValue(operation.options ?? {}, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'detect-region') {
      const targetName = names.allocate(operation.preferredName || operation.target, 'regionHit');
      body.push(
        `  const ${targetName} = await ${painterName}.detect.region(${emitValue(operation.region, 2, targetNames)}, ${operation.x}, ${operation.y}, ${emitValue(operation.options ?? {}, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'detect-any-region') {
      const targetName = names.allocate(operation.preferredName || operation.target, 'regionHit');
      body.push(
        `  const ${targetName} = await ${painterName}.detect.anyRegion(${emitValue(operation.regions, 2, targetNames)}, ${operation.x}, ${operation.y}, ${emitValue(operation.options ?? {}, 2, targetNames)});`,
      );
      targetNames.set(operation.target, targetName);
      continue;
    }

    if (operation.kind === 'detect-distance') {
      const targetName = names.allocate(operation.preferredName || operation.target, 'distance');
      body.push(
        `  const ${targetName} = await ${painterName}.detect.distance(${emitValue(operation.region, 2, targetNames)}, ${operation.x}, ${operation.y});`,
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
  const resultExpression = plan.result.member
    ? `${resultName}.${plan.result.member}`
    : resultName;
  if (options.includeAnalysisResults && analysisResultNames.length) {
    const resultEntries = analysisResultNames
      .map((item) => `${emitObjectKey(item.key)}: ${item.name}`)
      .join(', ');
    body.push(
      `  return { buffer: ${resultExpression}, studioResultsJson: JSON.stringify({ ${resultEntries} }) };`,
    );
  } else {
    body.push(`  return ${resultExpression};`);
  }

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
