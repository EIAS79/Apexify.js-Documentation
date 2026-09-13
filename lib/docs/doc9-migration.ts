import path from 'node:path';
import type { DocumentationFrontmatter, DocumentationPageKind } from './schema';

export type Doc9Classification = 'keep' | 'rewrite' | 'split' | 'merge' | 'move' | 'archive' | 'delete';
export type Doc9MigrationStatus = 'pending' | 'migrated' | 'verified';

export interface Doc9ExistingPageIdentity {
  canonicalPath: string;
  title: string;
  category: string;
  feature?: string;
}

export interface Doc9MigrationRecord {
  legacyId: string;
  legacyPath: string;
  legacyHash: string;
  title: string;
  category: string;
  classification: Doc9Classification;
  targetRoutes: string[];
  featureIds: string[];
  redirectRequired: boolean;
  contentPreserved: boolean;
  rationale: string;
  status: Doc9MigrationStatus;
  search: boolean;
}

const ROOT_PREFIX = 'content/docs/';

function normalize(value: string): string {
  return value.split(path.sep).join('/');
}

function withoutNumericPrefix(value: string): string {
  return value.replace(/^\d+-/, '');
}

function slugPart(value: string): string {
  return withoutNumericPrefix(value)
    .replace(/\.mdx$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function relativeParts(sourcePath: string): string[] {
  const normalized = normalize(sourcePath);
  if (!normalized.startsWith(ROOT_PREFIX)) {
    throw new Error(`[doc9-migration] source is outside documentation root: ${sourcePath}`);
  }
  return normalized.slice(ROOT_PREFIX.length).split('/');
}

export function doc9LegacyId(sourcePath: string): string {
  const parts = relativeParts(sourcePath);
  return parts.at(-1)!.replace(/\.mdx$/i, '');
}

function firstHeading(source: string): string | null {
  const match = source.match(/^#\s+(.+)$/m);
  return match?.[1]?.replace(/[`*_]/g, '').replace(/\s*\{#[^}]+\}\s*$/, '').trim() || null;
}

function titleFromId(id: string): string {
  return withoutNumericPrefix(id)
    .replace(/^api-/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function doc9FeatureFromSource(sourcePath: string): string | null {
  const parts = relativeParts(sourcePath);
  const id = doc9LegacyId(sourcePath);
  const joined = `${parts.join('/')} ${id}`.toLowerCase();
  if (/canvas/.test(joined)) return 'canvas';
  if (/chart/.test(joined)) return 'charts';
  if (/gif|animate/.test(joined)) return 'gif';
  if (/text-rendering|create-text|measure-text/.test(joined)) return 'text';
  if (/images-shapes|create-image|image-/.test(joined)) return 'images';
  if (/lines-connectors|path2d|custom-line|hit-testing|hit-detection/.test(joined)) return 'paths';
  if (/video/.test(joined)) return 'video';
  if (/audio/.test(joined)) return 'audio';
  if (/scene/.test(joined)) return 'scenes';
  if (/template/.test(joined)) return 'templates';
  if (/asset/.test(joined)) return 'assets';
  if (/plugin/.test(joined)) return 'plugins';
  if (/component/.test(joined)) return 'components';
  if (/batch|save|output|raster/.test(joined)) return 'output';
  return null;
}

function featureIdsForSource(sourcePath: string, primary: string | null): string[] {
  const normalized = normalize(sourcePath).toLowerCase();
  const ids = primary ? [primary] : [];

  // DOC-5 uses `batch` as a workflow feature identity for multi-output work.
  // The existing batch/raster guide corpus is its canonical conceptual surface.
  if (/\/batch-save-output\/|\/raster-batch-output\//.test(normalized)) ids.push('batch');

  // DOC-5 uses `media` for the GIF/media pipeline example. Current GIF, video,
  // audio, image and raster guides are the shipped Node media documentation.
  if (/\/gif-animation\/|\/video-ffmpeg\/|\/images-shapes\/|\/raster-batch-output\/|\/advanced\/audio\/|\/advanced\/video\//.test(normalized)) {
    ids.push('media');
  }

  return [...new Set(ids)].sort();
}

function categoryFor(parts: string[]): string {
  const root = parts[0];
  if (root === '00-start-here' || root === '01-beginner-guide') return 'Start';
  if (root === '02-recipes') return 'Recipes';
  if (root === '03-feature-guides') return `Node / ${titleFromId(parts[1] ?? 'Guides')}`;
  if (root === '04-advanced') return `Advanced / ${titleFromId(parts[1] ?? 'Overview')}`;
  if (root === '05-internals') return 'Architecture / Migration';
  if (root === 'README.mdx') return 'Overview';
  return 'Node';
}

function kindFor(parts: string[], id: string): DocumentationPageKind {
  const root = parts[0];
  if (root === 'README.mdx') return 'landing';
  if (root === '01-beginner-guide') return id.includes('common-mistakes') ? 'troubleshooting' : 'tutorial';
  if (root === '02-recipes') return id.startsWith('recipe-') ? 'recipe' : 'guide';
  if (root === '03-feature-guides') {
    if (/options|properties-matrix|reference/.test(id)) return 'reference';
    if (/security|reliability/.test(id)) return 'troubleshooting';
    return 'guide';
  }
  if (root === '04-advanced') {
    if (/migration/.test(id)) return 'migration';
    if (/security|performance|resource-governance/.test(id)) return 'architecture';
    return 'guide';
  }
  if (root === '05-internals') return id === 'changelog' ? 'migration' : 'architecture';
  return 'guide';
}

function canonicalSlug(parts: string[]): string {
  if (parts.length === 1 && parts[0] === 'README.mdx') return 'overview';
  const root = parts[0];
  const rest = parts.slice(1).map(slugPart).filter(Boolean);
  if (root === '00-start-here') return ['start', ...rest].join('/');
  if (root === '01-beginner-guide') return ['start', ...rest].join('/');
  if (root === '02-recipes') return ['recipes', ...rest].join('/');
  if (root === '03-feature-guides') return ['node', ...rest].join('/');
  if (root === '04-advanced') return ['advanced', ...rest].join('/');
  if (root === '05-internals') {
    if (parts.at(-1) === 'changelog.mdx') return 'migration/changelog';
    return ['architecture', ...rest].join('/');
  }
  return ['node', ...parts.map(slugPart)].join('/');
}

export function doc9Disposition(
  sourcePath: string,
  hasFrontmatter: boolean,
  source = '',
  existingPage?: Doc9ExistingPageIdentity,
): Doc9MigrationRecord {
  const parts = relativeParts(sourcePath);
  const id = doc9LegacyId(sourcePath);
  const inferredTitle = firstHeading(source) ?? titleFromId(id);
  const inferredFeature = doc9FeatureFromSource(sourcePath);
  const inferredFeatureIds = featureIdsForSource(sourcePath, inferredFeature);

  if (parts[0] === '04-api-reference') {
    return {
      legacyId: id,
      legacyPath: normalize(sourcePath),
      legacyHash: `/docs#${id}`,
      title: inferredTitle,
      category: 'API Reference',
      classification: 'merge',
      targetRoutes: ['/api-reference'],
      featureIds: inferredFeatureIds,
      redirectRequired: true,
      contentPreserved: true,
      rationale: 'Handwritten API prose is superseded by the DOC-4 generated reference. Preserve the source for migration audit while canonical API truth remains generated.',
      status: 'verified',
      search: false,
    };
  }

  if (sourcePath.endsWith('/05-internals/01-5.4.5-remote-image-hotfix.mdx')) {
    return {
      legacyId: id,
      legacyPath: normalize(sourcePath),
      legacyHash: `/docs#${id}`,
      title: inferredTitle,
      category: 'Archive',
      classification: 'archive',
      targetRoutes: ['/docs/migration/changelog'],
      featureIds: ['images', 'media'],
      redirectRequired: true,
      contentPreserved: true,
      rationale: 'Version 5.4.5 hotfix detail is historical release-era material and must not masquerade as current package behavior.',
      status: 'verified',
      search: false,
    };
  }

  if (hasFrontmatter && existingPage) {
    const authoredFeatureIds = featureIdsForSource(sourcePath, existingPage.feature ?? inferredFeature);
    return {
      legacyId: id,
      legacyPath: normalize(sourcePath),
      legacyHash: `/docs#${id}`,
      title: existingPage.title,
      category: existingPage.category,
      classification: 'keep',
      targetRoutes: [existingPage.canonicalPath],
      featureIds: authoredFeatureIds,
      redirectRequired: true,
      contentPreserved: true,
      rationale: 'Already uses the DOC-1 validated metadata contract; retain its authored canonical route and migrate links/discovery around it.',
      status: 'verified',
      search: true,
    };
  }

  const slug = canonicalSlug(parts);
  return {
    legacyId: id,
    legacyPath: normalize(sourcePath),
    legacyHash: `/docs#${id}`,
    title: inferredTitle,
    category: categoryFor(parts),
    classification: hasFrontmatter ? 'keep' : 'move',
    targetRoutes: [`/docs/${slug}`],
    featureIds: inferredFeatureIds,
    redirectRequired: true,
    contentPreserved: true,
    rationale: hasFrontmatter
      ? 'Uses validated metadata; preserve the page while retaining its canonical documentation role.'
      : 'Preserve current technical prose while promoting it from legacy hash-only delivery into the canonical DOC-1 route/content architecture.',
    status: 'verified',
    search: true,
  };
}

export function synthesizeDoc9Frontmatter(sourcePath: string, source: string): DocumentationFrontmatter | null {
  const record = doc9Disposition(sourcePath, false, source);
  if (record.classification === 'merge' || record.classification === 'archive' || record.classification === 'delete') return null;
  const parts = relativeParts(sourcePath);
  const id = record.legacyId;
  const canonical = record.targetRoutes[0];
  const slug = canonical.replace(/^\/docs\//, '');
  const feature = doc9FeatureFromSource(sourcePath) ?? record.featureIds[0];
  return {
    title: record.title,
    description: `Current Apexify.js 6.0.0 documentation for ${record.title}.`,
    slug,
    kind: kindFor(parts, id),
    category: record.category,
    order: Number.parseInt(parts.at(-1)?.match(/^(\d+)-/)?.[1] ?? '500', 10) + (parts[0] === '01-beginner-guide' ? 100 : parts[0] === '02-recipes' ? 200 : parts[0] === '03-feature-guides' ? 300 : parts[0] === '04-advanced' ? 400 : 500),
    package: 'apexify.js',
    runtime: ['node'],
    frameworks: [],
    stability: 'CURRENT',
    since: '6.0.0',
    feature,
    apiSymbols: [],
    keywords: [...new Set([feature, ...record.featureIds, ...slug.split('/')].filter((value): value is string => Boolean(value)))],
    prerequisites: [],
    related: [],
    examples: [],
    toc: true,
    search: true,
    canonical,
    aliases: [],
    legacyHashes: [id],
  };
}
