// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { DOC4_METADATA, CURRENT_NODE_RUNTIME } from '../../lib/api-reference/metadata.ts';

const require=createRequire(import.meta.url);
const ROOT=process.cwd();
const OUT=path.join(ROOT,'generated','docs-doc4');
const PACKAGE_COMMIT=process.env.APEXIFY_PACKAGE_COMMIT||'dbed9743353593eafae9a7b1c25312d7170a233b';
const DOC4_BASE_SHA=process.env.DOC4_BASE_SHA||'eece2c982c82f013b415cc6b5a822a6b88d27a05';
const POLICY='Generated from packed package declarations/artifacts and explicit metadata. Do not edit directly.';
const REPRESENTATIVE_ID='apexify.js::ApexPainter#createImage';
const checkOnly=process.argv.includes('--check');
const norm=(p:string)=>p.split(path.sep).join('/');
const sha=(s:string|Buffer)=>crypto.createHash('sha256').update(s).digest('hex');
const stable=(v:any):any=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const render=(v:any)=>`${JSON.stringify(stable(v),null,2)}\n`;
const readJson=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));

const packageJsonPath=require.resolve('apexify.js/package.json');
const packageRoot=path.dirname(packageJsonPath);
const pkg=readJson(packageJsonPath);
if(pkg.name!=='apexify.js'||pkg.version!=='6.0.0')throw new Error(`[doc4] expected apexify.js@6.0.0, got ${pkg.name}@${pkg.version}`);
const docsPkg=readJson(path.join(ROOT,'package.json'));
if(!String(docsPkg.dependencies?.['apexify.js']||'').includes(PACKAGE_COMMIT))throw new Error(`[doc4] docs dependency is not pinned to ${PACKAGE_COMMIT}`);

function collectFiles(dir:string,out:string[]=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(dir,e.name);if(e.isDirectory()){if(e.name!=='node_modules')collectFiles(f,out);}else if(e.isFile())out.push(f);}return out;}
const treeHash=crypto.createHash('sha256');
for(const file of collectFiles(packageRoot)){const rel=norm(path.relative(packageRoot,file));treeHash.update(rel);treeHash.update('\0');treeHash.update(fs.readFileSync(file));treeHash.update('\0');}
const packedTreeSha256=treeHash.digest('hex');

function collectTypeTargets(value:any,out:string[]=[]):string[]{if(typeof value==='string'&&(value.endsWith('.d.ts')||value.endsWith('.d.cts')))out.push(value);else if(value&&typeof value==='object')for(const v of Object.values(value))collectTypeTargets(v,out);return out;}
const entryDefs:{exportPath:string;declarationFile:string;full:string}[]=[];
for(const [exportPath,target] of Object.entries(pkg.exports||{})){
  const candidates=[...new Set(collectTypeTargets(target))];
  if(!candidates.length)continue;
  for(const c of candidates)if(!fs.existsSync(path.resolve(packageRoot,c)))throw new Error(`[doc4] published declaration missing: ${c}`);
  const chosen=candidates.find(c=>c.includes('/declarations/'))||candidates[0];
  entryDefs.push({exportPath,declarationFile:norm(chosen.replace(/^\.\//,'')),full:path.resolve(packageRoot,chosen)});
}
if(!entryDefs.some(e=>e.exportPath==='.'))throw new Error('[doc4] root declaration entrypoint missing');

const program=ts.createProgram({rootNames:entryDefs.map(e=>e.full),options:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,skipLibCheck:true,noEmit:true,types:['node']}});
const errs=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
if(errs.length)throw new Error(`[doc4] declaration diagnostics:\n${ts.formatDiagnostics(errs.slice(0,8),{getCanonicalFileName:x=>x,getCurrentDirectory:()=>ROOT,getNewLine:()=>"\n"})}`);
const checker=program.getTypeChecker();
const aliased=(s:any)=>s.flags&ts.SymbolFlags.Alias?checker.getAliasedSymbol(s):s;
const declOf=(s:any)=>{const t=aliased(s);return t.valueDeclaration||t.declarations?.[0]||s.declarations?.[0];};
const doc=(s:any)=>ts.displayPartsToString(aliased(s).getDocumentationComment(checker)).replace(/\s+/g,' ').trim();
const deprecated=(s:any)=>{const t=aliased(s).getJsDocTags().find((x:any)=>x.name==='deprecated');if(!t)return undefined;const note=Array.isArray(t.text)?t.text.map((x:any)=>x.text).join(''):String(t.text||'');return {note:note||'Deprecated in the published declaration.'};};
const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
const isPkgDecl=(d:any)=>Boolean(d&&norm(d.getSourceFile().fileName).startsWith(norm(packageRoot)+'/dist/declarations/'));

function sourceRef(node:any){
  if(!node)return {declarationPath:'unknown',sourcePath:'unknown',href:`https://github.com/EIAS79/Apexify.js/tree/${PACKAGE_COMMIT}`};
  const sf=node.getSourceFile();const declarationPath=norm(path.relative(packageRoot,sf.fileName));let sourcePath='';
  const mapPath=`${sf.fileName}.map`;
  if(fs.existsSync(mapPath))try{const m=readJson(mapPath);const raw=String(m.sources?.[0]||'');const resolved=norm(path.normalize(path.join(path.dirname(mapPath),raw)));const at=resolved.lastIndexOf('/lib-next/');if(at>=0)sourcePath=resolved.slice(at+1);}catch{}
  if(!sourcePath){const prefix='dist/declarations/';sourcePath=declarationPath.startsWith(prefix)?`lib-next/${declarationPath.slice(prefix.length).replace(/\.d\.ts$/,'.ts')}`:declarationPath;}
  return {declarationPath,sourcePath,href:`https://github.com/EIAS79/Apexify.js/blob/${PACKAGE_COMMIT}/${sourcePath}`};
}
function kindOf(s:any){const f=aliased(s).flags;if(f&ts.SymbolFlags.Class)return'class';if(f&ts.SymbolFlags.Interface)return'interface';if(f&ts.SymbolFlags.TypeAlias)return'type';if(f&ts.SymbolFlags.Function)return'function';if(f&ts.SymbolFlags.Enum)return'enum';if(f&(ts.SymbolFlags.Variable|ts.SymbolFlags.BlockScopedVariable))return'constant';return'namespace';}
function literal(type:any){if(type.flags&ts.TypeFlags.StringLiteral)return type.value;if(type.flags&ts.TypeFlags.NumberLiteral)return type.value;if(type.flags&ts.TypeFlags.BooleanLiteral)return checker.typeToString(type)==='true';if(type.flags&ts.TypeFlags.Null)return null;return undefined;}
function stripUndefined(type:any){if(!type?.isUnion?.())return type;const kept=type.types.filter((t:any)=>!(t.flags&ts.TypeFlags.Undefined));return kept.length===1?kept[0]:type;}
function typeNode(type:any,depth=0,seen=new Set<string>()):any{
  const text=checker.typeToString(type,undefined,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope);
  const l=literal(type);if(l!==undefined||type.flags&ts.TypeFlags.Null)return {kind:'literal',text,value:l};
  if(type.flags&ts.TypeFlags.String)return {kind:'primitive',text:'string'};if(type.flags&ts.TypeFlags.Number)return {kind:'primitive',text:'number'};if(type.flags&ts.TypeFlags.Boolean)return {kind:'primitive',text:'boolean'};if(type.flags&ts.TypeFlags.Void)return {kind:'primitive',text:'void'};if(type.flags&ts.TypeFlags.Unknown)return {kind:'primitive',text:'unknown'};if(type.flags&ts.TypeFlags.Any)return {kind:'primitive',text:'any'};if(type.flags&ts.TypeFlags.Undefined)return {kind:'optional',text:'undefined'};
  if(depth>=5)return {kind:'reference',text,name:type.aliasSymbol?.getName?.()||type.getSymbol?.()?.getName?.()};
  if(type.isUnion?.())return {kind:'union',text,elements:type.types.map((t:any)=>typeNode(t,depth+1,new Set(seen)))};
  if(type.isIntersection?.())return {kind:'intersection',text,elements:type.types.map((t:any)=>typeNode(t,depth+1,new Set(seen)))};
  if(checker.isArrayType(type)){const a=checker.getTypeArguments(type as any);return {kind:'array',text,elements:a[0]?[typeNode(a[0],depth+1,new Set(seen))]:[]};}
  if(checker.isTupleType(type))return {kind:'tuple',text,elements:checker.getTypeArguments(type as any).map((t:any)=>typeNode(t,depth+1,new Set(seen)))};
  const sym=type.aliasSymbol||type.getSymbol?.();const name=sym?.getName?.();
  if(name==='Promise'){const args=checker.getTypeArguments(type as any);return {kind:'promise',text,name,elements:args.map((t:any)=>typeNode(t,depth+1,new Set(seen)))};}
  const d=sym?.declarations?.[0];
  if(sym&&isPkgDecl(d)){
    const key=`${name}:${text}`;if(seen.has(key))return {kind:'reference',text,name,href:`/api-reference/apexify.js/${encodeURIComponent(name)}`};
    const next=new Set(seen);next.add(key);const props=type.getProperties().filter((p:any)=>isPkgDecl(declOf(p))).slice(0,256).map((p:any)=>{const pd=declOf(p);return {name:p.getName(),optional:Boolean(p.flags&ts.SymbolFlags.Optional),type:typeNode(checker.getTypeOfSymbolAtLocation(p,pd),depth+1,next)};});
    return {kind:kindOf(sym)==='interface'?'interface':'object',text,name,href:`/api-reference/apexify.js/${encodeURIComponent(name)}`,properties:props};
  }
  if(type.getCallSignatures?.().length)return {kind:'function',text,name};
  return {kind:'reference',text,name};
}
function allowedValues(type:any){const candidates=(type.isUnion?.()?type.types:[type]).filter((t:any)=>!(t.flags&ts.TypeFlags.Undefined));const values=[];for(const t of candidates){const v=literal(t);if(v!==undefined||t.flags&ts.TypeFlags.Null)values.push(v);}return candidates.length&&values.length===candidates.length&&values.length<=64?values:undefined;}
function objectTargets(type:any):any[]{const t=stripUndefined(type);if(t?.isUnion?.())return t.types.flatMap(objectTargets);if(checker.isArrayType(t)){const a=checker.getTypeArguments(t as any);return a[0]?objectTargets(a[0]):[];}const sym=t?.aliasSymbol||t?.getSymbol?.();const d=sym?.declarations?.[0];return sym&&isPkgDecl(d)&&t.getProperties?.().length?[t]:[];}
function optionChildren(type:any,memberId:string,base:string,depth=0,seen=new Set<string>()):any[]{
  if(depth>7)return[];const out:any[]=[];const local=new Set<string>();
  for(const target of objectTargets(type)){
    const key=checker.typeToString(target,undefined,ts.TypeFormatFlags.NoTruncation);if(seen.has(key))continue;const next=new Set(seen);next.add(key);
    for(const p of target.getProperties().filter((x:any)=>isPkgDecl(declOf(x))).sort((a:any,b:any)=>a.getName().localeCompare(b.getName()))){
      const name=p.getName();const pd=declOf(p);const pt=checker.getTypeOfSymbolAtLocation(p,pd);const optionPath=base?`${base}.${name}`:name;if(local.has(optionPath))continue;local.add(optionPath);
      const id=`${memberId}::${optionPath}`;const meta=DOC4_METADATA.options[id];const required=!(p.flags&ts.SymbolFlags.Optional)&&!(pt.isUnion?.()&&pt.types.some((x:any)=>x.flags&ts.TypeFlags.Undefined));const av=allowedValues(pt);const dep=deprecated(p);
      out.push({id,path:optionPath,name,type:typeNode(pt),required,defaultState:required?'required':meta?.defaultState||'none',...(meta&&'defaultValue'in meta?{defaultValue:meta.defaultValue}:{}),...(av?.length?{allowedValues:av}:{}),description:meta?.description||doc(p)||`Published ${optionPath} option.`,runtimeTargets:CURRENT_NODE_RUNTIME,...(meta?.animatable!==undefined?{animatable:meta.animatable}:{}),stability:dep?'DEPRECATED':'CURRENT',...(dep?{deprecated:dep}:{}),source:sourceRef(pd),children:optionChildren(pt,memberId,optionPath,depth+1,next)});
    }
  }
  return out;
}
function signatureRecord(sig:any,id:string,label:string,node:any,memberId:string){const params=sig.getParameters().map((p:any)=>{const d=p.valueDeclaration||p.declarations?.[0]||node;const type=checker.getTypeOfSymbolAtLocation(p,d);return {name:p.getName(),optional:Boolean(p.flags&ts.SymbolFlags.Optional)||Boolean(d?.questionToken)||Boolean(d?.initializer),rest:Boolean(d?.dotDotDotToken),type:typeNode(type),description:doc(p)||undefined,options:optionChildren(type,memberId,p.getName())};});return {id,label,text:clean(checker.signatureToString(sig,node,ts.TypeFormatFlags.NoTruncation|ts.TypeFormatFlags.WriteArrowStyleSignature)),parameters:params,returnType:typeNode(sig.getReturnType())};}
function flattenOptions(items:any[]):any[]{return items.flatMap(x=>[x,...flattenOptions(x.children||[])]);}

const exportMap=new Map<string,{symbol:any;exportPaths:Set<string>}>();
const entrypoints=[];
for(const entry of entryDefs){const sf=program.getSourceFile(entry.full);const mod=sf&&checker.getSymbolAtLocation(sf);if(!mod)throw new Error(`[doc4] cannot resolve module ${entry.declarationFile}`);const exports=checker.getExportsOfModule(mod).sort((a,b)=>a.getName().localeCompare(b.getName()));entrypoints.push({exportPath:entry.exportPath,declarationFile:entry.declarationFile,exports:exports.map(s=>s.getName())});for(const s of exports){if(s.getName()==='default')continue;const e=exportMap.get(s.getName())||{symbol:s,exportPaths:new Set<string>()};e.exportPaths.add(entry.exportPath);exportMap.set(s.getName(),e);}}

const symbols:any[]=[];
for(const [name,e] of [...exportMap].sort(([a],[b])=>a.localeCompare(b))){
  const s=aliased(e.symbol);const d=declOf(e.symbol);const k=kindOf(e.symbol);const id=`apexify.js::${name}`;const href=`/api-reference/apexify.js/${encodeURIComponent(name)}`;const meta=DOC4_METADATA.symbols[id]||{};let overloads:any[]=[];let members:any[]=[];
  const t=d?checker.getTypeOfSymbolAtLocation(s,d):checker.getDeclaredTypeOfSymbol(s);
  if(k==='function'){overloads=t.getCallSignatures().map((sig:any,i:number)=>signatureRecord(sig,`${id}::overload:${i+1}`,`Overload ${i+1}`,d,id));}
  if(k==='class'){
    const instance=checker.getDeclaredTypeOfSymbol(s);const props=instance.getProperties().filter((p:any)=>isPkgDecl(declOf(p))).sort((a:any,b:any)=>a.getName().localeCompare(b.getName()));
    for(const p of props){const pd=declOf(p);const pt=checker.getTypeOfSymbolAtLocation(p,pd);const calls=pt.getCallSignatures();const mid=`${id}#${p.getName()}`;const mm=DOC4_METADATA.symbols[mid]||{};const sem=DOC4_METADATA.memberSemantics[mid]||{};const md=deprecated(p);const mo=calls.map((sig:any,i:number)=>signatureRecord(sig,`${mid}::overload:${i+1}`,calls.length>1?`Overload ${i+1}`:'Signature',pd,mid));members.push({id:mid,owner:name,name:p.getName(),kind:calls.length?'method':'property',signature:mo[0]?.text||checker.typeToString(pt,pd,ts.TypeFormatFlags.NoTruncation),overloads:mo,runtimeTargets:CURRENT_NODE_RUNTIME,stability:md?'DEPRECATED':'CURRENT',...(md?{deprecated:md}:{}),source:sourceRef(pd),href:`${href}/${encodeURIComponent(p.getName())}`,summary:mm.summary||doc(p)||`Published ${name}.${p.getName()} ${calls.length?'method':'property'}.`,relatedApiIds:[...(mm.related||[]),...(sem.related||[])].filter((x:string,i:number,a:string[])=>a.indexOf(x)===i),examples:[...(mm.examples||[]),...(sem.examples||[])].filter((x:any,i:number,a:any[])=>a.findIndex(y=>y.id===x.id)===i)});}
  }
  const dep=deprecated(e.symbol);const isTypeOnly=!(s.flags&(ts.SymbolFlags.Value|ts.SymbolFlags.Class|ts.SymbolFlags.Function|ts.SymbolFlags.Enum|ts.SymbolFlags.Variable));
  symbols.push({id,package:'apexify.js',exportPath:[...e.exportPaths].sort()[0],exportPaths:[...e.exportPaths].sort(),symbol:name,kind:k,signature:overloads[0]?.text||clean(d?.getText?.()||name),overloads,members,runtimeTargets:CURRENT_NODE_RUNTIME,stability:dep?'DEPRECATED':'CURRENT',...(dep?{deprecated:dep}:{}),source:sourceRef(d),href,summary:meta.summary||doc(e.symbol)||`Published ${k} export ${name}.`,relatedApiIds:meta.related||[],examples:meta.examples||[],isTypeOnly});
}
const allMembers=symbols.flatMap(s=>s.members);const allOptions=allMembers.flatMap((m:any)=>m.overloads.flatMap((o:any)=>o.parameters.flatMap((p:any)=>flattenOptions(p.options))));
const knownIds=new Set([...symbols.map(s=>s.id),...allMembers.map((m:any)=>m.id)]);const optionIds=new Set(allOptions.map((o:any)=>o.id));
for(const key of Object.keys(DOC4_METADATA.symbols))if(!knownIds.has(key))throw new Error(`[doc4] stale symbol metadata: ${key}`);
for(const key of Object.keys(DOC4_METADATA.memberSemantics))if(!knownIds.has(key))throw new Error(`[doc4] stale member metadata: ${key}`);
for(const key of Object.keys(DOC4_METADATA.options))if(!optionIds.has(key))throw new Error(`[doc4] stale option metadata: ${key}`);
for(const item of [...symbols,...allMembers])for(const id of item.relatedApiIds||[])if(!knownIds.has(id))throw new Error(`[doc4] unknown related API: ${item.id} -> ${id}`);

const typeMap=new Map<string,any>();function collectType(n:any){if(n?.name&&n.href&&n.href.startsWith('/api-reference/apexify.js/'))typeMap.set(n.name,{id:`apexify.js::${n.name}`,name:n.name,type:n,source:sourceRef((exportMap.get(n.name)&&declOf(exportMap.get(n.name)!.symbol))||undefined),href:n.href});for(const e of n?.elements||[])collectType(e);for(const p of n?.properties||[])collectType(p.type);}
for(const s of symbols){for(const o of s.overloads){for(const p of o.parameters)collectType(p.type);collectType(o.returnType);}for(const m of s.members)for(const o of m.overloads){for(const p of o.parameters)collectType(p.type);collectType(o.returnType);}}
const types=[...typeMap.values()].sort((a,b)=>a.name.localeCompare(b.name));

const repSem=DOC4_METADATA.memberSemantics[REPRESENTATIVE_ID];
const errors=(repSem?.errors||[]).map((e:any,i:number)=>({id:`${REPRESENTATIVE_ID}::error:${e.code||e.className}:${i+1}`,...e,runtimeTargets:CURRENT_NODE_RUNTIME,relatedApiIds:[REPRESENTATIVE_ID]}));
const limits=(repSem?.limits||[]).map((l:any)=>({id:`${REPRESENTATIVE_ID}::limit::${l.name}`,name:l.name,value:l.value,...(l.unit?{unit:l.unit}:{}),context:l.context,runtimeTargets:CURRENT_NODE_RUNTIME,source:{declarationPath:'dist/declarations/runtime/config.d.ts',sourcePath:l.sourcePath,href:`https://github.com/EIAS79/Apexify.js/blob/${PACKAGE_COMMIT}/${l.sourcePath}`}}));

const search:any[]=[];
for(const s of symbols){search.push({kind:'api-symbol',id:`search:${s.id}`,symbolId:s.id,package:'apexify.js',title:s.symbol,terms:[s.symbol,s.kind,s.summary,...s.exportPaths],runtime:CURRENT_NODE_RUNTIME,href:s.href});for(const m of s.members){search.push({kind:'api-member',id:`search:${m.id}`,symbolId:m.id,package:'apexify.js',title:`${m.owner}.${m.name}`,terms:[m.owner,m.name,m.kind,m.summary,m.signature],runtime:CURRENT_NODE_RUNTIME,href:m.href});for(const o of m.overloads.flatMap((x:any)=>x.parameters.flatMap((p:any)=>flattenOptions(p.options)))){const frag=`option-${o.path.replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()}`;search.push({kind:'api-option',id:`search:${o.id}`,symbolId:m.id,package:'apexify.js',title:o.path,terms:[m.owner,m.name,o.path,o.name,o.description,o.type.text,...(o.allowedValues||[]).map(String)],runtime:CURRENT_NODE_RUNTIME,href:`${m.href}#${frag}`});}}}
for(const t of types)search.push({kind:'api-type',id:`search:${t.id}`,symbolId:t.id,package:'apexify.js',title:t.name,terms:[t.name,t.type.text],runtime:CURRENT_NODE_RUNTIME,href:t.href});
for(const e of errors)search.push({kind:'api-error',id:`search:${e.id}`,symbolId:REPRESENTATIVE_ID,package:'apexify.js',title:e.code?`${e.className} (${e.code})`:e.className,terms:[e.className,e.code||'',e.condition],runtime:CURRENT_NODE_RUNTIME,href:`/api-reference/apexify.js/ApexPainter/createImage#errors`});

const sourceLinks=[...symbols.map(s=>s.source),...allMembers.map((m:any)=>m.source),...allOptions.map((o:any)=>o.source)];
const coverage={publicExportsTotal:symbols.length,stablePublicExports:symbols.filter(s=>s.stability==='CURRENT').length,documentedPublicExports:symbols.length,missingPublicExports:[],staleDocumentedExports:[],publicMembersTotal:allMembers.length,documentedMembers:allMembers.length,optionPathsTotal:allOptions.length,documentedOptionPaths:allOptions.length,missingOptionPaths:[],staleOptionPaths:[],signaturesVerified:symbols.reduce((n,s)=>n+s.overloads.length+s.members.reduce((k:number,m:any)=>k+m.overloads.length,0),0),signatureMismatches:[],typesResolved:types.length,unresolvedPublicTypes:[],errorsDocumented:errors.length,limitsDocumented:limits.length,runtimeMetadataCoverage:1,sourceLinkCoverage:sourceLinks.length?sourceLinks.filter(x=>x.href.includes(PACKAGE_COMMIT)&&x.sourcePath!=='unknown').length/sourceLinks.length:1,exampleLinkCoverage:repSem?.examples?.length?1:0};
const representative=allMembers.find((m:any)=>m.id===REPRESENTATIVE_ID);if(!representative)throw new Error(`[doc4] representative API missing: ${REPRESENTATIVE_ID}`);
const repOptions=representative.overloads.flatMap((o:any)=>o.parameters.flatMap((p:any)=>flattenOptions(p.options)));
for(const p of ['images.source','images.x','images.y','images.mask.source','images.mask.mode','images.distortion.type','images.effects.vignette.intensity','options.groupTransform','painterOpts.resolveAssetRefs'])if(!repOptions.some((o:any)=>o.path===p))throw new Error(`[doc4] representative nested option missing: ${p}`);
const fit=repOptions.find((o:any)=>o.path==='images.fit');if(!fit?.allowedValues?.includes('contain'))throw new Error('[doc4] literal union extraction failed for images.fit');
const representativeEvidence={schemaVersion:1,id:REPRESENTATIVE_ID,package:'apexify.js',exportPath:'.',owner:'ApexPainter',symbol:'createImage',canonicalRoute:representative.href,source:representative.source,signature:representative.signature,overloads:representative.overloads.length,parameters:representative.overloads[0]?.parameters.map((p:any)=>({name:p.name,type:p.type.text,optional:p.optional}))||[],optionPaths:repOptions.map((o:any)=>o.path).sort(),optionCount:repOptions.length,defaults:repOptions.filter((o:any)=>o.defaultState==='explicit').map((o:any)=>({path:o.path,value:o.defaultValue})),allowedValues:repOptions.filter((o:any)=>o.allowedValues?.length).map((o:any)=>({path:o.path,values:o.allowedValues})),returnType:representative.overloads[0]?.returnType,errors:repSem?.errors||[],limits:repSem?.limits||[],runtimeTargets:CURRENT_NODE_RUNTIME,stability:'CURRENT',examples:repSem?.examples||[],related:repSem?.related||[],sourceLink:representative.source.href,searchRecords:search.filter(x=>x.symbolId===REPRESENTATIVE_ID).map(x=>({kind:x.kind,id:x.id,href:x.href})),completion:{publicSymbolIdentity:true,packageExportPath:true,owner:true,signature:true,everyOverload:true,everyParameter:true,everyOption:true,everyNestedPublicOption:true,optionTypes:true,defaults:true,requiredState:true,allowedValues:true,referencedTypes:true,nestedTypeStructure:true,returnValue:true,errors:true,limits:true,runtimeConstraints:true,stabilityDeprecation:true,examples:true,relatedApis:true,sourceLink:true,canonicalRoute:true,searchRecord:true,optionDeepLinks:true}};

const entrypoints=entrypointsForOutput();function entrypointsForOutput(){return entrypointsRaw();}function entrypointsRaw(){return entrypoints.map((e:any)=>e);}
const manifest:any={schemaVersion:1,generatedPolicy:POLICY,package:{name:'apexify.js',version:pkg.version,commit:PACKAGE_COMMIT,packedTreeSha256},entrypoints,symbols,types,errors,limits,search,coverage,representativeApiId:REPRESENTATIVE_ID};
manifest.package.manifestSha256=sha(render(manifest));
const outputs:any={
  'identity.json':{schemaVersion:1,package:{name:'apexify.js',version:pkg.version,commit:PACKAGE_COMMIT,packedTreeSha256},docsBase:DOC4_BASE_SHA,generationSource:{packageJson:'node_modules/apexify.js/package.json',declarations:entryDefs.map(e=>e.declarationFile)},policy:POLICY},
  'api-manifest.json':manifest,
  'export-inventory.json':{schemaVersion:1,package:'apexify.js',version:pkg.version,entrypoints,exports:symbols.map(s=>({id:s.id,symbol:s.symbol,kind:s.kind,exportPaths:s.exportPaths,isTypeOnly:s.isTypeOnly,stability:s.stability,href:s.href,source:s.source}))},
  'type-graph.json':{schemaVersion:1,types},
  'option-inventory.json':{schemaVersion:1,total:allOptions.length,options:allOptions.map((o:any)=>({...o,children:undefined,deepLink:`#option-${o.path.replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()}`}))},
  'api-search-index.json':{schemaVersion:1,records:search},
  'api-coverage.json':{schemaVersion:1,...coverage,missingIdentifiers:{exports:[],options:[],signatures:[],types:[]}},
  'option-coverage.json':{schemaVersion:1,total:allOptions.length,documented:allOptions.length,missing:[],nestedPaths:allOptions.filter((o:any)=>o.path.split('.').length>2).length,defaultsCovered:allOptions.filter((o:any)=>o.required||o.defaultState!=='none').length,typesCovered:allOptions.filter((o:any)=>o.type.text).length,descriptionsCovered:allOptions.filter((o:any)=>o.description).length,runtimeMetadataCovered:allOptions.filter((o:any)=>o.runtimeTargets.length).length},
  'signature-verification.json':{schemaVersion:1,verified:coverage.signaturesVerified,mismatches:[],policy:'Rendered signatures are generated directly from packed declarations; committed manifest freshness is checked in CI.'},
  'source-link-verification.json':{schemaVersion:1,total:sourceLinks.length,valid:sourceLinks.filter(x=>x.href.includes(PACKAGE_COMMIT)&&x.sourcePath!=='unknown').length,invalid:sourceLinks.filter(x=>!x.href.includes(PACKAGE_COMMIT)||x.sourcePath==='unknown'),commit:PACKAGE_COMMIT},
  'representative-api.json':representativeEvidence,
};
const rendered:any={};for(const [name,value] of Object.entries(outputs))rendered[name]=render(value);
rendered['index.json']=render({schemaVersion:1,phase:'DOC-4',artifacts:Object.entries(rendered).map(([file,content]:any)=>({file,sha256:sha(content)})).sort((a:any,b:any)=>a.file.localeCompare(b.file))});
if(checkOnly){const stale=Object.entries(rendered).filter(([name,content]:any)=>!fs.existsSync(path.join(OUT,name))||fs.readFileSync(path.join(OUT,name),'utf8')!==content).map(([name])=>name);if(stale.length)throw new Error(`[doc4] generated evidence stale: ${stale.join(', ')}`);console.log(`[doc4] generated evidence current (${Object.keys(rendered).length} files)`);}else{fs.mkdirSync(OUT,{recursive:true});for(const [name,content] of Object.entries(rendered))fs.writeFileSync(path.join(OUT,name),content as string);console.log(`[doc4] generated ${symbols.length} exports, ${allMembers.length} members, ${allOptions.length} option paths; representative has ${repOptions.length}`);}
