'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, Bars3Icon, CheckCircleIcon,
  ChevronDownIcon, ChevronRightIcon, CloudArrowUpIcon, CodeBracketIcon,
  Cog6ToothIcon, CubeIcon, DocumentTextIcon, FolderIcon, HomeIcon, MagnifyingGlassIcon,
  PhotoIcon, PlayIcon, PlusIcon, QueueListIcon, Squares2X2Icon, SwatchIcon,
  XCircleIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import CodeStudio from '@/components/studio/CodeStudio';
import { StudioArtifactPreview } from '@/components/studio/StudioArtifactPreview';
import { StudioSharedSessionProvider, useStudioSharedSession } from '@/components/studio/StudioSharedSession';
import { STUDIO_TEMPLATES, type StudioBuffer } from '@/lib/studio/studioConfig';
import { loadPersistedStudio } from '@/lib/studio/studioStorage';

const VisualStudio = dynamic(() => import('@/components/studio/visual/VisualStudio'), {
  ssr: false, loading: () => <p className="nw-message" role="status">Loading the real Visual editor…</p>,
});
const ART = '/gallery/motion-field/showcase-apexify-spectrum.webp';
const OTHER = '/gallery/motion-field/showcase-orbit-breaker.webp';
const LAUNCH = '/gallery/motion-field/launch-card.webp';
type Mode = 'code' | 'visual' | 'graph';
type Drawer = 'files' | 'templates' | 'assets' | 'projects';
type OutputTab = 'queue' | 'console' | 'diagnostics' | 'history';
type SideTab = 'properties' | 'presets' | 'assets';
type Layout = 'full' | 'code' | 'graph';
type Section = 'canvas' | 'background' | 'document' | 'effects' | 'animation' | 'export';
const clamp = (x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const modes = [
  { id: 'code' as const, label: 'Code', Icon: CodeBracketIcon },
  { id: 'visual' as const, label: 'Visual', Icon: SwatchIcon },
  { id: 'graph' as const, label: 'Graph', Icon: Squares2X2Icon },
];
const rail = [
  { id: 'projects' as const, name: 'Projects', Icon: HomeIcon },
  { id: 'files' as const, name: 'Files', Icon: FolderIcon },
  { id: 'templates' as const, name: 'Templates', Icon: CubeIcon },
  { id: 'assets' as const, name: 'Assets', Icon: PhotoIcon },
];
const graphNodes = [
  { id:'canvas',name:'Canvas',subtitle:'createCanvas',x:7,y:38,type:'cyan' },
  { id:'gradient',name:'Gradient',subtitle:'gradientBg',x:31,y:15,type:'violet' },
  { id:'text',name:'Text',subtitle:'createText',x:31,y:57,type:'blue' },
  { id:'compose',name:'Composite',subtitle:'ordered operations',x:56,y:37,type:'purple' },
  { id:'output',name:'Output',subtitle:'rendered artifact',x:79,y:37,type:'mint' },
];
const gallery = [
  {title:'Code Focus Mode',desc:'Clean coding and fast iteration',image:ART,layout:'code' as Layout},
  {title:'Graph Mode',desc:'Read-only topology now; compiler in WS-06',image:OTHER,layout:'graph' as Layout},
  {title:'Full Studio',desc:'Code, preview and output tools together',image:LAUNCH,layout:'full' as Layout},
];

function WorkspaceBody() {
  const [mode,setMode]=useState<Mode>('code');
  const [layout,setLayout]=useState<Layout>('full');
  const [drawer,setDrawer]=useState<Drawer>('files');
  const [drawerOpen,setDrawerOpen]=useState(true);
  const [inspectorOpen,setInspectorOpen]=useState(true);
  const [dockOpen,setDockOpen]=useState(true);
  const [cardsOpen,setCardsOpen]=useState(true);
  const [sideTab,setSideTab]=useState<SideTab>('properties');
  const [outputTab,setOutputTab]=useState<OutputTab>('queue');
  const [folds,setFolds]=useState<Record<Section,boolean>>({
    canvas:true, background:true,document:true,effects:false,animation:false,export:false,
  });
  const [selectedGraph,setSelectedGraph]=useState('canvas');
  const [buffers,setBuffers]=useState<StudioBuffer[]>([]);
  const [viewport,setViewport]=useState({width:1280,height:720});
  const [zoom,setZoom]=useState(62);
  const [projectTitle,setProjectTitle]=useState('Studio project');
  const [leftWidth,setLeftWidth]=useState(205);
  const [rightWidth,setRightWidth]=useState(300);
  const [dockHeight,setDockHeight]=useState(182);
  const [mobile,setMobile]=useState(false);
  const [visualMounted,setVisualMounted]=useState(false);
  const activeSource = true;
  const [preferencesLoaded,setPreferencesLoaded]=useState(false);
  const session=useStudioSharedSession();
  const {assets,assetStorageReady,previewArtifacts,activeArtifactId,setActiveArtifactId,
    history,error,previewWarnings,setCodeHandoff}=session;
  const artifact=useMemo(()=>previewArtifacts.find(a=>a.id===activeArtifactId)??previewArtifacts[0]??null,
    [previewArtifacts,activeArtifactId]);
  const refreshFiles=useCallback(()=>{
    const persisted=loadPersistedStudio();
    const files=persisted?.buffers??[];
    setBuffers(files);
    const current=files.find(x=>x.id===persisted?.activeBufferId)??files[0];
    if(current)setProjectTitle(current.name.replace(/\.(tsx?|jsx?)$/i,''));
  },[]);
  useEffect(()=>{
    const onResize=()=>setMobile(window.innerWidth<1050);
    onResize();window.addEventListener('resize',onResize);refreshFiles();
    try {
      const x=JSON.parse(localStorage.getItem('apexify-studio-neon-ui-v1')||'{}');
      if(x.layout==='full'||x.layout==='code'||x.layout==='graph')setLayout(x.layout);
      if(Number.isFinite(x.leftWidth))setLeftWidth(clamp(x.leftWidth,180,270));
      if(Number.isFinite(x.rightWidth))setRightWidth(clamp(x.rightWidth,270,345));
      if(Number.isFinite(x.dockHeight))setDockHeight(clamp(x.dockHeight,145,315));
    }catch{/* optional layout settings */}
    setPreferencesLoaded(true);
    return()=>window.removeEventListener('resize',onResize);
  },[refreshFiles]);
  useEffect(()=>{
    if(!preferencesLoaded)return;
    try{localStorage.setItem('apexify-studio-neon-ui-v1',JSON.stringify({layout,leftWidth,rightWidth,dockHeight}));}catch{}
  },[preferencesLoaded,layout,leftWidth,rightWidth,dockHeight]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setDrawerOpen(false);setInspectorOpen(false);}
      if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&mode==='code'){
        event.preventDefault();window.dispatchEvent(new Event('apexify-workspace-run'));
      }
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[mode]);
  const changeMode=(next:Mode)=>{
    setMode(next);
    if(next==='visual')setVisualMounted(true);
    if(next==='graph')setLayout('graph');
    else if(layout==='graph')setLayout('full');
    // Source editor remains mounted to preserve its working buffers.
  };
  const changeLayout=(next:Layout)=>{
    setLayout(next);
    if(next==='graph')setMode('graph');
    else if(mode==='graph')setMode('code');
    if(next==='code')setMode('code');
    if(next==='full'&&mode==='visual')setMode('code');
  };
  const selectDrawer=(next:Drawer)=>{
    if(drawer===next)setDrawerOpen(x=>!x);
    else{setDrawer(next);setDrawerOpen(true);}
    if(next==='files')refreshFiles();
  };
  const run=()=>{
    if(mode==='code')window.dispatchEvent(new Event('apexify-workspace-run'));
    else if(mode==='visual')document.querySelector<HTMLButtonElement>('.nw .apx-pre4-primary')?.click();
  };
  const useTemplate=(id:string)=>{
    const template=STUDIO_TEMPLATES.find(x=>x.id===id);
    if(!template)return;
    setCodeHandoff({id:'neon-template-'+Date.now(),name:template.name,source:template.ts});
    changeMode('code');setLayout('full');setDrawerOpen(false);
  };
  const download=()=>{
    if(!artifact?.url)return;
    const anchor=document.createElement('a');anchor.href=artifact.url;anchor.download=artifact.name||'apexify';anchor.click();
  };
  const beginResize=(type:'left'|'right'|'dock',e:ReactPointerEvent<HTMLDivElement>)=>{
    e.preventDefault();const startX=e.clientX,startY=e.clientY;
    const old=type==='left'?leftWidth:type==='right'?rightWidth:dockHeight;
    const move=(p:PointerEvent)=>{
      if(type==='left')setLeftWidth(clamp(old+p.clientX-startX,180,270));
      else if(type==='right')setRightWidth(clamp(old+startX-p.clientX,270,345));
      else setDockHeight(clamp(old+startY-p.clientY,145,315));
    };
    const stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop,{once:true});
  };
  const closeSide=()=>setInspectorOpen(false);
  const fold=(s:Section)=>setFolds(x=>({...x,[s]:!x[s]}));
  const style={'--nw-left':leftWidth+'px','--nw-right':rightWidth+'px','--nw-dock':dockHeight+'px'} as CSSProperties;

  return <div className="nw" style={style} data-workspace-studio data-workspace-stage="ws01-neon-approved" data-ws01-current-mode={mode}>
    <header className="nw-header">
      <button className="nw-plain nw-menu" aria-label="Toggle sidebar" onClick={()=>setDrawerOpen(x=>!x)}><Bars3Icon/></button>
      <Link className="nw-brand" href="/"><img src="/brand/apexify-lockup-v2.avif" alt="Apexify.js"/></Link>
      <nav className="nw-site-nav" aria-label="Site"><Link href="/">Home</Link><Link href="/docs/getting-started">Docs</Link><Link href="/api">API</Link><Link href="/gallery">Gallery</Link><span>Studio</span></nav>
      <button type="button" className="nw-search" onClick={()=>{setDrawer('templates');setDrawerOpen(true)}}><MagnifyingGlassIcon/> Search templates, components, docs… <kbd>⌘K</kbd></button>
      <Link className="nw-back" href="/studio">Legacy ↗</Link>
      <button className="nw-deploy" type="button" disabled title="Deployment integration is not enabled in the current Studio runtime"><CloudArrowUpIcon/>Deploy <ChevronDownIcon/></button>
    </header>
    <div className="nw-window">
      <nav className="nw-rail" aria-label="Workspace shortcuts">
        {rail.map(({id,name,Icon})=><button type="button" key={id} aria-label={name} title={name} className={drawerOpen&&drawer===id?'selected':''} onClick={()=>selectDrawer(id)}><Icon/></button>)}
        <span className="nw-rail-fill"/>
        <button type="button" aria-label="Open inspector" onClick={()=>setInspectorOpen(true)}><Cog6ToothIcon/></button><div className="nw-avatar">A</div>
      </nav>
      {drawerOpen&&<><button className="nw-drawer-backdrop" aria-label="Close navigation" onClick={()=>setDrawerOpen(false)}/><aside className="nw-explorer" aria-label={drawer+' explorer'}>
        <div className="nw-project"><button onClick={()=>selectDrawer('projects')}>{projectTitle}<ChevronDownIcon/></button><button title="Close explorer" aria-label="Close explorer" onClick={()=>setDrawerOpen(false)}><XMarkIcon/></button></div>
        <div className="nw-explorer-search"><MagnifyingGlassIcon/><span>{drawer==='files'?'Search files…':'Search '+drawer+'…'}</span></div>
        <div className="nw-explorer-content">
          {drawer==='files'&&<><div className="nw-folder"><ChevronDownIcon/><FolderIcon/> src</div>
            {buffers.length?buffers.map((b,i)=><button className={'nw-file '+(i===0?'selected':'')} key={b.id} onClick={()=>{changeMode('code');if(mobile)setDrawerOpen(false)}}><DocumentTextIcon/>{b.name}</button>):
              <button className="nw-file selected" onClick={()=>changeMode('code')}><DocumentTextIcon/> index.ts</button>}
            {['canvas','nodes','assets','styles','public'].map(p=><div className="nw-folder nested" key={p}><ChevronRightIcon/><FolderIcon/>{p}</div>)}
            <p className="nw-help">The current Code buffers are real. Project filesystem migration follows in WS-02/05.</p>
          </>}
          {drawer==='templates'&&STUDIO_TEMPLATES.map(t=><button type="button" key={t.id} className="nw-template" onClick={()=>useTemplate(t.id)}><CodeBracketIcon/><span>{t.name}<small>{t.group}</small></span></button>)}
          {drawer==='assets'&&(assetStorageReady?(assets.length?assets.map(a=><div className="nw-template" key={a.id}><PhotoIcon/><span>{a.name}<small>{a.mime}</small></span></div>):<p className="nw-help">No session assets yet. Add assets in the Code or Visual editor.</p>):<p className="nw-help">Loading assets…</p>)}
          {drawer==='projects'&&<><p className="nw-help">Unified projects are under development. Your saved Code and Visual work is preserved.</p><Link className="nw-template" href="/studio/legacy/code">Legacy Code Studio ↗</Link><Link className="nw-template" href="/studio/legacy/visual">Legacy Visual Studio ↗</Link></>}
        </div><p className="nw-explorer-footer">APEXIFY STUDIO <span>● Local work preserved</span></p>
        <div className="nw-resize-left" role="separator" aria-label="Resize explorer" onPointerDown={e=>beginResize('left',e)}/>
      </aside></>}
      <main className="nw-main">
        <div className="nw-modebar">
          <div className="nw-modes" role="group" aria-label="Editor mode">
            {modes.map(({id,label,Icon})=><button type="button" key={id} className={mode===id?'active':''} aria-pressed={mode===id} onClick={()=>changeMode(id)}><Icon/>{label}</button>)}
            <button className="nw-plus" onClick={()=>selectDrawer('templates')} title="Open real examples"><PlusIcon/></button>
          </div>
          <div className="nw-work-actions"><button onClick={()=>changeLayout('code')} aria-pressed={layout==='code'}>Focus</button><button onClick={()=>changeLayout('full')} aria-pressed={layout==='full'}>Full</button><button onClick={()=>setDockOpen(x=>!x)} aria-pressed={dockOpen}>Queue</button><button onClick={()=>setInspectorOpen(x=>!x)} aria-pressed={inspectorOpen}>Properties</button></div>
        </div>
        <div className="nw-workarea">
          <div className={'nw-editor '+(layout==='code'?'nw-editor-focus':'')}>
            {mode==='graph'?<div className="nw-graph" aria-label="Read-only graph reference">
              <strong>Operation graph <small>Reference topology • editing and compiler in WS-06</small></strong>
              <svg viewBox="0 0 1000 500" className="nw-edges" preserveAspectRatio="none" aria-hidden="true"><path d="M190 220 C250 220 240 115 305 115 M190 220 C250 220 240 340 305 340 M470 115 C520 115 530 220 575 220 M470 340 C520 340 530 220 575 220 M740 220 C800 220 790 220 820 220"/></svg>
              {graphNodes.map(n=><button key={n.id} className={'nw-node '+n.type+(selectedGraph===n.id?' active':'')} style={{left:n.x+'%',top:n.y+'%'}} onClick={()=>setSelectedGraph(n.id)}><b>{n.name}</b><span>{n.subtitle}</span></button>)}
            </div>:mode==='visual'?<div className="nw-visual" aria-label="Real Visual editor">{visualMounted&&<VisualStudio active mode="visual" onModeChange={()=>changeMode('code')} workspaceShell/>}</div>:
            <div className="nw-code" aria-label="Real Apexify.js Code editor">{activeSource&&<CodeStudio embedded mode="code" onModeChange={()=>changeMode('visual')} workspaceCompact/>}</div>}
          </div>
          {layout!=='code'&&<section className="nw-preview" aria-label="Actual generated output preview">
            <div className="nw-preview-toolbar">
              <button className="nw-run" disabled={mode==='graph'} onClick={run}><PlayIcon/> Run <ChevronDownIcon/></button>
              <button type="button" className="nw-preview-tab" onClick={()=>setOutputTab('queue')}><PlayIcon/> Preview</button>
              <select aria-label="Display viewport" value={viewport.width+'x'+viewport.height} onChange={e=>{const [w,h]=e.target.value.split('x').map(Number);setViewport({width:w,height:h});}}><option value="1280x720">1280 × 720</option><option value="1920x1080">1920 × 1080</option><option value="1080x1080">1080 × 1080</option><option value="800x450">800 × 450</option></select>
              <select aria-label="Preview zoom" value={zoom} onChange={e=>setZoom(Number(e.target.value))}><option value={40}>40%</option><option value={62}>62%</option><option value={85}>85%</option><option value={100}>100%</option></select>
              <button className="nw-plain" disabled={!artifact?.url} title="Open generated result" onClick={()=>{if(artifact?.url)window.open(artifact.url,'_blank','noopener,noreferrer')}}><ArrowTopRightOnSquareIcon/></button>
            </div>
            <div className="nw-preview-content" data-example-artwork={!artifact?'true':undefined}>
              {artifact?<StudioArtifactPreview artifact={artifact} artifacts={previewArtifacts} onArtifactSelect={setActiveArtifactId}/>:
                <><img src={ART} alt="Gallery example of an Apexify.js spectrum composition"/><div className="nw-reference-label">GALLERY EXAMPLE · NOT A GENERATED RUN</div></>}
            </div>
            <div className="nw-preview-footer"><span>{artifact?'Output '+(previewArtifacts.indexOf(artifact)+1)+'/'+previewArtifacts.length:'Gallery example'}</span><span>{artifact?.mime||viewport.width+' × '+viewport.height}</span><button type="button" disabled={!artifact?.url} onClick={download}><ArrowDownTrayIcon/>Download</button></div>
          </section>}
        </div>
        {dockOpen&&<div className="nw-dock" aria-label="Render and outputs dock">
          <div className="nw-dock-resize" role="separator" aria-label="Resize bottom dock" onPointerDown={e=>beginResize('dock',e)}/>
          <div className="nw-queue-pane">
            <div className="nw-dock-tabs">{([['queue','Render Queue'],['console','Console'],['diagnostics','Diagnostics'],['history','History']] as const).map(([id,label])=><button key={id} className={outputTab===id?'active':''} onClick={()=>setOutputTab(id)}>{label}{(id==='queue'&&history.length>0||id==='diagnostics'&&Boolean(error))&&<small>{id==='queue'?history.length:1}</small>}</button>)}<button title="Collapse dock" aria-label="Collapse dock" onClick={()=>setDockOpen(false)}><XMarkIcon/></button></div>
            <div className="nw-queue-scroll">
              {outputTab==='queue'&&(history.length?history.slice(0,15).map(h=><div key={h.id} className="nw-queue-row">{h.ok?<CheckCircleIcon/>:<XCircleIcon/>}<span>{h.bufferName}<small>{new Date(h.ts).toLocaleTimeString()} · {h.ok?'Completed':'Failed'}</small></span><b>{h.ok?'Completed':'Failed'}</b></div>):<p className="nw-dock-empty"><QueueListIcon/>No previous runs. Press Run to create a real artifact. Persistent rendering queue arrives in WS-09.</p>)}
              {outputTab==='console'&&<p className="nw-dock-empty">Detailed execution console is available in the Code editor. No artificial console output is shown.</p>}
              {outputTab==='diagnostics'&&<div className="nw-dock-empty">{error||previewWarnings.join('\n')||'No diagnostics.'}</div>}
              {outputTab==='history'&&<div className="nw-dock-empty">{history.length?history.map(h=><p key={h.id}>{h.bufferName} — {h.ok?'OK':'Error'}</p>):'No run history.'}</div>}
            </div>
          </div>
          <div className="nw-output-pane">
            <div className="nw-dock-tabs"><button className="active">Outputs <small>{previewArtifacts.length}</small></button><button onClick={()=>setSideTab('assets')}>Assets <small>{assets.length}</small></button><button aria-label="Close output panel" onClick={()=>setDockOpen(false)}><XMarkIcon/></button></div>
            <div className="nw-output-list">{previewArtifacts.length?previewArtifacts.map(a=><button key={a.id} className={activeArtifactId===a.id?'selected':''} onClick={()=>setActiveArtifactId(a.id)}>{a.url&&(a.kind==='image'||a.kind==='gif')?<img alt="" src={a.url}/>:<DocumentTextIcon/>}<span>{a.name}</span></button>):<div className="nw-no-output"><img src={OTHER} alt="Gallery artwork example"/><span>Generate to add real outputs</span></div>}</div>
          </div>
        </div>}
      </main>
      {inspectorOpen&&<><button className="nw-inspector-backdrop" aria-label="Close inspector" onClick={()=>setInspectorOpen(false)}/><aside className="nw-inspector" aria-label="Properties panel">
        <div className="nw-inspector-tabs">{(['properties','presets','assets'] as const).map(t=><button key={t} className={sideTab===t?'active':''} onClick={()=>setSideTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}<button aria-label="Close inspector" onClick={closeSide}><XMarkIcon/></button></div>
        <div className="nw-property-scroll">
          {sideTab==='properties'?(['canvas','background','document','effects','animation','export'] as const).map(section=><div className="nw-property-section" key={section}>
            <button type="button" className="nw-property-heading" aria-expanded={folds[section]} onClick={()=>fold(section)}><CubeIcon/>{section[0].toUpperCase()+section.slice(1)}<ChevronDownIcon/></button>
            {folds[section]&&<div className="nw-property-content">
              {section==='canvas'&&<><div className="nw-fields"><label>Display width<input type="number" min="200" max="4096" value={viewport.width} onChange={e=>setViewport(v=>({...v,width:clamp(Number(e.target.value)||200,200,4096)}))}/></label><label>Display height<input type="number" min="200" max="4096" value={viewport.height} onChange={e=>setViewport(v=>({...v,height:clamp(Number(e.target.value)||200,200,4096)}))}/></label></div><small>Viewport only; actual canvas size is set in the editor.</small></>}
              {section==='background'&&<><span>Reference colors</span><div className="nw-colorbar"/><p>To modify the actual background, edit the source or Visual canvas.</p></>}
              {section==='document'&&<><label>Workspace title<input value={projectTitle} onChange={e=>setProjectTitle(e.target.value)}/></label><label>Active mode<input value={mode} readOnly/></label></>}
              {section==='effects'&&<p>Use the existing Visual effects editor or the real Apexify.js API.</p>}
              {section==='animation'&&<p>Animated timeline controls are scheduled for WS-08.</p>}
              {section==='export'&&<button className="nw-run" disabled={!artifact?.url} onClick={download}><ArrowDownTrayIcon/>Download result</button>}
            </div>}
          </div>):sideTab==='presets'?<div className="nw-presets"><p>Preview presets</p>{[['HD',1280,720],['Full HD',1920,1080],['Square',1080,1080]].map(([label,w,h])=><button key={String(label)} onClick={()=>setViewport({width:Number(w),height:Number(h)})}>{label}</button>)}<small>Presets change preview framing, not the underlying rendered artifact.</small></div>:
          <div className="nw-presets">{assets.length?assets.map(a=><div key={a.id}>{a.name}</div>):'No session assets yet.'}</div>}
        </div>
        <div className="nw-resize-right" role="separator" aria-label="Resize inspector" onPointerDown={e=>beginResize('right',e)}/>
      </aside></>}
    </div>
    {cardsOpen&&<section className="nw-modes-preview" aria-label="Workspace layout presets">{gallery.map((g,i)=><button type="button" key={g.title} className={layout===g.layout?'selected':''} onClick={()=>changeLayout(g.layout)}><span className="nw-number">{i+1}</span><div><b>{g.title}</b><small>{g.desc}</small></div><img src={g.image} alt="Gallery illustration"/></button>)}<button className="nw-close-cards" aria-label="Hide showcase cards" title="Hide layout examples" onClick={()=>setCardsOpen(false)}><XMarkIcon/></button></section>}
  </div>;
}
export default function NeonWorkspaceStudio() {
  return <StudioSharedSessionProvider><WorkspaceBody/></StudioSharedSessionProvider>;
}
