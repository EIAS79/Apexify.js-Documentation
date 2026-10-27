"use client";
import {useEffect,useRef,useState} from "react";
import type {WorkspaceLayer} from "../model";
import {
  textPropertiesSpec,textGroupSpec,textRunSpec,gradientSpec,perspectiveSpec,decorationSpec,
  validateTextSettings,type TextSettings,type TextSpec,
} from "../domain/text";

type TextLayer=Extract<WorkspaceLayer,{kind:"text"}>;
const object=(spec:TextSpec):Record<string,TextSpec>=>spec.kind==="object"?spec.fields:{};
const values=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const gradientDefault=()=>({type:"linear",colors:[{stop:0,color:"#ffffff"},{stop:1,color:"#111111"}]});
function reorder(entries:unknown[],label:string,from:number,to:number):unknown[]{
  const result=[...entries];[result[from],result[to]]=[result[to],result[from]];
  if(label==="colors")return result.map((item,i)=>({...values(item),stop:values(entries[i]).stop}));
  return result;
}
function initial(spec:TextSpec,label:string):unknown{
  if(spec===gradientSpec)return gradientDefault();
  if(spec===perspectiveSpec)return {points:[{x:0,y:0},{x:200,y:0},{x:200,y:100},{x:0,y:100}]};
  if(spec===textRunSpec)return {text:"Additional text",x:0,y:0};
  if(label==="textOnCurve")return {sweepAngle:120};
  if(label==="Grouped text options")return {isGrouped:true};
  switch(spec.kind){
    case "number":return spec.default??Math.max(spec.min,Math.min(spec.max,0));
    case "enum":return spec.default??spec.choices[0];
    case "string":return label==="text"?"Text":label==="family"||label==="name"?"DejaVu Sans":spec.default??"";
    case "font-weight":return "normal";
    case "color":return spec.default??"#ffffff";
    case "boolean":return spec.default??false;
    case "decoration":return true;
    case "array":return [];
    default:return {};
  }
}
function TextField({spec,value,label,onChange,depth=0}:{
  spec:TextSpec;value:unknown;label:string;onChange:(next:unknown)=>void;depth?:number;
}) {
  const shown=value!==undefined;
  if(spec.kind==="object") {
    const fields=object(spec);
    const data=values(value);
    return <div className="aw-text-nested" data-text-path={label}>
      <div className="aw-section-heading">
        <strong>{label}</strong>
        {shown?<button className="aw-text-button" type="button" onClick={()=>onChange(undefined)}>Remove</button>:
          <button className="aw-text-button" type="button" onClick={()=>onChange(initial(spec,label))}>Enable</button>}
      </div>
      {shown?<div className="aw-text-nested-fields">{Object.entries(fields).filter(([key])=>{
        if(spec!==gradientSpec)return true;
        const t=data.type;
        return key==="type"||key==="colors"||(t==="linear"?["startX","startY","endX","endY","rotate","pivotX","pivotY","repeat"].includes(key):
          t==="radial"?["startX","startY","startRadius","endX","endY","endRadius","rotate","pivotX","pivotY","repeat"].includes(key):
          ["centerX","centerY","startAngle","rotate","pivotX","pivotY"].includes(key));
      }).map(([key,child])=><TextField key={key} spec={child} value={data[key]} label={key} depth={depth+1}
        onChange={next=>{
          if(spec===gradientSpec&&key==="type"&&typeof next==="string"&&next!==data.type){
            const replacement=next==="conic"?{type:next,colors:data.colors??gradientDefault().colors}:
              {type:next,colors:data.colors??gradientDefault().colors};
            onChange(replacement);return;
          }
          const draft={...data};if(next===undefined)delete draft[key];else draft[key]=next;onChange(draft);
        }}/>)}</div>:null}
    </div>;
  }
  if(spec.kind==="array"){
    const entries=Array.isArray(value)?value:[];
    return <div className="aw-text-nested" data-text-path={label}>
      <div className="aw-section-heading"><strong>{label} ({entries.length})</strong>
        {shown?<button type="button" className="aw-text-button" onClick={()=>onChange(undefined)}>Remove</button>:null}
        <button type="button" className="aw-text-button" disabled={entries.length>=spec.max}
          onClick={()=>{
            if(label==="colors"&&entries.length>=2){
              const penultimate=Number(values(entries[entries.length-2]).stop);
              const final=Number(values(entries[entries.length-1]).stop);
              onChange([...entries.slice(0,-1),{stop:(penultimate+final)/2,color:"#ffffff"},entries[entries.length-1]]);
            }else onChange([...entries,initial(spec.item,label)]);
          }}>Add item</button>
      </div>
      {entries.map((entry,index)=><div key={index} className="aw-text-array-entry">
        <div className="aw-field-row"><span>{label} #{index+1}</span>
          <button type="button" className="aw-text-button" aria-label={label+" move item up "+index}
            disabled={index===0} onClick={()=>onChange(reorder(entries,label,index,index-1))}>↑</button>
          <button type="button" className="aw-text-button" aria-label={label+" move item down "+index}
            disabled={index===entries.length-1} onClick={()=>onChange(reorder(entries,label,index,index+1))}>↓</button>
          <button type="button" className="aw-text-button" aria-label={label+" remove item "+index}
            disabled={entries.length<=(spec.min??0)} onClick={()=>onChange(entries.filter((_,i)=>i!==index))}>×</button>
        </div>
        <TextField spec={spec.item} value={entry} label={label+"["+index+"]"} depth={depth+1}
          onChange={next=>onChange(entries.map((value,i)=>i===index?next:value))}/>
      </div>)}
    </div>;
  }
  if(spec.kind==="decoration"){
    const mode=value===undefined?"unset":value===false?"off":value===true?"on":"styled";
    return <div className="aw-text-nested">
      <label className="aw-field">{label}<select aria-label={"Text "+label} value={mode} onChange={e=>onChange(
        e.target.value==="unset"?undefined:e.target.value==="off"?false:e.target.value==="on"?true:{color:"#ffffff"}
      )}>{["unset","off","on","styled"].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
      {mode==="styled"?<TextField spec={decorationSpec} value={value} label={label+" style"} depth={depth+1} onChange={onChange}/>:null}
    </div>;
  }
  if(!shown)return <div className="aw-field-row aw-text-optional"><span>{label}</span>
    <button type="button" className="aw-text-button" onClick={()=>onChange(initial(spec,label))}>Add</button>
  </div>;
  return <label className="aw-field aw-text-leaf"><span>{label}</span>
    <span className="aw-field-row">
    {spec.kind==="boolean"?<input type="checkbox" aria-label={"Text "+label} checked={value===true} onChange={e=>onChange(e.target.checked)}/>:
      spec.kind==="font-weight"?<span className="aw-field-row">
        <select aria-label={"Text "+label+" mode"} value={typeof value==="number"?"numeric":String(value)}
          onChange={e=>onChange(e.target.value==="numeric"?400:e.target.value)}>
          {["normal","bold","bolder","lighter"].map(x=><option key={x} value={x}>{x}</option>)}
          <option value="numeric">Numeric (100–900)</option>
        </select>
        {typeof value==="number"?<input aria-label={"Text "+label+" numeric"} type="number" min={100} max={900}
          step={1} value={value} onChange={e=>{
            const next=Number(e.target.value);
            if(e.target.value&&Number.isInteger(next)&&next>=100&&next<=900)onChange(next);
          }}/>:null}
      </span>:
      spec.kind==="enum"?<select aria-label={"Text "+label} value={String(value)} onChange={e=>onChange(e.target.value)}>
        {spec.choices.map(x=><option key={x} value={x}>{x}</option>)}</select>:
      label==="text"?<textarea aria-label="Text additional content" value={String(value)} onChange={e=>onChange(e.target.value)}/>:
      <input aria-label={"Text "+label} type={spec.kind==="number"?"number":"text"}
        min={spec.kind==="number"?spec.min:undefined} max={spec.kind==="number"?spec.max:undefined}
        step={spec.kind==="number"?"any":undefined}
        value={value as string|number} onChange={e=>{if(spec.kind==="number"){const next=Number(e.target.value);if(e.target.value&&Number.isFinite(next)&&next>=spec.min&&next<=spec.max)onChange(next);}
          else onChange(e.target.value);}}/>}
    <button type="button" className="aw-text-button" title={"Remove "+label} aria-label={"Remove text "+label} onClick={()=>onChange(undefined)}>×</button>
    </span>
  </label>;
}
export default function TextOptionsEditor({layer,onChange,onBounds,compact=false,focus="all"}:{
  layer:TextLayer;onChange:(settings:TextSettings)=>void;onBounds?:(width:number,height:number)=>void;compact?:boolean;focus?:"all"|"typography"|"effects"|"advanced";
}){
  const [error,setError]=useState("");
  const [measureError,setMeasureError]=useState("");
  const [metrics,setMetrics]=useState<Record<string,unknown>|null>(null);
  const [itemMetrics,setItemMetrics]=useState<Array<Record<string,unknown>>|null>(null);
  const [busy,setBusy]=useState(false);
  const measurementRevision=useRef(0);
  useEffect(()=>{
    measurementRevision.current++;
    setMetrics(null);setItemMetrics(null);setMeasureError("");setBusy(false);
  },[layer.id]);
  const settings=layer.textSettings??{};
  function commit(next:TextSettings){
    try{const result=validateTextSettings(next)??{};measurementRevision.current++;onChange(result);setError("");setMetrics(null);setItemMetrics(null);}
    catch(e){setError(e instanceof Error?e.message:"Invalid text option");}
  }
  function edit(key:"properties"|"items"|"group",value:unknown){
    const next={...settings} as Record<string,unknown>;
    if(value===undefined)delete next[key];else next[key]=value;
    commit(next as TextSettings);
  }
  async function measure(){
    const revision=++measurementRevision.current;
    setBusy(true);setMeasureError("");
    try{
      const response=await fetch("/api/workspace/text-metrics",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({layer})});
      const payload=await response.json();
      if(!response.ok)throw Error(payload.error??"Native measurement failed");
      if(revision!==measurementRevision.current)return;
      setMetrics(payload.metrics);
      setItemMetrics(Array.isArray(payload.items)?payload.items:null);
    }catch(e){if(revision===measurementRevision.current)setMeasureError(e instanceof Error?e.message:"Measurement failed");}
    finally{if(revision===measurementRevision.current)setBusy(false);}
  }
  return <section className={"aw-text-editor"+(compact?" aw-text-editor-compact":"")} data-text-focus={focus} aria-label="Advanced typography editor">
    <div className="aw-section-heading"><strong>Native Apexify.js typography</strong></div>
    <p className="aw-value">Nested v6 API. Optional fields default to the pinned engine. Font paths are disabled for security. Browser font fallback is not a pixel parity guarantee.</p>
    {(focus === "all" || focus === "typography") && <TextField spec={textPropertiesSpec} value={settings.properties} label="Text properties" onChange={v=>edit("properties",v)}/>}
    {(focus === "all" || focus === "advanced") && <TextField spec={{kind:"array",max:32,item:textRunSpec}} value={settings.items} label="Text array items" onChange={v=>edit("items",v)}/>}
    {(focus === "all" || focus === "effects") && <TextField spec={textGroupSpec} value={settings.group} label="Grouped text options" onChange={v=>edit("group",v)}/>}
    {error?<p role="alert" className="aw-error">{error}</p>:null}
    {(focus === "all" || focus === "advanced") && <>
    <div className="aw-section-heading"><strong>Native text measurements</strong></div>
    <button type="button" className="aw-text-button" onClick={()=>void measure()} disabled={busy}>
      {busy?"Measuring…":"Measure with painter.measureText"}
    </button>
    {measureError?<p role="alert" className="aw-error">{measureError}</p>:null}
    {metrics?<div className="aw-text-metrics" aria-live="polite">
      <span>Width: {Number(metrics.width).toFixed(2)} px</span>
      <span>Height: {Number(metrics.height).toFixed(2)} px</span>
      <span>Line count: {String(metrics.lineCount??1)}</span>
      <span>Ascent: {Number(metrics.actualBoundingBoxAscent).toFixed(2)} px</span>
      <span>Descent: {Number(metrics.actualBoundingBoxDescent).toFixed(2)} px</span>
      <span>Baseline: {Number(metrics.baseline).toFixed(2)} px</span>
      {onBounds?<button type="button" className="aw-text-button" onClick={()=>onBounds(
        Math.max(1,Math.min(2048,Math.ceil(Number(metrics.width)))),
        Math.max(1,Math.min(2048,Math.ceil(Number(metrics.height)))))}>Use measured selection bounds</button>:null}
      {Array.isArray(metrics.lines)?<details><summary>Per-line measured data</summary><pre>{JSON.stringify(metrics.lines,null,2)}</pre></details>:null}
      {Array.isArray(metrics.charPositions)?<details><summary>Character positions</summary><pre>{JSON.stringify(metrics.charPositions,null,2)}</pre></details>:null}
      {itemMetrics?<details><summary>All {itemMetrics.length} text array measurements (before group transform)</summary>
        {itemMetrics.map((item,index)=><p key={index}>Item {index+1}: {Number(item.width).toFixed(2)} × {Number(item.height).toFixed(2)} px</p>)}
        <pre>{JSON.stringify(itemMetrics,null,2)}</pre>
      </details>:null}
      <details><summary>Complete native TextMetrics result</summary><pre>{JSON.stringify(metrics,null,2)}</pre></details>
    </div>:null}
    </>}
  </section>;
}
