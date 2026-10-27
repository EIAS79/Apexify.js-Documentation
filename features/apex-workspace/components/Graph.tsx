"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PlayIcon,
  MinusIcon,
  PlusIcon,
  Square2StackIcon,
  PhotoIcon,
  ChatBubbleBottomCenterTextIcon,
  CubeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceDocument } from "../model";
import type { CanvasExtras } from "../canvas-options";
import {projectCanvasGraph,editCanvasGraph,editCanvasGraphDocument,canvasGraphPortId} from '../canvas-graph';
import { IconButton, NumberField } from "./ui";
import {CanvasBlendModes,CanvasImageAlignModes} from "../canvas-options";
import {GradientControls,PatternControls} from './CanvasNestedControls';
import {StrokeControls,ShadowControls} from './CanvasEffectsEditor';
import ImageOptionsEditor,{GroupTransformEditor} from './ImageOptionsEditor';
import {CanvasFiltersEditor} from './CanvasFiltersEditor';
import {validateCanvasExtras} from '../canvas-options';
import TextOptionsEditor from './TextOptionsEditor';
const kindIcons = {
  text: ChatBubbleBottomCenterTextIcon,
  image: PhotoIcon,
  shape: CubeIcon,
  chart: ChartBarIcon,
};
/** A derived graph of the real ordered composition. Nodes select the same visual layers. */
export default function Graph({
  document,
  selected,
  onSelect,
  preview,
  onRender,
  onCanvas,
  onDocument,
}: {
  document: WorkspaceDocument;
  selected: string | null;
  onSelect: (id: string | null) => void;
  preview: string | null;
  onRender: () => void;
  onCanvas: (options:CanvasExtras)=>void;
  onDocument:(document:WorkspaceDocument)=>void;
}) {
  const graph=projectCanvasGraph(document);
  const [sourcePort,setSourcePort]=useState('');
  const [targetPort,setTargetPort]=useState('');
  const [wiringError,setWiringError]=useState('');
  const outputPorts=graph.ports.filter(p=>p.direction==='output');
  const inputPorts=graph.ports.filter(p=>p.direction==='input');
  function applyConnection(op:'connect'|'disconnect'){
    try{
      const target=targetPort||inputPorts.find(p=>p.type==='image-asset')?.id;
      if(!target)throw new Error('Select an existing typed input port');
      // Image source, image mask and group ports operate on canonical Workspace layers.
      const selectedTarget=graph.ports.find(p=>p.id===target);
      if(selectedTarget?.nodeId.startsWith('canvas:image-layer:')){
        const layerId=selectedTarget.nodeId.slice('canvas:image-layer:'.length);
        const layer=document.layers.find(l=>l.id===layerId);
        if(!layer||!(layer.kind==='image'||layer.kind==='shape'))throw Error('Stale image graph destination');
        const sourceNode=graph.ports.find(p=>p.id===sourcePort&&p.direction==='output');
        if(op==='connect'&&(!sourceNode||sourceNode.type!==selectedTarget.type))throw Error('Typed image port mismatch');
        const assetId=sourceNode?.nodeId.startsWith('canvas:image:')?sourceNode.nodeId.slice('canvas:image:'.length):'';
        if(op==='connect'&&selectedTarget.type!=='group-transform'&&!document.assets?.some(a=>a.id===assetId))
          throw Error('Image port is not a verified local asset');
        if(selectedTarget.type==='image-asset'){
          if(layer.kind!=='image')throw Error('Shape sources are procedural and cannot connect an image');
          onDocument({...document,layers:document.layers.map(l=>l.id===layerId?{...l,source:op==='disconnect'?'/workspace/assets/crystal-lake.webp':assetId}:l)});
        }else if(selectedTarget.type==='image-mask'){
          if(op==='disconnect')onDocument({...document,layers:document.layers.map(l=>l.id===layerId?{...l,imageOptions:{...layer.imageOptions,mask:undefined}}:l)});
          else onDocument({...document,layers:document.layers.map(l=>l.id===layerId?{...l,imageOptions:{...layer.imageOptions,mask:{source:assetId,mode:'alpha'}}}:l)});
        }else if(selectedTarget.type==='group-transform'){
          const id=sourceNode?.nodeId.slice('canvas:image-group:'.length)??'';
          if(op==='connect'&&!(document.imageGroups??[]).some(g=>g.id===id))throw Error('Group port is no longer available');
          onDocument({...document,layers:document.layers.map(l=>l.id===layerId?{...l,imageGroupId:op==='disconnect'?undefined:id}:l)});
        }else throw Error('Unsupported image graph port');
        setWiringError('');return;
      }
      const colorPort=canvasGraphPortId('canvas:background','input','color');
      if(target===colorPort){
        if(op==='disconnect')onDocument(editCanvasGraphDocument(document,{op:'disconnect-color',toPort:target}));
        else onDocument(editCanvasGraphDocument(document,{op:'connect-color',fromPort:sourcePort,toPort:target}));
        setWiringError('');return;
      }
      const value=op==='connect'?
        editCanvasGraph(document,{op:'connect',fromPort:sourcePort,toPort:target}):
        editCanvasGraph(document,{op:'disconnect',toPort:target});
      onCanvas(value);setWiringError('');
    }catch(e){setWiringError(e instanceof Error?e.message:'Invalid graph connection');}
  }
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(65);
  const viewportRef = useRef<HTMLDivElement>(null);
  const manualZoomRef = useRef(false);
  const height = Math.max(180, document.layers.length * 64 + 40);
  const fitGraph = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const availableWidth = Math.max(240, viewport.clientWidth - 32);
    const availableHeight = Math.max(170, viewport.clientHeight - 24);
    const fit = Math.round(Math.min(availableWidth / 650, availableHeight / height) * 100);
    setZoom(Math.max(55, Math.min(180, fit)));
  }, [height]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => { if (!manualZoomRef.current) fitGraph(); });
    observer.observe(viewport);
    fitGraph();
    return () => observer.disconnect();
  }, [fitGraph]);
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.current!.width = 650 * dpr;
    canvas.current!.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 650, height);
    const link = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + 45, y1, x2 - 45, y2, x2, y2);
      ctx.stroke();
    };
    document.layers.forEach((l, i) => {
      link(
        115,
        height / 2,
        170,
        i * 64 + 54,
        l.visible ? "#7eacd1" : "#27374b",
      );
      link(
        300,
        i * 64 + 54,
        368,
        height / 2,
        l.visible ? "#8ed7ca" : "#27374b",
      );
    });
    link(468, height / 2, 522, height / 2, "#55ffbf");
  }, [document.layers, height]);
  return (
    <div className="aw-graph">
      <div className="aw-graph-toolbar">
        <div className="aw-zoom">
          <IconButton
            label="Zoom graph out"
            onClick={() => { manualZoomRef.current = true; setZoom(Math.max(40, zoom - 20)); }}
          >
            <MinusIcon />
          </IconButton>
          <span>{zoom}%</span>
          <IconButton
            label="Zoom graph in"
            onClick={() => { manualZoomRef.current = true; setZoom(Math.min(180, zoom + 20)); }}
          >
            <PlusIcon />
          </IconButton>
        </div>
        <button type="button" className="aw-graph-fit" aria-label="Fit graph to view"
          onClick={() => { manualZoomRef.current = false; fitGraph(); }}>Fit view</button>
        <details className="aw-graph-inputs">

          <summary>Inputs & assets</summary>

          <div className="aw-graph-input-grid">

          <label className="aw-value">Canvas input
          <select aria-label="Canvas graph background gradient" value={document.canvasExtras?.gradientBg?.type??'none'}
            onChange={event=>{
              const type=event.target.value as 'none'|'linear'|'radial'|'conic';
              const current=document.canvasExtras??{};
              const updated={...current};
              if(type==='none')delete updated.gradientBg;
              else {updated.gradientBg={type,colors:current.gradientBg?.colors??[{stop:0,color:'#221160'},{stop:1,color:'#006ca8'}]};delete updated.customBg;}
              onCanvas(updated);
            }}>
            <option value="none">Background data</option>
            <option value="linear">Linear node</option>
            <option value="radial">Radial node</option>
            <option value="conic">Conic node</option>
          </select>
        </label>
        <button type="button" className="aw-text-button"
          aria-label="Toggle canvas graph noise input"
          onClick={()=>onCanvas(editCanvasGraph(document,{op:'noise',value:document.canvasExtras?.noiseBg?null:{intensity:0.08}}))}>
          Noise input: {document.canvasExtras?.noiseBg?'on':'off'}
        </button>
        <label className="aw-value">Typed image source port
          <select aria-label="Graph connect canvas image asset" value={document.canvasExtras?.customBg?.source??'none'}
            onChange={event=>onCanvas(editCanvasGraph(document,{op:'source',assetId:event.target.value==='none'?null:event.target.value}))}>
            <option value="none">Unconnected</option>
            {(document.assets??[]).map(asset=><option key={asset.id} value={asset.id}>
              Image · {asset.sha256.slice(0,10)} · {asset.width}×{asset.height}
            </option>)}
          </select>
        </label>
        <label className="aw-value">Typed pattern image port
          <select aria-label="Graph connect pattern asset"
            value={document.canvasExtras?.patternBg?.type==='custom'?document.canvasExtras.patternBg.customPatternImage:'none'}
            onChange={event=>onCanvas(editCanvasGraph(document,{op:'pattern-source',
              assetId:event.target.value==='none'?null:event.target.value}))}>
            <option value="none">Unconnected</option>
            {(document.assets??[]).map(asset=><option key={asset.id} value={asset.id}>
              Pattern asset · {asset.sha256.slice(0,10)}
            </option>)}
          </select>
        </label>
        </div></details>
         <button className="aw-button aw-run-graph" onClick={onRender}>
          <PlayIcon />
          Run Graph
        </button>
      </div>
      <details className="aw-graph-wiring" aria-label="Typed canvas graph wiring">
        <summary>Connect / disconnect typed node ports</summary>
        <p className="aw-muted">Graph ports are derived from the saved canvas and SHA-256 assets; connections update the same project as Visual and Code.</p>
        <div className="aw-field-row">
          <label className="aw-value">Solid background color
            <input aria-label="Graph solid background color" type="color" value={document.background.color.slice(0,7)}
              onChange={e=>{
                try{onDocument(editCanvasGraphDocument(document,{op:'set-color',color:e.target.value}));setWiringError('');}
                catch(error){setWiringError(error instanceof Error?error.message:'Invalid solid background');}
              }}/>
          </label>
          <label className="aw-value">Transparent background
            <input aria-label="Graph transparent canvas" type="checkbox"
              checked={document.background.mode==='color'&&document.background.transparent}
              onChange={e=>onDocument(editCanvasGraphDocument(document,{op:'transparent',enabled:e.target.checked}))}/>
          </label>
        </div>
        <div className="aw-field-row">
          <label className="aw-value">Output port
            <select aria-label="Graph output port" value={sourcePort}
              onChange={e=>{setSourcePort(e.target.value);setWiringError('');}}>
              <option value="">Select source output</option>
              {outputPorts.map(port=><option key={port.id} value={port.id}>
                {graph.nodes.find(n=>n.id===port.nodeId)?.name}: {port.type}
              </option>)}
            </select>
          </label>
          <label className="aw-value">Input port
            <select aria-label="Graph input port" value={targetPort}
              onChange={e=>{setTargetPort(e.target.value);setWiringError('');}}>
              <option value="">Select destination input</option>
              {inputPorts.map(port=><option key={port.id} value={port.id}>
                {graph.nodes.find(n=>n.id===port.nodeId)?.name}: {port.type}
              </option>)}
            </select>
          </label>
          <button type="button" className="aw-button" disabled={!sourcePort||!targetPort}
            onClick={()=>applyConnection('connect')}>Connect graph ports</button>
          <button type="button" className="aw-text-button" disabled={!targetPort}
            onClick={()=>applyConnection('disconnect')}>Disconnect input port</button>
        </div>
        {wiringError?<p role="alert" className="aw-muted">{wiringError}</p>:null}
        <div aria-label="Active typed canvas graph connections" className="aw-graph-connections">
          {graph.edges.map(edge=><div key={edge.id} data-graph-edge={edge.id}>
            {graph.nodes.find(n=>n.id===edge.from)?.name??edge.from}
            {' → '}
            {graph.nodes.find(n=>n.id===edge.to)?.name??edge.to}
            {' · '+edge.type+(edge.order===undefined?'':' · layer '+(edge.order+1))}
          </div>)}
        </div>
      </details>
      <details className="aw-graph-semantic-properties">
        <summary>Editable typed canvas property ports</summary>
        {document.canvasExtras?.patternBg?<PatternControls id="Graph root" pattern={document.canvasExtras.patternBg}
          assets={document.assets??[]} onChange={value=>onCanvas(editCanvasGraph(document,{op:'root-pattern',value}))}/>:null}
        {document.canvasExtras?.gradientBg?<GradientControls id="Graph root" gradient={document.canvasExtras.gradientBg}
          onChange={value=>onCanvas(editCanvasGraph(document,{op:'gradient',value}))}/>:null}
        <div className="aw-field-row" aria-label="Graph canvas zoom and noise numeric properties">
          <NumberField label="Graph zoom scale" value={document.canvasExtras?.zoom?.scale??1}
            min={0.05} max={16} step={0.05} onChange={scale=>onCanvas(editCanvasGraph(document,{op:'zoom',
              value:{...document.canvasExtras?.zoom,scale}}))}/>
          <NumberField label="Graph zoom center X" value={document.canvasExtras?.zoom?.centerX??document.width/2}
            min={-8192} max={8192} onChange={centerX=>onCanvas(editCanvasGraph(document,{op:'zoom',
              value:{...document.canvasExtras?.zoom,centerX}}))}/>
          <NumberField label="Graph zoom center Y" value={document.canvasExtras?.zoom?.centerY??document.height/2}
            min={-8192} max={8192} onChange={centerY=>onCanvas(editCanvasGraph(document,{op:'zoom',
              value:{...document.canvasExtras?.zoom,centerY}}))}/>
          {document.canvasExtras?.noiseBg?<NumberField label="Graph noise intensity"
            value={document.canvasExtras.noiseBg.intensity??0.05} min={0} max={1} step={0.01}
            onChange={intensity=>onCanvas(editCanvasGraph(document,{op:'noise',value:{intensity}}))}/>:null}
        </div>
        <div className="aw-field-row" aria-label="Graph canvas scalar values">
          <label className="aw-value">Root canvas compositing
            <select aria-label="Graph canvas root blend mode" value={document.canvasExtras?.blendMode??'source-over'}
              onChange={e=>onCanvas(editCanvasGraph(document,{op:'canvas-blend',value:e.target.value as typeof CanvasBlendModes[number]}))}>
              {CanvasBlendModes.map(mode=><option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
          <NumberField label="Graph canvas opacity" value={document.canvasExtras?.opacity??1} min={0} max={1} step={0.05}
            onChange={value=>onCanvas(editCanvasGraph(document,{op:'canvas-opacity',value}))}/>
        </div>
        {document.canvasExtras?.customBg?<div className="aw-field-row" aria-label="Graph verified root image placement">
          <label className="aw-value">Use intrinsic image dimensions
            <input aria-label="Graph root image intrinsic dimensions" type="checkbox"
              checked={document.canvasExtras.customBg.inherit??false}
              onChange={e=>onCanvas(editCanvasGraph(document,{op:'image-layout',target:'root',inherit:e.target.checked}))}/>
          </label>
          <NumberField label="Graph root image opacity" value={document.canvasExtras.customBg.opacity??1} min={0} max={1} step={0.05}
            onChange={value=>onCanvas(editCanvasGraph(document,{op:'root-image-opacity',value}))}/>
          <label className="aw-value">Root image fit
            <select aria-label="Graph root image fit" disabled={document.canvasExtras.customBg.inherit} value={document.canvasExtras.customBg.fit??'fill'}
              onChange={e=>onCanvas(editCanvasGraph(document,{op:'image-layout',target:'root',fit:e.target.value as 'fill'|'contain'|'cover'}))}>
              {(['fill','contain','cover'] as const).map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="aw-value">Root image alignment
            <select aria-label="Graph root image alignment" disabled={document.canvasExtras.customBg.inherit} value={document.canvasExtras.customBg.align??'center'}
              onChange={e=>onCanvas(editCanvasGraph(document,{op:'image-layout',target:'root',align:e.target.value as typeof CanvasImageAlignModes[number]}))}>
              {CanvasImageAlignModes.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        </div>:null}
        {document.canvasExtras?.customBg?<CanvasFiltersEditor
          filters={document.canvasExtras.customBg.filters??[]}
          disabled={!document.assets?.some(a=>a.id===document.canvasExtras?.customBg?.source&&a.dataUri.length<=16_384)||
            document.width>1024||document.height>1024||document.width*document.height>1_048_576}
          onChange={filters=>onCanvas(validateCanvasExtras({...document.canvasExtras,
            customBg:{...document.canvasExtras!.customBg!,filters}}))}/>:null}
        <StrokeControls id="Graph" value={document.canvasExtras?.stroke}
          onChange={value=>onCanvas(editCanvasGraph(document,{op:'stroke',value:value??null}))}/>
        <ShadowControls id="Graph" ownerRadius={document.canvasExtras?.borderRadius??0} value={document.canvasExtras?.shadow}
          onChange={value=>onCanvas(editCanvasGraph(document,{op:'shadow',value:value??null}))}/>
        {(document.canvasExtras?.bgLayers??[]).map((layer,index)=><details key={index}>
          <summary>Ordered layer {index+1}: {layer.type}</summary>
          <label className="aw-value">Layer compositing
            <select aria-label={'Graph layer '+(index+1)+(layer.type==='presetPattern'?' layer compositing':' blend')} value={layer.blendMode??'source-over'}
              onChange={e=>onCanvas(editCanvasGraph(document,{op:'layer-blend',index,value:e.target.value as typeof CanvasBlendModes[number]}))}>
              {CanvasBlendModes.map(mode=><option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
          <div className="aw-field-row" aria-label={'Graph layer '+(index+1)+' scalar values'}>
            {layer.type==='noise'?<NumberField label={'Graph layer '+(index+1)+' noise intensity'} value={layer.intensity??0.05}
              min={0} max={1} step={0.05}
              onChange={value=>onCanvas(editCanvasGraph(document,{op:'layer-noise-intensity',index,value}))}/>:
              <NumberField label={'Graph layer '+(index+1)+(layer.type==='presetPattern'?' layer opacity':' opacity')} value={layer.opacity??1}
                min={0} max={1} step={0.05}
                onChange={value=>onCanvas(editCanvasGraph(document,{op:'layer-opacity',index,value}))}/>}
          </div>
          {layer.type==='image'?<div className="aw-field-row" aria-label={'Graph layer '+(index+1)+' image placement'}>
            <label className="aw-value">Image fit
              <select aria-label={'Graph layer '+(index+1)+' fit'} value={layer.fit??'fill'}
                onChange={e=>onCanvas(editCanvasGraph(document,{op:'image-layout',target:'layer',index,fit:e.target.value as 'fill'|'contain'|'cover'}))}>
                {(['fill','contain','cover'] as const).map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="aw-value">Image alignment
              <select aria-label={'Graph layer '+(index+1)+' align'} value={layer.align??'center'}
                onChange={e=>onCanvas(editCanvasGraph(document,{op:'image-layout',target:'layer',index,align:e.target.value as typeof CanvasImageAlignModes[number]}))}>
                {CanvasImageAlignModes.map(v=><option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          </div>:null}
          {layer.type==='image'||layer.type==='pattern'?<label className="aw-value">
            Source image asset port
            <select aria-label={'Graph layer '+(index+1)+' asset connection'} value={layer.source}
              onChange={e=>onCanvas(editCanvasGraph(document,{op:'layer-source',index,assetId:e.target.value}))}>
              {(document.assets??[]).map(asset=><option key={asset.id} value={asset.id}>
                Asset {asset.sha256.slice(0,12)}
              </option>)}
            </select>
          </label>:null}
          {layer.type==='presetPattern'?<PatternControls id={'Graph layer '+(index+1)} pattern={layer.pattern}
            assets={document.assets??[]} onChange={value=>onCanvas(editCanvasGraph(document,{op:'layer-pattern',index,value}))}/>:null}
          {layer.type==='gradient'?<GradientControls id={'Graph layer '+(index+1)} gradient={layer.value}
            onChange={value=>onCanvas(editCanvasGraph(document,{op:'layer-gradient',index,value}))}/>:null}
          <button type="button" className="aw-text-button" disabled={index===0}
            onClick={()=>onCanvas(editCanvasGraph(document,{op:'layer-order',from:index,to:index-1}))}>Move layer up</button>
          <button type="button" className="aw-text-button" disabled={index===(document.canvasExtras?.bgLayers?.length??0)-1}
            onClick={()=>onCanvas(editCanvasGraph(document,{op:'layer-order',from:index,to:index+1}))}>Move layer down</button>
        </details>)}
      </details>
      {(()=>{
        const layer=document.layers.find(l=>l.id===selected);
        if(!layer||(layer.kind!=='image'&&layer.kind!=='shape'))return null;
        const imageGroup=(document.imageGroups??[]).find(g=>g.id===layer.imageGroupId);
        return <details className="aw-graph-semantic-properties" aria-label="Selected image graph node properties">
        <summary>Selected createImage node · {layer.name}</summary>
        {layer.kind==='image'&&<label className="aw-value">Image source connection
          <select aria-label="Graph image layer asset" value={layer.source}
            onChange={e=>onDocument({...document,layers:document.layers.map(l=>l.id===layer.id?{...l,source:e.target.value}:l)})}>
            <option value="/workspace/assets/crystal-lake.webp">Bundled artwork</option>
            {(document.assets??[]).map(a=><option key={a.id} value={a.id}>SHA-256 {a.sha256.slice(0,12)}</option>)}
          </select></label>}
        <ImageOptionsEditor options={layer.imageOptions??{}} width={layer.width} height={layer.height}
          isShape={layer.kind==='shape'} shapeType={layer.kind==='shape'?layer.shape:undefined} assets={document.assets??[]}
          onError={s=>setWiringError(s)}
          onAsset={asset=>onDocument({...document,
            assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
            layers:document.layers.map(l=>l.id===layer.id?{...l,imageOptions:{...layer.imageOptions,mask:{source:asset.id,mode:'alpha'}}}:l)})}
          onChange={imageOptions=>onDocument({...document,layers:document.layers.map(l=>l.id===layer.id?{...l,imageOptions}:l)})}/>
        <label className="aw-value">Group transform port
          <select aria-label="Graph image group" value={layer.imageGroupId??''}
            onChange={e=>onDocument({...document,layers:document.layers.map(l=>l.id===layer.id?{...l,imageGroupId:e.target.value||undefined}:l)})}>
            <option value="">Ungrouped</option>
            {(document.imageGroups??[]).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select></label>
        {imageGroup&&<GroupTransformEditor value={imageGroup.transform} width={document.width} height={document.height} assets={document.assets??[]}
          onError={setWiringError}
          onAsset={asset=>onDocument({...document,
            assets:document.assets?.some(a=>a.id===asset.id)?document.assets:[...(document.assets??[]),asset],
            imageGroups:(document.imageGroups??[]).map(g=>g.id===imageGroup.id?{...g,transform:{...g.transform,mask:{source:asset.id,mode:'alpha'}}}:g)})}
          onChange={transform=>onDocument({...document,imageGroups:(document.imageGroups??[]).map(g=>g.id===imageGroup.id?{...g,transform}:g)})}/>}
        </details>;
      })()}
      <div className="aw-graph-scroll" ref={viewportRef}>
        <div
          style={{ width: (650 * zoom) / 100, height: (height * zoom) / 100 }}
        >
          <div
            className="aw-graph-stage"
            style={{ width: 650, height, transform: `scale(${zoom / 100})` }}
          >
            <canvas
              ref={canvas}
              style={{ width: 650, height }}
              aria-hidden="true"
            />
            <button
              className="aw-graph-node aw-node-canvas"
              style={{ left: 10, top: height / 2 - 27 }}
              onClick={() => onSelect(null)}
            >
              <strong>
                <Square2StackIcon />
                Canvas
              </strong>
              <span>
                {document.width} × {document.height}
              </span>
            </button>
            {document.layers.map((layer, i) => {
              const Icon = kindIcons[layer.kind];
              return (
                <button
                  key={layer.id}
                  className={`aw-graph-node aw-node-${layer.kind}${selected === layer.id ? " selected" : ""}${!layer.visible ? " aw-node-hidden" : ""}`}
                  style={{ left: 170, top: i * 64 + 27 }}
                  onClick={() => onSelect(layer.id)}
                >
                  <strong>
                    <Icon />
                    {layer.kind[0].toUpperCase() + layer.kind.slice(1)}
                  </strong>
                  <span>{layer.name}</span>
                </button>
              );
            })}
            <div
              className="aw-graph-node aw-node-composite"
              style={{ left: 368, top: height / 2 - 27 }}
            >
              <strong>
                <Square2StackIcon />
                Composite
              </strong>
              <span>
                Ordered · {document.layers.filter((l) => l.visible).length}{" "}
                layers
              </span>
            </div>
            <div
              className="aw-graph-node aw-node-output"
              style={{ left: 522, top: height / 2 - 43 }}
            >
              <strong>
                <PhotoIcon />
                Output
              </strong>
              {preview ? (
                <img src={preview} alt="Current graph render" />
              ) : (
                <span>Awaiting render</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="aw-graph-caption">
        Shared composition · typed nodes: {graph.nodes.length} · connected ports: {graph.edges.length}
        {(document.canvasExtras?.bgLayers??[]).map((layer,index)=>
          <div key={index} className="aw-field-row">
            <span>Layer input {index+1}: {layer.type}</span>
            <button type="button" aria-label={'Graph move layer '+(index+1)+' up'}
              disabled={index===0} onClick={()=>onCanvas(editCanvasGraph(document,{op:'layer-order',from:index,to:index-1}))}>↑</button>
            <button type="button" aria-label={'Graph move layer '+(index+1)+' down'}
              disabled={index===(document.canvasExtras?.bgLayers??[]).length-1}
              onClick={()=>onCanvas(editCanvasGraph(document,{op:'layer-order',from:index,to:index+1}))}>↓</button>
          </div>)}
      </div>
      {document.layers.map(layer=>layer.id===selected&&layer.kind==='text'?(
        <TextOptionsEditor key={layer.id} layer={layer} compact
          onChange={textSettings=>onDocument({...document,layers:document.layers.map(item=>
            item.id===layer.id?{...layer,textSettings}:item)})}
          onBounds={(width,height)=>onDocument({...document,layers:document.layers.map(item=>
            item.id===layer.id?{...layer,width,height}:item)})}/>
      ):null)}
    </div>
  );
}
