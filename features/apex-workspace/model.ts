import { validateMedia, type MediaSettings } from "./media-model";
/** Workspace-owned authoring model. No dependency on the legacy Studio. */
export type PanelId =
  | "tools"
  | "visual"
  | "inspector"
  | "code"
  | "graph"
  | "queue"
  | "preview"
  | "output"
  | "terminal";
export const PANEL_TITLES: Record<PanelId, string> = {
  tools: "Workspace",
  visual: "Visual Canvas",
  inspector: "Properties",
  code: "Code",
  graph: "Visual Graph",
  queue: "Render Queue",
  preview: "Preview",
  output: "Output & Export",
  terminal: "Terminal",
};
export const ALL_PANELS = Object.keys(PANEL_TITLES) as PanelId[];
export interface LayerBase {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
}
export type WorkspaceLayer = LayerBase &
  (
    | {
        kind: "text";
        text: string;
        fontSize: number;
        weight: number;
        color: string;
      }
    | {
        kind: "shape";
        shape: "rectangle" | "circle";
        color: string;
        radius: number;
        strokeColor: string;
        strokeWidth: number;
      }
    | { kind: "image"; source: string }
    | { kind: "path"; points: { x: number; y: number }[]; closed: boolean; color: string; strokeColor: string; strokeWidth: number }
    | { kind: "component"; component: "badge" | "progressBar" | "card" | "watermark" | "avatar"; text: string; body: string; value: number; color: string; background: string; source: string }
    | {
        kind: "chart";
        chartType: "bar" | "pie";
        values: number[];
        labels: string[];
        colors: string[];
      }
  );
export interface WorkspaceDocument {
  schemaVersion: 1;
  media?: MediaSettings;
  name: string;
  width: number;
  height: number;
  background: {
    mode: "image" | "gradient" | "color";
    color: string;
    startColor: string;
    endColor: string;
    image: string;
    transparent: boolean;
  };
  layers: WorkspaceLayer[];
  graph?: { edges: { from: string; to: string }[] };
}
const base = (
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): LayerBase => ({
  id,
  name,
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  visible: true,
});
export function createHeroDocument(): WorkspaceDocument {
  return {
    schemaVersion: 1,
    name: "Hero composition",
    width: 1280,
    height: 720,
    background: {
      mode: "image",
      color: "#030916",
      startColor: "#221160",
      endColor: "#006ca8",
      image: "/workspace/assets/crystal-lake.webp",
      transparent: false,
    },
    layers: [
      {
        ...base("title", "Apexify", 90, 180, 425, 120),
        kind: "text",
        text: "Apexify",
        fontSize: 100,
        weight: 800,
        color: "#ffffff",
      },
      {
        ...base("suffix", "Brand accent", 510, 180, 150, 120),
        kind: "text",
        text: ".js",
        fontSize: 100,
        weight: 800,
        color: "#eaff00",
      },
      {
        ...base("subtitle", "Description", 94, 295, 560, 44),
        kind: "text",
        text: "Programmatic media for the web",
        fontSize: 26,
        weight: 400,
        color: "#ced9f2",
      },
      {
        ...base("button", "Call to action", 94, 354, 282, 60),
        kind: "shape",
        shape: "rectangle",
        color: "#090d20",
        radius: 30,
        strokeColor: "#b04dff",
        strokeWidth: 2,
      },
      {
        ...base("button-label", "Button label", 126, 371, 215, 36),
        kind: "text",
        text: "Create with Code  →",
        fontSize: 20,
        weight: 700,
        color: "#ffffff",
      },
    ],
  };
}
export function createBlankDocument(): WorkspaceDocument {
  return {
    ...createHeroDocument(),
    name: "Untitled composition",
    background: { ...createHeroDocument().background, mode: "color" },
    layers: [],
  };
}
export function newLayer(
  kind: WorkspaceLayer["kind"],
  id: string,
  source?: string,
): WorkspaceLayer {
  const common = base(
    id,
    kind === "image" ? "Uploaded image" : `New ${kind}`,
    180,
    160,
    kind === "text" ? 480 : 240,
    kind === "text" ? 90 : 180,
  );
  switch (kind) {
    case "path": return { ...common, kind, points: [{x:0,y:80},{x:30,y:10},{x:65,y:60},{x:100,y:0}], closed: false, color: "#6739e8", strokeColor: "#40d9ff", strokeWidth: 5 };
    case "component": return { ...common, kind, component: "card", width: 400, height: 240, text: "Create something great", body: "Reusable Apexify component", value: 65, color: "#eaff00", background: "#101e35", source: "/workspace/assets/crystal-lake.webp" };
    case "text":
      return {
        ...common,
        kind,
        text: "Your next big idea.",
        fontSize: 48,
        weight: 700,
        color: "#ffffff",
      };
    case "shape":
      return {
        ...common,
        kind,
        shape: "rectangle",
        color: "#6739e8",
        radius: 24,
        strokeColor: "#40d9ff",
        strokeWidth: 1,
      };
    case "image":
      return {
        ...common,
        kind,
        source: source ?? "/workspace/assets/crystal-lake.webp",
        width: 440,
        height: 248,
      };
    case "chart":
      return {
        ...common,
        kind,
        chartType: "bar",
        width: 540,
        height: 320,
        values: [36, 64, 48, 90],
        labels: ["Jan", "Feb", "Mar", "Apr"],
        colors: ["#7f4dff", "#25b8ff", "#eaff00", "#ef65d3"],
      };
  }
}
const record = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Expected an object.");
  return v as Record<string, unknown>;
};
function str(v: unknown, label: string, max = 200): string {
  if (typeof v !== "string" || v.length > max)
    throw new Error(`${label} must be text of at most ${max} characters.`);
  return v;
}
function num(v: unknown, label: string, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    throw new Error(`${label} must be between ${min} and ${max}.`);
  return v;
}
function color(v: unknown): string {
  const s = str(v, "Color", 9);
  if (!/^#[a-f\d]{6}([a-f\d]{2})?$/i.test(s))
    throw new Error("Use a six or eight digit hex color.");
  return s;
}
function bool(v: unknown): boolean {
  if (typeof v !== "boolean") throw new Error("Expected true or false.");
  return v;
}
function imageSource(v: unknown): string {
  const s = str(v, "Image source", 5_600_000);
  if (
    s !== "/workspace/assets/crystal-lake.webp" &&
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z\d+/=]+$/.test(s)
  )
    throw new Error(
      "Images must be uploaded PNG, JPEG, WebP, or the bundled workspace artwork.",
    );
  return s;
}
/** Rebuild from an explicit allowlist; never execute source or pass arbitrary options to the server. */
export function validateDocument(value: unknown): WorkspaceDocument {
  const d = record(value);
  if (d.schemaVersion !== 1)
    throw new Error("Unsupported workspace document version.");
  const b = record(d.background);
  if (!["image", "gradient", "color"].includes(String(b.mode)))
    throw new Error("Invalid background mode.");
  if (!Array.isArray(d.layers) || d.layers.length > 64)
    throw new Error("A composition supports at most 64 layers.");
  const ids = new Set<string>();
  const layers = d.layers.map((raw): WorkspaceLayer => {
    const l = record(raw);
    const id = str(l.id, "Layer ID", 100);
    if (!id || ids.has(id))
      throw new Error("Layer IDs must be nonempty and unique.");
    ids.add(id);
    const common: LayerBase = {
      id,
      name: str(l.name, "Layer name"),
      x: num(l.x, "X", -4096, 4096),
      y: num(l.y, "Y", -4096, 4096),
      width: num(l.width, "Width", 1, 2048),
      height: num(l.height, "Height", 1, 2048),
      rotation: num(l.rotation, "Rotation", -360, 360),
      opacity: num(l.opacity, "Opacity", 0, 1),
      visible: bool(l.visible),
    };
    if (l.kind === "text")
      return {
        ...common,
        kind: "text",
        text: str(l.text, "Text", 5000),
        fontSize: num(l.fontSize, "Font size", 4, 320),
        weight: num(l.weight, "Font weight", 100, 900),
        color: color(l.color),
      };
    if (l.kind === "shape") {
      if (l.shape !== "rectangle" && l.shape !== "circle")
        throw new Error("Unsupported shape.");
      return {
        ...common,
        kind: "shape",
        shape: l.shape,
        color: color(l.color),
        radius: num(l.radius, "Radius", 0, 1024),
        strokeColor: color(l.strokeColor),
        strokeWidth: num(l.strokeWidth, "Stroke", 0, 30),
      };
    }
    if (l.kind === "path") {
      if (!Array.isArray(l.points) || l.points.length < 2 || l.points.length > 128) throw new Error("Paths require 2–128 points.");
      return { ...common, kind: "path", points: l.points.map(v => {const p = record(v);return { x: num(p.x,"Point X",-100,200), y: num(p.y,"Point Y",-100,200) };}), closed: bool(l.closed), color: color(l.color), strokeColor: color(l.strokeColor), strokeWidth: num(l.strokeWidth,"Stroke width",0,30) };
    }
    if (l.kind === "component") {
      if (!["badge","progressBar","card","watermark","avatar"].includes(String(l.component))) throw new Error("Unknown component.");
      return { ...common, kind: "component", component: l.component as "card", text: str(l.text,"Component text",200), body: str(l.body,"Component body",1000), value: num(l.value,"Progress",0,100), color: color(l.color), background: color(l.background), source: imageSource(l.source) };
    }
    if (l.kind === "image")
      return { ...common, kind: "image", source: imageSource(l.source) };
    if (l.kind === "chart") {
      if (l.chartType !== "bar" && l.chartType !== "pie")
        throw new Error("Unsupported chart type.");
      if (
        !Array.isArray(l.values) ||
        l.values.length < 1 ||
        l.values.length > 30 ||
        !Array.isArray(l.labels) ||
        !Array.isArray(l.colors) ||
        l.labels.length !== l.values.length ||
        l.colors.length !== l.values.length
      )
        throw new Error(
          "Charts require 1–30 matching values, labels, and colors.",
        );
      return {
        ...common,
        kind: "chart",
        chartType: l.chartType,
        values: l.values.map((v) => num(v, "Chart value", 0, 1_000_000)),
        labels: l.labels.map((v) => str(v, "Chart label", 100)),
        colors: l.colors.map(color),
      };
    }
    throw new Error("Unsupported layer type.");
  });
  let graph: WorkspaceDocument["graph"];
  if (d.graph !== undefined) {
    const g = record(d.graph);
    if (!Array.isArray(g.edges) || g.edges.length > 256) throw new Error("Graph supports at most 256 connections.");
    const keys = new Set<string>();
    graph = { edges: g.edges.map(raw => {
      const e=record(raw); const from=str(e.from,"Source ID",100), to=str(e.to,"Target ID",100);
      const key = JSON.stringify([from,to]);
      if (!ids.has(from)||!ids.has(to)||from===to||keys.has(key)) throw new Error("Graph connections require two distinct existing nodes and no duplicates.");
      keys.add(key); return {from,to};
    }) };
    orderedLayers({layers,graph});
  }
  const result: WorkspaceDocument = {
    ...(graph ? {graph} : {}),
    schemaVersion: 1,
    name: str(d.name, "Project name"),
    width: num(d.width, "Canvas width", 64, 2048),
    height: num(d.height, "Canvas height", 64, 2048),
    background: {
      mode: b.mode as WorkspaceDocument["background"]["mode"],
      color: color(b.color),
      startColor: color(b.startColor),
      endColor: color(b.endColor),
      image: imageSource(b.image),
      transparent: bool(b.transparent),
    },
    layers,
  };
  if(d.media !== undefined) result.media = validateMedia(d.media,result);
  return result;
}

/** Stable topological paint order. Edges express execution dependencies; every node paints once. */
export function orderedLayers(document: Pick<WorkspaceDocument,"layers"|"graph">): WorkspaceLayer[] {
  const pending = new Set(document.layers.map(l=>l.id));
  const result: WorkspaceLayer[] = [];
  while (pending.size) {
    const next = document.layers.find(l => pending.has(l.id) && !(document.graph?.edges ?? []).some(e=>e.to===l.id && pending.has(e.from)));
    if (!next) throw new Error("Graph connections contain a cycle.");
    pending.delete(next.id); result.push(next);
  }
  return result;
}
