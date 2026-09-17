import Link from 'next/link';

export default function DocsHome() {
  return (
    <main id="docs-content" className="apx-doc-main">
      <div className="apx-doc-content">
        <article className="apx-doc-prose" data-doc-article>
          <h1>Opening Apexify.js documentation</h1>
          <p>
            Legacy <code>/docs#…</code> links are migrated to their canonical documentation routes by the compatibility redirect in this documentation layout.
          </p>
          <p>
            <Link href="/docs/getting-started">Continue to Getting Started</Link>
          </p>
        </article>
      </div>
    </main>
  );
}
