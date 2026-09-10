import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT=process.cwd(),OUT=path.join(ROOT,'.doc4-runtime-evidence');fs.mkdirSync(OUT,{recursive:true});
const npmCommand=process.platform==='win32'?'npm.cmd':'npm';
const npxCommand=process.platform==='win32'?'npx.cmd':'npx';
const extractionStart=performance.now();
const extraction=spawnSync(npxCommand,['tsx','scripts/docs/doc4-extract.ts','--check'],{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
const extractionMs=performance.now()-extractionStart;process.stdout.write(extraction.stdout||'');process.stderr.write(extraction.stderr||'');if(extraction.status!==0)process.exit(extraction.status||1);
fs.rmSync(path.join(ROOT,'.next'),{recursive:true,force:true});
const started=performance.now();
const build=spawnSync(npmCommand,['run','build'],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});
const buildWallMs=performance.now()-started;process.stdout.write(build.stdout||'');process.stderr.write(build.stderr||'');if(build.status!==0)process.exit(build.status||1);

const appManifest=JSON.parse(fs.readFileSync(path.join(ROOT,'.next','app-build-manifest.json'),'utf8'));
const pages=appManifest.pages||{};
function pageChunks(match){const key=Object.keys(pages).find(k=>k.includes(match));if(!key)return {key:null,files:[],bytes:0};const files=[...new Set(pages[key]||[])].filter(x=>x.endsWith('.js')).map(file=>({file,bytes:fs.statSync(path.join(ROOT,'.next',file)).size}));return {key,files,bytes:files.reduce((n,x)=>n+x.bytes,0)};}
const apiIndex=pageChunks('/api-reference/page');
const apiRoute=pageChunks('/api-reference/[package]/[...symbol]/page');
if(!apiRoute.key)throw new Error('[doc4-measure] API dynamic route manifest key missing');

function allFiles(dir,out=[]){if(!fs.existsSync(dir))return out;for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())allFiles(p,out);else out.push(p);}return out;}
const refs=allFiles(path.join(ROOT,'.next','server','app','api-reference')).filter(f=>f.endsWith('client-reference-manifest.js'));
function islandChunks(token){
 const chunks=new Set();
 for(const file of refs){const text=fs.readFileSync(file,'utf8');let from=0;while((from=text.indexOf(token,from))>=0){const slice=text.slice(from,from+1800);for(const m of slice.matchAll(/static\/chunks\/[^"'\\]+\.js/g))chunks.add(m[0]);from+=token.length;}}
 const records=[...chunks].filter(f=>fs.existsSync(path.join(ROOT,'.next',f))).map(file=>({file,bytes:fs.statSync(path.join(ROOT,'.next',file)).size}));
 return {files:records,bytes:records.reduce((n,x)=>n+x.bytes,0)};
}
const signatureIsland=islandChunks('SignatureControls');
const optionIsland=islandChunks('OptionTable');
const explorerIsland=islandChunks('TypeExplorer');
const cssBytes=fs.statSync(path.join(ROOT,'styles','docs-api.css')).size;
const manifestBytes=fs.statSync(path.join(ROOT,'generated','docs-doc4','api-manifest.json')).size;
const searchBytes=fs.statSync(path.join(ROOT,'generated','docs-doc4','api-search-index.json')).size;
const baseline={source:'DOC-3 final validated closure baseline',buildWallMs:36359.386,routedDocsManifestJsBytes:1001005};
const evidence={schemaVersion:1,phase:'DOC-4',methodology:'clean Next.js production build; app-build-manifest routed JS; client-reference manifests for isolated DOC-4 client islands',
 baseline,after:{buildWallMs:Number(buildWallMs.toFixed(3)),extractionMs:Number(extractionMs.toFixed(3)),apiIndexJsBytes:apiIndex.bytes,complexApiRouteJsBytes:apiRoute.bytes,manifestBytes,searchBytes,cssBytes,
 signatureIslandJsBytes:signatureIsland.bytes,optionSearchIslandJsBytes:optionIsland.bytes,typeExplorerIslandJsBytes:explorerIsland.bytes},
 delta:{buildPercent:Number((((buildWallMs/baseline.buildWallMs)-1)*100).toFixed(2)),apiRouteVsDocsBaselinePercent:Number((((apiRoute.bytes/baseline.routedDocsManifestJsBytes)-1)*100).toFixed(2))},
 chunks:{apiIndex,apiRoute,signatureIsland,optionIsland,explorerIsland}};
fs.writeFileSync(path.join(OUT,'build-bundle.json'),`${JSON.stringify(evidence,null,2)}\n`);
console.log('[doc4-measure] '+JSON.stringify(evidence));
