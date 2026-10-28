"use client";
import {BORDER_EDGES,BORDER_CORNERS,selectedBorderParts,toggleBorderPart,type BorderSelection} from '../border-selection';
import ControlHelp from './ControlHelp';

export default function BorderMultiSelect({label,ariaLabel,value,fallbackValue='all',kind,onChange,onInherit,disabled=false}: {
  label:string;ariaLabel:string;value?:string;fallbackValue?:string;kind:'edges'|'corners';
  onChange:(value:BorderSelection)=>void;onInherit?:()=>void;disabled?:boolean;
}) {
  const choices=kind==='edges'?BORDER_EDGES:BORDER_CORNERS;
  const effective=value??fallbackValue;
  const selected=selectedBorderParts(effective,kind);
  const inherited=!!onInherit&&value===undefined;
  return <fieldset className="aw-border-selection" aria-label={ariaLabel} disabled={disabled}>
    <legend><span>{label}</span><ControlHelp label={ariaLabel}
      description={kind==='edges'
        ?'Select any combination of edges, for example Bottom + Left or Top + Left + Right. Keep at least one edge selected; disable the stroke to remove it entirely.'
        :'Select any combination of corners to round. Side names from older projects expand to their adjacent corners. Rounding is visible with a positive numeric radius; circular mode rounds the entire shape.'}/></legend>
    <div className="aw-border-selection-actions">
      <span>{inherited?'Inherited selection':`${selected.length} ${kind==='edges'?'edges':'corners'} selected`}</span>
      <button type="button" onClick={()=>onChange('all')} disabled={disabled}>All</button>
      {onInherit&&<button type="button" aria-pressed={inherited} disabled={disabled} onClick={onInherit}>Inherit</button>}
    </div>
    <div className="aw-border-choice-grid">
      {choices.map(token=><label key={token} className={selected.includes(token)?'is-selected':''}>
        <input type="checkbox" aria-label={ariaLabel+' '+token} checked={selected.includes(token)}
          disabled={disabled||(selected.length===1&&selected.includes(token))}
          onChange={()=>onChange(toggleBorderPart(effective,token,kind))}/>
        <span>{token.split('-').map(part=>part[0].toUpperCase()+part.slice(1)).join(' ')}</span>
      </label>)}
    </div>
  </fieldset>;
}
