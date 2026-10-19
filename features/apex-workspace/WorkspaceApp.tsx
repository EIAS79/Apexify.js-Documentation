"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Bars3Icon,
  ChevronDownIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  QueueListIcon,
  Squares2X2Icon,
  SunIcon,
  XMarkIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import {
  ALL_PANELS,
  PANEL_TITLES,
  createHeroDocument,
  createBlankDocument,
  validateDocument,
  newLayer,
  type PanelId,
  type WorkspaceDocument,
  type WorkspaceLayer,
} from "./model";
import { generateSource, parseSource } from "./codegen";
import { requestWorkspaceRender } from "./client-render";
import {
  DockLayout,
  DEFAULT_DOCK,
  hasVisiblePanel,
} from "./components/DockLayout";
import { Panel, IconButton } from "./components/ui";
import Tools, { type LayerPatch } from "./components/Tools";
import Inspector from "./components/Inspector";
import VisualCanvas from "./components/VisualCanvas";
import Graph from "./components/Graph";
import CodeEditor from "./components/CodeEditor";
import {
  Queue,
  Preview,
  ExportPanel,
  Terminal,
  downloadFile,
  type RenderJob,
  type LogEntry,
} from "./components/Results";
import "./workspace.css";

let idCounter = 0;
function workspaceId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `aw-${Date.now().toString(36)}-${(++idCounter).toString(36)}-${Math.random().toString(36).slice(2, 9)}`
  );
}
const STORAGE_KEY = "apexify-workspace-document-v1";
const DRAFT_KEY = "apexify-workspace-source-draft-v1";
const LAYOUT_KEY = "apexify-workspace-layout-v1";
const DEFAULT_VISIBLE: Record<PanelId, boolean> = {
  tools: true,
  visual: true,
  inspector: true,
  code: true,
  graph: true,
  queue: true,
  preview: true,
  output: true,
  terminal: false,
};
interface HistoryState {
  past: WorkspaceDocument[];
  present: WorkspaceDocument;
  future: WorkspaceDocument[];
}
const icons = {
  tools: CubeTransparentIcon,
  visual: Squares2X2Icon,
  inspector: AdjustmentsHorizontalIcon,
  code: CodeBracketIcon,
  graph: CubeTransparentIcon,
  queue: QueueListIcon,
  preview: PhotoIcon,
  output: ArrowDownTrayIcon,
  terminal: CommandLineIcon,
};
const capabilityNotes: Record<
  string,
  { title: string; description: string; api: string }
> = {
  path: {
    title: "Paths",
    description:
      "Apexify v6 provides path2d drawing and custom connectors. A dedicated path authoring tool is a later workspace module.",
    api: "painter.path2d",
  },
  component: {
    title: "Components",
    description:
      "The v6 badge, progressBar, avatar, card, and watermark factories produce SceneLayer arrays. Their dedicated workspace inspectors are not wired yet.",
    api: "painter.components",
  },
  gif: {
    title: "GIF workflows",
    description:
      "Apexify supports generated frames and AsyncIterable GIF input. This workspace currently exports static compositions; a timeline and GIF job adapter are still required.",
    api: "painter.createGIF() / painter.animate()",
  },
  audio: {
    title: "Procedural audio",
    description:
      "Apexify supports synthesis, presets, sequences, and WAV output. The workspace audio graph and waveform editor are not wired yet.",
    api: "painter.createAudio",
  },
  video: {
    title: "Video workflows",
    description:
      "Apexify supports FFmpeg video creation and pipelines. A dedicated isolated media execution adapter is required before enabling video jobs here.",
    api: "painter.createVideo() / painter.videoPipeline()",
  },
};

export default function WorkspaceApp() {
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: createHeroDocument(),
    future: [],
  }));
  const document = history.present;
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(DEFAULT_VISIBLE);
  const [sizes, setSizes] = useState<Record<string, number[]>>({});
  const [maximized, setMaximized] = useState<PanelId | null>(null);
  const [mobilePanel, setMobilePanel] = useState<PanelId>("visual");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState("canvas");
  const [inspectorTab, setInspectorTab] = useState("Properties");
  const [panelMenu, setPanelMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [commandMenu, setCommandMenu] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [hand, setHand] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [source, setSource] = useState(() =>
    generateSource(createHeroDocument()),
  );
  const [sourceDirty, setSourceDirty] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const [pump, setPump] = useState(0);
  const activeJob = useRef<{ id: string; controller: AbortController } | null>(
    null,
  );
  const livePreviewUrl = useRef<string | null>(null);
  const allUrls = useRef(new Set<string>());
  const nextLogId = useRef(0);
  const alive = useRef(true);
  const initialJob = useRef(false);
  const lastEdit = useRef({ key: "", time: 0 });
  const sourceDirtyRef = useRef(false);
  const persistError = useRef(false);
  sourceDirtyRef.current = sourceDirty;
  const log = useCallback(
    (message: string, kind: LogEntry["kind"] = "info") => {
      setLogs((old) => [
        ...old.slice(-99),
        {
          id: ++nextLogId.current,
          time: new Date().toLocaleTimeString("en-GB"),
          kind,
          message,
        },
      ]);
    },
    [],
  );
  const notify = useCallback((text: string) => {
    setMessage(text);
  }, []);
  const error = useCallback(
    (text: string) => {
      notify(text);
      log(text, "error");
    },
    [log, notify],
  );
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 7000);
    return () => clearTimeout(id);
  }, [message]);
  useEffect(() => {
    alive.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const restored = validateDocument(JSON.parse(stored));
        setHistory({ past: [], present: restored, future: [] });
        setSource(generateSource(restored));
      }
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft && draft.length < 6_000_000) {
        setSource(draft);
        setSourceDirty(true);
      }
      const layout = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? "null");
      if (layout?.version === 1) {
        const flags = { ...DEFAULT_VISIBLE };
        for (const id of ALL_PANELS)
          if (typeof layout.visible?.[id] === "boolean")
            flags[id] = layout.visible[id];
        setVisible(flags);
        if (layout.sizes && typeof layout.sizes === "object") {
          const safe: Record<string, number[]> = {};
          for (const [key, value] of Object.entries(layout.sizes))
            if (
              Array.isArray(value) &&
              value.length <= 4 &&
              value.every(
                (n) =>
                  typeof n === "number" &&
                  Number.isFinite(n) &&
                  n > 0 &&
                  n <= 200,
              )
            )
              safe[key] = value;
          setSizes(safe);
        }
      }
    } catch {
      notify(
        "A saved project could not be restored. The reference composition is ready; import a backup JSON to recover.",
      );
    }
    setReady(true);
    log("Workspace ready. Type help in Terminal for commands.");
    return () => {
      alive.current = false;
      activeJob.current?.controller.abort();
      allUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [log, notify]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
      } catch {
        if (!persistError.current) {
          persistError.current = true;
          notify(
            "Device storage is full. Download your project JSON to preserve these changes.",
          );
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [ready, document, notify]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        LAYOUT_KEY,
        JSON.stringify({ version: 1, visible, sizes }),
      );
    } catch {
      /* Document save reports storage failures separately. */
    }
  }, [ready, visible, sizes]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        if (sourceDirty) localStorage.setItem(DRAFT_KEY, source);
        else localStorage.removeItem(DRAFT_KEY);
      } catch {
        notify(
          "Code draft could not be saved on this device. Download source to preserve it.",
        );
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [ready, source, sourceDirty, notify]);
  useEffect(() => {
    if (!sourceDirty) setSource(generateSource(document));
  }, [document, sourceDirty]);

  function commit(next: WorkspaceDocument, key = "edit", force = false) {
    if (sourceDirtyRef.current && !force) {
      error(
        "Apply or discard your Code edits before changing the visual composition.",
      );
      return;
    }
    try {
      const valid = validateDocument(next);
      const now = Date.now();
      const merge =
        key === lastEdit.current.key && now - lastEdit.current.time < 500;
      lastEdit.current = { key, time: now };
      setHistory((h) => ({
        past: merge ? h.past : [...h.past.slice(-29), h.present],
        present: valid,
        future: [],
      }));
    } catch (e) {
      error(e instanceof Error ? e.message : "Invalid composition.");
    }
  }
  function undo() {
    if (sourceDirtyRef.current) {
      error("Apply or discard Code edits before Undo.");
      return;
    }
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future].slice(0, 30),
          }
        : h,
    );
    lastEdit.current.key = "";
  }
  function redo() {
    if (sourceDirtyRef.current) {
      error("Apply or discard Code edits before Redo.");
      return;
    }
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present].slice(-30),
            present: h.future[0],
            future: h.future.slice(1),
          }
        : h,
    );
    lastEdit.current.key = "";
  }
  function updateLayer(id: string, patch: LayerPatch) {
    commit(
      {
        ...document,
        layers: document.layers.map((l) =>
          l.id === id ? ({ ...l, ...patch } as WorkspaceLayer) : l,
        ),
      },
      `layer:${id}:${Object.keys(patch).join(",")}`,
    );
  }
  function select(id: string | null) {
    setSelected(id);
    setInspectorTab("Properties");
    setVisible((v) => ({ ...v, inspector: true }));
  }
  function add(kind: WorkspaceLayer["kind"], image?: string, name?: string) {
    if (sourceDirtyRef.current) {
      error("Apply or discard Code edits before adding layers.");
      return;
    }
    const id = workspaceId();
    const layer = newLayer(kind, id, image);
    if (name) layer.name = name;
    commit({ ...document, layers: [...document.layers, layer] }, `add:${id}`);
    select(id);
    log(`Added ${kind} layer: ${layer.name}`);
  }
  function applyCode() {
    try {
      const parsed = parseSource(source);
      sourceDirtyRef.current = false;
      setSourceDirty(false);
      setCodeError(null);
      commit(parsed, "apply-code", true);
      setSelected(null);
      log("Code applied. Visual and Graph synchronized.", "success");
    } catch (e) {
      const text = e instanceof Error ? e.message : "Invalid source.";
      setCodeError(text);
      error(text);
    }
  }
  function downloadProject() {
    downloadFile(
      new Blob([JSON.stringify(document, null, 2)], {
        type: "application/json",
      }),
      `${document.name.replace(/[^\w-]/g, "-") || "project"}.apexify.json`,
    );
    log("Project JSON downloaded.", "success");
  }
  function downloadSource() {
    downloadFile(new Blob([source], { type: "text/typescript" }), "main.ts");
    log("Apexify source downloaded.", "success");
  }
  function resetLayout() {
    setVisible(DEFAULT_VISIBLE);
    setSizes({});
    setMaximized(null);
    setMobilePanel("visual");
    setPanelMenu(false);
  }
  function openPanel(id: PanelId) {
    if (id === "terminal" && !visible.terminal)
      setSizes((old) => ({ ...old, center: [55, 45], editorStack: [55, 45] }));
    setVisible((v) => ({ ...v, [id]: true }));
    setMobilePanel(id);
    setMaximized(null);
  }
  function closePanel(id: PanelId) {
    setVisible((v) => ({ ...v, [id]: false }));
    if (maximized === id) setMaximized(null);
    if (mobilePanel === id)
      setMobilePanel(
        ALL_PANELS.find((p) => p !== id && visible[p]) ?? "visual",
      );
  }
  function enqueue() {
    if (sourceDirtyRef.current) {
      error("Apply or discard Code edits before rendering.");
      return;
    }
    if (jobs.length >= 12) {
      error(
        "The queue holds 12 jobs. Remove a completed job before adding another.",
      );
      return;
    }
    setJobs((old) => [
      ...old,
      {
        id: workspaceId(),
        name: document.name || "Untitled",
        document: structuredClone(document),
        state: "queued",
      },
    ]);
    setVisible((v) => ({ ...v, queue: true }));
    log(`Queued ${document.name}.`);
  }
  useEffect(() => {
    if (ready && !initialJob.current) {
      initialJob.current = true;
      setJobs([
        {
          id: workspaceId(),
          name: document.name,
          document: structuredClone(document),
          state: "queued",
        },
      ]);
    }
  }, [ready, document]);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setRendering(true);
      setPreviewError(null);
      try {
        const blob = await requestWorkspaceRender(document, controller.signal);
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        allUrls.current.add(url);
        if (livePreviewUrl.current) {
          URL.revokeObjectURL(livePreviewUrl.current);
          allUrls.current.delete(livePreviewUrl.current);
        }
        livePreviewUrl.current = url;
        setPreview(url);
      } catch (e) {
        if (!controller.signal.aborted) {
          const text = e instanceof Error ? e.message : "Preview failed.";
          setPreviewError(text);
          error(text);
        }
      } finally {
        if (!controller.signal.aborted) setRendering(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [document, ready, error]);
  useEffect(() => {
    if (activeJob.current) return;
    const job = jobs.find((j) => j.state === "queued");
    if (!job) return;
    const controller = new AbortController();
    activeJob.current = { id: job.id, controller };
    const startedAt = performance.now();
    setJobs((old) =>
      old.map((j) =>
        j.id === job.id ? { ...j, state: "running", startedAt: Date.now() } : j,
      ),
    );
    log(`Rendering ${job.name} with Apexify.js v6…`);
    void (async () => {
      try {
        const blob = await requestWorkspaceRender(
          job.document,
          controller.signal,
        );
        if (!alive.current || controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        allUrls.current.add(url);
        const duration = performance.now() - startedAt;
        setJobs((old) =>
          old.map((j) =>
            j.id === job.id
              ? { ...j, state: "completed", url, bytes: blob.size, duration }
              : j,
          ),
        );
        log(
          `${job.name} complete · ${(duration / 1000).toFixed(2)} s · ${Math.round(blob.size / 1024)} KB.`,
          "success",
        );
      } catch (e) {
        if (!alive.current || controller.signal.aborted) return;
        const text = e instanceof Error ? e.message : "Render failed.";
        setJobs((old) =>
          old.map((j) =>
            j.id === job.id ? { ...j, state: "failed", error: text } : j,
          ),
        );
        error(text);
      } finally {
        activeJob.current = null;
        if (alive.current) setPump((n) => n + 1);
      }
    })();
  }, [jobs, pump, log, error]);
  function cancelJob(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    if (activeJob.current?.id === id) activeJob.current.controller.abort();
    if (job.state === "running" || job.state === "queued") {
      setJobs((old) =>
        old.map((j) => (j.id === id ? { ...j, state: "cancelled" } : j)),
      );
      log(`Cancelled ${job.name}.`);
    } else {
      if (job.url && preview !== job.url) {
        URL.revokeObjectURL(job.url);
        allUrls.current.delete(job.url);
      }
      setJobs((old) => old.filter((j) => j.id !== id));
    }
  }
  function onTool(tool: string) {
    if (tool.startsWith("error:")) {
      error(tool.slice(6));
      return;
    }
    setActiveTool(tool);
    if (tool === "canvas") {
      select(null);
      openPanel("visual");
    } else if (tool === "text" || tool === "shape" || tool === "chart")
      add(tool);
    else if (tool === "image") {
      openPanel("inspector");
      setInspectorTab("Assets");
    } else if (["assets", "templates", "examples", "presets"].includes(tool)) {
      openPanel("inspector");
      setInspectorTab(tool === "assets" ? "Assets" : "Presets");
    } else if (tool === "layers") {
      openPanel("inspector");
      setInspectorTab("Properties");
    } else if (tool === "files") openPanel("output");
    else if (tool === "settings") setPanelMenu(true);
    else if (capabilityNotes[tool]) setDialog(tool);
  }
  function terminalCommand(raw: string) {
    const command = raw.trim().toLowerCase();
    if (!command) return;
    log(`> ${raw}`, "command");
    if (command === "render") enqueue();
    else if (command === "clear") setLogs([]);
    else if (command === "undo") undo();
    else if (command === "redo") redo();
    else if (command === "inspect")
      log(
        `${document.name} · ${document.width} × ${document.height} · ${document.layers.length} layers · ${jobs.filter((j) => j.state === "queued").length} queued`,
      );
    else if (command === "panels") setPanelMenu(true);
    else if (command === "reset-layout") resetLayout();
    else if (command === "export") downloadSource();
    else if (command === "help")
      log(
        "Commands: render, inspect, undo, redo, clear, panels, reset-layout, export. This console runs workspace commands; it does not execute OS shell commands.",
      );
    else log(`Unknown command: ${raw}. Type help.`, "error");
  }
  const actionRef = useRef({ undo, redo, enqueue });
  actionRef.current = { undo, redo, enqueue };
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const input =
        e.target instanceof HTMLElement &&
        (e.target.matches('input,textarea,[contenteditable="true"]') ||
          e.target.closest(".cm-editor"));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandMenu((v) => !v);
      } else if (e.key === "Escape") {
        setPanelMenu(false);
        setCommandMenu(false);
        setDialog(null);
        setMaximized(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        actionRef.current.enqueue();
      } else if (
        !input &&
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "z"
      ) {
        e.preventDefault();
        e.shiftKey ? actionRef.current.redo() : actionRef.current.undo();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    if (!dialog && !commandMenu) return;
    const previous = window.document.activeElement as HTMLElement | null;
    const modal = window.document.querySelector<HTMLElement>(
      ".aw-app [role=dialog]",
    );
    const focusables = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button,a[href],input,select,textarea,[tabindex=\"0\"]',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const nodes = focusables();
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && window.document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && window.document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.document.addEventListener("keydown", trap);
    return () => {
      window.document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [dialog, commandMenu]);
  const selectedOutput = jobs.find(
    (job) => job.id === selectedJobId && job.url,
  );
  const shownPanels = useMemo(
    () => ALL_PANELS.filter((id) => visible[id]),
    [visible],
  );
  function renderPanel(id: PanelId) {
    const Icon = icons[id];
    const title = PANEL_TITLES[id];
    return (
      <Panel
        title={title}
        icon={Icon}
        onClose={() => closePanel(id)}
        onMaximize={() => setMaximized(maximized === id ? null : id)}
        className={`aw-panel-${id}`}
        actions={
          id === "code" && sourceDirty ? (
            <button
              className="aw-text-button"
              onClick={() => {
                setSourceDirty(false);
                setCodeError(null);
                setSource(generateSource(document));
              }}
            >
              Discard edits
            </button>
          ) : id === "queue" ? (
            <span className="aw-badge">{jobs.length}</span>
          ) : null
        }
      >
        {id === "tools" ? (
          <Tools
            document={document}
            active={activeTool}
            onTool={onTool}
            onNew={() => {
              commit(createBlankDocument(), "new");
              setSelected(null);
            }}
            onOpen={(value) => {
              try {
                commit(validateDocument(value), "import");
                setSelected(null);
              } catch (e) {
                error(e instanceof Error ? e.message : "Invalid project.");
              }
            }}
          />
        ) : id === "visual" ? (
          <VisualCanvas
            document={document}
            preview={preview}
            previewError={previewError}
            rendering={rendering}
            selected={selected}
            onSelect={select}
            onMove={(id, x, y) => updateLayer(id, { x, y })}
            zoom={zoom}
            setZoom={setZoom}
            onRender={enqueue}
            hand={hand}
            setHand={setHand}
          />
        ) : id === "inspector" ? (
          <Inspector
            document={document}
            selected={selected}
            onDocument={(patch) =>
              commit(
                { ...document, ...patch },
                `document:${Object.keys(patch).join(",")}`,
              )
            }
            onLayer={updateLayer}
            onSelect={select}
            onRemove={(id) => {
              commit(
                {
                  ...document,
                  layers: document.layers.filter((l) => l.id !== id),
                },
                "delete",
              );
              setSelected(null);
            }}
            onReorder={(id, delta) => {
              const index = document.layers.findIndex((l) => l.id === id);
              const target = Math.max(
                0,
                Math.min(document.layers.length - 1, index + delta),
              );
              const layers = [...document.layers];
              [layers[index], layers[target]] = [layers[target], layers[index]];
              commit({ ...document, layers }, "reorder");
            }}
            onPreset={() => {
              commit(createHeroDocument(), "preset");
              setSelected(null);
            }}
            onUpload={(source, name) => add("image", source, name)}
            onError={error}
            tab={inspectorTab}
            setTab={setInspectorTab}
          />
        ) : id === "code" ? (
          <CodeEditor
            source={source}
            onChange={(value) => {
              setSource(value);
              setSourceDirty(value !== generateSource(document));
              setCodeError(null);
            }}
            onApply={applyCode}
            onDownload={downloadSource}
            dirty={sourceDirty}
            error={codeError}
          />
        ) : id === "graph" ? (
          <Graph
            document={document}
            selected={selected}
            onSelect={select}
            preview={preview}
            onRender={enqueue}
          />
        ) : id === "queue" ? (
          <Queue
            jobs={jobs}
            onCancel={cancelJob}
            onSelect={(url) =>
              setSelectedJobId(jobs.find((job) => job.url === url)?.id ?? null)
            }
            onRender={enqueue}
          />
        ) : id === "preview" ? (
          <Preview
            preview={selectedOutput?.url ?? preview}
            name={selectedOutput?.name ?? document.name}
            rendering={!selectedOutput && rendering}
            onCurrent={
              selectedOutput ? () => setSelectedJobId(null) : undefined
            }
          />
        ) : id === "output" ? (
          <ExportPanel
            preview={selectedOutput?.url ?? preview}
            document={selectedOutput?.document ?? document}
            onSource={downloadSource}
            onProject={downloadProject}
            onError={error}
          />
        ) : (
          <Terminal logs={logs} onCommand={terminalCommand} />
        )}
      </Panel>
    );
  }
  return (
    <main
      className={`aw-app${contrast ? " aw-contrast" : ""}`}
      aria-label="Apexify creative workspace"
    >
      <header className="aw-topbar">
        <a className="aw-brand" href="/" aria-label="Apexify home">
          <img src="/workspace/assets/apex-mark.webp" alt="" />
          <span>
            Apexify<span className="aw-brand-js">.js</span>
          </span>
        </a>
        <nav className="aw-topnav" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/docs/getting-started">Docs</a>
          <a href="/api-reference">API</a>
          <a href="/gallery">Gallery</a>
          <a href="/workspace" aria-current="page">
            Workspace
          </a>
        </nav>
        <button
          className="aw-command-search"
          onClick={() => setCommandMenu(true)}
        >
          <MagnifyingGlassIcon />
          <span>Search tools, panels, actions…</span>
          <kbd>⌘K</kbd>
        </button>
        <div className="aw-topbar-actions">
          <IconButton
            label="Increase interface contrast"
            active={contrast}
            onClick={() => setContrast(!contrast)}
          >
            <SunIcon />
          </IconButton>
          <div className="aw-panels-wrapper">
            <button
              className={`aw-button${panelMenu ? " is-active" : ""}`}
              aria-expanded={panelMenu}
              aria-controls="aw-panels-menu"
              onClick={() => setPanelMenu(!panelMenu)}
            >
              <Squares2X2Icon />
              <span>Panels</span>
              <ChevronDownIcon />
            </button>
            {panelMenu ? (
              <div id="aw-panels-menu" className="aw-panel-menu">
                <strong>Workspace panels</strong>
                {ALL_PANELS.map((id) => (
                  <label key={id}>
                    <input
                      type="checkbox"
                      checked={visible[id]}
                      onChange={() =>
                        visible[id] ? closePanel(id) : openPanel(id)
                      }
                    />
                    {PANEL_TITLES[id]}
                  </label>
                ))}
                <button className="aw-button" onClick={resetLayout}>
                  <ArrowPathIcon />
                  Reset layout
                </button>
              </div>
            ) : null}
          </div>
          <IconButton
            label="Undo"
            disabled={!history.past.length || sourceDirty}
            onClick={undo}
          >
            <ArrowUturnLeftIcon />
          </IconButton>
          <IconButton
            label="Redo"
            disabled={!history.future.length || sourceDirty}
            onClick={redo}
          >
            <ArrowUturnRightIcon />
          </IconButton>
          <button
            className="aw-button aw-render-button"
            aria-label="Render"
            onClick={enqueue}
          >
            <PlayIcon />
            <span>Render</span>
          </button>
        </div>
      </header>
      <div className="aw-mobile-tabs">
        <label>
          <Bars3Icon />
          <select
            aria-label="Active workspace panel"
            value={visible[mobilePanel] ? mobilePanel : (shownPanels[0] ?? "")}
            onChange={(e) => setMobilePanel(e.target.value as PanelId)}
          >
            {shownPanels.map((id) => (
              <option key={id} value={id}>
                {PANEL_TITLES[id]}
              </option>
            ))}
          </select>
        </label>
        <span>
          {document.width} × {document.height}
        </span>
      </div>
      <div className="aw-desktop-dock">
        {maximized && visible[maximized] ? (
          <div className="aw-maximized">
            <button
              className="aw-restore-window aw-button"
              onClick={() => setMaximized(null)}
            >
              <ArrowsPointingInIcon />
              Restore layout
            </button>
            {renderPanel(maximized)}
          </div>
        ) : hasVisiblePanel(DEFAULT_DOCK, visible) ? (
          <DockLayout
            tree={DEFAULT_DOCK}
            visible={visible}
            sizes={sizes}
            onResize={(id, weights) =>
              setSizes((old) => ({ ...old, [id]: weights }))
            }
            renderPanel={renderPanel}
          />
        ) : (
          <div className="aw-empty-workspace">
            <CubeTransparentIcon />
            <h1>Your space. Your workflow.</h1>
            <p>Open a panel to keep creating.</p>
            <button className="aw-button aw-primary" onClick={resetLayout}>
              Restore workspace
            </button>
          </div>
        )}
      </div>
      <div className="aw-mobile-dock">
        {shownPanels.length ? (
          renderPanel(visible[mobilePanel] ? mobilePanel : shownPanels[0])
        ) : (
          <div className="aw-empty">
            <button className="aw-button" onClick={resetLayout}>
              Restore workspace
            </button>
          </div>
        )}
      </div>
      <footer className="aw-statusbar">
        <span>
          <i />
          {ready ? "Local workspace" : "Loading workspace…"}
        </span>
        <span>{document.name}</span>
        <button onClick={() => openPanel("terminal")}>
          <CommandLineIcon />
          Terminal{" "}
          {logs.filter((l) => l.kind === "error").length
            ? `· ${logs.filter((l) => l.kind === "error").length} errors`
            : ""}
        </button>
        <button onClick={downloadProject}>
          Save project <ArrowDownTrayIcon />
        </button>
        <a href="/docs/getting-started">Apexify.js v6</a>
      </footer>
      {message ? (
        <div className="aw-toast" role="status">
          <span>{message}</span>
          <IconButton
            label="Dismiss notification"
            onClick={() => setMessage(null)}
          >
            <XMarkIcon />
          </IconButton>
        </div>
      ) : null}
      {commandMenu ? (
        <div
          className="aw-modal-backdrop"
          onClick={() => setCommandMenu(false)}
        >
          <section
            className="aw-command-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Search workspace actions"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="aw-search">
              <MagnifyingGlassIcon />
              <input
                autoFocus
                aria-label="Search actions"
                placeholder="Search panels and actions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <IconButton
                label="Close search"
                onClick={() => setCommandMenu(false)}
              >
                <XMarkIcon />
              </IconButton>
            </label>
            <div>
              {[
                ...ALL_PANELS.map((id) => ({
                  label: `Open ${PANEL_TITLES[id]}`,
                  action: () => openPanel(id),
                })),
                { label: "Render composition", action: enqueue },
                { label: "Reset layout", action: resetLayout },
                { label: "Download project", action: downloadProject },
                { label: "Download source", action: downloadSource },
              ]
                .filter((a) =>
                  a.label.toLowerCase().includes(search.toLowerCase()),
                )
                .map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      a.action();
                      setCommandMenu(false);
                      setSearch("");
                    }}
                  >
                    {a.label}
                  </button>
                ))}
            </div>
          </section>
        </div>
      ) : null}
      {dialog && capabilityNotes[dialog] ? (
        <div className="aw-modal-backdrop" onClick={() => setDialog(null)}>
          <section
            className="aw-capability-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={capabilityNotes[dialog].title}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              label="Close feature details"
              onClick={() => setDialog(null)}
            >
              <XMarkIcon />
            </IconButton>
            <span className="aw-eyebrow">APEXIFY CAPABILITY</span>
            <h2>{capabilityNotes[dialog].title}</h2>
            <p>{capabilityNotes[dialog].description}</p>
            <code>{capabilityNotes[dialog].api}</code>
            <a className="aw-button" href="/api-reference">
              Read the API reference
            </a>
          </section>
        </div>
      ) : null}
    </main>
  );
}
