import '@/styles/docs-components.css';
import { CodeBlock } from '@/components/mdx/CodeBlock';
import {
  Callout, Steps, Tabs, Details, CodeBlockV2, CodeGroup, InstallCommand, CodeDiff,
  ComparisonTable, FeatureMatrix, AvailabilityMatrix, DecisionGuide, ArchitectureDiagram,
  BeforeAfter, OutputPreview, ExampleCard, ExampleSteps, NextSteps, Prerequisites,
  CapabilityBadge, ImageResult, VideoResult, AudioResult, SvgResult,
} from '@/components/mdx/RichDocsComponents';
import { ExecutableExample } from '@/components/examples/ExecutableExample';
import { CodePreview } from '@/components/examples/CodePreview';
import type { DocsTabItem } from '@/components/mdx/DocsTabs';
import type { ComparisonRow, FeatureRow, AvailabilityRow, DecisionItem } from '@/components/mdx/RichDocsComponents';
import { Alert } from '@/components/mdx/Alert';
import { Dropdown } from '@/components/mdx/Dropdown';
import { CodeSwitcher } from '@/components/mdx/CodeSwitcher';
import { DocumentationMarkdownFragment } from './DocumentationMarkdownFragment';

type UnknownProps = Record<string, unknown>;

function stringProp(props: UnknownProps, key: string, fallback = ''): string { return typeof props[key] === 'string' ? props[key] as string : fallback; }
function boolProp(props: UnknownProps, key: string, fallback = false): boolean { return typeof props[key] === 'boolean' ? props[key] as boolean : fallback; }
function arrayProp<T>(props: UnknownProps, key: string): T[] { return Array.isArray(props[key]) ? props[key] as T[] : []; }

export function RichDocsSegment({ name, props, body }: { name: string; props: UnknownProps; body?: string }) {
  const children = body ? <DocumentationMarkdownFragment content={body} /> : null;
  switch (name) {
    case 'Callout': return <Callout tone={(stringProp(props, 'tone', 'info') as 'info' | 'tip' | 'warning' | 'danger' | 'success')} title={stringProp(props, 'title') || undefined}>{children}</Callout>;
    case 'Steps': return <Steps title={stringProp(props, 'title', 'Steps')}>{children}</Steps>;
    case 'Tabs': return <Tabs items={arrayProp<DocsTabItem>(props, 'items')} ariaLabel={stringProp(props, 'ariaLabel', 'Documentation examples')} />;
    case 'Details': return <Details summary={stringProp(props, 'summary', 'Details')} open={boolProp(props, 'open')}>{children}</Details>;
    case 'CodeBlockV2': return <CodeBlockV2 code={stringProp(props, 'code')} language={stringProp(props, 'language', 'text')} filename={stringProp(props, 'filename') || undefined} studio={boolProp(props, 'studio')} />;
    case 'CodeGroup': return <CodeGroup items={arrayProp<DocsTabItem>(props, 'items')} ariaLabel={stringProp(props, 'ariaLabel', 'Code examples')} />;
    case 'InstallCommand': { const managers = arrayProp<string>(props, 'managers'); return <InstallCommand packageName={stringProp(props, 'packageName', 'apexify.js')} managers={managers.length ? managers : undefined} />; }
    case 'CodeDiff': return <CodeDiff before={stringProp(props, 'before')} after={stringProp(props, 'after')} language={stringProp(props, 'language', 'text')} />;
    case 'ComparisonTable': return <ComparisonTable leftLabel={stringProp(props, 'leftLabel', 'Option A')} rightLabel={stringProp(props, 'rightLabel', 'Option B')} rows={arrayProp<ComparisonRow>(props, 'rows')} />;
    case 'FeatureMatrix': return <FeatureMatrix rows={arrayProp<FeatureRow>(props, 'rows')} />;
    case 'AvailabilityMatrix': return <AvailabilityMatrix rows={arrayProp<AvailabilityRow>(props, 'rows')} />;
    case 'DecisionGuide': return <DecisionGuide items={arrayProp<DecisionItem>(props, 'items')} />;
    case 'ArchitectureDiagram': return <ArchitectureDiagram diagram={stringProp(props, 'diagram')} caption={stringProp(props, 'caption', 'Architecture flow')} />;
    case 'BeforeAfter': return <BeforeAfter before={stringProp(props, 'before')} after={stringProp(props, 'after')} beforeLabel={stringProp(props, 'beforeLabel', 'Before')} afterLabel={stringProp(props, 'afterLabel', 'After')} />;
    case 'OutputPreview': return <OutputPreview label={stringProp(props, 'label', 'Output')}>{children}</OutputPreview>;
    case 'ExampleCard': return <ExampleCard title={stringProp(props, 'title', 'Example')} description={stringProp(props, 'description') || undefined}>{children}</ExampleCard>;
    case 'ExampleSteps': return <ExampleSteps title={stringProp(props, 'title', 'Example walkthrough')}>{children}</ExampleSteps>;
    case 'NextSteps': return <NextSteps>{children}</NextSteps>;
    case 'Prerequisites': return <Prerequisites>{children}</Prerequisites>;
    case 'CapabilityBadge': return <CapabilityBadge label={stringProp(props, 'label', 'Capability')} status={(stringProp(props, 'status', 'available') as 'available' | 'preview' | 'experimental' | 'unavailable')} />;
    case 'ImageResult': return <ImageResult src={stringProp(props, 'src')} alt={stringProp(props, 'alt', 'Image result')} caption={stringProp(props, 'caption') || undefined} />;
    case 'VideoResult': return <VideoResult src={stringProp(props, 'src')} caption={stringProp(props, 'caption') || undefined} />;
    case 'AudioResult': return <AudioResult src={stringProp(props, 'src')} caption={stringProp(props, 'caption') || undefined} />;
    case 'SvgResult': return <SvgResult src={stringProp(props, 'src')} alt={stringProp(props, 'alt', 'SVG result')} caption={stringProp(props, 'caption') || undefined} />;
    case 'ExecutableExample': return <ExecutableExample id={stringProp(props, 'id')} compact={boolProp(props, 'compact')} />;
    case 'CodePreview': return <CodePreview id={stringProp(props, 'id')} />;
    case 'Alert': return <Alert type={(stringProp(props, 'type', 'info') as 'warning' | 'info' | 'error' | 'success' | 'tip')} title={stringProp(props, 'title') || undefined}>{children}</Alert>;
    case 'Dropdown': return <Dropdown title={stringProp(props, 'title', 'Details')} defaultOpen={boolProp(props, 'defaultOpen')}>{children}</Dropdown>;
    case 'CodeSwitcher': return <CodeSwitcher ts={stringProp(props, 'ts') || undefined} js={stringProp(props, 'js') || undefined} tsLabel={stringProp(props, 'tsLabel', 'TypeScript')} jsLabel={stringProp(props, 'jsLabel', 'JavaScript')} docsStudio />;
    case 'CodeBlock': return <CodeBlock lang={stringProp(props, 'lang', 'text')} filename={stringProp(props, 'filename') || undefined} docsStudio>{body ?? stringProp(props, 'code')}</CodeBlock>;
    default: return null;
  }
}
