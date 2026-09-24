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

const MODAL_FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useModalFocusTrap(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE))
        .filter((node) => !node.hasAttribute('disabled') && node.offsetParent !== null);

    const initial = focusables()[0] ?? dialog;
    window.requestAnimationFrame(() => initial.focus());

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = focusables();
      if (!nodes.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore?.isConnected) {
        restore.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return dialogRef;
}

type PreviewModalProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  onNameChange: (name: string) => void;
  previewUrl: string | null;
  previewMime?: string;
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
  previewMime = 'image/png',
  loading,
  error,
  onDownload,
}: PreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const dialogRef = useModalFocusTrap(open, onClose);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [open]);

  if (!open) return null;

  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!previewUrl || previewMime.startsWith('audio/') || previewMime.startsWith('video/')) return;
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
      <section ref={dialogRef} tabIndex={-1} className="apx-vmodal apx-vmodal--preview" role="dialog" aria-modal="true" aria-label="Canvas preview" data-visual-preview-modal>
        <header className="apx-vmodal-head">
          <div className="apx-vmodal-title">
            <strong>{previewMime.startsWith('audio/') ? 'Audio Preview' : previewMime.startsWith('video/') ? 'Video Preview' : 'Canvas Preview'}</strong>
            <span>{previewMime.startsWith('audio/') ? 'Real Apexify WAV output · native playback' : previewMime.startsWith('video/') ? 'Real Apexify FFmpeg output · native playback' : 'Clean output · drag to pan · zoom freely'}</span>
          </div>
          <div className="apx-vmodal-actions">
            {!previewMime.startsWith('audio/') && !previewMime.startsWith('video/') ? (
              <>
                <button type="button" onClick={() => setZoom((value) => Math.max(.25, value - .1))} title="Zoom out">
                  <MagnifyingGlassMinusIcon />
                </button>
                <span className="apx-vmodal-zoom">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={() => setZoom((value) => Math.min(4, value + .1))} title="Zoom in">
                  <MagnifyingGlassPlusIcon />
                </button>
                <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
              </>
            ) : null}
            <button className="apx-vmodal-primary" type="button" onClick={onDownload} disabled={!previewUrl}>
              <ArrowDownTrayIcon /> Download
            </button>
            <button type="button" onClick={onClose} title="Close" data-visual-preview-modal-close><XMarkIcon /></button>
          </div>
        </header>

        <div className="apx-vmodal-subbar">
          <label>
            <span>{previewMime.startsWith('audio/') || previewMime.startsWith('video/') ? 'Project name' : 'Canvas name'}</span>
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
          ) : previewUrl && previewMime.startsWith('audio/') ? (
            <div className="apx-vmodal-audio">
              <div className="apx-vmodal-audio-mark">♪</div>
              <strong>{name || 'Audio preview'}</strong>
              <span>{previewMime}</span>
              <audio controls autoPlay preload="metadata" src={previewUrl} data-visual-audio-player />
            </div>
          ) : previewUrl && previewMime.startsWith('video/') ? (
            <div className="apx-vmodal-video">
              <strong>{name || 'Video preview'}</strong>
              <span>{previewMime}</span>
              <video controls autoPlay playsInline preload="metadata" src={previewUrl} data-visual-video-player />
            </div>
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
  provenanceEnabled: boolean;
  onProvenanceChange: (enabled: boolean) => void;
  qualityMessage: string;
  qualityOk: boolean;
};

export function VisualCodeModal({
  open,
  onClose,
  source,
  fileName,
  onFileNameChange,
  onCopy,
  onDownload,
  provenanceEnabled,
  onProvenanceChange,
  qualityMessage,
  qualityOk,
}: CodeModalProps) {
  const dialogRef = useModalFocusTrap(open, onClose);

  if (!open) return null;

  return (
    <div className="apx-vmodal-backdrop" role="presentation" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} tabIndex={-1} className="apx-vmodal apx-vmodal--code" role="dialog" aria-modal="true" aria-label="Generated code preview" data-visual-code-modal>
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

        <div className="apx-vmodal-subbar apx-phase15-code-subbar">
          <label>
            <span>File name</span>
            <input value={fileName} onChange={(event) => onFileNameChange(event.target.value)} />
          </label>
          <label className="apx-phase15-provenance">
            <input
              type="checkbox"
              checked={provenanceEnabled}
              onChange={(event) => onProvenanceChange(event.target.checked)}
              data-phase15-provenance-toggle
            />
            <span>Include provenance</span>
          </label>
          <span
            className="apx-phase15-code-quality"
            data-quality={qualityOk ? 'ok' : 'error'}
            title={qualityMessage}
          >
            {qualityOk ? 'Canonical export' : 'Export issue'}
          </span>
        </div>

        <div className="apx-vmodal-code" data-phase15-clean-code>
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
