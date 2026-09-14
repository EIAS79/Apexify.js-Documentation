import type { ApiManifest, ApiMember, ApiSymbol } from './schema';

export interface ResolvedApiRoute {
  manifest: ApiManifest;
  symbol: ApiSymbol;
  member?: ApiMember;
}

export function apiSymbolByRouteFromManifests(
  manifests: readonly ApiManifest[],
  packageName: string,
  parts: string[],
): ResolvedApiRoute | null {
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

export function buildApiHref(packageName: string, symbol: string, member?: string): string {
  const parts = ['/api-reference', encodeApiPackageRouteSegment(packageName), encodeURIComponent(symbol)];
  if (member) parts.push(encodeURIComponent(member));
  return parts.join('/');
}
