import type { DocumentationPage } from './schema';

/** DOC-9/10 navigation is intent/taxonomy driven and remains empty for future scopes until real pages exist. */
export const DOCUMENTATION_NAVIGATION_MANIFEST = [
  { id: 'start', label: 'Start', order: 10 },
  { id: 'recipes', label: 'Recipes', order: 20 },
  { id: 'core', label: 'Core', order: 25 },
  { id: 'node', label: 'Node guides', order: 30 },
  { id: 'web', label: 'Web', order: 32 },
  { id: 'react', label: 'React', order: 34 },
  { id: 'next', label: 'Next.js', order: 36 },
  { id: 'engine', label: 'Engine', order: 38 },
  { id: 'advanced', label: 'Advanced', order: 40 },
  { id: 'capabilities', label: 'Capabilities', order: 45 },
  { id: 'errors', label: 'Errors & diagnostics', order: 47 },
  { id: 'architecture', label: 'Architecture & migration', order: 50 },
] as const;

export interface DocumentationNavigationItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  href: string;
  kind: DocumentationPage['kind'];
  stability: DocumentationPage['stability'];
  runtime: DocumentationPage['runtime'];
  package: DocumentationPage['package'];
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

function groupIdFor(page: DocumentationPage): (typeof DOCUMENTATION_NAVIGATION_MANIFEST)[number]['id'] {
  if (page.slug === 'overview' || page.slug === 'getting-started' || page.slug.startsWith('start/')) return 'start';
  if (page.slug.startsWith('recipes/')) return 'recipes';
  if (page.slug.startsWith('core/')) return 'core';
  if (page.slug.startsWith('web/')) return 'web';
  if (page.slug.startsWith('react/')) return 'react';
  if (page.slug.startsWith('next/')) return 'next';
  if (page.slug.startsWith('engine/')) return 'engine';
  if (page.slug.startsWith('advanced/')) return 'advanced';
  if (page.slug.startsWith('capabilities/')) return 'capabilities';
  if (page.slug.startsWith('errors/')) return 'errors';
  if (page.slug.startsWith('architecture/') || page.slug.startsWith('migration/')) return 'architecture';
  return 'node';
}

function toItem(page: DocumentationPage): DocumentationNavigationItem {
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
  };
}

function nestNavigationItems(items: DocumentationNavigationItem[]): DocumentationNavigationItem[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const roots: DocumentationNavigationItem[] = [];

  for (const item of items) {
    const segments = item.slug.split('/');
    const parentSlug = segments.length > 1 ? segments.slice(0, -1).join('/') : null;
    const parent = parentSlug ? bySlug.get(parentSlug) : undefined;
    if (parent) {
      parent.children = [...(parent.children ?? []), item];
    } else {
      roots.push(item);
    }
  }

  return roots;
}

export function buildDocumentationNavigation(pages: DocumentationPage[]): DocumentationNavigationGroup[] {
  const seen = new Set<string>();
  const groups = DOCUMENTATION_NAVIGATION_MANIFEST.map((definition) => {
    const items = pages
      .filter((page) => groupIdFor(page) === definition.id)
      .sort((a, b) => a.order - b.order || a.canonicalPath.localeCompare(b.canonicalPath, undefined, { numeric: true }))
      .map((page) => {
        if (seen.has(page.slug)) throw new Error(`[docs-navigation] routed page "${page.slug}" appears more than once`);
        seen.add(page.slug);
        return toItem(page);
      });
    return { ...definition, items: nestNavigationItems(items) };
  }).filter((group) => group.items.length > 0);

  const missing = pages.filter((page) => !seen.has(page.slug));
  if (missing.length) throw new Error(`[docs-navigation] routed pages missing from navigation taxonomy: ${missing.map((page) => page.slug).join(', ')}`);
  return groups;
}

function flattenItems(items: DocumentationNavigationItem[]): DocumentationNavigationItem[] {
  return items.flatMap((item) => [item, ...flattenItems(item.children ?? [])]);
}

export function flattenDocumentationNavigation(groups: DocumentationNavigationGroup[]): DocumentationNavigationItem[] {
  return groups.flatMap((group) => flattenItems(group.items));
}

function filterItems(items: DocumentationNavigationItem[], filter: DocumentationNavigationFilter): DocumentationNavigationItem[] {
  return items.flatMap((item) => {
    const children = filterItems(item.children ?? [], filter);
    const matchesRuntime = !filter.runtime || item.runtime.includes(filter.runtime);
    const matchesPackage = !filter.package || item.package === filter.package;
    if (matchesRuntime && matchesPackage) return [{ ...item, children }];
    return children.length ? [{ ...item, children }] : [];
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

export function getDocumentationBreadcrumbs(groups: DocumentationNavigationGroup[], page: DocumentationPage): DocumentationBreadcrumb[] {
  const group = groups.find((candidate) => flattenItems(candidate.items).some((item) => item.href === page.canonicalPath));
  if (!group) throw new Error(`[docs-navigation] cannot build breadcrumbs for unmanifested page "${page.slug}"`);
  return [
    { label: 'Apexify', href: '/' },
    { label: 'Docs', href: '/docs/getting-started' },
    { label: group.label },
    { label: page.title },
  ];
}
