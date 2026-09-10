"use client";
import { useMemo, useState } from 'react';
import type { ApiOption } from '@/lib/api-reference/schema';
import { InlineEnumValueList } from './EnumValueList';
function flatten(options:ApiOption[]):ApiOption[]{return options.flatMap(o=>[o,...flatten(o.children||[])]);}
const fragment=(path:string)=>`option-${path.replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()}`;
function DefaultValue({option:o}:{option:ApiOption}){return <>{o.defaultState==='explicit'?<code>{JSON.stringify(o.defaultValue)}</code>:o.defaultState==='required'?'Required':o.defaultState==='runtime'?'Runtime-dependent':o.defaultState==='derived'?'Derived':'—'}</>;}
export function OptionCard({option:o}:{option:ApiOption}){return <article id={`${fragment(o.path)}-card`} className="apx-api-option-card" data-doc4-component="OptionCard"><h3><a href={`#${fragment(o.path)}`}><code>{o.path}</code></a></h3><dl><div><dt>Type</dt><dd><code>{o.type.text}</code></dd></div><div><dt>Required</dt><dd>{o.required?'Yes':'No'}</dd></div><div><dt>Default</dt><dd><DefaultValue option={o}/></dd></div>{o.allowedValues?.length?<div><dt>Allowed values</dt><dd><InlineEnumValueList values={o.allowedValues}/></dd></div>:null}<div><dt>Runtime</dt><dd>{o.runtimeTargets.join(', ')}</dd></div></dl><p>{o.description}</p></article>;}
export function OptionTable({options,ownerLabel}:{options:ApiOption[];ownerLabel:string}){
 const [query,setQuery]=useState('');const rows=useMemo(()=>flatten(options),[options]);
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return rows;return rows.filter(o=>[o.path,o.description,o.type.text,...(o.allowedValues||[]).map(String)].some(v=>v.toLowerCase().includes(q)));},[query,rows]);
 return <section data-doc4-component="OptionTable" aria-labelledby="api-options-heading">
  <div className="apx-api-option-search"><label htmlFor="api-option-search">Search {ownerLabel} options</label><input id="api-option-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="name, path, type, value…" /><span aria-live="polite">{filtered.length} option path{filtered.length===1?'':'s'}</span></div>
  <div className="apx-api-option-table-wrap" tabIndex={0} role="group" aria-label={`${ownerLabel} option table`}><table><thead><tr><th scope="col">Option</th><th scope="col">Type</th><th scope="col">Default</th><th scope="col">Required</th><th scope="col">Allowed values</th><th scope="col">Runtime</th><th scope="col">Description</th></tr></thead><tbody>{filtered.map(o=><tr key={o.id} id={fragment(o.path)} data-option-path={o.path}>
   <th scope="row"><a href={`#${fragment(o.path)}`} aria-label={`Permalink to ${o.path}`}><code>{o.path}</code></a>{o.stability==='DEPRECATED'?<span className="apx-badge" data-status="deprecated">Deprecated</span>:null}{o.animatable?<span className="apx-badge" data-kind="capability">Animatable</span>:null}</th><td><code>{o.type.text}</code></td><td><DefaultValue option={o}/></td><td>{o.required?'Yes':'No'}</td><td>{o.allowedValues?.length?<InlineEnumValueList values={o.allowedValues}/>:'—'}</td><td>{o.runtimeTargets.join(', ')}</td><td>{o.description}</td>
  </tr>)}</tbody></table></div>
  <div className="apx-api-option-cards">{filtered.map(o=><OptionCard key={o.id} option={o}/>)}</div>
 </section>;
}
