"use client";
import type {CanvasGradient,CanvasStroke,CanvasShadow} from "../canvas-options";
import {Field,NumberField} from "./ui";
import BorderMultiSelect from './BorderMultiSelect';
import {GradientControls,createGradient} from "./CanvasNestedControls";
type Props<T>={value:T|undefined;onChange:(value:T|undefined)=>void;id:string};
export function StrokeControls({value,onChange,id}:Props<CanvasStroke>){
 const edit=(patch:Partial<CanvasStroke>)=>onChange({...value,...patch});
 const color=value?.color??"#ff783d";
 const radius=value?.borderRadius==="circular"?"circular":"numeric";
 return <fieldset className="aw-canvas-properties" aria-label={id+" stroke properties"}>
  <legend>Stroke</legend>
  <Field label="Enable stroke"><input type="checkbox" aria-label={id+" stroke enabled"}
    checked={value!==undefined} onChange={e=>onChange(e.target.checked?{color:"#ff783d",width:8,opacity:1,style:"solid"}:undefined)}/></Field>
  {value?<div>
    <Field label="Gradient stroke paint"><input aria-label={id+" stroke gradient enabled"} type="checkbox"
      checked={!!value.gradient} onChange={e=>{
        if(e.target.checked){const {color:_color,...rest}=value;onChange({...rest,gradient:createGradient("linear")});}
        else{const {gradient:_gradient,...rest}=value;onChange({...rest,color:"#ff783d"});}
      }}/></Field>
    {value.gradient?<GradientControls id={id+" stroke"} gradient={value.gradient}
      onChange={gradient=>edit({gradient})}/>:<Field label="Stroke color"><input type="color"
      aria-label={id+" stroke color"} value={color.slice(0,7)} onChange={e=>edit({color:e.target.value})}/></Field>}
    <div className="aw-field-row">
      <NumberField label={id+" stroke width"} value={value.width??8} min={0} max={200} step={1} onChange={width=>edit({width})}/>
      <NumberField label={id+" stroke position"} value={value.position??0} min={-200} max={200} onChange={position=>edit({position})}/>
      <NumberField label={id+" stroke opacity"} value={value.opacity??1} min={0} max={1} step={0.05} onChange={opacity=>edit({opacity})}/>
      <NumberField label={id+" stroke blur"} value={value.blur??0} min={0} max={100} onChange={blur=>edit({blur})}/>
      <Field label="Stroke style"><select aria-label={id+" stroke style"} value={value.style??"solid"}
        onChange={e=>edit({style:e.target.value as CanvasStroke["style"]})}>
        {(["solid","dashed","dotted","groove","ridge","double"] as const).map(x=><option key={x} value={x}>{x}</option>)}
      </select></Field>
      <BorderMultiSelect label="Stroke edges" ariaLabel={id+" stroke border position"} kind="edges"
        value={value.borderPosition??"all"} onChange={borderPosition=>edit({borderPosition})}/>
      <BorderMultiSelect label="Rounded corners" ariaLabel={id+" stroke rounded corners"} kind="corners"
        value={value.roundedCorners??"all"} onChange={roundedCorners=>edit({roundedCorners})}/>
      <Field label="Stroke radius mode"><select aria-label={id+" stroke radius mode"} value={radius}
        onChange={e=>edit({borderRadius:e.target.value==="circular"?"circular":0})}>
        <option value="numeric">Numeric radius</option><option value="circular">Circular radius</option>
      </select></Field>
      {radius==="numeric"?<NumberField label={id+" stroke radius"} value={typeof value.borderRadius==="number"?value.borderRadius:0}
        min={0} max={1024} onChange={borderRadius=>edit({borderRadius})}/>:null}
    </div>
  </div>:null}
 </fieldset>;
}
export function ShadowControls({value,onChange,id,ownerRadius=0,ownerCorners='all'}:Props<CanvasShadow>&{
 /** S20 explicitly supplied shadow radius overrides the owning Canvas radius. */
 ownerRadius?:number|'circular';ownerCorners?:string;
 }){
 const effectiveRadius=value?.borderRadius??ownerRadius;
 const roundedEffective=effectiveRadius==='circular'||effectiveRadius>0;
 const inheritsCanvas=id==='Canvas'||id==='Graph';
 const edit=(patch:Partial<CanvasShadow>)=>onChange({...value,...patch});
 return <fieldset className="aw-canvas-properties" aria-label={id+" shadow properties"}>
  <legend>Shadow</legend>
  <Field label="Enable shadow"><input type="checkbox" aria-label={id+" shadow enabled"}
    checked={value!==undefined} onChange={e=>onChange(e.target.checked?{color:"#e0a4ff",blur:8,offsetX:6,offsetY:6,opacity:1}:undefined)}/></Field>
  {value?<div>
    <Field label="Gradient shadow paint"><input type="checkbox" aria-label={id+" shadow gradient enabled"}
      checked={!!value.gradient} onChange={e=>{
        if(e.target.checked){const {color:_color,...rest}=value;onChange({...rest,gradient:createGradient("linear")});}
        else{const {gradient:_gradient,...rest}=value;onChange({...rest,color:"#e0a4ff"});}
      }}/></Field>
    {value.gradient?<GradientControls id={id+" shadow"} gradient={value.gradient}
      onChange={gradient=>edit({gradient})}/>:<Field label="Shadow color"><input type="color"
      aria-label={id+" shadow color"} value={(value.color??"#e0a4ff").slice(0,7)}
        onChange={e=>edit({color:e.target.value})}/></Field>}
    <div className="aw-field-row">
      <NumberField label={id+" shadow X"} value={value.offsetX??6} min={-512} max={512} onChange={offsetX=>edit({offsetX})}/>
      <NumberField label={id+" shadow Y"} value={value.offsetY??6} min={-512} max={512} onChange={offsetY=>edit({offsetY})}/>
      <NumberField label={id+" shadow blur"} value={value.blur??8} min={0} max={100} onChange={blur=>edit({blur})}/>
      <NumberField label={id+" shadow opacity"} value={value.opacity??1} min={0} max={1} step={0.05} onChange={opacity=>edit({opacity})}/>
      <BorderMultiSelect label="Shadow rounded corners" ariaLabel={id+" shadow rounded corners"} kind="corners"
        disabled={!roundedEffective} value={value.roundedCorners} fallbackValue={value.borderPosition??ownerCorners}
        onChange={roundedCorners=>edit({roundedCorners})} onInherit={()=>edit({roundedCorners:undefined})}/>
      <details className="aw-effect-compatibility"><summary>Compatibility settings</summary>
        <BorderMultiSelect label="Legacy shadow corners" ariaLabel={id+" shadow border position"} kind="corners"
          value={value.borderPosition} fallbackValue={ownerCorners} onChange={borderPosition=>edit({borderPosition})}
          onInherit={()=>edit({borderPosition:undefined})}/>
      </details>
      <Field label="Shadow radius mode"><select aria-label={id+" shadow radius mode"}
        value={value.borderRadius===undefined?"inherit":value.borderRadius==="circular"?"circular":"numeric"}
        onChange={e=>edit({borderRadius:e.target.value==="inherit"?undefined:e.target.value==="circular"?"circular":32})}>
        <option value="inherit">{inheritsCanvas?'Inherit canvas radius':'Default square shadow'}</option>
        <option value="numeric">Explicit numeric shadow radius</option>
        <option value="circular">Circular shadow radius</option>
      </select></Field>
      {typeof value.borderRadius==="number"?<NumberField label={id+" shadow radius"} value={value.borderRadius}
        min={0} max={1024} step={1} onChange={borderRadius=>edit({borderRadius})}/>:null}
      <p className="aw-canvas-note">{inheritsCanvas?'An explicit shadow radius overrides the canvas radius. Inherit uses the canvas geometry.':'Image shadows use their own radius; set a positive radius to round them.'} Rounded-corner choices override legacy shadow corners. {roundedEffective?'Corner clipping is enabled.':'A positive radius is required for visible corner clipping.'}</p>
    </div>
  </div>:null}
 </fieldset>;
}
