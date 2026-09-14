import { parseRichMdxSegments } from '@/components/mdx/rich-parser';
import { DocumentationMarkdownFragment } from './DocumentationMarkdownFragment';

export async function RouteDocsMarkdown({ content }: { content: string }) {
  const segments = parseRichMdxSegments(content);
  const hasRichSegments = segments.some((segment) => segment.kind === 'component');
  const RichDocsSegment = hasRichSegments
    ? (await import('./RichDocsSegment')).RichDocsSegment
    : null;

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'markdown') {
          return <DocumentationMarkdownFragment key={`markdown-${index}`} content={segment.content} />;
        }
        if (!RichDocsSegment) return null;
        return <RichDocsSegment key={`${segment.name}-${index}`} name={segment.name} props={segment.props} body={segment.body} />;
      })}
    </>
  );
}
