"use client";
import type {CanvasGradient,CanvasPattern,PatternGradient,GradientKind} from "../canvas-options";
import {CanvasBlendModes} from "../canvas-options";
import type {WorkspaceImageAsset} from "../asset-store";
import {Field,NumberField} from "./ui";

const variants:readonly CanvasPattern['type'][]=[
 "grid","dots","diagonal","stripes","waves","crosses","hexagons",
 "checkerboard","diamonds","triangles","stars","polka","custom"
];
export const createGradient=(type:GradientKind):CanvasGradient=>({
 type,colors:[{stop:0,color:"#221160"},{stop:1,color:"#006ca8"}]
});
export const createPattern=():CanvasPattern=>({
 type:"grid",color:"#56dbf9",secondaryColor:"#131b30",
 size:24,spacing:24,opacity:0.4
});
export function PatternControls({pattern,onChange,assets,id}:{
 pattern:CanvasPattern;onChange:(p:CanvasPattern)=>void;
 assets:readonly WorkspaceImageAsset[];id:string;
}){
 const change=(patch:Partial<CanvasPattern>)=>onChange({...pattern,...patch});
 return <fieldset aria-label={id+" pattern properties"} className="aw-canvas-properties">
  <legend>Pattern settings</legend>
  <Field label="Pattern kind"><select aria-label={id+" type"} value={pattern.type}
    onChange={e=>{
      const type=e.target.value as CanvasPattern["type"];
      if(type==="custom"&&!assets.length)return;
      const {customPatternImage:_discard,gradient:_gradient,color:_color,secondaryColor:_secondary,...existing}=pattern;
      onChange(type==="custom"
        ?{...existing,type,customPatternImage:pattern.customPatternImage??assets[0].id}
        :{...existing,type,...(_gradient?{gradient:_gradient}:{
            color:_color??"#56dbf9",secondaryColor:_secondary??"#131b30"})});
    }}>
    {variants.map(type=><option key={type} value={type} disabled={type==="custom"&&!assets.length}>{type}</option>)}
  </select></Field>
  <Field label="Use gradient pattern paint">
    <input type="checkbox" aria-label={id+" use gradient paint"} checked={!!pattern.gradient}
      disabled={pattern.type==="custom"}
      onChange={e=>{
        if(e.target.checked){
          const {color:_c,secondaryColor:_s,...rest}=pattern;
          onChange({...rest,gradient:{type:"linear",colors:[{stop:0,color:"#ff2255"},{stop:1,color:"#1166ff"}]}});
        }else{
          const {gradient:_g,...rest}=pattern;
          onChange({...rest,color:"#56dbf9",secondaryColor:"#131b30"});
        }
      }}/>
  </Field>
  {pattern.gradient?<PatternGradientControls id={id} value={pattern.gradient} onChange={gradient=>change({gradient})}/>:null}
  <div className="aw-field-row">
   <Field label="Primary color"><input aria-label={id+" primary color"} type="color" disabled={!!pattern.gradient} value={(pattern.color??"#56dbf9").slice(0,7)}
     onChange={e=>change({color:e.target.value})}/></Field>
   <Field label="Secondary color"><input aria-label={id+" secondary color"} type="color" disabled={!!pattern.gradient} value={(pattern.secondaryColor??"#131b30").slice(0,7)}
     onChange={e=>change({secondaryColor:e.target.value})}/></Field>
   <NumberField label={id+" size"} value={pattern.size??24} min={1} max={256} onChange={size=>change({size})}/>
   <NumberField label={id+" spacing"} value={pattern.spacing??24} min={1} max={512} onChange={spacing=>change({spacing})}/>
   <NumberField label={id+" opacity"} value={pattern.opacity??1} min={0} max={1} step={0.05} onChange={opacity=>change({opacity})}/>
   <NumberField label={id+" rotation"} value={pattern.rotation??0} min={-360} max={360} step={1} onChange={rotation=>change({rotation})}/>
   <NumberField label={id+" scale"} value={pattern.scale??1} min={0.05} max={12} step={0.05} onChange={scale=>change({scale})}/>
   <NumberField label={id+" offset X"} value={pattern.offsetX??0} min={-4096} max={4096} step={1} onChange={offsetX=>change({offsetX})}/>
   <NumberField label={id+" offset Y"} value={pattern.offsetY??0} min={-4096} max={4096} step={1} onChange={offsetY=>change({offsetY})}/>
  </div>
  <div className="aw-field-row">
   <Field label="Pattern repeat">
    <select aria-label={id==="Root"?"Pattern repeat":id+" repeat"} value={pattern.repeat??"repeat"} onChange={e=>change({repeat:e.target.value as CanvasPattern["repeat"]})}>
     {(["repeat","repeat-x","repeat-y","no-repeat"] as const).map(v=><option key={v} value={v}>{v}</option>)}
    </select>
    {pattern.type!=="custom"?<span className="aw-canvas-note">S20 native procedural repeat: repeat fills the viewport, repeat-x and repeat-y clip the opposite axis to one size-plus-spacing period, and no-repeat clips both axes.</span>:null}
   </Field>
   <Field label="Pattern blend">
    <select aria-label={id+" blend"} value={pattern.blendMode??"source-over"} onChange={e=>change({blendMode:e.target.value as CanvasPattern["blendMode"]})}>
     {CanvasBlendModes.map(v=><option key={v} value={v}>{v}</option>)}
    </select>
   </Field>
   {pattern.type==="custom"?<Field label="Verified source asset">
    <select aria-label={id+" source"} value={pattern.customPatternImage} onChange={e=>change({customPatternImage:e.target.value})}>
     {assets.map(a=><option key={a.id} value={a.id}>{a.mime} / {a.width}x{a.height} / {a.sha256.slice(0,12)}</option>)}
    </select>
   </Field>:null}
  </div>
 </fieldset>;
}
export function GradientControls({gradient,onChange,id,disableRepeat=false}:{
 gradient:CanvasGradient;onChange:(g:CanvasGradient)=>void;id:string;disableRepeat?:boolean;
}){
 const edit=(patch:Partial<CanvasGradient>)=>onChange({...gradient,...patch});
 const number=(key:keyof CanvasGradient,label:string,defaultValue=0,min=-8192,max=8192,step=1)=>
  <NumberField key={String(key)} label={id+" "+label} value={(gradient[key] as number|undefined)??defaultValue}
    min={min} max={max} step={step} onChange={n=>edit({[key]:n})}/>;
 return <fieldset aria-label={id+" gradient properties"} className="aw-canvas-properties">
  <legend>{gradient.type} gradient</legend>
  <Field label="Gradient type"><select aria-label={id+" gradient type"} value={gradient.type}
   onChange={e=>{
     const type=e.target.value as GradientKind;
     if(type===gradient.type)return;
     const {type:_old,repeat:_repeat,startAngle:_angle,centerX:_centerX,centerY:_centerY,
       startX:_startX,startY:_startY,endX:_endX,endY:_endY,startRadius:_startRadius,endRadius:_endRadius,...shared}=gradient;
     onChange(type==='conic'?{...shared,type,centerX:gradient.centerX??gradient.pivotX??0,centerY:gradient.centerY??gradient.pivotY??0}:
       type==='radial'?{...shared,type,
         startX:_startX??0,startY:_startY??0,endX:_endX??120,endY:_endY??40,
         startRadius:_startRadius??0,endRadius:_endRadius??180,
         ...(_repeat?{repeat:_repeat}:{})}:
       {...shared,type,startX:_startX??0,startY:_startY??0,endX:_endX??120,endY:_endY??40,
         ...(_repeat?{repeat:_repeat}:{})});
   }}>
   {(["linear","radial","conic"] as const).map(v=><option key={v} value={v}>{v}</option>)}
  </select></Field>
  <div aria-label={id+" stops"}>
   {gradient.colors.map((stop,i)=><div className="aw-field-row" key={i}>
    <NumberField label={id+" stop "+(i+1)} value={stop.stop} min={0} max={1} step={0.01}
     onChange={value=>{
       const colors=gradient.colors.map((v,j)=>j===i?{...v,stop:value}:v).sort((a,b)=>a.stop-b.stop);
       edit({colors});
     }}/>
    <Field label="Color"><input aria-label={id+" stop color "+(i+1)} type="color" value={stop.color.slice(0,7)}
     onChange={e=>edit({colors:gradient.colors.map((v,j)=>i===j?{...v,color:e.target.value}:v)})}/></Field>
    <Field label="Hex / alpha">
      <input type="text" spellCheck={false} maxLength={9}
       aria-label={id+" stop hex "+(i+1)} key={i+":"+stop.color} defaultValue={stop.color}
       onBlur={e=>{
         const next=e.target.value.trim();
         if(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(next))
           edit({colors:gradient.colors.map((x,j)=>j===i?{...x,color:next}:x)});
         else e.target.value=stop.color;
       }}/>
    </Field>
    <button type="button" className="aw-text-button" aria-label={id+" move stop "+(i+1)+" earlier"} disabled={i===0}
      onClick={()=>{const colors=gradient.colors.map(c=>({...c}));
        [colors[i-1].color,colors[i].color]=[colors[i].color,colors[i-1].color];edit({colors});}}>←</button>
    <button type="button" className="aw-text-button" aria-label={id+" move stop "+(i+1)+" later"} disabled={i===gradient.colors.length-1}
      onClick={()=>{const colors=gradient.colors.map(c=>({...c}));
        [colors[i+1].color,colors[i].color]=[colors[i].color,colors[i+1].color];edit({colors});}}>→</button>
    <button type="button" className="aw-text-button" disabled={gradient.colors.length<=2}
     onClick={()=>edit({colors:gradient.colors.filter((_,j)=>i!==j)})}>Remove stop</button>
   </div>)}
   <button type="button" className="aw-button" disabled={gradient.colors.length>=12}
    onClick={()=>{
      const ordered=[...gradient.colors].sort((a,b)=>a.stop-b.stop);
      let span=-1,at=0.5;
      for(let i=1;i<ordered.length;i++)if(ordered[i].stop-ordered[i-1].stop>span){
        span=ordered[i].stop-ordered[i-1].stop;
        at=(ordered[i].stop+ordered[i-1].stop)/2;
      }
      edit({colors:[...ordered,{stop:at,color:"#ffffff"}].sort((a,b)=>a.stop-b.stop)});
    }}>Add gradient stop</button>
  </div>
  <div className="aw-field-row">
   {gradient.type==="conic"?<>
    {number("centerX","center X")}{number("centerY","center Y")}
    {number("startAngle","start angle",0,-360,360)}
    <p className="aw-canvas-note">S22 native conic start angle is in degrees, clockwise from the native zero-angle orientation.</p>
   </>:<>
    {number("startX","start X")}{number("startY","start Y")}
    {number("endX","end X",500)}{number("endY","end Y")}
    {gradient.type==="radial"?<>{number("startRadius","start radius",0,0,4096)}
      {number("endRadius","end radius",200,0,4096)}</>:null}
   </>}
   {number("rotate","rotation",0,-360,360)}
   {number("pivotX","pivot X")}{number("pivotY","pivot Y")}
   {gradient.type!=="conic"?<Field label="Gradient repeat">
    <select aria-label={id+" gradient repeat"} disabled={disableRepeat}
     title={disableRepeat?"Repeat editing is disabled by the caller":undefined}
     value={gradient.repeat??"no-repeat"}
     onChange={e=>edit({repeat:e.target.value as CanvasGradient["repeat"]})}>
     {(["no-repeat","repeat","reflect"] as const).map(v=><option key={v} value={v}>{v}</option>)}
    </select>
    {disableRepeat?<span className="aw-canvas-note">Repeat editing is disabled by this editor.</span>:
      gradient.repeat==="reflect"?<span className="aw-canvas-note">Reflect mirrors the native gradient period; choose short gradient geometry to make the effect visible.</span>:null}
   </Field>:null}
  </div>
 </fieldset>;
}

export function PatternGradientControls({id,value,onChange}:{id:string;value:PatternGradient;onChange:(value:PatternGradient)=>void}){
  const edit=(patch:Partial<PatternGradient>)=>onChange({...value,...patch});
  const point=(field:keyof PatternGradient,label:string,min=-8192,max=8192,step=1)=>
    <NumberField label={id+" paint "+label} value={(value[field] as number|undefined)??0}
      min={min} max={max} step={step} onChange={n=>edit({[field]:n})}/>;
  return <fieldset aria-label={id+" pattern gradient paint"} className="aw-canvas-properties">
    <legend>Gradient pattern paint (distinct GradientConfig)</legend>
    <Field label="Paint gradient type">
      <select aria-label={id+" paint gradient type"} value={value.type}
        onChange={e=>{
          const type=e.target.value as GradientKind;
          if(type===value.type)return;
          const common={colors:value.colors};
          const position={startX:value.startX??0,startY:value.startY??0,endX:value.endX??120,endY:value.endY??40};
          const repeat=value.repeat?{repeat:value.repeat}:{};
          onChange(type==='linear'?{type,...common,...position,...repeat}:
            type==='radial'?{type,...common,...position,startRadius:value.startRadius??0,
              endRadius:value.endRadius??140,...repeat}:
            {type,...common,centerX:value.centerX??80,centerY:value.centerY??70});
        }}>
        {(["linear","radial","conic"] as const).map(v=><option key={v} value={v}>{v}</option>)}
      </select>
    </Field>
    {value.colors.map((stop,i)=><div className="aw-field-row" key={i}>
      <NumberField label={id+" paint stop "+(i+1)} value={stop.stop} min={0} max={1} step={0.01}
        onChange={at=>edit({colors:value.colors.map((x,j)=>i===j?{...x,stop:at}:x).sort((a,b)=>a.stop-b.stop)})}/>
      <Field label="Gradient stop color"><input aria-label={id+" paint stop color "+(i+1)}
        type="color" value={stop.color.slice(0,7)}
        onChange={e=>edit({colors:value.colors.map((x,j)=>i===j?{...x,color:e.target.value}:x)})}/></Field>
      <Field label="Hex / alpha">
        <input type="text" maxLength={9} spellCheck={false} key={i+":"+stop.color}
          aria-label={id+" paint stop hex "+(i+1)} defaultValue={stop.color}
          onBlur={e=>{
            const next=e.target.value.trim();
            if(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(next))
              edit({colors:value.colors.map((x,j)=>i===j?{...x,color:next}:x)});
            else e.target.value=stop.color;
          }}/>
      </Field>
      <button type="button" className="aw-text-button" aria-label={id+" paint move stop "+(i+1)+" earlier"}
        disabled={i===0} onClick={()=>{
          const colors=value.colors.map(x=>({...x}));
          [colors[i-1].color,colors[i].color]=[colors[i].color,colors[i-1].color];
          edit({colors});
        }}>Earlier</button>
      <button type="button" className="aw-text-button" aria-label={id+" paint move stop "+(i+1)+" later"}
        disabled={i===value.colors.length-1} onClick={()=>{
          const colors=value.colors.map(x=>({...x}));
          [colors[i+1].color,colors[i].color]=[colors[i].color,colors[i+1].color];
          edit({colors});
        }}>Later</button>
      <button type="button" className="aw-text-button" disabled={value.colors.length<=2}
        onClick={()=>edit({colors:value.colors.filter((_,j)=>j!==i)})}>Remove paint stop</button>
    </div>)}
    <button type="button" className="aw-button" disabled={value.colors.length>=12}
      onClick={()=>{
        const ordered=[...value.colors].sort((a,b)=>a.stop-b.stop);
        let widest=-1,at=0.5;
        for(let i=1;i<ordered.length;i++)if(ordered[i].stop-ordered[i-1].stop>widest){
          widest=ordered[i].stop-ordered[i-1].stop;
          at=(ordered[i].stop+ordered[i-1].stop)/2;
        }
        edit({colors:[...ordered,{stop:at,color:"#ffffff"}].sort((a,b)=>a.stop-b.stop)});
      }}>
      Add paint stop
    </button>
    <div className="aw-field-row">
      {value.type==="conic"?<>
        {point("centerX","center X")}{point("centerY","center Y")}
        {point("startAngle","start angle",-360,360)}
        {point("angle","angle",-360,360)}
        <p className="aw-canvas-note">Conic angle adds to start angle in native S22 rendering.</p>
      </>:value.type==="radial"?<>
        {point("startX","start X")}{point("startY","start Y")}
        {point("endX","end X")}{point("endY","end Y")}
        {point("startRadius","start radius",0,4096)}{point("endRadius","end radius",0,4096)}
        {point("angle","angle",-360,360)}
      </>:<>
        {point("startX","start X")}{point("startY","start Y")}
        {point("endX","end X")}{point("endY","end Y")}
        {point("angle","angle",-360,360)}
        <p className="aw-canvas-note">S22 native pattern gradient angle rotates linear/radial gradient geometry.</p>
      </>}
      {value.type!=="conic"?<Field label="Paint repeat">
        <select aria-label={id+" paint gradient repeat"} value={value.repeat??"no-repeat"}
          onChange={e=>edit({repeat:e.target.value as PatternGradient["repeat"]})}>
          {(["no-repeat","repeat","reflect"] as const).map(x=><option key={x} value={x}>{x}</option>)}
        </select>
        <span className="aw-canvas-note">Reflect is not reliable in every pinned gradient geometry.</span>
      </Field>:null}
    </div>
  </fieldset>;
}
