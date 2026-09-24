import type {
  VisualProject,
  VisualProjectIssue,
  VisualProjectRecord,
  VisualValue,
} from './model';

export const PHASE14_OPERATION_KIND = 'advanced-authoring-stack' as const;
export const PHASE14_OUTPUT_KIND = 'advanced-output-settings' as const;

export type Phase14SyncClass = 'reversible' | 'normalized' | 'code-only';
export type Phase14ExecutionMode = 'batch' | 'chain';
export type Phase14BatchType = 'canvas' | 'image' | 'text';
export type Phase14OutputStrategy = 'direct' | 'toOutput' | 'legacy-outPut';
export type Phase14OutputFormat = 'buffer' | 'dataURL' | 'base64' | 'blob' | 'arrayBuffer';

export type Phase14BatchItem = {
  id: string;
  type: Phase14BatchType;
  config: Record<string, VisualValue>;
  sync: 'reversible';
};

export type Phase14ChainStep = {
  id: string;
  method: string;
  args: VisualValue[];
  sync: Phase14SyncClass;
};

export type Phase14PluginConfig =
  | {
      id: string;
      action: 'use' | 'install';
      source: 'inline';
      name: string;
      apiName: string;
      api: Record<string, VisualValue>;
      sync: 'reversible';
    }
  | {
      id: string;
      action: 'use' | 'install';
      source: 'package';
      name: string;
      module: string;
      exportName?: string;
      sync: 'code-only';
    }
  | {
      id: string;
      action: 'register';
      apiName: string;
      api: Record<string, VisualValue>;
      sync: 'reversible';
    }
  | {
      id: string;
      action: 'remove';
      apiName: string;
      sync: 'reversible';
    };

export type Phase14AdvancedState = {
  execution: Phase14ExecutionMode;
  preResolve: boolean;
  batch: {
    concurrency: number;
    resolveAssetRefs: boolean;
    items: Phase14BatchItem[];
  };
  chain: {
    resolveAssetRefs: boolean;
    steps: Phase14ChainStep[];
  };
  plugins: Phase14PluginConfig[];
  results: {
    includeExecutionSummary: boolean;
    includePluginRegistry: boolean;
    includeExclusions: boolean;
  };
};

export type Phase14OutputSettings = {
  strategy: Phase14OutputStrategy;
  format: Phase14OutputFormat;
  fileName: string;
  sync: 'reversible' | 'normalized';
};

export type Phase14HostedExclusion = {
  capability: string;
  category: 'host-persistence' | 'external-service';
  reason: string;
};

export const PHASE14_HOSTED_EXCLUSIONS: readonly Phase14HostedExclusion[] = Object.freeze([
  {
    capability: 'ApexPainter.save',
    category: 'host-persistence',
    reason: 'Host filesystem persistence is outside the Studio execution contract.',
  },
  {
    capability: 'ApexPainter.saveMultiple',
    category: 'host-persistence',
    reason: 'Host filesystem persistence is outside the Studio execution contract.',
  },
  {
    capability: 'ApexPainter.createAudio.save',
    category: 'host-persistence',
    reason: 'Host filesystem persistence is outside the Studio execution contract.',
  },
  {
    capability: 'ApexPainter.output.url',
    category: 'external-service',
    reason: 'Credentialed Imgur transfer and unrestricted third-party egress remain outside Studio.',
  },
]);

const REVERSIBLE_CHAIN_METHODS = new Set([
  'createCanvas',
  'createImage',
  'createText',
  'path2d.draw',
  'path2d.custom',
  'pixels.setData',
  'pixels.manipulate',
  'pixels.setColor',
]);

const NORMALIZED_CHAIN_METHODS = new Set([
  'image.resize',
  'image.crop',
  'image.effects',
  'image.blend',
  'image.mask',
  'image.gradient',
  'image.convert',
  'image.compress',
]);

export function classifyPhase14ChainMethod(method: string): Phase14SyncClass {
  if (REVERSIBLE_CHAIN_METHODS.has(method)) return 'reversible';
  if (NORMALIZED_CHAIN_METHODS.has(method)) return 'normalized';
  return 'code-only';
}

export function defaultPhase14AdvancedState(): Phase14AdvancedState {
  return {
    execution: 'chain',
    preResolve: true,
    batch: {
      concurrency: 4,
      resolveAssetRefs: true,
      items: [
        {
          id: 'advanced-batch-canvas',
          type: 'canvas',
          sync: 'reversible',
          config: { width: 640, height: 360, colorBg: '#0b1020' },
        },
        {
          id: 'advanced-batch-text',
          type: 'text',
          sync: 'reversible',
          config: {
            text: 'APEXIFY BATCH',
            x: 400,
            y: 300,
            font: { family: 'Arial', size: 44 },
            bold: true,
            fill: { color: '#f8fafc' },
            textAlign: 'center',
            textBaseline: 'middle',
          },
        },
      ],
    },
    chain: {
      resolveAssetRefs: true,
      steps: [
        {
          id: 'advanced-chain-canvas',
          method: 'createCanvas',
          sync: 'reversible',
          args: [{ width: 640, height: 360, colorBg: '#0b1020' }],
        },
        {
          id: 'advanced-chain-text',
          method: 'createText',
          sync: 'reversible',
          args: [
            {
              text: 'APEXIFY ADVANCED',
              x: 320,
              y: 180,
              font: { family: 'Arial', size: 40 },
              bold: true,
              fill: { color: '#f8fafc' },
              textAlign: 'center',
              textBaseline: 'middle',
            },
            'current',
          ],
        },
      ],
    },
    plugins: [
      {
        id: 'advanced-plugin-metadata',
        action: 'use',
        source: 'inline',
        name: 'studio-metadata',
        apiName: 'studioMetadata',
        api: { phase: 14, enabled: true },
        sync: 'reversible',
      },
    ],
    results: {
      includeExecutionSummary: true,
      includePluginRegistry: true,
      includeExclusions: true,
    },
  };
}

export function defaultPhase14OutputSettings(): Phase14OutputSettings {
  return {
    strategy: 'direct',
    format: 'dataURL',
    fileName: 'apexify-advanced.png',
    sync: 'reversible',
  };
}

function operationRecord(state: Phase14AdvancedState): VisualProjectRecord {
  return {
    id: 'advanced-operations',
    kind: PHASE14_OPERATION_KIND,
    name: 'Advanced operations',
    value: structuredClone(state) as unknown as Record<string, VisualValue>,
  };
}

function outputRecord(settings: Phase14OutputSettings): VisualProjectRecord {
  return {
    id: 'advanced-output',
    kind: PHASE14_OUTPUT_KIND,
    name: 'Advanced output',
    value: structuredClone(settings) as unknown as Record<string, VisualValue>,
  };
}

function advancedShape(record: VisualProjectRecord | undefined): Phase14AdvancedState | null {
  if (!record || record.kind !== PHASE14_OPERATION_KIND) return null;
  if (!record.value || typeof record.value !== 'object' || Array.isArray(record.value)) return null;
  const value = record.value as unknown as Phase14AdvancedState;
  if (!['batch', 'chain'].includes(value.execution)) return null;
  if (!value.batch || !Array.isArray(value.batch.items)) return null;
  if (!value.chain || !Array.isArray(value.chain.steps)) return null;
  if (!Array.isArray(value.plugins)) return null;
  if (!value.results || typeof value.results !== 'object') return null;
  return value;
}

function outputShape(record: VisualProjectRecord | undefined): Phase14OutputSettings | null {
  if (!record || record.kind !== PHASE14_OUTPUT_KIND) return null;
  if (!record.value || typeof record.value !== 'object' || Array.isArray(record.value)) return null;
  const value = record.value as unknown as Phase14OutputSettings;
  if (!['direct', 'toOutput', 'legacy-outPut'].includes(value.strategy)) return null;
  if (!['buffer', 'dataURL', 'base64', 'blob', 'arrayBuffer'].includes(value.format)) return null;
  return value;
}

export function phase14AdvancedState(project: VisualProject): Phase14AdvancedState | null {
  return advancedShape(project.operations.find((item) => item.kind === PHASE14_OPERATION_KIND));
}

export function phase14OutputSettings(project: VisualProject): Phase14OutputSettings | null {
  return outputShape(project.outputs.find((item) => item.kind === PHASE14_OUTPUT_KIND));
}

export function hasPhase14Authoring(project: VisualProject): boolean {
  return phase14AdvancedState(project) !== null || phase14OutputSettings(project) !== null;
}

export function setPhase14AdvancedState(
  project: VisualProject,
  state: Phase14AdvancedState,
): VisualProject {
  const next = structuredClone(project);
  const record = operationRecord(state);
  const index = next.operations.findIndex((item) => item.kind === PHASE14_OPERATION_KIND);
  if (index >= 0) next.operations[index] = record;
  else next.operations.push(record);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function setPhase14OutputSettings(
  project: VisualProject,
  settings: Phase14OutputSettings,
): VisualProject {
  const next = structuredClone(project);
  const record = outputRecord(settings);
  const index = next.outputs.findIndex((item) => item.kind === PHASE14_OUTPUT_KIND);
  if (index >= 0) next.outputs[index] = record;
  else next.outputs.push(record);
  next.updatedAt = new Date().toISOString();
  return next;
}

export function ensurePhase14Authoring(project: VisualProject): VisualProject {
  let next = project;
  if (!phase14AdvancedState(next)) next = setPhase14AdvancedState(next, defaultPhase14AdvancedState());
  if (!phase14OutputSettings(next)) next = setPhase14OutputSettings(next, defaultPhase14OutputSettings());
  return next;
}

function push(
  issues: VisualProjectIssue[],
  code: string,
  path: string,
  message: string,
) {
  issues.push({ severity: 'error', code, path, message });
}

const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/;
const API_NAME = /^[A-Za-z_][\w.-]*$/;
const METHOD = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;
const MODULE = /^(?:@[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+|[A-Za-z0-9._-]+)$/;

function unique<T extends { id: string }>(
  items: T[],
  issues: VisualProjectIssue[],
  path: string,
) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (!ID.test(item.id) || seen.has(item.id)) {
      push(issues, 'phase14-id', path + '[' + index + '].id', 'Advanced operation ids must be valid and unique.');
    }
    seen.add(item.id);
  });
}

export function validatePhase14Project(project: VisualProject): VisualProjectIssue[] {
  const issues: VisualProjectIssue[] = [];
  const operationRecords = project.operations.filter((item) => item.kind === PHASE14_OPERATION_KIND);
  const outputRecords = project.outputs.filter((item) => item.kind === PHASE14_OUTPUT_KIND);
  if (!operationRecords.length && !outputRecords.length) return issues;
  if (operationRecords.length !== 1) {
    push(issues, 'phase14-operation-count', 'operations', 'Phase 14 requires exactly one Advanced operations record when active.');
  }
  if (outputRecords.length !== 1) {
    push(issues, 'phase14-output-count', 'outputs', 'Phase 14 requires exactly one Advanced output record when active.');
  }
  const state = advancedShape(operationRecords[0]);
  const output = outputShape(outputRecords[0]);
  if (!state) {
    push(issues, 'phase14-operation-shape', 'operations.advanced', 'Advanced operations state has an invalid shape.');
    return issues;
  }
  if (!output) {
    push(issues, 'phase14-output-shape', 'outputs.advanced', 'Advanced output settings have an invalid shape.');
    return issues;
  }

  if (typeof state.preResolve !== 'boolean') {
    push(issues, 'phase14-pre-resolve', 'operations.advanced.preResolve', 'Pre-resolve must be true or false.');
  }

  if (!Number.isInteger(state.batch.concurrency) || state.batch.concurrency < 1 || state.batch.concurrency > 4) {
    push(issues, 'phase14-concurrency', 'operations.advanced.batch.concurrency', 'Batch concurrency must be an integer between 1 and the current runtime limit of 4.');
  }
  if (typeof state.batch.resolveAssetRefs !== 'boolean') {
    push(issues, 'phase14-resolve-assets', 'operations.advanced.batch.resolveAssetRefs', 'Batch resolveAssetRefs must be boolean.');
  }
  if (state.batch.items.length < 1 || state.batch.items.length > 128) {
    push(issues, 'phase14-batch-size', 'operations.advanced.batch.items', 'Batch must contain between 1 and 128 operations.');
  }
  unique(state.batch.items, issues, 'operations.advanced.batch.items');
  state.batch.items.forEach((item, index) => {
    const path = 'operations.advanced.batch.items[' + index + ']';
    if (!['canvas', 'image', 'text'].includes(item.type)) {
      push(issues, 'phase14-batch-type', path + '.type', 'Batch operation must be canvas, image, or text.');
    }
    if (!item.config || typeof item.config !== 'object' || Array.isArray(item.config)) {
      push(issues, 'phase14-batch-config', path + '.config', 'Batch operation config must be a JSON object.');
    }
    if (item.sync !== 'reversible') {
      push(issues, 'phase14-sync', path + '.sync', 'Batch operations are reversible canonical operations.');
    }
  });

  if (typeof state.chain.resolveAssetRefs !== 'boolean') {
    push(issues, 'phase14-resolve-assets', 'operations.advanced.chain.resolveAssetRefs', 'Chain resolveAssetRefs must be boolean.');
  }
  if (state.chain.steps.length < 1 || state.chain.steps.length > 128) {
    push(issues, 'phase14-chain-size', 'operations.advanced.chain.steps', 'Chain must contain between 1 and 128 operations.');
  }
  unique(state.chain.steps, issues, 'operations.advanced.chain.steps');
  state.chain.steps.forEach((step, index) => {
    const path = 'operations.advanced.chain.steps[' + index + ']';
    if (!METHOD.test(step.method)) {
      push(issues, 'phase14-chain-method', path + '.method', 'Chain method must be a public dotted method path.');
    }
    if (!Array.isArray(step.args) || step.args.length > 32) {
      push(issues, 'phase14-chain-args', path + '.args', 'Chain args must contain at most 32 JSON-compatible values.');
    }
    const expected = classifyPhase14ChainMethod(step.method);
    if (step.sync !== expected) {
      push(issues, 'phase14-sync', path + '.sync', 'Chain sync classification must match the canonical Phase 14 classifier.');
    }
  });

  if (state.plugins.length > 32) {
    push(issues, 'phase14-plugin-size', 'operations.advanced.plugins', 'At most 32 plugin operations can be authored.');
  }
  unique(state.plugins, issues, 'operations.advanced.plugins');
  const pluginNames = new Set<string>();
  state.plugins.forEach((plugin, index) => {
    const path = 'operations.advanced.plugins[' + index + ']';
    if (plugin.action === 'register' || plugin.action === 'remove') {
      if (!API_NAME.test(plugin.apiName)) {
        push(issues, 'phase14-plugin-api', path + '.apiName', 'Plugin API name is invalid.');
      }
      if (plugin.action === 'register' && (!plugin.api || typeof plugin.api !== 'object' || Array.isArray(plugin.api))) {
        push(issues, 'phase14-plugin-api', path + '.api', 'Registered plugin API must be a JSON object.');
      }
      if (plugin.sync !== 'reversible') {
        push(issues, 'phase14-sync', path + '.sync', 'Registry plugin operations are reversible.');
      }
      return;
    }
    if (!API_NAME.test(plugin.name)) {
      push(issues, 'phase14-plugin-name', path + '.name', 'Plugin name is invalid.');
    }
    if (pluginNames.has(plugin.name)) {
      push(issues, 'phase14-plugin-name', path + '.name', 'Plugin names must be unique.');
    }
    pluginNames.add(plugin.name);
    if (plugin.source === 'inline') {
      if (!API_NAME.test(plugin.apiName)) {
        push(issues, 'phase14-plugin-api', path + '.apiName', 'Inline plugin API name is invalid.');
      }
      if (!plugin.api || typeof plugin.api !== 'object' || Array.isArray(plugin.api)) {
        push(issues, 'phase14-plugin-api', path + '.api', 'Inline plugin API must be a JSON object.');
      }
      if (plugin.sync !== 'reversible') {
        push(issues, 'phase14-sync', path + '.sync', 'Inline Studio plugin configuration is reversible.');
      }
    } else {
      if (!MODULE.test(plugin.module)) {
        push(issues, 'phase14-plugin-module', path + '.module', 'Package plugin module must be an installed package specifier.');
      }
      if (plugin.exportName !== undefined && !/^[A-Za-z_$][\w$]*$/.test(plugin.exportName)) {
        push(issues, 'phase14-plugin-export', path + '.exportName', 'Plugin export name must be a JavaScript identifier.');
      }
      if (plugin.sync !== 'code-only') {
        push(issues, 'phase14-sync', path + '.sync', 'Package plugin installation is code-only.');
      }
    }
  });

  if (typeof state.results.includeExecutionSummary !== 'boolean' ||
      typeof state.results.includePluginRegistry !== 'boolean' ||
      typeof state.results.includeExclusions !== 'boolean') {
    push(issues, 'phase14-results', 'operations.advanced.results', 'Structured result switches must be boolean.');
  }

  if (!['direct', 'toOutput', 'legacy-outPut'].includes(output.strategy)) {
    push(issues, 'phase14-output-strategy', 'outputs.advanced.strategy', 'Unknown advanced output strategy.');
  }
  if (!['buffer', 'dataURL', 'base64', 'blob', 'arrayBuffer'].includes(output.format)) {
    push(issues, 'phase14-output-format', 'outputs.advanced.format', 'Unknown local output format.');
  }
  if (output.strategy === 'direct' && output.format === 'buffer') {
    // Buffer is a valid no-conversion local export.
  }
  if (!output.fileName.trim() || output.fileName.length > 180 || /[\\/]/.test(output.fileName)) {
    push(issues, 'phase14-output-name', 'outputs.advanced.fileName', 'Output filename must be a simple local filename.');
  }
  const expectedOutputSync: Phase14OutputSettings['sync'] =
    output.strategy === 'legacy-outPut' ? 'normalized' : 'reversible';
  if (output.sync !== expectedOutputSync) {
    push(issues, 'phase14-sync', 'outputs.advanced.sync', 'Output sync classification does not match its strategy.');
  }

  return issues;
}
