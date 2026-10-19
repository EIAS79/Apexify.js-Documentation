"use client";
import AdvancedLayerEditor from "./AdvancedLayerEditor";
import { PRESETS } from "../presets";
import { useState } from "react";
import {
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Square2StackIcon,
  PhotoIcon,
  SwatchIcon,
  SparklesIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceDocument, WorkspaceLayer } from "../model";
import { Field, NumberField, IconButton } from "./ui";
import { UploadImage, type LayerPatch } from "./Tools";
export default function Inspector({
  document,
  selected,
  onDocument,
  onLayer,
  onSelect,
  onRemove,
  onReorder,
  onPreset,
  onUpload,
  onError,
  tab,
  setTab,
}: {
  document: WorkspaceDocument;
  selected: string | null;
  onDocument: (patch: Partial<WorkspaceDocument>) => void;
  onLayer: (id: string, patch: LayerPatch) => void;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onReorder: (id: string, delta: number) => void;
  onPreset: (id: string) => void;
  onUpload: (source: string, name: string) => void;
  onError: (message: string) => void;
  tab: string;
  setTab: (tab: string) => void;
}) {
  const layer = document.layers.find((l) => l.id === selected);
  const bg = document.background;
  const [showLayers, setShowLayers] = useState(true);
  const background = (patch: Partial<WorkspaceDocument["background"]>) =>
    onDocument({ background: { ...bg, ...patch } });
  return (
    <div className="aw-inspector">
      <div className="aw-inspector-tabs">
        {["Properties", "Presets", "Assets"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="aw-inspector-scroll">
        {tab === "Presets" ? (
          <div className="aw-preset-grid">
            {PRESETS.map(p=><button key={p.id} className="aw-template-card" onClick={()=>onPreset(p.id)}><div className="aw-preset-art" style={{background:`linear-gradient(130deg,#071020,${p.color})`}}>{p.name}</div><strong>{p.name}</strong><span>{p.description}</span></button>)}
            <p className="aw-muted">
              Loads an editable composition into the current project. Undo
              restores your previous composition.
            </p>
          </div>
        ) : tab === "Assets" ? (
          <div className="aw-assets">
            <UploadImage onUpload={onUpload} onError={onError} />
            <img
              className="aw-asset-image"
              src={bg.image}
              alt="Current background asset"
            />
            <strong>Background artwork</strong>
            <p className="aw-muted">
              PNG, JPEG, WebP · up to 4 MB. Uploaded assets travel with your
              project JSON.
            </p>
            {document.layers
              .filter((l) => l.kind === "image")
              .map((l) => (
                <button
                  key={l.id}
                  className="aw-asset-row"
                  onClick={() => {
                    onSelect(l.id);
                    setTab("Properties");
                  }}
                >
                  <PhotoIcon />
                  {l.name}
                </button>
              ))}
          </div>
        ) : (
          <>
            <div className="aw-section-heading">
              <Square2StackIcon />
              <strong>{layer ? layer.name : "Canvas"}</strong>
              {layer ? (
                <button
                  className="aw-text-button"
                  onClick={() => onSelect(null)}
                >
                  Canvas
                </button>
              ) : null}
            </div>
            {!layer ? (
              <>
                <div className="aw-field-row">
                  <NumberField
                    label="Width"
                    value={document.width}
                    min={64}
                    max={2048}
                    onChange={(width) =>
                      onDocument({ width: Math.round(width) })
                    }
                  />
                  <NumberField
                    label="Height"
                    value={document.height}
                    min={64}
                    max={2048}
                    onChange={(height) =>
                      onDocument({ height: Math.round(height) })
                    }
                  />
                </div>
                <Field label="Project name">
                  <input
                    value={document.name}
                    onChange={(e) =>
                      onDocument({ name: e.target.value.slice(0, 200) })
                    }
                  />
                </Field>
                <div className="aw-section-heading">
                  <strong>Background</strong>
                </div>
                <div className="aw-segmented">
                  {(["color", "gradient", "image"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={bg.mode === mode ? "selected" : ""}
                      onClick={() => background({ mode })}
                    >
                      {mode === "image" ? (
                        <PhotoIcon />
                      ) : mode === "gradient" ? (
                        <SparklesIcon />
                      ) : (
                        <SwatchIcon />
                      )}
                      {mode[0].toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                {bg.mode === "color" ? (
                  <Field label="Color">
                    <input
                      type="color"
                      value={bg.color}
                      onChange={(e) => background({ color: e.target.value })}
                    />
                  </Field>
                ) : bg.mode === "gradient" ? (
                  <>
                    <div
                      className="aw-gradient-preview"
                      style={{
                        background: `linear-gradient(100deg,${bg.startColor},${bg.endColor})`,
                      }}
                    />
                    <div className="aw-field-row">
                      <Field label="Start">
                        <input
                          type="color"
                          value={bg.startColor}
                          onChange={(e) =>
                            background({ startColor: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="End">
                        <input
                          type="color"
                          value={bg.endColor}
                          onChange={(e) =>
                            background({ endColor: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                  </>
                ) : (
                  <div className="aw-background-image">
                    <img src={bg.image} alt="Canvas background" />
                    <UploadImage
                      onUpload={(source) => background({ image: source })}
                      onError={onError}
                    >
                      Replace background
                    </UploadImage>
                  </div>
                )}
                <div className="aw-section-heading">
                  <strong>Canvas Settings</strong>
                </div>
                <Field label="Transparent base">
                  <input
                    className="aw-switch"
                    type="checkbox"
                    checked={bg.transparent}
                    disabled={bg.mode !== "color"}
                    onChange={(e) =>
                      background({ transparent: e.target.checked })
                    }
                  />
                </Field>
                <Field label="Renderer">
                  <span className="aw-value">Apexify.js · Node v6</span>
                </Field>
                <Field label="Pixel ratio">
                  <span className="aw-value">1× · Native output</span>
                </Field>
              </>
            ) : (
              <>
                <Field label="Name">
                  <input
                    value={layer.name}
                    onChange={(e) =>
                      onLayer(layer.id, { name: e.target.value.slice(0, 200) })
                    }
                  />
                </Field>
                <div className="aw-section-heading">
                  <strong>Transform</strong>
                </div>
                <div className="aw-field-row">
                  <NumberField
                    label="X"
                    value={layer.x}
                    onChange={(x) => onLayer(layer.id, { x })}
                  />
                  <NumberField
                    label="Y"
                    value={layer.y}
                    onChange={(y) => onLayer(layer.id, { y })}
                  />
                </div>
                <div className="aw-field-row">
                  <NumberField
                    label="Width"
                    value={layer.width}
                    min={1}
                    max={2048}
                    onChange={(width) => onLayer(layer.id, { width })}
                  />
                  <NumberField
                    label="Height"
                    value={layer.height}
                    min={1}
                    max={2048}
                    onChange={(height) => onLayer(layer.id, { height })}
                  />
                </div>
                <div className="aw-field-row">
                  <NumberField
                    label="Rotation"
                    value={layer.rotation}
                    min={-360}
                    max={360}
                    onChange={(rotation) => onLayer(layer.id, { rotation })}
                  />
                  <NumberField
                    label="Opacity"
                    value={layer.opacity}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(opacity) => onLayer(layer.id, { opacity })}
                  />
                </div>
                {layer.kind === "path" || layer.kind === "component" ? <AdvancedLayerEditor layer={layer} onChange={patch=>onLayer(layer.id,patch)} onError={onError}/> : layer.kind === "text" ? (
                  <>
                    <div className="aw-section-heading">
                      <strong>Text style</strong>
                    </div>
                    <Field label="Text">
                      <textarea
                        aria-label="Text content"
                        value={layer.text}
                        onChange={(e) =>
                          onLayer(layer.id, {
                            text: e.target.value.slice(0, 5000),
                          })
                        }
                      />
                    </Field>
                    <div className="aw-field-row">
                      <NumberField
                        label="Font size"
                        value={layer.fontSize}
                        min={4}
                        max={320}
                        onChange={(fontSize) => onLayer(layer.id, { fontSize })}
                      />
                      <Field label="Weight">
                        <select
                          value={layer.weight}
                          onChange={(e) =>
                            onLayer(layer.id, {
                              weight: Number(e.target.value),
                            })
                          }
                        >
                          {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                            <option key={w}>{w}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Color">
                      <input
                        type="color"
                        value={layer.color}
                        onChange={(e) =>
                          onLayer(layer.id, { color: e.target.value })
                        }
                      />
                    </Field>
                  </>
                ) : layer.kind === "shape" ? (
                  <>
                    <div className="aw-section-heading">
                      <strong>Shape style</strong>
                    </div>
                    <Field label="Shape">
                      <select
                        value={layer.shape}
                        onChange={(e) =>
                          onLayer(layer.id, { shape: e.target.value })
                        }
                      >
                        <option value="rectangle">Rectangle</option>
                        <option value="circle">Circle</option>
                      </select>
                    </Field>
                    <Field label="Fill">
                      <input
                        type="color"
                        value={layer.color}
                        onChange={(e) =>
                          onLayer(layer.id, { color: e.target.value })
                        }
                      />
                    </Field>
                    <NumberField
                      label="Corner radius"
                      value={layer.radius}
                      min={0}
                      max={1024}
                      onChange={(radius) => onLayer(layer.id, { radius })}
                    />
                    <NumberField
                      label="Stroke width"
                      value={layer.strokeWidth}
                      min={0}
                      max={30}
                      onChange={(strokeWidth) =>
                        onLayer(layer.id, { strokeWidth })
                      }
                    />
                    <Field label="Stroke color">
                      <input
                        type="color"
                        value={layer.strokeColor}
                        onChange={(e) =>
                          onLayer(layer.id, { strokeColor: e.target.value })
                        }
                      />
                    </Field>
                  </>
                ) : layer.kind === "chart" ? (
                  <>
                    <Field label="Chart type">
                      <select
                        value={layer.chartType}
                        onChange={(e) =>
                          onLayer(layer.id, { chartType: e.target.value })
                        }
                      >
                        <option value="bar">Bar</option>
                        <option value="pie">Pie</option>
                      </select>
                    </Field>
                    {layer.values.map((v, i) => (
                      <NumberField
                        key={i}
                        label={layer.labels[i]}
                        value={v}
                        min={0}
                        max={1000000}
                        onChange={(value) =>
                          onLayer(layer.id, {
                            values: layer.values.map((old, j) =>
                              i === j ? value : old,
                            ),
                          })
                        }
                      />
                    ))}
                  </>
                ) : (
                  <UploadImage
                    onUpload={(source) => onLayer(layer.id, { source })}
                    onError={onError}
                  >
                    Replace image
                  </UploadImage>
                )}
                <div className="aw-layer-commands">
                  <IconButton
                    label="Move layer backward"
                    onClick={() => onReorder(layer.id, -1)}
                  >
                    <ArrowDownIcon />
                  </IconButton>
                  <IconButton
                    label="Move layer forward"
                    onClick={() => onReorder(layer.id, 1)}
                  >
                    <ArrowUpIcon />
                  </IconButton>
                  <IconButton
                    label="Delete selected layer"
                    onClick={() => onRemove(layer.id)}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </>
            )}
            <button
              className="aw-inspector-section-toggle"
              onClick={() => setShowLayers(!showLayers)}
            >
              <Square2StackIcon />
              Layers <span>{document.layers.length}</span>
              <ChevronDownIcon />
            </button>
            {showLayers ? (
              <div className="aw-layer-list">
                {[...document.layers].reverse().map((l) => (
                  <div
                    className={selected === l.id ? "selected" : ""}
                    key={l.id}
                  >
                    <button onClick={() => onSelect(l.id)}>
                      <span className={`aw-layer-kind aw-kind-${l.kind}`} />
                      {l.name}
                    </button>
                    <IconButton
                      label={`${l.visible ? "Hide" : "Show"} ${l.name}`}
                      onClick={() => onLayer(l.id, { visible: !l.visible })}
                    >
                      {l.visible ? <EyeIcon /> : <EyeSlashIcon />}
                    </IconButton>
                  </div>
                ))}
              </div>
            ) : null}
            <details className="aw-runtime-info">
              <summary>Rendering details</summary>
              <p>
                Preview and export use the installed Apexify.js v6 Node
                renderer. Visual, code, and graph share the same versioned
                composition.
              </p>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
