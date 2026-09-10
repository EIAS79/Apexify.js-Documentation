import { CodeGroup } from '@/components/mdx/RichDocsComponents';
import type { GeneratedExampleRecord } from '@/lib/examples/schema';

function labelFor(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

export function CodePreview({ example }: { example: GeneratedExampleRecord }) {
  const items = example.sources.map((source) => ({
    label: labelFor(source.path),
    language: 'typescript',
    content: source.content,
  }));
  return (
    <section className="apx-doc5-code-preview" data-doc5-component="CodePreview" aria-labelledby={`source-${example.id}`}>
      <div className="apx-doc5-section-heading">
        <h3 id={`source-${example.id}`}>Authoritative source</h3>
        <a href={`https://github.com/EIAS79/Apexify.js-Documentation/tree/main/examples/node/${example.id.replace(/^node\./, '').replace(/\./g, '-')}`} target="_blank" rel="noreferrer">View source</a>
      </div>
      <CodeGroup items={items} ariaLabel={`${example.title} source files`} />
      <p className="apx-doc5-proof-note">Source hash: <code>{example.sourceHash}</code>. This is the same source payload used by DOC-5 verification.</p>
    </section>
  );
}
