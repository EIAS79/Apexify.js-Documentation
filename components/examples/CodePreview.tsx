import { CodeGroup } from '@/components/mdx/RichDocsComponents';
import { VerifiedExamplePlayground } from '@/components/docs/playground/VerifiedExamplePlayground';
import { getExampleById } from '@/lib/examples/manifest';
import type { GeneratedExampleRecord } from '@/lib/examples/schema';

function labelFor(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

export function CodePreview({ example: provided, id }: { example?: GeneratedExampleRecord; id?: string }) {
  const example = provided ?? (id ? getExampleById(id) : undefined);
  if (!example) throw new Error(`[DOC-5] Unknown CodePreview example ID: ${id ?? '(missing)'}`);
  const items = example.sources.map((source) => ({
    label: labelFor(source.path),
    language: 'typescript',
    content: source.content,
  }));
  const verifiedPreview =
    example.outputs.find((output) => output.path === example.gallery.previewOutput) ??
    example.outputs.find((output) => output.publicPath);
  const representativeInteractiveExample = example.id === 'node.canvas.basic' && example.sources.length === 1;

  return (
    <section
      className="apx-doc5-code-preview"
      data-doc5-component="CodePreview"
      aria-labelledby={`source-${example.id}`}
    >
      <div className="apx-doc5-section-heading">
        <h3 id={`source-${example.id}`}>Authoritative source</h3>
      </div>
      <CodeGroup items={items} ariaLabel={`${example.title} source files`} />
      {representativeInteractiveExample ? (
        <VerifiedExamplePlayground
          title={example.title}
          initialSource={example.sources[0].content}
          previewUrl={verifiedPreview?.publicPath}
          previewAlt={`${example.title} verified output`}
          sourceHash={example.sourceHash}
        />
      ) : null}
      <p className="apx-doc5-proof-note">
        Source hash: <code>{example.sourceHash}</code>. The displayed payload is generated from the
        files executed by DOC-5 verification.
      </p>
    </section>
  );
}
