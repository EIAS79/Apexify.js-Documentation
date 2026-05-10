'use client';

import { useEffect } from 'react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { DocPagerNeighbors, sectionAccent } from '@/lib/docs-nav-utils';

export function DocPager({ neighbors }: { neighbors: DocPagerNeighbors }) {
  const { prev, next } = neighbors;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isText = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isText || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft' && prev) {
        window.location.hash = prev.filename;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === 'ArrowRight' && next) {
        window.location.hash = next.filename;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Pagination"
      className="not-prose mt-12 grid gap-3 sm:grid-cols-2"
    >
      {prev ? (
        <Card direction="prev" entry={prev} />
      ) : (
        <span aria-hidden />
      )}
      {next ? (
        <Card direction="next" entry={next} />
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}

function Card({
  direction,
  entry,
}: {
  direction: 'prev' | 'next';
  entry: NonNullable<DocPagerNeighbors['prev']>;
}) {
  const accent = sectionAccent(entry.sectionName);
  const isPrev = direction === 'prev';
  return (
    <a
      href={`/docs#${entry.filename}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`group relative flex items-stretch gap-3 overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-[2px] ${
        isPrev ? 'sm:text-left' : 'sm:flex-row-reverse sm:text-right'
      }`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-raised) 88%, transparent)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent.color, opacity: 0.65 }}
      />
      <span
        className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-xl transition-colors"
        aria-hidden
        style={{
          backgroundColor: `color-mix(in srgb, ${accent.color} 14%, transparent)`,
          color: accent.color,
          border: `1px solid color-mix(in srgb, ${accent.color} 32%, transparent)`,
        }}
      >
        {isPrev ? (
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        ) : (
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: accent.color }}
        >
          {isPrev ? 'Previous' : 'Next'}
        </span>
        <span
          className="mt-1 truncate text-sm font-bold leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {entry.name}
        </span>
        <span
          className="mt-0.5 truncate text-[11px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {entry.subDisplayName ?? entry.sectionDisplayName}
        </span>
      </span>
    </a>
  );
}
