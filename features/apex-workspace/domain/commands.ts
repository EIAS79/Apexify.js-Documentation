/** Atomic authoring transactions, reversible snapshots, optimistic revision checks. */
import { validateProject, type CanonicalProject, type Frame, type FrameCollection, type ReusableStyle, type Track, type Clip, type Keyframe, type ProjectLayer } from './project';
import { parseTimeJSON, compareTime, time } from './time';

export type ProjectCommand =
  |{op:'createCollection';collection:FrameCollection}
  |{op:'createFrame';collectionId:string;frame:Frame;index?:number}
  |{op:'duplicateFrame';collectionId:string;frameId:string;newId:string;index?:number}
  |{op:'deleteFrame';collectionId:string;frameId:string}
  |{op:'setExposure';collectionId:string;frameId:string;exposure:Frame['exposure']}
  |{op:'reorderFrames';collectionId:string;frameIds:string[]}
  |{op:'setFrameLocal';collectionId:string;frameId:string;layerId:string;styleId?:string;visible?:boolean}
  |{op:'setFrameContent';collectionId:string;frameId:string;layerId:string;data:ProjectLayer;scope:'frame-local'|'linked-source'|'instance-override'}
  |{op:'duplicateLinkedFrame';collectionId:string;frameId:string;newId:string;index?:number}
  |{op:'setStyle';style:ReusableStyle}
  |{op:'addTrack';track:Track}
  |{op:'removeTrack';trackId:string}
  |{op:'addClip';clip:Clip;index?:number}
  |{op:'removeClip';clipId:string}
  |{op:'setKeyframe';keyframe:Keyframe};
export interface HistoryEntry {description:string;before:CanonicalProject;after:CanonicalProject}
export interface ProjectSession {project:CanonicalProject;undo:HistoryEntry[];redo:HistoryEntry[]}
const MAX_HISTORY=32,MAX_COMMANDS=128;
function fail(message:string):never{throw new Error(`project-command: ${message}`)}
function copy<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
export function createProjectSession(project:CanonicalProject):ProjectSession{return {project:validateProject(project),undo:[],redo:[]};}
function collection(project:CanonicalProject,id:string):FrameCollection{
  const c=project.frameCollections.find(x=>x.id===id);if(!c)fail(`unknown collection ${id}`);return c;
}
function insertIndex(length:number,index?:number):number{
  const value=index??length;if(!Number.isInteger(value)||value<0||value>length)fail('invalid insertion index');return value;
}
function applyOne(project:CanonicalProject,cmd:ProjectCommand):void{
  switch(cmd.op){
    case 'createCollection':
      if(project.frameCollections.some(x=>x.id===cmd.collection.id))fail('collection already exists');
      project.frameCollections.push(copy(cmd.collection));break;
    case 'createFrame':{
      const c=collection(project,cmd.collectionId);if(c.frames.some(x=>x.id===cmd.frame.id))fail('duplicate frame identity');
      c.frames.splice(insertIndex(c.frames.length,cmd.index),0,copy(cmd.frame));break;}
    case 'duplicateFrame':{
      const c=collection(project,cmd.collectionId),src=c.frames.find(x=>x.id===cmd.frameId);
      if(!src)fail('source frame not found');if(c.frames.some(x=>x.id===cmd.newId))fail('duplicate frame identity');
      // Duplicate linked frames as independent snapshots to avoid aliasing/mutable sharing.
      const base=src.kind==='linked'?c.frames.find(x=>x.id===src.sourceFrameId):src;
      if(!base||base.kind!=='independent')fail('source frame is unavailable');
      const frame:Frame={...copy(base),id:cmd.newId,kind:'independent',overrides:{...copy(base.overrides),...copy(src.overrides)}};
      if(src.kind==='linked')frame.content=base.content?.map(layer=>copy(src.overrides[layer.id]?.data??layer));
      c.frames.splice(insertIndex(c.frames.length,cmd.index),0,frame);break;}
    case 'duplicateLinkedFrame':{
      const c=collection(project,cmd.collectionId),src=c.frames.find(f=>f.id===cmd.frameId);
      if(!src)fail('source frame not found');if(c.frames.some(f=>f.id===cmd.newId))fail('duplicate frame identity');
      const base=src.kind==='linked'?src.sourceFrameId:src.id;
      if(!base)fail('missing linked source');
      const linked:Frame={id:cmd.newId,kind:'linked',sourceFrameId:base,
        exposure:copy(src.exposure),layerIds:copy(src.layerIds),overrides:copy(src.overrides)};
      c.frames.splice(insertIndex(c.frames.length,cmd.index),0,linked);break;
    }
    case 'setFrameContent':{
      const col=collection(project,cmd.collectionId),f=col.frames.find(f=>f.id===cmd.frameId);
      if(!f)fail('frame not found');
      if(cmd.data.id!==cmd.layerId)fail('edited layer identity mismatch');
      if(!project.layers.some(l=>l.id===cmd.layerId))fail('unknown frame layer');
      if(cmd.scope==='instance-override'){
        if(f.kind!=='linked')fail('instance override requires a linked frame');
        f.overrides[cmd.layerId]={...(f.overrides[cmd.layerId]??{}),data:copy(cmd.data)};
      }else{
        if(cmd.scope==='frame-local'&&f.kind!=='independent')fail('linked frame requires explicit scope');
        const source=cmd.scope==='linked-source'&&f.kind==='linked'
          ?col.frames.find(x=>x.id===f.sourceFrameId):f;
        if(!source||source.kind!=='independent')fail('invalid edit source');
        const i=source.layerIds.indexOf(cmd.layerId);
        if(i<0)fail('layer not present in source');
        if(!source.content)fail('source snapshot not initialized');
        source.content[i]=copy(cmd.data);
      }
      break;
    }
    case 'deleteFrame':{
      const c=collection(project,cmd.collectionId),index=c.frames.findIndex(x=>x.id===cmd.frameId);
      if(index<0)fail('frame not found');
      if(c.frames.some(x=>x.sourceFrameId===cmd.frameId))fail('frame referenced by linked frame');
      c.frames.splice(index,1);break;}
    case 'setExposure':{
      const c=collection(project,cmd.collectionId),f=c.frames.find(x=>x.id===cmd.frameId);
      if(!f)fail('frame not found');f.exposure=parseTimeJSON(cmd.exposure);break;}
    case 'reorderFrames':{
      const c=collection(project,cmd.collectionId);
      if(cmd.frameIds.length!==c.frames.length||new Set(cmd.frameIds).size!==c.frames.length)fail('reorder must be a permutation');
      const byId=new Map(c.frames.map(f=>[f.id,f]));
      c.frames=cmd.frameIds.map(id=>{const f=byId.get(id);if(!f)fail('unknown frame in reorder');return f;});break;}
    case 'setFrameLocal':{
      const c=collection(project,cmd.collectionId),f=c.frames.find(x=>x.id===cmd.frameId);
      if(!f)fail('frame not found');if(!project.layers.some(x=>x.id===cmd.layerId))fail('unknown frame-local layer');
      if(cmd.styleId===undefined&&cmd.visible===undefined)fail('no frame-local change');
      const prev=f.overrides[cmd.layerId]??{};
      f.overrides[cmd.layerId]={...prev,...(cmd.styleId!==undefined?{styleId:cmd.styleId}:{}),...(cmd.visible!==undefined?{visible:cmd.visible}:{})};break;}
    case 'setStyle':{
      const i=project.styles.findIndex(x=>x.id===cmd.style.id);
      if(i<0)project.styles.push(copy(cmd.style));else project.styles[i]=copy(cmd.style);break;}
    case 'addTrack':{
      if(project.tracks.some(x=>x.id===cmd.track.id))fail('track already exists');
      if(cmd.track.clipIds.length)fail('new track must start with no clips');project.tracks.push(copy(cmd.track));break;}
    case 'removeTrack':{
      const i=project.tracks.findIndex(x=>x.id===cmd.trackId);if(i<0)fail('track not found');
      if(project.tracks[i].clipIds.length)fail('cannot delete nonempty track');project.tracks.splice(i,1);break;}
    case 'addClip':{
      if(project.clips.some(x=>x.id===cmd.clip.id))fail('clip already exists');
      const t=project.tracks.find(x=>x.id===cmd.clip.trackId);if(!t)fail('track not found');
      project.clips.push(copy(cmd.clip));t.clipIds.splice(insertIndex(t.clipIds.length,cmd.index),0,cmd.clip.id);break;}
    case 'removeClip':{
      const i=project.clips.findIndex(x=>x.id===cmd.clipId);if(i<0)fail('clip not found');
      const clip=project.clips[i];project.clips.splice(i,1);
      const t=project.tracks.find(x=>x.id===clip.trackId);if(!t)fail('broken track reference');
      t.clipIds=t.clipIds.filter(id=>id!==cmd.clipId);break;}
    case 'setKeyframe':{
      const i=project.keyframes.findIndex(x=>x.id===cmd.keyframe.id);if(i<0)project.keyframes.push(copy(cmd.keyframe));else project.keyframes[i]=copy(cmd.keyframe);break;}
    default:fail('unsupported command');
  }
}
export function transact(session:ProjectSession,expectedRevision:number,description:string,commands:readonly ProjectCommand[]):ProjectSession{
  if(session.project.revision!==expectedRevision)fail('stale project revision');
  if(!description.trim()||description.length>200)fail('invalid history description');
  if(!commands.length||commands.length>MAX_COMMANDS)fail('invalid transaction command count');
  const before=validateProject(session.project),next=copy(before);
  for(const command of commands)applyOne(next,command);
  next.revision=expectedRevision+1;
  const after=validateProject(next); // single validation/commit point; errors discard all interim mutations
  const entry:HistoryEntry={description,before,after};
  return {project:after,undo:[...session.undo,entry].slice(-MAX_HISTORY),redo:[]};
}
export function undo(session:ProjectSession,expectedRevision:number):ProjectSession{
  if(session.project.revision!==expectedRevision)fail('stale project revision');
  const last=session.undo.at(-1);if(!last)fail('nothing to undo');
  const project=validateProject({...copy(last.before),revision:expectedRevision+1});
  return {project,undo:session.undo.slice(0,-1),redo:[...session.redo,last].slice(-MAX_HISTORY)};
}
export function redo(session:ProjectSession,expectedRevision:number):ProjectSession{
  if(session.project.revision!==expectedRevision)fail('stale project revision');
  const last=session.redo.at(-1);if(!last)fail('nothing to redo');
  const project=validateProject({...copy(last.after),revision:expectedRevision+1});
  return {project,undo:[...session.undo,last].slice(-MAX_HISTORY),redo:session.redo.slice(0,-1)};
}
