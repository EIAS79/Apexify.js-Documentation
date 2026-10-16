import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell } from '@/components/docs/shell/DocsShell';
import { buildDocumentationNavigation } from '@/lib/docs/navigation';
import { loadDocumentationPages } from '@/lib/docs/content';
import { getApiManifest } from '@/lib/api-reference/manifest';
import ApiExplorer from '@/components/api-reference/ApiExplorer';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'API Reference | Apexify.js',
  description: 'Search the actual Apexify.js exported classes, methods, types and their runtime contracts.',
  alternates: { canonical: absoluteSiteUrl('/api-reference') },
  openGraph: {
    type: 'website',
    title: 'Apexify.js API Reference',
    description: 'Verified package exports, signatures, options and source-backed runtime contracts.',
    url: absoluteSiteUrl('/api-reference'),
    siteName: 'Apexify.js Documentation',
  },
};

export default function ApiReferenceIndex() {
  const manifest = getApiManifest();
  const groups = buildDocumentationNavigation(loadDocumentationPages());
  const symbols = manifest.symbols.map(({ id, symbol, kind, href, summary, stability, isTypeOnly, runtimeTargets }) =>
    ({ id, symbol, kind, href, summary, stability, isTypeOnly, runtimeTargets }));
  const featuredNames = ['ApexPainter', 'SceneBuilder', 'TemplateHandle'];
  const featured = featuredNames.map(name => manifest.symbols.find(entry => entry.symbol === name))
    .filter((entry): entry is (typeof manifest.symbols)[number] => Boolean(entry));
  return (
    <DocsShell groups={groups} headings={[]} activePath="/api-reference">
      <article className="apx-doc-prose apx-api-index" tabIndex={-1} data-api-frame="true">
        <header className="apx-api-header">
          <p className="apx-api-eyebrow">APEXIFY.JS / ENGINE REFERENCE</p>
          <h1>Build with <span>precision.</span></h1>
          <p>
            From the first canvas to a complete rendering pipeline. Browse the exports and
            documented contracts published by <code>{manifest.package.name}@{manifest.package.version}</code>.
          </p>
          <p>Generated from the actual package at commit <code>{manifest.package.commit.slice(0, 12)}</code>. Use the linked signatures, parameters, limitations and examples to build against the real engine.</p>
        </header>
        <nav className="apx-api-index__start" aria-label="API quick starts">
          {featured.length ? featured.map((entry, i) => (
            <Link key={entry.id} href={entry.href}>
              <span>{String(i + 1).padStart(2, '0')} / START HERE</span>
              {entry.symbol} ↗
            </Link>
          )) : <Link href="/docs/getting-started">01 / START HERE — Getting Started ↗</Link>}
        </nav>
        <ApiExplorer symbols={symbols} />
      </article>
    </DocsShell>
  );
}
