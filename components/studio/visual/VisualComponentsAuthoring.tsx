'use client';

import { useMemo, useState } from 'react';
import type { StudioVirtualAsset } from '@/lib/studio/runtime/assets';
import { studioAssetReference } from '@/lib/studio/runtime/assets';
import type { VisualNode, VisualProject, VisualValue } from '@/lib/studio/visual/model';
import {
  addPhase9TemplatePlaceholder,
  capturePhase9Component,
  capturePhase9Template,
  createPhase9Scene,
  createPhase9Surface,
  detachPhase9Instance,
  expandPhase9Instance,
  instantiatePhase9Definition,
  phase9Definition,
  phase9Definitions,
  registerPhase9NamedAsset,
  registerPhase9Variable,
  setPhase9InstanceData,
  setPhase9InstanceOverrides,
  type Phase9Definition,
  type Phase9InstanceProps,
} from '@/lib/studio/visual/scene-component-contract';

type Mutate = (
  label: string,
  mutation: (current: VisualProject) => VisualProject,
) => void;

type ContextProps = {
  project: VisualProject;
  selectedIds: string[];
  assets: StudioVirtualAsset[];
  onMutate: Mutate;
  onMessage: (message: string) => void;
  onInspectorTab: (tab: 'style' | 'transform' | 'effects' | 'data' | 'advanced') => void;
};

function labelForDefinition(definition: Phase9Definition) {
  return definition.kind === 'template' ? 'Template' : 'Component';
}

export function VisualComponentsContext({
  project,
  selectedIds,
  assets,
  onMutate,
  onMessage,
  onInspectorTab,
}: ContextProps) {
  const definitions = useMemo(() => phase9Definitions(project), [project]);
  const [name, setName] = useState('Reusable block');
  const [assetId, setAssetId] = useState('');
  const [variableName, setVariableName] = useState('accent');
  const [variableValue, setVariableValue] = useState('#7c5cff');
  const [placeholderName, setPlaceholderName] = useState('title');
  const [placeholderPath, setPlaceholderPath] = useState('props.text');
  const [placeholderDefinitionId, setPlaceholderDefinitionId] = useState('');

  const capture = (kind: 'component' | 'template') => {
    try {
      let instanceId = '';
      onMutate('Create ' + kind, (current) => {
        const result =
          kind === 'component'
            ? capturePhase9Component(current, selectedIds, name)
            : capturePhase9Template(current, selectedIds, name);
        instanceId = result.instanceId;
        return result.project;
      });
      onInspectorTab('data');
      onMessage(labelForDefinition({ kind } as Phase9Definition) + ' created' + (instanceId ? ' · instance linked' : ''));
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not create reusable definition');
    }
  };

  const insert = (definition: Phase9Definition) => {
    onMutate('Insert ' + definition.kind, (current) =>
      instantiatePhase9Definition(current, definition.id, {
        x: 64 + current.document.rootNodeIds.length * 14,
        y: 64 + current.document.rootNodeIds.length * 14,
      }),
    );
    onInspectorTab('data');
    onMessage(labelForDefinition(definition) + ' instance inserted');
  };

  const addPlaceholder = () => {
    const definition = phase9Definition(project, placeholderDefinitionId);
    const targetNodeId = definition?.rootNodeIds[0];
    if (!definition || definition.kind !== 'template' || !targetNodeId) {
      onMessage('Choose a template with at least one root layer');
      return;
    }
    onMutate('Add template placeholder', (current) =>
      addPhase9TemplatePlaceholder(current, definition.id, {
        name: placeholderName,
        nodeId: targetNodeId,
        path: placeholderPath,
        defaultValue: '',
      }),
    );
    onMessage('Template placeholder added');
  };

  const registerAsset = () => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) {
      onMessage('Choose a shared asset first');
      return;
    }
    onMutate('Register named asset', (current) =>
      registerPhase9NamedAsset(current, {
        name: asset.name.replace(/\.[^.]+$/, ''),
        uri: studioAssetReference(asset),
        mime: asset.mime,
      }).project,
    );
    onMessage('Named asset registered: ' + asset.name);
  };

  const registerVariable = () => {
    onMutate('Register variable', (current) =>
      registerPhase9Variable(current, {
        name: variableName,
        value: variableValue,
      }).project,
    );
    onMessage('Variable registered: ' + variableName);
  };

  return (
    <div className="apx-media-context" data-phase9-components-context>
      <div className="apx-media-context-copy">
        <strong>Scenes, components & templates</strong>
        <span>Compose nested surfaces, capture reusable semantic blocks and author linked template data.</span>
      </div>

      <div className="apx-media-context-heading">
        <strong>Scene graph</strong>
        <span>native SceneBuilder</span>
      </div>
      <div className="apx-pre4-disabled-grid">
        <button
          type="button"
          data-phase9-add-scene
          onClick={() => {
            onMutate('Add scene', (current) => createPhase9Scene(current, { name: 'Scene' }));
            onMessage('Scene added');
          }}
        >
          New scene
        </button>
        <button
          type="button"
          data-phase9-add-surface
          onClick={() => {
            onMutate('Add surface', (current) =>
              createPhase9Surface(current, {
                name: 'Nested surface',
                parentId: selectedIds.length === 1 ? selectedIds[0] : null,
              }),
            );
            onMessage('Nested surface added');
          }}
        >
          New surface
        </button>
      </div>

      <div className="apx-media-context-heading">
        <strong>Capture selection</strong>
        <span>{selectedIds.length} selected</span>
      </div>
      <input
        className="apx-pre4-input"
        data-phase9-definition-name
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Reusable definition name"
      />
      <div className="apx-pre4-disabled-grid">
        <button type="button" data-phase9-create-component disabled={!selectedIds.length} onClick={() => capture('component')}>
          Create component
        </button>
        <button type="button" data-phase9-create-template disabled={!selectedIds.length} onClick={() => capture('template')}>
          Create template
        </button>
      </div>

      <div className="apx-media-context-heading">
        <strong>Library</strong>
        <span>{definitions.length} reusable</span>
      </div>
      <div data-phase9-definition-library>
        {definitions.length ? definitions.map((definition) => (
          <button
            className="apx-pre4-future-row"
            type="button"
            key={definition.id}
            data-phase9-definition={definition.id}
            onClick={() => insert(definition)}
          >
            <span>{definition.kind === 'template' ? '⌘' : '◇'}</span>
            <strong>{definition.name}</strong>
            <small>{labelForDefinition(definition)} · {definition.rootNodeIds.length} roots</small>
          </button>
        )) : (
          <div className="apx-pre4-empty">
            <strong>No reusable definitions</strong>
            <span>Select layers and capture them as a component or template.</span>
          </div>
        )}
      </div>

      <div className="apx-media-context-heading">
        <strong>Template placeholders</strong>
        <span>data bindings</span>
      </div>
      <select
        className="apx-pre4-input"
        data-phase9-placeholder-template
        value={placeholderDefinitionId}
        onChange={(event) => setPlaceholderDefinitionId(event.target.value)}
      >
        <option value="">Choose template…</option>
        {definitions.filter((item) => item.kind === 'template').map((definition) => (
          <option key={definition.id} value={definition.id}>{definition.name}</option>
        ))}
      </select>
      <div className="apx-pre4-property-grid">
        <label>
          <span>Name</span>
          <input className="apx-pre4-input" value={placeholderName} onChange={(event) => setPlaceholderName(event.target.value)} />
        </label>
        <label>
          <span>Path</span>
          <input className="apx-pre4-input" value={placeholderPath} onChange={(event) => setPlaceholderPath(event.target.value)} />
        </label>
      </div>
      <button type="button" data-phase9-add-placeholder onClick={addPlaceholder}>Add placeholder</button>

      <div className="apx-media-context-heading">
        <strong>Named assets</strong>
        <span>$ref registry</span>
      </div>
      <div className="apx-media-url">
        <select className="apx-pre4-input" value={assetId} onChange={(event) => setAssetId(event.target.value)}>
          <option value="">Shared asset…</option>
          {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
        </select>
        <button type="button" data-phase9-register-asset onClick={registerAsset}>Register</button>
      </div>

      <div className="apx-media-context-heading">
        <strong>Variables</strong>
        <span>named values</span>
      </div>
      <div className="apx-pre4-property-grid">
        <input className="apx-pre4-input" value={variableName} onChange={(event) => setVariableName(event.target.value)} />
        <input className="apx-pre4-input" value={variableValue} onChange={(event) => setVariableValue(event.target.value)} />
      </div>
      <button type="button" data-phase9-register-variable onClick={registerVariable}>Register variable</button>
    </div>
  );
}

type InspectorProps = {
  project: VisualProject;
  node: VisualNode;
  tab: 'style' | 'transform' | 'effects' | 'data' | 'advanced';
  onMutate: Mutate;
  onMessage: (message: string) => void;
};

export function VisualPhase9Inspector({
  project,
  node,
  tab,
  onMutate,
  onMessage,
}: InspectorProps) {
  const props = node.props as unknown as Phase9InstanceProps;
  const definition =
    node.kind === 'component' || node.kind === 'template-instance'
      ? phase9Definition(project, props.definitionId)
      : null;
  const [overridesDraft, setOverridesDraft] = useState(() =>
    JSON.stringify(props.overrides ?? {}, null, 2),
  );

  if (node.kind === 'scene' || node.kind === 'surface') {
    if (tab !== 'data' && tab !== 'advanced') return null;
    return (
      <>
        <div className="apx-pre4-inspector-title" data-phase9-scene-inspector>
          <div>
            <strong>{node.name ?? (node.kind === 'scene' ? 'Scene' : 'Surface')}</strong>
            <small>Nested SceneBuilder surface · Phase 9</small>
          </div>
          <span className="apx-pre4-type-pill">{node.kind}</span>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Scene graph</div>
          <div className="apx-canvas-runtime-note">
            <strong>{node.childIds?.length ?? 0} child layers</strong>
            <span>Nested children remain semantic Layers entries and compile to an Apexify surface layer.</span>
          </div>
        </div>
      </>
    );
  }

  if (!definition) return null;

  if (tab === 'data') {
    return (
      <>
        <div className="apx-pre4-inspector-title" data-phase9-instance-inspector>
          <div>
            <strong>{node.name ?? definition.name}</strong>
            <small>{labelForDefinition(definition)} instance · linked to {definition.name}</small>
          </div>
          <span className="apx-pre4-type-pill">{node.kind}</span>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Instance data</div>
          {definition.placeholders.length ? definition.placeholders.map((placeholder) => (
            <label className="apx-canvas-field" key={placeholder.id}>
              <span>{placeholder.name}</span>
              <input
                className="apx-pre4-input"
                data-phase9-instance-data={placeholder.name}
                value={String(props.data?.[placeholder.name] ?? placeholder.defaultValue ?? '')}
                onChange={(event) =>
                  onMutate('Template data', (current) =>
                    setPhase9InstanceData(current, node.id, placeholder.name, event.target.value),
                  )
                }
              />
            </label>
          )) : (
            <div className="apx-pre4-empty">
              <strong>No placeholders</strong>
              <span>This definition is reusable as-is. Templates can expose named placeholder bindings.</span>
            </div>
          )}
        </div>
      </>
    );
  }

  if (tab === 'advanced') {
    return (
      <>
        <div className="apx-pre4-inspector-title">
          <div>
            <strong>{node.name ?? definition.name}</strong>
            <small>Overrides, insertions & detach behavior</small>
          </div>
          <span className="apx-pre4-type-pill">linked</span>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Layer overrides</div>
          <textarea
            className="apx-text-content"
            data-phase9-overrides
            value={overridesDraft}
            onChange={(event) => setOverridesDraft(event.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(overridesDraft) as Record<string, Record<string, VisualValue>>;
                onMutate('Component overrides', (current) => setPhase9InstanceOverrides(current, node.id, parsed));
                onMessage('Instance overrides applied');
              } catch {
                onMessage('Overrides must be valid JSON');
              }
            }}
          >
            Apply overrides
          </button>
        </div>
        <div className="apx-pre4-section">
          <div className="apx-pre4-section-title">Detach / expand</div>
          <div className="apx-pre4-disabled-grid">
            <button
              type="button"
              data-phase9-detach
              onClick={() => onMutate('Detach instance', (current) => detachPhase9Instance(current, node.id))}
            >
              Detach
            </button>
            <button
              type="button"
              data-phase9-expand
              onClick={() => onMutate('Expand instance', (current) => expandPhase9Instance(current, node.id))}
            >
              Expand to group
            </button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
