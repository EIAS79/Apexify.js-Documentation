import { DOC3_REGISTERED_COMPONENTS, type Doc3RegisteredComponentName } from './doc3-contract';
import { DOC5_MDX_COMPONENTS, type Doc5MdxComponentName } from '@/lib/examples/contract';

export type RichMdxComponentName = Doc3RegisteredComponentName | Doc5MdxComponentName;
export type RichMdxSegment =
  | { kind: 'markdown'; content: string }
  | { kind: 'component'; name: RichMdxComponentName; props: Record<string, unknown>; body?: string };

function parseJsonValue(source: string): unknown {
  const value = source.trim();
  if (!value) return '';
  try { return JSON.parse(value); }
  catch { throw new Error(`[doc3-mdx] component expression must be valid JSON: ${value.slice(0, 80)}`); }
}

export function parseRichMdxAttributes(source: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  let cursor = 0;
  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? '')) cursor += 1;
    if (cursor >= source.length) break;
    const nameMatch = source.slice(cursor).match(/^([A-Za-z][A-Za-z0-9_-]*)/);
    if (!nameMatch) throw new Error(`[doc3-mdx] invalid component attribute near: ${source.slice(cursor, cursor + 40)}`);
    const name = nameMatch[1]; cursor += name.length;
    while (/\s/.test(source[cursor] ?? '')) cursor += 1;
    if (source[cursor] !== '=') { props[name] = true; continue; }
    cursor += 1; while (/\s/.test(source[cursor] ?? '')) cursor += 1;
    const quote = source[cursor];
    if (quote === '"' || quote === "'") {
      cursor += 1; let value = '';
      while (cursor < source.length && source[cursor] !== quote) {
        if (source[cursor] === '\\' && source[cursor + 1] === quote) { value += quote; cursor += 2; }
        else { value += source[cursor]; cursor += 1; }
      }
      if (source[cursor] !== quote) throw new Error(`[doc3-mdx] unterminated quoted attribute ${name}`);
      cursor += 1; props[name] = value; continue;
    }
    if (quote === '{') {
      cursor += 1; const start = cursor; let depth = 1; let inString = false; let escaped = false;
      while (cursor < source.length && depth > 0) {
        const ch = source[cursor];
        if (inString) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false; }
        else if (ch === '"') inString = true;
        else if (ch === '{' || ch === '[') depth += 1;
        else if (ch === '}' || ch === ']') depth -= 1;
        cursor += 1;
      }
      if (depth !== 0) throw new Error(`[doc3-mdx] unterminated JSON expression for ${name}`);
      props[name] = parseJsonValue(source.slice(start, cursor - 1)); continue;
    }
    const bare = source.slice(cursor).match(/^([^\s]+)/)?.[1];
    if (!bare) throw new Error(`[doc3-mdx] missing value for ${name}`);
    cursor += bare.length; props[name] = parseJsonValue(bare);
  }
  return props;
}

export function parseRichMdxSegments(content: string): RichMdxSegment[] {
  const names = [...DOC3_REGISTERED_COMPONENTS, ...DOC5_MDX_COMPONENTS].join('|');
  const paired = new RegExp(`<(${names})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'g');
  const selfClosing = new RegExp(`<(${names})\\b([^>]*)\\/>`, 'g');
  const markers: Array<{ index: number; end: number; name: RichMdxComponentName; attrs: string; body?: string }> = [];
  for (const regex of [paired, selfClosing]) {
    regex.lastIndex = 0; let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) markers.push({ index: match.index, end: match.index + match[0].length, name: match[1] as RichMdxComponentName, attrs: match[2] ?? '', body: regex === paired ? match[3] : undefined });
  }
  markers.sort((a,b)=>a.index-b.index||b.end-a.end);
  const filtered: typeof markers=[]; let coveredUntil=-1;
  for(const marker of markers){if(marker.index<coveredUntil)continue;filtered.push(marker);coveredUntil=marker.end;}
  if(!filtered.length)return[{kind:'markdown',content}];
  const segments:RichMdxSegment[]=[];let cursor=0;
  for(const marker of filtered){if(marker.index>cursor)segments.push({kind:'markdown',content:content.slice(cursor,marker.index)});segments.push({kind:'component',name:marker.name,props:parseRichMdxAttributes(marker.attrs),body:marker.body?.trim()});cursor=marker.end;}
  if(cursor<content.length)segments.push({kind:'markdown',content:content.slice(cursor)});
  return segments;
}
