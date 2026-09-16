import type { Metadata } from 'next';
import '@/styles/docs-tokens.css';
import '@/styles/docs-shell.css';
import '@/styles/docs-prose.css';
import { DocsHeader } from '@/components/docs/shell/DocsHeader';
import { LegacyDocsRedirectIsland } from '@/components/docs/shell/LegacyDocsRedirectIsland';
import { absoluteSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Documentation | Apexify.js',
  description: 'Learn Apexify.js from verified getting-started guides, feature documentation, recipes, architecture material, and generated API reference.',
  alternates: { canonical: absoluteSiteUrl('/docs/getting-started') },
  openGraph: {
    type: 'website',
    title: 'Apexify.js Documentation',
    description: 'Verified guides, recipes, architecture documentation, examples, and API reference for Apexify.js.',
    url: absoluteSiteUrl('/docs/getting-started'),
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="apx-doc-root">
      <a className="apx-skip-link" href="#docs-content">Skip to content</a>
      <div className="apx-doc-background" aria-hidden />
      <LegacyDocsRedirectIsland />
      <DocsHeader />
      {children}
    </div>
  );
}
