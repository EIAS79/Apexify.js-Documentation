'use client';

import type { VisualProject, VisualValue } from '@/lib/studio/visual/model';
import { createVisualId } from '@/lib/studio/visual/ids';
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
  type Phase14AdvancedState,
  type Phase14BatchItem,
  type Phase14ChainStep,
  type Phase14OutputSettings,
  type Phase14PluginConfig,
} from '@/lib/studio/visual/advanced-authoring-contract';

type Mutate = (label: string, mutation: (project: VisualProject) => VisualProject) => void;
type SharedProps = {
  project: VisualProject;
  onMutate: Mutate;
};

function state(project: VisualProject): Phase14AdvancedState {
  return phase14AdvancedState(project) ?? defaultPhase14AdvancedState();
}
function output(project: VisualProject): Phase14OutputSettings {
  return phase14OutputSettings(project) ?? defaultPhase14OutputSettings();
}
function updateState(
  project: VisualProject,
  updater: (value: Phase14AdvancedState) => Phase14AdvancedState,
): VisualProject {
  return setPhase14AdvancedState(ensurePhase14Authoring(project), updater(state(project)));
}
function updateOutput(
  project: VisualProject,
  updater: (value: Phase14OutputSettings) => Phase14OutputSettings,
): VisualProject {
  return setPhase14OutputSettings(ensurePhase14Authoring(project), updater(output(project)));
}
function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}
function parseObject(value: string): Record<string, VisualValue> {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object.');
  }
  return parsed as Record<string, VisualValue>;
}
function parseArray(value: string): VisualValue[] {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array.');
  return parsed as VisualValue[];
}

function SyncBadge({ value }: { value: 'reversible' | 'normalized' | 'code-only' }) {
  return <span className="apx-advanced-sync" data-sync={value}>{value}</span>;
}

export function VisualAdvancedContext({
  project,
  onMutate,
  onPreview,
  onInspector,
}: SharedProps & { onPreview: () => void; onInspector: () => void }) {
  const active = phase14AdvancedState(project);
  const value = state(project);
  const out = output(project);

  if (!active) {
    return (
      <div className="apx-media-context apx-advanced-context" data-visual-advanced-context>
        <div className="apx-media-context-copy">
          <strong>Advanced Operations</strong>
          <span>Batch, chain, plugins and local output conversion on the real Apexify runtime.</span>
        </div>
        <button
          className="apx-canvas-apply"
          type="button"
          data-advanced-enable
          onClick={() => onMutate('Enable Advanced authoring', ensurePhase14Authoring)}
        >
          Enable Advanced authoring
        </button>
        <div className="apx-advanced-exclusions">
          <strong>Hosted-runtime exclusions</strong>
          {PHASE14_HOSTED_EXCLUSIONS.map((item) => (
            <div key={item.capability}><code>{item.capability}</code><span>{item.category}</span></div>
          ))}
        </div>
      </div>
    );
  }

  const mutate = (label: string, updater: (next: Phase14AdvancedState) => Phase14AdvancedState) =>
    onMutate(label, (current) => updateState(current, updater));

  const addBatch = (type: Phase14BatchItem['type']) => {
    const defaults: Record<Phase14BatchItem['type'], Record<string, VisualValue>> = {
      canvas: { width: 640, height: 360, colorBg: '#111827' },
      image: { source: 'rectangle', x: 80, y: 70, width: 220, height: 140, shape: { color: '#38bdf8' } },
      text: { text: 'Advanced batch', x: 400, y: 300, font: { family: 'Arial', size: 42 }, fill: { color: '#f8fafc' } },
    };
    mutate('Add batch operation', (next) => ({
      ...next,
      batch: {
        ...next.batch,
        items: [...next.batch.items, {
          id: createVisualId('advanced-batch'),
          type,
          config: defaults[type],
          sync: 'reversible',
        }],
      },
    }));
  };

  const addChain = (method: string, args: VisualValue[]) => {
    const step: Phase14ChainStep = {
      id: createVisualId('advanced-chain'),
      method,
      args,
      sync: classifyPhase14ChainMethod(method),
    };
    mutate('Add chain operation', (next) => ({
      ...next,
      chain: { ...next.chain, steps: [...next.chain.steps, step] },
    }));
  };

  const addPlugin = (kind: 'inline' | 'install' | 'registry' | 'package' | 'remove') => {
    const id = createVisualId('advanced-plugin');
    let plugin: Phase14PluginConfig;
    if (kind === 'inline' || kind === 'install') {
      plugin = {
        id,
        action: kind === 'install' ? 'install' : 'use',
        source: 'inline',
        name: 'studioPlugin' + value.plugins.length,
        apiName: 'studioApi' + value.plugins.length,
        api: { enabled: true },
        sync: 'reversible',
      };
    } else if (kind === 'registry') {
      plugin = {
        id,
        action: 'register',
        apiName: 'studioApi' + value.plugins.length,
        api: { enabled: true },
        sync: 'reversible',
      };
    } else if (kind === 'remove') {
      plugin = {
        id,
        action: 'remove',
        apiName: 'studioApi',
        sync: 'reversible',
      };
    } else {
      plugin = {
        id,
        action: 'use',
        source: 'package',
        name: 'installedPlugin',
        module: 'installed-plugin-package',
        sync: 'code-only',
      };
    }
    mutate('Add plugin operation', (next) => ({ ...next, plugins: [...next.plugins, plugin] }));
  };

  return (
    <div className="apx-media-context apx-advanced-context" data-visual-advanced-context>
      <div className="apx-media-context-copy">
        <strong>Advanced Operations</strong>
        <span>{value.execution} · {value.plugins.length} plugin ops · output {out.strategy}/{out.format}</span>
      </div>

      <div className="apx-media-mode-grid" data-advanced-execution-mode>
        <button type="button" data-active={value.execution === 'batch' || undefined} onClick={() => mutate('Use batch editor', (next) => ({ ...next, execution: 'batch' }))}>Batch</button>
        <button type="button" data-active={value.execution === 'chain' || undefined} onClick={() => mutate('Use chain editor', (next) => ({ ...next, execution: 'chain' }))}>Chain</button>
      </div>

      {value.execution === 'batch' ? (
        <div className="apx-advanced-list" data-advanced-batch-editor>
          <div className="apx-pre4-section-title">Batch operations</div>
          {value.batch.items.map((item, index) => (
            <article key={item.id} data-advanced-batch-item={item.type}>
              <div><strong>{index + 1}. {item.type}</strong><SyncBadge value={item.sync} /></div>
              <small>{item.id}</small>
              <div>
                <button type="button" disabled={index === 0} onClick={() => mutate('Move batch operation', (next) => ({ ...next, batch: { ...next.batch, items: move(next.batch.items, index, index - 1) } }))}>↑</button>
                <button type="button" disabled={index === value.batch.items.length - 1} onClick={() => mutate('Move batch operation', (next) => ({ ...next, batch: { ...next.batch, items: move(next.batch.items, index, index + 1) } }))}>↓</button>
                <button type="button" disabled={value.batch.items.length <= 1} onClick={() => mutate('Remove batch operation', (next) => ({ ...next, batch: { ...next.batch, items: next.batch.items.filter((entry) => entry.id !== item.id) } }))}>×</button>
              </div>
            </article>
          ))}
          <div className="apx-advanced-add-row">
            <button type="button" onClick={() => addBatch('canvas')}>＋ Canvas</button>
            <button type="button" onClick={() => addBatch('image')}>＋ Image</button>
            <button type="button" onClick={() => addBatch('text')}>＋ Text</button>
          </div>
        </div>
      ) : (
        <div className="apx-advanced-list" data-advanced-chain-editor>
          <div className="apx-pre4-section-title">Chain operations</div>
          {value.chain.steps.map((step, index) => (
            <article key={step.id} data-advanced-chain-step={step.method}>
              <div><strong>{index + 1}. {step.method}</strong><SyncBadge value={step.sync} /></div>
              <small>{step.args.length} args</small>
              <div>
                <button type="button" disabled={index === 0} onClick={() => mutate('Move chain operation', (next) => ({ ...next, chain: { ...next.chain, steps: move(next.chain.steps, index, index - 1) } }))}>↑</button>
                <button type="button" disabled={index === value.chain.steps.length - 1} onClick={() => mutate('Move chain operation', (next) => ({ ...next, chain: { ...next.chain, steps: move(next.chain.steps, index, index + 1) } }))}>↓</button>
                <button type="button" disabled={value.chain.steps.length <= 1} onClick={() => mutate('Remove chain operation', (next) => ({ ...next, chain: { ...next.chain, steps: next.chain.steps.filter((entry) => entry.id !== step.id) } }))}>×</button>
              </div>
            </article>
          ))}
          <div className="apx-advanced-add-row">
            <button type="button" onClick={() => addChain('createCanvas', [{ width: 640, height: 360, colorBg: '#111827' }])}>＋ Canvas</button>
            <button type="button" onClick={() => addChain('createText', [{ text: 'Chain text', x: 160, y: 120, font: { family: 'Arial', size: 32 }, fill: { color: '#ffffff' } }, 'current'])}>＋ Text</button>
            <button type="button" onClick={() => addChain('image.effects', ['current', { grayscale: true }])}>＋ Image effect</button>
          </div>
        </div>
      )}

      <div className="apx-advanced-list" data-advanced-plugin-editor>
        <div className="apx-pre4-section-title">Plugins</div>
        {value.plugins.map((plugin) => (
          <article key={plugin.id}>
            <div>
              <strong>{plugin.action === 'register' || plugin.action === 'remove' ? plugin.apiName : plugin.name}</strong>
              <SyncBadge value={plugin.sync} />
            </div>
            <small>{plugin.action}{'source' in plugin ? ' · ' + plugin.source : ''}</small>
            <button type="button" onClick={() => mutate('Remove plugin operation', (next) => ({ ...next, plugins: next.plugins.filter((entry) => entry.id !== plugin.id) }))}>×</button>
          </article>
        ))}
        <div className="apx-advanced-add-row">
          <button type="button" onClick={() => addPlugin('inline')}>＋ Use inline</button>
          <button type="button" onClick={() => addPlugin('install')}>＋ Install inline</button>
          <button type="button" onClick={() => addPlugin('registry')}>＋ Registry API</button>
          <button type="button" onClick={() => addPlugin('package')}>＋ Package plugin</button>
          <button type="button" onClick={() => addPlugin('remove')}>＋ Remove API</button>
        </div>
      </div>

      <div className="apx-advanced-actions">
        <button className="apx-canvas-apply" type="button" onClick={onPreview}>Run advanced preview</button>
        <button type="button" onClick={onInspector}>Open Advanced inspector</button>
      </div>

      <div className="apx-advanced-exclusions" data-advanced-hosted-exclusions>
        <strong>Explicit exclusions</strong>
        {PHASE14_HOSTED_EXCLUSIONS.map((item) => (
          <div key={item.capability}><code>{item.capability}</code><span>{item.category}</span></div>
        ))}
      </div>
    </div>
  );
}

export function VisualAdvancedInspector({
  project,
  onMutate,
  inspectorTab,
  onMessage,
}: SharedProps & {
  inspectorTab: 'style' | 'transform' | 'effects' | 'data' | 'advanced';
  onMessage: (message: string) => void;
}) {
  const value = state(project);
  const out = output(project);
  const mutate = (label: string, updater: (next: Phase14AdvancedState) => Phase14AdvancedState) =>
    onMutate(label, (current) => updateState(current, updater));
  const mutateOutput = (label: string, updater: (next: Phase14OutputSettings) => Phase14OutputSettings) =>
    onMutate(label, (current) => updateOutput(current, updater));

  if (inspectorTab === 'data') {
    return (
      <div data-visual-advanced-inspector>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Structured results</div>
          <label className="apx-canvas-check"><input type="checkbox" checked={value.results.includeExecutionSummary} onChange={(event) => mutate('Advanced execution summary', (next) => ({ ...next, results: { ...next.results, includeExecutionSummary: event.target.checked } }))}/><span>Execution summary JSON</span></label>
          <label className="apx-canvas-check"><input type="checkbox" checked={value.results.includePluginRegistry} onChange={(event) => mutate('Advanced plugin result', (next) => ({ ...next, results: { ...next.results, includePluginRegistry: event.target.checked } }))}/><span>Plugin registry snapshot</span></label>
          <label className="apx-canvas-check"><input type="checkbox" checked={value.results.includeExclusions} onChange={(event) => mutate('Advanced exclusion result', (next) => ({ ...next, results: { ...next.results, includeExclusions: event.target.checked } }))}/><span>Hosted-runtime exclusions</span></label>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Plugin configuration JSON</div>
          <textarea
            className="apx-canvas-json apx-canvas-json--config"
            defaultValue={JSON.stringify(value.plugins, null, 2)}
            key={JSON.stringify(value.plugins)}
            data-advanced-plugins-json
            onBlur={(event) => {
              try {
                const parsed = JSON.parse(event.target.value);
                if (!Array.isArray(parsed)) throw new Error('Plugins must be an array.');
                mutate('Apply plugin JSON', (next) => ({ ...next, plugins: parsed as Phase14PluginConfig[] }));
                onMessage('Plugin configuration applied');
              } catch (error) {
                onMessage(error instanceof Error ? error.message : 'Invalid plugin JSON');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (inspectorTab !== 'advanced') {
    return (
      <div className="apx-pre4-empty" data-visual-advanced-inspector>
        <strong>Advanced project operation</strong>
        <span>Use Data for structured/plugin results or Advanced for execution and output controls.</span>
      </div>
    );
  }

  return (
    <div data-visual-advanced-inspector>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Execution</div>
        <div className="apx-pre4-property-grid">
          <label>
            <span>Mode</span>
            <select className="apx-pre4-input" value={value.execution} onChange={(event) => mutate('Advanced mode', (next) => ({ ...next, execution: event.target.value as Phase14AdvancedState['execution'] }))}>
              <option value="chain">Chain</option>
              <option value="batch">Batch</option>
            </select>
          </label>
          <label>
            <span>Batch concurrency</span>
            <input className="apx-pre4-input" type="number" min={1} max={64} value={value.batch.concurrency} onChange={(event) => mutate('Batch concurrency', (next) => ({ ...next, batch: { ...next.batch, concurrency: Math.max(1, Math.min(64, Number(event.target.value) || 1)) } }))}/>
          </label>
        </div>
        <label className="apx-canvas-check"><input type="checkbox" checked={value.preResolve} onChange={(event) => mutate('Prepare for render', (next) => ({ ...next, preResolve: event.target.checked }))}/><span>Pre-resolve authored operations with prepareForRender()</span></label>
        <label className="apx-canvas-check"><input type="checkbox" checked={value.batch.resolveAssetRefs} onChange={(event) => mutate('Batch asset refs', (next) => ({ ...next, batch: { ...next.batch, resolveAssetRefs: event.target.checked } }))}/><span>Batch resolves named asset refs</span></label>
        <label className="apx-canvas-check"><input type="checkbox" checked={value.chain.resolveAssetRefs} onChange={(event) => mutate('Chain asset refs', (next) => ({ ...next, chain: { ...next.chain, resolveAssetRefs: event.target.checked } }))}/><span>Chain resolves named asset refs</span></label>
      </div>

      <div className="apx-pre4-section" data-advanced-output-settings>
        <div className="apx-pre4-section-title">Runtime output conversion</div>
        <div className="apx-pre4-property-grid">
          <label>
            <span>Strategy</span>
            <select className="apx-pre4-input" value={out.strategy} onChange={(event) => mutateOutput('Output strategy', (next) => {
              const strategy = event.target.value as Phase14OutputSettings['strategy'];
              return { ...next, strategy, sync: strategy === 'legacy-outPut' ? 'normalized' : 'reversible' };
            })}>
              <option value="direct">Output facet</option>
              <option value="toOutput">toOutput()</option>
              <option value="legacy-outPut">outPut() legacy alias</option>
            </select>
          </label>
          <label>
            <span>Format</span>
            <select className="apx-pre4-input" value={out.format} onChange={(event) => mutateOutput('Output format', (next) => ({ ...next, format: event.target.value as Phase14OutputSettings['format'] }))}>
              <option value="buffer">Buffer</option>
              <option value="dataURL">Data URL</option>
              <option value="base64">Base64</option>
              <option value="blob">Blob</option>
              <option value="arrayBuffer">ArrayBuffer</option>
            </select>
          </label>
          <label>
            <span>Filename</span>
            <input className="apx-pre4-input" value={out.fileName} onChange={(event) => mutateOutput('Output filename', (next) => ({ ...next, fileName: event.target.value }))}/>
          </label>
        </div>
        <div className="apx-advanced-output-note"><SyncBadge value={out.sync}/><span>No URL upload or host filesystem save is generated.</span></div>
      </div>

      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Complete Advanced Operations JSON</div>
        <textarea
          className="apx-canvas-json apx-canvas-json--config"
          defaultValue={JSON.stringify(value, null, 2)}
          key={JSON.stringify(value)}
          data-advanced-state-json
          onBlur={(event) => {
            try {
              const parsed = JSON.parse(event.target.value) as Phase14AdvancedState;
              onMutate('Apply Advanced JSON', (current) => setPhase14AdvancedState(ensurePhase14Authoring(current), parsed));
              onMessage('Advanced operations JSON applied');
            } catch {
              onMessage('Advanced operations JSON is invalid');
            }
          }}
        />
      </div>

      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Chain step JSON</div>
        {value.chain.steps.map((step) => (
          <div className="apx-advanced-step-editor" key={step.id}>
            <label><span>Method</span><input className="apx-pre4-input" value={step.method} onChange={(event) => {
              const method = event.target.value;
              mutate('Chain method', (next) => ({
                ...next,
                chain: {
                  ...next.chain,
                  steps: next.chain.steps.map((entry) => entry.id === step.id ? { ...entry, method, sync: classifyPhase14ChainMethod(method) } : entry),
                },
              }));
            }}/></label>
            <SyncBadge value={step.sync}/>
            <textarea
              className="apx-canvas-json"
              defaultValue={JSON.stringify(step.args, null, 2)}
              key={step.id + JSON.stringify(step.args)}
              onBlur={(event) => {
                try {
                  const args = parseArray(event.target.value);
                  mutate('Chain args', (next) => ({
                    ...next,
                    chain: { ...next.chain, steps: next.chain.steps.map((entry) => entry.id === step.id ? { ...entry, args } : entry) },
                  }));
                } catch (error) {
                  onMessage(error instanceof Error ? error.message : 'Invalid chain args JSON');
                }
              }}
            />
          </div>
        ))}
      </div>

      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Batch config JSON</div>
        {value.batch.items.map((item) => (
          <div className="apx-advanced-step-editor" key={item.id}>
            <strong>{item.type}</strong>
            <textarea
              className="apx-canvas-json"
              defaultValue={JSON.stringify(item.config, null, 2)}
              key={item.id + JSON.stringify(item.config)}
              onBlur={(event) => {
                try {
                  const config = parseObject(event.target.value);
                  mutate('Batch config', (next) => ({
                    ...next,
                    batch: { ...next.batch, items: next.batch.items.map((entry) => entry.id === item.id ? { ...entry, config } : entry) },
                  }));
                } catch (error) {
                  onMessage(error instanceof Error ? error.message : 'Invalid batch config JSON');
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
