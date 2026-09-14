import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { ApiManifest, ApiMember, ApiSymbol } from './schema';
import { allApiRouteParamsFromManifests, apiSymbolByRouteFromManifests } from './routing';

let cached: ApiManifest | null = null;
export function getApiManifest(): ApiManifest {
  if (cached) return cached;
  const file = path.join(process.cwd(), 'generated', 'docs-doc4', 'api-manifest.json');
  if (!fs.existsSync(file)) throw new Error('DOC-4 API manifest missing. Run npm run docs:generate:doc4.');
  cached = JSON.parse(fs.readFileSync(file, 'utf8')) as ApiManifest;
  return cached;
}

/** Current production supplies one manifest; future package adapters can supply more without another router. */
export function getApiManifests(): ApiManifest[] {
  return [getApiManifest()];
}

export function apiSymbolByRoute(packageName: string, parts: string[]): { symbol: ApiSymbol; member?: ApiMember } | null {
  const found = apiSymbolByRouteFromManifests(getApiManifests(), packageName, parts);
  return found ? { symbol: found.symbol, member: found.member } : null;
}

export function allApiRouteParams() {
  return allApiRouteParamsFromManifests(getApiManifests());
}
