import { parseRichMdxSegments, type RichMdxSegment } from '@/components/mdx/rich-parser';
import { DocumentationMarkdownFragment } from './DocumentationMarkdownFragment';

type RichComponentSegment = Extract<RichMdxSegment, { kind: 'component' }>;

async function LazyRichDocsSegment({ segment, index }: { segment: RichComponentSegment; index: number }) {
  const { RichDocsSegment } = await import('./RichDocsSegment');
  return (
    <RichDocsSegment
      key={`${segment.name}-${index}`}
      name={segment.name}
      props={segment.props}
      body={segment.body}
    />
  );
}

export function RouteDocsMarkdown({ content }: { content: string }) {
  const segments = parseRichMdxSegments(content);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'markdown') {
          return <DocumentationMarkdownFragment key={`markdown-${index}`} content={segment.content} />;
        }
        return <LazyRichDocsSegment key={`${segment.name}-${index}`} segment={segment} index={index} />;
      })}
    </>
  );
}
