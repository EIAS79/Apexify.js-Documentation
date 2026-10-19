import { validateDocument, type WorkspaceDocument } from "./model";
export interface MediaSettings {
  layerId: string; duration: number; frames: number; loop: boolean;
  endX: number; endY: number; endRotation: number; endOpacity: number;
  waveform: "sine"|"square"|"triangle"|"sawtooth"|"noise"|"pink";
  frequency: number; gain: number; preset: string; audioDuration: number;
  events: {at:number;preset:string;gain:number}[];
  fps: number; format: "mp4"|"webm";
}
export const AUDIO_PRESETS=["custom","beep","laser","coin","success","whoosh","alarm","explosion","click","powerup","sparkle"];
export function defaultMedia(d:WorkspaceDocument):MediaSettings {
  const layer=d.layers[0];return {layerId:layer?.id??"",duration:2,frames:16,loop:true,endX:(layer?.x??0)+180,endY:layer?.y??0,endRotation:layer?.rotation??0,endOpacity:1,waveform:"sine",frequency:440,gain:0.35,preset:"custom",audioDuration:1,events:[],fps:8,format:"mp4"};
}
export function validateMedia(value:unknown,d:WorkspaceDocument):MediaSettings {
  const s=value as MediaSettings;if(!s||typeof s!=="object")throw new Error("Media settings required.");
  const n=(v:unknown,min:number,max:number,label:string)=>{if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max)throw new Error(`${label} must be ${min}–${max}.`);return v;};
  if(typeof s.layerId!=="string" || (s.layerId && !d.layers.some(l=>l.id===s.layerId)))throw new Error("Animation layer is missing.");
  if(!["sine","square","triangle","sawtooth","noise","pink"].includes(s.waveform)||!AUDIO_PRESETS.includes(s.preset)||!["mp4","webm"].includes(s.format)||typeof s.loop!=="boolean")throw new Error("Unsupported media setting.");
  if(!Array.isArray(s.events)||s.events.length>16)throw new Error("Audio supports at most 16 events.");
  const frames=n(s.frames,2,32,"Frame count");if(!Number.isInteger(frames))throw new Error("Frame count must be an integer.");
  return {layerId:s.layerId,duration:n(s.duration,0.25,8,"Duration"),frames,loop:s.loop,endX:n(s.endX,-4096,4096,"End X"),endY:n(s.endY,-4096,4096,"End Y"),endRotation:n(s.endRotation,-360,360,"End rotation"),endOpacity:n(s.endOpacity,0,1,"End opacity"),waveform:s.waveform,frequency:n(s.frequency,20,12000,"Frequency"),gain:n(s.gain,0,1,"Gain"),preset:s.preset,audioDuration:n(s.audioDuration,0.05,8,"Audio duration"),events:s.events.map(e=>{if(!e||!AUDIO_PRESETS.slice(1).includes(e.preset))throw new Error("Invalid audio event.");return {at:n(e.at,0,8,"Event time"),preset:e.preset,gain:n(e.gain,0,1,"Event gain")};}),fps:n(s.fps,1,30,"FPS"),format:s.format};
}
export function animationFrame(d:WorkspaceDocument,s:MediaSettings,t:number,scaleTo=0):WorkspaceDocument {
  t=Math.max(0,Math.min(1,t));const scale=scaleTo?Math.min(1,scaleTo/Math.max(d.width,d.height)):1;
  return validateDocument({...d,width:Math.max(64,Math.round(d.width*scale)),height:Math.max(64,Math.round(d.height*scale)),layers:d.layers.map(layer=>{
    let l={...layer};if(l.id===s.layerId)l={...l,x:l.x+(s.endX-l.x)*t,y:l.y+(s.endY-l.y)*t,rotation:l.rotation+(s.endRotation-l.rotation)*t,opacity:l.opacity+(s.endOpacity-l.opacity)*t};
    return {...l,x:l.x*scale,y:l.y*scale,width:Math.max(1,l.width*scale),height:Math.max(1,l.height*scale),...(l.kind==="text"?{fontSize:Math.max(4,l.fontSize*scale)}:{}),...(l.kind==="shape"?{radius:l.radius*scale,strokeWidth:l.strokeWidth*scale}:{}),...(l.kind==="path"?{strokeWidth:l.strokeWidth*scale}:{})};
  })});
}
