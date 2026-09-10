import Link from 'next/link';
import type { ApiError, ApiLimit, ApiMember, ApiSymbol, ApiTypeNode } from '@/lib/api-reference/schema';
import { PackageBadge } from '@/components/docs/status/DocsBadges';
import { SignatureControls } from './SignatureControls';
import { OptionTable } from './OptionTable';
import { TypeExplorer } from './TypeExplorer';
export { EnumValueList } from './EnumValueList';
export { OverloadTabs } from './SignatureControls';
export { OptionCard } from './OptionTable';

export function ApiMethodHeader({ symbol, member }: { symbol:ApiSymbol; member?:ApiMember }) {
  const item=member||symbol;
  return <header className="apx-api-header" data-doc4-component="ApiMethodHeader">
    <p className="apx-api-eyebrow">{member?`${member.owner} member`:`${symbol.kind} export`}</p>
    <h1>{member?<><span>{member.owner}.</span>{member.name}</>:symbol.symbol}</h1>
    <p>{item.summary}</p>
    <div className="apx-api-badges">
      <PackageBadge value="apexify.js" />
      <span className="apx-badge" data-status={item.stability.toLowerCase()}>{item.stability}</span>
      {item.runtimeTargets.map(r=><span key={r} className="apx-badge" data-kind="runtime">{r}</span>)}
      {item.since?<span className="apx-badge" data-kind="since">Since {item.since}</span>:null}
    </div>
    <SourceLink source={item.source} />
  </header>;
}

export function ApiSignature({ symbol, member }: { symbol:ApiSymbol; member?:ApiMember }) {
  const item=member||symbol;
  const overloads=item.overloads.length?item.overloads:[{
    id:`${item.id}::signature`,label:'Signature',text:item.signature,parameters:[],returnType:{kind:'unknown' as const,text:'—'}
  }];
  return <section aria-labelledby="api-signature-heading"><h2 id="api-signature-heading">Signature</h2><SignatureControls overloads={overloads} permalink={`${item.href}#api-signature-heading`} /></section>;
}

export function TypeReference({ type }: { type:ApiTypeNode }) {
  if(type.href&&type.name)return <Link data-doc4-component="TypeReference" href={type.href}><code>{type.text}</code></Link>;
  if(type.kind==='union'&&type.elements?.length)return <span data-doc4-component="TypeReference">{type.elements.map((e,i)=><span key={`${e.text}-${i}`}>{i?' | ':''}<TypeReference type={e}/></span>)}</span>;
  return <code data-doc4-component="TypeReference">{type.text}</code>;
}
export function ReturnValue({ member }: { member:ApiMember }) {
  const ret=member.overloads[0]?.returnType;
  return <section data-doc4-component="ReturnValue"><h2>Return value</h2>{ret?<><p><TypeReference type={ret}/></p><p>The return contract is generated from the packed declaration. Async wrappers and nullable/undefined variants remain visible in the type model.</p></>:<p>No callable return value.</p>}</section>;
}
export function ErrorReference({ errors }: { errors:ApiError[] }) {
  return <section id="errors" data-doc4-component="ErrorReference"><h2>Errors</h2>{errors.length?errors.map(e=><article key={e.id} className="apx-api-reference-card"><h3>{e.code?<><code>{e.code}</code> · </>:null}{e.className}</h3><dl><div><dt>Condition</dt><dd>{e.condition}</dd></div><div><dt>Resolution</dt><dd>{e.resolution}</dd></div><div><dt>Runtime</dt><dd>{e.runtimeTargets.join(', ')}</dd></div>{e.recoverability?<div><dt>Recoverability</dt><dd>{e.recoverability}</dd></div>:null}</dl></article>):<p>NOT APPLICABLE — no verified errors are bound to this API.</p>}</section>;
}
export function LimitReference({ limits }: { limits:ApiLimit[] }) {
  return <section id="limits" data-doc4-component="LimitReference"><h2>Limits</h2>{limits.length?limits.map(l=><article key={l.id} className="apx-api-reference-card"><h3><code>{l.name}</code></h3><p><strong>{l.value}{l.unit?` ${l.unit}`:''}</strong> — {l.context}</p><SourceLink source={l.source}/></article>):<p>NOT APPLICABLE — no API-specific verified limits are bound to this API.</p>}</section>;
}
export function RelatedApiGrid({ ids, lookup }: { ids:string[]; lookup:Map<string,{href:string;label:string;summary:string}> }) {
  return <section data-doc4-component="RelatedApiGrid"><h2>Related APIs</h2>{ids.length?<div className="apx-api-related-grid">{ids.map(id=>{const x=lookup.get(id);return x?<Link key={id} href={x.href} className="apx-api-reference-card"><strong>{x.label}</strong><span>{x.summary}</span></Link>:null;})}</div>:<p>No explicit related API metadata.</p>}</section>;
}
export function SourceLink({ source }: { source:{href:string;sourcePath:string;declarationPath:string} }) {
  return <a className="apx-api-source-link" data-doc4-component="SourceLink" href={source.href} rel="noreferrer" target="_blank">Source: <code>{source.sourcePath}</code><span className="sr-only"> (opens in a new tab)</span></a>;
}
export function Parameters({ member }: { member:ApiMember }) {
  const params=member.overloads[0]?.parameters||[];
  return <section><h2>Parameters</h2>{params.length?<div className="apx-api-parameter-list">{params.map(p=><article key={p.name} className="apx-api-reference-card"><h3><code>{p.name}{p.optional?'?':''}</code></h3><p><TypeReference type={p.type}/></p>{p.description?<p>{p.description}</p>:null}</article>)}</div>:<p>No parameters.</p>}</section>;
}
function hasNestedType(type:ApiTypeNode):boolean{return Boolean(type.properties?.length)||Boolean(type.elements?.some(hasNestedType));}
export function TypesSection({ member }: { member:ApiMember }) {
  const params=member.overloads[0]?.parameters||[];
  const types=params.filter(p=>hasNestedType(p.type));
  return <section><h2>Types</h2>{types.length?types.map(p=><TypeExplorer key={p.name} type={p.type} label={p.name}/>):<p>Parameter types are linked inline; no additional nested explorer is required.</p>}</section>;
}
export { OptionTable };
