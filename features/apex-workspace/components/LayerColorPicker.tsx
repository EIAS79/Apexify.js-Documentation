"use client";
import {useEffect,useState} from 'react';
import {Field} from './ui';

export default function LayerColorPicker({label,value,onChange,alpha=false}:{
 label:string;value:string;onChange:(value:string)=>void;alpha?:boolean;
}){
 const [draft,setDraft]=useState(value);
 useEffect(()=>setDraft(value),[value]);
 return <Field label={label}><div className="aw-layer-color-picker">
  <span className="aw-layer-color-swatch" style={{backgroundColor:value}}>
   <input type="color" aria-label={label} title="Choose color" value={value.slice(0,7)} onChange={event=>onChange(event.target.value)}/>
  </span>
  <input type="text" aria-label={label+' hex'} value={draft} spellCheck={false} maxLength={alpha?9:7}
   onChange={event=>{
    const next=event.target.value;setDraft(next);
    if((alpha?/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/:/^#[0-9a-fA-F]{6}$/).test(next))onChange(next);
   }} onBlur={()=>setDraft(value)}/>
 </div></Field>;
}
