'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    `block md:inline-block text-center md:text-left font-semibold transition-all duration-300 px-4 py-3 md:px-3 md:py-2 rounded-lg md:rounded-lg whitespace-nowrap ${
      isActive
        ? 'text-white bg-blue-600/30 border border-blue-500/50 shadow-lg shadow-blue-500/20'
        : 'text-gray-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pt-2 sm:pt-4 px-2 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-lg sm:rounded-xl md:rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 shadow-2xl overflow-visible">
          <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 md:px-6 min-h-[3.25rem] sm:min-h-[3.5rem] md:min-h-[4rem]">
            <Link href="/" className="flex-shrink-0 min-w-0 pr-1">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent truncate block">
                Apexify.js
              </span>
            </Link>

            {/* Tablet/desktop — inline links, centered breathing room */}
            <div className="hidden md:flex items-center justify-center gap-1 lg:gap-2 flex-1 min-w-0 px-2">
              {navLinks.map((link) => {
                const linkPath = link.href.split('#')[0];
                const isActive = pathname === linkPath;
                const compact = link.shortLabel ?? link.label;
                return (
                  <Link key={link.href} href={link.href} className={linkClass(isActive)}>
                    <span className="hidden lg:inline">{link.label}</span>
                    <span className="lg:hidden">{compact}</span>
                  </Link>
                );
              })}
            </div>

            {/* External + CTA — fixed cluster, never overlaps nav text */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              <a
                href="https://github.com/EIAS79/apexify.js"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/50 touch-manipulation"
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
                className="text-gray-300 hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/50 touch-manipulation"
                aria-label="npm"
              >
                <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.666H5.334v-4H3.999v4H1.335V8.667h5.331v5.333zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.337v4h-1.335v-4h-1.33v4h-2.671V8.667h8.003v5.333z" />
                </svg>
              </a>

              <Link
                href="/docs#Getting-Started"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-[11px] sm:text-sm font-bold rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/35 hover:shadow-blue-500/55 whitespace-nowrap touch-manipulation max-[380px]:px-2"
              >
                <span className="max-[380px]:hidden">Get Started</span>
                <span className="hidden max-[380px]:inline">Go</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/80 border border-slate-600/50 touch-manipulation"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-menu"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile / small tablet — full-width panel, no overlap with logo row */}
          <div
            id="mobile-nav-menu"
            className={`md:hidden border-t border-slate-700/50 bg-slate-950/95 transition-[max-height,opacity] duration-300 ease-out ${
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
    </nav>
  );
}
