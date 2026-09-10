import Link from 'next/link';
import type { DocumentationBreadcrumb, DocumentationPager } from '@/lib/docs/navigation';

export function DocsBreadcrumbsV2({ breadcrumbs }: { breadcrumbs: DocumentationBreadcrumb[] }) {
  return (
    <nav className="apx-breadcrumbs" aria-label="Breadcrumb" data-doc2-breadcrumbs>
      <ol>
        {breadcrumbs.map((breadcrumb, index) => {
          const current = index === breadcrumbs.length - 1;
          return (
            <li key={`${breadcrumb.label}-${index}`}>
              {breadcrumb.href && !current ? (
                <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
              ) : (
                <span aria-current={current ? 'page' : undefined}>{breadcrumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function PagerLink({ direction, item }: { direction: 'previous' | 'next'; item: NonNullable<DocumentationPager['previous']> }) {
  return (
    <Link className="apx-pager-link" data-direction={direction} href={item.href} rel={direction === 'previous' ? 'prev' : 'next'}>
      <span className="apx-pager-label">{direction === 'previous' ? 'Previous' : 'Next'}</span>
      <span className="apx-pager-title">{item.title}</span>
      <span className="apx-pager-context">{item.package} · {item.kind}</span>
    </Link>
  );
}

export function DocsPagerV2({ pager }: { pager: DocumentationPager }) {
  if (!pager.previous && !pager.next) return null;
  return (
    <nav className="apx-pager" aria-label="Documentation pagination" data-doc1-pager data-doc2-pager>
      {pager.previous ? <PagerLink direction="previous" item={pager.previous} /> : <span aria-hidden />}
      {pager.next ? <PagerLink direction="next" item={pager.next} /> : <span aria-hidden />}
    </nav>
  );
}
