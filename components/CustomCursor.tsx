'use client';

import { useEffect, useId, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Feather Icons “mouse-pointer” polygon geometry (same classic silhouette adopted by Lucide;
 * ISC — https://feathericons.com ). We only draw the arrow outline; hotspot matches the pixel
 * tip at `(3,3)` in their 24×24 view box.
 *
 *   • Idle: gradient-outlined arrow + neon glow pass.
 *   • Dot  — precise centre when hovering text / magnetic targets.
 *   • Wrap — morphing ring (magnet / text underline).
 *
 * Driven with direct DOM + RAF (no React state per frame).
 */
const POINTER_VIEWBOX = 24;
const POINTER_DISPLAY_PX = 28;
/** Click point at the arrow tip in user space `(3,3)` → raster coordinates for our ~28px render. */
const POINTER_HOTSPOT_X = (3 / POINTER_VIEWBOX) * POINTER_DISPLAY_PX;
const POINTER_HOTSPOT_Y = (3 / POINTER_VIEWBOX) * POINTER_DISPLAY_PX;
/** Feather ISC: closed arrow pointer silhouette (absolute coords). */
const POINTER_PATH_D = 'M3 3 L10.07 19.97 L12.58 12.58 L19.97 10.07 Z';

export default function CustomCursor() {
  const cursorUid = useId().replace(/:/g, '');
  const gradientId = `apex-cursor-grad-${cursorUid}`;
  const pointerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* Magnet shape-morph is gated to homepage + docs only.
     Everywhere else (gallery, studio, etc.) keeps the arrow + dot + text
     accent — no element-wrap behavior. */
  const magnetEnabledRef = useRef(false);
  magnetEnabledRef.current =
    pathname === '/' || pathname === '' || (pathname?.startsWith('/docs') ?? false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsHover) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.documentElement.classList.add('has-custom-cursor');

    const pointer = pointerRef.current;
    const dot = dotRef.current;
    const wrap = wrapRef.current;
    if (!pointer || !dot || !wrap) return;

    /* ---- mouse target ---- */
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    /* ---- wrap geometry: current (lerped) + target ---- */
    const DEFAULT_SIZE = 28;
    const cur = { x: target.x, y: target.y, w: DEFAULT_SIZE, h: DEFAULT_SIZE, r: 9999 };
    const tgt = { x: target.x, y: target.y, w: DEFAULT_SIZE, h: DEFAULT_SIZE, r: 9999 };

    let mode: 'default' | 'magnet' | 'text' = 'default';
    let magnetEl: Element | null = null;
    let visible = false;
    let raf = 0;

    /* ---- helpers ---- */

    const updateMagnetTarget = () => {
      if (!magnetEl) return;
      const rect = (magnetEl as HTMLElement).getBoundingClientRect();
      // 6px padding so the wrap sits *around* the element, not flush.
      const pad = 6;
      tgt.w = rect.width + pad * 2;
      tgt.h = rect.height + pad * 2;
      tgt.x = rect.left + rect.width / 2;
      tgt.y = rect.top + rect.height / 2;
      const cs = window.getComputedStyle(magnetEl as HTMLElement);
      const radius = parseFloat(cs.borderRadius || '0');
      // Match element radius + the padding we added; clamp to a pill if very rounded.
      tgt.r = Number.isFinite(radius) && radius > 0
        ? Math.min(radius + pad, Math.min(tgt.w, tgt.h) / 2)
        : 12;
    };

    const setDefaultTarget = () => {
      tgt.x = target.x;
      tgt.y = target.y;
      tgt.w = DEFAULT_SIZE;
      tgt.h = DEFAULT_SIZE;
      tgt.r = 9999;
    };

    const setTextTarget = () => {
      // Tiny pill underline that hugs the cursor.
      tgt.x = target.x;
      tgt.y = target.y + 10;
      tgt.w = 16;
      tgt.h = 2;
      tgt.r = 2;
    };

    const findMagnetTarget = (el: Element | null): HTMLElement | null => {
      if (!el) return null;
      // Magnet only runs on routes that opt in (homepage + docs).
      if (!magnetEnabledRef.current) return null;
      // Honor explicit overrides first.
      const explicit = (el as HTMLElement).closest?.('[data-cursor]') as HTMLElement | null;
      if (explicit) {
        const v = explicit.dataset.cursor;
        if (v === 'none') return null;
        if (v === 'link' || v === 'button' || v === 'magnet') return explicit;
      }
      // Auto: any clearly clickable element. Skip giant hit areas (>360 wide).
      const candidate = (el as HTMLElement).closest?.(
        'a, button, [role="button"], [role="tab"], [role="option"], summary'
      ) as HTMLElement | null;
      if (!candidate) return null;
      const rect = candidate.getBoundingClientRect();
      if (rect.width > 420 || rect.height > 120) return null;
      return candidate;
    };

    const isTextTarget = (el: Element | null): boolean => {
      if (!el) return false;
      // Caret-edit fields use the system text caret already; we just add a small accent.
      if ((el as HTMLElement).closest?.('input, textarea, [contenteditable="true"]')) return true;
      // Any selectable body text (paragraphs, headings, list items).
      const text = (el as HTMLElement).closest?.('p, h1, h2, h3, h4, h5, h6, li, blockquote, code, pre');
      return Boolean(text);
    };

    const applyLayerVisibility = () => {
      if (!visible) {
        pointer.style.opacity = '0';
        dot.style.opacity = '0';
        wrap.style.opacity = '0';
        return;
      }
      if (mode === 'default') {
        pointer.style.opacity = '1';
        dot.style.opacity = '0';
        wrap.style.opacity = '0';
      } else {
        pointer.style.opacity = '0';
        dot.style.opacity = '1';
        wrap.style.opacity = '1';
      }
    };

    const recompute = (el: Element | null) => {
      const newMagnet = findMagnetTarget(el);
      if (newMagnet) {
        if (mode !== 'magnet' || newMagnet !== magnetEl) {
          mode = 'magnet';
          magnetEl = newMagnet;
          wrap.dataset.mode = 'magnet';
        }
        updateMagnetTarget();
        applyLayerVisibility();
        return;
      }
      magnetEl = null;
      if (isTextTarget(el)) {
        if (mode !== 'text') {
          mode = 'text';
          wrap.dataset.mode = 'text';
        }
        setTextTarget();
        applyLayerVisibility();
        return;
      }
      if (mode !== 'default') {
        mode = 'default';
        wrap.dataset.mode = 'default';
      }
      setDefaultTarget();
      applyLayerVisibility();
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
      }
      pointer.style.transform = `translate3d(${e.clientX - POINTER_HOTSPOT_X}px, ${e.clientY - POINTER_HOTSPOT_Y}px, 0)`;
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      recompute(e.target as Element);
    };

    const onLeave = () => {
      visible = false;
      applyLayerVisibility();
    };

    const onDown = () => {
      wrap.dataset.pressed = 'true';
      pointer.dataset.pressed = 'true';
    };
    const onUp = () => {
      delete wrap.dataset.pressed;
      delete pointer.dataset.pressed;
    };

    /* Recompute magnet target on scroll/resize since the bound element moves */
    const onScrollOrResize = () => {
      if (mode === 'magnet') updateMagnetTarget();
    };

    const tick = () => {
      const ease = reducedMotion ? 1 : (mode === 'magnet' ? 0.28 : 0.32);
      const sizeEase = reducedMotion ? 1 : 0.22;

      cur.x += (tgt.x - cur.x) * ease;
      cur.y += (tgt.y - cur.y) * ease;
      cur.w += (tgt.w - cur.w) * sizeEase;
      cur.h += (tgt.h - cur.h) * sizeEase;
      cur.r += (tgt.r - cur.r) * sizeEase;

      if (mode !== 'default') {
        wrap.style.width = `${cur.w}px`;
        wrap.style.height = `${cur.h}px`;
        wrap.style.borderRadius = `${cur.r}px`;
        wrap.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`;
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
      >
        <svg
          className="custom-cursor-pointer__svg"
          width={POINTER_DISPLAY_PX}
          height={POINTER_DISPLAY_PX}
          viewBox={`0 0 ${POINTER_VIEWBOX} ${POINTER_VIEWBOX}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--accent-iris)" />
              <stop offset="0.5" stopColor="var(--accent-magenta)" />
              <stop offset="1" stopColor="var(--accent-amber)" />
            </linearGradient>
          </defs>
          {/* Glow pass beneath the crisp stroke (neon halo without adding a runtime dependency). */}
          <path
            aria-hidden
            d={POINTER_PATH_D}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.22}
          />
          <path
            className="custom-cursor-pointer__shape"
            d={POINTER_PATH_D}
            stroke={`url(#${gradientId})`}
            strokeWidth="1.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
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
      <div
        ref={dotRef}
        aria-hidden
        className="custom-cursor-dot"
        style={{ opacity: 0 }}
      />
    </>
  );
}
