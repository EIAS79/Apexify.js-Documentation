'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { SectionAccentIcon } from '@/components/docs/SectionAccentIcon';
import { FlatDocEntry, sectionAccent } from '@/lib/docs-nav-utils';

export function DocBreadcrumbs({ entry }: { entry: FlatDocEntry | null }) {
  if (!entry) return null;
  const accent = sectionAccent(entry.sectionName);

  return (
    <nav
      aria-label="Breadcrumb"
      className="not-prose mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: 'var(--text-tertiary)' }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <HomeIcon className="h-3 w-3" aria-hidden />
        <span>Apexify</span>
      </Link>
      <ChevronRightIcon className="h-3 w-3 shrink-0" style={{ color: 'var(--border-strong)' }} aria-hidden />
      <Link
        href="/docs#00-start-here"
        className="rounded-md px-1.5 py-1 transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Docs
      </Link>
      <ChevronRightIcon className="h-3 w-3 shrink-0" style={{ color: 'var(--border-strong)' }} aria-hidden />
      <span
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1"
        style={{
          color: accent.color,
          backgroundColor: `color-mix(in srgb, ${accent.color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent.color} 26%, transparent)`,
        }}
      >
        <span
          aria-hidden
          className="grid h-4 w-4 shrink-0 place-items-center rounded-sm"
          style={{ background: accent.color, color: 'white' }}
        >
          <SectionAccentIcon sectionName={entry.sectionName} className="h-3 w-3 text-white" />
        </span>
        {entry.sectionDisplayName}
      </span>
      {entry.subDisplayName && (
        <>
          <ChevronRightIcon className="h-3 w-3 shrink-0" style={{ color: 'var(--border-strong)' }} aria-hidden />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.subDisplayName}</span>
        </>
      )}
    </nav>
  );
}
