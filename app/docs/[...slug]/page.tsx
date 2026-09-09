import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocumentationPageBySlug, loadDocumentationPages } from '@/lib/docs/content';
import { buildDocumentationNavigation, getDocumentationBreadcrumbs, getDocumentationPager } from '@/lib/docs/navigation';
import { DocsShell } from '@/components/docs/shell/DocsShell';
import { DocsBreadcrumbsV2, DocsPagerV2 } from '@/components/docs/navigation/DocsNavigationChrome';
import { DocsPageHero } from '@/components/docs/content/DocsPageHero';
import { RouteDocsMarkdown } from '@/components/docs/route/RouteDocsMarkdown';

const SITE_ORIGIN = 'https://apexifyjs.vercel.app';
export const dynamicParams = false;

export function generateStaticParams() {
  return loadDocumentationPages().map((page) => ({ slug: page.slug.split('/') }));
}

export function generateMetadata({ params }: { params: { slug: string[] } }): Metadata {
  const page = getDocumentationPageBySlug(params.slug);
  if (!page) return { title: 'Documentation not found | Apexify.js', robots: { index: false, follow: false } };
  const canonical = `${SITE_ORIGIN}${page.canonicalPath}`;
  const indexable = !['ROADMAP', 'REMOVED'].includes(page.stability);
  return {
    title: `${page.title} | Apexify.js Docs`,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical },
    robots: { index: indexable, follow: true },
    openGraph: {
      type: 'article',
      title: page.title,
      description: page.description,
      url: canonical,
      siteName: 'Apexify.js Documentation',
    },
  };
}

function withoutLeadingTitle(body: string): string {
  return body.replace(/^\s*#\s+[^\r\n]+(?:\r?\n)+/, '');
}

export default function DocumentationRoutePage({ params }: { params: { slug: string[] } }) {
  const page = getDocumentationPageBySlug(params.slug);
  if (!page) notFound();

  const navigation = buildDocumentationNavigation(loadDocumentationPages());
  const breadcrumbs = getDocumentationBreadcrumbs(navigation, page);
  const pager = getDocumentationPager(navigation, page.canonicalPath);
  const headings = page.toc ? page.headings : [];
  const leadingHeading = headings[0]?.level === 1 ? headings[0] : undefined;

  return (
    <DocsShell groups={navigation} headings={headings} activePath={page.canonicalPath}>
      <DocsBreadcrumbsV2 breadcrumbs={breadcrumbs} />
      <article
        className="apx-doc-prose"
        data-doc-article
        data-doc-slug={page.slug}
        data-doc-source={page.sourcePath}
      >
        <DocsPageHero page={page} headingId={leadingHeading?.id} />
        <RouteDocsMarkdown content={withoutLeadingTitle(page.body)} />
      </article>
      <DocsPagerV2 pager={pager} />
    </DocsShell>
  );
}
