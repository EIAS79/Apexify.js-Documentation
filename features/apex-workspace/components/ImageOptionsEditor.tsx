'use client';
import {useEffect,useState} from 'react';
import type {ImageEditorOptions} from '../image-options';
import type {WorkspaceImageAsset} from '../asset-store';
import {importImageAsset} from '../asset-store';
import {IMAGE_FILTERS,IMAGE_FILTER_FIELDS,IMAGE_DISTORTIONS,IMAGE_FITS,IMAGE_ALIGNS,IMAGE_COMPOSITES,IMAGE_EDGES,IMAGE_INTERPOLATIONS} from '../image-options';
import {Field,NumberField} from './ui';
import {GradientControls} from './CanvasNestedControls';
import {StrokeControls,ShadowControls} from './CanvasEffectsEditor';
import type {CanvasGradient,CanvasShadow,CanvasStroke} from '../canvas-options';
import type {ImageProperties,GroupTransformOptions,ImageDistortionOptions,ImageMeshWarpOptions} from 'apexify.js';

type Pt={x:number;y:number};
const DEFAULT_GRADIENT:CanvasGradient={type:'linear',colors:[{stop:0,color:'#6436e8'},{stop:1,color:'#14b8a6'}],endX:240};
function Num({label,value=0,onChange,min=-2048,max=2048,step=1}:{label:string;value?:number;onChange:(n:number)=>void;min?:number;max?:number;step?:number}) {
 return <NumberField label={label} value={value} min={min} max={max} step={step} onChange={onChange}/>;
}
function Enum({label,value,options,onChange}:{label:string;value:string;options:readonly string[];onChange:(s:string)=>void}){
 return <Field label={label}><select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{options.map(v=><option key={v} value={v}>{v}</option>)}</select></Field>;
}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){
 return <Field label={label}><input aria-label={label} type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/></Field>;
}
function HexColor({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){
 const [draft,setDraft]=useState(value);
 useEffect(()=>setDraft(value),[value]);
 return <input type="text" aria-label={label} value={draft} maxLength={9} spellCheck={false}
  pattern="#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?" onChange={e=>{
   const next=e.target.value.trim();setDraft(next);
   if(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(next))onChange(next);
  }} onBlur={()=>setDraft(value)}/>;
}
function Color({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){
 return <Field label={label}><div className="aw-field-row">
  <input type="color" aria-label={label} value={value.slice(0,7)} onChange={e=>onChange(e.target.value)}/>
  <HexColor label={label+" hex"} value={value} onChange={onChange}/>
 </div></Field>;
}
function AddRemove({label,onAdd,onRemove}:{label:string;onAdd?:()=>void;onRemove?:()=>void}){
 return <div className="aw-field-row"><strong>{label}</strong>{onAdd&&<button type="button" className="aw-text-button" onClick={onAdd}>+ Add</button>}{onRemove&&<button type="button" className="aw-text-button" onClick={onRemove}>Remove</button>}</div>;
}
function Points({label,items,onChange,max=24,min=3}:{label:string;items:Pt[];onChange:(items:Pt[])=>void;max?:number;min?:number}){
 const edit=(i:number,key:'x'|'y',n:number)=>onChange(items.map((p,j)=>i===j?{...p,[key]:n}:p));
 return <fieldset className="aw-canvas-properties" aria-label={label}><legend>{label} ({items.length})</legend>
 {items.map((p,i)=><div key={i} className="aw-field-row" style={{alignItems:'end'}}>
   <Num label={'Point '+(i+1)+' X'} value={p.x} onChange={n=>edit(i,'x',n)}/>
   <Num label={'Y '+(i+1)} value={p.y} onChange={n=>edit(i,'y',n)}/>
   <button type="button" disabled={items.length<=min} aria-label={'Delete '+label+' point '+(i+1)} onClick={()=>onChange(items.filter((_,j)=>i!==j))}>×</button>
   <button type="button" disabled={i===0} aria-label={'Move '+label+' point '+(i+1)+' up'} onClick={()=>{const a=[...items];[a[i-1],a[i]]=[a[i],a[i-1]];onChange(a);}}>↑</button>
   <button type="button" disabled={i===items.length-1} aria-label={'Move '+label+' point '+(i+1)+' down'} onClick={()=>{const a=[...items];[a[i+1],a[i]]=[a[i],a[i+1]];onChange(a);}}>↓</button>
 </div>)}
 <button type="button" disabled={items.length>=max} onClick={()=>onChange([...items,{x:40,y:40}])}>+ Add point</button></fieldset>;
}
function LocalAsset({label,value,assets,onChange,onAsset,onError}:{label:string;value:string;assets:readonly WorkspaceImageAsset[];onChange:(v:string)=>void;onAsset:(asset:WorkspaceImageAsset)=>void;onError:(error:string)=>void}){
 return <fieldset className="aw-canvas-properties"><legend>{label}</legend>
 <Field label={label+' image'}><select aria-label={label+' SHA-256 source'} value={value} onChange={e=>onChange(e.target.value)}>
   {assets.map((a,i)=><option key={a.id} value={a.id}>Image {i+1} · {a.width} × {a.height} · {a.mime.replace('image/','').toUpperCase()}</option>)}
 </select></Field>
 <Field label={'Import verified '+label}><input type="file" aria-label={'Import verified '+label} accept="image/png,image/jpeg,image/webp" onChange={async e=>{
 const input=e.currentTarget,file=input.files?.[0];input.value='';if(!file)return;
 try{const asset=await importImageAsset(file);onAsset(asset);}catch(err){onError(err instanceof Error?err.message:'Image upload failed');}
 }}/></Field><small>Import a PNG, JPEG, or WebP image. It is saved with your project.</small></fieldset>;
}
function FilterList({filters,onChange}:{filters:NonNullable<ImageEditorOptions['filters']>;onChange:(v:NonNullable<ImageEditorOptions['filters']>)=>void}){
 const list=filters as unknown as Array<Record<string,unknown>>;
 const edit=(i:number,patch:Record<string,unknown>)=>onChange(list.map((x,j)=>j===i?{...x,...patch}:x) as unknown as typeof filters);
 return <fieldset className="aw-canvas-properties"><legend>Image filters ({filters.length}/8)</legend>
 {list.map((f,i)=><details key={i} open={i===list.length-1}><summary>{i+1}. {String(f.type)}</summary>
   <Enum label={'Filter '+(i+1)+' type'} value={String(f.type)} options={IMAGE_FILTERS} onChange={type=>onChange(list.map((x,j)=>j===i?{type,...Object.fromEntries(IMAGE_FILTER_FIELDS[type].map(k=>[k,k==='levels'?4:k==='size'?8:1]))}:x) as unknown as typeof filters)}/>
   {IMAGE_FILTER_FIELDS[String(f.type)]?.map(k=>{
     const integerRegion=String(f.type)==='pixelate'&&['x','y','width','height'].includes(k);
     return <Num key={k} label={String(f.type)+' '+k} value={f[k] as number|undefined}
       min={k==='levels'?2:k==='size'?1:k==='radius'?0:-2048}
       max={k==='levels'?64:k==='size'?256:2048}
       step={integerRegion||k==='levels'||k==='size'?1:0.1}
       onChange={n=>edit(i,{[k]:integerRegion?Math.round(n):n})}/>;
    })}
   <div className="aw-field-row">
   <button type="button" disabled={i===0} onClick={()=>{const a=[...list];[a[i-1],a[i]]=[a[i],a[i-1]];onChange(a as unknown as typeof filters)}}>↑</button>
   <button type="button" disabled={i===list.length-1} onClick={()=>{const a=[...list];[a[i+1],a[i]]=[a[i],a[i+1]];onChange(a as unknown as typeof filters)}}>↓</button>
   <button type="button" onClick={()=>onChange(list.filter((_,j)=>i!==j) as unknown as typeof filters)}>Remove filter</button></div>
 </details>)}
 <button type="button" disabled={list.length>=8} onClick={()=>onChange([...list,{type:'gaussianBlur',intensity:1}] as unknown as typeof filters)}>+ Add image filter</button>
 </fieldset>;
}
function WarpHandles({handles,onChange}:{handles:NonNullable<ImageDistortionOptions['controlPoints']>;onChange:(v:NonNullable<ImageDistortionOptions['controlPoints']>)=>void}){
 return <fieldset className="aw-canvas-properties"><legend>Warp / liquify handles</legend>
 {handles.map((c,i)=><details key={i} open><summary>Handle {i+1}</summary>
 {(['from','to'] as const).map(k=><div key={k} className="aw-field-row"><Num label={k+' X'} value={c[k].x} onChange={n=>onChange(handles.map((h,j)=>j===i?{...h,[k]:{...h[k],x:n}}:h))}/><Num label={k+' Y'} value={c[k].y} onChange={n=>onChange(handles.map((h,j)=>j===i?{...h,[k]:{...h[k],y:n}}:h))}/></div>)}
 <Num label="Influence radius" min={0.1} max={2048} value={c.radius??90} onChange={n=>onChange(handles.map((h,j)=>j===i?{...h,radius:n}:h))}/>
 <Num label="Strength" min={-4} max={4} step={0.1} value={c.strength??1} onChange={n=>onChange(handles.map((h,j)=>j===i?{...h,strength:n}:h))}/>
 <Enum label="Falloff" value={c.falloff??'smooth'} options={['linear','smooth','gaussian']} onChange={s=>onChange(handles.map((h,j)=>j===i?{...h,falloff:s as typeof h.falloff}:h))}/>
 <button type="button" disabled={handles.length<=1} onClick={()=>onChange(handles.filter((_,j)=>i!==j))}>Remove handle</button></details>)}
 <button type="button" disabled={handles.length>=12} onClick={()=>onChange([...handles,{from:{x:100,y:100},to:{x:120,y:100},radius:90,strength:1,falloff:'smooth'}])}>+ Add warp handle</button>
 </fieldset>;
}
function Distortion({value,onChange,width,height}:{value:ImageDistortionOptions;onChange:(v:ImageDistortionOptions|undefined)=>void;width:number;height:number}){
 const edit=(patch:Partial<ImageDistortionOptions>)=>onChange({...value,...patch});
 const warpMethod=value.controlPoints!==undefined?'handles':'quad';
 const quad=[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}];
 const warpHandle={from:{x:width/3,y:height/3},to:{x:width/2,y:height/2},radius:90,strength:1,falloff:'smooth' as const};
 const keys=(value.type==='bulge'||value.type==='pinch'||value.type==='twirl')?['intensity','centerX','centerY','radius',...(value.type==='twirl'?['angle']:[])]:value.type==='wave'?['amplitudeX','amplitudeY','wavelengthX','wavelengthY','phaseX','phaseY']:[];
 return <fieldset className="aw-canvas-properties"><legend>Raster distortion</legend>
 <Enum label="Distortion type" value={value.type} options={IMAGE_DISTORTIONS} onChange={type=>onChange({type:type as ImageDistortionOptions['type'],...(type==='warp'||type==='perspective'?{points:[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}]}:{intensity:0.3})})}/>
 {keys.map(k=><Num key={k} label={'Distortion '+k} min={k.startsWith('wavelength')?0.01:k==='radius'?0.1:-2048} value={(value as unknown as Record<string,unknown>)[k] as number|undefined ??(k==='radius'?Math.min(width,height)/2: k.startsWith('wavelength')?100:0)} onChange={n=>edit({[k]:n})}/>)}
 {value.type==='warp'&&<Enum label="Warp geometry mode" value={warpMethod} options={['quad','handles']} onChange={method=>{
  const {points:_points,controlPoints:_handles,...rest}=value;
  onChange(method==='handles'?{...rest,controlPoints:[warpHandle]}:{...rest,points:quad});
 }}/>}
 {(value.type==='perspective'||(value.type==='warp'&&warpMethod==='quad'))&&<Points label="Quad corners · TL → TR → BR → BL" items={value.points??quad} max={4} min={4} onChange={points=>edit({points})}/>}
 {value.type==='warp'&&warpMethod==='handles'&&<WarpHandles handles={value.controlPoints??[warpHandle]} onChange={controlPoints=>edit({controlPoints})}/>}
 <Enum label="Distortion interpolation" value={value.interpolation??'bilinear'} options={IMAGE_INTERPOLATIONS} onChange={s=>edit({interpolation:s as ImageDistortionOptions['interpolation']})}/>
 <Enum label="Distortion edge mode" value={value.edgeMode??'transparent'} options={IMAGE_EDGES} onChange={s=>edit({edgeMode:s as ImageDistortionOptions['edgeMode']})}/>
 <button type="button" onClick={()=>onChange(undefined)}>Remove distortion</button></fieldset>;
}
function Mesh({value,onChange,width,height}:{value:ImageMeshWarpOptions;onChange:(v:ImageMeshWarpOptions|undefined)=>void;width:number;height:number}){
 const gx=value.gridX??2,gy=value.gridY??2;
 const make=(nx:number,ny:number)=>Array.from({length:ny+1},(_,j)=>Array.from({length:nx+1},(_,i)=>({x:i*width/nx,y:j*height/ny})));
 const matrix=value.controlPoints??make(gx,gy);
 const edit=(i:number,j:number,key:'x'|'y',n:number)=>onChange({...value,controlPoints:matrix.map((row,y)=>row.map((p,x)=>x===j&&y===i?{...p,[key]:n}:p))});
 return <fieldset className="aw-canvas-properties"><legend>Mesh warp · layer-local vertices</legend>
 <div className="aw-field-row">{(['gridX','gridY'] as const).map(k=><Num key={k} label={k} min={1} max={8} value={k==='gridX'?gx:gy} onChange={n=>{const x=k==='gridX'?Math.round(n):gx,y=k==='gridY'?Math.round(n):gy;onChange({...value,gridX:x,gridY:y,controlPoints:make(x,y)})}}/>)}</div>
 {matrix.map((row,i)=><details key={i}><summary>Mesh row {i+1}</summary>{row.map((p,j)=><div key={j} className="aw-field-row"><Num label={'Vertex '+j+' X'} value={p.x} onChange={n=>edit(i,j,'x',n)}/><Num label="Y" value={p.y} onChange={n=>edit(i,j,'y',n)}/></div>)}</details>)}
 <Enum label="Mesh interpolation" value={value.interpolation??'bilinear'} options={IMAGE_INTERPOLATIONS} onChange={s=>onChange({...value,interpolation:s as ImageMeshWarpOptions['interpolation']})}/>
 <Enum label="Mesh edge mode" value={value.edgeMode??'transparent'} options={IMAGE_EDGES} onChange={s=>onChange({...value,edgeMode:s as ImageMeshWarpOptions['edgeMode']})}/>
 <button type="button" onClick={()=>onChange(undefined)}>Remove mesh</button></fieldset>;
}
export default function ImageOptionsEditor({options,onChange,assets,onAsset,onError,width,height,isShape=false,shapeType}:{
 options:ImageEditorOptions;onChange:(v:ImageEditorOptions)=>void;assets:readonly WorkspaceImageAsset[];
 onAsset:(a:WorkspaceImageAsset)=>void;onError:(s:string)=>void;width:number;height:number;isShape?:boolean;shapeType?:string;
}){
 const edit=(patch:Partial<ImageEditorOptions>)=>onChange({...options,...patch});
 const clear=(key:keyof ImageEditorOptions)=>{const v={...options};delete v[key];onChange(v)};
 const mask=options.mask;
 return <div className="aw-image-options">
 <div className="aw-section-heading"><strong>Image appearance</strong></div>
 <details open><summary>Placement, fit & compositing</summary>
 <Toggle label="Use intrinsic dimensions" checked={options.inherit??false} onChange={inherit=>edit({inherit})}/>
 <Enum label="Image fit" value={options.fit??'cover'} options={IMAGE_FITS} onChange={v=>edit({fit:v as ImageProperties['fit']})}/>
 <Enum label="Image alignment" value={options.align??'center'} options={IMAGE_ALIGNS} onChange={v=>edit({align:v as ImageProperties['align']})}/>
 <Num label="Blur" value={options.blur??0} min={0} max={50} step={0.5} onChange={blur=>edit({blur})}/>
 <Enum label="Composite / blend mode" value={options.blendMode??'source-over'} options={IMAGE_COMPOSITES} onChange={v=>edit({blendMode:v as GlobalCompositeOperation})}/>
 <Toggle label="Circular border radius" checked={options.borderRadius==='circular'} onChange={v=>edit({borderRadius:v?'circular':0})}/>
 {options.borderRadius!=='circular'&&<Num label="Border radius" value={options.borderRadius??0} min={0} max={2048} onChange={borderRadius=>edit({borderRadius})}/>}
 <Enum label="Border position" value={options.borderPosition??'all'} options={['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right']} onChange={borderPosition=>edit({borderPosition})}/>
 </details>
 {isShape&&<details open><summary>Procedural shape parameters</summary>
 <Toggle label="Shape fill" checked={options.shape?.fill??true} onChange={fill=>edit({shape:{...options.shape,fill}})}/>
 {!options.shape?.gradient&&<Color label="Shape color" value={options.shape?.color??'#6739e8'} onChange={color=>edit({shape:{...options.shape,color}})}/>}
 <Toggle label="Shape gradient" checked={!!options.shape?.gradient} onChange={enabled=>{
  const {color:_color,gradient:_gradient,...shape}=options.shape??{};
  edit({shape:enabled?{...shape,gradient:DEFAULT_GRADIENT}:{...shape,color:options.shape?.color??'#6739e8'}});
 }}/>
 {options.shape?.gradient&&<GradientControls id="Image shape" gradient={options.shape.gradient as CanvasGradient} onChange={gradient=>edit({shape:{...options.shape,gradient}})}/>}
 {(['radius','sides','innerRadius','outerRadius','startAngle','endAngle','centerX','centerY'] as const).map(k=><Num key={k} label={'Shape '+k} min={k==='sides'?3:0} max={k==='sides'?64:2048} value={options.shape?.[k]??(k==='sides'?5:k==='radius'?50:0)} onChange={n=>edit({shape:{...options.shape,[k]:n}})}/>)}
 {shapeType==='polygon'&&<Points label="Polygon points" items={options.shape?.points??[{x:0,y:0},{x:width,y:0},{x:width/2,y:height}]} max={32} onChange={points=>edit({shape:{...options.shape,points}})}/>}
 </details>}
 <details><summary>Stroke, shadow & background paint</summary>
 <StrokeControls id="Image" value={options.stroke as CanvasStroke|undefined} onChange={stroke=>edit({stroke})}/>
  {options.stroke&&!options.stroke.gradient&&<HexColor label="Image stroke color hex" value={options.stroke.color??'#000000'} onChange={color=>edit({stroke:{...options.stroke,color}})}/>}
 <ShadowControls id="Image" value={options.shadow as CanvasShadow|undefined} onChange={shadow=>edit({shadow})}/>
  {options.shadow&&!options.shadow.gradient&&<HexColor label="Image shadow color hex" value={options.shadow.color??'#000000'} onChange={color=>edit({shadow:{...options.shadow,color}})}/>}
 <Toggle label="Box background enabled" checked={!!options.boxBackground} onChange={on=>on?edit({boxBackground:{color:'#141c30'}}):clear('boxBackground')}/>
 {options.boxBackground&&<>
 {!options.boxBackground.gradient&&<Color label="Box color" value={options.boxBackground.color??'#141c30'} onChange={color=>edit({boxBackground:{...options.boxBackground,color}})}/>}
 <Toggle label="Box gradient" checked={!!options.boxBackground.gradient} onChange={on=>{
  const {color:_color,gradient:_gradient,...box}=options.boxBackground??{};
  edit({boxBackground:on?{...box,gradient:DEFAULT_GRADIENT}:{...box,color:options.boxBackground?.color??'#141c30'}});
 }}/>
 {options.boxBackground.gradient&&<GradientControls id="Image box" gradient={options.boxBackground.gradient as CanvasGradient} onChange={gradient=>edit({boxBackground:{...options.boxBackground,gradient}})}/>}
 </>}
 </details>
 <details><summary>Filters & color</summary>
 <Enum label="Filter ordering" value={options.filterOrder??'pre'} options={['pre','post']} onChange={v=>edit({filterOrder:v as ImageProperties['filterOrder']})}/>
 <Num label="Filter intensity" value={options.filterIntensity??1} min={0} max={50} step={0.1} onChange={filterIntensity=>edit({filterIntensity})}/>
 <FilterList filters={options.filters??[]} onChange={filters=>edit({filters})}/>
 </details>
 <details><summary>Image masks & polygon clipping</summary>
 <Toggle label="Enable image mask" checked={!!mask} onChange={enabled=>enabled?assets[0]?edit({mask:{source:assets[0].id,mode:'alpha'}}):onError('Import a verified image asset before enabling a mask'):clear('mask')}/>
 {mask&&<><LocalAsset label="Mask" value={mask.source} assets={assets} onChange={source=>edit({mask:{...mask,source}})} onAsset={onAsset} onError={onError}/>
 <Enum label="Mask mode" value={mask.mode??'alpha'} options={['alpha','luminance','inverse']} onChange={mode=>edit({mask:{...mask,mode:mode as NonNullable<ImageEditorOptions['mask']>['mode']}})}/></>}
 <Toggle label="Enable polygon clip" checked={!!options.clipPath} onChange={enabled=>enabled?edit({clipPath:[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}]}):clear('clipPath')}/>
 {options.clipPath&&<Points label="Clip polygon" items={options.clipPath} onChange={clipPath=>edit({clipPath})}/>}
 </details>
 <details><summary>Distortion & mesh warping</summary>
 <Toggle label="Enable distortion" checked={!!options.distortion} onChange={enabled=>enabled?edit({distortion:{type:'bulge',intensity:0.3}}):clear('distortion')}/>
 {options.distortion&&<Distortion width={width} height={height} value={options.distortion} onChange={distortion=>distortion?edit({distortion}):clear('distortion')}/>}
 <Toggle label="Enable mesh warp" checked={!!options.meshWarp} onChange={enabled=>enabled?edit({meshWarp:{gridX:2,gridY:2,controlPoints:Array.from({length:3},(_,j)=>Array.from({length:3},(_,i)=>({x:i*width/2,y:j*height/2})))}}):clear('meshWarp')}/>
 {options.meshWarp&&<Mesh width={width} height={height} value={options.meshWarp} onChange={meshWarp=>meshWarp?edit({meshWarp}):clear('meshWarp')}/>}
 </details>
 <details><summary>Photographic effects</summary>
 {([['vignette',['intensity','size']],['lensFlare',['x','y','intensity']],['chromaticAberration',['intensity']],['filmGrain',['intensity']]] as const).map(([k,fields])=>{
 const eff=options.effects??{},present=eff[k],values=present as Record<string,number>|undefined;
 const change=(next:Record<string,number>|undefined)=>{const effects={...eff,[k]:next};edit({effects});};
 return <fieldset key={k} className="aw-canvas-properties"><legend>{k}</legend>
 <Toggle label={'Enable '+k} checked={!!present} onChange={v=>change(v?Object.fromEntries(fields.map(f=>[f,f==='size'?0.6:f==='x'?width/2:f==='y'?height/2:0.4])):undefined)}/>
 {present&&fields.map(f=><Num key={f} label={k+' '+f} value={values?.[f]} min={f==='intensity'?0:-2048} max={f==='intensity'?5:4096} step={0.1} onChange={n=>change({...values,[f]:n})}/>)}
 </fieldset>;
 })}
 </details>
 </div>;
}
export function GroupTransformEditor({value,onChange,assets,onAsset,onError,width,height}:{value:GroupTransformOptions;onChange:(v:GroupTransformOptions)=>void;assets:readonly WorkspaceImageAsset[];onAsset:(a:WorkspaceImageAsset)=>void;onError:(s:string)=>void;width:number;height:number}){
 const edit=(patch:Partial<GroupTransformOptions>)=>onChange({...value,...patch});
 const extra=value as ImageEditorOptions;
 return <div className="aw-image-options"><div className="aw-section-heading"><strong>Grouped createImage transform</strong></div>
 {(['rotation','translateX','translateY','scaleX','scaleY','pivotX','pivotY','opacity','blur'] as const).map(k=><Num key={k} label={'Group '+k} value={value[k]??(k==='scaleX'||k==='scaleY'||k==='opacity'?1:0)} min={k==='opacity'?0:k==='scaleX'||k==='scaleY'?-8:-2048} max={k==='opacity'?1:k==='scaleX'||k==='scaleY'?8:2048} step={0.1} onChange={n=>edit({[k]:n})}/>)}
 <Enum label="Group compositing" value={value.blendMode??'source-over'} options={IMAGE_COMPOSITES} onChange={blendMode=>edit({blendMode:blendMode as GlobalCompositeOperation})}/>
 <Toggle label="Circular group radius" checked={value.borderRadius==='circular'} onChange={checked=>edit({borderRadius:checked?'circular':0})}/>
 {value.borderRadius!=='circular'&&<Num label="Group border radius" value={value.borderRadius??0} min={0} max={2048} onChange={borderRadius=>edit({borderRadius})}/>}
 <Enum label="Group border position" value={value.borderPosition??'all'} options={['all','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right']} onChange={borderPosition=>edit({borderPosition:borderPosition as GroupTransformOptions['borderPosition']})}/>
 <StrokeControls id="Image group" value={value.stroke as CanvasStroke|undefined} onChange={stroke=>edit({stroke})}/>
  {value.stroke&&!value.stroke.gradient&&<HexColor label="Image group stroke color hex" value={value.stroke.color??'#000000'} onChange={color=>edit({stroke:{...value.stroke,color}})}/>}
 <ShadowControls id="Image group" value={value.shadow as CanvasShadow|undefined} onChange={shadow=>edit({shadow})}/>
  {value.shadow&&!value.shadow.gradient&&<HexColor label="Image group shadow color hex" value={value.shadow.color??'#000000'} onChange={color=>edit({shadow:{...value.shadow,color}})}/>}
 <Enum label="Group filter order" value={value.filterOrder??'pre'} options={['pre','post']} onChange={filterOrder=>edit({filterOrder:filterOrder as GroupTransformOptions['filterOrder']})}/>
 <Num label="Group filter intensity" value={value.filterIntensity??1} min={0} max={50} onChange={filterIntensity=>edit({filterIntensity})}/>
 <FilterList filters={value.filters??[]} onChange={filters=>edit({filters})}/>
 <Toggle label="Group mask" checked={!!value.mask} onChange={checked=>checked?assets[0]?edit({mask:{source:assets[0].id,mode:'alpha'}}):onError('Import verified mask asset first'):edit({mask:undefined})}/>
 {value.mask&&<LocalAsset label="Group mask" assets={assets} value={value.mask.source as string} onChange={source=>edit({mask:{...value.mask,source}})} onAsset={onAsset} onError={onError}/>}
 {value.mask&&<Enum label="Group mask mode" value={value.mask.mode??'alpha'} options={['alpha','luminance','inverse']} onChange={mode=>edit({mask:{...value.mask!,mode:mode as 'alpha'|'luminance'|'inverse'}})}/>}
 <Toggle label="Group clipping" checked={!!value.clipPath} onChange={checked=>edit({clipPath:checked?[{x:0,y:0},{x:width,y:0},{x:width,y:height}]:undefined})}/>
 {value.clipPath&&<Points label="Group clip" items={value.clipPath} onChange={clipPath=>edit({clipPath})}/>}
 <Toggle label="Group distortion" checked={!!value.distortion} onChange={checked=>edit({distortion:checked?{type:'bulge',intensity:0.3}:undefined})}/>
 {value.distortion&&<Distortion width={width} height={height} value={value.distortion} onChange={distortion=>edit({distortion})}/>}
 <Toggle label="Group mesh" checked={!!value.meshWarp} onChange={checked=>edit({meshWarp:checked?{gridX:1,gridY:1,controlPoints:[[{x:0,y:0},{x:width,y:0}],[{x:0,y:height},{x:width,y:height}]],interpolation:'bilinear',edgeMode:'transparent'}:undefined})}/>
 {value.meshWarp&&<Mesh width={width} height={height} value={value.meshWarp} onChange={meshWarp=>edit({meshWarp})}/>}
 <Toggle label="Group vignette" checked={!!value.effects?.vignette} onChange={checked=>edit({effects:{...value.effects,vignette:checked?{intensity:0.4,size:0.6}:undefined}})}/>
 {value.effects?.vignette&&(['intensity','size'] as const).map(k=><Num key={k} label={'Group vignette '+k} value={value.effects?.vignette?.[k]} onChange={n=>edit({effects:{...value.effects,vignette:{...value.effects!.vignette!,[k]:n}}})}/>)}
 <Toggle label="Group film grain" checked={!!value.effects?.filmGrain} onChange={checked=>edit({effects:{...value.effects,filmGrain:checked?{intensity:0.4}:undefined}})}/>
 {value.effects?.filmGrain&&<Num label="Group film grain" value={value.effects.filmGrain.intensity} onChange={intensity=>edit({effects:{...value.effects,filmGrain:{intensity}}})}/>}
 <Toggle label="Group chromatic aberration" checked={!!value.effects?.chromaticAberration} onChange={checked=>edit({effects:{...value.effects,chromaticAberration:checked?{intensity:0.4}:undefined}})}/>
 {value.effects?.chromaticAberration&&<Num label="Group chromatic aberration" value={value.effects.chromaticAberration.intensity} onChange={intensity=>edit({effects:{...value.effects,chromaticAberration:{intensity}}})}/>}
 <Toggle label="Group lens flare" checked={!!value.effects?.lensFlare} onChange={checked=>edit({effects:{...value.effects,lensFlare:checked?{x:width/2,y:height/2,intensity:0.4}:undefined}})}/>
 {value.effects?.lensFlare&&(['x','y','intensity'] as const).map(k=><Num key={k} label={'Group flare '+k} value={value.effects?.lensFlare?.[k]} onChange={n=>edit({effects:{...value.effects,lensFlare:{...value.effects!.lensFlare!,[k]:n}}})}/>)}
 <Toggle label="Group box paint" checked={!!value.boxBackground} onChange={checked=>edit({boxBackground:checked?{color:'#111827'}:undefined})}/>
 {value.boxBackground&&<>
 {!value.boxBackground.gradient&&<Color label="Group box color" value={value.boxBackground.color??'#111827'} onChange={color=>edit({boxBackground:{...value.boxBackground,color}})}/>}
 <Toggle label="Group box gradient" checked={!!value.boxBackground.gradient} onChange={checked=>{
  const {color:_color,gradient:_gradient,...box}=value.boxBackground??{};
  edit({boxBackground:checked?{...box,gradient:DEFAULT_GRADIENT}:{...box,color:value.boxBackground?.color??'#111827'}});
 }}/>
 {value.boxBackground.gradient&&<GradientControls id="Group box" gradient={value.boxBackground.gradient as CanvasGradient} onChange={gradient=>edit({boxBackground:{...value.boxBackground,gradient}})}/>}
 </>}
 </div>;
}
