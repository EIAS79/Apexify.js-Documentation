"use client";
import { useEffect, useRef, useState } from "react";
import type { WorkspaceDocument } from "../model";
import { defaultMedia, animationFrame, AUDIO_PRESETS, type MediaSettings } from "../media-model";
import { requestWorkspaceRender } from "../client-render";
import { Field, NumberField } from "./ui";
export function Waveform({url}:{url:string}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const controller=new AbortController();let context:AudioContext|undefined;void(async()=>{try{const bytes=await (await fetch(url,{signal:controller.signal})).arrayBuffer();context=new AudioContext();const audio=await context.decodeAudioData(bytes);if(controller.signal.aborted)return;const canvas=ref.current,ctx=canvas?.getContext("2d");if(!canvas||!ctx)return;const data=audio.getChannelData(0);ctx.clearRect(0,0,600,100);ctx.strokeStyle="#00d5ff";ctx.beginPath();for(let x=0;x<600;x++){const begin=Math.floor(x*data.length/600),end=Math.max(begin+1,Math.floor((x+1)*data.length/600));let lo=0,hi=0;for(let i=begin;i<end;i++){lo=Math.min(lo,data[i]);hi=Math.max(hi,data[i]);}ctx.moveTo(x,50+lo*45);ctx.lineTo(x,50+hi*45);}ctx.stroke();}catch{ /* Native audio controls remain usable if browser decoding is unavailable. */ }finally{await context?.close();}})();return()=>controller.abort();},[url]);
  return <canvas ref={ref} width={600} height={100} className="aw-waveform" aria-label="Waveform decoded from rendered WAV"/>;
}
export default function MediaEditor({kind,document,onSettings,onRender,onError}:{kind:"gif"|"audio"|"video";document:WorkspaceDocument;onSettings:(s:MediaSettings)=>void;onRender:()=>void;onError:(message:string)=>void}){
  const s=document.media??defaultMedia(document),[position,setPosition]=useState(0),[preview,setPreview]=useState<string|null>(null),[playing,setPlaying]=useState(false);
  const patch=(p:Partial<MediaSettings>)=>onSettings({...s,...p});
  useEffect(()=>{if(kind==="audio")return;const controller=new AbortController();let url:string|undefined;const timer=setTimeout(()=>{void requestWorkspaceRender(animationFrame(document,s,position,640),controller.signal).then(blob=>{if(!controller.signal.aborted){url=URL.createObjectURL(blob);setPreview(url);}}).catch(e=>{if(!controller.signal.aborted)onError(e.message);});},160);return()=>{clearTimeout(timer);controller.abort();if(url)URL.revokeObjectURL(url);};},[document,kind,position,onError]);
  useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setPosition(t=>{const next=t+1/(s.frames-1);if(next>=1){setPlaying(false);return 1;}return next;}),s.duration*1000/s.frames);return()=>clearInterval(timer);},[playing,s.duration,s.frames]);
  return <div className="aw-media-editor"><span className="aw-eyebrow">APEXIFY {kind.toUpperCase()}</span><h2>{kind==="audio"?"Sound & sequence":kind==="gif"?"GIF timeline":"Video pipeline"}</h2>
    {kind==="audio"?<>
      <Field label="Sound preset"><select value={s.preset} onChange={e=>patch({preset:e.target.value})}>{AUDIO_PRESETS.map(v=><option key={v}>{v}</option>)}</select></Field>
      {s.preset==="custom"&&<><Field label="Waveform"><select value={s.waveform} onChange={e=>patch({waveform:e.target.value as MediaSettings["waveform"]})}>{["sine","triangle","square","sawtooth","noise","pink"].map(v=><option key={v}>{v}</option>)}</select></Field><NumberField label="Frequency (Hz)" min={20} max={12000} value={s.frequency} onChange={frequency=>patch({frequency})}/><NumberField label="Sound duration (s)" min={0.05} max={8} step={0.05} value={s.audioDuration} onChange={audioDuration=>patch({audioDuration})}/></>}
      <NumberField label="Gain" min={0} max={1} step={0.05} value={s.gain} onChange={gain=>patch({gain})}/>
      <h3>Sequence events</h3><p className="aw-muted">Events replace the single sound. Times are in seconds.</p>
      {s.events.map((event,i)=><div className="aw-event-row" key={i}><NumberField label={`Event ${i+1} time`} min={0} max={8} step={0.1} value={event.at} onChange={at=>patch({events:s.events.map((e,j)=>i===j?{...e,at}:e)})}/><Field label={`Event ${i+1} preset`}><select value={event.preset} onChange={e=>patch({events:s.events.map((v,j)=>i===j?{...v,preset:e.target.value}:v)})}>{AUDIO_PRESETS.slice(1).map(v=><option key={v}>{v}</option>)}</select></Field><NumberField label={`Event ${i+1} gain`} min={0} max={1} step={0.05} value={event.gain} onChange={gain=>patch({events:s.events.map((e,j)=>i===j?{...e,gain}:e)})}/><button className="aw-text-button" onClick={()=>patch({events:s.events.filter((_,j)=>j!==i)})}>Remove</button></div>)}
      <button className="aw-button" disabled={s.events.length>=16} onClick={()=>patch({events:[...s.events,{at:s.events.length*0.25,preset:"coin",gain:0.5}]})}>Add sound event</button><p className="aw-muted">Render to inspect the actual waveform and play or download the WAV in Preview.</p>
    </>:<>
      <Field label="Animated layer"><select value={s.layerId} onChange={e=>patch({layerId:e.target.value})}><option value="">Static composition</option>{document.layers.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
      <div className="aw-field-row"><NumberField label="Duration (s)" value={s.duration} min={0.25} max={8} step={0.25} onChange={duration=>patch({duration,fps:s.frames/duration})}/><NumberField label="Frames" value={s.frames} min={2} max={32} onChange={frames=>patch({frames:Math.round(frames),fps:Math.round(frames)/s.duration})}/></div>
      <div className="aw-field-row"><NumberField label="End X" value={s.endX} onChange={endX=>patch({endX})}/><NumberField label="End Y" value={s.endY} onChange={endY=>patch({endY})}/></div>
      <div className="aw-field-row"><NumberField label="End rotation" min={-360} max={360} value={s.endRotation} onChange={endRotation=>patch({endRotation})}/><NumberField label="End opacity" min={0} max={1} step={0.05} value={s.endOpacity} onChange={endOpacity=>patch({endOpacity})}/></div>
      {preview&&<img className="aw-timeline-preview" src={preview} alt={`Animation frame ${Math.round(position*(s.frames-1))+1}`}/>}
      <Field label={`Timeline ${(position*s.duration).toFixed(2)} s`}><input aria-label="Animation timeline" type="range" min={0} max={1} step={1/(s.frames-1)} value={position} onChange={e=>{setPlaying(false);setPosition(Number(e.target.value));}}/></Field>
      <button className="aw-button" onClick={()=>{if(position>=1)setPosition(0);setPlaying(!playing);}}>{playing?"Pause":"Play timeline"}</button>
      {kind==="gif"?<Field label="Loop animation"><input type="checkbox" checked={s.loop} onChange={e=>patch({loop:e.target.checked})}/></Field>:<Field label="Video container"><select value={s.format} onChange={e=>patch({format:e.target.value as "mp4"|"webm"})}><option value="mp4">MP4 / H.264</option><option value="webm">WebM / VP9</option></select></Field>}
      <p className="aw-muted">Linear keyframes · {(s.frames/s.duration).toFixed(2)} fps · up to 640 px. Preview and export use the same frame sampler.</p>
    </>}
    <button className="aw-button aw-primary" onClick={onRender}>Queue {kind==="audio"?"WAV":kind==="gif"?"GIF":s.format.toUpperCase()} render</button>
  </div>;
}
