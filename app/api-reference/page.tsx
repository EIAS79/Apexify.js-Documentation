import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell } from '@/components/docs/shell/DocsShell';
import { buildDocumentationNavigation } from '@/lib/docs/navigation';
import { loadDocumentationPages } from '@/lib/docs/content';
import { getApiManifest } from '@/lib/api-reference/manifest';

export const metadata:Metadata={
  title:'API Reference | Apexify.js',
  description:'Generated API reference for the current packed Apexify.js package.',
  alternates:{canonical:'https://apexifyjs.vercel.app/api-reference'},
};
export default function ApiReferenceIndex(){
  const manifest=getApiManifest();const groups=buildDocumentationNavigation(loadDocumentationPages());
  return <DocsShell groups={groups} headings={[]} activePath="/api-reference">
    <article className="apx-doc-prose apx-api-index" tabIndex={-1}>
      <header className="apx-api-header"><p className="apx-api-eyebrow">Packed package truth</p><h1>API Reference</h1>
        <p>Generated from <code>{manifest.package.name}@{manifest.package.version}</code> declarations and export maps at package commit <code>{manifest.package.commit.slice(0,12)}</code>.</p>
      </header>
      <section><h2>Public exports</h2><div className="apx-api-related-grid">{manifest.symbols.map(symbol=><Link className="apx-api-reference-card" href={symbol.href} key={symbol.id}><strong>{symbol.symbol}</strong><span>{symbol.kind} · {symbol.isTypeOnly?'type-only':'runtime/type'}</span><p>{symbol.summary}</p></Link>)}</div></section>
    </article>
  </DocsShell>;
}
