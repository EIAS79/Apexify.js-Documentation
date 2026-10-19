"use client";
import { useRef } from "react";
import type { WorkspaceLayer } from "../model";
import type { LayerPatch } from "./Tools";
import { Field, NumberField } from "./ui";
import { UploadImage } from "./Tools";
export default function AdvancedLayerEditor({layer,onChange,onError}:{layer:WorkspaceLayer;onChange:(patch:LayerPatch)=>void;onError:(message:string)=>void}) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<number|null>(null);
  if(layer.kind === "component") return <>
    <Field label="Component"><select value={layer.component} onChange={e=>onChange({component:e.target.value})}>{["card","badge","progressBar","avatar","watermark"].map(v=><option key={v}>{v}</option>)}</select></Field>
    {layer.component === "avatar" ? <UploadImage onError={onError} onUpload={source=>onChange({source})}>Avatar image</UploadImage> : <Field label="Component text"><input value={layer.text} maxLength={200} onChange={e=>onChange({text:e.target.value})}/></Field>}
    {layer.component === "card" && <Field label="Body"><textarea value={layer.body} maxLength={1000} onChange={e=>onChange({body:e.target.value})}/></Field>}
    {layer.component === "progressBar" && <NumberField label="Progress" min={0} max={100} value={layer.value} onChange={value=>onChange({value})}/>}
    <Field label="Accent"><input type="color" value={layer.color} onChange={e=>onChange({color:e.target.value})}/></Field>
    <Field label="Component background"><input type="color" value={layer.background} onChange={e=>onChange({background:e.target.value})}/></Field>
  </>;
  if(layer.kind !== "path") return null;
  const point = (e:React.PointerEvent<SVGSVGElement>) => {const r=svg.current!.getBoundingClientRect();return {x:Math.round(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100))),y:Math.round(Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100)))};};
  return <>
    <p className="aw-muted">Click to add a point. Drag a point to reshape the path.</p>
    <svg ref={svg} className="aw-path-editor" viewBox="-3 -3 106 106" aria-label="Path point editor" onPointerDown={e=>{if(e.target===e.currentTarget && layer.points.length<128)onChange({points:[...layer.points,point(e)]});}} onPointerMove={e=>{if(drag.current!==null)onChange({points:layer.points.map((p,i)=>i===drag.current?point(e):p)});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <polyline points={layer.points.map(p=>`${p.x},${p.y}`).join(" ")+(layer.closed?` ${layer.points[0].x},${layer.points[0].y}`:"")} fill={layer.closed?layer.color:"none"} stroke={layer.strokeColor} strokeWidth="1" pointerEvents="none"/>
      {layer.points.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#fff" stroke="#00d5ff" tabIndex={0} aria-label={`Point ${i+1}`} role="button" onKeyDown={e=>{const delta:{[key:string]:[number,number]}={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(delta[e.key]){e.preventDefault();onChange({points:layer.points.map((p,j)=>i===j?{x:Math.max(0,Math.min(100,p.x+delta[e.key][0])),y:Math.max(0,Math.min(100,p.y+delta[e.key][1]))}:p)});}} onPointerDown={e=>{e.stopPropagation();drag.current=i;svg.current?.setPointerCapture(e.pointerId);}}/>)}
    </svg>
    <Field label="Closed path"><input type="checkbox" checked={layer.closed} onChange={e=>onChange({closed:e.target.checked})}/></Field>
    <Field label="Path fill"><input type="color" value={layer.color} onChange={e=>onChange({color:e.target.value})}/></Field>
    <Field label="Path stroke"><input type="color" value={layer.strokeColor} onChange={e=>onChange({strokeColor:e.target.value})}/></Field>
    <NumberField label="Stroke width" value={layer.strokeWidth} min={0} max={30} onChange={strokeWidth=>onChange({strokeWidth})}/>
    {layer.points.map((p,i)=><div className="aw-field-row" key={i}><NumberField label={`Point ${i+1} X`} value={p.x} min={-100} max={200} onChange={x=>onChange({points:layer.points.map((p,j)=>i===j?{...p,x}:p)})}/><NumberField label={`Point ${i+1} Y`} value={p.y} min={-100} max={200} onChange={y=>onChange({points:layer.points.map((p,j)=>i===j?{...p,y}:p)})}/><button className="aw-text-button" disabled={layer.points.length<=2} onClick={()=>onChange({points:layer.points.filter((_,j)=>i!==j)})}>Remove</button></div>)}
  </>;
}
