import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';
import ThemeToggle from '@/components/ThemeToggle';
import { apexifyVersionLabel } from '@/lib/apexify-version';
import { AccessibleDrawer } from './AccessibleDrawer';
import { DocsSearchTrigger } from './DocsSearchTrigger';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/docs/getting-started', label: 'Docs' },
  { href: '/api-reference', label: 'API' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/studio', label: 'Studio' },
] as const;

function docsHeaderPrefetch(href: string): false | undefined {
  return href.startsWith('/docs') ? undefined : false;
}

function ApexMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="h-full w-full">
      <rect x="5" y="5" width="54" height="54" rx="8" fill="currentColor" opacity="0.06" />
      <rect x="5.5" y="5.5" width="53" height="53" rx="7.5" fill="none" stroke="currentColor" opacity="0.22" />
      <path d="M18 48 31 17h4l12 31h-6l-3-8H27l-3 8h-6Zm11-13h7l-3.4-9L29 35Z" fill="currentColor" />
      <path d="M47 16H37v3h7v8h3V16ZM17 49h10v-3h-7v-8h-3v11Z" fill="var(--apx-color-accent)" />
      <circle cx="48" cy="41" r="4" fill="var(--apx-color-accent-warm)" />
    </svg>
  );
}

export function DocsHeader() {
  const version = apexifyVersionLabel();

  return (
    <header className="apx-doc-header" data-doc2-header>
      <div className="apx-doc-header__inner">
        <Link href="/" prefetch={false} className="apx-doc-brand" aria-label="Apexify.js home">
          <span className="apx-doc-brand__icon" aria-hidden><ApexMark /></span>
          <span className="apx-doc-brand__text">
            <span className="apx-doc-brand__word">Apexify<span>.js</span></span>
            <span className="apx-doc-brand__section">Docs</span>
          </span>
        </Link>

        <nav className="apx-doc-primary-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={docsHeaderPrefetch(link.href)}
              aria-current={link.label === 'Docs' ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="apx-doc-header__actions">
          <span className="apx-version-badge">
            <span className="sr-only">Apexify.js version </span>
            {version}
          </span>
          <DocsSearchTrigger />
          <div className="apx-doc-theme"><ThemeToggle /></div>

          <a
            href="https://github.com/EIAS79/Apexify.js"
            target="_blank"
            rel="noopener noreferrer"
            className="apx-icon-button apx-doc-github"
            aria-label="Apexify.js on GitHub"
            title="Apexify.js on GitHub"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>

          <div className="apx-doc-site-menu md:hidden">
            <AccessibleDrawer
              label="Site navigation"
              triggerLabel="Open site navigation"
              side="right"
              trigger={<Bars3Icon className="h-5 w-5" aria-hidden />}
            >
              <nav aria-label="Mobile primary" className="apx-doc-mobile-primary">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={docsHeaderPrefetch(link.href)}
                    aria-current={link.label === 'Docs' ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </AccessibleDrawer>
          </div>
        </div>
      </div>
    </header>
  );
}
