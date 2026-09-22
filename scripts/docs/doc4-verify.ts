import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { ApiManifest } from '../../lib/api-reference/schema';

const ROOT=process.cwd(), OUT=path.join(ROOT,'generated','docs-doc4');
const read=(name:string)=>JSON.parse(fs.readFileSync(path.join(OUT,name),'utf8'));
const manifest=read('api-manifest.json') as ApiManifest;
assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.package.name,'apexify.js');
assert.equal(manifest.package.version,'6.0.0');
assert.equal(manifest.package.commit,'dbed9743353593eafae9a7b1c25312d7170a233b');
assert.match(manifest.package.packedTreeSha256,/^[a-f0-9]{64}$/);
assert.match(manifest.package.manifestSha256||'',/^[a-f0-9]{64}$/);
assert.ok(manifest.entrypoints.some(e=>e.exportPath==='.'));
assert.ok(manifest.entrypoints.some(e=>e.exportPath==='./types'));
assert.ok(manifest.symbols.some(s=>s.id==='apexify.js::ApexPainter'&&s.kind==='class'));
assert.ok(manifest.symbols.every(s=>s.href.startsWith('/api-reference/apexify.js/')));
assert.equal(manifest.coverage.missingPublicExports.length,0);
assert.equal(manifest.coverage.staleDocumentedExports.length,0);
assert.equal(manifest.coverage.missingOptionPaths.length,0);
assert.equal(manifest.coverage.staleOptionPaths.length,0);
assert.equal(manifest.coverage.signatureMismatches.length,0);
assert.equal(manifest.coverage.documentedPublicExports,manifest.coverage.publicExportsTotal);
assert.equal(manifest.coverage.documentedMembers,manifest.coverage.publicMembersTotal);
assert.equal(manifest.coverage.documentedOptionPaths,manifest.coverage.optionPathsTotal);
assert.equal(manifest.coverage.runtimeMetadataCoverage,1);
assert.equal(manifest.coverage.sourceLinkCoverage,1);
const repSymbol=manifest.symbols.find(s=>s.symbol==='ApexPainter');assert.ok(repSymbol);
const rep=repSymbol.members.find(m=>m.id===manifest.representativeApiId);assert.ok(rep);
assert.equal(rep.name,'createImage');
assert.match(rep.signature,/images:\s*ImageProperties\s*\|\s*ImageProperties\[\]/);
assert.match(rep.signature,/canvasBuffer:\s*CanvasResults\s*\|\s*Buffer/);
assert.match(rep.signature,/options\?:\s*CreateImageOptions/);
assert.match(rep.signature,/painterOpts\?:\s*PainterAssetRefsOptions/);
assert.match(rep.signature,/Promise<Buffer>/);
assert.equal(rep.runtimeTargets.join(','),'node22,node24,node26');
const flatten=(xs:any[]):any[]=>xs.flatMap(x=>[x,...flatten(x.children||[])]);
const options=rep.overloads.flatMap(o=>o.parameters.flatMap(p=>flatten(p.options)));
for(const p of ['images.source','images.x','images.y','images.mask.source','images.mask.mode','images.distortion.type','images.effects.vignette.intensity','options.groupTransform','painterOpts.resolveAssetRefs'])assert.ok(options.some(o=>o.path===p),`missing ${p}`);
assert.equal(options.find(o=>o.path==='images.fit')?.defaultValue,'fill');
assert.equal(options.find(o=>o.path==='images.align')?.defaultValue,'center');
assert.equal(options.find(o=>o.path==='painterOpts.resolveAssetRefs')?.defaultValue,false);
assert.ok(options.find(o=>o.path==='images.fit')?.allowedValues.includes('contain'));
assert.ok(manifest.errors.some(e=>e.className==='ApexifyInputError'&&e.relatedApiIds.includes(rep.id)));
assert.ok(manifest.errors.some(e=>e.className==='ApexifyDecodeError'&&e.relatedApiIds.includes(rep.id)));
assert.ok(manifest.errors.some(e=>e.className==='ApexifyResourceLimitError'&&e.relatedApiIds.includes(rep.id)));
for(const limit of ['maxCanvasDimension','maxCollectionItems','maxFiltersPerOperation','maxImageSourceBytes','maxDecodedImagePixels','maxDecodedImageFrames'])assert.ok(manifest.limits.some(l=>l.name===limit&&l.id.startsWith(rep.id)));
const search=read('api-search-index.json').records;
assert.ok(search.some((r:any)=>r.kind==='api-symbol'&&r.title==='ApexPainter'));
assert.ok(search.some((r:any)=>r.kind==='api-member'&&r.href===rep.href));
assert.ok(search.some((r:any)=>r.kind==='api-option'&&r.title==='images.mask.mode'&&r.href.endsWith('#option-images-mask-mode')));
assert.ok(search.some((r:any)=>r.kind==='api-type'&&r.title==='ImageProperties'));
assert.ok(search.some((r:any)=>r.kind==='api-error'&&r.title.includes('ApexifyInputError')));
const representative=read('representative-api.json');
assert.ok(Object.values(representative.completion).every(Boolean));
assert.ok(representative.optionCount>=40,`representative option depth too weak: ${representative.optionCount}`);
const coverage=read('api-coverage.json');assert.equal(coverage.missingIdentifiers.exports.length,0);assert.equal(coverage.missingIdentifiers.options.length,0);assert.equal(coverage.missingIdentifiers.signatures.length,0);
const optionCoverage=read('option-coverage.json');assert.equal(optionCoverage.total,optionCoverage.documented);assert.equal(optionCoverage.missing.length,0);assert.ok(optionCoverage.nestedPaths>0);
const sig=read('signature-verification.json');assert.equal(sig.mismatches.length,0);assert.ok(sig.verified>0);
const source=read('source-link-verification.json');assert.equal(source.invalid.length,0);assert.equal(source.valid,source.total);
const index=read('index.json');assert.ok(index.artifacts.length>=11);
const requiredFiles=[
  'components/api-reference/ApiReferenceComponents.tsx','components/api-reference/SignatureControls.tsx','components/api-reference/OptionTable.tsx','components/api-reference/TypeExplorer.tsx','components/api-reference/EnumValueList.tsx',
  'app/api-reference/layout.tsx','app/api-reference/page.tsx','app/api-reference/[package]/[...symbol]/page.tsx',
  'styles/docs-api.css','DOC4_API_REFERENCE_AUTHORING.md','DOC4_API_COMPONENTS.md',
  'components/docs/DocsSidebarSearch.tsx','components/docs/shell/CustomCursorGate.tsx','app/docs/api/page.tsx','app/api/docs/search/route.ts'
];
for(const f of requiredFiles)assert.ok(fs.existsSync(path.join(ROOT,f)),f);
const serverFiles=['components/api-reference/ApiReferenceComponents.tsx','app/api-reference/[package]/[...symbol]/page.tsx','lib/api-reference/manifest.ts'];
for(const f of serverFiles){const text=fs.readFileSync(path.join(ROOT,f),'utf8');assert.ok(!text.includes("from 'typescript'")&&!text.includes('from "typescript"'),`${f} leaks typescript`);}
for(const f of ['components/api-reference/SignatureControls.tsx','components/api-reference/OptionTable.tsx','components/api-reference/TypeExplorer.tsx']){const client=fs.readFileSync(path.join(ROOT,f),'utf8');assert.ok(client.startsWith('"use client"'));assert.ok(!client.includes("from 'typescript'")&&!client.includes('from "typescript"'));}
const sigControls=fs.readFileSync(path.join(ROOT,'components/api-reference/SignatureControls.tsx'),'utf8');assert.ok(sigControls.includes('HighlightedTypeScript')&&sigControls.includes('data-doc4-component="OverloadTabs"'));
const optionTableSource=fs.readFileSync(path.join(ROOT,'components/api-reference/OptionTable.tsx'),'utf8');assert.ok(optionTableSource.includes('export function OptionCard')&&optionTableSource.includes('InlineEnumValueList'));
const apiIndexSource=fs.readFileSync(path.join(ROOT,'app/api-reference/page.tsx'),'utf8');
const apiRouteSource=fs.readFileSync(path.join(ROOT,'app/api-reference/[package]/[...symbol]/page.tsx'),'utf8');
assert.ok(!apiIndexSource.includes('<main id="docs-content"')&&!apiRouteSource.includes('<main id="docs-content"'),'API pages must not nest a second docs main landmark');
const sidebarSearch=fs.readFileSync(path.join(ROOT,'components/docs/DocsSidebarSearch.tsx'),'utf8');
assert.ok(sidebarSearch.includes("'api'")&&sidebarSearch.includes("api: 'API'")&&sidebarSearch.includes('data-search-href={result.href}'),'active docs search UI does not understand API-index records');
const legacyApiRedirect=fs.readFileSync(path.join(ROOT,'app/docs/api/page.tsx'),'utf8');
assert.ok(legacyApiRedirect.includes("redirect('/api-reference')"),'legacy /docs/api does not redirect to canonical DOC-4 reference');
const cursorGate=fs.readFileSync(path.join(ROOT,'components/docs/shell/CustomCursorGate.tsx'),'utf8');
assert.ok(cursorGate.includes("!pathname?.startsWith('/api-reference')"),'custom cursor is not disabled for API documentation routes');
console.log(`[doc4-verify] PASS exports=${manifest.coverage.publicExportsTotal} members=${manifest.coverage.publicMembersTotal} options=${manifest.coverage.optionPathsTotal} representativeOptions=${representative.optionCount}`);
