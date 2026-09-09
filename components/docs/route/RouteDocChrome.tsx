import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import type {
  DocumentationBreadcrumb,
  DocumentationPager,
} from '@/lib/docs/navigation';

export function RouteDocBreadcrumbs({
  breadcrumbs,
}: {
  breadcrumbs: DocumentationBreadcrumb[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="not-prose mb-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: 'var(--text-tertiary)' }}
    >
      {breadcrumbs.map((breadcrumb, index) => (
        <span key={`${breadcrumb.label}-${index}`} className="contents">
          {index > 0 && (
            <ChevronRightIcon
              className="h-3 w-3 shrink-0"
              style={{ color: 'var(--border-strong)' }}
              aria-hidden
            />
          )}
          {breadcrumb.href ? (
            <Link
              href={breadcrumb.href}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {index === 0 && <HomeIcon className="h-3 w-3" aria-hidden />}
              {breadcrumb.label}
            </Link>
          ) : (
            <span
              className="rounded-md px-1.5 py-1"
              style={{
                color:
                  index === breadcrumbs.length - 1
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
              }}
            >
              {breadcrumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function PagerCard({
  direction,
  item,
}: {
  direction: 'previous' | 'next';
  item: NonNullable<DocumentationPager['previous']>;
}) {
  const previous = direction === 'previous';
  return (
    <Link
      href={item.href}
      rel={previous ? 'prev' : 'next'}
      className={`group relative flex items-stretch gap-3 overflow-hidden rounded-2xl p-4 transition-transform hover:-translate-y-[2px] ${
        previous ? 'sm:text-left' : 'sm:flex-row-reverse sm:text-right'
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
        style={{ background: 'var(--accent-iris)', opacity: 0.65 }}
      />
      <span
        className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-xl"
        aria-hidden
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-iris) 14%, transparent)',
          color: 'var(--accent-iris)',
          border: '1px solid color-mix(in srgb, var(--accent-iris) 32%, transparent)',
        }}
      >
        {previous ? (
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        ) : (
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: 'var(--accent-iris)' }}
        >
          {previous ? 'Previous' : 'Next'}
        </span>
        <span
          className="mt-1 text-sm font-bold leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.title}
        </span>
        <span
          className="mt-0.5 text-[11px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {item.package} · {item.kind}
        </span>
      </span>
    </Link>
  );
}

export function RouteDocPager({ pager }: { pager: DocumentationPager }) {
  if (!pager.previous && !pager.next) return null;
  return (
    <nav
      aria-label="Pagination"
      data-doc1-pager
      className="not-prose mt-12 grid gap-3 sm:grid-cols-2"
    >
      {pager.previous ? (
        <PagerCard direction="previous" item={pager.previous} />
      ) : (
        <span aria-hidden />
      )}
      {pager.next ? (
        <PagerCard direction="next" item={pager.next} />
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
