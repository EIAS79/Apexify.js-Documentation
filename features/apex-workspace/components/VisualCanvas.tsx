"use client";
import { useRef, type PointerEvent } from "react";
import {
  ArrowPathIcon,
  CursorArrowRaysIcon,
  HandRaisedIcon,
  MinusIcon,
  PlusIcon,
  PlayIcon,
  ViewfinderCircleIcon,
} from "@heroicons/react/24/outline";
import type { WorkspaceDocument, WorkspaceLayer } from "../model";
import { IconButton } from "./ui";
export default function VisualCanvas({
  document,
  preview,
  previewError,
  rendering,
  selected,
  onSelect,
  onMove,
  zoom,
  setZoom,
  onRender,
  hand,
  setHand,
}: {
  document: WorkspaceDocument;
  preview: string | null;
  previewError: string | null;
  rendering: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  zoom: number;
  setZoom: (value: number) => void;
  onRender: () => void;
  hand: boolean;
  setHand: (value: boolean) => void;
}) {
  const artRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  function fitCanvas() {
    const el = scrollRef.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const width =
      el.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const height =
      el.clientHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom);
    setZoom(
      Math.max(
        10,
        Math.floor(
          Math.min(1, height / ((width * document.height) / document.width)) *
            100,
        ),
      ),
    );
  }
  function startMove(
    event: PointerEvent<HTMLButtonElement>,
    layer: WorkspaceLayer,
  ) {
    if (hand) return;
    event.stopPropagation();
    onSelect(layer.id);
    const rect = artRef.current!.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY };
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    const move = (e: globalThis.PointerEvent) =>
      onMove(
        layer.id,
        Math.round(
          Math.max(
            -4096,
            Math.min(
              4096,
              layer.x + ((e.clientX - start.x) / rect.width) * document.width,
            ),
          ),
        ),
        Math.round(
          Math.max(
            -4096,
            Math.min(
              4096,
              layer.y + ((e.clientY - start.y) / rect.height) * document.height,
            ),
          ),
        ),
      );
    const stop = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
  }
  return (
    <div className="aw-visual">
      <div className="aw-canvas-toolbar">
        <span className="aw-file-tab">
          TS&nbsp; main.ts <span className="aw-file-dot" />
        </span>
        <span className="aw-canvas-size">
          Canvas · {document.width} × {document.height}
        </span>
        <div className="aw-zoom">
          <IconButton
            label="Zoom out"
            onClick={() => setZoom(Math.max(25, zoom - 25))}
          >
            <MinusIcon />
          </IconButton>
          <span>{zoom}%</span>
          <IconButton
            label="Zoom in"
            onClick={() => setZoom(Math.min(300, zoom + 25))}
          >
            <PlusIcon />
          </IconButton>
        </div>
        <IconButton
          label="Select layers"
          active={!hand}
          onClick={() => setHand(false)}
        >
          <CursorArrowRaysIcon />
        </IconButton>
        <IconButton
          label="Pan canvas"
          active={hand}
          onClick={() => setHand(true)}
        >
          <HandRaisedIcon />
        </IconButton>
        <IconButton label="Fit canvas" onClick={fitCanvas}>
          <ViewfinderCircleIcon />
        </IconButton>
      </div>
      <div
        ref={scrollRef}
        className={`aw-artboard-scroll${hand ? " aw-hand" : ""}`}
        onPointerDown={(e) => {
          if (!hand || !scrollRef.current) return;
          const el = e.currentTarget;
          const startX = e.clientX,
            startY = e.clientY,
            left = el.scrollLeft,
            top = el.scrollTop;
          el.setPointerCapture(e.pointerId);
          const move = (p: globalThis.PointerEvent) => {
            el.scrollLeft = left - (p.clientX - startX);
            el.scrollTop = top - (p.clientY - startY);
          };
          const end = () => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerup", end);
            el.removeEventListener("pointercancel", end);
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerup", end);
          el.addEventListener("pointercancel", end);
        }}
      >
        <div className="aw-artboard-fit" style={{ width: `${zoom}%` }}>
          <div
            ref={artRef}
            className="aw-artboard"
            style={{ aspectRatio: `${document.width}/${document.height}` }}
            onClick={() => onSelect(null)}
          >
            {preview ? (
              <img
                className="aw-render-image"
                src={preview}
                alt={`${document.name} rendered by Apexify.js`}
                draggable={false}
              />
            ) : (
              <div className="aw-first-render">
                {previewError ? (
                  <span role="alert">{previewError}</span>
                ) : (
                  <>
                    <ArrowPathIcon className="aw-spin" />
                    <span>Preparing Apexify render…</span>
                  </>
                )}
              </div>
            )}
            {document.layers
              .filter((l) => l.visible)
              .map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  aria-label={`Select ${layer.name}`}
                  className={`aw-selection${selected === layer.id ? " selected" : ""}`}
                  style={{
                    left: `${(layer.x / document.width) * 100}%`,
                    top: `${(layer.y / document.height) * 100}%`,
                    width: `${(layer.width / document.width) * 100}%`,
                    height: `${(layer.height / document.height) * 100}%`,
                    transform: `rotate(${layer.rotation}deg)`,
                  }}
                  onClick={(e) => {
                    if (hand) return;
                    e.stopPropagation();
                    onSelect(layer.id);
                  }}
                  onPointerDown={(e) => startMove(e, layer)}
                  onKeyDown={(e) => {
                    const offsets: Record<string, [number, number]> = {
                      ArrowLeft: [-1, 0],
                      ArrowRight: [1, 0],
                      ArrowUp: [0, -1],
                      ArrowDown: [0, 1],
                    };
                    if (offsets[e.key]) {
                      e.preventDefault();
                      const [dx, dy] = offsets[e.key];
                      onMove(
                        layer.id,
                        Math.max(
                          -4096,
                          Math.min(4096, layer.x + dx * (e.shiftKey ? 10 : 1)),
                        ),
                        Math.max(
                          -4096,
                          Math.min(4096, layer.y + dy * (e.shiftKey ? 10 : 1)),
                        ),
                      );
                    }
                  }}
                >
                  {selected === layer.id ? (
                    <>
                      <span className="aw-layer-label">{layer.name}</span>
                      <i />
                      <i />
                      <i />
                      <i />
                    </>
                  ) : null}
                </button>
              ))}
          </div>
        </div>
      </div>
      <div className="aw-stage-actions">
        <IconButton label="Render composition" onClick={onRender}>
          <PlayIcon />
        </IconButton>
      </div>
      <footer className="aw-canvas-status">
        <span className={rendering ? "aw-status-working" : "aw-status-ready"} />
        {rendering
          ? "Rendering changes…"
          : previewError
            ? "Preview needs attention · see Terminal"
            : "Apexify.js v6 · Node render"}
        <span>{document.layers.length} layers</span>
      </footer>
    </div>
  );
}
