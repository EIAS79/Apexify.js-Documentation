"use client";
import type {CanvasBorderSide,CanvasGradient,CanvasStroke,CanvasShadow} from "../canvas-options";
import {Field,NumberField} from "./ui";
import {GradientControls,createGradient} from "./CanvasNestedControls";
const sides:CanvasBorderSide[]=["all","top","bottom","left","right","top-left","top-right","bottom-left","bottom-right"];
type Props<T>={value:T|undefined;onChange:(value:T|undefined)=>void;id:string};
export function StrokeControls({value,onChange,id}:Props<CanvasStroke>){
 const edit=(patch:Partial<CanvasStroke>)=>onChange({...value,...patch});
 const color=value?.color??"#ff783d";
 const radius=value?.borderRadius==="circular"?"circular":"numeric";
 return <fieldset className="aw-canvas-properties" aria-label={id+" stroke properties"}>
  <legend>Canvas stroke</legend>
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
      <Field label="Stroke position sides"><select aria-label={id+" stroke border position"} value={value.borderPosition??"all"}
        onChange={e=>edit({borderPosition:e.target.value as CanvasBorderSide})}>
        {sides.map(x=><option key={x} value={x}>{x}</option>)}
      </select></Field>
      <Field label="Rounded corners"><select aria-label={id+" stroke rounded corners"} value={value.roundedCorners??"all"}
        onChange={e=>edit({roundedCorners:e.target.value as CanvasBorderSide})}>
        {sides.map(x=><option key={x} value={x}>{x}</option>)}
      </select></Field>
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
export function ShadowControls({value,onChange,id,ownerRadius=0}:Props<CanvasShadow>&{
 /** S20 explicitly supplied shadow radius overrides the owning Canvas radius. */
 ownerRadius?:number|'circular';
 }){
 const roundedEffective=ownerRadius==='circular'||ownerRadius>0||value?.borderRadius==='circular'||(typeof value?.borderRadius==='number'&&value.borderRadius>0);
 const edit=(patch:Partial<CanvasShadow>)=>onChange({...value,...patch});
 return <fieldset className="aw-canvas-properties" aria-label={id+" shadow properties"}>
  <legend>Canvas shadow</legend>
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
      <Field label="Shadow rounded corners"><select aria-label={id+" shadow rounded corners"}
        disabled={!roundedEffective}
        title={!roundedEffective?"Requires an owning Canvas border radius above 0 (or circular mode) to affect pinned native geometry":undefined}
        onChange={e=>edit({roundedCorners:e.target.value==="inherit"?undefined:e.target.value as typeof sides[number]})}
        value={value.roundedCorners??"inherit"}>
        <option value="inherit">Use shadow alias / owning Canvas</option>
        {sides.map(x=><option key={x} value={x}>{x}</option>)}</select></Field>
      <Field label="Shadow border position (deprecated)"><select aria-label={id+" shadow border position"}
        value={value.borderPosition??"inherit"}
        onChange={e=>edit({borderPosition:e.target.value==="inherit"?undefined:e.target.value as CanvasBorderSide})}>
        <option value="inherit">Inherit owning Canvas position</option>
        {sides.map(x=><option key={x} value={x}>{x}</option>)}</select></Field>
      <Field label="Shadow radius mode"><select aria-label={id+" shadow radius mode"}
        value={value.borderRadius===undefined?"inherit":value.borderRadius==="circular"?"circular":"numeric"}
        onChange={e=>edit({borderRadius:e.target.value==="inherit"?undefined:e.target.value==="circular"?"circular":32})}>
        <option value="inherit">Inherit owning Canvas radius</option>
        <option value="numeric">Explicit numeric shadow radius</option>
        <option value="circular">Circular shadow radius</option>
      </select></Field>
      {typeof value.borderRadius==="number"?<NumberField label={id+" shadow radius"} value={value.borderRadius}
        min={0} max={1024} step={1} onChange={borderRadius=>edit({borderRadius})}/>:null}
      <p className="aw-canvas-note">S20 native shadow overrides: explicit shadow radius and deprecated border position take priority over inherited Canvas geometry. Rounded corners take precedence over the deprecated alias; omitted values inherit. {roundedEffective?"Corner clipping is enabled.":"Set an explicit positive radius or a positive owning Canvas radius for visible corner clipping."}</p>
    </div>
  </div>:null}
 </fieldset>;
}
