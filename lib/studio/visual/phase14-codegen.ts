import type { VisualProject } from './model';
import {
  PHASE14_HOSTED_EXCLUSIONS,
  hasPhase14Authoring,
  phase14AdvancedState,
  phase14OutputSettings,
  type Phase14AdvancedState,
  type Phase14OutputSettings,
  type Phase14PluginConfig,
} from './advanced-authoring-contract';

export const PHASE14_SOURCE_MARKER = 'apexify-studio-v14:';

function semanticPayload(project: VisualProject): string {
  return encodeURIComponent(JSON.stringify(project)).replace(/\*/g, '%2A');
}

function emit(value: unknown, indent = 0): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return '[\n' +
      value.map((item) => ' '.repeat(indent + 2) + emit(item, indent + 2)).join(',\n') +
      ',\n' + ' '.repeat(indent) + ']';
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined);
    if (!entries.length) return '{}';
    return '{\n' +
      entries.map(([key, item]) =>
        ' '.repeat(indent + 2) +
        (/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)) +
        ': ' + emit(item, indent + 2),
      ).join(',\n') +
      ',\n' + ' '.repeat(indent) + '}';
  }
  throw new Error('Unsupported Phase 14 code value: ' + String(value));
}

function safeIdentifier(value: string, index: number): string {
  const normalized = value.replace(/[^A-Za-z0-9_$]+/g, '_').replace(/^([^A-Za-z_$])/, '_$1');
  return (normalized || 'plugin') + '_' + String(index + 1);
}

function pluginLines(plugin: Phase14PluginConfig, index: number): string[] {
  const lines: string[] = [];
  if (plugin.action === 'register') {
    lines.push('  painter.plugins.use(' + JSON.stringify(plugin.apiName) + ', ' + emit(plugin.api, 2) + ');');
    return lines;
  }
  if (plugin.action === 'remove') {
    lines.push('  painter.plugins.remove(' + JSON.stringify(plugin.apiName) + ');');
    return lines;
  }

  if (plugin.source === 'inline') {
    const open = plugin.action === 'install'
      ? '  await painter.plugins.install({'
      : '  await painter.use({';
    const close = plugin.action === 'install' ? '  }, painter);' : '  });';
    lines.push(
      open,
      '    name: ' + JSON.stringify(plugin.name) + ',',
      '    async install(host) {',
      '      host.plugins.use(' + JSON.stringify(plugin.apiName) + ', ' + emit(plugin.api, 6).replace(/\n/g, '\n      ') + ');',
      '    },',
      close,
    );
    return lines;
  }

  const variable = safeIdentifier(plugin.name, index);
  const moduleVariable = variable + 'Module';
  const exportExpression = plugin.exportName
    ? moduleVariable + '[' + JSON.stringify(plugin.exportName) + ']'
    : '(' + moduleVariable + '.default ?? ' + moduleVariable + ')';
  lines.push(
    '  const ' + moduleVariable + ' = await import(' + JSON.stringify(plugin.module) + ');',
    '  const ' + variable + ' = ' + exportExpression + ';',
  );
  if (plugin.action === 'install') {
    lines.push('  await painter.plugins.install(' + variable + ', painter);');
  } else {
    lines.push('  await painter.use(' + variable + ');');
  }
  return lines;
}

function outputType(format: Phase14OutputSettings['format']): string {
  if (format === 'arrayBuffer') return 'arraybuffer';
  return format;
}

function outputExpression(settings: Phase14OutputSettings): string {
  if (settings.strategy === 'toOutput') return 'await painter.toOutput(primaryBuffer)';
  if (settings.strategy === 'legacy-outPut') return 'await painter.outPut(primaryBuffer)';
  if (settings.format === 'buffer') return 'primaryBuffer';
  if (settings.format === 'dataURL') return 'painter.output.dataURL(primaryBuffer)';
  if (settings.format === 'base64') return 'painter.output.base64(primaryBuffer)';
  if (settings.format === 'blob') return 'painter.output.blob(primaryBuffer)';
  return 'painter.output.arrayBuffer(primaryBuffer)';
}

function batchOperationsExpression(state: Phase14AdvancedState): string {
  const rows = state.batch.items.map((item) => {
    const config = emit(item.config, 6).replace(/\n/g, '\n    ');
    const resolvedConfig = state.preResolve
      ? 'painter.prepareForRender(' + config + ')'
      : config;
    return [
      '    {',
      '      type: ' + JSON.stringify(item.type) + ',',
      '      config: ' + resolvedConfig + ',',
      '    }',
    ].join('\n');
  });
  return '[\n' + rows.join(',\n') + ',\n  ]';
}

function chainOperationsExpression(state: Phase14AdvancedState): string {
  const rows = state.chain.steps.map((step) => {
    const args = emit(step.args, 6).replace(/\n/g, '\n    ');
    const resolvedArgs = state.preResolve
      ? 'painter.prepareForRender(' + args + ')'
      : args;
    return [
      '    {',
      '      method: ' + JSON.stringify(step.method) + ',',
      '      args: ' + resolvedArgs + ',',
      '    }',
    ].join('\n');
  });
  return '[\n' + rows.join(',\n') + ',\n  ]';
}

function generatedBody(
  state: Phase14AdvancedState,
  output: Phase14OutputSettings,
  preview = false,
): string {
  const constructor =
    output.strategy === 'direct'
      ? 'new ApexPainter()'
      : 'new ApexPainter({ type: ' + JSON.stringify(outputType(output.format)) + ' })';
  const lines: string[] = [
    "import { ApexPainter } from 'apexify.js';",
    '',
    'const painter = ' + constructor + ';',
    '',
    'async function main() {',
  ];

  const executablePlugins = preview
    ? state.plugins.filter((plugin) => plugin.sync !== 'code-only')
    : state.plugins;
  const skippedCodeOnlyPlugins = preview
    ? state.plugins.filter((plugin) => plugin.sync === 'code-only')
    : [];

  executablePlugins.forEach((plugin, index) => {
    lines.push(...pluginLines(plugin, index));
  });
  if (executablePlugins.length) lines.push('');

  const operationCount = state.execution === 'batch'
    ? state.batch.items.length
    : state.chain.steps.length;
  const syncClasses = state.execution === 'batch'
    ? state.batch.items.map((item) => item.sync)
    : state.chain.steps.map((item) => item.sync);

  lines.push(
    '  const authoredOperationCount = ' + String(operationCount) + ';',
    '  const authoredSyncClasses = ' + emit(syncClasses) + ';',
  );

  if (state.execution === 'batch') {
    lines.push(
      '  const executionOutputs = await painter.batch(',
      '  ' + batchOperationsExpression(state).replace(/\n/g, '\n  ') + ',',
      '  ' + emit({
        concurrency: state.batch.concurrency,
        resolveAssetRefs: state.batch.resolveAssetRefs,
      }).replace(/\n/g, '\n  ') + ',',
      '  );',
      '  const primaryBuffer = executionOutputs[0];',
      "  if (!primaryBuffer) throw new Error('Phase 14 batch produced no output.');",
    );
  } else {
    lines.push(
      '  const primaryBuffer = await painter.chain(',
      '  ' + chainOperationsExpression(state).replace(/\n/g, '\n  ') + ',',
      '  ' + emit({ resolveAssetRefs: state.chain.resolveAssetRefs }).replace(/\n/g, '\n  ') + ',',
      '  );',
      '  const executionOutputs = [primaryBuffer];',
    );
  }
  lines.push(
    '  const finalOutput = ' + outputExpression(output) + ';',
    '  const structuredResult = {',
    '    phase: 14,',
    '    execution: ' + JSON.stringify(state.execution) + ',',
    '    operationCount: authoredOperationCount,',
    '    output: ' + emit({
      strategy: output.strategy,
      format: output.format,
      fileName: output.fileName,
      sync: output.sync,
    }, 4).replace(/\n/g, '\n    ') + ',',
  );

  if (state.results.includePluginRegistry) {
    lines.push(
      '    plugins: {',
      '      registered: painter.plugins.list(),',
      '      installed: painter.plugins.listInstalled(),',
      '    },',
    );
  }
  if (state.results.includeExecutionSummary) {
    lines.push(
      '    executionSummary: {',
      '      outputs: executionOutputs.length,',
      '      preResolved: ' + String(state.preResolve) + ',',
      '      syncClasses: authoredSyncClasses,',
      '    },',
    );
  }
  if (state.results.includeExclusions) {
    lines.push(
      '    hostedRuntimeExclusions: ' + emit(PHASE14_HOSTED_EXCLUSIONS, 4).replace(/\n/g, '\n    ') + ',',
      '    codeOnlyPreviewSkips: ' + emit(
        skippedCodeOnlyPlugins.map((plugin) => ({
          id: plugin.id,
          name: 'name' in plugin ? plugin.name : plugin.apiName,
          reason: 'Code-only package plugin is emitted for export but not executed by hosted Studio Preview.',
        })),
        4,
      ).replace(/\n/g, '\n    ') + ',',
    );
  }
  lines.push(
    '  };',
    '  return [finalOutput, ...executionOutputs.slice(1), structuredResult];',
    '}',
    '',
    'return await main();',
    '',
  );
  return lines.join('\n');
}

export function phase14ProjectFromSourceMarker(source: string): VisualProject | null {
  const match = source.match(/\/\*\s*apexify-studio-v14:([^*]+)\*\//);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1].trim())) as VisualProject;
  } catch {
    return null;
  }
}

export { hasPhase14Authoring };

export function generatePhase14NativeSource(project: VisualProject): string {
  const state = phase14AdvancedState(project);
  const output = phase14OutputSettings(project);
  if (!state || !output) {
    throw new Error('Phase 14 code generation requires Advanced operations and output settings.');
  }
  return '/* ' + PHASE14_SOURCE_MARKER + semanticPayload(project) + ' */\n' +
    generatedBody(state, output, false);
}

export function generatePhase14PreviewSource(project: VisualProject): string {
  const state = phase14AdvancedState(project);
  const output = phase14OutputSettings(project);
  if (!state || !output) {
    throw new Error('Phase 14 preview generation requires Advanced operations and output settings.');
  }
  return '/* ' + PHASE14_SOURCE_MARKER + semanticPayload(project) + ' */\n' +
    generatedBody(state, output, true);
}
