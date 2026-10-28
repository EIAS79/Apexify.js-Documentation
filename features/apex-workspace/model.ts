import {validateCanvasExtras,validateCanvasImageFilters,type CanvasExtras} from './canvas-options';
import {validateTextSettings,type TextSettings} from './domain/text';
import {validateImageOptions,validateImageGroups,IMAGE_SHAPES,type ImageEditorOptions,type ImageEditorGroup} from './image-options';
import {validateImageAssets,resolveImageReference,type WorkspaceImageAsset,ASSET_REFERENCE} from './asset-store';
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
        textSettings?: TextSettings;
        fontSize: number;
        weight: number;
        color: string;
      }
    | {
        kind: "shape";
        shape: (typeof IMAGE_SHAPES)[number];
        color: string;
        radius: number;
        strokeColor: string;
        strokeWidth: number;
      }
    | { kind: "image"; source: string }
    | {
        kind: "chart";
        chartType: "bar" | "pie";
        values: number[];
        labels: string[];
        colors: string[];
      }
  ) & {imageOptions?:ImageEditorOptions;imageGroupId?:string};
export interface WorkspaceDocument {
  schemaVersion: 1;
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
    fit?: 'cover'|'contain'|'fill';
    align?: 'center'|'top'|'bottom'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right';
    opacity?: number;
    blur?: number;
  };
  layers: WorkspaceLayer[];
  canvasExtras?: CanvasExtras;
  imageGroups?: ImageEditorGroup[];
  /** Immutable image records keyed by SHA-256; referenced by canvas options and frames. */
  assets?: WorkspaceImageAsset[];
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
    !ASSET_REFERENCE.test(s) &&
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
  const assets=validateImageAssets(d.assets);
  // All browser/project export paths share the same 6 MB JSON render transport.
  // A tighter authoring limit also leaves storage headroom for source drafts and UI metadata.
  if(JSON.stringify(d).length>3_000_000)throw new Error('Workspace project exceeds the 3 MB durable JSON budget.');
  const canvasExtras=validateCanvasExtras(d.canvasExtras);
  if(b.fit!==undefined&&!['cover','contain','fill'].includes(String(b.fit)))throw Error('Unsupported background image fit');
  if(b.align!==undefined&&!['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'].includes(String(b.align)))throw Error('Unsupported background image alignment');
  if(b.mode==='image'&&Number(b.blur)>0&&(canvasExtras.patternBg||canvasExtras.noiseBg)&&!canvasExtras.customBg&&!canvasExtras.gradientBg)
    throw Error('Remove background image blur before adding pattern or noise overlays.');
  const imageGroups=validateImageGroups(d.imageGroups,assets);
  if(canvasExtras.customBg){
    const resolved=resolveImageReference(canvasExtras.customBg.source,assets);
    if(canvasExtras.customBg.filters?.length){
      // Pinned CanvasConfig.customBg.source is a 16,384-char string. Fail closed
      // rather than silently dropping filters or decoding oversized sources.
      if(resolved.length>16_384)throw Error('Verified background asset exceeds pinned 16,384-character filtered-source limit');
      if(num(d.width,"Canvas width",64,2048)>1024||num(d.height,"Canvas height",64,2048)>1024||
         num(d.width,"Canvas width",64,2048)*num(d.height,"Canvas height",64,2048)>1_048_576)
        throw Error('Filtered canvas exceeds bounded 1024px / 1,048,576-pixel native filter budget');
      validateCanvasImageFilters(canvasExtras.customBg.filters,num(d.width,"Canvas width",64,2048),num(d.height,"Canvas height",64,2048));
    }
  }
  if(canvasExtras.patternBg?.type==='custom')resolveImageReference(canvasExtras.patternBg.customPatternImage!,assets);
  for(const entry of canvasExtras.bgLayers??[]){
    if(entry.type==='image'||entry.type==='pattern')resolveImageReference(entry.source,assets);
    if(entry.type==='presetPattern'&&entry.pattern.type==='custom')
      resolveImageReference(entry.pattern.customPatternImage!,assets);
  }
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
        ...(l.textSettings === undefined ? {} : {textSettings:validateTextSettings(l.textSettings)}),
      };
    const imageData=(l.kind==='image'||l.kind==='shape')?{
      ...(l.imageOptions===undefined?{}:{imageOptions:validateImageOptions(l.imageOptions,assets)}),
      ...(l.imageGroupId===undefined?{}:{imageGroupId:str(l.imageGroupId,'Image group ID',80)})
    }:{};
    if('imageGroupId' in imageData && !imageGroups.some(g=>g.id===imageData.imageGroupId))throw Error('Unknown image group');
    if (l.kind === "shape") {
      if (!IMAGE_SHAPES.includes(l.shape as (typeof IMAGE_SHAPES)[number]))
        throw new Error("Unsupported shape.");
      return {
        ...common,...imageData,
        kind: "shape",
        shape: l.shape as (typeof IMAGE_SHAPES)[number],
        color: color(l.color),
        radius: num(l.radius, "Radius", 0, 1024),
        strokeColor: color(l.strokeColor),
        strokeWidth: num(l.strokeWidth, "Stroke", 0, 30),
      };
    }
    if (l.kind === "image")
      return { ...common,...imageData, kind: "image", source: imageSource(l.source) };
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
  return {
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
      ...(b.fit===undefined?{}:{fit:b.fit as WorkspaceDocument['background']['fit']}),
      ...(b.align===undefined?{}:{align:b.align as WorkspaceDocument['background']['align']}),
      ...(b.opacity===undefined?{}:{opacity:num(b.opacity,'Background image opacity',0,1)}),
      ...(b.blur===undefined?{}:{blur:num(b.blur,'Background image blur',0,100)}),
    },
    layers,
    ...(d.imageGroups===undefined?{}:{imageGroups}),
    ...(d.canvasExtras===undefined?{}:{canvasExtras}),
    ...(d.assets===undefined?{}:{assets}),
  };
}
