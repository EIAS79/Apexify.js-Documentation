import type { DocumentationPage } from './schema';

/**
 * Navigation remains derived from the DOC-1/DOC-9 page manifest. This file only
 * supplies presentation taxonomy; it is not a second content database.
 */
export const DOCUMENTATION_NAVIGATION_MANIFEST = [
  { id: 'start', label: 'Start', order: 10 },
  { id: 'engines', label: 'Engines', order: 20 },
  { id: 'architecture', label: 'Architecture', order: 80 },
  { id: 'migration', label: 'Migration', order: 90 },
  // Future-runtime slots stay empty in production until real pages exist. DOC-10
  // fixtures still exercise these IDs directly.
  { id: 'core', label: 'Core', order: 110 },
  { id: 'web', label: 'Web', order: 120 },
  { id: 'react', label: 'React', order: 130 },
  { id: 'next', label: 'Next.js', order: 140 },
  { id: 'engine', label: 'Engine', order: 150 },
  { id: 'capabilities', label: 'Capabilities', order: 160 },
  { id: 'errors', label: 'Errors & diagnostics', order: 170 },
] as const;

export type DocumentationNavigationTag =
  | 'FEATURE'
  | 'GUIDE'
  | 'RECIPE'
  | 'API'
  | 'ADVANCED'
  | 'PERF'
  | 'SECURITY'
  | 'HELP'
  | 'PREVIEW'
  | 'EXPERIMENTAL'
  | 'ROADMAP'
  | 'DEPRECATED';

export type DocumentationNavigationNodeType = 'engine' | 'section' | 'feature' | 'page';

export interface DocumentationNavigationItem {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  href?: string;
  kind?: DocumentationPage['kind'];
  stability?: DocumentationPage['stability'];
  runtime?: DocumentationPage['runtime'];
  package?: DocumentationPage['package'];
  type?: DocumentationNavigationNodeType;
  tag?: DocumentationNavigationTag;
  children?: DocumentationNavigationItem[];
}

export interface DocumentationNavigationGroup {
  id: string;
  label: string;
  order: number;
  items: DocumentationNavigationItem[];
}

export interface DocumentationPager { previous: DocumentationNavigationItem | null; next: DocumentationNavigationItem | null; }
export interface DocumentationBreadcrumb { label: string; href?: string; }
export interface DocumentationNavigationFilter { runtime?: DocumentationPage['runtime'][number]; package?: DocumentationPage['package']; }

const FEATURE_LABELS: Record<string, string> = {
  'batch-save-output': 'Batch & output',
  canvas: 'Canvas',
  charts: 'Charts',
  'gif-animation': 'GIF & animation',
  'images-shapes': 'Images & shapes',
  'lines-connectors': 'Lines & connectors',
  'raster-batch-output': 'Raster & encoded output',
  'text-rendering': 'Text',
  'video-ffmpeg': 'Video',
};

function pageItem(page: DocumentationPage): DocumentationNavigationItem {
  return {
    id: page.id,
    title: page.title,
    description: page.description,
    slug: page.slug,
    href: page.canonicalPath,
    kind: page.kind,
    stability: page.stability,
    runtime: page.runtime,
    package: page.package,
    type: 'page',
    tag:
      page.stability === 'DEPRECATED'
        ? 'DEPRECATED'
        : page.stability === 'EXPERIMENTAL'
          ? 'EXPERIMENTAL'
          : page.stability === 'PREVIEW'
            ? 'PREVIEW'
            : page.stability === 'ROADMAP'
              ? 'ROADMAP'
              : undefined,
  };
}

function virtualItem(
  id: string,
  title: string,
  children: DocumentationNavigationItem[],
  options: Pick<DocumentationNavigationItem, 'type' | 'tag' | 'stability' | 'runtime' | 'package'> = {},
): DocumentationNavigationItem {
  return { id, title, children, ...options };
}

function sourceBucket(page: DocumentationPage): string {
  const source = page.sourcePath.replace(/\\/g, '/');
  if (source.includes('/00-start-here/') || source.endsWith('/README.mdx')) return 'start';
  if (source.includes('/01-beginner-guide/')) return 'guides';
  if (source.includes('/02-recipes/')) return 'recipes';
  if (source.includes('/03-feature-guides/')) return 'features';
  if (source.includes('/04-advanced/')) return 'advanced';
  if (source.includes('/04-api-reference/')) return 'api';
  if (source.includes('/05-internals/')) return 'architecture';
  if (page.slug.startsWith('architecture/')) return 'architecture';
  if (page.slug.startsWith('migration/')) return 'migration';
  if (page.slug.startsWith('advanced/')) return 'advanced';
  if (page.slug.startsWith('errors/')) return 'help';
  if (page.slug.startsWith('capabilities/')) return 'performance';
  return 'guides';
}

function nestedFolder(sourcePath: string, marker: string): string | null {
  const normalized = sourcePath.replace(/\\/g, '/');
  const needle = `/${marker}/`;
  const start = normalized.indexOf(needle);
  if (start < 0) return null;
  const rest = normalized.slice(start + needle.length);
  const segments = rest.split('/');
  return segments.length > 1 ? segments[0] : null;
}

function sortPages(pages: DocumentationPage[]): DocumentationPage[] {
  return [...pages].sort((a, b) => a.order - b.order || a.canonicalPath.localeCompare(b.canonicalPath, undefined, { numeric: true }));
}

function featureTree(pages: DocumentationPage[]): DocumentationNavigationItem[] {
  const hub = pages.find((page) => page.sourcePath.replace(/\\/g, '/').endsWith('/03-feature-guides/feature-guides-hub.mdx'));
  const byFamily = new Map<string, DocumentationPage[]>();
  for (const page of pages) {
    if (hub && page.id === hub.id) continue;
    const family = nestedFolder(page.sourcePath, '03-feature-guides') ?? 'other';
    const list = byFamily.get(family) ?? [];
    list.push(page);
    byFamily.set(family, list);
  }

  const familyNodes = [...byFamily.entries()]
    .sort(([a], [b]) => {
      const known = Object.keys(FEATURE_LABELS);
      const ai = known.indexOf(a);
      const bi = known.indexOf(b);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      return a.localeCompare(b);
    })
    .map(([family, familyPages]) => {
      const sorted = sortPages(familyPages);
      const overviewIndex = sorted.findIndex((page) => /\/(?:00-|overview)/i.test(page.sourcePath) || /overview/i.test(page.title));
      const overview = overviewIndex >= 0 ? sorted[overviewIndex] : sorted[0];
      const children = sorted.filter((page) => page.id !== overview.id).map(pageItem);
      return {
        ...pageItem(overview),
        id: `feature:${family}`,
        title: FEATURE_LABELS[family] ?? overview.title,
        type: 'feature' as const,
        tag: 'FEATURE' as const,
        children,
      };
    });

  return hub ? [{ ...pageItem(hub), title: 'Overview' }, ...familyNodes] : familyNodes;
}

function groupedFolderTree(pages: DocumentationPage[], marker: string, tag: DocumentationNavigationTag): DocumentationNavigationItem[] {
  const direct: DocumentationPage[] = [];
  const folders = new Map<string, DocumentationPage[]>();
  for (const page of pages) {
    const folder = nestedFolder(page.sourcePath, marker);
    if (!folder) direct.push(page);
    else folders.set(folder, [...(folders.get(folder) ?? []), page]);
  }
  const items = sortPages(direct).map(pageItem);
  for (const [folder, folderPages] of [...folders.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const sorted = sortPages(folderPages);
    const first = sorted[0];
    items.push({
      ...pageItem(first),
      id: `${marker}:${folder}`,
      title: first.title.replace(/\s*[—:-].*$/, '') || folder.replace(/-/g, ' '),
      type: 'section',
      tag,
      children: sorted.slice(1).map(pageItem),
    });
  }
  return items;
}

function nodeEngineTree(pages: DocumentationPage[]): DocumentationNavigationItem[] {
  const buckets = new Map<string, DocumentationPage[]>();
  for (const page of pages) {
    const bucket = sourceBucket(page);
    buckets.set(bucket, [...(buckets.get(bucket) ?? []), page]);
  }

  const sections: DocumentationNavigationItem[] = [];
  const add = (bucket: string, title: string, tag: DocumentationNavigationTag, children?: DocumentationNavigationItem[]) => {
    const sourcePages = buckets.get(bucket) ?? [];
    const resolved = children ?? sortPages(sourcePages).map(pageItem);
    if (resolved.length) sections.push(virtualItem(`node:${bucket}`, title, resolved, { type: 'section', tag }));
  };

  add('guides', 'Guides', 'GUIDE');
  add('recipes', 'Recipes', 'RECIPE', groupedFolderTree(buckets.get('recipes') ?? [], '02-recipes', 'RECIPE'));
  add('features', 'Features', 'FEATURE', featureTree(buckets.get('features') ?? []));
  add('advanced', 'Advanced', 'ADVANCED');
  add('performance', 'Performance', 'PERF');
  add('security', 'Security', 'SECURITY');
  add('help', 'Troubleshooting', 'HELP');
  add('api', 'API Reference', 'API');

  return [
    virtualItem('engine:node', 'Node', sections, {
      type: 'engine',
      stability: 'CURRENT',
      runtime: ['node'],
      package: 'apexify.js',
    }),
  ];
}

function futureGroupId(page: DocumentationPage): string | null {
  const source = page.sourcePath.replace(/\\/g, '/');
  const futureRuntime = page.runtime.some((runtime) => ['web', 'react', 'next-client', 'next-server'].includes(runtime));
  const futureSurface = source.startsWith('fixture/') || page.package !== 'apexify.js' || futureRuntime;
  if (!futureSurface) return null;

  if (page.slug.startsWith('core/')) return 'core';
  if (page.slug.startsWith('web/')) return 'web';
  if (page.slug.startsWith('react/')) return 'react';
  if (page.slug.startsWith('next/')) return 'next';
  if (page.slug.startsWith('engine/')) return 'engine';
  if (page.slug.startsWith('capabilities/')) return 'capabilities';
  if (page.slug.startsWith('errors/')) return 'errors';
  return null;
}

export function buildDocumentationNavigation(pages: DocumentationPage[]): DocumentationNavigationGroup[] {
  const seen = new Set<string>();
  const claim = (page: DocumentationPage) => {
    if (seen.has(page.slug)) throw new Error(`[docs-navigation] routed page "${page.slug}" appears more than once`);
    seen.add(page.slug);
  };

  const futurePages = pages.filter((page) => futureGroupId(page));
  const currentPages = pages.filter((page) => !futureGroupId(page));
  const startPages = currentPages.filter((page) => sourceBucket(page) === 'start');
  const architecturePages = currentPages.filter((page) => sourceBucket(page) === 'architecture');
  const migrationPages = currentPages.filter((page) => sourceBucket(page) === 'migration');
  const nodePages = currentPages.filter((page) => !startPages.includes(page) && !architecturePages.includes(page) && !migrationPages.includes(page));

  [...startPages, ...architecturePages, ...migrationPages, ...nodePages, ...futurePages].forEach(claim);

  const groups: DocumentationNavigationGroup[] = [];
  if (startPages.length) groups.push({ id: 'start', label: 'Start', order: 10, items: sortPages(startPages).map(pageItem) });
  if (nodePages.length) groups.push({ id: 'engines', label: 'Engines', order: 20, items: nodeEngineTree(nodePages) });
  if (architecturePages.length) groups.push({ id: 'architecture', label: 'Architecture', order: 80, items: sortPages(architecturePages).map(pageItem) });
  if (migrationPages.length) groups.push({ id: 'migration', label: 'Migration', order: 90, items: sortPages(migrationPages).map(pageItem) });

  // DOC-10 future-readiness fixtures deliberately keep their established runtime
  // group IDs, while real ROADMAP pages remain visibly labelled if ever published.
  for (const definition of DOCUMENTATION_NAVIGATION_MANIFEST) {
    if (!['core', 'web', 'react', 'next', 'engine', 'capabilities', 'errors'].includes(definition.id)) continue;
    const matching = futurePages.filter((page) => futureGroupId(page) === definition.id);
    if (matching.length) groups.push({ ...definition, items: sortPages(matching).map(pageItem) });
  }

  const missing = pages.filter((page) => !seen.has(page.slug));
  if (missing.length) throw new Error(`[docs-navigation] routed pages missing from navigation taxonomy: ${missing.map((page) => page.slug).join(', ')}`);
  return groups.sort((a, b) => a.order - b.order);
}

function flattenItems(items: DocumentationNavigationItem[], linkedOnly = false): DocumentationNavigationItem[] {
  return items.flatMap((item) => [
    ...(!linkedOnly || item.href ? [item] : []),
    ...flattenItems(item.children ?? [], linkedOnly),
  ]);
}

export function flattenDocumentationNavigation(groups: DocumentationNavigationGroup[]): DocumentationNavigationItem[] {
  return groups.flatMap((group) => flattenItems(group.items, true));
}

function filterItems(items: DocumentationNavigationItem[], filter: DocumentationNavigationFilter): DocumentationNavigationItem[] {
  return items.flatMap((item) => {
    const children = filterItems(item.children ?? [], filter);
    const matchesRuntime = !filter.runtime || !item.runtime || item.runtime.includes(filter.runtime);
    const matchesPackage = !filter.package || !item.package || item.package === filter.package;
    if ((matchesRuntime && matchesPackage && item.href) || children.length) return [{ ...item, children }];
    return [];
  });
}

export function filterDocumentationNavigation(groups: DocumentationNavigationGroup[], filter: DocumentationNavigationFilter): DocumentationNavigationGroup[] {
  return groups.map((group) => ({ ...group, items: filterItems(group.items, filter) })).filter((group) => group.items.length > 0);
}

export function getDocumentationPager(groups: DocumentationNavigationGroup[], canonicalPath: string): DocumentationPager {
  const items = flattenDocumentationNavigation(groups);
  const index = items.findIndex((item) => item.href === canonicalPath);
  if (index < 0) return { previous: null, next: null };
  return { previous: index > 0 ? items[index - 1] : null, next: index < items.length - 1 ? items[index + 1] : null };
}

function findItemPath(items: DocumentationNavigationItem[], canonicalPath: string, ancestors: DocumentationNavigationItem[] = []): DocumentationNavigationItem[] | null {
  for (const item of items) {
    const path = [...ancestors, item];
    if (item.href === canonicalPath) return path;
    const childPath = findItemPath(item.children ?? [], canonicalPath, path);
    if (childPath) return childPath;
  }
  return null;
}

export function getDocumentationBreadcrumbs(groups: DocumentationNavigationGroup[], page: DocumentationPage): DocumentationBreadcrumb[] {
  for (const group of groups) {
    const path = findItemPath(group.items, page.canonicalPath);
    if (!path) continue;
    return [
      { label: 'Apexify', href: '/' },
      { label: 'Docs', href: '/docs/getting-started' },
      { label: group.label },
      ...path.map((item, index) => ({
        // Sidebar family labels are deliberately compact; the terminal breadcrumb
        // must retain the canonical page title for clarity and DOC-2 compatibility.
        label: index === path.length - 1 ? page.title : item.title,
        href: index < path.length - 1 ? item.href : undefined,
      })),
    ];
  }
  throw new Error(`[docs-navigation] cannot build breadcrumbs for unmanifested page "${page.slug}"`);
}
