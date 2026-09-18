'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bars3Icon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useTheme, type ThemeMode } from '@/components/ThemeProvider';

const NAV_LINKS = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/docs/getting-started', label: 'Docs', key: 'docs' },
  { href: '/api-reference', label: 'API', key: 'api' },
  { href: '/gallery', label: 'Gallery', key: 'gallery' },
  { href: '/studio', label: 'Studio', key: 'studio' },
] as const;

export type HomeNavSection = (typeof NAV_LINKS)[number]['key'];

const THEMES: { id: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'system', label: 'System', Icon: ComputerDesktopIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
];

function ApexMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="h-full w-full">
      <rect x="5" y="5" width="54" height="54" rx="8" fill="currentColor" opacity="0.06" />
      <rect x="5.5" y="5.5" width="53" height="53" rx="7.5" fill="none" stroke="currentColor" opacity="0.22" />
      <path d="M18 48 31 17h4l12 31h-6l-3-8H27l-3 8h-6Zm11-13h7l-3.4-9L29 35Z" fill="currentColor" />
      <path d="M47 16H37v3h7v8h3V16ZM17 49h10v-3h-7v-8h-3v11Z" fill="var(--accent)" />
      <path d="M41 30h9v9h-3v-6h-6v-3Z" fill="var(--cyan)" />
    </svg>
  );
}

function ThemeControl() {
  const { mode, setMode } = useTheme();

  return (
    <div className="apx-home-theme" role="radiogroup" aria-label="Color theme">
      {THEMES.map(({ id, label, Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setMode(id)}
            className="apx-home-theme__button"
            data-active={active || undefined}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

export default function HomeNavbar({ active = 'home' }: { active?: HomeNavSection }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="apx-home-nav">
      <div className="apx-home-nav__inner">
        <Link href="/" className="apx-home-brand" aria-label="Apexify.js home">
          <span className="apx-home-brand__mark"><ApexMark /></span>
          <span className="apx-home-brand__word">Apexify<span>.js</span></span>
        </Link>

        <nav className="apx-home-nav__links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={link.key === active ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="apx-home-nav__actions">
          <div className="hidden sm:block"><ThemeControl /></div>

          <a
            href="https://github.com/EIAS79/Apexify.js"
            target="_blank"
            rel="noopener noreferrer"
            className="apx-home-icon-button hidden sm:inline-flex"
            aria-label="Apexify.js on GitHub"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>

          <a
            href="https://www.npmjs.com/package/apexify.js"
            target="_blank"
            rel="noopener noreferrer"
            className="apx-home-install"
          >
            <span className="hidden md:inline">npm i apexify.js</span>
            <span className="md:hidden">Install</span>
          </a>

          <button
            type="button"
            className="apx-home-menu md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="home-mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div id="home-mobile-nav" className="apx-home-nav__mobile md:hidden" data-open={open || undefined}>
        <nav aria-label="Mobile primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={link.key === active ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="apx-home-nav__mobile-theme sm:hidden">
          <span>Theme</span>
          <ThemeControl />
        </div>
      </div>
    </header>
  );
}
