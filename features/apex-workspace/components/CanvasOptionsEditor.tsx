"use client";
import { ChevronRightIcon, SwatchIcon, PhotoIcon, Squares2X2Icon, AdjustmentsHorizontalIcon, ArrowsPointingOutIcon, PaintBrushIcon, SunIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import {useState} from "react";
import type {CanvasExtras,CanvasGradient,CanvasLayer,CanvasPattern,GradientKind} from "../canvas-options";
import {validateCanvasExtras,CanvasBlendModes,CanvasImageAlignModes,type CanvasBlendMode,type CanvasImageAlign} from "../canvas-options";
import {importImageAsset,type WorkspaceImageAsset} from '../asset-store';
import BorderMultiSelect from './BorderMultiSelect';
import ImageFilePicker from './ImageFilePicker';
import {Field,NumberField} from "./ui";
import {PatternControls,GradientControls,createGradient,createPattern} from "./CanvasNestedControls";
import {StrokeControls,ShadowControls} from "./CanvasEffectsEditor";
import {CanvasFiltersEditor} from './CanvasFiltersEditor';
const starterGradient=(type:GradientKind):CanvasGradient=>({type,colors:[{stop:0,color:'#221160'},{stop:1,color:'#006ca8'}]});
function IconTabs({label,items,active,onChange}:{label:string;items:{id:string;label:string;icon:typeof SwatchIcon}[];active:string;onChange:(id:string)=>void}){
 return <div className="aw-canvas-icon-nav" role="tablist" aria-label={label}>
   {items.map(({id,label:caption,icon:Icon},index)=><button type="button" role="tab" key={id}
      aria-selected={active===id} tabIndex={active===id?0:-1} className={active===id?"selected":""}
      onClick={()=>onChange(id)} onKeyDown={event=>{
        if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
        event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?items.length-1:
          (index+(event.key==="ArrowRight"?1:-1)+items.length)%items.length;
        onChange(items[next].id);
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
      }}><Icon aria-hidden="true"/><span>{caption}</span></button>)}
 </div>;
}
const starterPattern:CanvasPattern={type:'grid',color:'#56dbf9',secondaryColor:'#131b30',size:24,spacing:24,opacity:0.4};
export default function CanvasOptionsEditor({value,onChange,assets,onAsset,onError,canvasWidth=500,canvasHeight=500,focus='all',legacyGradientColors}:{value?:CanvasExtras;legacyGradientColors?:{start:string;end:string};focus?:'all'|'layout'|'background'|'styling'|'effects'|'advanced'|'layers'|'overlays'|'gradient'|'image'|'none';onChange:(options:CanvasExtras)=>void;canvasWidth?:number;canvasHeight?:number;
  assets:readonly WorkspaceImageAsset[];onAsset:(record:WorkspaceImageAsset,placement:'custom'|'layer'|'pattern')=>void;
  onError:(message:string)=>void;}){
  const options=value??{};
  const [layoutView,setLayoutView]=useState("placement");
  const [effectView,setEffectView]=useState("composition");
  const [gradientView,setGradientView]=useState<"stops"|"geometry"|"tiling"|"details">("stops");
  const [selectedLayer,setSelectedLayer]=useState(0);
  const update=(patch:CanvasExtras)=>{
    try{onChange(validateCanvasExtras({...options,...patch}));}
    catch(error){onError(error instanceof Error?error.message:'Canvas option is invalid');}
  };
  const gradient=options.gradientBg??(focus==="gradient"?{...starterGradient("linear"),endX:canvasWidth,colors:[{stop:0,color:legacyGradientColors?.start??"#221160"},{stop:1,color:legacyGradientColors?.end??"#006ca8"}]}:undefined);
  function setGradient(value:CanvasGradient){update({gradientBg:value,customBg:undefined});}
  const backgroundLayers=options.bgLayers??[];
  function changeLayerType(index:number,kind:CanvasLayer['type']){
    const old=backgroundLayers[index];
    if(!old||old.type===kind)return;
    const shared={nodeId:old.nodeId,blendMode:old.blendMode};
    const opacity=('opacity' in old?old.opacity:undefined)??1;
    const asset=assets[0]?.id;
    if((kind==='image'||kind==='pattern')&&!asset){
      onError('Import a verified local image before choosing this layer type.');
      return;
    }
    const next:CanvasLayer=
      kind==='color'?{...shared,type:'color',value:'#3366cc',opacity}:
      kind==='gradient'?{...shared,type:'gradient',value:starterGradient('linear'),opacity}:
      kind==='noise'?{...shared,type:'noise',intensity:0.1}:
      kind==='presetPattern'?{...shared,type:'presetPattern',pattern:starterPattern,opacity}:
      kind==='image'?{...shared,type:'image',source:asset!,fit:'fill',align:'center',opacity}:
      {...shared,type:'pattern',source:asset!,repeat:'repeat',opacity};
    setLayers(backgroundLayers.map((layer,i)=>i===index?next:layer));
  }
  function setLayers(layers:CanvasLayer[]){
    const existing=new Set<string>();
    const tagged=layers.map((layer,index)=>{
      const value=layer.nodeId??('layer:'+globalThis.crypto.randomUUID());
      if(existing.has(value))throw new Error('Canvas layer identity collision at '+index);
      existing.add(value);
      return {...layer,nodeId:value};
    });
    update({bgLayers:tagged});
  }
  return <section className="aw-canvas-advanced" data-canvas-focus={focus} aria-label="Advanced canvas authoring">
    {focus==='all'&&<div className="aw-section-heading"><strong>Advanced canvas</strong></div>}
    {focus==='all'&&<p className="aw-muted">Open a section to edit. Use the info icons for guidance; changes sync with code and the rendered canvas.</p>}
    {["all","layout"].includes(focus)&&<section className="aw-canvas-section" aria-label="Canvas layout options">
      {focus==="layout"&&<IconTabs label="Canvas layout groups" active={layoutView} onChange={setLayoutView} items={[
        {id:"placement",label:"Placement",icon:ArrowsPointingOutIcon},
        {id:"transform",label:"Transform",icon:ArrowPathIcon}
      ]}/>}
      {(focus==="all"||layoutView==="placement")&&<div className="aw-field-row">
        <NumberField label="Canvas X" value={options.x??0} onChange={x=>update({x})}/>
        <NumberField label="Canvas Y" value={options.y??0} onChange={y=>update({y})}/>
      </div>}
      {(focus==="all"||layoutView==="transform")&&<>
        <div className="aw-field-row">
          <NumberField label="Rotation" value={options.rotation??0} min={-360} max={360} onChange={rotation=>update({rotation})}/>
          <NumberField label="Zoom scale" value={options.zoom?.scale??1} min={0.05} max={16} step={0.05} onChange={scale=>update({zoom:{...options.zoom,scale}})}/>
          <NumberField label="Zoom center X" value={options.zoom?.centerX??canvasWidth/2} min={-8192} max={8192} onChange={centerX=>update({zoom:{...options.zoom,centerX}})}/>
          <NumberField label="Zoom center Y" value={options.zoom?.centerY??canvasHeight/2} min={-8192} max={8192} onChange={centerY=>update({zoom:{...options.zoom,centerY}})}/>
        </div>
        <p className="aw-canvas-note">The zoom origin defaults to the canvas midpoint. Rotation and zoom are Canvas transforms, not effects.</p>
      </>}
    </section>}

        {["all", "layers"].includes(focus)&&<>
    <details id="aw-canvas-layers" className="aw-canvas-section" open={focus==="layers"}>
      <summary><ChevronRightIcon className="aw-disclosure-icon" aria-hidden="true"/><strong>Background layers</strong><span>6 layer types · reorder · compositing</span></summary>
    <div className="aw-section-heading"><strong>Ordered background layers</strong></div>
    {backgroundLayers.length>1&&<Field label="Select background layer"><select aria-label="Edit background layer" value={Math.min(selectedLayer,backgroundLayers.length-1)} onChange={event=>setSelectedLayer(Number(event.target.value))}>{backgroundLayers.map((layer,index)=><option key={layer.nodeId??index} value={index}>{index+1}. {layer.type}</option>)}</select></Field>}
    {backgroundLayers.map((layer,index)=>(focus==="all"||index===Math.min(selectedLayer,backgroundLayers.length-1))&&<fieldset aria-label={"Background layer "+(index+1)} key={index} className="aw-canvas-properties">
      <legend>{index+1}. {layer.type}</legend>
      <Field label="Layer type">
        <select aria-label={"Background layer "+(index+1)+" type"} value={layer.type}
          onChange={event=>changeLayerType(index,event.target.value as CanvasLayer['type'])}>
          {(['color','gradient','image','pattern','presetPattern','noise'] as const).map(kind=>
            <option key={kind} value={kind} disabled={(kind==='image'||kind==='pattern')&&!assets.length}>
              {kind==='presetPattern'?'Procedural pattern':kind==='pattern'?'Image-backed pattern':kind==='image'?'Verified image':kind}
            </option>)}
        </select>
      </Field>
      <div className="aw-field-row">
        <button type="button" className="aw-text-button" disabled={index===0} onClick={()=>{
          const x=[...backgroundLayers];[x[index-1],x[index]]=[x[index],x[index-1]];setLayers(x);
        }}>Up</button>
        <button type="button" className="aw-text-button" disabled={index===backgroundLayers.length-1} onClick={()=>{
          const x=[...backgroundLayers];[x[index],x[index+1]]=[x[index+1],x[index]];setLayers(x);
        }}>Down</button>
        <button type="button" className="aw-text-button" onClick={()=>setLayers(backgroundLayers.filter((_,j)=>j!==index))}>Remove</button>
      </div>
      {layer.type==='color'?<Field label="Layer color"><input aria-label={"Layer "+(index+1)+" color"} type="color"
        value={layer.value.slice(0,7)} onChange={e=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,value:e.target.value}:l))}/></Field>:null}
      {layer.type==='presetPattern'?<PatternControls id={"Layer "+(index+1)} pattern={layer.pattern} assets={assets}
        onChange={pattern=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,pattern}:l))}/>:null}
      {layer.type==='gradient'?<GradientControls id={"Layer "+(index+1)} gradient={layer.value}
        onChange={value=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,value}:l))}/>:null}
      {layer.type==='noise'?<NumberField label={"Layer "+(index+1)+" noise intensity"} value={layer.intensity??0.1}
        min={0} max={1} step={0.05} onChange={intensity=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,intensity}:l))}/>:null}
      {layer.type==='pattern'?<div className="aw-field-row">
        <Field label="Pattern tile source">
          <select aria-label={"Layer "+(index+1)+" pattern source"} value={layer.source}
            onChange={e=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,source:e.target.value}:l))}>
            {assets.map(asset=><option key={asset.id} value={asset.id}>{asset.mime} / {asset.sha256.slice(0,12)}</option>)}
          </select>
        </Field>
        <Field label="Pattern tile repeat">
          <select aria-label={"Layer "+(index+1)+" pattern repeat"} value={layer.repeat??'repeat'}
            onChange={e=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,repeat:e.target.value as 'repeat'|'repeat-x'|'repeat-y'|'no-repeat'}:l))}>
            {(['repeat','repeat-x','repeat-y','no-repeat'] as const).map(mode=><option key={mode} value={mode}>{mode}</option>)}
          </select>
        </Field>
      </div>:null}
      {layer.type==='image'?<div className="aw-field-row">
        <Field label="Image source"><select aria-label={"Layer "+(index+1)+" image source"} value={layer.source}
          onChange={e=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,source:e.target.value}:l))}>
          {assets.map(asset=><option key={asset.id} value={asset.id}>{asset.sha256.slice(0,12)}</option>)}
        </select></Field>
        <Field label="Image fit"><select aria-label={"Layer "+(index+1)+" fit"} value={layer.fit??'fill'}
          onChange={e=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,fit:e.target.value as 'cover'|'contain'|'fill'}:l))}>
          {(['cover','contain','fill'] as const).map(v=><option key={v} value={v}>{v}</option>)}
        </select></Field>
        <Field label="Image alignment"><select aria-label={"Layer "+(index+1)+" align"} value={layer.align??'center'}
          onChange={e=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,align:e.target.value as CanvasImageAlign}:l))}>
          {CanvasImageAlignModes.map(v=><option key={v} value={v}>{v}</option>)}
        </select></Field>
      </div>:null}
      {layer.type!=='noise'?<NumberField label={"Layer "+(index+1)+(layer.type==="presetPattern"?" layer opacity":" opacity")} value={layer.opacity??1}
        min={0} max={1} step={0.05} onChange={opacity=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,opacity}:l))}/>:null}
      <Field label="Layer blend"><select aria-label={"Layer "+(index+1)+(layer.type==="presetPattern"?" layer compositing":" blend")} value={layer.blendMode??'source-over'}
        onChange={e=>setLayers(backgroundLayers.map((l,j)=>j===index?{...layer,blendMode:e.target.value as CanvasBlendMode}:l))}>
        {CanvasBlendModes.map(v=><option key={v} value={v}>{v}</option>)}
      </select></Field>
    </fieldset>)}
    <div className="aw-field-row">
      <button type="button" className="aw-button" disabled={backgroundLayers.length>=12} onClick={()=>setLayers([...backgroundLayers,{type:'color',value:'#3366cc',opacity:0.75}])}>Add color layer</button>
      <button type="button" className="aw-button" disabled={backgroundLayers.length>=12} onClick={()=>setLayers([...backgroundLayers,{type:'gradient',value:starterGradient('linear')}])}>Add gradient layer</button>
      <button type="button" className="aw-button" disabled={backgroundLayers.length>=12} onClick={()=>setLayers([...backgroundLayers,{type:'noise',intensity:0.1}])}>Add noise layer</button>
      <button type="button" className="aw-button" disabled={backgroundLayers.length>=12} onClick={()=>setLayers([...backgroundLayers,{type:'presetPattern',pattern:starterPattern,opacity:0.8}])}>Add pattern layer</button>
      <button type="button" className="aw-button" disabled={!assets.length||backgroundLayers.length>=12}
        onClick={()=>setLayers([...backgroundLayers,{type:'image',source:assets[0].id,fit:'fill',align:'center',opacity:1}])}>
        Add verified image layer
      </button>
      <button type="button" className="aw-button" disabled={!assets.length||backgroundLayers.length>=12}
        onClick={()=>setLayers([...backgroundLayers,{type:'pattern',source:assets[0].id,repeat:'repeat',opacity:1}])}>
        Add imported tile layer
      </button>
    </div>
    </details>
    </>}
    {["all", "overlays"].includes(focus)&&<>
    <details id="aw-canvas-patterns" className="aw-canvas-section" open={focus==="overlays"}>
      <summary><ChevronRightIcon className="aw-disclosure-icon" aria-hidden="true"/><strong>Pattern &amp; noise</strong><span>13 types · paint · noise · repeat caveats</span></summary>
    <div className="aw-section-heading"><strong>Procedural background</strong></div>
    <Field label="Enable procedural pattern">
      <input type="checkbox" className="aw-switch" aria-label="Enable Canvas pattern"
        checked={!!options.patternBg}
        onChange={event=>update({patternBg:event.target.checked?starterPattern:undefined})}/>
    </Field>
    {options.patternBg?<PatternControls id="Root" pattern={options.patternBg} assets={assets}
      onChange={patternBg=>update({patternBg})}/>:null}
    <Field label="Noise">
      <input type="checkbox" className="aw-switch" checked={options.noiseBg!==undefined} onChange={e=>update({noiseBg:e.target.checked?{intensity:0.08}:undefined})}/>
    </Field>
    {options.noiseBg?<NumberField label="Noise intensity" value={options.noiseBg.intensity??0.05} min={0} max={1} step={0.02} onChange={intensity=>update({noiseBg:{intensity}})}/>:null}
    </details>
    </>}
    {["all", "gradient"].includes(focus)&&<>
    <section id="aw-canvas-gradients" className="aw-canvas-section" aria-label="Unified gradient editor">
      <div className="aw-section-heading"><strong>Gradient editor</strong><span>One gradient · one set of stops</span></div>
    <IconTabs label="Gradient editor sections" active={gradientView} onChange={id=>setGradientView(id as typeof gradientView)} items={[
      {id:"stops",label:"Colors & stops",icon:SwatchIcon},
      {id:"geometry",label:"Geometry",icon:ArrowsPointingOutIcon},
      {id:"tiling",label:"Repeat",icon:ArrowPathIcon},
      {id:"details",label:"Details",icon:AdjustmentsHorizontalIcon}
    ]}/>
    {gradient&&<GradientControls gradient={gradient} onChange={setGradient} id="Root" section={focus==="all"?"all":gradientView}/>}
    </section>
    </>}
    {["all","effects"].includes(focus)&&<section className="aw-canvas-section" aria-label="Canvas-wide effects">
      {focus==="effects"&&<IconTabs label="Canvas effects groups" active={effectView} onChange={setEffectView} items={[
        {id:"composition",label:"Composition",icon:AdjustmentsHorizontalIcon},
        {id:"corners",label:"Corners",icon:Squares2X2Icon},
        {id:"stroke",label:"Stroke",icon:PaintBrushIcon},
        {id:"shadow",label:"Shadow",icon:SunIcon}
      ]}/>}
      {(focus==="all"||effectView==="composition")&&<div className="aw-field-row">
        <NumberField label="Canvas opacity" value={options.opacity??1} min={0} max={1} step={0.05} onChange={opacity=>update({opacity})}/>
        <Field label="Canvas blend mode"><select aria-label="Canvas root blend mode" value={options.blendMode??"source-over"} onChange={event=>update({blendMode:event.target.value as CanvasBlendMode})}>{CanvasBlendModes.map(mode=><option key={mode} value={mode}>{mode}</option>)}</select>
          <span className="aw-canvas-note">The root blends against the existing destination; effects may be invisible on an empty base. Background-layer blends are edited under Background → Layers.</span>
        </Field>
        <NumberField label="Canvas blur" value={options.blur??0} min={0} max={100} onChange={blur=>update({blur})}/>
      </div>}
      {(focus==="all"||effectView==="corners")&&<div className="aw-field-row">
        <Field label="Canvas radius mode"><select aria-label="Canvas border radius mode"
          value={options.borderRadius==="circular"?"circular":"numeric"}
          onChange={event=>update({borderRadius:event.target.value==="circular"?"circular":0})}>
          <option value="numeric">Numeric</option><option value="circular">Circular</option>
        </select></Field>
        {options.borderRadius!=="circular"&&<NumberField label="Border radius" value={typeof options.borderRadius==="number"?options.borderRadius:0} min={0} max={1024} onChange={borderRadius=>update({borderRadius})}/>}
        <BorderMultiSelect label="Canvas rounded corners" ariaLabel="Canvas border position" kind="corners" value={options.borderPosition??"all"} onChange={borderPosition=>update({borderPosition})}/>
      </div>}
      {(focus==="all"||effectView==="stroke")&&<StrokeControls id="Canvas" value={options.stroke} onChange={stroke=>update({stroke})}/>}
      {(focus==="all"||effectView==="shadow")&&<ShadowControls id="Canvas" ownerRadius={options.borderRadius??0} ownerCorners={options.borderPosition??"all"} value={options.shadow} onChange={shadow=>update({shadow})}/>}
    </section>}
    {["all", "image"].includes(focus)&&<>
    <details id="aw-canvas-images" className="aw-canvas-section" open={focus==="image"}>
      <summary><ChevronRightIcon className="aw-disclosure-icon" aria-hidden="true"/><strong>Image controls</strong><span>Import · fit · alignment</span></summary>
    <p className="aw-import-intro">Choose how to use your image. Imports are saved with this project.</p>
    <div className="aw-canvas-imports">
      <Field label="Canvas background" help="Use an image as the primary canvas background. Adjust its fit and alignment after importing.">
        <ImageFilePicker label="Import canvas background image" onFile={async file=>onAsset(await importImageAsset(file),'custom')} onError={onError}/>
      </Field>
      {focus==="all"&&<Field label="Background layer" help="Add an image to the ordered background stack. Reorder and blend it with other backgrounds.">
        <ImageFilePicker label="Import canvas image background layer" buttonLabel="Add image layer" disabled={backgroundLayers.length>=12}
          onFile={async file=>onAsset(await importImageAsset(file),'layer')} onError={onError}/>
      </Field>}
      {focus==="all"&&<Field label="Repeating pattern" help="Use an image as a repeating tile. Adjust repeat, size, and spacing in Pattern & noise.">
        <ImageFilePicker label="Import canvas pattern image" buttonLabel="Choose pattern image"
          onFile={async file=>onAsset(await importImageAsset(file),'pattern')} onError={onError}/>
      </Field>}
    </div>
    {assets.length?<Field label="Use existing verified asset">
      <select aria-label="Select an existing canvas asset" value="" onChange={event=>{
        const source=event.target.value;if(!source)return;
        onChange(validateCanvasExtras({...options,customBg:{source,fit:'cover',opacity:1},
          gradientBg:undefined}));
      }}>
        <option value="">Select image…</option>
        {assets.map(asset=><option key={asset.id} value={asset.id}>{asset.mime.replace('image/','').toUpperCase()} · {asset.width}×{asset.height} · {asset.sha256.slice(0,10)}</option>)}
      </select>
    </Field>:null}
    {options.customBg?<div className="aw-field-row">
      <Field label="Use image's intrinsic pixel dimensions">
        <input type="checkbox" aria-label="Imported image intrinsic dimensions"
          checked={options.customBg.inherit??false}
          onChange={e=>update({customBg:{...options.customBg!,inherit:e.target.checked}})}/>
      </Field>
      {options.customBg.inherit?<p className="aw-canvas-note">Intrinsic dimensions place verified source pixels at (0,0); fit and alignment are ignored by the native renderer until this option is disabled.</p>:null}
      {focus==="all"&&<Field label="Image fit"><select aria-label="Imported background fit" disabled={options.customBg.inherit} value={options.customBg.fit??'fill'} onChange={e=>
        update({customBg:{...options.customBg!,fit:e.target.value as 'fill'|'contain'|'cover'}})}>
        <option value="fill">Fill</option><option value="contain">Contain</option><option value="cover">Cover</option>
      </select></Field>}
      {focus==="all"&&<Field label="Alignment"><select aria-label="Imported background alignment" disabled={options.customBg.inherit} value={options.customBg.align??'center'} onChange={e=>
        update({customBg:{...options.customBg!,align:e.target.value as 'center'|'top'|'bottom'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right'}})}>
        {(['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'] as const).map(x=><option key={x} value={x}>{x}</option>)}
      </select></Field>}
      {focus==="all"&&<NumberField label="Image opacity" value={options.customBg.opacity??1} min={0} max={1} step={0.05} onChange={opacity=>
        update({customBg:{...options.customBg!,opacity}})}/>}
      {(()=>{const asset=assets.find(a=>a.id===options.customBg?.source);
        const tooLarge=!asset||asset.dataUri.length>16_384||
          canvasWidth>1024||canvasHeight>1024||canvasWidth*canvasHeight>1_048_576;
        return <CanvasFiltersEditor filters={options.customBg!.filters??[]} disabled={tooLarge}
          onChange={filters=>update({customBg:{...options.customBg!,filters}})}/>;
      })()}
      <button type="button" className="aw-text-button" onClick={()=>
        update({customBg:undefined})}>Remove image background</button>
    </div>:null}
    </details>
    </>}
    {focus==="advanced"&&<section className="aw-canvas-section"><strong>Resolved Canvas options</strong><p className="aw-canvas-note">Read-only configuration. No duplicate settings or destructive reset.</p><pre className="aw-canvas-options-readout">{JSON.stringify(options,null,2)}</pre></section>}
    {focus==='all'&&<p className="aw-muted">Changes sync with Code and Visual Graph.</p>}
  </section>;
}
