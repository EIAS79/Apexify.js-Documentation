import { NextSteps } from '@/components/mdx/RichDocsComponents';
import { getRelatedContent } from '@/lib/search/related';
import type { SearchRecordKind } from '@/lib/search/schema';

const KIND_LABEL: Partial<Record<SearchRecordKind, string>> = {
  doc: 'Guide',
  changelog: 'Changelog',
  'api-symbol': 'API',
  'api-member': 'API member',
  'api-option': 'Option',
  'api-type': 'Type',
  example: 'Verified example',
  gallery: 'Gallery',
  error: 'Error',
  diagnostic: 'Diagnostic',
};

export function RelatedContent({
  sourceId,
  preferredKinds,
  limit = 4,
  title = 'Related content',
}: {
  sourceId: string;
  preferredKinds?: readonly SearchRecordKind[];
  limit?: number;
  title?: string;
}) {
  const items = getRelatedContent(sourceId, { preferredKinds, limit });
  if (!items.length) return null;

  return (
    <section data-doc6-related-content aria-labelledby={`doc6-related-${sourceId.replace(/[^a-zA-Z0-9_-]+/g, '-')}`}>
      <h2 id={`doc6-related-${sourceId.replace(/[^a-zA-Z0-9_-]+/g, '-')}`}>{title}</h2>
      <NextSteps>
        <div className="apx-api-related-grid">
          {items.map((item) => (
            <a className="apx-api-reference-card" key={item.id} href={item.canonicalHref}>
              <strong>{item.title}</strong>
              <span>
                {KIND_LABEL[item.kind] ?? item.kind}
                {item.runtime.length ? ` · ${item.runtime.join(', ')}` : ''}
                {item.stability ? ` · ${item.stability}` : ''}
              </span>
              {item.description ? <p>{item.description}</p> : null}
            </a>
          ))}
        </div>
      </NextSteps>
    </section>
  );
}
