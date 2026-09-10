import type { ReactNode } from 'react';
export function EnumValueList({values,className}:{values:Array<string|number|boolean|null>;className?:string}){
  return <ul className={className??'apx-api-enum-list'} data-doc4-component="EnumValueList" aria-label="Allowed values">{values.map((v,i)=><li key={`${String(v)}-${i}`}><code>{JSON.stringify(v)}</code></li>)}</ul>;
}
export function InlineEnumValueList({values}:{values:Array<string|number|boolean|null>}):ReactNode{
  return <span className="apx-api-enum-inline" data-doc4-component="EnumValueList">{values.map((v,i)=><code key={`${String(v)}-${i}`}>{JSON.stringify(v)}{i<values.length-1?' ':''}</code>)}</span>;
}
