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
  return exampleManifest.examples.filter((example) => example.gallery.enabled);
}
