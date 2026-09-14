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

/** Current production supplies one manifest; future package adapters can supply more without another router. */
export function getApiManifests(): ApiManifest[] {
  return [getApiManifest()];
}

export function apiSymbolByRouteFromManifests(
  manifests: readonly ApiManifest[],
  packageName: string,
  parts: string[],
): { manifest: ApiManifest; symbol: ApiSymbol; member?: ApiMember } | null {
  const manifest = manifests.find((candidate) => candidate.package.name === packageName);
  if (!manifest || parts.length === 0) return null;
  const symbol = manifest.symbols.find((item) => item.symbol === parts[0]);
  if (!symbol) return null;
  if (parts.length === 1) return { manifest, symbol };
  if (parts.length !== 2) return null;
  const member = symbol.members.find((item) => item.name === parts[1]);
  return member ? { manifest, symbol, member } : null;
}

export function allApiRouteParamsFromManifests(manifests: readonly ApiManifest[]) {
  return manifests.flatMap((manifest) => manifest.symbols.flatMap((symbol) => [
    { package: manifest.package.name, symbol: [symbol.symbol] },
    ...symbol.members.map((member) => ({ package: manifest.package.name, symbol: [symbol.symbol, member.name] })),
  ]));
}

export function encodeApiPackageRouteSegment(packageName: string): string {
  return encodeURIComponent(packageName);
}

export function decodeApiPackageRouteSegment(segment: string): string {
  return decodeURIComponent(segment);
}

export function apiSymbolByRoute(packageName: string, parts: string[]): { symbol: ApiSymbol; member?: ApiMember } | null {
  const found = apiSymbolByRouteFromManifests(getApiManifests(), packageName, parts);
  return found ? { symbol: found.symbol, member: found.member } : null;
}

export function allApiRouteParams() {
  return allApiRouteParamsFromManifests(getApiManifests());
}
