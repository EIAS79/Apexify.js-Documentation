import manifestJson from '@/generated/docs-doc5/example-manifest.json';
import type { ExampleManifest, GeneratedExampleRecord } from './schema';

export const exampleManifest = manifestJson as ExampleManifest;

export function getExampleById(id: string): GeneratedExampleRecord | undefined {
  return exampleManifest.examples.find((example) => example.id === id);
}

export function getVerifiedExamples(): GeneratedExampleRecord[] {
  return exampleManifest.examples.filter((example) => example.verificationStatus === 'verified');
}

export function getGalleryExamples(): GeneratedExampleRecord[] {
  return getVerifiedExamples().filter((example) => example.gallery.enabled);
}

export function getExamplesForApiId(apiId: string): GeneratedExampleRecord[] {
  return getVerifiedExamples().filter((example) => example.apiSymbols.includes(apiId));
}

export function apiHrefFromStableId(apiId: string): string {
  const [packageName, target] = apiId.split('::');
  if (!packageName || !target) return '/api-reference';
  const [owner, member] = target.split('#');
  return `/api-reference/${encodeURIComponent(packageName)}/${encodeURIComponent(owner)}${member ? `/${encodeURIComponent(member)}` : ''}`;
}
