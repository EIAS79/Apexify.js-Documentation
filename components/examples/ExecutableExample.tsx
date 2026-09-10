import Link from 'next/link';
import { CodePreview } from './CodePreview';
import { getExampleById, apiHrefFromStableId } from '@/lib/examples/manifest';
import { ImageResult, OutputPreview, Prerequisites, NextSteps } from '@/components/mdx/RichDocsComponents';
import { PackageBadge, RuntimeBadge } from '@/components/docs/status/DocsBadges';

export function ExecutableExample({ id, compact = false }: { id: string; compact?: boolean }) {
  const example = getExampleById(id);
  if (!example) throw new Error(`[DOC-5] Unknown executable example ID: ${id}`);
  const preview = example.outputs.find((output) => output.path === example.gallery.previewOutput) ?? example.outputs.find((output) => output.publicPath);
  const animation = example.outputs.find((output) => output.kind === 'gif' && output.publicPath);
  const verified = example.verificationStatus === 'verified';
  return (
    <article className="apx-doc5-example" data-doc5-example={example.id} data-verification={example.verificationStatus}>
      <header className="apx-doc5-example__header">
        <div>
          <p className="apx-doc5-kicker">Executable example · {example.difficulty}</p>
          <h2>{example.title}</h2>
          <p>{example.summary}</p>
        </div>
        <div className="apx-doc5-badges" aria-label="Example metadata">
          <span className="apx-badge" data-kind="capability">{verified ? '✓ Verified' : `Verification: ${example.verificationStatus}`}</span>
          <RuntimeBadge runtime="node" />
          <PackageBadge packageName="apexify.js" />
        </div>
      </header>
      {!verified ? <p role="status" className="apx-doc5-warning">This source is not currently backed by matching packed-package verification evidence.</p> : null}
      {!compact ? <Prerequisites><ul>{example.explanation.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></Prerequisites> : null}
      <CodePreview example={example} />
      <OutputPreview label={`Verified output · ${example.gallery.previewOutput}`}>
        {preview?.publicPath ? <ImageResult src={preview.publicPath} alt={`${example.title} verified output`} caption={`${preview.width ?? 'verified'} × ${preview.height ?? 'verified'} · ${preview.verificationMode} verification`} /> : <p>No public preview output is declared.</p>}
        {animation?.publicPath ? <details className="apx-doc5-animation"><summary>Show verified animation</summary><img src={animation.publicPath} alt={`${example.title} animated GIF output`} /></details> : null}
      </OutputPreview>
      {!compact ? <>
        <section><h3>Goal</h3><p>{example.explanation.goal}</p></section>
        <section><h3>Important options</h3><ul>{example.explanation.importantOptions.map((item)=><li key={item}><code>{item}</code></li>)}</ul></section>
        <section><h3>Why these choices</h3><ul>{example.explanation.whyOptions.map((item)=><li key={item}>{item}</li>)}</ul></section>
        <section><h3>Variants</h3><ul>{example.explanation.variants.map((item)=><li key={item}>{item}</li>)}</ul></section>
        <section className="apx-doc5-notes"><div><h3>Performance note</h3><p>{example.explanation.performanceNote}</p></div><div><h3>Error note</h3><p>{example.explanation.errorNote}</p></div></section>
        <section><h3>Related documentation</h3><ul>{example.relatedDocs.map((href)=><li key={href}><Link href={href}>{href}</Link></li>)}</ul></section>
        <section><h3>Related API</h3><ul>{example.apiSymbols.map((apiId)=><li key={apiId}><Link href={apiHrefFromStableId(apiId)}>{apiId}</Link></li>)}</ul></section>
        <NextSteps><p>{example.explanation.nextStep}</p></NextSteps>
      </> : null}
      <footer className="apx-doc5-example__footer"><Link href={example.canonicalRoute}>Open canonical example page</Link><Link href={`/gallery#${encodeURIComponent(example.id)}+advance`}>Open in Gallery</Link></footer>
    </article>
  );
}
