'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';

function clampZoom(z: number) {
  return Math.min(4, Math.max(0.25, Math.round(z * 100) / 100));
}

/** Scale so the full image fits inside the scroll viewport (with a little inset). */
function fitZoomForContainer(
  naturalW: number,
  naturalH: number,
  containerW: number,
  containerH: number,
  insetPx = 12,
): number {
  const availW = Math.max(1, containerW - insetPx * 2);
  const availH = Math.max(1, containerH - insetPx * 2);
  return clampZoom(Math.min(availW / naturalW, availH / naturalH));
}

function centerScrollViewport(sc: HTMLDivElement) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      sc.scrollLeft = Math.max(0, (sc.scrollWidth - sc.clientWidth) / 2);
      sc.scrollTop = Math.max(0, (sc.scrollHeight - sc.clientHeight) / 2);
    });
  });
}

/**
 * Zoom + scroll pan + drag-to-pan (hand) for PNG/GIF previews. Shares
 * its visual language with the gallery modal.
 */
export function StudioPreviewZoom({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [grabPan, setGrabPan] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const mousePanRef = useRef<{
    phase: 'idle' | 'pending' | 'dragging';
    clientX: number;
    clientY: number;
    scrollLeft: number;
    scrollTop: number;
  }>({ phase: 'idle', clientX: 0, clientY: 0, scrollLeft: 0, scrollTop: 0 });

  zoomRef.current = zoom;

  const applyFitToView = useCallback(() => {
    if (!natural) return;
    const run = () => {
      const sc = scrollRef.current;
      if (!sc || !natural) return;
      if (sc.clientWidth < 2 || sc.clientHeight < 2) {
        requestAnimationFrame(run);
        return;
      }
      const z = fitZoomForContainer(natural.w, natural.h, sc.clientWidth, sc.clientHeight);
      setZoom(z);
      centerScrollViewport(sc);
    };
    run();
  }, [natural]);

  useEffect(() => {
    setNatural(null);
  }, [src]);

  /** After each new run / preview URL, fit the full image in the panel. */
  useEffect(() => {
    if (!natural) return;
    applyFitToView();
  }, [natural, src, applyFitToView]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      setZoom((z) => clampZoom(z + delta));
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    const dist = (touches: TouchList | Touch[]) => {
      if (touches.length < 2) return 0;
      const a = touches[0];
      const b = touches[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = dist(e.touches);
        if (d > 0) pinchRef.current = { startDist: d, startZoom: zoomRef.current };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      const d = dist(e.touches);
      if (d <= 0) return;
      e.preventDefault();
      const { startDist, startZoom } = pinchRef.current;
      setZoom(clampZoom(startZoom * (d / startDist)));
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const zoomIn = () => setZoom((z) => clampZoom(z + 0.25));
  const zoomOut = () => setZoom((z) => clampZoom(z - 0.25));
  const resetZoom = () => setZoom(1);
  const fit = () => applyFitToView();

  const onDoubleClick = () => {
    setZoom((z) => (z <= 1.01 ? 2 : 1));
  };

  const endMousePan = (el: HTMLDivElement, pointerId: number) => {
    if (mousePanRef.current.phase === 'idle') return;
    mousePanRef.current.phase = 'idle';
    setGrabPan(false);
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      /* already released */
    }
  };

  const btnBase =
    'touch-manipulation rounded-md p-2 transition-colors active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35';

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 px-1 pb-1.5 pt-0.5 sm:gap-2 sm:px-2 sm:pb-2 sm:pt-1">
      <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center min-[420px]:justify-between">
        <p
          className="order-2 text-[10px] leading-snug min-[420px]:order-1 sm:text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
            Hand: drag · {' '}
          </span>
          <span className="sm:hidden" style={{ color: 'var(--text-tertiary)' }}>Pinch · drag · </span>
          <kbd className="kbd hidden sm:inline-flex">Ctrl</kbd>
          <span className="hidden sm:inline"> / </span>
          <kbd className="kbd hidden sm:inline-flex">⌘</kbd>
          <span className="hidden sm:inline"> scroll · double-click to toggle</span>
        </p>
        <div
          className="order-1 flex w-full max-w-full items-center justify-center gap-0.5 rounded-lg p-0.5 min-[420px]:order-2 min-[420px]:w-auto min-[420px]:justify-end"
          style={{
            border: '1px solid var(--border-default)',
            backgroundColor: 'color-mix(in srgb, var(--bg-raised) 70%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.26}
            className={btnBase}
            style={{ color: 'inherit' }}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <span
            className="tabular-nums text-xs font-semibold min-w-[3rem] text-center"
            aria-live="polite"
            style={{ color: 'var(--text-secondary)' }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 3.99}
            className={btnBase}
            style={{ color: 'inherit' }}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={fit}
            className={`${btnBase} ml-0.5 border-l`}
            style={{ borderColor: 'var(--border-default)', color: 'inherit' }}
            aria-label="Fit image in view"
            title="Fit image in view"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className={btnBase}
            style={{ color: 'inherit' }}
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`min-h-[160px] flex-1 touch-pan-x touch-pan-y overflow-auto rounded-lg p-2 sm:min-h-[200px] sm:rounded-xl sm:p-4 md:p-5 ${
          natural ? (grabPan ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        style={{
          backgroundImage:
            'linear-gradient(45deg, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 25%, transparent 25%), linear-gradient(-45deg, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 75%), linear-gradient(-45deg, transparent 75%, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: 'var(--bg-canvas)',
          boxShadow: '0 0 0 1px var(--border-subtle) inset',
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || e.button !== 0) return;
          const sc = scrollRef.current;
          if (!sc) return;
          mousePanRef.current = {
            phase: 'pending',
            clientX: e.clientX,
            clientY: e.clientY,
            scrollLeft: sc.scrollLeft,
            scrollTop: sc.scrollTop,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const p = mousePanRef.current;
          if (p.phase === 'idle') return;
          const sc = scrollRef.current;
          if (!sc) return;
          const dx = e.clientX - p.clientX;
          const dy = e.clientY - p.clientY;
          if (p.phase === 'pending' && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
            p.phase = 'dragging';
            setGrabPan(true);
          }
          if (p.phase === 'dragging') {
            sc.scrollLeft = p.scrollLeft - dx;
            sc.scrollTop = p.scrollTop - dy;
          }
        }}
        onPointerUp={(e) => endMousePan(e.currentTarget, e.pointerId)}
        onPointerCancel={(e) => endMousePan(e.currentTarget, e.pointerId)}
        onLostPointerCapture={() => {
          if (mousePanRef.current.phase !== 'idle') {
            mousePanRef.current.phase = 'idle';
            setGrabPan(false);
          }
        }}
      >
        <div
          className="grid max-w-none max-h-none place-items-center"
          style={
            natural
              ? {
                  minWidth: `max(100%, ${natural.w * zoom}px)`,
                  minHeight: `max(100%, ${natural.h * zoom}px)`,
                }
              : { minWidth: '100%', minHeight: '100%' }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onDoubleClick={onDoubleClick}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            style={
              natural
                ? {
                    width: natural.w * zoom,
                    height: natural.h * zoom,
                    maxWidth: 'none',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: '0.5rem',
                  }
                : {
                    maxHeight: 'min(55vh, 560px)',
                    width: 'auto',
                    height: 'auto',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: '0.5rem',
                  }
            }
            className={`select-none ${natural ? 'block max-w-none shrink-0 cursor-[inherit]' : 'object-contain'}`}
          />
        </div>
      </div>
    </div>
  );
}
