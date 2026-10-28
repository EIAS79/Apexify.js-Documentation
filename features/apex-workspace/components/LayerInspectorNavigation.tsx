"use client";
import {ArrowLeftIcon,PhotoIcon,Bars3BottomLeftIcon} from '@heroicons/react/24/outline';
import type {WorkspaceLayer} from '../model';
import {TEXT_INSPECTOR_SECTIONS,IMAGE_INSPECTOR_SECTIONS,type LayerInspectorSection} from '../inspector-sections';
import ControlHelp from './ControlHelp';

export default function LayerInspectorNavigation({layer,section,onChange,onCanvas,id}:{
 layer:WorkspaceLayer;section:LayerInspectorSection;onChange:(section:LayerInspectorSection)=>void;onCanvas:()=>void;id:string;
}){
 const text=layer.kind==='text',kind=text?'Text':'Image';
 const sections=text?TEXT_INSPECTOR_SECTIONS:IMAGE_INSPECTOR_SECTIONS;
 const Icon=text?Bars3BottomLeftIcon:PhotoIcon;
 return <div className="aw-property-nav aw-layer-property-nav" aria-label={kind+' properties navigation'}>
  <div className="aw-property-context">
   <Icon aria-hidden="true"/>
   <div><strong>{kind}</strong><span title={layer.name}>{layer.name} · {layer.width} × {layer.height}</span></div>
   <ControlHelp label={kind+' properties'} description={sections.map(([,label,description])=>label+': '+description).join(' ')}/>
  </div>
  <button className="aw-back-to-canvas" type="button" onClick={onCanvas}><ArrowLeftIcon aria-hidden="true"/>Canvas settings</button>
  <nav className="aw-property-tabs" role="tablist" aria-label={kind+' property categories'}>
   {sections.map(([key,label],index)=><button key={key} type="button" role="tab" id={id+'-layer-tab-'+key}
    aria-controls={id+'-layer-category-panel'} aria-selected={section===key} tabIndex={section===key?0:-1}
    onClick={()=>onChange(key)} onKeyDown={event=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
     event.preventDefault();
     const next=event.key==='Home'?0:event.key==='End'?sections.length-1:
      (index+(event.key==='ArrowRight'?1:-1)+sections.length)%sections.length;
     onChange(sections[next][0]);
     event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
    }}>{label}</button>)}
  </nav>
  <label className="aw-canvas-category-select"><span>Section</span>
   <select aria-label={kind+' section'} value={section} onChange={event=>onChange(event.target.value as LayerInspectorSection)}>
    {sections.map(([key,label])=><option key={key} value={key}>{label}</option>)}
   </select>
  </label>
 </div>;
}
