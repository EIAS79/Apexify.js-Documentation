import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getDocumentationPageBySlug,
  loadDocumentationPages,
} from '@/lib/docs/content';
import {
  buildDocumentationNavigation,
  getDocumentationBreadcrumbs,
  getDocumentationPager,
} from '@/lib/docs/navigation';
import { RouteDocsFrame } from '@/components/docs/route/RouteDocsFrame';
import { RouteDocsMarkdown } from '@/components/docs/route/RouteDocsMarkdown';
import {
  RouteDocBreadcrumbs,
  RouteDocPager,
} from '@/components/docs/route/RouteDocChrome';

const SITE_ORIGIN = 'https://apexifyjs.vercel.app';

export const dynamicParams = false;

export function generateStaticParams() {
  return loadDocumentationPages().map((page) => ({
    slug: page.slug.split('/'),
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Metadata {
  const page = getDocumentationPageBySlug(params.slug);
  if (!page) {
    return {
      title: 'Documentation not found | Apexify.js',
      robots: { index: false, follow: false },
    };
  }

  const canonical = `${SITE_ORIGIN}${page.canonicalPath}`;
  const indexable = !['ROADMAP', 'REMOVED'].includes(page.stability);

  return {
    title: `${page.title} | Apexify.js Docs`,
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical,
    },
    robots: {
      index: indexable,
      follow: true,
    },
    openGraph: {
      type: 'article',
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: 'Apexify.js Documentation',
    },
  };
}

export default function DocumentationRoutePage({
  params,
}: {
  params: { slug: string[] };
}) {
  const page = getDocumentationPageBySlug(params.slug);
  if (!page) notFound();

  const navigation = buildDocumentationNavigation(loadDocumentationPages());
  const breadcrumbs = getDocumentationBreadcrumbs(navigation, page);
  const pager = getDocumentationPager(navigation, page.canonicalPath);
  const headings = page.toc ? page.headings : [];

  return (
    <RouteDocsFrame groups={navigation} headings={headings}>
      <RouteDocBreadcrumbs breadcrumbs={breadcrumbs} />

      <div
        className="not-prose mb-5 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
        data-doc1-metadata
      >
        <span
          className="rounded-full px-2 py-1"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-iris) 12%, transparent)',
            color: 'var(--accent-iris)',
            border: '1px solid color-mix(in srgb, var(--accent-iris) 28%, transparent)',
          }}
        >
          {page.package}
        </span>
        {page.runtime.map((runtime) => (
          <span
            key={runtime}
            className="rounded-full px-2 py-1"
            style={{
              backgroundColor: 'var(--bg-sunken)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
            }}
          >
            {runtime}
          </span>
        ))}
        <span
          className="rounded-full px-2 py-1"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 10%, transparent)',
            color: 'var(--accent-magenta)',
            border: '1px solid color-mix(in srgb, var(--accent-magenta) 26%, transparent)',
          }}
        >
          {page.stability}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{page.kind}</span>
      </div>

      <article
        className="prose prose-xl max-w-none"
        data-doc-article
        data-doc-slug={page.slug}
        data-doc-source={page.sourcePath}
      >
        <RouteDocsMarkdown content={page.body} />
      </article>

      <RouteDocPager pager={pager} />
    </RouteDocsFrame>
  );
}
