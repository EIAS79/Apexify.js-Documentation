"use client";
import type { ApiTypeNode } from '@/lib/api-reference/schema';
function nodeLabel(node:ApiTypeNode){return node.name?`${node.name}: ${node.text}`:node.text;}
export function TypeExplorer({type,label}:{type:ApiTypeNode;label:string}){
 const render=(node:ApiTypeNode,depth=0):React.ReactNode=>{const kids=[...(node.properties||[]).map(p=>({label:`${p.name}${p.optional?'?':''}`,node:p.type})),...(node.elements||[]).map((n,i)=>({label:`variant ${i+1}`,node:n}))];if(!kids.length)return <code>{node.text}</code>;return <details open={depth<1}><summary><code>{nodeLabel(node)}</code></summary><ul>{kids.map((k,i)=><li key={`${k.label}-${i}`}><strong>{k.label}</strong>{render(k.node,depth+1)}</li>)}</ul></details>;};
 return <section className="apx-api-type-explorer" data-doc4-component="TypeExplorer" aria-label={`${label} type explorer`}>{render(type)}</section>;
}
