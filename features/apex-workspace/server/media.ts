import "server-only";
import { ApexPainter, type SynthPresetName } from "apexify.js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateDocument } from "../model";
import { validateMedia, animationFrame } from "../media-model";
import { renderWorkspaceDocument } from "./render";
import { ensureFFmpeg } from "./ffmpeg";
export async function renderWorkspaceMedia(input:unknown,settings:unknown,kind:string,signal?:AbortSignal):Promise<{buffer:Buffer;mime:string;extension:string}> {
  const doc=validateDocument(input),s=validateMedia(settings,doc),painter=new ApexPainter({type:"buffer"});
  signal?.throwIfAborted();
  if(kind==="audio") {
    const buffer = s.events.length ? await painter.createAudio.sequence({events:s.events.map(e=>({...e,preset:e.preset as SynthPresetName})),sampleRate:22050,channels:1,tail:0.1,seed:79})
      : s.preset!=="custom" ? await painter.createAudio.preset(s.preset as SynthPresetName,{volume:s.gain,sampleRate:22050,seed:79})
      : await painter.createAudio.synth({duration:s.audioDuration,sampleRate:22050,channels:1,seed:79,layers:[{waveform:s.waveform,frequency:s.frequency,duration:s.audioDuration,gain:s.gain,adsr:{attack:0.01,decay:0.05,sustain:0.7,release:0.15}}]});
    return {buffer,mime:"audio/wav",extension:"wav"};
  }
  if(kind!=="gif"&&kind!=="video")throw new Error("Unknown media job.");
  const renderFrame=(i:number)=>renderWorkspaceDocument(animationFrame(doc,s,i/(s.frames-1),640),signal);
  const first=animationFrame(doc,s,0,640);
  if(kind==="gif") {
    const result=await painter.createGIF(undefined,{outputFormat:"buffer",width:first.width,height:first.height,repeat:s.loop?0:-1,quality:10,delay:Math.round(s.duration*1000/s.frames),frameCount:s.frames,signal,onStart:async()=>({async *[Symbol.asyncIterator](){for(let i=0;i<s.frames;i++){signal?.throwIfAborted();yield {buffer:await renderFrame(i),duration:Math.round(s.duration*1000/s.frames)};}}})});
    if(!result.buffer)throw new Error("GIF encoder returned no output.");
    return {buffer:result.buffer,mime:"image/gif",extension:"gif"};
  }
  await ensureFFmpeg();
  const dir=await mkdtemp(join(tmpdir(),"apex-workspace-video-"));
  try {
    const frames:Buffer[]=[];for(let i=0;i<s.frames;i++){signal?.throwIfAborted();frames.push(await renderFrame(i));}
    const path=join(dir,`output.${s.format}`);
    await painter.createVideo({source:frames[0],signal,timeoutMs:20000,createFromFrames:{frames,outputPath:path,fps:s.frames/s.duration,format:s.format,quality:"medium",resolution:{width:Math.ceil(first.width/2)*2,height:Math.ceil(first.height/2)*2,fit:"contain"}}});
    signal?.throwIfAborted();return {buffer:await readFile(path),mime:`video/${s.format}`,extension:s.format};
  } finally {await rm(dir,{recursive:true,force:true});}
}
