'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
import { useSidebar } from '@/contexts/SidebarContext';
import { DocsSearchPalette } from './DocsSearchPalette';
import { BrandIcon } from './Brand';
import { apexifyVersionLabel } from '@/lib/apexify-version';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/studio', label: 'Studio' },
  { href: '/docs#00-start-here', label: 'Docs' },
] as const;

const PACKAGE_VERSION = apexifyVersionLabel();

export default function DocHeader() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isDocsRoute = pathname === '/docs' || pathname?.startsWith('/docs/');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isDocsRoute) {
          document.getElementById('docs-sidebar-search-input')?.focus();
        } else {
          setPaletteOpen((v) => !v);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar, isDocsRoute]);

  const navIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/docs')) return pathname === '/docs' || pathname?.startsWith('/docs/');
    return pathname === href;
  };

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-[60]"
        style={{
          backgroundColor: scrolled
            ? 'color-mix(in srgb, var(--bg-raised) 92%, transparent)'
            : 'color-mix(in srgb, var(--bg-base) 80%, transparent)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          borderBottom: '1px solid var(--border-default)',
          boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
          transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        {/* Animated rim — sunset gradient that brightens on scroll */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-[2px]"
          style={{
            background: 'var(--gradient-aurora)',
            opacity: scrolled ? 0.55 : 0.18,
            transition: 'opacity 0.3s ease',
            filter: 'blur(0.4px)',
          }}
        />

        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:px-8">
          {/* Sidebar toggle (mobile + desktop) */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors"
            style={{
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-raised)',
            }}
            aria-label="Toggle docs navigation"
            title="Toggle sidebar (⌘B)"
          >
            <Bars3Icon className="h-5 w-5" aria-hidden />
          </button>

          {/* Logo + brand */}
          <Link href="/" className="group/logo flex shrink-0 items-center gap-2.5" aria-label="Apexify.js — home">
            <span
              aria-hidden
              className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 group-hover/logo:scale-105"
              style={{ boxShadow: 'var(--glow-magenta)' }}
            >
              <BrandIcon />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Apexify
              </span>
              <span className="text-[15px] font-bold text-grad-aurora">Docs</span>
            </span>
          </Link>

          <span
            aria-hidden
            className="hidden h-8 w-px shrink-0 md:block"
            style={{ backgroundColor: 'var(--border-default)' }}
          />

          {/* Primary nav (desktop) */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active = navIsActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors"
                  style={{
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {active && (
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: 'var(--accent-magenta)' }}
                      />
                    )}
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <span aria-hidden className="flex-1" />

          {/* Search: modal palette elsewhere; on docs the sidebar search is primary */}
          {!isDocsRoute && (
            <>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors sm:inline-flex"
                style={{
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-tertiary)',
                  backgroundColor: 'color-mix(in srgb, var(--bg-raised) 80%, transparent)',
                  minWidth: '14rem',
                }}
                aria-label="Search documentation"
                title="Search docs (⌘K)"
              >
                <MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1 text-left">Search docs…</span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <kbd className="kbd">⌘</kbd>
                  <kbd className="kbd">K</kbd>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors sm:hidden"
                style={{
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-raised)',
                }}
                aria-label="Search documentation"
              >
                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden />
              </button>
            </>
          )}

          {/* Version pill (desktop) */}
          <span
            className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums lg:inline-flex"
            style={{
              background: 'var(--gradient-sunset)',
              color: 'white',
              boxShadow: 'var(--shadow-sm)',
            }}
            title={`Apexify.js ${PACKAGE_VERSION}`}
          >
            <span aria-hidden>●</span>
            {PACKAGE_VERSION}
          </span>

          <ThemeToggle />

          <a
            href="https://github.com/EIAS79/apexify.js"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors lg:grid"
            style={{
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-raised)',
            }}
            aria-label="GitHub"
            title="Open on GitHub"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>

          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-expanded={mobileNavOpen}
            aria-label="Toggle menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors md:hidden"
            style={{
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-raised)',
            }}
          >
            {mobileNavOpen ? (
              <XMarkIcon className="h-5 w-5" aria-hidden />
            ) : (
              <span className="text-[10px] font-bold tracking-wider">{PACKAGE_VERSION}</span>
            )}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <nav
            className="md:hidden"
            style={{
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-raised)',
            }}
          >
            <ul className="flex flex-col gap-0.5 px-3 py-2">
              {NAV_LINKS.map((link) => {
                const active = navIsActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold"
                      style={{
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        backgroundColor: active
                          ? 'color-mix(in srgb, var(--accent-iris) 14%, transparent)'
                          : 'transparent',
                      }}
                    >
                      <span>{link.label}</span>
                      {active && (
                        <span
                          aria-hidden
                          className="h-2 w-2 rounded-full"
                          style={{ background: 'var(--accent-magenta)' }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      <DocsSearchPalette open={paletteOpen && !isDocsRoute} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
