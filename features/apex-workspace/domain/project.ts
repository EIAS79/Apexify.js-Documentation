/** Version-2 authoring contract. Stored semantic data only: never persist DOM, jobs or view state. */
import { validateDocument, type WorkspaceDocument, type WorkspaceLayer } from '../model';
import {validateCanvasExtras,type CanvasExtras} from '../canvas-options';
import { compareTime, parseTimeJSON, range, time, timebase, type FrameRate, type TimePoint, type TimeRange, type Timebase } from './time';

export const PROJECT_SCHEMA_VERSION=2 as const;
export const RECORD_SUPPORT = Object.freeze({
  legacyLayers:'IMPLEMENTED_COMPAT',vectorPath:'VALIDATED_MODEL_NO_RENDERER',frameCollections:'VALIDATED_AND_COMMANDABLE_NO_TIMELINE_UI',
  visualClips:'VALIDATED_AND_COMMANDABLE_NO_EXPORT',audioClips:'UNSUPPORTED',videoClips:'UNSUPPORTED',
  graph:'UNSUPPORTED',customCode:'NON_EXECUTABLE',gifExport:'UNSUPPORTED',animationRenderer:'UNSUPPORTED',
});
export interface PathCommandMove {op:'M'|'L';x:number;y:number}
export interface PathCommandBezier {op:'Q';cx:number;cy:number;x:number;y:number}
export interface PathCommandCubic {op:'C';c1x:number;c1y:number;c2x:number;c2y:number;x:number;y:number}
export interface PathCommandClose {op:'Z'}
export type PathCommand=PathCommandMove|PathCommandBezier|PathCommandCubic|PathCommandClose;
export interface VectorStroke {id:string;stroke:string;width:number;commands:PathCommand[]}
export type ProjectLayer = {id:string;kind:'legacy';data:WorkspaceLayer;styleId?:string}|
  {id:string;kind:'vector';name:string;visible:boolean;strokes:VectorStroke[];styleId?:string};
export interface ReusableStyle {id:string;fill:string;stroke:string;opacity:number}
export interface FrameLayerOverride {styleId?:string;visible?:boolean;data?:ProjectLayer}
export interface Frame {id:string;kind:'independent'|'linked';exposure:TimePoint;layerIds:string[];
  sourceFrameId?:string;content?:ProjectLayer[];overrides:Record<string,FrameLayerOverride>}
export interface FrameCollection {id:string;name:string;frames:Frame[]}
export interface Scene {id:string;name:string;layerIds:string[]}
export interface ProjectAsset {id:string;kind:'image'|'audio'|'video';uri:string;sourceTimebase?:Timebase;metadata:Record<string,string>}
export interface Clip {id:string;kind:'frame-collection';trackId:string;collectionId:string;range:TimeRange;sourceOffset:TimePoint}
export interface Track {id:string;kind:'visual';name:string;clipIds:string[]}
export interface Keyframe {id:string;layerId:string;property:'opacity'|'x'|'y';at:TimePoint;value:number;interpolation:'hold'|'linear'}
export interface CanonicalProject {
  schemaVersion:2;id:string;revision:number;name:string;
  canvas:{width:number;height:number;background:WorkspaceDocument['background'];extras?:CanvasExtras};
  sequence:{timebase:Timebase;fps?:FrameRate};
  scenes:Scene[];layers:ProjectLayer[];assets:ProjectAsset[];styles:ReusableStyle[];
  frameCollections:FrameCollection[];tracks:Track[];clips:Clip[];keyframes:Keyframe[];
  exportSettings:{format:'png';width:number;height:number};
  /** Compatibility snapshot; absent for brand-new v2 projects. Never execute its contents. */
  legacyDocument?:WorkspaceDocument;
  migration?:{from:1;precision:'legacy-static-no-times';note:string};
}
export interface ProjectViewState {selectedIds:string[];playhead:TimePoint;zoom:number;openPanels:string[]}
export type EditScope='frame-local'|'linked-source'|'instance-override'|'clip-range';
function err(message:string):never{throw new Error(`project-v2: ${message}`)}
function object(value:unknown,label:string):Record<string,unknown>{
  if(value===null||typeof value!=='object'||Array.isArray(value))err(`${label} must be object`);
  const o=value as Record<string,unknown>;
  if(Object.keys(o).some(k=>['__proto__','prototype','constructor'].includes(k)))err(`${label} contains unsafe key`);
  return o;
}
function string(v:unknown,label:string,max=128):string{
  if(typeof v!=='string'||v.length===0||v.length>max)err(`invalid ${label}`);return v;
}
function id(v:unknown):string {const s=string(v,'ID');if(!/^[\w:.-]+$/.test(s))err('invalid ID characters');return s;}
function numeric(v:unknown,label:string,min:number,max:number):number {
  if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)err(`invalid ${label}`);return v;
}
function array(v:unknown,label:string,max:number):unknown[]{if(!Array.isArray(v)||v.length>max)err(`invalid ${label} collection size`);return v;}
function ids(v:unknown,label:string,max:number):string[]{const a=array(v,label,max).map(id);if(new Set(a).size!==a.length)err(`duplicate ${label}`);return a;}
function validateUnique<T extends {id:string}>(items:T[],label:string):void{if(new Set(items.map(v=>v.id)).size!==items.length)err(`duplicate ${label} IDs`);}
function hex(v:unknown):string {const s=string(v,'hex color',9);if(!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(s))err('invalid hex color');return s;}
function strictKeys(o:Record<string,unknown>,label:string,keys:readonly string[]):void {
  const unknown=Object.keys(o).filter(key=>!keys.includes(key));
  if(unknown.length)err(label+' contains unsupported fields: '+unknown.join(', '));
}
function overrides(v:unknown):Frame['overrides']{
  const o=object(v,'overrides'),output:Frame['overrides']={};
  if(Object.keys(o).length>256)err('too many overrides');
  for(const [key,value] of Object.entries(o)){
    id(key);const item=object(value,'override');
    strictKeys(item,'override',['styleId','visible','data']);
    output[key]={...(item.styleId!==undefined?{styleId:id(item.styleId)}:{}),
      ...(item.visible!==undefined?{visible:item.visible===true?true:item.visible===false?false:err('invalid visible')}:{} ),...(item.data!==undefined?{data:layer(item.data)}:{})};
  }return output;
}
function layer(v:unknown):ProjectLayer {
  const l=object(v,'layer'),lid=id(l.id),style=l.styleId!==undefined?id(l.styleId):undefined;
  if(l.kind==='legacy'){
    const data=object(l.data,'legacy layer');
    // Run the complete existing v1 validator on a temporary one-layer composition during project validation.
    if(data.id!==lid)err('legacy layer ID differs from stored identity');
    return {id:lid,kind:'legacy',data:data as unknown as WorkspaceLayer,...(style?{styleId:style}:{})};
  }
  if(l.kind!=='vector')err('unsupported layer kind');
  const strokes=array(l.strokes,'strokes',4096).map(raw=>{
    const s=object(raw,'stroke'),commands=array(s.commands,'path commands',4096).map(rawCmd=>{
      const c=object(rawCmd,'command'),op=c.op;
      if(!['M','L','Q','C','Z'].includes(String(op)))err('unsupported path opcode');
      const keys=op==='Z'?[]:op==='M'||op==='L'?['x','y']:op==='Q'?['cx','cy','x','y']:['c1x','c1y','c2x','c2y','x','y'];
      if(Object.keys(c).some(k=>k!=='op'&&!keys.includes(k)))err('unknown path command field');
      return Object.fromEntries([['op',op],...keys.map(k=>[k,numeric(c[k],k,-1e6,1e6)])]) as unknown as PathCommand;
    });
    if(!commands.length||commands[0].op!=='M')err('path must start with move');
    return {id:id(s.id),stroke:hex(s.stroke),width:numeric(s.width,'stroke width',0.001,1000),commands};
  });
  validateUnique(strokes,'stroke');
  return {id:lid,kind:'vector',name:string(l.name,'layer name',200),visible:l.visible===true?true:l.visible===false?false:err('invalid visible'),strokes,...(style?{styleId:style}:{})};
}
function point(v:unknown):TimePoint {return parseTimeJSON(v);}
function positivePoint(v:unknown):TimePoint{const t=point(v);if(compareTime(t,time('0',{numerator:'1',denominator:'1'}))<=0)err('duration must be positive');return t;}
function frame(v:unknown):Frame{
  const f=object(v,'frame'),kind=f.kind;strictKeys(f,'frame',['id','kind','exposure','layerIds','sourceFrameId','overrides','content']);
  if(kind!=='independent'&&kind!=='linked')err('unsupported frame kind');
  const source=f.sourceFrameId!==undefined?id(f.sourceFrameId):undefined;
  if(kind==='linked'&&!source)err('linked frame missing source');
  if(kind==='independent'&&source)err('independent frame has linked source');
  if(kind==='linked'&&f.content!==undefined)err('linked frames cannot own snapshots');
  const layerIds=ids(f.layerIds,'frame layers',256);
  const content=f.content===undefined?undefined:array(f.content,'frame content',256).map(layer);
  if(content&&JSON.stringify(content.map(x=>x.id))!==JSON.stringify(layerIds))err('frame snapshot IDs mismatch');
  return {id:id(f.id),kind,exposure:positivePoint(f.exposure),layerIds,
    ...(source?{sourceFrameId:source}:{}),...(content?{content}:{}),overrides:overrides(f.overrides)};
}
function asset(v:unknown):ProjectAsset{
  const a=object(v,'asset');if(!['image','audio','video'].includes(String(a.kind)))err('unsupported asset kind');
  const uri=string(a.uri,'asset URI',2048);if(!/^(asset:[\w.-]+|\/workspace\/assets\/[\w.-]+)$/.test(uri))err('unsafe asset URI');
  const metadata=object(a.metadata,'asset metadata');if(Object.keys(metadata).length>32)err('too many metadata fields');
  const m:Record<string,string>={};for(const [k,x] of Object.entries(metadata))m[id(k)]=string(x,'metadata',256);
  const t=a.sourceTimebase===undefined?undefined:object(a.sourceTimebase,'source timebase');
  return {id:id(a.id),kind:a.kind as ProjectAsset['kind'],uri,metadata:m,
    ...(t?{sourceTimebase:timebase(string(t.numerator,'numerator'),string(t.denominator,'denominator'))}:{})};
}
function clip(v:unknown):Clip{
  const c=object(v,'clip');if(c.kind!=='frame-collection')err('only frame-collection clips are supported');
  const r=object(c.range,'range');return {id:id(c.id),kind:'frame-collection',trackId:id(c.trackId),collectionId:id(c.collectionId),
    range:range(point(r.start),point(r.end)),sourceOffset:point(c.sourceOffset)};
}
function keyframe(v:unknown):Keyframe{
  const k=object(v,'keyframe');if(!['opacity','x','y'].includes(String(k.property))||!['hold','linear'].includes(String(k.interpolation)))err('invalid keyframe');
  return {id:id(k.id),layerId:id(k.layerId),property:k.property as Keyframe['property'],at:point(k.at),
    value:numeric(k.value,'keyframe value',k.property==='opacity'?0:-1e6,k.property==='opacity'?1:1e6),
    interpolation:k.interpolation as Keyframe['interpolation']};
}
/** Validate and rebuild, then enforce all foreign-key constraints before returning a candidate. */
export function validateProject(input:unknown):CanonicalProject {
  const p=object(input,'project');
  strictKeys(p,'project',['schemaVersion','id','revision','name','canvas','sequence','scenes','layers','assets','styles','frameCollections','tracks','clips','keyframes','exportSettings','legacyDocument','migration']);
  if(p.schemaVersion!==2)err(`unsupported schema version ${String(p.schemaVersion)}`);
  // Avoid stringify-based mutation of the user's input: construct a fresh validated candidate.
  const canvas=object(p.canvas,'canvas'),background=object(canvas.background,'background');strictKeys(canvas,'canvas',['width','height','background','extras']);
  const width=numeric(canvas.width,'width',64,2048),height=numeric(canvas.height,'height',64,2048);
  const b=validateDocument({schemaVersion:1,name:'Canvas validation',width,height,background,layers:[]}).background;
  const seq=object(p.sequence,'sequence'),tb=object(seq.timebase,'sequence timebase');
  const fps=seq.fps!==undefined?object(seq.fps,'fps'):null;
  let frameRate:FrameRate|undefined;
  if(fps){const n=timebase(string(fps.numerator,'fps'),string(fps.denominator,'fps'));frameRate={numerator:n.numerator,denominator:n.denominator};}
  const scenes=array(p.scenes,'scenes',64).map(raw=>{const s=object(raw,'scene');strictKeys(s,'scene',['id','name','layerIds']);return {id:id(s.id),name:string(s.name,'scene name',200),layerIds:ids(s.layerIds,'scene layers',256)};});
  const layers=array(p.layers,'layers',256).map(layer);
  const styles=array(p.styles,'styles',256).map(raw=>{const s=object(raw,'style');return {id:id(s.id),fill:hex(s.fill),stroke:hex(s.stroke),opacity:numeric(s.opacity,'opacity',0,1)};});
  const assets=array(p.assets,'assets',1024).map(asset);
  const frameCollections=array(p.frameCollections,'frame collections',128).map(raw=>{
    const c=object(raw,'frame collection');strictKeys(c,'collection',['id','name','frames']);const frames=array(c.frames,'frames',10000).map(frame);validateUnique(frames,'frame');
    return {id:id(c.id),name:string(c.name,'collection name',200),frames};
  });
  const tracks=array(p.tracks,'tracks',128).map(raw=>{const t=object(raw,'track');if(t.kind!=='visual')err('audio/video tracks not commandable yet');
    return {id:id(t.id),kind:'visual' as const,name:string(t.name,'track name',200),clipIds:ids(t.clipIds,'track clips',1000)};});
  const clips=array(p.clips,'clips',1000).map(clip),keyframes=array(p.keyframes,'keyframes',10000).map(keyframe);
  const result:CanonicalProject={schemaVersion:2,id:id(p.id),revision:numeric(p.revision,'revision',0,Number.MAX_SAFE_INTEGER),name:string(p.name,'project name',200),
    canvas:{width,height,background:b,...(canvas.extras===undefined?{}:{extras:validateCanvasExtras(canvas.extras)})},sequence:{timebase:timebase(string(tb.numerator,'base numerator'),string(tb.denominator,'base denominator')),...(frameRate?{fps:frameRate}:{})},
    scenes,layers,styles,assets,frameCollections,tracks,clips,keyframes,exportSettings:{format:'png',width,height}};
  const exportSettings=object(p.exportSettings,'export settings');
  if(exportSettings.format!=='png')err('only PNG export is implemented');
  result.exportSettings={format:'png',width:numeric(exportSettings.width,'export width',64,2048),height:numeric(exportSettings.height,'export height',64,2048)};
  if(p.legacyDocument!==undefined){result.legacyDocument=validateDocument(p.legacyDocument);
    for(const x of layers.filter((l):l is Extract<ProjectLayer,{kind:'legacy'}>=>l.kind==='legacy')){
      const doc=validateDocument({...result.legacyDocument,layers:[x.data]});if(JSON.stringify(doc.layers[0])!==JSON.stringify(x.data))err('invalid legacy layer content');
    }
  } else if(layers.some(l=>l.kind==='legacy'))err('legacy layers require validated legacy document');
  if(p.migration!==undefined){const m=object(p.migration,'migration');if(m.from!==1||m.precision!=='legacy-static-no-times')err('unsupported migration metadata');
    result.migration={from:1,precision:'legacy-static-no-times',note:string(m.note,'migration note',500)};}
  const unique=(values:{id:string}[],kind:string)=>validateUnique(values,kind);
  unique(scenes,'scene');unique(layers,'layer');unique(styles,'style');unique(assets,'asset');unique(frameCollections,'collection');unique(tracks,'track');unique(clips,'clip');unique(keyframes,'keyframe');
  const lmap=new Map(layers.map(x=>[x.id,x])),stmap=new Set(styles.map(x=>x.id)),collmap=new Map(frameCollections.map(x=>[x.id,x])),trackmap=new Map(tracks.map(x=>[x.id,x]));
  for(const scene of scenes)for(const layerId of scene.layerIds)if(!lmap.has(layerId))err('scene refers to unknown layer');
  for(const l of layers)if(l.styleId&&!stmap.has(l.styleId))err('layer refers to unknown style');
  let totalFrames=0,totalSnapshotBytes=0;
  for(const collection of frameCollections){totalFrames+=collection.frames.length;if(totalFrames>10000)err('total frames limit');
    const map=new Map(collection.frames.map(x=>[x.id,x]));
    for(const f of collection.frames){if(f.kind==='linked'&&map.get(f.sourceFrameId!)?.kind!=='independent')err('linked frame must reference independent frame in same collection');
      if(f.kind==='independent'&&!f.content)f.content=f.layerIds.map(layerId=>{
        const value=lmap.get(layerId);if(!value)err('frame refers to unknown layer');
        return JSON.parse(JSON.stringify(value)) as ProjectLayer;
      });
      if(f.content)for(const layer of f.content){
        if(!lmap.has(layer.id))err('frame snapshot has unknown layer');
        if(layer.styleId&&!stmap.has(layer.styleId))err('frame snapshot has unknown style');
        const bytes=JSON.stringify(layer).length;
        if(bytes>65536)err('frame content exceeds inline snapshot budget; use immutable asset reference');
        totalSnapshotBytes+=bytes;
        if(totalSnapshotBytes>4194304)err('aggregate frame snapshot budget exceeded');
      }
      for(const layerId of f.layerIds)if(!lmap.has(layerId))err('frame refers to unknown layer');
      for(const [layerId,override] of Object.entries(f.overrides)){if(!lmap.has(layerId))err('unknown overridden layer');if(override.styleId&&!stmap.has(override.styleId))err('unknown overridden style');
        if(override.data){
          if(override.data.id!==layerId)err('frame override ID mismatch');
          if(override.data.styleId&&!stmap.has(override.data.styleId))err('unknown override content style');
        }}
    }
  }
  const cmap=new Map(clips.map(x=>[x.id,x]));
  for(const clip of clips){if(!trackmap.has(clip.trackId)||!collmap.has(clip.collectionId))err('clip reference missing');}
  for(const track of tracks)for(const clipId of track.clipIds){const c=cmap.get(clipId);if(!c||c.trackId!==track.id)err('track has missing/foreign clip');}
  for(const clip of clips)if(!trackmap.get(clip.trackId)!.clipIds.includes(clip.id))err('clip absent from track order');
  for(const k of keyframes)if(!lmap.has(k.layerId))err('keyframe references missing layer');
  if(result.legacyDocument){const originalIds=result.legacyDocument.layers.map(x=>x.id);const migrated=layers.filter(l=>l.kind==='legacy').map(l=>l.id);
    if(JSON.stringify(originalIds)!==JSON.stringify(migrated))err('legacy layer order/identity changed');}
  return result;
}
export function migrateV1(input:unknown,projectId:string):CanonicalProject {
  const legacy=validateDocument(input);const lid=id(projectId);
  return validateProject({schemaVersion:2,id:lid,revision:0,name:legacy.name,
    canvas:{width:legacy.width,height:legacy.height,background:legacy.background,...(legacy.canvasExtras===undefined?{}:{extras:legacy.canvasExtras})},sequence:{timebase:{numerator:'1',denominator:'70560000'}},
    scenes:[{id:'scene:main',name:'Main scene',layerIds:legacy.layers.map(l=>l.id)}],
    layers:legacy.layers.map(l=>({id:l.id,kind:'legacy',data:l})),assets:[],styles:[],frameCollections:[],tracks:[],clips:[],keyframes:[],
    exportSettings:{format:'png',width:legacy.width,height:legacy.height},legacyDocument:legacy,
    migration:{from:1,precision:'legacy-static-no-times',note:'v1 contains static layers; no floating media seconds were inferred'}});
}
/** Returns original v1 faithfully when possible; v2 media objects intentionally cannot be dropped in a legacy export. */
export function resolveFrameLayers(project:CanonicalProject,collectionId:string,frameId:string):ProjectLayer[] {
  const p=validateProject(project),c=p.frameCollections.find(c=>c.id===collectionId),f=c?.frames.find(f=>f.id===frameId);
  if(!c||!f)err('unknown frame');
  const base=f.kind==='linked'?c.frames.find(x=>x.id===f.sourceFrameId):f;
  if(!base||base.kind!=='independent'||!base.content)err('unresolved independent source');
  return base.content.map(value=>{
    const ov=f.overrides[value.id],layer:ProjectLayer=JSON.parse(JSON.stringify(ov?.data??value));
    if(ov?.styleId)layer.styleId=ov.styleId;
    if(ov?.visible!==undefined){
      if(layer.kind==='legacy')layer.data.visible=ov.visible;
      else layer.visible=ov.visible;
    }
    return layer;
  });
}
export function toV1(project:CanonicalProject):WorkspaceDocument {
  const p=validateProject(project);
  if(!p.legacyDocument||p.frameCollections.length||p.tracks.length||p.clips.length||p.keyframes.length||
    p.assets.length||p.styles.length||p.layers.some(l=>l.kind!=='legacy'))
    err('v2 semantic records cannot be projected losslessly to v1');
  if(p.scenes.length!==1||p.scenes[0].id!=='scene:main'||p.scenes[0].name!=='Main scene'||
    JSON.stringify(p.scenes[0].layerIds)!==JSON.stringify(p.layers.map(l=>l.id)))
    err('v2 scene changes cannot be projected losslessly to v1');
  if(p.sequence.fps||JSON.stringify(p.sequence.timebase)!==JSON.stringify({numerator:'1',denominator:'70560000'}))
    err('v2 timing metadata cannot be projected losslessly to v1');
  if(p.exportSettings.width!==p.canvas.width||p.exportSettings.height!==p.canvas.height)
    err('v2 export settings cannot be projected losslessly to v1');
  return validateDocument({...p.legacyDocument,name:p.name,width:p.canvas.width,height:p.canvas.height,background:p.canvas.background,
    layers:p.layers.map(l=>(l as Extract<ProjectLayer,{kind:'legacy'}>).data),...(p.canvas.extras===undefined?{}:{canvasExtras:p.canvas.extras})});
}
export type ProjectImportResult={ok:true;project:CanonicalProject}|{ok:false;project:CanonicalProject;recoverableInput:string;error:string};
/** Pure import adapter: callers only commit the returned project if ok=true. */
export function prepareProjectImport(current:CanonicalProject,input:unknown,projectId:string):ProjectImportResult{
  let recoverableInput:string;
  try{recoverableInput=typeof input==='string'?input:JSON.stringify(input);if(typeof recoverableInput!=='string'||recoverableInput.length>4_000_000)err('input size limit');
    const decoded=typeof input==='string'?JSON.parse(input):input,o=object(decoded,'import');
    const candidate=o.schemaVersion===1?migrateV1(decoded,projectId):validateProject(decoded);
    return {ok:true,project:candidate};
  }catch(error){
    let recoverable='[non-serializable input]';
    if(typeof input==='string')recoverable=input;
    else try{recoverable=JSON.stringify(input)??recoverable;}catch{ /* Cyclic input cannot be serialized as JSON. */ }
    return {ok:false,project:current,recoverableInput:recoverable,error:error instanceof Error?error.message:String(error)};
  }
}
