import fs from 'node:fs';
import path from 'node:path';
import manifest from '../../generated/docs-doc5/example-manifest.json';
import coverage from '../../generated/docs-doc5/example-coverage.json';
import drift from '../../generated/docs-doc5/example-drift.json';
import provenance from '../../generated/docs-doc5/output-provenance.json';
import artifact from '../../generated/docs-doc5/package-artifact.json';

const root=process.cwd();
const expectedIds=['node.canvas.basic','node.chart.bar','node.gif.basic','node.integration.report'];
function fail(message:string):never{throw new Error(`[doc5-verify] ${message}`);}
const ids=(manifest.examples as Array<{id:string;verificationStatus:string;sources:Array<{content:string}>;gallery:{enabled:boolean};canonicalRoute:string}>).map((e)=>e.id);
for(const id of expectedIds) if(!ids.includes(id)) fail(`missing representative example ${id}`);
for(const example of manifest.examples as Array<{id:string;verificationStatus:string;sources:Array<{content:string}>;gallery:{enabled:boolean};canonicalRoute:string}>) {
  if(example.verificationStatus!=='verified') fail(`${example.id} is ${example.verificationStatus}, not verified`);
  if(!example.sources.length || !example.sources.every((s)=>s.content.trim())) fail(`${example.id} source display payload is empty`);
  if(!example.canonicalRoute.startsWith('/examples/')) fail(`${example.id} has invalid canonical route`);
}
if((coverage.verified as string[]).length!==expectedIds.length) fail('coverage does not mark every representative example verified');
for(const key of ['failed','stale','unverified'] as const) if((coverage[key] as string[]).length) fail(`coverage ${key}: ${(coverage[key] as string[]).join(', ')}`);
for(const key of ['orphanSources','manifestWithoutSource','sourceWithoutManifest','docsMissingExampleIds','apiMissingExampleIds','galleryMissingExampleIds','staleOutputs','unverifiedPublicExamples'] as const) if((drift[key] as string[]).length) fail(`drift ${key}: ${(drift[key] as string[]).join(', ')}`);
if(artifact.localSourceShortcut!==false || !artifact.artifactSha256) fail('packed artifact identity is missing or local-source shortcut was used');
if((provenance.examples as unknown[]).length!==expectedIds.length) fail('output provenance is incomplete');
for(const id of expectedIds) if(!fs.existsSync(path.join(root,'public','example-outputs',id))) fail(`public verified output directory missing for ${id}`);

const contract=fs.readFileSync(path.join(root,'components/mdx/doc3-contract.ts'),'utf8');
const parser=fs.readFileSync(path.join(root,'components/mdx/rich-parser.ts'),'utf8');
const renderer=fs.readFileSync(path.join(root,'components/docs/route/RouteDocsMarkdown.tsx'),'utf8');
const canvasGuide=fs.readFileSync(path.join(root,'content/docs/03-feature-guides/canvas/00-create-canvas-overview.mdx'),'utf8');
if(!contract.includes("'ExecutableExample'") || !contract.includes("'CodePreview'")) fail('safe MDX registry does not include DOC-5 components');
if(!parser.includes('DOC3_REGISTERED_COMPONENTS')) fail('routed parser is not driven by the shared registered-component contract');
for(const name of ['ExecutableExample','CodePreview']) if(!renderer.includes(`case '${name}'`)) fail(`${name} is not wired into the routed renderer`);
if(!canvasGuide.includes('<ExecutableExample id="node.canvas.basic"')) fail('representative guide does not consume the authoritative stable example ID');

const galleryHelper=fs.readFileSync(path.join(root,'app/gallery/components/galleryHelpers.ts'),'utf8');
const galleryAdapter=fs.readFileSync(path.join(root,'lib/gallery/docs/doc5GalleryAdapter.ts'),'utf8');
if(!galleryHelper.includes('doc5GalleryItems')) fail('Gallery does not consume DOC-5 manifest adapter');
if(!galleryAdapter.includes('example.canonicalRoute')) fail('Gallery does not expose a return path to the canonical verified example');
const route=fs.readFileSync(path.join(root,'app/examples/[id]/page.tsx'),'utf8');
if(!route.includes('notFound()') || !route.includes('ExecutableExample')) fail('example detail route contract incomplete');
const apiRoute=fs.readFileSync(path.join(root,'app/api-reference/[package]/[...symbol]/page.tsx'),'utf8');
if(!apiRoute.includes('getExamplesForApiId') || !apiRoute.includes('data-doc5-api-examples')) fail('DOC-4 API reference does not expose DOC-5 reverse example relationships');
console.log(`[doc5-verify] PASS — ${expectedIds.length} verified packed-package examples feed manifest/docs/API/Gallery/detail routes`);
