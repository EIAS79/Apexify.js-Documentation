'use client';
import {CanvasFilterTypes,CanvasFilterFields,CanvasFilterDefaults,
  type CanvasFilterType,type CanvasImageFilter} from '../canvas-options';
import {Field,NumberField} from './ui';

/** Shared Inspector/Graph editor; all edits go through canonical validation. */
export function CanvasFiltersEditor({filters,onChange,disabled=false}:{
 filters:readonly CanvasImageFilter[];
 onChange:(value:CanvasImageFilter[])=>void;
 disabled?:boolean;
}){
 const change=(index:number,next:CanvasImageFilter)=>{
   onChange(filters.map((value,i)=>i===index?next:value));
 };
 return <fieldset className="aw-canvas-properties" aria-label="Verified image filter properties">
   <legend>Native verified-image filters</legend>
   <p className="aw-canvas-note">Only SHA-256 verified local PNG/JPEG/WebP with a native source shorter than 16,384 characters; max 3 filters, 1024px/1MP filtered output. No remote media or new decoder.</p>
   {filters.map((filter,index)=><div key={index} className="aw-field-row">
     <Field label={'Filter '+(index+1)+' type'}><select
       aria-label={'Filter '+(index+1)+' type'} disabled={disabled} value={filter.type}
       onChange={event=>change(index,{...CanvasFilterDefaults[event.target.value as CanvasFilterType]})}>
       {CanvasFilterTypes.map(type=><option value={type} key={type}>{type}</option>)}
     </select></Field>
     {filter.type==='gaussianBlur'?<Field label="Gaussian blur parameter">
       <input aria-label={'Filter '+(index+1)+' use radius'} type="checkbox" disabled={disabled}
         checked={filter.radius!==undefined} onChange={e=>change(index,e.target.checked
           ?{type:'gaussianBlur',radius:filter.intensity??2}
           :{type:'gaussianBlur',intensity:filter.radius??2})}/>
       <span>Use explicit radius instead of intensity</span>
     </Field>:null}
     {Object.entries(CanvasFilterFields[filter.type]).filter(([field])=>
       filter.type!=='gaussianBlur'||field===(filter.radius===undefined?'intensity':'radius')).map(([field,[min,max]])=>
       <NumberField key={field} label={'Filter '+(index+1)+' '+field}
         value={(filter as unknown as Record<string,number|undefined>)[field]??
           (CanvasFilterDefaults[filter.type] as unknown as Record<string,number|undefined>)[field]??0}
         min={min} max={max} step={['levels','size','x','y','width','height'].includes(field)?1:0.1}
         onChange={n=>{if(!disabled)change(index,{...filter,[field]:n})}}/>)}
     <button type="button" className="aw-text-button" disabled={disabled}
       aria-label={'Remove filter '+(index+1)} onClick={()=>onChange(filters.filter((_,i)=>i!==index))}>
       Remove filter
     </button>
   </div>)}
   <button type="button" className="aw-text-button" disabled={disabled||filters.length>=3}
     aria-label="Add verified image filter"
     onClick={()=>onChange([...filters,{type:'invert'}])}>Add native filter</button>
 </fieldset>;
}
