"use client";
import { useEffect, useMemo } from "react";
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap, Handle,
  Position, MarkerType, useNodesState, type Node, type NodeProps,
  type Edge, type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { WorkspaceDocument } from "../model";
import { canvasGraphPortId, type CanvasGraph, type CanvasGraphPortType } from "../canvas-graph";

import {useTheme} from '@/components/ThemeProvider';

type PortView = { id: string; type: CanvasGraphPortType };
type StudioData = Record<string, unknown> & {
  label: string; kind: string; detail: string; inputs: PortView[]; outputs: PortView[];
  preview?: string | null; dimmed?: boolean;
};
type StudioNode = Node<StudioData, "studio">;
const tones: Record<CanvasGraphPortType, string> = {
  canvas:'var(--success)', background:'var(--accent-iris)', 'image-asset':'var(--accent-iris)',
  'image-mask':'var(--accent-magenta)', 'group-transform':'var(--accent-magenta)',
  color:'var(--accent-amber)',gradient:'var(--accent-magenta)',pattern:'var(--accent-magenta)',
  'ordered-layer':'var(--text-secondary)',stroke:'var(--accent-amber)',shadow:'var(--accent-magenta)',
};
const nodeTypes = { studio: FlowCard };

function FlowCard({data,selected}:NodeProps<StudioNode>) {
  return <div className={"aw-flow-card aw-flow-kind-"+data.kind+(selected?" is-selected":"")+(data.dimmed?" is-dimmed":"")}>
    <div className="aw-flow-card-header">
      <span className="aw-flow-card-icon" aria-hidden="true">{data.kind==="output"?"↗":data.kind==="canvas"?"▣":data.kind==="image"?"▧":data.kind==="effect"?"✦":"◇"}</span>
      <span className="aw-flow-card-title">{data.label}</span>
      <span className="aw-flow-kind-label">{data.kind}</span>
    </div>
    <p className="aw-flow-card-detail" title={data.detail}>{data.detail}</p>
    {data.preview?<img className="aw-flow-card-preview" alt="Current canvas output preview" src={data.preview}/>:null}
    <div className="aw-flow-ports">
      <div className="aw-flow-port-column">
        {data.inputs.map((port,i)=><div className="aw-flow-port aw-flow-port-in" key={port.id}>
          <Handle type="target" position={Position.Left} id={port.id} title={"Input: "+port.type}
            style={{top: 75+i*27,background:tones[port.type]}}/>
          <span title={port.type}>{port.type}</span>
        </div>)}
      </div>
      <div className="aw-flow-port-column aw-flow-port-outputs">
        {data.outputs.map((port,i)=><div className="aw-flow-port aw-flow-port-out" key={port.id}>
          <span title={port.type}>{port.type}</span>
          <Handle type="source" position={Position.Right} id={port.id} title={"Output: "+port.type}
            style={{top:75+i*27,background:tones[port.type]}}/>
        </div>)}
      </div>
    </div>
  </div>;
}

function generate(graph:CanvasGraph, document:WorkspaceDocument,preview:string|null): {nodes:StudioNode[];edges:Edge[]} {
  const map = new Map(graph.nodes.map(node=>[node.id,node]));
  const rank = new Map(graph.nodes.map(node=>[node.id,0]));
  for(let i=0;i<graph.nodes.length;i++) {
    for(const edge of graph.edges) rank.set(edge.to,Math.max(rank.get(edge.to)??0,(rank.get(edge.from)??0)+1));
  }
  const byRank = new Map<number,string[]>();
  graph.nodes.forEach(node=>{
    const level=rank.get(node.id)??0;
    byRank.set(level,[...(byRank.get(level)??[]),node.id]);
  });
  const nodes:StudioNode[]=graph.nodes.map(node=>{
    const level=rank.get(node.id)??0;
    const index=(byRank.get(level)??[]).indexOf(node.id);
    const related=graph.ports.filter(port=>port.nodeId===node.id);
    return {
      id:node.id,type:"studio",position:{x:35+level*315,y:42+index*190},
      draggable:true,
      data:{
        label:node.name, kind:node.kind,
        detail:node.id==="canvas:root"?document.width+" × "+document.height+" • active composition":
          node.id==="canvas:output"?"Apexify PNG render":node.kind==="image"?"Verified local asset":node.name,
        preview:node.kind==="output"?preview:null,
        inputs:related.filter(p=>p.direction==="input").map(p=>({id:p.id,type:p.type})),
        outputs:related.filter(p=>p.direction==="output").map(p=>({id:p.id,type:p.type})),
      }
    };
  });
  // Non-image scene layers must remain visible and selectable, even when they have no editable typed graph port.
  const existingLayers=new Set(graph.nodes.filter(n=>n.id.startsWith("canvas:image-layer:")).map(n=>n.id.slice("canvas:image-layer:".length)));
  const nonImageLayers=document.layers.filter(layer=>!existingLayers.has(layer.id));
  const visualY=Math.max(42,...nodes.map(n=>n.position.y))+195;
  nonImageLayers.forEach((layer,i)=>{
    const id="visual:layer:"+layer.id;
    nodes.push({id,type:"studio",position:{x:350,y:visualY+i*150},data:{
      label:layer.name,kind:layer.kind,detail:"Composition layer • "+(layer.visible?"visible":"hidden"),
      inputs:[],outputs:[],dimmed:!layer.visible
    }});
  });
  const edges:Edge[]=graph.edges.map(edge=>({
    id:edge.id,source:edge.from,target:edge.to,
    sourceHandle:canvasGraphPortId(edge.from,"output",edge.type),
    targetHandle:canvasGraphPortId(edge.to,"input",edge.type),
    type:"smoothstep",animated:false,
    style:{stroke:tones[edge.type],strokeWidth:2,opacity:.85},
    markerEnd:{type:MarkerType.ArrowClosed,color:tones[edge.type],width:13,height:13}
  }));
  return {nodes,edges};
}

export default function CanvasGraphFlow({graph,document,selected,preview,onSelect,onConnect,onDisconnect}:{
  graph:CanvasGraph;document:WorkspaceDocument;selected:string|null;preview:string|null;
  onSelect:(id:string|null)=>void;onConnect:(sourceHandle:string,targetHandle:string)=>void;
  onDisconnect:(targetHandle:string)=>void;
}) {
  const {theme}=useTheme();
  const generated=useMemo(()=>generate(graph,document,preview),[graph,document,preview]);
  const [nodes,setNodes,onNodesChange]=useNodesState<StudioNode>(generated.nodes);
  useEffect(()=>{
    setNodes(previous=>{
      const positions=new Map(previous.map(n=>[n.id,n.position]));
      return generated.nodes.map(n=>({
        ...n,
        position:positions.get(n.id)??n.position,
        selected:selected
          ? n.id==="canvas:image-layer:"+selected || n.id==="visual:layer:"+selected
          : n.id==="canvas:root"
      }));
    });
  },[generated,selected,setNodes]);
  const isValidConnection=(connection:Connection|Edge)=>{
    const source=graph.ports.find(p=>p.id===connection.sourceHandle && p.direction==="output");
    const target=graph.ports.find(p=>p.id===connection.targetHandle && p.direction==="input");
    return !!source&&!!target&&source.type===target.type&&source.nodeId!==target.nodeId;
  };
  return <div className="aw-graph-flow" role="region" aria-label="Interactive canvas node graph">
    <div className="aw-flow-hint">Drag to pan · Scroll to zoom · Connect matching ports</div>
    <ReactFlow<StudioNode,Edge>
      nodes={nodes} edges={generated.edges} nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={(_event,node)=>{
        if(node.id.startsWith("canvas:image-layer:"))onSelect(node.id.slice("canvas:image-layer:".length));
        else if(node.id.startsWith("visual:layer:"))onSelect(node.id.slice("visual:layer:".length));
        else onSelect(null);
      }}
      onConnect={connection=>{
        if(connection.sourceHandle&&connection.targetHandle)
          onConnect(connection.sourceHandle,connection.targetHandle);
      }}
      isValidConnection={isValidConnection}
      onEdgeDoubleClick={(_event,edge)=>{if(edge.targetHandle)onDisconnect(edge.targetHandle);}}
      nodesConnectable edgesFocusable panOnDrag zoomOnScroll zoomOnPinch
      defaultViewport={{x:-430,y:15,zoom:.8}} minZoom={.25} maxZoom={2}
      colorMode={theme} proOptions={{hideAttribution:true}}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--border-default)"/>
      <Controls showInteractive={false} position="bottom-left"/>
      <MiniMap pannable zoomable nodeColor="var(--accent-iris)" maskColor="var(--bg-overlay)" position="bottom-right"/>
    </ReactFlow>
    <span className="aw-flow-count">{graph.nodes.length+nonEditableLayerCount(document,graph)} nodes · {graph.edges.length} typed connections</span>
  </div>;
}
function nonEditableLayerCount(document:WorkspaceDocument,graph:CanvasGraph):number{
  const present=new Set(graph.nodes.filter(n=>n.id.startsWith("canvas:image-layer:")).map(n=>n.id.slice("canvas:image-layer:".length)));
  return document.layers.filter(layer=>!present.has(layer.id)).length;
}
