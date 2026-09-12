'use client';
import { useCallback,useEffect,useRef,useState,type ReactNode } from 'react';
const MIN=.22,MAX=.78;
export function InteractiveWorkspace({ratio=.5,onRatioChange,enabled=true,editor,preview,diagnostics,options}:{ratio?:number;onRatioChange?:(n:number)=>void;enabled?:boolean;editor:ReactNode;preview:ReactNode;diagnostics?:ReactNode;options?:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);const [drag,setDrag]=useState(false);const setRatio=onRatioChange??(()=>{});
 const setX=useCallback((x:number)=>{const r=ref.current?.getBoundingClientRect();if(!r||r.width<=0)return;setRatio(Math.min(MAX,Math.max(MIN,(x-r.left)/r.width)));},[setRatio]);
 useEffect(()=>{if(!drag)return;const m=(e:PointerEvent)=>{e.preventDefault();setX(e.clientX)};const u=()=>setDrag(false);window.addEventListener('pointermove',m);window.addEventListener('pointerup',u);return()=>{window.removeEventListener('pointermove',m);window.removeEventListener('pointerup',u)}},[drag,setX]);
 const key=(e:React.KeyboardEvent)=>{const step=e.shiftKey?.08:.02;if(e.key==='ArrowLeft'){e.preventDefault();setRatio(Math.max(MIN,ratio-step))}if(e.key==='ArrowRight'){e.preventDefault();setRatio(Math.min(MAX,ratio+step))}if(e.key==='Home')setRatio(MIN);if(e.key==='End')setRatio(MAX);if(e.key==='0')setRatio(.5)};
 return <div data-doc8-primitive="workspace" className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
  <div ref={ref} className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
   <div className="flex min-h-[220px] min-w-0 flex-col overflow-hidden md:min-h-0" style={{flexBasis:enabled?`${ratio*100}%`:'50%',flexGrow:enabled?0:1,flexShrink:1}}>{editor}</div>
   {enabled?<div role="separator" aria-orientation="vertical" aria-valuemin={22} aria-valuemax={78} aria-valuenow={Math.round(ratio*100)} aria-label="Resize editor and preview" tabIndex={0} onPointerDown={e=>{e.preventDefault();setDrag(true);setX(e.clientX)}} onKeyDown={key} className="hidden shrink-0 md:flex md:w-2 md:cursor-col-resize md:items-center md:justify-center" style={{background:'var(--border-subtle)'}}><span aria-hidden className="h-10 w-[3px] rounded-full" style={{background:'var(--border-strong)'}}/></div>:null}
   <div className="flex min-h-[220px] min-w-0 flex-col overflow-hidden md:min-h-0" style={{flexBasis:enabled?`${(1-ratio)*100}%`:'50%',flexGrow:enabled?0:1,flexShrink:1}}>{preview}</div>
  </div>
  {(diagnostics||options)?<div className="grid shrink-0 gap-3 md:grid-cols-2">{diagnostics}{options}</div>:null}
 </div>
}
