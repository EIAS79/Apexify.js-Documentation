import fs from 'node:fs';
import path from 'node:path';
import { extractHeadingsFromMdxRaw } from '../docs-heading-utils';
import { parseDocumentationSource, stripDocumentationFrontmatter } from './frontmatter';
import {
  type DocumentationPage,
  validateDocumentationFrontmatter,
  validateDocumentationPageSet,
} from './schema';

const DOCS_ROOT = path.join(process.cwd(), 'content', 'docs');

export interface DocumentationSourceFile {
  sourcePath: string;
  absolutePath: string;
  filename: string;
  hasFrontmatter: boolean;
}

let pageCache: DocumentationPage[] | null = null;
let sourceCache: DocumentationSourceFile[] | null = null;

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function walkMdx(dir: string, out: string[]): void {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMdx(fullPath, out);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      out.push(fullPath);
    }
  }
}

export function discoverDocumentationSources(): DocumentationSourceFile[] {
  if (sourceCache) return sourceCache;
  if (!fs.existsSync(DOCS_ROOT)) {
    throw new Error(`[docs-content] documentation root does not exist: ${DOCS_ROOT}`);
  }

  const files: string[] = [];
  walkMdx(DOCS_ROOT, files);
  sourceCache = files.map((absolutePath) => {
    const sourcePath = toPosix(path.relative(process.cwd(), absolutePath));
    const source = fs.readFileSync(absolutePath, 'utf8');
    const parsed = parseDocumentationSource(source, sourcePath);
    return {
      sourcePath,
      absolutePath,
      filename: path.basename(absolutePath, '.mdx'),
      hasFrontmatter: parsed.data !== null,
    };
  });
  return sourceCache;
}

export function loadDocumentationPages(): DocumentationPage[] {
  if (pageCache) return pageCache;

  const pages: DocumentationPage[] = [];
  for (const sourceFile of discoverDocumentationSources()) {
    if (!sourceFile.hasFrontmatter) continue;
    const source = fs.readFileSync(sourceFile.absolutePath, 'utf8');
    const parsed = parseDocumentationSource(source, sourceFile.sourcePath);
    if (!parsed.data) continue;

    const metadata = validateDocumentationFrontmatter(parsed.data, sourceFile.sourcePath);
    const frameworks = metadata.frameworks ?? [];
    const apiSymbols = metadata.apiSymbols ?? [];
    const keywords = metadata.keywords ?? [];
    const prerequisites = metadata.prerequisites ?? [];
    const related = metadata.related ?? [];
    const examples = metadata.examples ?? [];
    const aliases = metadata.aliases ?? [];
    const legacyHashes = metadata.legacyHashes ?? [];
    const toc = metadata.toc ?? true;
    const search = metadata.search ?? true;
    const id = legacyHashes[0] ?? metadata.slug;

    pages.push({
      ...metadata,
      frameworks,
      apiSymbols,
      keywords,
      prerequisites,
      related,
      examples,
      toc,
      search,
      aliases,
      legacyHashes,
      id,
      sourcePath: sourceFile.sourcePath,
      canonicalPath: metadata.canonical,
      body: parsed.body,
      headings: extractHeadingsFromMdxRaw(parsed.body),
    });
  }

  pages.sort(
    (a, b) =>
      a.order - b.order ||
      a.canonicalPath.localeCompare(b.canonicalPath, undefined, { numeric: true }),
  );
  validateDocumentationPageSet(pages);
  pageCache = pages;
  return pageCache;
}

export function getDocumentationPageBySlug(slug: string | string[]): DocumentationPage | null {
  const normalized = Array.isArray(slug) ? slug.join('/') : slug;
  return loadDocumentationPages().find((page) => page.slug === normalized) ?? null;
}

export function getDocumentationPageByCanonicalPath(canonicalPath: string): DocumentationPage | null {
  return loadDocumentationPages().find((page) => page.canonicalPath === canonicalPath) ?? null;
}

export function getDocumentationPageByLegacyIdentity(identity: string): DocumentationPage | null {
  return (
    loadDocumentationPages().find(
      (page) =>
        page.id === identity ||
        page.legacyHashes.includes(identity) ||
        page.aliases.includes(identity),
    ) ?? null
  );
}

export function getDocumentationPageBySourcePath(sourcePath: string): DocumentationPage | null {
  const normalized = toPosix(sourcePath);
  return loadDocumentationPages().find((page) => page.sourcePath === normalized) ?? null;
}

export function createLegacyIdentityMap(): Map<string, DocumentationPage> {
  const map = new Map<string, DocumentationPage>();
  for (const page of loadDocumentationPages()) {
    for (const identity of [page.id, ...page.legacyHashes, ...page.aliases]) {
      map.set(identity, page);
    }
  }
  return map;
}

export function readDocumentationBody(sourcePath: string): string {
  const absolutePath = path.join(process.cwd(), sourcePath);
  return stripDocumentationFrontmatter(fs.readFileSync(absolutePath, 'utf8'), sourcePath);
}

export function resetDocumentationContentCacheForTests(): void {
  pageCache = null;
  sourceCache = null;
}
