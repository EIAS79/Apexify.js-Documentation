import Link from 'next/link';
import React, { type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/mdx/CodeBlock';
import { DocHeadingAnchor } from '@/components/docs/DocHeadingAnchor';
import { canonicalizeLegacyDocumentationHref } from '@/lib/docs/legacy-routing';
import { parseHeadingTitleAndId, slugifyHeading } from '@/lib/docs-heading-utils';
import { parseRichMdxSegments } from '@/components/mdx/rich-parser';
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

type UnknownProps = Record<string, unknown>;
function childrenToPlainText(node: ReactNode): string { if(node==null||typeof node==='boolean')return'';if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(childrenToPlainText).join('');if(React.isValidElement(node))return childrenToPlainText((node.props as {children?:ReactNode}).children);return''; }
function heading(level:1|2|3){return function DocumentationHeading({children,node:_node,...props}:React.HTMLAttributes<HTMLHeadingElement>&{node?:unknown}){const rawLabel=childrenToPlainText(children);const parsed=parseHeadingTitleAndId(rawLabel);const id=parsed.id||slugifyHeading(parsed.label);const className=level===1?'group not-prose mb-6 mt-4 scroll-mt-28 pb-4 text-3xl font-black leading-tight tracking-tight sm:mb-8 sm:mt-8 sm:text-4xl md:text-5xl text-grad-aurora':level===2?'group not-prose mb-4 mt-8 flex scroll-mt-28 flex-wrap items-center gap-2 text-2xl font-bold leading-snug sm:mb-6 sm:mt-12 sm:gap-3 sm:text-3xl md:text-4xl':'group not-prose mb-3 mt-6 flex scroll-mt-28 flex-wrap items-center gap-2 text-xl font-bold leading-snug sm:mb-4 sm:mt-8 sm:text-2xl';const HeadingTag=`h${level}` as 'h1'|'h2'|'h3';return <HeadingTag {...props} id={id} className={className} style={{color:level===1?undefined:'var(--text-primary)',borderBottom:level===1?'1px solid var(--border-default)':undefined}}>{level>1?<span aria-hidden style={{color:level===2?'var(--accent-magenta)':'var(--accent-iris)'}}>{level===2?'#':'##'}</span>:null}<span>{parsed.label}</span><DocHeadingAnchor id={id}/></HeadingTag>;};}
const markdownComponents:Components={
  h1:heading(1),h2:heading(2),h3:heading(3),pre({children}){return<>{children}</>;},
  code({className,children,...props}){const languageMatch=/language-([\w-]+)/.exec(className??'');if(languageMatch)return <CodeBlock lang={languageMatch[1]} docsStudio>{String(children).replace(/\n$/,'')}</CodeBlock>;return <code {...props} className="rounded-md px-2 py-1 font-mono text-sm" style={{backgroundColor:'var(--bg-sunken)',color:'var(--text-primary)',border:'1px solid var(--border-default)',overflowWrap:'anywhere',wordBreak:'break-word'}}>{children}</code>;},
  table({children,...props}){return <div className="my-6 overflow-x-auto rounded-xl" style={{border:'1px solid var(--border-default)'}} tabIndex={0} role="group" aria-label="Documentation table"><table {...props} className="w-full border-collapse text-left text-sm">{children}</table></div>;},
  th({children,...props}){return <th {...props} className="px-3 py-2 font-semibold" style={{backgroundColor:'var(--bg-sunken)',color:'var(--text-primary)',borderBottom:'1px solid var(--border-default)'}}>{children}</th>;},
  td({children,...props}){return <td {...props} className="px-3 py-2 align-top" style={{color:'var(--text-secondary)',borderBottom:'1px solid var(--border-subtle)'}}>{children}</td>;},
  a({href='',children,...props}){const targetHref=canonicalizeLegacyDocumentationHref(href);const className='font-medium underline transition-colors';const style={color:'var(--text-primary)',textDecorationColor:'var(--accent-iris)'};if(targetHref.startsWith('/'))return <Link href={targetHref} className={className} style={style}>{children}</Link>;return <a {...props} href={targetHref} className={className} style={style}>{children}</a>;},
};
function stringProp(props:UnknownProps,key:string,fallback=''):string{return typeof props[key]==='string'?props[key] as string:fallback;}function boolProp(props:UnknownProps,key:string,fallback=false):boolean{return typeof props[key]==='boolean'?props[key] as boolean:fallback;}function arrayProp<T>(props:UnknownProps,key:string):T[]{return Array.isArray(props[key])?props[key] as T[]:[];}
function MarkdownFragment({content}:{content:string}){return <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>;}
function RichComponent({name,props,body}:{name:string;props:UnknownProps;body?:string}){const children=body?<MarkdownFragment content={body}/>:null;switch(name){
case'Callout':return <Callout tone={stringProp(props,'tone','info') as 'info'|'tip'|'warning'|'danger'|'success'} title={stringProp(props,'title')||undefined}>{children}</Callout>;
case'Steps':return <Steps title={stringProp(props,'title','Steps')}>{children}</Steps>;
case'Tabs':return <Tabs items={arrayProp<DocsTabItem>(props,'items')} ariaLabel={stringProp(props,'ariaLabel','Documentation examples')}/>;
case'Details':return <Details summary={stringProp(props,'summary','Details')} open={boolProp(props,'open')}>{children}</Details>;
case'CodeBlockV2':return <CodeBlockV2 code={stringProp(props,'code')} language={stringProp(props,'language','text')} filename={stringProp(props,'filename')||undefined} studio={boolProp(props,'studio')}/>;
case'CodeGroup':return <CodeGroup items={arrayProp<DocsTabItem>(props,'items')} ariaLabel={stringProp(props,'ariaLabel','Code examples')}/>;
case'InstallCommand':{const managers=arrayProp<string>(props,'managers');return <InstallCommand packageName={stringProp(props,'packageName','apexify.js')} managers={managers.length?managers:undefined}/>;}
case'CodeDiff':return <CodeDiff before={stringProp(props,'before')} after={stringProp(props,'after')} language={stringProp(props,'language','text')}/>;
case'ComparisonTable':return <ComparisonTable leftLabel={stringProp(props,'leftLabel','Option A')} rightLabel={stringProp(props,'rightLabel','Option B')} rows={arrayProp<ComparisonRow>(props,'rows')}/>;
case'FeatureMatrix':return <FeatureMatrix rows={arrayProp<FeatureRow>(props,'rows')}/>;case'AvailabilityMatrix':return <AvailabilityMatrix rows={arrayProp<AvailabilityRow>(props,'rows')}/>;case'DecisionGuide':return <DecisionGuide items={arrayProp<DecisionItem>(props,'items')}/>;
case'ArchitectureDiagram':return <ArchitectureDiagram diagram={stringProp(props,'diagram')} caption={stringProp(props,'caption','Architecture flow')}/>;case'BeforeAfter':return <BeforeAfter before={stringProp(props,'before')} after={stringProp(props,'after')} beforeLabel={stringProp(props,'beforeLabel','Before')} afterLabel={stringProp(props,'afterLabel','After')}/>;
case'OutputPreview':return <OutputPreview label={stringProp(props,'label','Output')}>{children}</OutputPreview>;case'ExampleCard':return <ExampleCard title={stringProp(props,'title','Example')} description={stringProp(props,'description')||undefined}>{children}</ExampleCard>;
case'ExampleSteps':return <ExampleSteps title={stringProp(props,'title','Example walkthrough')}>{children}</ExampleSteps>;case'NextSteps':return <NextSteps>{children}</NextSteps>;case'Prerequisites':return <Prerequisites>{children}</Prerequisites>;
case'CapabilityBadge':return <CapabilityBadge label={stringProp(props,'label','Capability')} status={stringProp(props,'status','available') as 'available'|'preview'|'experimental'|'unavailable'}/>;
case'ImageResult':return <ImageResult src={stringProp(props,'src')} alt={stringProp(props,'alt','Image result')} caption={stringProp(props,'caption')||undefined}/>;case'VideoResult':return <VideoResult src={stringProp(props,'src')} caption={stringProp(props,'caption')||undefined}/>;case'AudioResult':return <AudioResult src={stringProp(props,'src')} caption={stringProp(props,'caption')||undefined}/>;case'SvgResult':return <SvgResult src={stringProp(props,'src')} alt={stringProp(props,'alt','SVG result')} caption={stringProp(props,'caption')||undefined}/>;
case'ExecutableExample':return <ExecutableExample id={stringProp(props,'id')} compact={boolProp(props,'compact')}/>;case'CodePreview':return <CodePreview id={stringProp(props,'id')}/>;
case'Alert':return <Alert type={stringProp(props,'type','info') as 'warning'|'info'|'error'|'success'|'tip'} title={stringProp(props,'title')||undefined}>{children}</Alert>;case'Dropdown':return <Dropdown title={stringProp(props,'title','Details')} defaultOpen={boolProp(props,'defaultOpen')}>{children}</Dropdown>;case'CodeSwitcher':return <CodeSwitcher ts={stringProp(props,'ts')||undefined} js={stringProp(props,'js')||undefined} tsLabel={stringProp(props,'tsLabel','TypeScript')} jsLabel={stringProp(props,'jsLabel','JavaScript')} docsStudio/>;case'CodeBlock':return <CodeBlock lang={stringProp(props,'lang','text')} filename={stringProp(props,'filename')||undefined} docsStudio>{body??stringProp(props,'code')}</CodeBlock>;default:return null;}}
export function RouteDocsMarkdown({content}:{content:string}){const segments=parseRichMdxSegments(content);return <>{segments.map((segment,index)=>segment.kind==='markdown'?<MarkdownFragment key={`markdown-${index}`} content={segment.content}/>:<RichComponent key={`${segment.name}-${index}`} name={segment.name} props={segment.props} body={segment.body}/>)}</>;}
