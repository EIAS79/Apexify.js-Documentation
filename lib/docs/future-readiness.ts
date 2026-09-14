import type { ApiManifest } from '@/lib/api-reference/schema';
import type { DocumentationPackage, DocumentationRuntime } from './schema';

export type FutureReadinessState = 'PASS' | 'PASS WITH ADAPTER' | 'GAP' | 'NOT APPLICABLE';
export type FutureFixtureStatus = 'FIXTURE' | 'ROADMAP' | 'PREVIEW' | 'EXPERIMENTAL' | 'TEST-ONLY';

export interface TopicRouteRecord {
  topic: string;
  runtime: DocumentationRuntime;
  package: DocumentationPackage;
  href: string;
  status: FutureFixtureStatus;
  fixture: true;
  publish: false;
}

export interface SwitchDestination {
  available: boolean;
  href: string | null;
  reason: 'equivalent' | 'not-available';
}

export interface FutureCapabilityRecord {
  id: string;
  name: string;
  status: FutureFixtureStatus;
  runtime: DocumentationRuntime[];
  packages: DocumentationPackage[];
  required: boolean;
  optional: boolean;
  fallback: string;
  detection: string;
  relatedApis: string[];
  relatedDocs: string[];
  fixture: true;
  publish: false;
}

export interface FutureDiagnosticRecord {
  code: string;
  class: string;
  meaning: string;
  trigger: string;
  evidenceFields: string[];
  recommendedFix: string;
  runtime: DocumentationRuntime[];
  relatedApi: string[];
  status: FutureFixtureStatus;
  fixture: true;
  publish: false;
}

export interface FutureAdapterDescriptor {
  name: string;
  inputContract: string[];
  outputContract: string[];
  consumer: string;
  futureOwner: string;
  architectureReason: string;
  fixtureOnly: true;
}

export interface AvailabilityCell {
  state: 'supported' | 'unsupported' | 'partial' | 'capability-gated' | 'roadmap' | 'unknown';
  label: string;
  capability?: string;
}

export interface AvailabilityRow {
  feature: string;
  values: Record<string, AvailabilityCell>;
}

export function resolveRuntimeEquivalent(
  routes: readonly TopicRouteRecord[],
  topic: string,
  runtime: DocumentationRuntime,
): SwitchDestination {
  const found = routes.find((record) => record.topic === topic && record.runtime === runtime);
  return found
    ? { available: true, href: found.href, reason: 'equivalent' }
    : { available: false, href: null, reason: 'not-available' };
}

export function resolvePackageEquivalent(
  routes: readonly TopicRouteRecord[],
  topic: string,
  packageName: DocumentationPackage,
): SwitchDestination {
  const found = routes.find((record) => record.topic === topic && record.package === packageName);
  return found
    ? { available: true, href: found.href, reason: 'equivalent' }
    : { available: false, href: null, reason: 'not-available' };
}

/** Scoped package names stay one route parameter via percent encoding. */
export function encodePackageRouteSegment(packageName: string): string {
  return encodeURIComponent(packageName);
}

export function decodePackageRouteSegment(segment: string): string {
  return decodeURIComponent(segment);
}

export function buildFixtureApiHref(packageName: string, symbol: string, member?: string): string {
  const parts = ['/api-reference', encodePackageRouteSegment(packageName), encodeURIComponent(symbol)];
  if (member) parts.push(encodeURIComponent(member));
  return parts.join('/');
}

export function resolveFixtureApiRoute(
  manifests: readonly ApiManifest[],
  packageName: string,
  symbol: string,
  member?: string,
): { packageName: string; symbol: string; member: string | null } | null {
  const manifest = manifests.find((candidate) => candidate.package.name === packageName);
  if (!manifest) return null;
  const symbolRecord = manifest.symbols.find((candidate) => candidate.symbol === symbol);
  if (!symbolRecord) return null;
  if (!member) return { packageName, symbol, member: null };
  return symbolRecord.members.some((candidate) => candidate.name === member)
    ? { packageName, symbol, member }
    : null;
}

export function groupFixtureNavigation(routes: readonly TopicRouteRecord[]) {
  const groups = new Map<string, TopicRouteRecord[]>();
  for (const route of routes) {
    const key = `${route.runtime}:${route.package}`;
    const entries = groups.get(key) ?? [];
    entries.push(route);
    groups.set(key, entries);
  }
  return [...groups.entries()]
    .map(([id, entries]) => ({ id, entries: [...entries].sort((a, b) => a.href.localeCompare(b.href)) }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
