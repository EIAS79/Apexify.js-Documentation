import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsShell } from '@/components/docs/shell/DocsShell';
import { buildDocumentationNavigation } from '@/lib/docs/navigation';
import { loadDocumentationPages } from '@/lib/docs/content';
import { exampleManifest, getExampleById } from '@/lib/examples/manifest';
import { ExecutableExample } from '@/components/examples/ExecutableExample';
import { RelatedContent } from '@/components/docs/search/RelatedContent';

const SITE_ORIGIN='https://apexifyjs.vercel.app';
export const dynamicParams=false;
export function generateStaticParams(){return exampleManifest.examples.map((example)=>({id:example.id}));}
export function generateMetadata({params}:{params:{id:string}}):Metadata{
  const example=getExampleById(params.id);if(!example)return{title:'Example not found | Apexify.js',robots:{index:false,follow:false}};
  const canonical=`${SITE_ORIGIN}${example.canonicalRoute}`;
  return{title:`${example.title} | Apexify.js Example`,description:example.summary,alternates:{canonical},openGraph:{type:'article',title:example.title,description:example.summary,url:canonical,siteName:'Apexify.js Documentation'}};
}
export default function ExamplePage({params}:{params:{id:string}}){
  const example=getExampleById(params.id);if(!example)notFound();
  const groups=buildDocumentationNavigation(loadDocumentationPages());
  return <DocsShell groups={groups} headings={[]} activePath={example.canonicalRoute}><main className="apx-doc-prose apx-doc5-page" data-doc5-route={example.id} tabIndex={-1}><nav aria-label="Example breadcrumbs" className="apx-api-breadcrumbs"><a href="/gallery">Gallery</a><span>/</span><span aria-current="page">{example.title}</span></nav><ExecutableExample id={example.id}/><RelatedContent sourceId={example.id} preferredKinds={['example']} title="Related guides, API, and examples" /></main></DocsShell>;
}
