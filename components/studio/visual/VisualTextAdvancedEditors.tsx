'use client';
import type { VisualCreateTextOptions, VisualTextPerspective } from '@/lib/studio/visual/model';
import { TEXT_BLEND_MODES } from '@/lib/studio/visual/text-contract';

const DEFAULT: VisualTextPerspective = {
  points: [{x:0,y:0},{x:320,y:0},{x:320,y:120},{x:0,y:120}],
  interpolation:'bilinear', edgeMode:'transparent',
};
function NumberControl({label,value,onChange,min,max,step=0.5}:{
  label:string;value:number;onChange:(next:number)=>void;min?:number;max?:number;step?:number
}) {
  return <label className="apx-text-v3-field"><span>{label}</span>
    <input className="apx-text-v3-input" type="number" value={value} step={step} min={min} max={max}
      onChange={e=>onChange(Number(e.target.value))}/></label>;
}
function SwitchControl({label,checked,onChange}:{
  label:string;checked:boolean;onChange:(next:boolean)=>void
}){
  return <label className="apx-text-v3-toggle-row"><span><strong>{label}</strong></span>
    <input type="checkbox" aria-label={label} checked={checked} onChange={e=>onChange(e.target.checked)}/></label>;
}
export function TextPerspectiveEditor({label,value,onChange}:{
  label:string;value:VisualTextPerspective|undefined;onChange:(next:VisualTextPerspective|undefined)=>void
}){
  return <div data-text-perspective={label}>
    <SwitchControl label={label} checked={Boolean(value)} onChange={enabled=>onChange(enabled?structuredClone(DEFAULT):undefined)}/>
    {value ? <>
      <p className="apx-text-v3-note">Corner order: top-left, top-right, bottom-right, bottom-left</p>
      <div className="apx-text-v3-grid apx-text-v3-grid--2">
        {value.points.map((point,index)=><div key={index}>
          <strong>{['Top left','Top right','Bottom right','Bottom left'][index]}</strong>
          <NumberControl label="X" value={point.x} onChange={x=>onChange({...value,points:value.points.map((p,i)=>i===index?{...p,x}:p) as VisualTextPerspective['points']})}/>
          <NumberControl label="Y" value={point.y} onChange={y=>onChange({...value,points:value.points.map((p,i)=>i===index?{...p,y}:p) as VisualTextPerspective['points']})}/>
        </div>)}
        <label className="apx-text-v3-field"><span>Interpolation</span>
          <select className="apx-text-v3-select" value={value.interpolation??'bilinear'} onChange={e=>onChange({...value,interpolation:e.target.value as VisualTextPerspective['interpolation']})}>
            {['nearest','bilinear','bicubic'].map(x=><option key={x}>{x}</option>)}
          </select></label>
        <label className="apx-text-v3-field"><span>Edge mode</span>
          <select className="apx-text-v3-select" value={value.edgeMode??'transparent'} onChange={e=>onChange({...value,edgeMode:e.target.value as VisualTextPerspective['edgeMode']})}>
            {['transparent','clamp','wrap','mirror'].map(x=><option key={x}>{x}</option>)}
          </select></label>
      </div>
    </> : null}
  </div>;
}
export function TextCallOptionsEditor({value,onChange}:{
  value:VisualCreateTextOptions|undefined;onChange:(next:VisualCreateTextOptions|undefined)=>void
}){
  const group=value?.groupTransform;
  const changeGroup=(updated:NonNullable<typeof group>)=>onChange({...value,groupTransform:updated});
  return <>
    <SwitchControl label="Isolated grouped rendering (isGrouped)" checked={Boolean(value?.isGrouped||group)} onChange={enabled=>onChange(enabled?{...value,isGrouped:true}:undefined)}/>
    <SwitchControl label="Group transform" checked={Boolean(group)} onChange={enabled=>onChange(enabled?{...value,groupTransform:{}}:{...value,groupTransform:undefined})}/>
    {group ? <>
      <div className="apx-text-v3-grid apx-text-v3-grid--2">
        {([
          ['Translate X','translateX',0],['Translate Y','translateY',0],
          ['Rotation','rotation',0],['Scale X','scaleX',1],['Scale Y','scaleY',1],
          ['Skew X','skewX',0],['Skew Y','skewY',0],
          ['Pivot X','pivotX',0],['Pivot Y','pivotY',0],['Opacity','opacity',1],
        ] as const).map(([label,key,base])=><NumberControl key={key} label={label} value={group[key]??base}
          min={key==='opacity'?0:key.startsWith('skew')?-89.99:undefined}
          max={key==='opacity'?1:key.startsWith('skew')?89.99:undefined}
          step={key==='opacity'?0.05:0.5}
          onChange={next=>changeGroup({...group,[key]:next})}/>)}
        <label className="apx-text-v3-field"><span>Blend mode</span>
          <select className="apx-text-v3-select" value={group.blendMode??'source-over'} onChange={e=>changeGroup({...group,blendMode:e.target.value as GlobalCompositeOperation})}>
            {TEXT_BLEND_MODES.map(x=><option key={x}>{x}</option>)}
          </select>
        </label>
      </div>
      <TextPerspectiveEditor label="Group perspective" value={group.perspective}
        onChange={perspective=>changeGroup({...group,perspective})}/>
    </> : null}
  </>;
}
