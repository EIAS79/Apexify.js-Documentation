"use client";
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
import TextOptionsEditor from './TextOptionsEditor';
import { Field, NumberField, IconButton } from "./ui";
import { UploadImage, type LayerPatch } from "./Tools";
import CanvasOptionsEditor from "./CanvasOptionsEditor";
import type {WorkspaceImageAsset} from '../asset-store';
import {importImageAsset,resolveImageReference} from '../asset-store';
import {IMAGE_SHAPES} from '../image-options';
import ImageOptionsEditor,{GroupTransformEditor} from './ImageOptionsEditor';
export default function Inspector({
  document,
  selected,
  onDocument,
  onCanvasAsset,
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
  onCanvasAsset: (asset:WorkspaceImageAsset,placement:'custom'|'layer'|'pattern')=>void;
  onLayer: (id: string, patch: LayerPatch) => void;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onReorder: (id: string, delta: number) => void;
  onPreset: () => void;
  onUpload: (source: string, name: string, asset: WorkspaceImageAsset) => void;
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
      <div className="aw-inspector-navigation">
        <Field label="Inspector view" help="Design edits the selected layer or canvas. Presets loads an editable composition. Assets imports and selects images.">
          <select aria-label="Inspector view" value={tab} onChange={e=>setTab(e.target.value)}>
            <option value="Properties">Design</option><option value="Presets">Presets</option><option value="Assets">Assets</option>
          </select>
        </Field>
      </div>
      <div className="aw-inspector-scroll" key={tab+":"+(layer?.id??"canvas")}>
        <div className="aw-inspector-context"><span>{tab==="Properties"?(layer?.kind??"Canvas"):tab}</span><p>{tab==="Properties"?(layer?"Edit this layer. Select Canvas to return to the background.":"Set the output size, then build your background and layers."):tab==="Assets"?"Import an image, then select it to edit its appearance.":"Start from an editable composition."}</p></div>
        {tab === "Presets" ? (
          <div className="aw-preset-grid">
            <button className="aw-template-card" onClick={onPreset}>
              <img
                src="/workspace/assets/crystal-lake.webp"
                alt="Crystal lake composition preset"
              />
              <strong>Crystal Lake</strong>
              <span>Editable canvas · text · images</span>
            </button>
            <p className="aw-muted">
              Loads the reference composition into the current project. Undo
              restores your previous composition.
            </p>
          </div>
        ) : tab === "Assets" ? (
          <div className="aw-assets">
            <UploadImage onUpload={onUpload} onError={onError} />
            <img
              className="aw-asset-image"
              src={bg.image.startsWith('asset:')?resolveImageReference(bg.image,document.assets??[]):bg.image}
              alt="Current background asset"
            />
            <strong>Background artwork</strong>
            <p className="aw-muted">
              PNG, JPEG, WebP · up to 2 MB. Uploaded images travel with your
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
                    <img src={bg.image.startsWith('asset:')?resolveImageReference(bg.image,document.assets??[]):bg.image} alt="Canvas background" />
                    <UploadImage
                      onUpload={(source,_name,asset)=>onDocument({background:{...bg,image:source},
                        assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset]})}
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
                <CanvasOptionsEditor value={document.canvasExtras} canvasWidth={document.width} canvasHeight={document.height} assets={document.assets??[]} onAsset={onCanvasAsset} onError={onError} onChange={(canvasExtras)=>onDocument({canvasExtras})} />
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
                {layer.kind === "text" ? (
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
                    <TextOptionsEditor layer={layer}
                      onChange={textSettings=>onLayer(layer.id,{textSettings})}
                      onBounds={(width,height)=>onLayer(layer.id,{width,height})}/>
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
                        {IMAGE_SHAPES.filter(k=>k!=='rectangle'&&k!=='circle').map(kind=><option key={kind} value={kind}>{kind}</option>)}
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
                    onUpload={(source,_name,asset)=>onDocument({
                      assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
                      layers:document.layers.map(l=>l.id===layer.id?{...l,source}:l)})}
                    onError={onError}
                  >
                    Replace image
                  </UploadImage>
                )}
                {(layer.kind==='image'||layer.kind==='shape')&&<section aria-label="Image authoring inspector">
                  {layer.kind==='image'&&<>
                    <Field label="Source image">
                      <select aria-label="Image layer source" value={layer.source}
                        onChange={e=>onLayer(layer.id,{source:e.target.value})}>
                        <option value="/workspace/assets/crystal-lake.webp">Bundled lake artwork</option>
                        {(document.assets??[]).map((asset,index)=><option key={asset.id} value={asset.id}>Image {index+1} · {asset.width} × {asset.height} · {asset.mime.replace('image/','').toUpperCase()}</option>)}
                      </select>
                    </Field>
                    <Field label="Import replacement image"><input type="file" aria-label="Upload verified image source" accept="image/png,image/jpeg,image/webp"
                      onChange={async e=>{const input=e.currentTarget,file=input.files?.[0];input.value='';if(!file)return;
                        try{const asset=await importImageAsset(file);
                          onDocument({assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
                            layers:document.layers.map(l=>l.id===layer.id?{...l,source:asset.id}:l) as WorkspaceLayer[]});
                        }catch(err){onError(err instanceof Error?err.message:'Image import failed')}}}/></Field>
                  </>}
                  <ImageOptionsEditor options={layer.imageOptions??{}} width={layer.width} height={layer.height} isShape={layer.kind==='shape'} shapeType={layer.kind==='shape'?layer.shape:undefined}
                    assets={document.assets??[]} onError={onError}
                    onChange={imageOptions=>onLayer(layer.id,{imageOptions})}
                    onAsset={asset=>onDocument({
                      assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
                      layers:document.layers.map(l=>l.id===layer.id?{...l,imageOptions:{...layer.imageOptions,mask:{...layer.imageOptions?.mask,source:asset.id}}}:l) as WorkspaceLayer[]
                    })}/>
                  <div className="aw-section-heading"><strong>Image grouping</strong></div>
                  <Field label="Image group">
                    <select aria-label="Image group selection" value={layer.imageGroupId??''}
                      onChange={e=>onLayer(layer.id,{imageGroupId:e.target.value||undefined})}>
                      <option value="">Ungrouped</option>
                      {(document.imageGroups??[]).map(g=><option value={g.id} key={g.id}>{g.name}</option>)}
                    </select>
                  </Field>
                  <button type="button" className="aw-text-button" onClick={()=>{
                    const id='group:'+crypto.randomUUID();
                    onDocument({imageGroups:[...(document.imageGroups??[]),{id,name:'Image group '+((document.imageGroups?.length??0)+1),transform:{}}],
                      layers:document.layers.map(l=>l.id===layer.id?{...l,imageGroupId:id}:l)});
                  }}>+ Create group for selected image</button>
                  {layer.imageGroupId&&(()=>{
                    const group=(document.imageGroups??[]).find(g=>g.id===layer.imageGroupId);
                    if(!group)return null;
                    return <details open><summary>Group: {group.name}</summary>
                      <Field label="Group name"><input aria-label="Image group name" value={group.name} onChange={e=>onDocument({
                        imageGroups:(document.imageGroups??[]).map(g=>g.id===group.id?{...g,name:e.target.value}:g)
                      })}/></Field>
                      <GroupTransformEditor value={group.transform} assets={document.assets??[]} width={document.width} height={document.height}
                        onError={onError}
                        onAsset={asset=>onDocument({
                          assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
                          imageGroups:(document.imageGroups??[]).map(g=>g.id===group.id?{...g,transform:{...g.transform,mask:{...g.transform.mask,source:asset.id}}}:g)
                        })}
                        onChange={transform=>onDocument({imageGroups:(document.imageGroups??[]).map(g=>g.id===group.id?{...g,transform}:g)})}/>
                      <button type="button" onClick={()=>onDocument({
                        imageGroups:(document.imageGroups??[]).filter(g=>g.id!==group.id),
                        layers:document.layers.map(l=>l.imageGroupId===group.id?{...l,imageGroupId:undefined}:l)
                      })}>Delete group and release members</button>
                    </details>
                  })()}
                </section>}
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
