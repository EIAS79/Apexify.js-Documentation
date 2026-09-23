'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  studioAssetReference,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';
import type {
  VisualNode,
  VisualProject,
  VisualValue,
} from '@/lib/studio/visual/model';
import {
  PHASE9_NAMED_ASSET_KIND,
  PHASE9_VARIABLE_KIND,
  addPhase9TemplatePlaceholder,
  bindPhase9Reference,
  capturePhase9Component,
  capturePhase9Template,
  createPhase9Scene,
  createPhase9Surface,
  detachPhase9Instance,
  expandPhase9Instance,
  instantiatePhase9Definition,
  phase9ComponentDefinitions,
  phase9Definition,
  phase9TemplateDefinitions,
  registerPhase9NamedAsset,
  registerPhase9Variable,
  setPhase9InstanceData,
  setPhase9InstanceInsertions,
  setPhase9InstanceOverrides,
  type Phase9SceneLayer,
} from '@/lib/studio/visual/scene-component-contract';

type Mutate = (
  label: string,
  updater: (project: VisualProject) => VisualProject,
) => void;

type ContextProps = {
  project: VisualProject;
  selectedIds: string[];
  assets: StudioVirtualAsset[];
  onMutate: Mutate;
  onMessage: (message: string) => void;
  onInspectorTab?: (tab: 'data' | 'advanced' | 'transform') => void;
};

type InspectorProps = {
  project: VisualProject;
  node: VisualNode;
  tab: 'style' | 'transform' | 'effects' | 'data' | 'advanced';
  onMutate: Mutate;
  onMessage: (message: string) => void;
  renderTransform: () => React.ReactNode;
};

function parseLooseValue(raw: string): VisualValue {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed) as VisualValue;
  } catch {
    return raw;
  }
}

function recordValue(value: unknown): Record<string, VisualValue> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, VisualValue>
    : {};
}

function instanceDefinitionId(node: VisualNode): string {
  return typeof node.props.definitionId === 'string'
    ? node.props.definitionId
    : '';
}

function defaultReferencePath(node: VisualNode): string {
  if (node.kind === 'text') return 'props.text';
  if (node.kind === 'image' || node.kind === 'shape') return 'props.source';
  if (node.kind === 'component' || node.kind === 'template-instance') {
    return 'props.data.value';
  }
  return 'props.background';
}

export function VisualComponentsContext({
  project,
  selectedIds,
  assets,
  onMutate,
  onMessage,
  onInspectorTab,
}: ContextProps) {
  const [captureName, setCaptureName] = useState('Reusable block');
  const [variableName, setVariableName] = useState('brandTitle');
  const [variableValue, setVariableValue] = useState('Apexify');
  const [assetName, setAssetName] = useState('heroImage');
  const [assetUri, setAssetUri] = useState('');
  const components = phase9ComponentDefinitions(project);
  const templates = phase9TemplateDefinitions(project);
  const primary = selectedIds.length
    ? project.document.nodes[selectedIds[selectedIds.length - 1]]
    : undefined;
  const parentId =
    primary && (primary.kind === 'scene' || primary.kind === 'surface')
      ? primary.id
      : null;

  const registerSharedAsset = (asset: StudioVirtualAsset) => {
    onMutate('Register named asset', (current) =>
      registerPhase9NamedAsset(current, {
        name: asset.name.replace(/\.[^.]+$/, '') || 'asset',
        uri: studioAssetReference(asset),
        mime: asset.mime,
      }).project,
    );
    onMessage('Registered named asset ' + asset.name);
  };

  return (
    <div className="apx-media-context" data-visual-components-context>
      <div className="apx-media-context-copy">
        <strong>Scenes & components</strong>
        <span>
          Build nested SceneBuilder surfaces, reusable components and data-driven
          templates without leaving the semantic layer tree.
        </span>
      </div>

      <div className="apx-media-context-heading">
        <strong>Scene structure</strong>
        <span>{parentId ? 'inside selection' : 'document root'}</span>
      </div>
      <div className="apx-pre4-disabled-grid">
        <button
          type="button"
          data-scene-add
          onClick={() => {
            onMutate('Add scene', (current) =>
              createPhase9Scene(current, {
                name: 'Scene',
                parentId,
                x: parentId ? 24 : 0,
                y: parentId ? 24 : 0,
                width: parentId
                  ? Math.max(120, (primary?.transform?.width ?? current.document.width) - 48)
                  : current.document.width,
                height: parentId
                  ? Math.max(120, (primary?.transform?.height ?? current.document.height) - 48)
                  : current.document.height,
              }),
            );
            onInspectorTab?.('data');
            onMessage('Scene added');
          }}
        >
          New scene
        </button>
        <button
          type="button"
          data-surface-add
          onClick={() => {
            onMutate('Add nested surface', (current) =>
              createPhase9Surface(current, {
                name: 'Nested surface',
                parentId,
                x: parentId ? 32 : 72,
                y: parentId ? 32 : 72,
                width: Math.min(520, Math.max(180, current.document.width * 0.58)),
                height: Math.min(340, Math.max(140, current.document.height * 0.5)),
              }),
            );
            onInspectorTab?.('data');
            onMessage(parentId ? 'Nested surface added' : 'Surface added');
          }}
        >
          New surface
        </button>
      </div>

      <div className="apx-media-context-heading">
        <strong>Create reusable</strong>
        <span>{selectedIds.length ? selectedIds.length + ' selected' : 'select layers'}</span>
      </div>
      <div className="apx-media-url">
        <input
          className="apx-pre4-input"
          value={captureName}
          aria-label="Component or template name"
          onChange={(event) => setCaptureName(event.target.value)}
          data-phase9-capture-name
        />
      </div>
      <div className="apx-pre4-disabled-grid">
        <button
          type="button"
          disabled={!selectedIds.length}
          data-component-create
          onClick={() => {
            try {
              onMutate('Create component', (current) =>
                capturePhase9Component(current, selectedIds, captureName).project,
              );
              onInspectorTab?.('data');
              onMessage('Component created from selection');
            } catch (error) {
              onMessage(error instanceof Error ? error.message : 'Could not create component');
            }
          }}
        >
          Make component
        </button>
        <button
          type="button"
          disabled={!selectedIds.length}
          data-template-create
          onClick={() => {
            try {
              onMutate('Create template', (current) =>
                capturePhase9Template(current, selectedIds, captureName).project,
              );
              onInspectorTab?.('data');
              onMessage('Template created from selection');
            } catch (error) {
              onMessage(error instanceof Error ? error.message : 'Could not create template');
            }
          }}
        >
          Make template
        </button>
      </div>

      <div className="apx-media-context-heading">
        <strong>Component library</strong>
        <span>{components.length}</span>
      </div>
      <div className="apx-pre4-disabled-grid" data-component-library>
        {components.length ? components.map((definition) => (
          <button
            type="button"
            key={definition.id}
            data-component-insert={definition.id}
            onClick={() => {
              onMutate('Insert component', (current) =>
                instantiatePhase9Definition(current, definition.id, {
                  x: 84,
                  y: 84,
                  parentId,
                }),
              );
              onInspectorTab?.('data');
              onMessage('Inserted ' + definition.name);
            }}
          >
            {definition.name}
          </button>
        )) : (
          <button type="button" disabled>No components yet</button>
        )}
      </div>

      <div className="apx-media-context-heading">
        <strong>Template library</strong>
        <span>{templates.length}</span>
      </div>
      <div className="apx-pre4-disabled-grid" data-template-library>
        {templates.length ? templates.map((definition) => (
          <button
            type="button"
            key={definition.id}
            data-template-insert={definition.id}
            onClick={() => {
              onMutate('Insert template', (current) =>
                instantiatePhase9Definition(current, definition.id, {
                  x: 104,
                  y: 104,
                  parentId,
                }),
              );
              onInspectorTab?.('data');
              onMessage('Inserted ' + definition.name);
            }}
          >
            {definition.name}
          </button>
        )) : (
          <button type="button" disabled>No templates yet</button>
        )}
      </div>

      <div className="apx-media-context-heading">
        <strong>Named assets</strong>
        <span>{project.assets.filter((item) => item.kind === PHASE9_NAMED_ASSET_KIND).length}</span>
      </div>
      {assets.filter((asset) => asset.mime.startsWith('image/')).slice(0, 4).map((asset) => (
        <button
          type="button"
          className="apx-pre4-future-row"
          key={asset.id}
          onClick={() => registerSharedAsset(asset)}
          data-register-shared-asset={asset.id}
        >
          <span>◫</span>
          <strong>{asset.name}</strong>
          <small>Register as painter.assets image</small>
        </button>
      ))}
      <div className="apx-media-url">
        <input
          className="apx-pre4-input"
          value={assetName}
          aria-label="Named asset name"
          placeholder="assetName"
          onChange={(event) => setAssetName(event.target.value)}
          data-named-asset-name
        />
        <input
          className="apx-pre4-input"
          value={assetUri}
          aria-label="Named asset URI"
          placeholder="https://… or ./assets/…"
          onChange={(event) => setAssetUri(event.target.value)}
          data-named-asset-uri
        />
        <button
          type="button"
          disabled={!assetName.trim() || !assetUri.trim()}
          data-named-asset-register
          onClick={() => {
            onMutate('Register named asset', (current) =>
              registerPhase9NamedAsset(current, {
                name: assetName,
                uri: assetUri,
              }).project,
            );
            onMessage('Named asset registered');
          }}
        >
          Register
        </button>
      </div>

      <div className="apx-media-context-heading">
        <strong>Variables</strong>
        <span>{project.variables.filter((item) => item.kind === PHASE9_VARIABLE_KIND).length}</span>
      </div>
      <div className="apx-media-url">
        <input
          className="apx-pre4-input"
          value={variableName}
          aria-label="Variable name"
          placeholder="variableName"
          onChange={(event) => setVariableName(event.target.value)}
          data-phase9-variable-name
        />
        <input
          className="apx-pre4-input"
          value={variableValue}
          aria-label="Variable value"
          placeholder={'"value" or JSON'}
          onChange={(event) => setVariableValue(event.target.value)}
          data-phase9-variable-value
        />
        <button
          type="button"
          disabled={!variableName.trim()}
          data-phase9-variable-register
          onClick={() => {
            onMutate('Register variable', (current) =>
              registerPhase9Variable(current, {
                name: variableName,
                value: parseLooseValue(variableValue),
              }).project,
            );
            onMessage('Variable registered');
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export function VisualPhase9Inspector({
  project,
  node,
  tab,
  onMutate,
  onMessage,
  renderTransform,
}: InspectorProps) {
  const isInstance = node.kind === 'component' || node.kind === 'template-instance';
  const isContainer = node.kind === 'scene' || node.kind === 'surface';
  const definition = isInstance
    ? phase9Definition(project, instanceDefinitionId(node))
    : null;
  const [overridesDraft, setOverridesDraft] = useState('{}');
  const [insertionsDraft, setInsertionsDraft] = useState('[]');
  const [backgroundDraft, setBackgroundDraft] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [placeholderName, setPlaceholderName] = useState('title');
  const [placeholderNodeId, setPlaceholderNodeId] = useState('');
  const [placeholderPath, setPlaceholderPath] = useState('props.text');
  const [refPath, setRefPath] = useState(defaultReferencePath(node));
  const [refKey, setRefKey] = useState('');

  useEffect(() => {
    const props = recordValue(node.props);
    setOverridesDraft(JSON.stringify(recordValue(props.overrides), null, 2));
    setInsertionsDraft(JSON.stringify(Array.isArray(props.insertions) ? props.insertions : [], null, 2));
    setBackgroundDraft(JSON.stringify(recordValue(props.background), null, 2));
    setRefPath(defaultReferencePath(node));
    setJsonError(null);
  }, [node.id, node.props]);

  useEffect(() => {
    if (!definition) {
      setPlaceholderNodeId('');
      return;
    }
    if (!placeholderNodeId || !definition.nodes[placeholderNodeId]) {
      setPlaceholderNodeId(definition.rootNodeIds[0] ?? Object.keys(definition.nodes)[0] ?? '');
    }
  }, [definition?.id, placeholderNodeId]);

  const references = useMemo(() => [
    ...project.assets
      .filter((item) => item.kind === PHASE9_NAMED_ASSET_KIND)
      .map((item) => ({ kind: 'asset' as const, id: item.id, label: item.name ?? item.id })),
    ...project.variables
      .filter((item) => item.kind === PHASE9_VARIABLE_KIND)
      .map((item) => ({ kind: 'variable' as const, id: item.id, label: item.name ?? item.id })),
    ...project.palettes
      .map((item) => ({ kind: 'palette' as const, id: item.id, label: item.name ?? item.id })),
  ], [project.assets, project.variables, project.palettes]);

  useEffect(() => {
    if (!refKey && references[0]) setRefKey(references[0].kind + ':' + references[0].id);
  }, [refKey, references]);

  if (tab === 'transform' || tab === 'style' || tab === 'effects') {
    return renderTransform();
  }

  const header = (
    <div className="apx-pre4-inspector-title">
      <div>
        <strong>{node.name ?? node.kind}</strong>
        <small>
          {isInstance && definition
            ? definition.kind + ' · ' + definition.name
            : isContainer
              ? 'SceneBuilder semantic container'
              : 'Phase 9 semantic node'}
        </small>
      </div>
      <span className="apx-pre4-type-pill">{node.kind}</span>
    </div>
  );

  if (tab === 'data') {
    return (
      <>
        {header}
        {isContainer ? (
          <div className="apx-pre4-section" data-phase9-container-data>
            <div className="apx-pre4-section-title">Scene structure</div>
            <div className="apx-pre4-property-grid">
              <label>
                <span>Children</span>
                <input className="apx-pre4-input" readOnly value={node.childIds?.length ?? 0} />
              </label>
              <label>
                <span>Surface type</span>
                <input className="apx-pre4-input" readOnly value={node.kind} />
              </label>
            </div>
            <small className="apx-canvas-hint">
              Nested surfaces remain visible and reorderable in Layers. Code generation lowers this tree to Apexify SceneBuilder layers.
            </small>
          </div>
        ) : null}

        {isInstance && definition ? (
          <>
            <div className="apx-pre4-section" data-phase9-instance-data>
              <div className="apx-pre4-section-title">Instance data</div>
              {definition.placeholders.length ? definition.placeholders.map((placeholder) => {
                const data = recordValue(node.props.data);
                const current = data[placeholder.name] ?? placeholder.defaultValue ?? '';
                return (
                  <label className="apx-canvas-field" key={placeholder.id}>
                    <span>{placeholder.name}</span>
                    <input
                      className="apx-pre4-input"
                      value={typeof current === 'string' ? current : JSON.stringify(current)}
                      data-template-placeholder-value={placeholder.name}
                      onChange={(event) => {
                        const value = parseLooseValue(event.target.value);
                        onMutate('Template data ' + placeholder.name, (currentProject) =>
                          setPhase9InstanceData(currentProject, node.id, placeholder.name, value),
                        );
                      }}
                    />
                  </label>
                );
              }) : (
                <small className="apx-canvas-hint">
                  This definition has no placeholders yet. Add them from Advanced.
                </small>
              )}
            </div>
            <div className="apx-pre4-section">
              <div className="apx-pre4-section-title">Instance lifecycle</div>
              <div className="apx-pre4-disabled-grid">
                <button
                  type="button"
                  data-instance-expand
                  onClick={() => {
                    onMutate('Expand instance', (current) => expandPhase9Instance(current, node.id));
                    onMessage('Instance expanded to an editable group');
                  }}
                >
                  Expand
                </button>
                <button
                  type="button"
                  data-instance-detach
                  onClick={() => {
                    onMutate('Detach instance', (current) => detachPhase9Instance(current, node.id));
                    onMessage('Instance detached into independent layers');
                  }}
                >
                  Detach
                </button>
              </div>
            </div>
          </>
        ) : null}

        {!isInstance && !isContainer ? (
          <div className="apx-pre4-section">
            <div className="apx-pre4-section-title">Reference binding</div>
            <small className="apx-canvas-hint">
              Bind this node to a named asset, variable or palette with a stable $ref.
            </small>
            <input
              className="apx-pre4-input"
              value={refPath}
              aria-label="Reference target path"
              onChange={(event) => setRefPath(event.target.value)}
              data-reference-path
            />
            <select
              className="apx-pre4-input"
              value={refKey}
              onChange={(event) => setRefKey(event.target.value)}
              data-reference-source
            >
              {references.map((ref) => (
                <option key={ref.kind + ':' + ref.id} value={ref.kind + ':' + ref.id}>
                  {ref.kind} · {ref.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!refKey || !refPath.trim()}
              data-reference-bind
              onClick={() => {
                const [kind, ...idParts] = refKey.split(':');
                const id = idParts.join(':');
                if (kind !== 'asset' && kind !== 'variable' && kind !== 'palette') return;
                onMutate('Bind reference', (current) =>
                  bindPhase9Reference(current, node.id, refPath, { kind, id }),
                );
                onMessage('Reference bound');
              }}
            >
              Bind $ref
            </button>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      {header}
      {isContainer ? (
        <div className="apx-pre4-section" data-phase9-container-advanced>
          <div className="apx-pre4-section-title">Scene background</div>
          <textarea
            className="apx-text-content"
            value={backgroundDraft}
            onChange={(event) => setBackgroundDraft(event.target.value)}
            data-scene-background-json
          />
          <button
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(backgroundDraft) as VisualValue;
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                  throw new Error('Scene background must be a JSON object.');
                }
                onMutate('Scene background', (current) => {
                  const next = structuredClone(current);
                  const target = next.document.nodes[node.id];
                  if (!target) return current;
                  target.props = { ...target.props, background: parsed };
                  next.updatedAt = new Date().toISOString();
                  return next;
                });
                setJsonError(null);
                onMessage('Scene background applied');
              } catch (error) {
                setJsonError(error instanceof Error ? error.message : 'Invalid scene background JSON');
              }
            }}
          >
            Apply background
          </button>
        </div>
      ) : null}

      {isInstance && definition ? (
        <>
          <div className="apx-pre4-section" data-phase9-overrides>
            <div className="apx-pre4-section-title">Layer overrides</div>
            <textarea
              className="apx-text-content"
              value={overridesDraft}
              onChange={(event) => setOverridesDraft(event.target.value)}
              data-instance-overrides
            />
            <button
              type="button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(overridesDraft);
                  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    throw new Error('Overrides must be a JSON object keyed by definition layer id.');
                  }
                  onMutate('Instance overrides', (current) =>
                    setPhase9InstanceOverrides(
                      current,
                      node.id,
                      parsed as Record<string, Record<string, VisualValue>>,
                    ),
                  );
                  setJsonError(null);
                  onMessage('Instance overrides applied');
                } catch (error) {
                  setJsonError(error instanceof Error ? error.message : 'Invalid overrides JSON');
                }
              }}
            >
              Apply overrides
            </button>
          </div>

          <div className="apx-pre4-section" data-phase9-insertions>
            <div className="apx-pre4-section-title">Template insertions</div>
            <textarea
              className="apx-text-content"
              value={insertionsDraft}
              onChange={(event) => setInsertionsDraft(event.target.value)}
              data-instance-insertions
            />
            <button
              type="button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(insertionsDraft);
                  if (!Array.isArray(parsed)) {
                    throw new Error('Insertions must be a JSON array.');
                  }
                  onMutate('Template insertions', (current) =>
                    setPhase9InstanceInsertions(
                      current,
                      node.id,
                      parsed as Array<{
                        targetId: string;
                        position: 'before' | 'after';
                        layers: Phase9SceneLayer | Phase9SceneLayer[];
                      }>,
                    ),
                  );
                  setJsonError(null);
                  onMessage('Template insertions applied');
                } catch (error) {
                  setJsonError(error instanceof Error ? error.message : 'Invalid insertions JSON');
                }
              }}
            >
              Apply insertions
            </button>
            <small className="apx-canvas-hint">
              Native Apexify schema: targetId, position (before/after), and layer/layers definitions.
            </small>
          </div>

          {definition.kind === 'template' ? (
            <div className="apx-pre4-section" data-template-placeholder-editor>
              <div className="apx-pre4-section-title">Placeholder editor</div>
              <input
                className="apx-pre4-input"
                value={placeholderName}
                placeholder="placeholder name"
                onChange={(event) => setPlaceholderName(event.target.value)}
                data-template-placeholder-name
              />
              <select
                className="apx-pre4-input"
                value={placeholderNodeId}
                onChange={(event) => setPlaceholderNodeId(event.target.value)}
                data-template-placeholder-node
              >
                {Object.values(definition.nodes).map((definitionNode) => (
                  <option key={definitionNode.id} value={definitionNode.id}>
                    {definitionNode.name ?? definitionNode.kind} · {definitionNode.id}
                  </option>
                ))}
              </select>
              <input
                className="apx-pre4-input"
                value={placeholderPath}
                placeholder="props.text"
                onChange={(event) => setPlaceholderPath(event.target.value)}
                data-template-placeholder-path
              />
              <button
                type="button"
                disabled={!placeholderName.trim() || !placeholderNodeId || !placeholderPath.trim()}
                data-template-add-placeholder
                onClick={() => {
                  try {
                    onMutate('Add template placeholder', (current) =>
                      addPhase9TemplatePlaceholder(current, definition.id, {
                        name: placeholderName,
                        nodeId: placeholderNodeId,
                        path: placeholderPath,
                      }),
                    );
                    onMessage('Template placeholder added');
                  } catch (error) {
                    onMessage(error instanceof Error ? error.message : 'Could not add placeholder');
                  }
                }}
              >
                Add placeholder
              </button>
              {definition.placeholders.map((placeholder) => (
                <div className="apx-pre4-future-row" key={placeholder.id}>
                  <span>{'{{' + placeholder.name + '}}'}</span>
                  <strong>{definition.nodes[placeholder.nodeId]?.name ?? placeholder.nodeId}</strong>
                  <small>{placeholder.path}</small>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="apx-pre4-section" data-phase9-reference-binding>
        <div className="apx-pre4-section-title">Named reference binding</div>
        <input
          className="apx-pre4-input"
          value={refPath}
          onChange={(event) => setRefPath(event.target.value)}
          data-reference-path
        />
        <select
          className="apx-pre4-input"
          value={refKey}
          onChange={(event) => setRefKey(event.target.value)}
          data-reference-source
        >
          {references.map((ref) => (
            <option key={ref.kind + ':' + ref.id} value={ref.kind + ':' + ref.id}>
              {ref.kind} · {ref.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!refKey || !refPath.trim()}
          data-reference-bind
          onClick={() => {
            const [kind, ...idParts] = refKey.split(':');
            const id = idParts.join(':');
            if (kind !== 'asset' && kind !== 'variable' && kind !== 'palette') return;
            onMutate('Bind reference', (current) =>
              bindPhase9Reference(current, node.id, refPath, { kind, id }),
            );
            onMessage('Reference bound');
          }}
        >
          Bind $ref
        </button>
      </div>

      {jsonError ? <div className="apx-live-code-error">{jsonError}</div> : null}
    </>
  );
}
