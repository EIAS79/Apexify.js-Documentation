'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { InteractiveCodeEditor } from '@/components/docs/playground/InteractiveCodeEditor';

type PreviewModalProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (name: string) => void;
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  onDownload: () => void;
};

export function VisualPreviewModal({
  open,
  onClose,
  name,
  onNameChange,
  previewUrl,
  loading,
  error,
  onDownload,
}: PreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!previewUrl) return;
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPan({
      x: drag.current.panX + event.clientX - drag.current.x,
      y: drag.current.panY + event.clientY - drag.current.y,
    });
  };

  const endPan = () => {
    drag.current = null;
  };

  return (
    <div className="apx-vmodal-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="apx-vmodal apx-vmodal--preview" role="dialog" aria-modal="true" aria-label="Canvas preview" data-visual-preview-modal>
        <header className="apx-vmodal-head">
          <div className="apx-vmodal-title">
            <strong>Canvas Preview</strong>
            <span>Clean output · drag to pan · zoom freely</span>
          </div>
          <div className="apx-vmodal-actions">
            <button type="button" onClick={() => setZoom((value) => Math.max(.25, value - .1))} title="Zoom out">
              <MagnifyingGlassMinusIcon />
            </button>
            <span className="apx-vmodal-zoom">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(4, value + .1))} title="Zoom in">
              <MagnifyingGlassPlusIcon />
            </button>
            <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
            <button className="apx-vmodal-primary" type="button" onClick={onDownload} disabled={!previewUrl}>
              <ArrowDownTrayIcon /> Download
            </button>
            <button type="button" onClick={onClose} title="Close" data-visual-preview-modal-close><XMarkIcon /></button>
          </div>
        </header>

        <div className="apx-vmodal-subbar">
          <label>
            <span>Canvas name</span>
            <input value={name} onChange={(event) => onNameChange(event.target.value)} />
          </label>
        </div>

        <div
          className="apx-vmodal-preview-stage"
          data-dragging={drag.current ? 'true' : undefined}
          onPointerDown={beginPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          {loading ? (
            <div className="apx-vmodal-state"><strong>Rendering preview…</strong><span>Apexify is generating the current canvas.</span></div>
          ) : error ? (
            <div className="apx-vmodal-state apx-vmodal-state--error"><strong>Preview unavailable</strong><span>{error}</span></div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={name || 'Canvas preview'}
              draggable={false}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            />
          ) : (
            <div className="apx-vmodal-state"><strong>No output yet</strong><span>Run the current Visual source to create a preview.</span></div>
          )}
        </div>
      </section>
    </div>
  );
}

type CodeModalProps = {
  open: boolean;
  onClose: () => void;
  source: string;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onCopy: () => void;
  onDownload: () => void;
};

export function VisualCodeModal({
  open,
  onClose,
  source,
  fileName,
  onFileNameChange,
  onCopy,
  onDownload,
}: CodeModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="apx-vmodal-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="apx-vmodal apx-vmodal--code" role="dialog" aria-modal="true" aria-label="Generated code preview" data-visual-code-modal>
        <header className="apx-vmodal-head">
          <div className="apx-vmodal-title">
            <strong>Generated Code</strong>
            <span>Syntax-highlighted Apexify.js source</span>
          </div>
          <div className="apx-vmodal-actions">
            <button type="button" onClick={onCopy}><ClipboardDocumentIcon /> Copy</button>
            <button className="apx-vmodal-primary" type="button" onClick={onDownload}>
              <ArrowDownTrayIcon /> Download
            </button>
            <button type="button" onClick={onClose} title="Close" data-visual-code-modal-close><XMarkIcon /></button>
          </div>
        </header>

        <div className="apx-vmodal-subbar">
          <label>
            <span>File name</span>
            <input value={fileName} onChange={(event) => onFileNameChange(event.target.value)} />
          </label>
        </div>

        <div className="apx-vmodal-code">
          <InteractiveCodeEditor
            value={source}
            language="ts"
            onChange={() => {}}
            readOnly
            fillParent
            ariaLabel="Generated Apexify code"
          />
        </div>
      </section>
    </div>
  );
}
