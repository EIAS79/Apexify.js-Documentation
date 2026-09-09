import Link from 'next/link';
import { DocsSidebarSearch } from '@/components/docs/DocsSidebarSearch';
import { StabilityBadge } from '@/components/docs/status/DocsBadges';
import type { DocumentationNavigationGroup, DocumentationNavigationItem } from '@/lib/docs/navigation';

function NavigationItems({ items, activePath, depth = 0 }: { items: DocumentationNavigationItem[]; activePath: string; depth?: number }) {
  return (
    <ul className="apx-sidebar-items" data-depth={depth}>
      {items.map((item) => {
        const active = item.href === activePath;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className="apx-sidebar-link"
              aria-current={active ? 'page' : undefined}
              data-runtime={item.runtime.join(',')}
              data-package={item.package}
              data-stability={item.stability}
            >
              <span className="apx-sidebar-link__title">{item.title}</span>
              <span className="apx-sidebar-link__meta">
                <span>{item.package}</span>
                <span aria-hidden>·</span>
                <span>{item.runtime.join(' / ')}</span>
                <StabilityBadge value={item.stability} />
              </span>
            </Link>
            {item.children?.length ? <NavigationItems items={item.children} activePath={activePath} depth={depth + 1} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function DocsSidebarV2({ groups, activePath, includeSearch = true }: { groups: DocumentationNavigationGroup[]; activePath: string; includeSearch?: boolean }) {
  return (
    <div className="apx-sidebar-panel" data-doc2-sidebar>
      {includeSearch ? <div className="apx-sidebar-search"><DocsSidebarSearch /></div> : null}
      <nav aria-label="Documentation">
        {groups.map((group) => {
          const containsActive = group.items.some((item) => item.href === activePath || item.children?.some((child) => child.href === activePath));
          return (
            <details className="apx-sidebar-group" key={group.id} open={containsActive || group.id === 'start'}>
              <summary><span>{group.label}</span><span className="sr-only">section</span></summary>
              <NavigationItems items={group.items} activePath={activePath} />
            </details>
          );
        })}
      </nav>
    </div>
  );
}
