'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom pointer for hover-capable fine-pointer devices.
 *
 * States:
 * - default: clean arrow with a precise hotspot
 * - magnet: hovered control is outlined using its real bounds/radius,
 *   while the pointer becomes a hand cursor
 * - text: compact caret marker
 *
 * Motion uses direct DOM + RAF so tracking does not trigger React renders.
 */
const POINTER_VIEWBOX = 24;
const POINTER_DISPLAY_PX = 24;

const ARROW_HOTSPOT_X = (3.4 / POINTER_VIEWBOX) * POINTER_DISPLAY_PX;
const ARROW_HOTSPOT_Y = (2.6 / POINTER_VIEWBOX) * POINTER_DISPLAY_PX;
const HAND_HOTSPOT_X = (8.2 / POINTER_VIEWBOX) * POINTER_DISPLAY_PX;
const HAND_HOTSPOT_Y = (4.1 / POINTER_VIEWBOX) * POINTER_DISPLAY_PX;

const POINTER_PATH_D =
  'M3.4 2.6V19.1L7.7 14.9L10.9 21.2L14 19.7L10.9 13.6L17.2 13L3.4 2.6Z';

const HAND_PATH_D =
  'M8.2 11.3V5.8a1.65 1.65 0 0 1 3.3 0v4.1V7.7a1.55 1.55 0 0 1 3.1 0v2.7V8.9a1.55 1.55 0 0 1 3.1 0v2.1a1.5 1.5 0 0 1 3 0v3.5c0 4.2-3.2 7.2-7.4 7.2h-.9c-2.5 0-4.1-.9-5.6-2.8L3.9 15a1.65 1.65 0 0 1 2.5-2.1l1.8 1.5v-3.1Z';

export default function CustomCursor() {
  const pointerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsHover) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('has-custom-cursor');

    const pointer = pointerRef.current;
    const wrap = wrapRef.current;
    if (!pointer || !wrap) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const DEFAULT_SIZE = 24;
    const cur = { x: target.x, y: target.y, w: DEFAULT_SIZE, h: DEFAULT_SIZE, r: 7 };
    const tgt = { x: target.x, y: target.y, w: DEFAULT_SIZE, h: DEFAULT_SIZE, r: 7 };

    let mode: 'default' | 'magnet' | 'text' = 'default';
    let magnetEl: HTMLElement | null = null;
    let visible = false;
    let raf = 0;

    const setMode = (nextMode: typeof mode) => {
      mode = nextMode;
      wrap.dataset.mode = nextMode;
      pointer.dataset.mode = nextMode;
    };

    const readRadius = (element: HTMLElement) => {
      const style = window.getComputedStyle(element);
      const values = [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ]
        .map((value) => Number.parseFloat(value))
        .filter(Number.isFinite);

      return values.length ? Math.max(...values) : 0;
    };

    const updateMagnetTarget = () => {
      if (!magnetEl) return;

      const rect = magnetEl.getBoundingClientRect();
      const padding = 5;
      const radius = readRadius(magnetEl);

      tgt.x = rect.left + rect.width / 2;
      tgt.y = rect.top + rect.height / 2;
      tgt.w = rect.width + padding * 2;
      tgt.h = rect.height + padding * 2;
      tgt.r = Math.max(6, radius + padding);
    };

    const setDefaultTarget = () => {
      tgt.x = target.x;
      tgt.y = target.y;
      tgt.w = DEFAULT_SIZE;
      tgt.h = DEFAULT_SIZE;
      tgt.r = 7;
    };

    const setTextTarget = () => {
      tgt.x = target.x + 8;
      tgt.y = target.y;
      tgt.w = 2;
      tgt.h = 18;
      tgt.r = 2;
    };

    const findMagnetTarget = (el: Element | null): HTMLElement | null => {
      if (!el) return null;

      const explicit = (el as HTMLElement).closest?.('[data-cursor]') as HTMLElement | null;
      if (explicit) {
        const value = explicit.dataset.cursor;
        if (value === 'none') return null;
        if (value === 'link' || value === 'button' || value === 'magnet') return explicit;
      }

      const candidate = (el as HTMLElement).closest?.(
        'a, button, [role="button"], [role="tab"], [role="option"], summary'
      ) as HTMLElement | null;

      if (!candidate) return null;

      const rect = candidate.getBoundingClientRect();

      // Prevent giant page/card hit areas from swallowing the cursor.
      // Normal controls, nav items and compact cards still receive the morph.
      if (rect.width > 520 || rect.height > 160) return null;

      return candidate;
    };

    const isTextTarget = (el: Element | null): boolean => {
      if (!el) return false;

      if ((el as HTMLElement).closest?.('input, textarea, [contenteditable="true"]')) {
        return true;
      }

      const text = (el as HTMLElement).closest?.(
        'p, h1, h2, h3, h4, h5, h6, li, blockquote, code, pre'
      );

      return Boolean(text);
    };

    const applyVisibility = () => {
      if (!visible) {
        pointer.style.opacity = '0';
        wrap.style.opacity = '0';
        return;
      }

      if (mode === 'default') {
        pointer.style.opacity = '1';
        wrap.style.opacity = '0';
        return;
      }

      if (mode === 'magnet') {
        pointer.style.opacity = '1';
        wrap.style.opacity = '1';
        return;
      }

      pointer.style.opacity = '0';
      wrap.style.opacity = '1';
    };

    const recompute = (el: Element | null) => {
      const nextMagnet = findMagnetTarget(el);

      if (nextMagnet) {
        magnetEl = nextMagnet;
        if (mode !== 'magnet') setMode('magnet');
        updateMagnetTarget();
        applyVisibility();
        return;
      }

      magnetEl = null;

      if (isTextTarget(el)) {
        if (mode !== 'text') setMode('text');
        setTextTarget();
        applyVisibility();
        return;
      }

      if (mode !== 'default') setMode('default');
      setDefaultTarget();
      applyVisibility();
    };

    const positionPointer = () => {
      const hotspotX = mode === 'magnet' ? HAND_HOTSPOT_X : ARROW_HOTSPOT_X;
      const hotspotY = mode === 'magnet' ? HAND_HOTSPOT_Y : ARROW_HOTSPOT_Y;

      pointer.style.transform =
        `translate3d(${target.x - hotspotX}px, ${target.y - hotspotY}px, 0)`;
    };

    const onMove = (event: MouseEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      visible = true;

      recompute(event.target as Element);
      positionPointer();
    };

    const onLeave = () => {
      visible = false;
      applyVisibility();
    };

    const onDown = () => {
      wrap.dataset.pressed = 'true';
      pointer.dataset.pressed = 'true';
    };

    const onUp = () => {
      delete wrap.dataset.pressed;
      delete pointer.dataset.pressed;
    };

    const onScrollOrResize = () => {
      if (mode === 'magnet') updateMagnetTarget();
      positionPointer();
    };

    const tick = () => {
      const moveEase = reducedMotion ? 1 : mode === 'magnet' ? 0.34 : 0.38;
      const sizeEase = reducedMotion ? 1 : 0.28;

      cur.x += (tgt.x - cur.x) * moveEase;
      cur.y += (tgt.y - cur.y) * moveEase;
      cur.w += (tgt.w - cur.w) * sizeEase;
      cur.h += (tgt.h - cur.h) * sizeEase;
      cur.r += (tgt.r - cur.r) * sizeEase;

      if (mode !== 'default') {
        wrap.style.width = `${cur.w}px`;
        wrap.style.height = `${cur.h}px`;
        wrap.style.borderRadius = `${cur.r}px`;
        wrap.style.transform =
          `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', onScrollOrResize);

    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div
        ref={pointerRef}
        aria-hidden
        className="custom-cursor-pointer"
        style={{ opacity: 0 }}
        data-mode="default"
      >
        <svg
          className="custom-cursor-pointer__svg custom-cursor-pointer__svg--arrow"
          width={POINTER_DISPLAY_PX}
          height={POINTER_DISPLAY_PX}
          viewBox={`0 0 ${POINTER_VIEWBOX} ${POINTER_VIEWBOX}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="custom-cursor-pointer__shape"
            d={POINTER_PATH_D}
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="custom-cursor-pointer__svg custom-cursor-pointer__svg--hand"
          width={POINTER_DISPLAY_PX}
          height={POINTER_DISPLAY_PX}
          viewBox={`0 0 ${POINTER_VIEWBOX} ${POINTER_VIEWBOX}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="custom-cursor-pointer__hand-shape"
            d={HAND_PATH_D}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        ref={wrapRef}
        aria-hidden
        className="custom-cursor-wrap"
        style={{ opacity: 0 }}
        data-mode="default"
      />
    </>
  );
}
