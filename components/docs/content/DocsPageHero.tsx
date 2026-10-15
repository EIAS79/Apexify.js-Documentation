import { DocsChapterNav } from '@/components/docs/navigation/DocsChapterNav';
import type { DocumentationPage } from '@/lib/docs/schema';
import { PackageBadge, RuntimeBadge, SinceBadge, StabilityBadge } from '@/components/docs/status/DocsBadges';

export function DocsPageHero({ page, headingId }: { page: DocumentationPage; headingId?: string }) {
  return (
    <>
    <header className="apx-doc-hero" data-doc2-hero>
      <img className="frame-doc-sculpture" src="/docs/frame-sculpture.webp" width={600} height={400} alt="" aria-hidden />
      <p className="apx-doc-hero__eyebrow">{page.category} · {page.kind}</p>
      <h1 id={headingId}>{page.title.split(' ').slice(0, -1).join(' ')}{' '}<span>{page.title.split(' ').at(-1)}</span></h1>
      <p className="apx-doc-hero__description">{page.description}</p>
      <div className="apx-doc-hero__meta" aria-label="Page metadata" data-doc1-metadata>
        <PackageBadge value={page.package} />
        {page.runtime.map((runtime) => <RuntimeBadge key={runtime} value={runtime} />)}
        <StabilityBadge value={page.stability} />
        {page.since ? <SinceBadge value={page.since} /> : null}
      </div>
    </header>
    {page.toc && <DocsChapterNav headings={page.headings} />}
    </>
  );
}
