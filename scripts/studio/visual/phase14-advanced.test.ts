import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createVisualProject } from '../../../lib/studio/visual/project';
import { validateVisualProject } from '../../../lib/studio/visual/compiler/validate';
import {
  PHASE14_HOSTED_EXCLUSIONS,
  classifyPhase14ChainMethod,
  defaultPhase14AdvancedState,
  defaultPhase14OutputSettings,
  ensurePhase14Authoring,
  phase14AdvancedState,
  phase14OutputSettings,
  setPhase14AdvancedState,
  setPhase14OutputSettings,
} from '../../../lib/studio/visual/advanced-authoring-contract';
import {
  PHASE14_SOURCE_MARKER,
  generatePhase14NativeSource,
  phase14ProjectFromSourceMarker,
} from '../../../lib/studio/visual/phase14-codegen';
import { generateVisualProjectCode } from '../../../lib/studio/visual/codegen/generator';
import { reconcileVisualProjectFromCode } from '../../../lib/studio/visual/codegen/reconcile';
import { planStudioExecution } from '../../../lib/studio/runtime/capabilities';

function project() {
  return ensurePhase14Authoring(createVisualProject({
    id: 'project_phase14',
    name: 'Phase 14 Advanced',
    width: 640,
    height: 360,
    now: '2026-09-24T00:00:00.000Z',
  }));
}

test('Phase 14 default advanced project is valid and fully classified', () => {
  const value = project();
  const validation = validateVisualProject(value);
  assert.equal(validation.ok, true, validation.issues.map((issue) => issue.message).join('\n'));
  const state = phase14AdvancedState(value);
  const output = phase14OutputSettings(value);
  assert.ok(state);
  assert.ok(output);
  assert.equal(state.execution, 'chain');
  assert.equal(state.preResolve, true);
  assert.equal(state.batch.concurrency, 4);
  assert.equal(state.chain.steps[0]?.sync, 'reversible');
  assert.equal(output.strategy, 'direct');
  assert.equal(output.format, 'dataURL');
  assert.equal(output.sync, 'reversible');
});

test('Phase 14 chain sync classifier distinguishes reversible, normalized and code-only methods', () => {
  assert.equal(classifyPhase14ChainMethod('createCanvas'), 'reversible');
  assert.equal(classifyPhase14ChainMethod('createText'), 'reversible');
  assert.equal(classifyPhase14ChainMethod('image.effects'), 'normalized');
  assert.equal(classifyPhase14ChainMethod('customPlugin.render'), 'code-only');
});

test('Phase 14 generated chain code is deterministic and uses real public Apexify APIs', () => {
  const value = project();
  const a = generatePhase14NativeSource(value);
  const b = generatePhase14NativeSource(value);
  assert.equal(a, b);
  assert.ok(a.includes(PHASE14_SOURCE_MARKER));
  assert.ok(a.includes('painter.prepareForRender('));
  assert.ok(a.includes('await painter.chain('));
  assert.ok(a.includes('await painter.use('));
  assert.ok(a.includes('painter.output.dataURL(primaryBuffer)'));
  assert.ok(a.includes('painter.plugins.list()'));
  assert.ok(a.includes('hostedRuntimeExclusions'));
  assert.ok(!a.includes('painter.save('));
  assert.ok(!a.includes('painter.saveMultiple('));
  assert.ok(!a.includes('painter.output.url('));
});

test('Phase 14 preview routes Advanced APIs to the authoritative full runtime', () => {
  const source = generatePhase14NativeSource(project());
  const execution = planStudioExecution(source);
  assert.equal(execution.backend, 'full-runtime');
  assert.ok(execution.families.includes('batch'));
  assert.ok(execution.families.includes('plugins'));
  assert.ok(execution.families.includes('output'));
});

test('Phase 14 batch code emits bounded concurrency and asset-resolution options', () => {
  let value = project();
  value = setPhase14AdvancedState(value, {
    ...defaultPhase14AdvancedState(),
    execution: 'batch',
    batch: {
      ...defaultPhase14AdvancedState().batch,
      concurrency: 3,
      resolveAssetRefs: true,
    },
  });
  const source = generatePhase14NativeSource(value);
  assert.ok(source.includes('await painter.batch('));
  assert.ok(source.includes('painter.prepareForRender('));
  assert.ok(source.includes('concurrency: 3'));
  assert.ok(source.includes('resolveAssetRefs: true'));
  assert.ok(source.includes('executionOutputs[0]'));
});

test('Phase 14 exposes toOutput and normalized legacy outPut without URL output', () => {
  let value = project();
  value = setPhase14OutputSettings(value, {
    ...defaultPhase14OutputSettings(),
    strategy: 'toOutput',
    format: 'blob',
    sync: 'reversible',
  });
  let source = generatePhase14NativeSource(value);
  assert.ok(source.includes("new ApexPainter({ type: \"blob\" })"));
  assert.ok(source.includes('await painter.toOutput(primaryBuffer)'));

  value = setPhase14OutputSettings(value, {
    ...defaultPhase14OutputSettings(),
    strategy: 'legacy-outPut',
    format: 'base64',
    sync: 'normalized',
  });
  source = generatePhase14NativeSource(value);
  assert.ok(source.includes("new ApexPainter({ type: \"base64\" })"));
  assert.ok(source.includes('await painter.outPut(primaryBuffer)'));
  assert.ok(!source.includes('output.url'));
});

test('Phase 14 plugin lifecycle code covers install, registry and removal while package plugins are code-only', () => {
  const base = defaultPhase14AdvancedState();
  let value = project();
  value = setPhase14AdvancedState(value, {
    ...base,
    plugins: [
      {
        id: 'plugin-install',
        action: 'install',
        source: 'inline',
        name: 'inlinePlugin',
        apiName: 'inlineApi',
        api: { enabled: true },
        sync: 'reversible',
      },
      {
        id: 'plugin-register',
        action: 'register',
        apiName: 'registryApi',
        api: { version: 1 },
        sync: 'reversible',
      },
      {
        id: 'plugin-remove',
        action: 'remove',
        apiName: 'oldApi',
        sync: 'reversible',
      },
      {
        id: 'plugin-package',
        action: 'use',
        source: 'package',
        name: 'packagePlugin',
        module: '@scope/apexify-plugin',
        exportName: 'plugin',
        sync: 'code-only',
      },
    ],
  });
  const validation = validateVisualProject(value);
  assert.equal(validation.ok, true, validation.issues.map((issue) => issue.message).join('\n'));
  const source = generatePhase14NativeSource(value);
  assert.ok(source.includes('await painter.plugins.install('));
  assert.ok(source.includes('painter.plugins.use("registryApi"'));
  assert.ok(source.includes('painter.plugins.remove("oldApi")'));
  assert.ok(source.includes('await import("@scope/apexify-plugin")'));
  assert.ok(source.includes('await painter.use('));
});

test('Phase 14 source marker restores exact Advanced operations and output settings', () => {
  const value = project();
  const source = generateVisualProjectCode(value).source;
  const parsed = phase14ProjectFromSourceMarker(source);
  assert.ok(parsed);
  assert.deepEqual(parsed.operations, value.operations);
  assert.deepEqual(parsed.outputs, value.outputs);

  const current = createVisualProject({
    id: 'project_phase14_target',
    name: 'Target',
    width: 320,
    height: 180,
    now: '2026-09-24T00:00:00.000Z',
  });
  const result = reconcileVisualProjectFromCode(current, source);
  assert.equal(result.ok, true, result.ok ? undefined : result.error);
  if (!result.ok) return;
  assert.deepEqual(result.project.operations, value.operations);
  assert.deepEqual(result.project.outputs, value.outputs);
});

test('Phase 14 validation rejects malformed method, package module and unsafe output shape', () => {
  let value = project();
  const state = phase14AdvancedState(value)!;
  value = setPhase14AdvancedState(value, {
    ...state,
    chain: {
      ...state.chain,
      steps: [{
        ...state.chain.steps[0]!,
        method: 'bad method()',
        sync: 'code-only',
      }],
    },
    plugins: [{
      id: 'bad-package',
      action: 'use',
      source: 'package',
      name: 'badPlugin',
      module: '../escape',
      sync: 'code-only',
    }],
  });
  value = setPhase14OutputSettings(value, {
    strategy: 'direct',
    format: 'dataURL',
    fileName: '../outside.png',
    sync: 'reversible',
  });
  const validation = validateVisualProject(value);
  assert.equal(validation.ok, false);
  assert.ok(validation.issues.some((issue) => issue.code === 'phase14-chain-method'));
  assert.ok(validation.issues.some((issue) => issue.code === 'phase14-plugin-module'));
  assert.ok(validation.issues.some((issue) => issue.code === 'phase14-output-name'));
});

test('Phase 14 hosted-runtime exclusions are explicit and stable', () => {
  assert.deepEqual(
    PHASE14_HOSTED_EXCLUSIONS.map((item) => item.capability),
    [
      'ApexPainter.save',
      'ApexPainter.saveMultiple',
      'ApexPainter.createAudio.save',
      'ApexPainter.output.url',
    ],
  );
  assert.equal(PHASE14_HOSTED_EXCLUSIONS.filter((item) => item.category === 'host-persistence').length, 3);
  assert.equal(PHASE14_HOSTED_EXCLUSIONS.filter((item) => item.category === 'external-service').length, 1);
});

test('Phase 14 UI occupies Advanced, Diagnostics and Export without creating a permanent dock', () => {
  const ui = fs.readFileSync('components/studio/visual/VisualAdvancedAuthoring.tsx', 'utf8');
  const shell = fs.readFileSync('components/studio/visual/VisualStudioPre4.tsx', 'utf8');
  for (const marker of [
    'data-visual-advanced-context',
    'data-advanced-batch-editor',
    'data-advanced-chain-editor',
    'data-advanced-plugin-editor',
    'data-advanced-hosted-exclusions',
    'data-visual-advanced-inspector',
    'data-advanced-output-settings',
  ]) assert.ok(ui.includes(marker), marker + ' missing');
  assert.ok(shell.includes("['advanced', WrenchScrewdriverIcon, 'Advanced']"));
  assert.ok(shell.includes('<VisualAdvancedContext'));
  assert.ok(shell.includes('<VisualAdvancedInspector'));
  assert.ok(shell.includes('data-advanced-export-settings'));
  assert.ok(shell.includes('data-phase14-results'));
  assert.ok(shell.includes('phase14Active || phase13Active || phase12Active'));
  assert.ok(!shell.includes('<VisualAdvancedDock'));
});

test('Phase 14 documentation runtime pin includes the batch facade fix', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const executor = fs.readFileSync('lib/studio/runtime/isolatedNodeExecutor.ts', 'utf8');
  const pin = '50f2543482abbd7a9624192a060ec01330370bef';
  assert.equal(pkg.dependencies['apexify.js'], 'github:EIAS79/Apexify.js#' + pin);
  assert.ok(executor.includes('github:EIAS79/Apexify.js#' + pin));
});
