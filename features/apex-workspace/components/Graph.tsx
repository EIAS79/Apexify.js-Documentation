"use client";
import { useEffect, useRef, useState } from "react";
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
import { validateDocument, type WorkspaceDocument } from "../model";
import { IconButton } from "./ui";
const kindIcons = {
  text: ChatBubbleBottomCenterTextIcon,
  image: PhotoIcon,
  shape: CubeIcon,
  chart: ChartBarIcon,
  path: CubeIcon,
  component: Square2StackIcon,
};
/** A derived graph of the real ordered composition. Nodes select the same visual layers. */
export default function Graph({
  document,
  selected,
  onSelect,
  preview,
  onRender,
  onDocument,
  onAdd,
  onError,
}: {
  document: WorkspaceDocument;
  selected: string | null;
  onSelect: (id: string | null) => void;
  preview: string | null;
  onRender: () => void;
  onDocument: (document: WorkspaceDocument) => void;
  onAdd: (kind: import("../model").WorkspaceLayer["kind"]) => void;
  onError: (message:string) => void;
}) {
  const [target,setTarget] = useState("");
  const [newKind,setNewKind] = useState<import("../model").WorkspaceLayer["kind"]>("text");
  const edges = document.graph?.edges ?? [];
  const connect = (from:string,to:string) => {
    if(!from||!to||from===to)return;
    try {const next=validateDocument({...document,graph:{edges:[...edges,{from,to}]}});onDocument(next);}catch(e){onError(e instanceof Error?e.message:"Invalid connection");}
  };
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(65);
  const height = Math.max(180, document.layers.length * 64 + 40);
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
    document.layers.forEach((l,i)=>{
      const incoming=edges.filter(e=>e.to===l.id);
      if(!incoming.length)link(115,height/2,170,i*64+54,l.visible?"#7eacd1":"#27374b");
      incoming.forEach(e=>{const index=document.layers.findIndex(l=>l.id===e.from);link(300,index*64+54,170,i*64+54,"#d49bff");});
      if(!edges.some(e=>e.from===l.id))link(300,i*64+54,368,height/2,l.visible?"#8ed7ca":"#27374b");
    });
    link(468, height / 2, 522, height / 2, "#55ffbf");
  }, [document, height]);
  return (
    <div className="aw-graph">
      <div className="aw-graph-toolbar">
        <div className="aw-zoom">
          <IconButton
            label="Zoom graph out"
            onClick={() => setZoom(Math.max(40, zoom - 20))}
          >
            <MinusIcon />
          </IconButton>
          <span>{zoom}%</span>
          <IconButton
            label="Zoom graph in"
            onClick={() => setZoom(Math.min(160, zoom + 20))}
          >
            <PlusIcon />
          </IconButton>
        </div>
        <select aria-label="New graph node type" value={newKind} onChange={e=>setNewKind(e.target.value as typeof newKind)}>{["text","shape","image","path","chart","component"].map(k=><option key={k}>{k}</option>)}</select>
        <button className="aw-button aw-small" onClick={()=>onAdd(newKind)}>Add node</button>
        <button className="aw-button aw-run-graph" onClick={onRender}>
          <PlayIcon />
          Run Graph
        </button>
      </div>
      <div className="aw-graph-scroll">
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
                  draggable
                  onDragStart={e=>e.dataTransfer.setData("application/apexify-node",layer.id)}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();connect(e.dataTransfer.getData("application/apexify-node"),layer.id);}}
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
      <div className="aw-graph-authoring">
        {selected ? <>
          <label>Connect selected node to <select aria-label="Graph connection target" value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose a node</option>{document.layers.filter(l=>l.id!==selected).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
          <button className="aw-button aw-small" disabled={!target} onClick={()=>connect(selected,target)}>Connect</button>
          <button className="aw-text-button" onClick={()=>onDocument({...document,layers:document.layers.filter(l=>l.id!==selected),graph:{edges:edges.filter(e=>e.from!==selected&&e.to!==selected)}})}>Delete node</button>
        </> : <span>Select a node to edit, connect or delete it. Drag one node onto another to connect.</span>}
        {edges.map(e=><button className="aw-edge-chip" key={JSON.stringify(e)} aria-label={`Remove connection ${e.from} to ${e.to}`} onClick={()=>onDocument({...document,graph:{edges:edges.filter(x=>x!==e)}})}>{document.layers.find(l=>l.id===e.from)?.name} → {document.layers.find(l=>l.id===e.to)?.name} ×</button>)}
      </div>
    </div>
  );
}
