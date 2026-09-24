'use client';

import type { StudioVirtualAsset } from '@/lib/studio/runtime/assets';
import type { VisualProject } from '@/lib/studio/visual/model';
import { createVisualNode } from '@/lib/studio/visual/project';
import { createVisualId } from '@/lib/studio/visual/ids';
import {
  defaultTextNodeProps,
  textPropsRecord,
  visualTextProps,
} from '@/lib/studio/visual/text-contract';
import {
  defaultPhase13Timeline,
  phase13Timeline,
  setPhase13Timeline,
  type Phase13Operation,
  type Phase13Timeline,
  type Phase13VideoMode,
} from '@/lib/studio/visual/video-authoring-contract';

type Mutate=(label:string,mutation:(project:VisualProject)=>VisualProject)=>void;
type SharedProps={project:VisualProject;assets:StudioVirtualAsset[];onMutate:Mutate};

function active(project:VisualProject){return phase13Timeline(project)??defaultPhase13Timeline();}
function update(project:VisualProject,updater:(timeline:Phase13Timeline)=>Phase13Timeline){
  return setPhase13Timeline(project,updater(active(project)));
}
function numeric(value:string,fallback:number){const n=Number(value);return Number.isFinite(n)?n:fallback;}
function videoAssets(assets:StudioVirtualAsset[]){return assets.filter((asset)=>asset.mime.startsWith('video/'));}
function audioAssets(assets:StudioVirtualAsset[]){return assets.filter((asset)=>asset.mime.startsWith('audio/'));}
function imageAssets(assets:StudioVirtualAsset[]){return assets.filter((asset)=>asset.mime.startsWith('image/'));}

export function VisualVideoContext({
  project,assets,onMutate,onOpenTimeline,onPreview,previewUrl,previewMime,
}:SharedProps&{onOpenTimeline:()=>void;onPreview:()=>void;previewUrl:string|null;previewMime:string}) {
  const stored=phase13Timeline(project);
  const timeline=stored??defaultPhase13Timeline();
  const videos=videoAssets(assets);
  const frames=imageAssets(assets);

  const activate=(mode:Phase13VideoMode)=>onMutate('Video mode',(current)=>update(current,(value)=>({...value,mode})));
  const chooseSource=(assetId:string)=>onMutate('Video source',(current)=>update(current,(value)=>({...value,source:assetId?{kind:'asset',assetId}:undefined})));
  const addFrameAsset=(assetId:string)=>onMutate('Add video frame',(current)=>update(current,(value)=>({
    ...value,mode:'frames',frames:{...value.frames,items:[...value.frames.items,{id:'video-frame-'+(value.frames.items.length+1),source:{kind:'asset',assetId}}]},
  })));
  const addOperation=(operation:Phase13Operation)=>onMutate('Add video operation',(current)=>update(current,(value)=>({...value,mode:'operations',operations:[...value.operations,operation]})));

  return (
    <div className="apx-media-context apx-video-context" data-visual-video-context>
      <div className="apx-media-context-copy">
        <strong>Video Editor</strong>
        <span>Author real Apexify FFmpeg timelines, generated-frame videos and retained operation stacks.</span>
      </div>

      {!stored ? (
        <button type="button" className="apx-media-open-assets" data-video-enable onClick={()=>onMutate('Enable video authoring',(current)=>setPhase13Timeline(current,timeline))}>
          Create video project
        </button>
      ):null}

      <div className="apx-video-mode-grid" role="group" aria-label="Video authoring mode">
        {(['frames','pipeline','operations'] as const).map((mode)=>(
          <button key={mode} type="button" data-video-mode={mode} data-active={timeline.mode===mode?'true':undefined} onClick={()=>activate(mode)}>
            {mode==='frames'?'Frames':mode==='pipeline'?'Timeline':'Operations'}
          </button>
        ))}
      </div>

      {timeline.mode!=='frames'?(
        <label className="apx-canvas-field">
          <span>Source video asset</span>
          <select className="apx-pre4-input" value={timeline.source?.assetId??''} onChange={(event)=>chooseSource(event.target.value)} data-video-source-select>
            <option value="">Choose uploaded video…</option>
            {videos.map((asset)=><option key={asset.id} value={asset.id}>{asset.name}</option>)}
          </select>
        </label>
      ):null}

      <div className="apx-video-preview-card">
        <div><strong>Runtime preview</strong><span>{timeline.render.format.toUpperCase()} · {timeline.mode}</span></div>
        {previewUrl&&previewMime.startsWith('video/')?(
          <video controls preload="metadata" src={previewUrl} data-video-context-player />
        ):(
          <div className="apx-video-preview-placeholder">Run Preview to encode the current project through the full Apexify FFmpeg runtime.</div>
        )}
        <div className="apx-audio-preview-actions">
          <button type="button" onClick={onPreview}>Render / Play</button>
          <button type="button" onClick={onOpenTimeline}>Open timeline</button>
        </div>
      </div>

      {timeline.mode==='frames'?(
        <>
          <div className="apx-media-context-heading"><strong>Frame assets</strong><span>{frames.length}</span></div>
          <div className="apx-video-asset-list">
            {frames.map((asset)=>(
              <button type="button" key={asset.id} onClick={()=>addFrameAsset(asset.id)} data-video-frame-asset={asset.id}>
                <span>▣</span><span><strong>{asset.name}</strong><small>{asset.mime}</small></span><span>＋</span>
              </button>
            ))}
          </div>
        </>
      ):(
        <>
          <div className="apx-media-context-heading"><strong>Video assets</strong><span>{videos.length}</span></div>
          <div className="apx-video-asset-list">
            {videos.map((asset)=>(
              <button type="button" key={asset.id} onClick={()=>chooseSource(asset.id)} data-video-asset={asset.id}>
                <span>▶</span><span><strong>{asset.name}</strong><small>{asset.mime}</small></span><span>Use</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="apx-media-context-heading"><strong>Quick operations</strong><span>native createVideo</span></div>
      <div className="apx-video-operation-grid">
        <button type="button" onClick={()=>addOperation({id:'video-op-'+Date.now(),kind:'speed',speed:1.25})}>Speed</button>
        <button type="button" onClick={()=>addOperation({id:'video-op-'+Date.now(),kind:'fade',fadeIn:.35,fadeOut:.35})}>Fades</button>
        <button type="button" onClick={()=>addOperation({id:'video-op-'+Date.now(),kind:'color',contrast:1.05,saturation:1.05})}>Color</button>
        <button type="button" onClick={()=>addOperation({id:'video-op-'+Date.now(),kind:'reverse'})}>Reverse</button>
        <button type="button" onClick={()=>addOperation({id:'video-op-'+Date.now(),kind:'compress',quality:'medium'})}>Compress</button>
        <button type="button" onClick={()=>addOperation({id:'video-op-'+Date.now(),kind:'exportPreset',preset:'web'})}>Web preset</button>
      </div>
    </div>
  );
}

export function VisualVideoInspector({
  project,assets,onMutate,inspectorTab,onMessage,
}:SharedProps&{inspectorTab:'style'|'transform'|'effects'|'data'|'advanced';onMessage:(message:string)=>void}) {
  const timeline=active(project);
  const mutate=(label:string,updater:(timeline:Phase13Timeline)=>Phase13Timeline)=>onMutate(label,(current)=>update(current,updater));
  const audios=audioAssets(assets);
  const videos=videoAssets(assets);

  if(inspectorTab==='advanced') return (
    <div data-visual-video-inspector>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Render settings</div>
        <div className="apx-pre4-property-grid">
          <label><span>Format</span><select className="apx-pre4-input" value={timeline.render.format} onChange={(e)=>mutate('Video format',(v)=>({...v,render:{...v.render,format:e.target.value as 'mp4'|'webm'}}))}><option value="mp4">MP4</option><option value="webm">WebM</option></select></label>
          <label><span>Pipeline preset</span><select className="apx-pre4-input" value={timeline.render.preset} onChange={(e)=>mutate('Video render preset',(v)=>({...v,render:{...v.render,preset:e.target.value as 'preview'|'export'}}))}><option value="preview">Preview</option><option value="export">Export</option></select></label>
          <label><span>Thumbnails</span><input className="apx-pre4-input" type="number" min={0} max={100} value={timeline.inspect.thumbnails} onChange={(e)=>mutate('Video thumbnails',(v)=>({...v,inspect:{...v.inspect,thumbnails:numeric(e.target.value,0)}}))}/></label>
          <label><span>Extract times</span><input className="apx-pre4-input" value={timeline.inspect.extractTimes.join(', ')} onChange={(e)=>mutate('Video extract times',(v)=>({...v,inspect:{...v.inspect,extractTimes:e.target.value.split(',').map((x)=>Number(x.trim())).filter(Number.isFinite)}}))}/></label>
        </div>
      </div>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Complete Video Timeline JSON</div>
        <textarea className="apx-canvas-json apx-canvas-json--config" defaultValue={JSON.stringify(timeline,null,2)} key={JSON.stringify(timeline)} onBlur={(event)=>{
          try {
            const parsed=JSON.parse(event.target.value) as Phase13Timeline;
            onMutate('Apply video JSON',(current)=>setPhase13Timeline(current,parsed));
            onMessage('Video timeline JSON applied');
          } catch { onMessage('Video timeline JSON is invalid'); }
        }}/>
      </div>
    </div>
  );

  if(timeline.mode==='frames') return (
    <div data-visual-video-inspector>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Frames to video</div>
        <div className="apx-pre4-property-grid">
          <label><span>FPS</span><input className="apx-pre4-input" type="number" min={1} max={240} value={timeline.frames.fps} onChange={(e)=>mutate('Video FPS',(v)=>({...v,frames:{...v.frames,fps:numeric(e.target.value,v.frames.fps)}}))}/></label>
          <label><span>Quality</span><select className="apx-pre4-input" value={timeline.frames.quality} onChange={(e)=>mutate('Video quality',(v)=>({...v,frames:{...v.frames,quality:e.target.value as Phase13Timeline['frames']['quality']}}))}>{['low','medium','high','ultra'].map((x)=><option key={x}>{x}</option>)}</select></label>
          <label><span>Width</span><input className="apx-pre4-input" type="number" min={1} value={timeline.frames.width} onChange={(e)=>mutate('Video width',(v)=>({...v,frames:{...v.frames,width:numeric(e.target.value,v.frames.width)}}))}/></label>
          <label><span>Height</span><input className="apx-pre4-input" type="number" min={1} value={timeline.frames.height} onChange={(e)=>mutate('Video height',(v)=>({...v,frames:{...v.frames,height:numeric(e.target.value,v.frames.height)}}))}/></label>
        </div>
      </div>
    </div>
  );

  if(timeline.mode==='pipeline') return (
    <div data-visual-video-inspector>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Trim</div>
        <label className="apx-canvas-check"><input type="checkbox" checked={Boolean(timeline.pipeline.trim)} onChange={(e)=>mutate('Video trim',(v)=>({...v,pipeline:{...v.pipeline,trim:e.target.checked?{startTime:0,endTime:3}:undefined}}))}/><span>Enable trim layer</span></label>
        {timeline.pipeline.trim?(
          <div className="apx-pre4-property-grid">
            <label><span>Start</span><input className="apx-pre4-input" type="number" min={0} step={.1} value={timeline.pipeline.trim.startTime} onChange={(e)=>mutate('Trim start',(v)=>({...v,pipeline:{...v.pipeline,trim:{...v.pipeline.trim!,startTime:numeric(e.target.value,0)}}}))}/></label>
            <label><span>End</span><input className="apx-pre4-input" type="number" min={.1} step={.1} value={timeline.pipeline.trim.endTime} onChange={(e)=>mutate('Trim end',(v)=>({...v,pipeline:{...v.pipeline,trim:{...v.pipeline.trim!,endTime:numeric(e.target.value,3)}}}))}/></label>
          </div>
        ):null}
      </div>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Audio layer</div>
        <label className="apx-canvas-check"><input type="checkbox" checked={timeline.pipeline.keepOriginalAudio} onChange={(e)=>mutate('Original audio',(v)=>({...v,pipeline:{...v.pipeline,keepOriginalAudio:e.target.checked}}))}/><span>Keep original audio</span></label>
        <select className="apx-pre4-input" value="" onChange={(e)=>{
          const id=e.target.value;if(!id)return;
          mutate('Add video audio',(v)=>({...v,pipeline:{...v.pipeline,audio:[...v.pipeline.audio,{id:'video-audio-'+Date.now(),type:'asset',assetId:id,startTime:0,volume:1}]}}));
        }}><option value="">Add audio asset…</option>{audios.map((asset)=><option key={asset.id} value={asset.id}>{asset.name}</option>)}</select>
      </div>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Text overlay</div>
        <button className="apx-canvas-apply" type="button" onClick={()=>{
          onMutate('Add video text overlay',(current)=>{
            const nodeId=createVisualId('video-text');
            const node=createVisualNode(
              'text',
              textPropsRecord({
                ...defaultTextNodeProps('APEXIFY STUDIO'),
                font:{family:'Arial',size:24},
                decorations:{bold:true},
                placement:{textAlign:'center',textBaseline:'middle',rotation:0},
                fill:{color:'#f8fafc',opacity:1},
              }),
              {id:nodeId,name:'Video text overlay'},
            );
            node.transform={
              x:Math.round(current.document.width/2),
              y:Math.max(40,current.document.height-42),
              width:Math.min(420,current.document.width-24),
              height:48,
              rotation:0,
              scaleX:1,
              scaleY:1,
              opacity:1,
              visible:true,
              locked:false,
            };
            const withNode={
              ...current,
              document:{
                ...current.document,
                nodes:{...current.document.nodes,[nodeId]:node},
                rootNodeIds:[...current.document.rootNodeIds,nodeId],
              },
              editor:{...current.editor,selectedNodeIds:[nodeId]},
            };
            return update(withNode,(v)=>({
              ...v,
              pipeline:{
                ...v.pipeline,
                text:[...v.pipeline.text,{
                  id:createVisualId('video-text-track'),
                  nodeId,
                  startTime:0,
                  endTime:2,
                  text:'APEXIFY STUDIO',
                  x:node.transform?.x??0,
                  y:node.transform?.y??0,
                  fontSize:24,
                  color:'#f8fafc',
                  bold:true,
                }],
              },
            }));
          });
        }}>Add timed text layer</button>
      </div>
    </div>
  );

  return (
    <div data-visual-video-inspector>
      <div className="apx-pre4-section">
        <div className="apx-pre4-section-title">Operation stack</div>
        <span className="apx-canvas-hint">{timeline.operations.length} retained operations. Reorder and remove them in Timeline.</span>
        {timeline.operations.map((op)=><div className="apx-video-op-summary" key={op.id}><strong>{op.kind}</strong><span>{op.id}</span></div>)}
      </div>
      {videos.length?null:<div className="apx-pre4-empty"><strong>Upload a video asset</strong><span>Operations mode needs one source video.</span></div>}
    </div>
  );
}

export function VisualVideoTimeline({project,assets,onMutate}:SharedProps) {
  const timeline=active(project);
  const mutate=(label:string,updater:(timeline:Phase13Timeline)=>Phase13Timeline)=>onMutate(label,(current)=>update(current,updater));
  const move=<T,>(items:T[],from:number,to:number)=>{const next=[...items];const [item]=next.splice(from,1);if(item!==undefined)next.splice(to,0,item);return next;};

  return (
    <div className="apx-video-timeline" data-visual-video-timeline>
      <div className="apx-video-timeline-head">
        <div><strong>Video Timeline</strong><span>{timeline.mode} · {timeline.render.format.toUpperCase()}</span></div>
        <div><span>{videoAssets(assets).length} video assets</span><span>{audioAssets(assets).length} audio assets</span></div>
      </div>

      {timeline.mode==='frames'?(
        <div className="apx-video-track">
          {timeline.frames.items.map((frame,index)=>(
            <article key={frame.id} data-video-frame={frame.id}>
              <strong>{index+1}</strong>
              <span>{frame.source.kind==='asset'?frame.source.assetId:frame.source.label??frame.source.color}</span>
              <div>
                <button type="button" disabled={index===0} onClick={()=>mutate('Move video frame',(v)=>({...v,frames:{...v.frames,items:move(v.frames.items,index,index-1)}}))}>←</button>
                <button type="button" disabled={index===timeline.frames.items.length-1} onClick={()=>mutate('Move video frame',(v)=>({...v,frames:{...v.frames,items:move(v.frames.items,index,index+1)}}))}>→</button>
                <button type="button" onClick={()=>mutate('Delete video frame',(v)=>({...v,frames:{...v.frames,items:v.frames.items.filter((item)=>item.id!==frame.id)}}))}>×</button>
              </div>
            </article>
          ))}
          <button type="button" className="apx-video-add" onClick={()=>mutate('Add generated frame',(v)=>({...v,frames:{...v.frames,items:[...v.frames.items,{id:'video-frame-'+Date.now(),source:{kind:'solid',color:'#312e81',label:'NEW FRAME'}}]}}))}>＋ Generated frame</button>
        </div>
      ):timeline.mode==='pipeline'?(
        <div className="apx-video-track apx-video-track--layers">
          <article><strong>Source</strong><span>{timeline.source?.assetId??'Choose a video asset'}</span></article>
          {timeline.pipeline.trim?<article><strong>Trim</strong><span>{timeline.pipeline.trim.startTime}s → {timeline.pipeline.trim.endTime}s</span></article>:null}
          {timeline.pipeline.splices.map((splice)=><article key={splice.id}><strong>Splice</strong><span>{splice.targetStartTime}s → {splice.targetEndTime}s · {splice.replacement.assetId}</span></article>)}
          {timeline.pipeline.text.map((text)=>{
            const linked=text.nodeId?project.document.nodes[text.nodeId]:undefined;
            const label=linked?.kind==='text'?visualTextProps(linked).text:text.text;
            return <article key={text.id}><strong>Text</strong><span>{text.startTime}s → {text.endTime}s · {label}</span></article>;
          })}
          {timeline.pipeline.audio.map((track)=><article key={track.id}><strong>Audio</strong><span>{track.startTime}s · {track.type==='asset'?track.assetId:track.preset}</span></article>)}
        </div>
      ):(
        <div className="apx-video-track apx-video-track--ops">
          {timeline.operations.map((op,index)=>(
            <article key={op.id} data-video-operation={op.kind}>
              <strong>{index+1}</strong><span>{op.kind}</span>
              <div>
                <button type="button" disabled={index===0} onClick={()=>mutate('Move video operation',(v)=>({...v,operations:move(v.operations,index,index-1)}))}>↑</button>
                <button type="button" disabled={index===timeline.operations.length-1} onClick={()=>mutate('Move video operation',(v)=>({...v,operations:move(v.operations,index,index+1)}))}>↓</button>
                <button type="button" onClick={()=>mutate('Delete video operation',(v)=>({...v,operations:v.operations.filter((item)=>item.id!==op.id)}))}>×</button>
              </div>
            </article>
          ))}
          {!timeline.operations.length?<div className="apx-pre4-empty"><strong>No operations yet</strong><span>Add effects from the Video context panel.</span></div>:null}
        </div>
      )}
    </div>
  );
}
