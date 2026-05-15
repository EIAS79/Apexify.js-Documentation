'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Custom cursor — magnetic shape-morph design.
 *
 *   • Dot         — precise pointer indicator (zero-lag, blends with bg).
 *   • Wrap        — a single morphing shape:
 *                     · default → small circle eased toward pointer
 *                     · hovering an interactive element → snaps to that
 *                       element's bounding rect + border-radius (magnetic
 *                       wrap), with smooth lerped width/height/x/y/radius
 *                     · hovering text  → tiny accent underline near pointer
 *
 * No ambient bloom. All driven by direct DOM transforms in a RAF loop —
 * no React state churn during movement.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /* Magnet shape-morph is gated to homepage + docs only.
     Everywhere else (gallery, studio, etc.) keeps the default
     dot + small ring + text accent — no element-wrap behavior. */
  const magnetEnabledRef = useRef(false);
  magnetEnabledRef.current =
    pathname === '/' || pathname === '' || (pathname?.startsWith('/docs') ?? false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsHover) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.documentElement.classList.add('has-custom-cursor');

    const dot = dotRef.current;
    const wrap = wrapRef.current;
    if (!dot || !wrap) return;

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

    const recompute = (el: Element | null) => {
      const newMagnet = findMagnetTarget(el);
      if (newMagnet) {
        if (mode !== 'magnet' || newMagnet !== magnetEl) {
          mode = 'magnet';
          magnetEl = newMagnet;
          wrap.dataset.mode = 'magnet';
        }
        updateMagnetTarget();
        return;
      }
      magnetEl = null;
      if (isTextTarget(el)) {
        if (mode !== 'text') {
          mode = 'text';
          wrap.dataset.mode = 'text';
        }
        setTextTarget();
        return;
      }
      if (mode !== 'default') {
        mode = 'default';
        wrap.dataset.mode = 'default';
      }
      setDefaultTarget();
    };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        wrap.style.opacity = '1';
      }
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      recompute(e.target as Element);
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      wrap.style.opacity = '0';
    };

    const onDown = () => { wrap.dataset.pressed = 'true'; };
    const onUp = () => { delete wrap.dataset.pressed; };

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

      wrap.style.width = `${cur.w}px`;
      wrap.style.height = `${cur.h}px`;
      wrap.style.borderRadius = `${cur.r}px`;
      wrap.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`;

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
