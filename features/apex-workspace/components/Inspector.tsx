"use client";
import { useState, useEffect, useId } from "react";
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
import ControlHelp from './ControlHelp';
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
  layersRequest = 0,
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
  layersRequest?: number;
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
  const inspectorId=useId();
  const layer = document.layers.find((l) => l.id === selected);
  const bg = document.background;
  const imageBg=document.canvasExtras?.customBg;
  const backgroundSource=imageBg?.source??bg.image;
  const updateImageBackground=(patch:{fit?:'cover'|'contain'|'fill';align?:NonNullable<typeof bg.align>;opacity?:number})=>{
    if(imageBg)onDocument({canvasExtras:{...document.canvasExtras,customBg:{...imageBg,...patch}}});
    else onDocument({background:{...bg,...patch}});
  };
  const canvasCategories = [
    ["layout","Layout","Output size, project and placement"],
    ["background","Background","Base paint, images and background layers"],
    ["effects","Effects","Opacity, blur, strokes and shadows"],
    ["advanced","Advanced","Image processing and rendering details"],
  ] as const;
  const [canvasCategory,setCanvasCategory] = useState<typeof canvasCategories[number][0]>("background");
  const [showLayers, setShowLayers] = useState(true);
  useEffect(()=>{
    if(layersRequest){setCanvasCategory('layout');setShowLayers(true);}
  },[layersRequest]);
  const background = (patch: Partial<WorkspaceDocument["background"]>) =>
    onDocument({ background: { ...bg, ...patch } });
  return (
    <div className="aw-inspector">
      <div className="aw-inspector-navigation" role="tablist" aria-label="Inspector view">
        {["Properties","Presets","Assets"].map((name,index)=><button key={name} type="button" role="tab"
          id={inspectorId+"-view-"+name} aria-controls={inspectorId+"-view-panel"}
          aria-selected={tab===name} tabIndex={tab===name?0:-1}
          onClick={()=>setTab(name)} onKeyDown={event=>{
            if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
            event.preventDefault();
            const names=["Properties","Presets","Assets"];
            const next=event.key==="Home"?0:event.key==="End"?2:(index+(event.key==="ArrowRight"?1:-1)+3)%3;
            setTab(names[next]);
            event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
          }}>{name}</button>)}
      </div>
      {tab === "Properties" && !layer && (
        <div className="aw-property-nav" aria-label="Canvas properties navigation">
          <div className="aw-property-context">
            <Square2StackIcon/>
            <div><strong>Canvas</strong><span>{document.name} · {document.width} × {document.height}</span></div>
            <ControlHelp label="Canvas properties" description="Layout sets output size and placement. Background controls base paint and ordered background layers. Effects adds opacity, blur, strokes and shadows. Advanced contains imported image processing and renderer details."/>
          </div>
          <nav role="tablist" className="aw-property-tabs" aria-label="Canvas property categories">
            {canvasCategories.map(([id,label],index) => (
              <button key={id} id={inspectorId+"-canvas-tab-"+id} type="button" role="tab"
                aria-selected={id===canvasCategory} aria-controls={inspectorId+"-canvas-category-panel"}
                tabIndex={id===canvasCategory?0:-1}
                className={id===canvasCategory?"selected":""}
                onClick={()=>setCanvasCategory(id)}
                onKeyDown={event=>{
                  if(event.key!=="ArrowRight" && event.key!=="ArrowLeft" && event.key!=="Home" && event.key!=="End")return;
                  event.preventDefault();
                  const next=event.key==="Home"?0:event.key==="End"?canvasCategories.length-1:
                    (index+(event.key==="ArrowRight"?1:-1)+canvasCategories.length)%canvasCategories.length;
                  setCanvasCategory(canvasCategories[next][0]);
                  const tabs=event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
                  tabs?.[next]?.focus();
                }}>{label}</button>
            ))}
          </nav>
        </div>
      )}
      <div id={inspectorId+"-view-panel"} role="tabpanel" aria-labelledby={inspectorId+"-view-"+tab} className={"aw-inspector-scroll" + (tab === "Properties" && !layer ? " aw-inspector-canvas-scroll" : "")} key={tab+":"+(layer?.id??"canvas")}>

        {(layer||tab!=="Properties")&&<div className="aw-inspector-context"><span>{tab==="Properties"?layer?.kind:tab}</span><p>{tab==="Properties"?"Edit this layer. Select Canvas to return to the background.":tab==="Assets"?"Import an image, then select it to edit its appearance.":"Start from an editable composition."}</p></div>}
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
            <div className={"aw-section-heading"+(!layer?" aw-canvas-section-title":"")}>
              <Square2StackIcon />
              <strong>{layer ? layer.name : canvasCategories.find(([id])=>id===canvasCategory)?.[1]}</strong>
              {!layer&&<ControlHelp label={"Canvas "+canvasCategory} description={canvasCategories.find(([id])=>id===canvasCategory)?.[2]+". Changes update your project, generated source, and native rendered preview."}/>}
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
              <div id={inspectorId+"-canvas-category-panel"} data-canvas-category-panel role="tabpanel" aria-labelledby={inspectorId+"-canvas-tab-"+canvasCategory}>
                {canvasCategory==="layout" && <>
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
                </>}
                {canvasCategory==="background" && <>
                <div className="aw-segmented">
                  {(["color", "gradient", "image"] as const).map((mode) => (
                    <button
                      key={mode}
                      aria-pressed={bg.mode === mode}
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
                      {mode === "color" ? "Solid" : mode[0].toUpperCase() + mode.slice(1)}
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
                    <img src={backgroundSource.startsWith('asset:')?resolveImageReference(backgroundSource,document.assets??[]):backgroundSource} alt="Canvas background" />
                    <div className="aw-background-source"><strong>{backgroundSource==='/workspace/assets/crystal-lake.webp'?'Crystal lake':'Imported image'}</strong><span>Canvas artwork</span>
                    <UploadImage
                      onUpload={(source,_name,asset)=>imageBg?onCanvasAsset(asset,'custom'):onDocument({background:{...bg,image:source},
                        assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset]})}
                      onError={onError}
                    >
                      Replace image
                    </UploadImage>
                    </div>
                  </div>
                )}
                {bg.mode==='image'&&<div className="aw-image-background-controls">
                  <div className="aw-field-row">
                    <Field label="Fit" help="Contain shows the entire image inside the canvas. Cover fills the canvas and can crop its edges. Fill stretches the image to the canvas size.">
                      <select aria-label="Background image fit" value={imageBg?.fit??bg.fit??'cover'} disabled={imageBg?.inherit}
                        onChange={e=>updateImageBackground({fit:e.target.value as 'cover'|'contain'|'fill'})}>
                        <option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Fill</option>
                      </select>
                    </Field>
                    <Field label="Alignment" help="Positions the image within the canvas when its fit leaves extra room or crops an edge.">
                      <select aria-label="Background image alignment" value={imageBg?.align??bg.align??'center'} disabled={imageBg?.inherit}
                        onChange={e=>updateImageBackground({align:e.target.value as NonNullable<typeof bg.align>})}>
                        {(['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const).map(value=><option key={value} value={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Image opacity" help="Controls the background image's visibility. 100% is opaque; 0% makes the image transparent. Foreground layers stay unchanged.">
                    <div className="aw-slider-value"><input aria-label="Background image opacity" type="range" min={0} max={100} step={1}
                      value={Math.round((imageBg?.opacity??bg.opacity??1)*100)} onChange={e=>updateImageBackground({opacity:Number(e.target.value)/100})}/>
                      <output>{Math.round((imageBg?.opacity??bg.opacity??1)*100)}%</output></div>
                  </Field>
                  <Field label={imageBg?'Canvas blur':'Image blur'} help={imageBg?'Softens the native canvas background before foreground layers are drawn.':'Softens the background image in output pixels. Foreground text and images stay sharp. Set blur to zero before combining pattern or noise overlays.'}>
                    <div className="aw-slider-value"><input aria-label="Background image blur" type="range" min={0} max={100} step={1}
                      disabled={!imageBg&&!!(document.canvasExtras?.patternBg||document.canvasExtras?.noiseBg)}
                      value={imageBg?document.canvasExtras?.blur??0:bg.blur??0} onChange={e=>imageBg?onDocument({canvasExtras:{...document.canvasExtras,blur:Number(e.target.value)}}):background({blur:Number(e.target.value)})}/>
                      <output>{imageBg?document.canvasExtras?.blur??0:bg.blur??0} px</output></div>
                  </Field>
                </div>}
                {bg.mode==='color'&&<Field label="Transparent base">
                  <input
                    className="aw-switch"
                    type="checkbox"
                    checked={bg.transparent}
                    disabled={bg.mode !== "color"}
                    onChange={(e) =>
                      background({ transparent: e.target.checked })
                    }
                  />
                </Field>}
                </>}
                {canvasCategory==="effects" && <div className="aw-field-row">
                  <NumberField label="Canvas opacity" value={document.canvasExtras?.opacity??1} min={0} max={1} step={0.05}
                    onChange={opacity=>onDocument({canvasExtras:{...document.canvasExtras,opacity}})}/>
                  <NumberField label="Canvas blur" value={document.canvasExtras?.blur??0} min={0} max={100}
                    onChange={blur=>onDocument({canvasExtras:{...document.canvasExtras,blur}})}/>
                </div>}
                {(
                  <CanvasOptionsEditor focus={canvasCategory}
                    value={document.canvasExtras} canvasWidth={document.width} canvasHeight={document.height}
                    assets={document.assets??[]} onAsset={onCanvasAsset} onError={onError}
                    onChange={canvasExtras=>onDocument({canvasExtras})} />
                )}
                {canvasCategory==="advanced" && <>
                <Field label="Renderer">
                  <span className="aw-value">Apexify.js · Node v6</span>
                </Field>
                <Field label="Pixel ratio">
                  <span className="aw-value">1× · Native output</span>
                </Field>
                </>}
              </div>
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
            {(layer || canvasCategory==="layout") && <>
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
            </>}
            {(layer || canvasCategory==="advanced") && <details className="aw-runtime-info">
              <summary>Rendering details</summary>
              <p>
                Preview and export use the installed Apexify.js v6 Node
                renderer. Visual, code, and graph share the same versioned
                composition.
              </p>
            </details>}
          </>
        )}
      </div>
    </div>
  );
}
