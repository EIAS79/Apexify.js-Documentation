import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { ApiManifest, ApiMember, ApiSymbol } from './schema';

let cached: ApiManifest | null = null;
export function getApiManifest(): ApiManifest {
  if (cached) return cached;
  const file = path.join(process.cwd(), 'generated', 'docs-doc4', 'api-manifest.json');
  if (!fs.existsSync(file)) throw new Error('DOC-4 API manifest missing. Run npm run docs:generate:doc4.');
  cached = JSON.parse(fs.readFileSync(file, 'utf8')) as ApiManifest;
  return cached;
}
export function apiSymbolByRoute(packageName: string, parts: string[]): { symbol: ApiSymbol; member?: ApiMember } | null {
  const manifest=getApiManifest();
  if(packageName!==manifest.package.name || parts.length===0) return null;
  const symbol=manifest.symbols.find(item=>item.symbol===parts[0]);
  if(!symbol) return null;
  if(parts.length===1) return {symbol};
  const member=symbol.members.find(item=>item.name===parts[1]);
  return member ? {symbol,member} : null;
}
export function allApiRouteParams() {
  const manifest=getApiManifest();
  return manifest.symbols.flatMap(symbol=>[
    {package:manifest.package.name,symbol:[symbol.symbol]},
    ...symbol.members.map(member=>({package:manifest.package.name,symbol:[symbol.symbol,member.name]})),
  ]);
}
