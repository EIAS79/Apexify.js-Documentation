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
  return Math.min(4, Math.max(0.1, Math.round(z * 100) / 100));
}

function fitZoomForContainer(
  naturalW: number,
  naturalH: number,
  containerW: number,
  containerH: number,
  insetPx = 18,
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

export function StudioPreviewZoom({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [grabPan, setGrabPan] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const naturalRef = useRef<{ w: number; h: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const mousePanRef = useRef<{
    phase: 'idle' | 'pending' | 'dragging';
    clientX: number;
    clientY: number;
    scrollLeft: number;
    scrollTop: number;
  }>({ phase: 'idle', clientX: 0, clientY: 0, scrollLeft: 0, scrollTop: 0 });

  zoomRef.current = zoom;
  naturalRef.current = natural;

  const setZoomAroundCenter = useCallback((nextZoom: number) => {
    const sc = scrollRef.current;
    const current = zoomRef.current;
    const next = clampZoom(nextZoom);
    if (!sc || !naturalRef.current || Math.abs(next - current) < 0.001) {
      setZoom(next);
      return;
    }

    const centerX = (sc.scrollLeft + sc.clientWidth / 2) / Math.max(current, 0.001);
    const centerY = (sc.scrollTop + sc.clientHeight / 2) / Math.max(current, 0.001);
    setZoom(next);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = scrollRef.current;
        if (!target) return;
        target.scrollLeft = Math.max(0, centerX * next - target.clientWidth / 2);
        target.scrollTop = Math.max(0, centerY * next - target.clientHeight / 2);
      });
    });
  }, []);

  const applyFitToView = useCallback(() => {
    const currentNatural = naturalRef.current;
    const sc = scrollRef.current;
    if (!currentNatural || !sc) return;

    const run = () => {
      const target = scrollRef.current;
      const image = naturalRef.current;
      if (!target || !image) return;
      if (target.clientWidth < 2 || target.clientHeight < 2) {
        requestAnimationFrame(run);
        return;
      }
      const next = fitZoomForContainer(image.w, image.h, target.clientWidth, target.clientHeight);
      zoomRef.current = next;
      setZoom(next);
      centerScrollViewport(target);
    };

    run();
  }, []);

  const resetView = useCallback(() => {
    mousePanRef.current.phase = 'idle';
    setGrabPan(false);
    applyFitToView();
  }, [applyFitToView]);

  useEffect(() => {
    setNatural(null);
    naturalRef.current = null;
    setZoom(1);
    zoomRef.current = 1;
  }, [src]);

  useEffect(() => {
    if (!natural) return;
    applyFitToView();
  }, [natural, src, applyFitToView]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement === rootRef.current;
      setFullscreen(isFullscreen);
      requestAnimationFrame(() => requestAnimationFrame(applyFitToView));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [applyFitToView]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.88 : 1.12;
      setZoomAroundCenter(zoomRef.current * factor);
    };

    const dist = (touches: TouchList | Touch[]) => {
      if (touches.length < 2) return 0;
      const a = touches[0];
      const b = touches[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      const distance = dist(event.touches);
      if (distance > 0) pinchRef.current = { startDist: distance, startZoom: zoomRef.current };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || !pinchRef.current) return;
      const distance = dist(event.touches);
      if (distance <= 0) return;
      event.preventDefault();
      setZoomAroundCenter(pinchRef.current.startZoom * (distance / pinchRef.current.startDist));
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchRef.current = null;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
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
  }, [setZoomAroundCenter]);

  const toggleFullscreen = async () => {
    const root = rootRef.current;
    if (!root) return;

    try {
      if (document.fullscreenElement === root) await document.exitFullscreen();
      else if (!document.fullscreenElement) await root.requestFullscreen();
    } catch {
      // Fullscreen can be blocked by browser policy; all other preview controls remain available.
    }
  };

  const onDoubleClick = () => {
    const sc = scrollRef.current;
    const image = naturalRef.current;
    if (!sc || !image) return;
    const fit = fitZoomForContainer(image.w, image.h, sc.clientWidth, sc.clientHeight);
    const next = zoomRef.current <= fit * 1.08 ? Math.min(2, Math.max(1, fit * 2)) : fit;
    setZoomAroundCenter(next);
  };

  const endMousePan = (el: HTMLDivElement, pointerId: number) => {
    if (mousePanRef.current.phase === 'idle') return;
    mousePanRef.current.phase = 'idle';
    setGrabPan(false);
    try {
      el.releasePointerCapture(pointerId);
    } catch {
      // Pointer capture may already have been released.
    }
  };

  const btnBase =
    'touch-manipulation rounded-md p-2 transition-colors active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35';

  return (
    <div
      ref={rootRef}
      className="studio-preview-workspace flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 px-1 pb-1.5 pt-0.5 sm:gap-2 sm:px-2 sm:pb-2 sm:pt-1"
      data-fullscreen={fullscreen || undefined}
    >
      <div className="studio-preview-toolbar flex shrink-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center min-[420px]:justify-between">
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
          <span className="hidden sm:inline"> + wheel to zoom · double-click</span>
        </p>

        <div
          className="studio-preview-controls order-1 flex w-full max-w-full items-center justify-center gap-0.5 rounded-lg p-0.5 min-[420px]:order-2 min-[420px]:w-auto min-[420px]:justify-end"
          style={{
            border: '1px solid var(--border-default)',
            backgroundColor: 'color-mix(in srgb, var(--bg-raised) 86%, transparent)',
            color: 'var(--text-secondary)',
          }}
        >
          <button
            type="button"
            onClick={() => setZoomAroundCenter(zoomRef.current - 0.2)}
            disabled={zoom <= 0.11}
            className={btnBase}
            style={{ color: 'inherit' }}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>

          <span
            className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums"
            aria-live="polite"
            style={{ color: 'var(--text-secondary)' }}
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoomAroundCenter(zoomRef.current + 0.2)}
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
            onClick={applyFitToView}
            className={btnBase + ' ml-0.5 border-l'}
            style={{ borderColor: 'var(--border-default)', color: 'inherit' }}
            aria-label="Fit preview to view"
            title="Fit preview to view"
          >
            <ViewfinderCircleIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={btnBase}
            style={{ color: 'inherit' }}
            aria-label={fullscreen ? 'Exit fullscreen preview' : 'Open fullscreen preview'}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen
              ? <ArrowsPointingInIcon className="h-4 w-4" />
              : <ArrowsPointingOutIcon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={resetView}
            className={btnBase}
            style={{ color: 'inherit' }}
            aria-label="Reset preview view"
            title="Reset pan and zoom"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        data-cursor={natural ? 'pointer' : undefined}
        className={
          'studio-preview-scroll min-h-[160px] flex-1 overflow-auto rounded-lg p-2 sm:min-h-[200px] sm:rounded-xl sm:p-4 md:p-5 ' +
          (natural ? (grabPan ? 'cursor-grabbing' : 'cursor-grab') : '')
        }
        style={{
          touchAction: 'pan-x pan-y pinch-zoom',
          backgroundImage:
            'linear-gradient(45deg, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 25%, transparent 25%), linear-gradient(-45deg, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 75%), linear-gradient(-45deg, transparent 75%, color-mix(in srgb, var(--bg-sunken) 70%, transparent) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: 'var(--bg-canvas)',
          boxShadow: '0 0 0 1px var(--border-subtle) inset',
        }}
        onPointerDown={(event) => {
          if (event.pointerType === 'touch' || event.button !== 0) return;
          const sc = scrollRef.current;
          if (!sc) return;
          event.preventDefault();
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
          if (mousePanRef.current.phase !== 'idle') {
            mousePanRef.current.phase = 'idle';
            setGrabPan(false);
          }
        }}
      >
        <div
          className="grid max-h-none max-w-none place-items-center"
          style={
            natural
              ? {
                  minWidth: 'max(100%, ' + natural.w * zoom + 'px)',
                  minHeight: 'max(100%, ' + natural.h * zoom + 'px)',
                }
              : { minWidth: '100%', minHeight: '100%' }
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- blob/data URL preview */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onDoubleClick={onDoubleClick}
            onLoad={(event) => {
              const element = event.currentTarget;
              const next = { w: element.naturalWidth, h: element.naturalHeight };
              naturalRef.current = next;
              setNatural(next);
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
            className={'select-none ' + (natural ? 'block max-w-none shrink-0 cursor-[inherit]' : 'object-contain')}
          />
        </div>
      </div>
    </div>
  );
}
