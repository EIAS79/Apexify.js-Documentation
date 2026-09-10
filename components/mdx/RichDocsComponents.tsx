import type { ReactNode } from 'react';
import { CodeBlock } from './CodeBlock';
import { Tabs, type DocsTabItem } from './DocsTabs';
import { StabilityBadge, RuntimeBadge, PackageBadge, SinceBadge } from '@/components/docs/status/DocsBadges';
import type { DocumentationPage } from '@/lib/docs/schema';

export type CalloutTone = 'info' | 'tip' | 'warning' | 'danger' | 'success';

export function Callout({ tone = 'info', title, children }: { tone?: CalloutTone; title?: string; children?: ReactNode }) {
  return (
    <aside className="apx-doc3-callout" data-tone={tone} data-doc3-component="Callout" aria-label={title ?? `${tone} callout`}>
      {title ? <strong className="apx-doc3-callout__title">{title}</strong> : null}
      <div className="apx-doc3-callout__body">{children}</div>
    </aside>
  );
}

export function Steps({ title = 'Steps', children }: { title?: string; children?: ReactNode }) {
  return <section className="apx-doc3-steps" data-doc3-component="Steps" aria-label={title}>{children}</section>;
}

export { Tabs };

export function Details({ summary, open = false, children }: { summary: string; open?: boolean; children?: ReactNode }) {
  return (
    <details className="apx-doc3-details" data-doc3-component="Details" open={open}>
      <summary>{summary}</summary>
      <div className="apx-doc3-details__body">{children}</div>
    </details>
  );
}

export function CodeBlockV2({ code, language = 'text', filename, studio = false }: { code: string; language?: string; filename?: string; studio?: boolean }) {
  return <div data-doc3-component="CodeBlockV2"><CodeBlock lang={language} filename={filename} docsStudio={studio}>{code}</CodeBlock></div>;
}

export function CodeGroup({ items, ariaLabel = 'Code examples' }: { items: DocsTabItem[]; ariaLabel?: string }) {
  return <div data-doc3-component="CodeGroup"><Tabs items={items} ariaLabel={ariaLabel} /></div>;
}

export function InstallCommand({ packageName = 'apexify.js', managers = ['npm', 'pnpm', 'yarn'] }: { packageName?: string; managers?: string[] }) {
  const commands: Record<string, string> = { npm: `npm install ${packageName}`, pnpm: `pnpm add ${packageName}`, yarn: `yarn add ${packageName}`, bun: `bun add ${packageName}` };
  const items = managers.filter((manager) => commands[manager]).map((manager) => ({ label: manager, language: 'bash', content: commands[manager] }));
  return <div data-doc3-component="InstallCommand"><Tabs items={items} ariaLabel="Package manager" /></div>;
}

export function CodeDiff({ before, after, language = 'text' }: { before: string; after: string; language?: string }) {
  return <div className="apx-doc3-grid" data-doc3-component="CodeDiff"><section><h4>Before</h4><CodeBlockV2 code={before} language={language} /></section><section><h4>After</h4><CodeBlockV2 code={after} language={language} /></section></div>;
}

export interface ComparisonRow { feature: string; left: string; right: string }
export function ComparisonTable({ leftLabel = 'Option A', rightLabel = 'Option B', rows = [] }: { leftLabel?: string; rightLabel?: string; rows?: ComparisonRow[] }) {
  return <div className="apx-doc3-table-wrap" data-doc3-component="ComparisonTable" tabIndex={0} role="group" aria-label="Comparison table"><table><thead><tr><th>Feature</th><th>{leftLabel}</th><th>{rightLabel}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.feature}><th scope="row">{row.feature}</th><td>{row.left}</td><td>{row.right}</td></tr>)}</tbody></table></div>;
}

export interface FeatureRow { feature: string; status: string; note?: string }
export function FeatureMatrix({ rows = [] }: { rows?: FeatureRow[] }) {
  return <div className="apx-doc3-table-wrap" data-doc3-component="FeatureMatrix" tabIndex={0} role="group" aria-label="Feature matrix"><table><thead><tr><th>Feature</th><th>Status</th><th>Notes</th></tr></thead><tbody>{rows.map((row) => <tr key={row.feature}><th scope="row">{row.feature}</th><td>{row.status}</td><td>{row.note ?? '—'}</td></tr>)}</tbody></table></div>;
}

export interface AvailabilityRow { surface: string; available: boolean | string; notes?: string }
export function AvailabilityMatrix({ rows = [] }: { rows?: AvailabilityRow[] }) {
  return <div className="apx-doc3-table-wrap" data-doc3-component="AvailabilityMatrix" tabIndex={0} role="group" aria-label="Availability matrix"><table><thead><tr><th>Surface</th><th>Available</th><th>Notes</th></tr></thead><tbody>{rows.map((row) => <tr key={row.surface}><th scope="row">{row.surface}</th><td>{typeof row.available === 'boolean' ? (row.available ? 'Yes' : 'No') : row.available}</td><td>{row.notes ?? '—'}</td></tr>)}</tbody></table></div>;
}

export interface DecisionItem { when: string; use: string; because: string }
export function DecisionGuide({ items = [] }: { items?: DecisionItem[] }) {
  return <div className="apx-doc3-decision" data-doc3-component="DecisionGuide">{items.map((item) => <article key={`${item.when}-${item.use}`}><strong>When {item.when}</strong><span>Use {item.use}</span><p>{item.because}</p></article>)}</div>;
}

export function ArchitectureDiagram({ diagram, caption = 'Architecture flow' }: { diagram: string; caption?: string }) {
  return <figure data-doc3-component="ArchitectureDiagram"><CodeBlockV2 code={diagram} language="text" /><figcaption>{caption}</figcaption></figure>;
}

export function BeforeAfter({ before, after, beforeLabel = 'Before', afterLabel = 'After' }: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  return <div className="apx-doc3-grid" data-doc3-component="BeforeAfter"><section><h4>{beforeLabel}</h4><p>{before}</p></section><section><h4>{afterLabel}</h4><p>{after}</p></section></div>;
}

export function OutputPreview({ label = 'Output', children }: { label?: string; children?: ReactNode }) {
  return <figure className="apx-doc3-output" data-doc3-component="OutputPreview"><figcaption>{label}</figcaption><div>{children}</div></figure>;
}

export function ExampleCard({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <article className="apx-doc3-card" data-doc3-component="ExampleCard"><h4>{title}</h4>{description ? <p>{description}</p> : null}{children}</article>;
}

export function ExampleSteps({ title = 'Example walkthrough', children }: { title?: string; children?: ReactNode }) {
  return <section className="apx-doc3-card" data-doc3-component="ExampleSteps" aria-label={title}><h4>{title}</h4>{children}</section>;
}
export function Prerequisites({ children }: { children?: ReactNode }) { return <section className="apx-doc3-card" data-doc3-component="Prerequisites" aria-label="Prerequisites"><h4>Prerequisites</h4>{children}</section>; }
export function NextSteps({ children }: { children?: ReactNode }) { return <section className="apx-doc3-card" data-doc3-component="NextSteps" aria-label="Next steps"><h4>Next steps</h4>{children}</section>; }
export function CapabilityBadge({ label, status = 'available' }: { label: string; status?: 'available' | 'preview' | 'experimental' | 'unavailable' }) { return <span className="apx-badge" data-kind="capability" data-capability-status={status} data-doc3-component="CapabilityBadge">{label}: {status}</span>; }
export function ImageResult({ src, alt, caption }: { src: string; alt: string; caption?: string }) { return <figure className="apx-doc3-media" data-doc3-component="ImageResult"><img src={src} alt={alt} />{caption ? <figcaption>{caption}</figcaption> : null}</figure>; }
export function VideoResult({ src, caption }: { src: string; caption?: string }) { return <figure className="apx-doc3-media" data-doc3-component="VideoResult"><video controls preload="metadata" src={src}>Your browser does not support video playback.</video>{caption ? <figcaption>{caption}</figcaption> : null}</figure>; }
export function AudioResult({ src, caption }: { src: string; caption?: string }) { return <figure className="apx-doc3-media" data-doc3-component="AudioResult"><audio controls preload="metadata" src={src}>Your browser does not support audio playback.</audio>{caption ? <figcaption>{caption}</figcaption> : null}</figure>; }
export function SvgResult({ src, alt, caption }: { src: string; alt: string; caption?: string }) { return <figure className="apx-doc3-media" data-doc3-component="SvgResult"><img src={src} alt={alt} />{caption ? <figcaption>{caption}</figcaption> : null}</figure>; }

export { StabilityBadge, RuntimeBadge, PackageBadge, SinceBadge };
export type { DocumentationPage };
