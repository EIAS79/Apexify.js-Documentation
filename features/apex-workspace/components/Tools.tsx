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
import type { IconType } from "./ui";
type Tool = { name: string; icon: IconType; color?: string; action: string };
const groups: { title?: string; tools: Tool[] }[] = [
  {
    tools: [
      { name: "Canvas", icon: Square2StackIcon, action: "canvas" },
      { name: "Text", icon: ChatBubbleBottomCenterTextIcon, action: "text" },
      { name: "Image", icon: PhotoIcon, action: "image" },
      { name: "Shape", icon: CubeIcon, action: "shape" },
      { name: "Path", icon: CircleStackIcon, action: "path" },
      { name: "Chart", icon: ChartBarIcon, action: "chart" },
      { name: "Component", icon: Squares2X2Icon, action: "component" },
    ],
  },
  {
    title: "MEDIA",
    tools: [
      { name: "Assets", icon: FolderIcon, action: "assets", color: "pink" },
      { name: "GIF", icon: FilmIcon, action: "gif", color: "purple" },
      {
        name: "Audio",
        icon: MusicalNoteIcon,
        action: "audio",
        color: "purple",
      },
      { name: "Video", icon: FilmIcon, action: "video", color: "blue" },
    ],
  },
  {
    title: "TOOLS",
    tools: [
      {
        name: "Templates",
        icon: SparklesIcon,
        action: "templates",
        color: "pink",
      },
      { name: "Examples", icon: BeakerIcon, action: "examples" },
      { name: "Presets", icon: Squares2X2Icon, action: "presets" },
      { name: "Layers", icon: Square2StackIcon, action: "layers" },
    ],
  },
  {
    title: "PROJECT",
    tools: [
      { name: "Open project", icon: FolderIcon, action: "open" },
      { name: "Files", icon: DocumentIcon, action: "files" },
      { name: "Settings", icon: AdjustmentsHorizontalIcon, action: "settings" },
    ],
  },
];
export function UploadImage({
  onUpload,
  onError,
  children,
}: {
  onUpload: (source: string, name: string) => void;
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
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (
            !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
            f.size > 4 * 1024 * 1024
          ) {
            onError("Choose a PNG, JPEG, or WebP under 4 MB.");
            return;
          }
          const reader = new FileReader();
          reader.onerror = () => onError("The image could not be read.");
          reader.onload = () => onUpload(String(reader.result), f.name);
          reader.readAsDataURL(f);
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
      <div className="aw-tool-tagline">Design. Visualize. Generate.</div>
      <label className="aw-search aw-tool-search">
        <MagnifyingGlassIcon />
        <input
          aria-label="Search workspace tools"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>⌘K</kbd>
      </label>
      <nav className="aw-tool-list" aria-label="Workspace tools">
        {groups.map((group, i) => (
          <div className="aw-tool-group" key={group.title ?? i}>
            {group.title ? (
              <div className="aw-tool-group-title">
                {group.title}
                <ChevronDownIcon />
              </div>
            ) : null}
            {group.tools
              .filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
              .map((tool) => (
                <button
                  type="button"
                  key={tool.action}
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
                  <span>{tool.name}</span>
                </button>
              ))}
          </div>
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
            <span>Saved on this device</span>
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
