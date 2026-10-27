"use client";
import { useState } from "react";
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  CommandLineIcon,
  DocumentIcon,
  CodeBracketIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceDocument } from "../model";
import { Field, IconButton } from "./ui";
export interface RenderJob {
  id: string;
  name: string;
  state: "queued" | "running" | "completed" | "failed" | "cancelled";
  document: WorkspaceDocument;
  startedAt?: number;
  duration?: number;
  url?: string;
  bytes?: number;
  error?: string;
}
export interface LogEntry {
  id: number;
  time: string;
  kind: "info" | "error" | "success" | "command";
  message: string;
}
export function downloadFile(content: Blob | string, name: string) {
  const ownUrl = typeof content !== "string";
  const url = ownUrl ? URL.createObjectURL(content) : content;
  const a = window.document.createElement("a");
  a.href = url;
  a.download = name;
  window.document.body.appendChild(a);
  a.click();
  a.remove();
  if (ownUrl) setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function Queue({
  jobs,
  onCancel,
  onSelect,
  onRender,
}: {
  jobs: RenderJob[];
  onCancel: (id: string) => void;
  onSelect: (url: string) => void;
  onRender: () => void;
}) {
  return (
    <div className="aw-queue">
      {jobs.length === 0 ? (
        <div className="aw-empty">
          <PhotoIcon />
          <span>Your render queue is ready.</span>
          <button className="aw-text-button" onClick={onRender}>
            Render this composition
          </button>
        </div>
      ) : (
        [...jobs].reverse().map((job) => (
          <div className="aw-job" key={job.id}>
            <span className={`aw-job-dot aw-job-${job.state}`} />
            <button
              className="aw-job-art"
              aria-label={job.url ? "Open " + job.name + " rendered image" : job.name + " image unavailable"}
              onClick={() => job.url && onSelect(job.url)}
              disabled={!job.url}
            >
              {job.url ? (
                <img src={job.url} alt={`Open ${job.name} output`} />
              ) : (
                <PhotoIcon />
              )}
            </button>
            <div className="aw-job-name">
              <strong>{job.name}</strong>
              <span>
                {job.document.width} × {job.document.height} · PNG
                {job.bytes ? ` · ${(job.bytes / 1024).toFixed(0)} KB` : ""}
              </span>
              {job.error ? <span className="aw-error">{job.error}</span> : null}
            </div>
            <div className={`aw-job-state aw-job-${job.state}`}>
              {job.state === "running" ? (
                <>
                  <span className="aw-indeterminate" />
                  Rendering…
                </>
              ) : (
                job.state[0].toUpperCase() + job.state.slice(1)
              )}
            </div>
            <span className="aw-job-duration">
              {job.duration !== undefined
                ? `${(job.duration / 1000).toFixed(2)} s`
                : "—"}
            </span>
            <IconButton
              label={`${job.state === "running" || job.state === "queued" ? "Cancel" : "Remove"} ${job.name}`}
              onClick={() => onCancel(job.id)}
            >
              <XMarkIcon />
            </IconButton>
          </div>
        ))
      )}
    </div>
  );
}
export function Preview({
  preview,
  name,
  rendering,
  onCurrent,
}: {
  preview: string | null;
  name: string;
  rendering: boolean;
  onCurrent?: () => void;
}) {
  return (
    <div className="aw-preview">
      {preview ? (
        <img src={preview} alt={`${name} output preview`} />
      ) : (
        <div className="aw-empty">
          <PhotoIcon />
          <span>Render to preview</span>
        </div>
      )}
      <span>
        {rendering
          ? "Updating preview…"
          : onCurrent
            ? `${name} · queued output`
            : "Current render · PNG"}
      </span>
      {onCurrent ? (
        <button className="aw-text-button" onClick={onCurrent}>
          Back to live preview
        </button>
      ) : null}
    </div>
  );
}
export function ExportPanel({
  preview,
  document,
  onSource,
  onProject,
  onError,
}: {
  preview: string | null;
  document: WorkspaceDocument;
  onSource: () => void;
  onProject: () => void;
  onError: (message: string) => void;
}) {
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(0.92);
  const [busy, setBusy] = useState(false);
  async function download() {
    if (!preview) return;
    setBusy(true);
    try {
      const image = new Image();
      image.src = preview;
      await image.decode();
      const canvas = window.document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Browser encoding is unavailable.");
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(image, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Image encoding failed."))),
          `image/${format}`,
          quality,
        ),
      );
      if (blob.type !== `image/${format}`)
        throw new Error(
          `This browser cannot encode ${format.toUpperCase()}. Choose PNG.`,
        );
      downloadFile(
        blob,
        `${document.name.replace(/[^a-z0-9_-]/gi, "-").slice(0, 70) || "apexify-output"}.${format === "jpeg" ? "jpg" : format}`,
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="aw-export">
      <Field label="Format">
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
          <option value="jpeg">JPEG</option>
        </select>
      </Field>
      {format !== "png" ? (
        <Field label={`Quality ${Math.round(quality * 100)}%`}>
          <input
            aria-label="Export quality"
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </Field>
      ) : (
        <p className="aw-muted">Lossless · original resolution</p>
      )}
      <div className="aw-export-actions">
        <button
          className="aw-button aw-primary"
          disabled={!preview || busy}
          onClick={download}
        >
          <ArrowDownTrayIcon />
          {busy ? "Encoding…" : "Download"}
        </button>
        <IconButton label="Download project JSON" onClick={onProject}>
          <DocumentIcon />
        </IconButton>
        <IconButton label="Download Apexify source" onClick={onSource}>
          <CodeBracketIcon />
        </IconButton>
      </div>
    </div>
  );
}
export function Terminal({
  logs,
  onCommand,
}: {
  logs: LogEntry[];
  onCommand: (command: string) => void;
}) {
  const [command, setCommand] = useState("");
  return (
    <div className="aw-terminal">
      <div
        className="aw-terminal-logs"
        role="log"
        aria-label="Workspace execution log"
      >
        {[...logs].reverse().map((log) => (
          <div key={log.id} className={`aw-log-${log.kind}`}>
            <time>{log.time}</time>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCommand(command);
          setCommand("");
        }}
      >
        <CommandLineIcon />
        <input
          aria-label="Workspace command"
          placeholder="help · render · inspect · undo · clear"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
