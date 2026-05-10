'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';

/**
 * Full-page Sunset on Indigo backdrop.
 *
 * Layers (bottom → top):
 *   1. Vertical twilight wash (uses --gradient-twilight from tokens, so it
 *      flips with theme).
 *   2. Three drifting auroras (iris / magenta / amber) with animations
 *      defined in globals.css.
 *   3. Slow-panning isometric grid.
 *   4. SVG grain overlay (very subtle).
 *   5. Cursor-follow bloom (only on dark mode; light mode reads cleaner
 *      without it).
 */
export default function AmbientBackground() {
  const { theme } = useTheme();
  const [mouse, setMouse] = useState({ x: 50, y: 30 });
  const [prefersReducedMotion, setPRM] = useState(false);

  useEffect(() => {
    setPRM(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (theme !== 'dark') return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMouse({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* Layer 1 — twilight wash */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--gradient-twilight)' }}
      />

      {/* Layer 2 — auroras (positions tuned for asymmetric balance) */}
      <div
        className="absolute aurora-a"
        style={{
          left: '-8%',
          top: '5%',
          width: 'min(70vw, 720px)',
          height: 'min(70vw, 720px)',
          background: isDark
            ? 'radial-gradient(closest-side, rgba(123, 108, 255, 0.55), rgba(123, 108, 255, 0.15) 45%, transparent 70%)'
            : 'radial-gradient(closest-side, rgba(79, 63, 255, 0.18), rgba(79, 63, 255, 0.06) 50%, transparent 75%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute aurora-b"
        style={{
          right: '-10%',
          top: '20%',
          width: 'min(75vw, 760px)',
          height: 'min(75vw, 760px)',
          background: isDark
            ? 'radial-gradient(closest-side, rgba(255, 61, 170, 0.5), rgba(255, 61, 170, 0.12) 50%, transparent 75%)'
            : 'radial-gradient(closest-side, rgba(233, 30, 140, 0.16), rgba(233, 30, 140, 0.05) 50%, transparent 75%)',
          filter: 'blur(70px)',
        }}
      />
      <div
        className="absolute aurora-c"
        style={{
          left: '15%',
          bottom: '-12%',
          width: 'min(80vw, 820px)',
          height: 'min(80vw, 820px)',
          background: isDark
            ? 'radial-gradient(closest-side, rgba(255, 179, 71, 0.4), rgba(255, 179, 71, 0.1) 50%, transparent 75%)'
            : 'radial-gradient(closest-side, rgba(232, 148, 26, 0.16), rgba(232, 148, 26, 0.05) 55%, transparent 78%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Layer 3 — drifting grid */}
      <div
        className={`absolute inset-0 ${prefersReducedMotion ? '' : 'grid-drift'}`}
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(123, 108, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(123, 108, 255, 0.08) 1px, transparent 1px)'
            : 'linear-gradient(rgba(26, 15, 61, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 15, 61, 0.045) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: isDark ? 0.55 : 0.85,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 90%)',
        }}
      />

      {/* Layer 4 — SVG grain (very subtle, only on dark) */}
      {isDark && (
        <div
          className="absolute inset-0 mix-blend-overlay opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      )}

      {/* Layer 5 — cursor bloom (dark only, gentle) */}
      {isDark && !prefersReducedMotion && (
        <div
          className="absolute rounded-full mix-blend-screen pointer-events-none"
          style={{
            left: `${mouse.x}%`,
            top: `${mouse.y}%`,
            width: '320px',
            height: '320px',
            transform: 'translate3d(-50%, -50%, 0)',
            background:
              'radial-gradient(circle, rgba(255, 122, 200, 0.18), rgba(123, 108, 255, 0.08) 45%, transparent 70%)',
            filter: 'blur(28px)',
            transition: 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1), top 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: 0.9,
          }}
        />
      )}

      {/* Bottom horizon line — subtle "horizon" anchor for the sunset metaphor */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, transparent, rgba(7, 5, 26, 0.6))'
            : 'linear-gradient(180deg, transparent, rgba(246, 239, 226, 0.6))',
        }}
      />
    </div>
  );
}
