"use client";
import { useRef, useState } from "react";
import {
  Square2StackIcon,
  PhotoIcon,
  ChatBubbleBottomCenterTextIcon,
  CubeIcon,
  ChartBarIcon,
  FolderIcon,
  MusicalNoteIcon,
  FilmIcon,
  SparklesIcon,
  Squares2X2Icon,
  DocumentIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceDocument, WorkspaceLayer } from "../model";
import {importImageAsset,type WorkspaceImageAsset} from '../asset-store';
import type { IconType } from "./ui";
import ControlHelp from "./ControlHelp";
type Tool = { name: string; icon: IconType; color?: string; action: string; pending?:boolean };
const groups: { title?: string; tools: Tool[] }[] = [
  {title:"CREATE",tools:[
    {name:"Canvas",icon:Square2StackIcon,action:"canvas"},
    {name:"Text",icon:ChatBubbleBottomCenterTextIcon,action:"text"},
    {name:"Image",icon:PhotoIcon,action:"image"},
  ]},
  {title:"ORGANIZE",tools:[
    {name:"Layers",icon:Square2StackIcon,action:"layers"},
    {name:"Assets",icon:FolderIcon,action:"assets"},
    {name:"Presets",icon:SparklesIcon,action:"presets"},
  ]},
  {title:"PROJECT",tools:[
    {name:"Open project",icon:FolderIcon,action:"open"},
    {name:"Export files",icon:DocumentIcon,action:"files"},
    {name:"Panel layout",icon:AdjustmentsHorizontalIcon,action:"settings"},
  ]},
  {title:"MORE TOOLS",tools:[
    {name:"Shape",icon:CubeIcon,action:"shape"},
    {name:"Chart",icon:ChartBarIcon,action:"chart"},
    {name:"Path",icon:CircleStackIcon,action:"path",pending:true},
    {name:"Component",icon:Squares2X2Icon,action:"component",pending:true},
    {name:"GIF",icon:FilmIcon,action:"gif",pending:true},
    {name:"Audio",icon:MusicalNoteIcon,action:"audio",pending:true},
    {name:"Video",icon:FilmIcon,action:"video",pending:true},
  ]},
];
const toolHelp:Record<string,string>={
  canvas:"Select the canvas to edit output size, background, gradients, patterns, and effects.",
  text:"Add an editable text layer, then adjust typography and effects in Properties.",
  image:"Open Assets to import a PNG, JPEG, or WebP image, then edit its appearance in Properties.",
  layers:"Open Properties to select, reorder, hide, and edit layers.",
  assets:"Import images and select existing image layers.",
  presets:"Load an editable composition. Undo restores the previous composition.",
  open:"Import a previously exported Workspace project JSON file.",
  files:"Open the export panel to download output, source code, or project data.",
  settings:"Choose visible panels or restore the default layout.",
  shape:"Add a procedural shape layer. This editor is outside the current text, canvas, and image polish scope.",
  chart:"Add the existing chart layer. This editor is outside the current text, canvas, and image polish scope.",
};
export function UploadImage({
  onUpload,
  onError,
  children,
}: {
  onUpload: (source: string, name: string, asset: WorkspaceImageAsset) => void;
  onError: (message: string) => void;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        className="aw-button"
        onClick={() => ref.current?.click()}
      >
        <ArrowUpTrayIcon />
        {children ?? "Upload image"}
      </button>
      <input
        ref={ref}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={async (e) => {
          const input=e.currentTarget, file=input.files?.[0];
          input.value="";
          if(!file)return;
          try {
            const asset=await importImageAsset(file);
            onUpload(asset.id,file.name,asset);
          } catch(error) {
            onError(error instanceof Error?error.message:"Image validation failed.");
          }
        }}
      />
    </>
  );
}
export default function Tools({
  document,
  active,
  onTool,
  onNew,
  onOpen,
}: {
  document: WorkspaceDocument;
  active: string;
  onTool: (tool: string) => void;
  onNew: () => void;
  onOpen: (value: unknown) => void;
}) {
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="aw-tools">
      <div className="aw-tool-tagline">Create with Apexify.js</div>
      <label className="aw-search aw-tool-search">
        <MagnifyingGlassIcon />
        <input
          aria-label="Search workspace tools"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

      </label>
      <nav className="aw-tool-list" aria-label="Workspace tools">
        {groups.filter(group=>group.tools.some(t=>t.name.toLowerCase().includes(query.toLowerCase()))).map((group, i) => (
          <details className="aw-tool-group" key={group.title ?? i} open={!!query||group.title!=="MORE TOOLS"}>
            {group.title ? (
              <summary className="aw-tool-group-title">
                {group.title}
                <ChevronDownIcon />
              </summary>
            ) : null}
            {group.tools
              .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
              .map((tool) => (
                <div className="aw-tool-row" key={tool.action}><button
                  type="button"
                  key={tool.action}
                  aria-pressed={active===tool.action}
                  title={tool.pending?"Editor not implemented — view details":toolHelp[tool.action]}
                  className={`aw-tool ${active === tool.action ? "selected" : ""}`}
                  onClick={() =>
                    tool.action === "open"
                      ? fileRef.current?.click()
                      : onTool(tool.action)
                  }
                >
                  <tool.icon
                    className={tool.color ? `aw-icon-${tool.color}` : ""}
                  />
                  <span>{tool.name}</span>{tool.pending&&<small>Planned</small>}
                </button><ControlHelp label={tool.name} description={tool.pending?"The Apexify.js API exists, but its Workspace editor is not implemented. Select this tool to read its current status.":toolHelp[tool.action]}/></div>
              ))}
          </details>
        ))}
      </nav>
      <div className="aw-tool-bottom">
        <button className="aw-button aw-new-project" onClick={onNew}>
          <PlusIcon />
          New Project
        </button>
        <div className="aw-project-card">
          <img src="/workspace/assets/crystal-lake.webp" alt="" />
          <div>
            <strong>{document.name}</strong>
            <span>Local project</span>
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            if (file.size > 6_000_000) throw new Error("Project exceeds 6 MB.");
            onOpen(JSON.parse(await file.text()));
          } catch (error) {
            onTool(
              `error:${error instanceof Error ? error.message : "Invalid project file."}`,
            );
          }
        }}
      />
    </div>
  );
}
export type LayerPatch = Partial<Omit<WorkspaceLayer, "kind" | "id">> &
  Record<string, unknown>;
