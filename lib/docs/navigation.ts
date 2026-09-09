import type { DocumentationPage } from './schema';

export const DOCUMENTATION_NAVIGATION_MANIFEST = [
  {
    id: 'start',
    label: 'Start',
    order: 10,
    pages: ['getting-started'],
  },
  {
    id: 'node',
    label: 'Node',
    order: 20,
    pages: ['node/canvas', 'node/canvas/size-and-coordinates'],
  },
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
}

export interface DocumentationNavigationGroup {
  id: string;
  label: string;
  order: number;
  items: DocumentationNavigationItem[];
}

export interface DocumentationPager {
  previous: DocumentationNavigationItem | null;
  next: DocumentationNavigationItem | null;
}

export interface DocumentationBreadcrumb {
  label: string;
  href?: string;
}

export function buildDocumentationNavigation(
  pages: DocumentationPage[],
): DocumentationNavigationGroup[] {
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const seen = new Set<string>();

  const groups = DOCUMENTATION_NAVIGATION_MANIFEST.map((group) => ({
    id: group.id,
    label: group.label,
    order: group.order,
    items: group.pages.map((slug) => {
      const page = bySlug.get(slug);
      if (!page) {
        throw new Error(
          `[docs-navigation] manifest references missing routed page "${slug}"`,
        );
      }
      if (seen.has(slug)) {
        throw new Error(`[docs-navigation] routed page "${slug}" appears more than once`);
      }
      seen.add(slug);
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
    }),
  })).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  const missing = pages.filter((page) => !seen.has(page.slug));
  if (missing.length > 0) {
    throw new Error(
      `[docs-navigation] routed pages missing from navigation manifest: ${missing
        .map((page) => page.slug)
        .join(', ')}`,
    );
  }

  return groups;
}

export function flattenDocumentationNavigation(
  groups: DocumentationNavigationGroup[],
): DocumentationNavigationItem[] {
  return groups.flatMap((group) => group.items);
}

export function getDocumentationPager(
  groups: DocumentationNavigationGroup[],
  canonicalPath: string,
): DocumentationPager {
  const items = flattenDocumentationNavigation(groups);
  const index = items.findIndex((item) => item.href === canonicalPath);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
}

export function getDocumentationBreadcrumbs(
  groups: DocumentationNavigationGroup[],
  page: DocumentationPage,
): DocumentationBreadcrumb[] {
  const group = groups.find((candidate) =>
    candidate.items.some((item) => item.href === page.canonicalPath),
  );
  if (!group) {
    throw new Error(
      `[docs-navigation] cannot build breadcrumbs for unmanifested page "${page.slug}"`,
    );
  }
  return [
    { label: 'Apexify', href: '/' },
    { label: 'Docs', href: '/docs/getting-started' },
    { label: group.label },
    { label: page.title },
  ];
}
