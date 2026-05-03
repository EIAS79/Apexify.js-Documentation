'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/docs#Getting-Started', label: 'Documentation', shortLabel: 'Docs' },
  ];

  const linkClass = (isActive: boolean) =>
    `group relative block md:inline-block text-center md:text-left font-semibold transition-all duration-300 px-4 py-3 md:px-4 md:py-2.5 rounded-xl whitespace-nowrap overflow-hidden ${
      isActive
        ? 'text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] bg-gradient-to-br from-blue-500/35 via-violet-600/25 to-fuchsia-600/20 border border-white/20 shadow-lg shadow-blue-500/25'
        : 'text-gray-300 hover:text-white border border-transparent hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_0_20px_-6px_rgba(56,189,248,0.35)]'
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'pt-1 sm:pt-2' : 'pt-2 sm:pt-4'
      } px-2 sm:px-4 lg:px-8`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Gradient rim + depth — reads less “flat” than a single border */}
        <div
          className={`relative rounded-xl sm:rounded-2xl p-[1px] transition-shadow duration-500 ${
            scrolled
              ? 'shadow-[0_12px_40px_-12px_rgba(56,189,248,0.22),0_4px_24px_-8px_rgba(139,92,246,0.15)]'
              : 'shadow-[0_24px_60px_-16px_rgba(0,0,0,0.65),0_0_48px_-12px_rgba(99,102,241,0.18)]'
          }`}
          style={{
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.45), rgba(139,92,246,0.42), rgba(236,72,153,0.38), rgba(56,189,248,0.45))',
            backgroundSize: '200% 200%',
            animation: 'gradient 12s ease infinite',
          }}
        >
          <div className="rounded-[11px] sm:rounded-[15px] bg-gradient-to-b from-slate-900/92 via-slate-950/96 to-black/90 backdrop-blur-2xl border border-white/[0.07] overflow-visible">
            <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 md:px-6 min-h-[3.25rem] sm:min-h-[3.5rem] md:min-h-[4rem]">
              <Link
                href="/"
                className="flex-shrink-0 min-w-0 pr-1 group/logo transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-[length:200%_auto] bg-clip-text text-transparent truncate block transition-[background-position] duration-700 group-hover/logo:bg-[position:100%_50%]">
                  Apexify.js
                </span>
              </Link>

              <div className="hidden md:flex items-center justify-center gap-1.5 lg:gap-2 flex-1 min-w-0 px-2">
                {navLinks.map((link) => {
                  const linkPath = link.href.split('#')[0];
                  const isActive = pathname === linkPath;
                  const compact = link.shortLabel ?? link.label;
                  return (
                    <Link key={link.href} href={link.href} className={linkClass(isActive)}>
                      {!isActive && (
                        <span
                          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-cyan-500/0 via-white/10 to-violet-500/0"
                          aria-hidden
                        />
                      )}
                      <span className="relative z-[1] hidden lg:inline">{link.label}</span>
                      <span className="relative z-[1] lg:hidden">{compact}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
                <a
                  href="https://github.com/EIAS79/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/8 border border-transparent hover:border-white/15 hover:shadow-[0_0_20px_-6px_rgba(56,189,248,0.4)] touch-manipulation"
                  aria-label="GitHub"
                >
                  <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a
                  href="https://www.npmjs.com/package/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/8 border border-transparent hover:border-white/15 hover:shadow-[0_0_20px_-6px_rgba(236,72,153,0.35)] touch-manipulation"
                  aria-label="npm"
                >
                  <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.666H5.334v-4H3.999v4H1.335V8.667h5.331v5.333zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.337v4h-1.335v-4h-1.33v4h-2.671V8.667h8.003v5.333z" />
                  </svg>
                </a>

                <Link
                  href="/docs#Getting-Started"
                  className="group/cta relative inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 overflow-hidden rounded-xl text-white text-[11px] sm:text-sm font-bold whitespace-nowrap touch-manipulation max-[380px]:px-2 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-[length:200%_100%] animate-gradient shadow-[0_0_24px_-6px_rgba(59,130,246,0.55)] hover:shadow-[0_0_32px_-4px_rgba(139,92,246,0.55)]"
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 translate-x-[-120%] skew-x-[-14deg] transition-all duration-700 group-hover/cta:opacity-100 group-hover/cta:translate-x-[120%]" aria-hidden />
                  <span className="relative z-10 max-[380px]:hidden">Get Started</span>
                  <span className="relative z-10 hidden max-[380px]:inline">Go</span>
                  <svg className="relative z-10 w-3 h-3 sm:w-4 sm:h-4 shrink-0 group-hover/cta:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 touch-manipulation"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-menu"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                </button>
              </div>
            </div>

            <div
              id="mobile-nav-menu"
              className={`md:hidden border-t border-white/[0.08] bg-black/40 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out ${
                mobileOpen ? 'max-h-[min(70vh,420px)] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
              }`}
            >
              <div className="flex flex-col py-2 pb-3">
                {navLinks.map((link) => {
                  const linkPath = link.href.split('#')[0];
                  const isActive = pathname === linkPath;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={linkClass(isActive)}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
