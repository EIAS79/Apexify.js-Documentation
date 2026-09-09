export const DOCUMENTATION_PAGE_KINDS = [
  'landing',
  'concept',
  'tutorial',
  'guide',
  'recipe',
  'reference',
  'configuration',
  'architecture',
  'migration',
  'capability',
  'troubleshooting',
  'example',
] as const;

export type DocumentationPageKind = (typeof DOCUMENTATION_PAGE_KINDS)[number];

export const DOCUMENTATION_STABILITIES = [
  'CURRENT',
  'PREVIEW',
  'EXPERIMENTAL',
  'ROADMAP',
  'DEPRECATED',
  'REMOVED',
] as const;

export type DocumentationStability = (typeof DOCUMENTATION_STABILITIES)[number];

export const DOCUMENTATION_RUNTIMES = [
  'node',
  'web',
  'worker',
  'react',
  'next-server',
  'next-client',
  'distributed',
] as const;

export type DocumentationRuntime = (typeof DOCUMENTATION_RUNTIMES)[number];

export const DOCUMENTATION_PACKAGES = [
  'apexify.js',
  '@apexify/core',
  '@apexify/node',
  '@apexify/web',
  '@apexify/react',
  '@apexify/next',
  '@apexify/plugin-sdk',
  '@apexify/assistant',
  '@apexify/devtools',
  '@apexify/server',
  '@apexify/native',
] as const;

export type DocumentationPackage = (typeof DOCUMENTATION_PACKAGES)[number];

export interface DocumentationFrontmatter {
  title: string;
  description: string;
  slug: string;
  kind: DocumentationPageKind;
  category: string;
  order: number;
  package: DocumentationPackage;
  runtime: DocumentationRuntime[];
  frameworks?: string[];
  stability: DocumentationStability;
  since?: string;
  deprecatedSince?: string;
  removedIn?: string;
  replacedBy?: string;
  feature?: string;
  apiSymbols?: string[];
  keywords?: string[];
  prerequisites?: string[];
  related?: string[];
  examples?: string[];
  toc?: boolean;
  search?: boolean;
  canonical: string;
  aliases?: string[];
  legacyHashes?: string[];
}

export interface DocumentationHeading {
  id: string;
  text: string;
  level: number;
}

type NormalizedDocumentationFields =
  | 'frameworks'
  | 'apiSymbols'
  | 'keywords'
  | 'prerequisites'
  | 'related'
  | 'examples'
  | 'toc'
  | 'search'
  | 'aliases'
  | 'legacyHashes';

/**
 * Server/build consumers use this normalized record, not raw frontmatter.
 * Optional authoring fields that have deterministic defaults are required
 * here so routing/navigation/search cannot accidentally branch on undefined.
 */
export interface DocumentationPage
  extends Omit<DocumentationFrontmatter, NormalizedDocumentationFields> {
  frameworks: string[];
  apiSymbols: string[];
  keywords: string[];
  prerequisites: string[];
  related: string[];
  examples: string[];
  toc: boolean;
  search: boolean;
  aliases: string[];
  legacyHashes: string[];
  id: string;
  sourcePath: string;
  canonicalPath: string;
  body: string;
  headings: DocumentationHeading[];
}

const PAGE_KIND_SET = new Set<string>(DOCUMENTATION_PAGE_KINDS);
const STABILITY_SET = new Set<string>(DOCUMENTATION_STABILITIES);
const RUNTIME_SET = new Set<string>(DOCUMENTATION_RUNTIMES);
const PACKAGE_SET = new Set<string>(DOCUMENTATION_PACKAGES);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;
const CANONICAL_PATTERN = /^\/docs\/[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;
const LEGACY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function fail(sourcePath: string, field: string, message: string): never {
  throw new Error(`[docs-schema] ${sourcePath}: ${field} ${message}`);
}

function requireString(
  value: unknown,
  sourcePath: string,
  field: string,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): string {
  if (typeof value !== 'string') fail(sourcePath, field, 'must be a string');
  const normalized = value.trim();
  if (!allowEmpty && normalized.length === 0) fail(sourcePath, field, 'must not be empty');
  return normalized;
}

function optionalString(value: unknown, sourcePath: string, field: string): string | undefined {
  if (value === undefined) return undefined;
  return requireString(value, sourcePath, field);
}

function stringArray(
  value: unknown,
  sourcePath: string,
  field: string,
  { allowEmpty = true }: { allowEmpty?: boolean } = {},
): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) fail(sourcePath, field, 'must be an array of strings');
  const out = value.map((entry, index) => requireString(entry, sourcePath, `${field}[${index}]`));
  if (!allowEmpty && out.length === 0) fail(sourcePath, field, 'must contain at least one value');
  if (new Set(out).size !== out.length) fail(sourcePath, field, 'must not contain duplicates');
  return out;
}

function optionalBoolean(value: unknown, sourcePath: string, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') fail(sourcePath, field, 'must be a boolean');
  return value;
}

export function validateDocumentationFrontmatter(
  raw: Record<string, unknown>,
  sourcePath: string,
): DocumentationFrontmatter {
  const title = requireString(raw.title, sourcePath, 'title');
  const description = requireString(raw.description, sourcePath, 'description');
  const slug = requireString(raw.slug, sourcePath, 'slug');
  if (!SLUG_PATTERN.test(slug)) {
    fail(sourcePath, 'slug', 'must be a lowercase route slug such as "node/canvas"');
  }

  const kind = requireString(raw.kind, sourcePath, 'kind');
  if (!PAGE_KIND_SET.has(kind)) fail(sourcePath, 'kind', `must be one of ${DOCUMENTATION_PAGE_KINDS.join(', ')}`);

  const category = requireString(raw.category, sourcePath, 'category');

  if (typeof raw.order !== 'number' || !Number.isInteger(raw.order) || raw.order < 0) {
    fail(sourcePath, 'order', 'must be a non-negative integer');
  }

  const packageName = requireString(raw.package, sourcePath, 'package');
  if (!PACKAGE_SET.has(packageName)) {
    fail(sourcePath, 'package', `must be one of ${DOCUMENTATION_PACKAGES.join(', ')}`);
  }

  const runtime = stringArray(raw.runtime, sourcePath, 'runtime', { allowEmpty: false })!;
  for (const target of runtime) {
    if (!RUNTIME_SET.has(target)) {
      fail(sourcePath, 'runtime', `contains unsupported runtime "${target}"`);
    }
  }

  const stability = requireString(raw.stability, sourcePath, 'stability');
  if (!STABILITY_SET.has(stability)) {
    fail(sourcePath, 'stability', `must be one of ${DOCUMENTATION_STABILITIES.join(', ')}`);
  }

  const canonical = requireString(raw.canonical, sourcePath, 'canonical');
  if (!CANONICAL_PATTERN.test(canonical)) {
    fail(sourcePath, 'canonical', 'must be an absolute /docs/... path using lowercase route segments');
  }
  if (canonical !== `/docs/${slug}`) {
    fail(sourcePath, 'canonical', `must equal "/docs/${slug}"`);
  }

  const aliases = stringArray(raw.aliases, sourcePath, 'aliases') ?? [];
  const legacyHashes = stringArray(raw.legacyHashes, sourcePath, 'legacyHashes') ?? [];
  for (const [field, values] of [['aliases', aliases], ['legacyHashes', legacyHashes]] as const) {
    for (const value of values) {
      if (!LEGACY_ID_PATTERN.test(value)) {
        fail(sourcePath, field, `contains invalid legacy identity "${value}"`);
      }
    }
  }

  return {
    title,
    description,
    slug,
    kind: kind as DocumentationPageKind,
    category,
    order: raw.order,
    package: packageName as DocumentationPackage,
    runtime: runtime as DocumentationRuntime[],
    frameworks: stringArray(raw.frameworks, sourcePath, 'frameworks') ?? [],
    stability: stability as DocumentationStability,
    since: optionalString(raw.since, sourcePath, 'since'),
    deprecatedSince: optionalString(raw.deprecatedSince, sourcePath, 'deprecatedSince'),
    removedIn: optionalString(raw.removedIn, sourcePath, 'removedIn'),
    replacedBy: optionalString(raw.replacedBy, sourcePath, 'replacedBy'),
    feature: optionalString(raw.feature, sourcePath, 'feature'),
    apiSymbols: stringArray(raw.apiSymbols, sourcePath, 'apiSymbols') ?? [],
    keywords: stringArray(raw.keywords, sourcePath, 'keywords') ?? [],
    prerequisites: stringArray(raw.prerequisites, sourcePath, 'prerequisites') ?? [],
    related: stringArray(raw.related, sourcePath, 'related') ?? [],
    examples: stringArray(raw.examples, sourcePath, 'examples') ?? [],
    toc: optionalBoolean(raw.toc, sourcePath, 'toc') ?? true,
    search: optionalBoolean(raw.search, sourcePath, 'search') ?? true,
    canonical,
    aliases,
    legacyHashes,
  };
}

export function validateDocumentationPageSet(pages: DocumentationPage[]): void {
  const bySlug = new Map<string, DocumentationPage>();
  const byCanonical = new Map<string, DocumentationPage>();
  const byLegacyIdentity = new Map<string, DocumentationPage>();

  for (const page of pages) {
    const priorSlug = bySlug.get(page.slug);
    if (priorSlug) {
      throw new Error(
        `[docs-schema] duplicate slug "${page.slug}" in ${priorSlug.sourcePath} and ${page.sourcePath}`,
      );
    }
    bySlug.set(page.slug, page);

    const priorCanonical = byCanonical.get(page.canonicalPath);
    if (priorCanonical) {
      throw new Error(
        `[docs-schema] duplicate canonical "${page.canonicalPath}" in ${priorCanonical.sourcePath} and ${page.sourcePath}`,
      );
    }
    byCanonical.set(page.canonicalPath, page);

    const identities = [page.id, ...page.aliases, ...page.legacyHashes];
    for (const identity of identities) {
      const prior = byLegacyIdentity.get(identity);
      if (prior && prior.sourcePath !== page.sourcePath) {
        throw new Error(
          `[docs-schema] duplicate legacy identity "${identity}" in ${prior.sourcePath} and ${page.sourcePath}`,
        );
      }
      byLegacyIdentity.set(identity, page);
    }
  }

  const slugs = new Set(pages.map((page) => page.slug));
  for (const page of pages) {
    for (const related of page.related) {
      if (!slugs.has(related)) {
        throw new Error(
          `[docs-schema] ${page.sourcePath}: related references unknown routed document "${related}"`,
        );
      }
    }
  }
}
