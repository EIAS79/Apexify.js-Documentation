'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
import { BrandIcon } from './Brand';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/studio', label: 'Studio' },
  { href: '/docs#00-start-here', label: 'Docs' },
] as const;

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

  const isActive = (href: string) => {
    const linkPath = href.split('#')[0];
    return pathname === linkPath || (linkPath !== '/' && pathname?.startsWith(linkPath));
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 px-3 sm:px-5 transition-all duration-500 ${
        scrolled ? 'pt-2 sm:pt-3' : 'pt-3 sm:pt-5'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Outer shell — gradient rim that appears on scroll */}
        <div
          className="relative rounded-2xl p-[1px] transition-all duration-500"
          style={{
            backgroundImage: scrolled
              ? 'linear-gradient(135deg, var(--accent-iris), var(--accent-magenta), var(--accent-amber))'
              : 'linear-gradient(135deg, color-mix(in srgb, var(--accent-iris) 50%, transparent), color-mix(in srgb, var(--accent-magenta) 50%, transparent), color-mix(in srgb, var(--accent-amber) 40%, transparent))',
            backgroundSize: '200% 200%',
            animation: 'gradient-pan 12s ease infinite',
            boxShadow: scrolled
              ? '0 14px 40px -16px rgba(123, 108, 255, 0.35), 0 6px 20px -10px rgba(255, 61, 170, 0.28)'
              : '0 8px 28px -14px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Inner pill */}
          <div
            className="rounded-[15px] backdrop-blur-2xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-canvas) 82%, transparent)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 md:px-5 py-2 min-h-[3.25rem] sm:min-h-[3.5rem]">
              {/* Logo */}
              <Link
                href="/"
                className="group/logo flex items-center gap-2 flex-shrink-0 min-w-0"
                aria-label="Apexify.js — home"
              >
                <span
                  className="relative inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 group-hover/logo:scale-105"
                  style={{ boxShadow: 'var(--glow-magenta)' }}
                  aria-hidden
                >
                  <BrandIcon />
                </span>
                <span
                  className="text-base sm:text-lg lg:text-xl font-black tracking-tight bg-[length:200%_auto] bg-clip-text text-transparent transition-[background-position] duration-700 group-hover/logo:bg-[position:100%_50%]"
                  style={{
                    backgroundImage: 'var(--gradient-aurora)',
                  }}
                >
                  Apexify.js
                </span>
              </Link>

              {/* Center nav (desktop) */}
              <div className="hidden md:flex items-center gap-0.5 lg:gap-1 flex-1 justify-center">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative px-3 lg:px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                    >
                      {link.label}
                      {active && (
                        <span
                          className="absolute left-1/2 -translate-x-1/2 bottom-0.5 h-1 w-1 rounded-full"
                          style={{
                            backgroundImage: 'var(--gradient-sunset)',
                            boxShadow: 'var(--glow-magenta)',
                          }}
                          aria-hidden
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Right cluster */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <ThemeToggle className="hidden sm:inline-flex" />

                <a
                  href="https://github.com/EIAS79/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>

                <a
                  href="https://www.npmjs.com/package/apexify.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary !py-1.5 !px-3 sm:!px-4 !text-xs sm:!text-sm"
                >
                  <span className="hidden sm:inline">Install</span>
                  <span className="sm:hidden">npm</span>
                  <span className="hidden lg:inline opacity-80">npm i apexify.js</span>
                </a>

                <button
                  type="button"
                  className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border touch-manipulation"
                  style={{
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav-menu"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  {mobileOpen ? (
                    <XMarkIcon className="h-5 w-5" />
                  ) : (
                    <Bars3Icon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile drawer */}
            <div
              id="mobile-nav-menu"
              className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out border-t ${
                mobileOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
              }`}
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex flex-col py-2 px-2">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-[15px]"
                      style={{
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        backgroundColor: active
                          ? 'color-mix(in srgb, var(--accent-magenta) 12%, transparent)'
                          : 'transparent',
                      }}
                    >
                      <span>{link.label}</span>
                      {active && (
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundImage: 'var(--gradient-sunset)' }}
                        />
                      )}
                    </Link>
                  );
                })}
                <div className="flex items-center justify-between px-4 py-3 mt-1">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Theme
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
