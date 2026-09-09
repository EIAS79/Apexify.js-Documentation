'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { BrandIcon } from '@/components/Brand';
import ThemeToggle from '@/components/ThemeToggle';
import { apexifyVersionLabel } from '@/lib/apexify-version';
import { useSidebar } from '@/contexts/SidebarContext';
import { AccessibleDrawer } from './AccessibleDrawer';
import { DocsSearchTrigger } from './DocsSearchTrigger';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/docs/getting-started', label: 'Docs' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/studio', label: 'Studio' },
] as const;

export function DocsHeader() {
  const pathname = usePathname();
  const version = apexifyVersionLabel();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const legacyDocs = pathname === '/docs';
  return (
    <header className="apx-doc-header" data-doc2-header>
      <div className="apx-doc-header__inner">
        {legacyDocs ? (
          <button type="button" className="apx-icon-button" aria-label="Toggle legacy documentation navigation" aria-expanded={sidebarOpen} onClick={toggleSidebar}>
            <Bars3Icon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <Link href="/" className="apx-doc-brand" aria-label="Apexify.js home">
          <span className="apx-doc-brand__icon" aria-hidden><BrandIcon /></span>
          <span className="apx-doc-brand__text">
            <span className="apx-doc-brand__eyebrow">Apexify.js</span>
            <span className="apx-doc-brand__title">Documentation</span>
          </span>
        </Link>
        <nav className="apx-doc-primary-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = link.label === 'Docs' ? pathname?.startsWith('/docs') : pathname === link.href;
            return <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}>{link.label}</Link>;
          })}
        </nav>
        <div className="apx-doc-header__actions">
          <span className="apx-version-badge" aria-label={`Apexify.js version ${version}`}>{version}</span>
          <DocsSearchTrigger />
          <ThemeToggle />
          <div className="md:hidden">
            <AccessibleDrawer label="Site navigation" triggerLabel="Open site navigation" side="right" trigger={<Bars3Icon className="h-5 w-5" aria-hidden />}>
              <nav aria-label="Mobile primary" className="grid gap-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="min-h-11 rounded-lg px-3 py-3 font-semibold">{link.label}</Link>
                ))}
              </nav>
            </AccessibleDrawer>
          </div>
        </div>
      </div>
    </header>
  );
}
