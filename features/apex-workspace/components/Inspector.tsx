"use client";
import { useState, useEffect, useId, useRef } from "react";
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
  Squares2X2Icon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceDocument, WorkspaceLayer } from "../model";
import ControlHelp from './ControlHelp';
import TextOptionsEditor from './TextOptionsEditor';
import { Field, NumberField, IconButton } from "./ui";
import { UploadImage, type LayerPatch } from "./Tools";
import CanvasOptionsEditor from "./CanvasOptionsEditor";
import type {WorkspaceImageAsset} from '../asset-store';
import type {CanvasGradient,CanvasCustomBg,CanvasExtras} from '../canvas-options';
import {importImageAsset,resolveImageReference} from '../asset-store';
import {IMAGE_SHAPES} from '../image-options';
import ImageOptionsEditor,{GroupTransformEditor} from './ImageOptionsEditor';
import ImageFilePicker from './ImageFilePicker';
import LayerInspectorNavigation from './LayerInspectorNavigation';
import LayerColorPicker from './LayerColorPicker';
import {TEXT_INSPECTOR_SECTIONS,IMAGE_INSPECTOR_SECTIONS,type LayerInspectorSection} from '../inspector-sections';
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
  const hasLayerSections=layer?.kind==='text'||layer?.kind==='image';
  const [layerSectionState,setLayerSectionState]=useState<{layerId:string;section:LayerInspectorSection}>({layerId:'',section:'primary'});
  const layerSection=layerSectionState.layerId===layer?.id?layerSectionState.section:'primary';
  const setLayerSection=(section:LayerInspectorSection)=>setLayerSectionState({layerId:layer?.id??'',section});
  const layerSections=layer?.kind==='text'?TEXT_INSPECTOR_SECTIONS:IMAGE_INSPECTOR_SECTIONS;
  const activeLayerSection=layerSections.find(([key])=>key===layerSection)!;
  const bg = document.background;
  const imageBg=document.canvasExtras?.customBg;
  const baseMode=imageBg?"image":document.canvasExtras?.gradientBg?"gradient":bg.mode;
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
  const [canvasBackgroundView,setCanvasBackgroundView]=useState<"base"|"layers"|"overlays">("base");
  const gradientDraft=useRef<CanvasGradient|undefined>(undefined);
  const imageDraft=useRef<CanvasCustomBg|undefined>(undefined);
  const [showLayers, setShowLayers] = useState(true);
  useEffect(()=>{
    if(layersRequest){setCanvasCategory('layout');setShowLayers(true);}
  },[layersRequest]);
  const background = (patch: Partial<WorkspaceDocument["background"]>) =>
    onDocument({ background: { ...bg, ...patch } });
  const changeBaseMode=(mode:WorkspaceDocument["background"]["mode"])=>{
    const extras=document.canvasExtras??{};
    if(extras.gradientBg)gradientDraft.current=extras.gradientBg;
    if(extras.customBg)imageDraft.current=extras.customBg;
    const next:CanvasExtras={...extras,gradientBg:undefined,customBg:undefined};
    if(mode==="gradient"){
      next.gradientBg=gradientDraft.current??{type:"linear",endX:document.width,
        colors:[{stop:0,color:bg.startColor},{stop:1,color:bg.endColor}]};
    }else if(mode==="image"){
      next.customBg=imageDraft.current;
    }
    onDocument({background:{...bg,mode},canvasExtras:next});
    setCanvasBackgroundView("base");
  };
  return (
    <div className="aw-inspector">
      <div className="aw-inspector-navigation">
        <div className="aw-inspector-view-tabs" role="tablist" aria-label="Inspector view">
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
        <select className="aw-inspector-view-select" aria-label="Inspector view" value={tab} onChange={event=>setTab(event.target.value)}>
          {["Properties","Presets","Assets"].map(name=><option key={name} value={name}>{name}</option>)}
        </select>
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
          <label className="aw-canvas-category-select"><span>Section</span>
            <select aria-label="Canvas section" value={canvasCategory} onChange={event=>setCanvasCategory(event.target.value as typeof canvasCategory)}>
              {canvasCategories.map(([id,label])=><option key={id} value={id}>{label}</option>)}
            </select>
          </label>
        </div>
      )}
      {tab==='Properties'&&layer&&hasLayerSections&&<LayerInspectorNavigation layer={layer} section={layerSection}
        onChange={setLayerSection} onCanvas={()=>onSelect(null)} id={inspectorId}/>}
      <div id={inspectorId+"-view-panel"} role="tabpanel" aria-labelledby={inspectorId+"-view-"+tab} className={"aw-inspector-scroll" + (tab === "Properties" && !layer ? " aw-inspector-canvas-scroll" : hasLayerSections?" aw-inspector-layer-scroll":"")} key={tab+":"+(layer?layer.id+":"+layerSection:"canvas:"+canvasCategory)}>

        {((layer&&!hasLayerSections)||tab!=="Properties")&&<div className="aw-inspector-context"><span>{tab==="Properties"?layer?.kind:tab}</span><p>{tab==="Properties"?"Edit this layer. Select Canvas to return to the background.":tab==="Assets"?"Import an image, then select it to edit its appearance.":"Start from an editable composition."}</p></div>}
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
            {!hasLayerSections&&<div className={"aw-section-heading"+(!layer?" aw-canvas-section-title":"")}>
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
            </div>}
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
                {canvasCategory==="background"&&<>
                <div className="aw-canvas-icon-nav aw-background-scope-nav" role="tablist" aria-label="Background editing scope">
                  {([{id:"base",label:"Base",icon:SwatchIcon},{id:"layers",label:"Layers",icon:Squares2X2Icon},{id:"overlays",label:"Overlays",icon:SparklesIcon}] as const).map(({id,label,icon:Icon},index)=>
                    <button key={id} type="button" role="tab" aria-selected={canvasBackgroundView===id} tabIndex={canvasBackgroundView===id?0:-1}
                      className={canvasBackgroundView===id?"selected":""}
                      onClick={()=>setCanvasBackgroundView(id)} onKeyDown={event=>{
                        if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
                        event.preventDefault();const sections=["base","layers","overlays"] as const;
                        const next=event.key==="Home"?0:event.key==="End"?2:(index+(event.key==="ArrowRight"?1:-1)+3)%3;
                        setCanvasBackgroundView(sections[next]);
                        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
                      }}><Icon aria-hidden="true"/><span>{label}</span></button>)}
                </div>
                {canvasBackgroundView==="base"&&<>
                <div className="aw-segmented">
                  {(["color", "gradient", "image"] as const).map((mode) => (
                    <button
                      key={mode}
                      aria-pressed={baseMode === mode}
                      className={baseMode === mode ? "selected" : ""}
                      onClick={() => changeBaseMode(mode)}
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
                {baseMode === "color" ? (
                  <Field label="Color">
                    <input
                      type="color"
                      value={bg.color}
                      onChange={(e) => background({ color: e.target.value })}
                    />
                  </Field>
                ) : baseMode === "gradient" ? (
                  <p className="aw-canvas-note">Edit the gradient below. Colors, stops, geometry and repetition use one native gradient configuration.</p>
                ) : (
                  <div className="aw-background-image">
                    <img src={backgroundSource.startsWith('asset:')?resolveImageReference(backgroundSource,document.assets??[]):backgroundSource} alt="Canvas background" />
                    <div className="aw-background-source"><strong>{backgroundSource==='/workspace/assets/crystal-lake.webp'?'Crystal lake':'Imported image'}</strong><span>Canvas artwork</span>
                    <span className="aw-canvas-note">Use the Source controls below to replace or import this image.</span>
                    </div>
                  </div>
                )}
                {baseMode==="image"&&<div className="aw-image-background-controls">
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
                  {!imageBg&&<Field label="Image blur" help="Softens the legacy background image without changing foreground layers. For imported native backgrounds use Effects → Composition to change Canvas-wide blur.">
                    <div className="aw-slider-value"><input aria-label="Background image blur" type="range" min={0} max={100} step={1}
                      disabled={!!(document.canvasExtras?.patternBg||document.canvasExtras?.noiseBg)}
                      value={bg.blur??0} onChange={e=>background({blur:Number(e.target.value)})}/>
                      <output>{bg.blur??0} px</output></div>
                  </Field>}
                </div>}
                {baseMode==="color"&&<Field label="Transparent base">
                  <input
                    className="aw-switch"
                    type="checkbox"
                    checked={bg.transparent}
                    disabled={baseMode !== "color"}
                    onChange={(e) =>
                      background({ transparent: e.target.checked })
                    }
                  />
                </Field>}
                </>}
                </>}
                {(
                  <CanvasOptionsEditor focus={canvasCategory==="background"
                      ?canvasBackgroundView==="base"?(baseMode==="gradient"?"gradient":baseMode==="image"?"image":"none")
                        :canvasBackgroundView
                      :canvasCategory}
                    legacyGradientColors={{start:bg.startColor,end:bg.endColor}}
                    value={document.canvasExtras} canvasWidth={document.width} canvasHeight={document.height}
                    assets={document.assets??[]} onAsset={onCanvasAsset} onError={onError}
                    onChange={canvasExtras=>onDocument({canvasExtras})} />
                )}
                {canvasCategory==="advanced" && <>
                <dl className="aw-renderer-details" aria-label="Rendering information">
                  <div><dt>Renderer</dt><dd>Apexify.js · Node v6</dd></div>
                  <div><dt>Pixel ratio</dt><dd>1× · Native output</dd></div>
                </dl>
                </>}
              </div>
            ) : (
              <>
                <section className={hasLayerSections?'aw-layer-editor':undefined}
                  role={hasLayerSections?'tabpanel':undefined} id={hasLayerSections?inspectorId+'-layer-category-panel':undefined}
                  aria-labelledby={hasLayerSections?inspectorId+'-layer-tab-'+layerSection:undefined}>
                {hasLayerSections&&<div className="aw-layer-section-heading"><strong>{activeLayerSection[1]}</strong>
                  <p>{activeLayerSection[2]}</p></div>}
                {(!hasLayerSections||layerSection==='layout')&&<div className="aw-layer-transform">
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
                </div>}
                {layer.kind === "text" ? (
                  <>
                    {layerSection==='primary'&&<div className="aw-text-basics">
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
                    <Field label="Font family" help="Choose an installed DejaVu font family. Font overrides below can set a different family or face.">
                      <select aria-label="Text font family" value={layer.textSettings?.properties?.font?.family??layer.textSettings?.properties?.font?.name??'DejaVu Sans'}
                        onChange={event=>onLayer(layer.id,{textSettings:{...layer.textSettings,properties:{...layer.textSettings?.properties,font:{...layer.textSettings?.properties?.font,family:event.target.value}}}})}>
                        {[...new Set(['DejaVu Sans','DejaVu Serif','DejaVu Sans Mono',layer.textSettings?.properties?.font?.family??layer.textSettings?.properties?.font?.name??'DejaVu Sans'])].map(family=><option key={family} value={family}>{family}</option>)}
                      </select>
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
                    <LayerColorPicker label="Color" value={layer.color} onChange={color=>onLayer(layer.id,{color})} alpha/>
                    {layer.textSettings?.properties?.fill&&<p className="aw-editor-description">Appearance contains a fill override which takes priority over this base color.</p>}
                    {layer.textSettings?.properties?.font&&<p className="aw-editor-description">Font overrides are configured below and take priority over the base font controls.</p>}
                    </div>}
                    <TextOptionsEditor layer={layer} focus={layerSection}
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
                ) : null}
                {(layer.kind==='image'||layer.kind==='shape')&&<section aria-label="Image authoring inspector">
                  {layer.kind==='image'&&layerSection==='primary'&&<>
                    <div className="aw-layer-source-preview"><img alt="Selected image source" src={layer.source.startsWith('asset:')?resolveImageReference(layer.source,document.assets??[]):layer.source}/><span>{layer.source.startsWith('asset:')?'Imported image':'Bundled lake artwork'}</span></div>
                    <details className="aw-editor-section aw-image-source-settings"><summary><PhotoIcon aria-hidden="true"/><strong>Replace source image</strong></summary>
                    <Field label="Source image">
                      <select aria-label="Image layer source" value={layer.source}
                        onChange={e=>onLayer(layer.id,{source:e.target.value})}>
                        <option value="/workspace/assets/crystal-lake.webp">Bundled lake artwork</option>
                        {(document.assets??[]).map((asset,index)=><option key={asset.id} value={asset.id}>Image {index+1} · {asset.width} × {asset.height} · {asset.mime.replace('image/','').toUpperCase()}</option>)}
                      </select>
                    </Field>
                    <Field label="Import replacement image"><ImageFilePicker label="Upload verified image source"
                      onError={onError} onFile={async file=>{const asset=await importImageAsset(file);
                          onDocument({assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
                            layers:document.layers.map(l=>l.id===layer.id?{...l,source:asset.id}:l) as WorkspaceLayer[]});
                      }}/></Field>
                    </details>
                  </>}
                  <ImageOptionsEditor focus={hasLayerSections?layerSection:"all"} options={layer.imageOptions??{}} width={layer.width} height={layer.height} isShape={layer.kind==='shape'} shapeType={layer.kind==='shape'?layer.shape:undefined}
                    assets={document.assets??[]} onError={onError}
                    onChange={imageOptions=>onLayer(layer.id,{imageOptions})}
                    onAsset={asset=>onDocument({
                      assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
                      layers:document.layers.map(l=>l.id===layer.id?{...l,imageOptions:{...layer.imageOptions,mask:{...layer.imageOptions?.mask,source:asset.id}}}:l) as WorkspaceLayer[]
                    })}/>
                  {(!hasLayerSections||layerSection==='advanced')&&<details className="aw-editor-section aw-image-group-section"><summary><Square2StackIcon aria-hidden="true"/><strong>Image groups</strong></summary>
                  <p className="aw-editor-description">Assign images to a group to transform them together. Native group effects require at least two adjacent visible image or shape layers.</p>
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
                    return <details className="aw-editor-section" open><summary>Group: {group.name}</summary>
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
                  </details>}
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
                </section>
              </>
            )}
            {((layer&&(!hasLayerSections||layerSection==='layout')) || (!layer&&canvasCategory==="layout")) && <>
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
            {((layer&&(!hasLayerSections||layerSection==="advanced")) || (!layer&&canvasCategory==="advanced")) && <details className="aw-runtime-info">
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
