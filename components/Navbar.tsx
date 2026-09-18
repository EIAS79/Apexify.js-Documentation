'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
import { BrandIcon } from './Brand';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/docs/getting-started', label: 'Docs' },
  { href: '/api-reference', label: 'API' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/studio', label: 'Studio' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <header className="apx-global-nav">
      <div className="apx-global-nav__inner">
        <Link href="/" prefetch={false} className="apx-global-brand" aria-label="Apexify.js home">
          <span className="apx-global-brand__mark" aria-hidden><BrandIcon /></span>
          <span className="apx-global-brand__word">Apexify<span>.js</span></span>
        </Link>

        <nav className="apx-global-nav__links" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} prefetch={false} aria-current={isActive(link.href) ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="apx-global-nav__actions">
          <ThemeToggle className="hidden sm:inline-flex" />
          <a
            href="https://github.com/EIAS79/Apexify.js"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Apexify.js on GitHub"
            className="apx-nav-icon-button hidden sm:inline-flex"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
          <a href="https://www.npmjs.com/package/apexify.js" target="_blank" rel="noopener noreferrer" className="apx-nav-install">
            <span className="hidden md:inline">npm i apexify.js</span><span className="md:hidden">Install</span>
          </a>
          <button
            type="button"
            className="apx-nav-menu-button md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div id="mobile-nav-menu" className={`apx-global-nav__mobile md:hidden ${mobileOpen ? 'is-open' : ''}`}>
        <nav aria-label="Mobile primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} prefetch={false} aria-current={isActive(link.href) ? 'page' : undefined}>{link.label}</Link>
          ))}
        </nav>
        <div className="apx-global-nav__mobile-theme sm:hidden"><span>Theme</span><ThemeToggle /></div>
      </div>
    </header>
  );
}
