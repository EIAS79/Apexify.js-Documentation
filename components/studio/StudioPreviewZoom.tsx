'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline';

function clampZoom(z: number) {
  return Math.min(4, Math.max(0.25, Math.round(z * 100) / 100));
}

function fitZoomForContainer(
  naturalW: number,
  naturalH: number,
  containerW: number,
  containerH: number,
  insetPx = 16,
): number {
  const availW = Math.max(1, containerW - insetPx * 2);
  const availH = Math.max(1, containerH - insetPx * 2);
  return clampZoom(Math.min(availW / naturalW, availH / naturalH, 1));
}

function afterPaint(callback: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

/**
 * Studio image viewport with explicit zoom, fit, reset, fullscreen and drag-to-pan.
 * The image remains a real PNG/GIF element; the controls only change the viewport.
 */
export function StudioPreviewZoom({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [grabPan, setGrabPan] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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

  const centerViewport = useCallback(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    afterPaint(() => {
      sc.scrollLeft = Math.max(0, (sc.scrollWidth - sc.clientWidth) / 2);
      sc.scrollTop = Math.max(0, (sc.scrollHeight - sc.clientHeight) / 2);
    });
  }, []);

  const applyFitToView = useCallback(() => {
    if (!natural) return;
    const run = () => {
      const sc = scrollRef.current;
      if (!sc) return;
      if (sc.clientWidth < 2 || sc.clientHeight < 2) {
        requestAnimationFrame(run);
        return;
      }
      setZoom(fitZoomForContainer(natural.w, natural.h, sc.clientWidth, sc.clientHeight));
      centerViewport();
    };
    run();
  }, [natural, centerViewport]);

  const changeZoom = useCallback((nextZoom: number) => {
    const sc = scrollRef.current;
    const oldZoom = zoomRef.current;
    const next = clampZoom(nextZoom);
    if (!sc || !natural || Math.abs(next - oldZoom) < 0.001) {
      setZoom(next);
      return;
    }

    const centerX = sc.scrollLeft + sc.clientWidth / 2;
    const centerY = sc.scrollTop + sc.clientHeight / 2;
    const imageW = Math.max(1, natural.w * oldZoom);
    const imageH = Math.max(1, natural.h * oldZoom);
    const ratioX = centerX / Math.max(sc.scrollWidth, imageW);
    const ratioY = centerY / Math.max(sc.scrollHeight, imageH);

    setZoom(next);
    afterPaint(() => {
      const current = scrollRef.current;
      if (!current) return;
      current.scrollLeft = Math.max(0, ratioX * current.scrollWidth - current.clientWidth / 2);
      current.scrollTop = Math.max(0, ratioY * current.scrollHeight - current.clientHeight / 2);
    });
  }, [natural]);

  useEffect(() => {
    setNatural(null);
    setZoom(1);
  }, [src]);

  useEffect(() => {
    if (!natural) return;
    applyFitToView();
  }, [natural, src, applyFitToView]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === rootRef.current;
      setFullscreen(isFullscreen);
      if (isFullscreen && natural) afterPaint(applyFitToView);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [natural, applyFitToView]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      changeZoom(zoomRef.current + (event.deltaY > 0 ? -0.12 : 0.12));
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    const dist = (touches: TouchList | Touch[]) => {
      if (touches.length < 2) return 0;
      const a = touches[0];
      const b = touches[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const d = dist(event.touches);
        if (d > 0) pinchRef.current = { startDist: d, startZoom: zoomRef.current };
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || !pinchRef.current) return;
      const d = dist(event.touches);
      if (d <= 0) return;
      event.preventDefault();
      changeZoom(pinchRef.current.startZoom * (d / pinchRef.current.startDist));
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchRef.current = null;
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
  }, [changeZoom]);

  const resetView = () => {
    setZoom(1);
    centerViewport();
  };

  const toggleFullscreen = async () => {
    const root = rootRef.current;
    if (!root) return;
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen();
      else await root.requestFullscreen();
    } catch {
      // Fullscreen may be blocked by the browser or an embedded preview host.
    }
  };

  const endMousePan = (el: HTMLDivElement, pointerId: number) => {
    if (mousePanRef.current.phase === 'idle') return;
    mousePanRef.current.phase = 'idle';
    setGrabPan(false);
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      // Pointer capture can already be released by the browser.
    }
  };

  const btnBase =
    'touch-manipulation rounded-md p-2 transition-colors active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35';

  return (
    <div
      ref={rootRef}
      className="studio-preview-zoom flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 px-1 pb-1.5 pt-0.5 sm:gap-2 sm:px-2 sm:pb-2 sm:pt-1"
      data-fullscreen={fullscreen || undefined}
    >
      <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center min-[420px]:justify-between">
        <p
          className="order-2 text-[10px] leading-snug min-[420px]:order-1 sm:text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
            Drag to pan ·{' '}
          </span>
          <span className="sm:hidden" style={{ color: 'var(--text-tertiary)' }}>Pinch · drag · </span>
          <kbd className="kbd hidden sm:inline-flex">Ctrl</kbd>
          <span className="hidden sm:inline"> / </span>
          <kbd className="kbd hidden sm:inline-flex">⌘</kbd>
          <span className="hidden sm:inline"> + wheel to zoom · double-click 100/200%</span>
        </p>

        <div
          className="studio-preview-controls order-1 flex w-full max-w-full items-center justify-center gap-0.5 rounded-lg p-0.5 min-[420px]:order-2 min-[420px]:w-auto min-[420px]:justify-end"
          style={{
            border: '1px solid var(--border-default)',
            backgroundColor: 'color-mix(in srgb, var(--bg-raised) 88%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          <button type="button" onClick={() => changeZoom(zoom - 0.25)} disabled={zoom <= 0.26} className={btnBase} aria-label="Zoom out" title="Zoom out">
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" onClick={() => changeZoom(zoom + 0.25)} disabled={zoom >= 3.99} className={btnBase} aria-label="Zoom in" title="Zoom in">
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={applyFitToView} className={`${btnBase} ml-0.5 border-l`} style={{ borderColor: 'var(--border-default)' }} aria-label="Fit image in view" title="Fit image in view">
            <ViewfinderCircleIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={resetView} className={btnBase} aria-label="Reset view to 100 percent and center" title="Reset view">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void toggleFullscreen()} className={btnBase} aria-label={fullscreen ? 'Exit fullscreen preview' : 'Open fullscreen preview'} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {fullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`studio-preview-scroll min-h-[160px] flex-1 touch-pan-x touch-pan-y overflow-auto rounded-lg p-2 sm:min-h-[200px] sm:rounded-xl sm:p-4 md:p-5 ${natural ? (grabPan ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        style={{
          backgroundImage:
            'linear-gradient(45deg, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 25%, transparent 25%), linear-gradient(-45deg, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 75%), linear-gradient(-45deg, transparent 75%, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: 'var(--bg-canvas)',
          boxShadow: '0 0 0 1px var(--border-subtle) inset',
          userSelect: 'none',
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0 || !natural) return;
          const sc = scrollRef.current;
          if (!sc) return;
          mousePanRef.current = {
            phase: 'pending',
            clientX: event.clientX,
            clientY: event.clientY,
            scrollLeft: sc.scrollLeft,
            scrollTop: sc.scrollTop,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const pan = mousePanRef.current;
          if (pan.phase === 'idle') return;
          const sc = scrollRef.current;
          if (!sc) return;
          const dx = event.clientX - pan.clientX;
          const dy = event.clientY - pan.clientY;
          if (pan.phase === 'pending' && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
            pan.phase = 'dragging';
            setGrabPan(true);
          }
          if (pan.phase === 'dragging') {
            event.preventDefault();
            sc.scrollLeft = pan.scrollLeft - dx;
            sc.scrollTop = pan.scrollTop - dy;
          }
        }}
        onPointerUp={(event) => endMousePan(event.currentTarget, event.pointerId)}
        onPointerCancel={(event) => endMousePan(event.currentTarget, event.pointerId)}
        onLostPointerCapture={() => {
          mousePanRef.current.phase = 'idle';
          setGrabPan(false);
        }}
      >
        <div
          className="grid max-h-none max-w-none place-items-center"
          style={
            natural
              ? {
                  minWidth: `max(100%, ${natural.w * zoom}px)`,
                  minHeight: `max(100%, ${natural.h * zoom}px)`,
                }
              : { minWidth: '100%', minHeight: '100%' }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- browser-generated preview */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onDoubleClick={() => changeZoom(zoom <= 1.01 ? 2 : 1)}
            onLoad={(event) => {
              const image = event.currentTarget;
              setNatural({ w: image.naturalWidth, h: image.naturalHeight });
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
            className="block max-w-none shrink-0 select-none cursor-[inherit]"
          />
        </div>
      </div>
    </div>
  );
}
