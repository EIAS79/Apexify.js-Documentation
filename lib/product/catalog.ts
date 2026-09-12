import 'server-only';

import { getApiManifest } from '@/lib/api-reference/manifest';
import type { ApiMember } from '@/lib/api-reference/schema';
import { exampleManifest, getExampleById, getGalleryExamples } from '@/lib/examples/manifest';
import {
  CURRENT_CAPABILITIES,
  CURRENT_STATUS,
  FEATURE_TRACKS,
  HERO_EXAMPLE_ID,
  PUBLIC_CLAIMS,
  ROADMAP_CAPABILITIES,
  type ProductStatus,
} from './catalog-data';

function requiredApexPainterMember(name: string): ApiMember {
  const manifest = getApiManifest();
  const apexPainter = manifest.symbols.find((symbol) => symbol.symbol === 'ApexPainter');
  if (!apexPainter) throw new Error('[DOC-7] DOC-4 manifest is missing ApexPainter.');
  const member = apexPainter.members.find((candidate) => candidate.name === name);
  if (!member) throw new Error(`[DOC-7] DOC-4 manifest is missing ApexPainter#${name}.`);
  if (member.stability !== 'CURRENT') {
    throw new Error(`[DOC-7] ApexPainter#${name} is ${member.stability}; it cannot back a CURRENT homepage claim.`);
  }
  return member;
}

function requiredVerifiedExample(id: string) {
  const example = getExampleById(id);
  if (!example) throw new Error(`[DOC-7] DOC-5 example ${id} does not exist.`);
  if (example.verificationStatus !== 'verified') {
    throw new Error(`[DOC-7] DOC-5 example ${id} is not verified.`);
  }
  if (example.verifiedPackageVersion !== exampleManifest.package.version) {
    throw new Error(`[DOC-7] DOC-5 example ${id} was not verified against the active package version.`);
  }
  return example;
}

function apiHref(member: ApiMember): string {
  return member.href;
}

export type ResolvedCapability = {
  id: string;
  title: string;
  summary: string;
  status: ProductStatus;
  apiMember: string;
  apiHref: string;
  example?: { id: string; title: string; href: string };
  note?: string;
};

export type ResolvedFeatureTrack = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  api: Array<{ name: string; href: string }>;
  example?: { id: string; title: string; href: string };
};

export function getProductExperienceModel() {
  const apiManifest = getApiManifest();
  if (
    apiManifest.package.name !== exampleManifest.package.name ||
    apiManifest.package.version !== exampleManifest.package.version ||
    apiManifest.package.commit !== exampleManifest.package.commit
  ) {
    throw new Error('[DOC-7] DOC-4 and DOC-5 package identities disagree.');
  }

  const capabilities: ResolvedCapability[] = CURRENT_CAPABILITIES.map((definition) => {
    const member = requiredApexPainterMember(definition.apiMember);
    const example = definition.exampleId ? requiredVerifiedExample(definition.exampleId) : undefined;
    return {
      id: definition.id,
      title: definition.title,
      summary: definition.summary,
      status: CURRENT_STATUS,
      apiMember: definition.apiMember,
      apiHref: apiHref(member),
      example: example ? { id: example.id, title: example.title, href: example.canonicalRoute } : undefined,
      note: definition.note,
    };
  });

  const featureTracks: ResolvedFeatureTrack[] = FEATURE_TRACKS.map((definition) => ({
    id: definition.id,
    eyebrow: definition.eyebrow,
    title: definition.title,
    summary: definition.summary,
    api: definition.apiMembers.map((name) => {
      const member = requiredApexPainterMember(name);
      return { name, href: apiHref(member) };
    }),
    example: definition.exampleId
      ? (() => {
          const example = requiredVerifiedExample(definition.exampleId!);
          return { id: example.id, title: example.title, href: example.canonicalRoute };
        })()
      : undefined,
  }));

  const heroExample = requiredVerifiedExample(HERO_EXAMPLE_ID);
  const heroSource =
    heroExample.sources.find((source) => source.path === heroExample.entrypoint) ?? heroExample.sources[0];
  const heroOutput = heroExample.outputs.find((output) => output.path === heroExample.gallery.previewOutput);
  if (!heroSource || !heroOutput?.publicPath) {
    throw new Error(`[DOC-7] ${HERO_EXAMPLE_ID} lacks authoritative source/output for the homepage.`);
  }

  const galleryExamples = getGalleryExamples().map((example) => {
    const preview = example.outputs.find((output) => output.path === example.gallery.previewOutput);
    if (!preview?.publicPath) throw new Error(`[DOC-7] ${example.id} lacks a public Gallery preview.`);
    return {
      id: example.id,
      title: example.title,
      summary: example.summary,
      href: example.canonicalRoute,
      runtime: example.runtime,
      difficulty: example.difficulty,
      preview: preview.publicPath,
      previewKind: preview.kind,
      featured: Boolean(example.gallery.featured),
      verifiedPackageVersion: example.verifiedPackageVersion,
    };
  });

  return {
    package: {
      name: apiManifest.package.name,
      version: apiManifest.package.version,
      commit: apiManifest.package.commit,
      installCommand: `npm install github:EIAS79/Apexify.js#${apiManifest.package.commit}`,
    },
    capabilities,
    featureTracks,
    roadmap: ROADMAP_CAPABILITIES,
    claims: PUBLIC_CLAIMS,
    heroExample: {
      id: heroExample.id,
      title: heroExample.title,
      summary: heroExample.summary,
      href: heroExample.canonicalRoute,
      source: heroSource.content,
      output: heroOutput.publicPath,
      outputKind: heroOutput.kind,
      runtime: heroExample.runtime,
      difficulty: heroExample.difficulty,
      verifiedArtifactSha256: heroExample.verifiedArtifactSha256,
    },
    galleryExamples,
  };
}

export type ProductExperienceModel = ReturnType<typeof getProductExperienceModel>;
