'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

function clampZoom(z: number) {
  return Math.min(4, Math.max(0.25, Math.round(z * 100) / 100));
}

export default function GalleryZoomablePreview({ src, alt }: { src: string; alt: string }) {
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

  useEffect(() => {
    setZoom(1);
    setNatural(null);
  }, [src]);

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
  const onDoubleClick = () => setZoom((z) => (z <= 1.01 ? 2 : 1));

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

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between shrink-0 px-0.5">
        <p
          className="text-[11px] order-last sm:order-first w-full sm:w-auto text-center sm:text-left leading-snug"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Drag to pan · pinch zoom · <span className="kbd">Ctrl</span> /{' '}
          <span className="kbd">⌘</span> + scroll
        </p>
        <div
          className="flex items-center gap-1 rounded-lg p-0.5 border"
          style={{
            backgroundColor: 'var(--bg-sunken)',
            borderColor: 'var(--border-default)',
          }}
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.26}
            className="p-2 rounded-md transition-colors disabled:opacity-35 disabled:pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <span
            className="tabular-nums text-xs font-semibold min-w-[3rem] text-center"
            style={{ color: 'var(--text-tertiary)' }}
            aria-live="polite"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 3.99}
            className="p-2 rounded-md transition-colors disabled:opacity-35 disabled:pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="p-2 rounded-md transition-colors border-l ml-0.5 pl-2"
            style={{
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-default)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-raised)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`flex-1 min-h-[180px] overflow-auto rounded-xl touch-pan-x touch-pan-y p-4 sm:p-6 ${
          natural ? (grabPan ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        style={{
          backgroundColor: 'var(--bg-sunken)',
          border: '1px solid var(--border-subtle)',
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  }
                : {
                    maxHeight: 'min(70vh, 800px)',
                    width: 'auto',
                    height: 'auto',
                  }
            }
            className={`rounded-lg shadow-2xl select-none ${
              natural ? 'block max-w-none shrink-0 cursor-[inherit]' : 'object-contain'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
