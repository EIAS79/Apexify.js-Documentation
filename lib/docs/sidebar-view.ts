import type { DocumentationNavigationGroup, DocumentationNavigationItem } from './navigation';

export function findNavigationTrail(groups: DocumentationNavigationGroup[], path: string): DocumentationNavigationItem[] {
  function walk(items: DocumentationNavigationItem[], parents: DocumentationNavigationItem[]): DocumentationNavigationItem[] | undefined {
    for (const item of items) {
      const trail = [...parents, item];
      if (item.href === path) return trail;
      const found = walk(item.children ?? [], trail);
      if (found) return found;
    }
  }
  for (const group of groups) {
    const found = walk(group.items, []);
    if (found) return found;
  }
  return [];
}

/** Derive choices from real linked content, including arbitrary future package names. */
export function navigationPackages(groups: DocumentationNavigationGroup[]) {
  const packages = new Map<string, Set<string>>();
  function walk(items: DocumentationNavigationItem[]) {
    for (const item of items) {
      if (item.package && item.href) {
        const runtimes = packages.get(item.package) ?? new Set<string>();
        item.runtime?.forEach(runtime => runtimes.add(runtime));
        packages.set(item.package, runtimes);
      }
      walk(item.children ?? []);
    }
  }
  groups.forEach(group => walk(group.items));
  return [...packages].map(([name, runtimes]) => ({ name, runtimes: [...runtimes] }));
}

/** Keep structural ancestors, but never leak a sibling package into a scoped tree. */
export function scopeNavigation(groups: DocumentationNavigationGroup[], packageName: string) {
  if (!packageName) return groups;
  function walk(items: DocumentationNavigationItem[]): DocumentationNavigationItem[] {
    return items.flatMap(item => {
      const children = walk(item.children ?? []);
      const matches = item.package === packageName;
      if (!children.length && !(matches && item.href)) return [];
      return [{ ...item, href: matches ? item.href : undefined, children }];
    });
  }
  return groups.map(group => ({ ...group, items: walk(group.items) })).filter(group => group.items.length);
}
