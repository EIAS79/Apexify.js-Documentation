'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useState } from 'react';
import { DocsSidebarSearch } from '@/components/docs/DocsSidebarSearch';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { DOCUMENTATION_PACKAGES } from '@/lib/docs/schema';
import { findNavigationTrail, navigationPackages, scopeNavigation } from '@/lib/docs/sidebar-view';
import { StabilityBadge } from '@/components/docs/status/DocsBadges';
import type {
  DocumentationNavigationGroup,
  DocumentationNavigationItem,
  DocumentationNavigationTag,
} from '@/lib/docs/navigation';

const INTERACTIVE_CANVAS_PATH = '/docs/node/canvas';
const STORAGE_KEY = 'apexify.docs.sidebar.expanded.v2';

function branchKey(groupId: string, itemId?: string): string {
  return itemId ? `${groupId}:${itemId}` : `group:${groupId}`;
}

function findAncestorKeys(
  items: DocumentationNavigationItem[],
  activePath: string,
  groupId: string,
  ancestors: string[] = [],
): string[] | null {
  for (const item of items) {
    const ownKey = branchKey(groupId, item.id);
    const next = item.children?.length ? [...ancestors, ownKey] : ancestors;
    if (item.href === activePath) return next;
    const child = findAncestorKeys(item.children ?? [], activePath, groupId, next);
    if (child) return child;
  }
  return null;
}

function validBranchKeys(groups: DocumentationNavigationGroup[]): Set<string> {
  const keys = new Set<string>();
  const walk = (groupId: string, items: DocumentationNavigationItem[]) => {
    for (const item of items) {
      if (item.children?.length) {
        keys.add(branchKey(groupId, item.id));
        walk(groupId, item.children);
      }
    }
  };
  for (const group of groups) {
    keys.add(branchKey(group.id));
    walk(group.id, group.items);
  }
  return keys;
}

function initialExpanded(groups: DocumentationNavigationGroup[], activePath: string): Set<string> {
  const keys = new Set<string>();
  for (const group of groups) {
    const ancestors = findAncestorKeys(group.items, activePath, group.id);
    if (ancestors) {
      keys.add(branchKey(group.id));
      ancestors.forEach((key) => keys.add(key));
    }
  }
  const start = groups.find((group) => group.id === 'start');
  if (start && !keys.size) keys.add(branchKey(start.id));
  return keys;
}

function NavigationTag({ value }: { value: DocumentationNavigationTag }) {
  return <span className="apx-sidebar-tag" data-tag={value}>{value}</span>;
}

function ItemLabel({ item, active }: { item: DocumentationNavigationItem; active: boolean }) {
  const showStatus = item.type === 'engine' || (item.stability && item.stability !== 'CURRENT');
  return (
    <>
      <span className="apx-sidebar-link__title">{item.title}</span>
      <span className="apx-sidebar-link__badges">
        {item.tag ? <NavigationTag value={item.tag} /> : null}
        {showStatus && item.stability ? <StabilityBadge value={item.stability} /> : null}
        {active ? <span className="sr-only">Current page</span> : null}
      </span>
    </>
  );
}

function NavigationItems({
  items,
  activePath,
  groupId,
  depth,
  expanded,
  toggle,
  idPrefix,
}: {
  items: DocumentationNavigationItem[];
  activePath: string;
  groupId: string;
  depth: number;
  expanded: Set<string>;
  toggle: (key: string) => void;
  idPrefix: string;
}) {
  return (
    <ul className="apx-sidebar-items" data-depth={depth}>
      {items.map((item) => {
        const active = item.href === activePath;
        const hasChildren = Boolean(item.children?.length);
        const key = branchKey(groupId, item.id);
        const isOpen = hasChildren && expanded.has(key);
        const controlsId = `docs-nav-${idPrefix}-${key.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;

        return (
          <li key={item.id} className="apx-sidebar-node" data-open={isOpen || undefined} data-active={active || undefined}>
            <div className="apx-sidebar-node__row">
              {hasChildren ? (
                <button
                  type="button"
                  className="apx-sidebar-disclosure"
                  aria-expanded={isOpen}
                  aria-controls={controlsId}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.title}`}
                  onClick={() => toggle(key)}
                >
                  <ChevronRightIcon aria-hidden className="h-3.5 w-3.5" />
                </button>
              ) : <span className="apx-sidebar-disclosure-spacer" aria-hidden />}

              {item.href ? (
                <Link
                  href={item.href}
                  prefetch={item.href === INTERACTIVE_CANVAS_PATH ? false : undefined}
                  className="apx-sidebar-link"
                  aria-current={active ? 'page' : undefined}
                  data-runtime={item.runtime?.join(',')}
                  data-package={item.package}
                  data-stability={item.stability}
                >
                  <ItemLabel item={item} active={active} />
                </Link>
              ) : (
                <button
                  type="button"
                  className="apx-sidebar-link apx-sidebar-link--branch"
                  onClick={() => hasChildren && toggle(key)}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  aria-controls={hasChildren ? controlsId : undefined}
                >
                  <ItemLabel item={item} active={false} />
                </button>
              )}
            </div>

            {hasChildren ? (
              <div id={controlsId} hidden={!isOpen}>
                <NavigationItems
                  items={item.children ?? []}
                  activePath={activePath}
                  groupId={groupId}
                  depth={depth + 1}
                  expanded={expanded}
                  toggle={toggle}
                  idPrefix={idPrefix}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function DocsSidebarV2({
  groups,
  activePath,
  includeSearch = true,
  searchInputId = 'docs-sidebar-search-input',
}: {
  groups: DocumentationNavigationGroup[];
  activePath: string;
  includeSearch?: boolean;
  searchInputId?: string;
}) {
  const idPrefix = useId().replace(/:/g, '');
  const trail = useMemo(() => findNavigationTrail(groups, activePath), [groups, activePath]);
  const activePackage = trail.at(-1)?.package ?? '';
  const [packageName, setPackageName] = useState<string>(activePackage);
  const choices = useMemo(() => navigationPackages(groups), [groups]);
  const visibleGroups = useMemo(() => scopeNavigation(groups, packageName), [groups, packageName]);
  const plannedPackages = DOCUMENTATION_PACKAGES.filter(name => !choices.some(choice => choice.name === name));
  useEffect(() => { setPackageName(activePackage); }, [activePath, activePackage]);
  const validKeys = useMemo(() => validBranchKeys(groups), [groups]);
  const activeKeys = useMemo(() => initialExpanded(groups, activePath), [groups, activePath]);
  const [expanded, setExpanded] = useState<Set<string>>(() => activeKeys);

  useEffect(() => {
    setExpanded((current) => {
      const next = new Set([...current].filter((key) => validKeys.has(key)));
      activeKeys.forEach((key) => next.add(key));
      return next;
    });
  }, [activeKeys, validKeys]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as string[];
      setExpanded((current) => {
        const next = new Set(current);
        for (const key of saved) if (validKeys.has(key)) next.add(key);
        activeKeys.forEach((key) => next.add(key));
        return next;
      });
    } catch {
      // Persistence is an enhancement; navigation remains fully functional without it.
    }
  }, [activeKeys, validKeys]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded].filter((key) => validKeys.has(key))));
    } catch {
      // Ignore blocked storage/quota failures.
    }
  }, [expanded, validKeys]);

  const toggle = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="apx-sidebar-panel" data-doc2-sidebar data-post-doc12-tree>
      <div className="frame-doc-scope">
        <label htmlFor={`${idPrefix}-package`}>Engine / package</label>
        <select id={`${idPrefix}-package`} aria-label="Documentation engine or package" value={packageName} onChange={event => setPackageName(event.target.value)}>
          <option value="">All engines &amp; packages</option>
          {choices.map(choice => <option key={choice.name} value={choice.name}>{choice.runtimes.join(' / ')} · {choice.name}</option>)}
        </select>
        <p>{packageName === 'apexify.js' ? '6.0 docs · Staged source' : packageName ? 'Package documentation' : 'Browse every documented package'}</p>
      </div>
      {includeSearch ? <div className="apx-sidebar-search"><DocsSidebarSearch key={packageName} inputId={searchInputId} scope={packageName ? { package: packageName } : undefined} /></div> : null}
      {trail.length > 1 && <p className="frame-doc-location" aria-label="Current documentation location">{trail.slice(0, -1).map(item => item.title).join(' / ')}</p>}
      <nav aria-label="Documentation">
        {visibleGroups.map((group) => {
          const key = branchKey(group.id);
          const isOpen = expanded.has(key);
          const controlsId = `docs-group-${idPrefix}-${group.id}`;
          return (
            <section className="apx-sidebar-group" key={group.id} data-open={isOpen || undefined}>
              <button
                type="button"
                className="apx-sidebar-group__button"
                aria-expanded={isOpen}
                aria-controls={controlsId}
                onClick={() => toggle(key)}
              >
                <span>{group.label}</span>
                <ChevronRightIcon className="apx-sidebar-group__chevron h-3.5 w-3.5" aria-hidden />
              </button>
              <div id={controlsId} hidden={!isOpen}>
                <NavigationItems
                  items={group.items}
                  activePath={activePath}
                  groupId={group.id}
                  depth={0}
                  expanded={expanded}
                  toggle={toggle}
                  idPrefix={idPrefix}
                />
              </div>
            </section>
          );
        })}
      </nav>
      <div className="frame-doc-scope-footer">
        <button type="button" onClick={() => setPackageName('')}>Browse all packages</button>
        {plannedPackages.length > 0 && <details><summary>Planned packages <span>ROADMAP</span></summary><p>Architecture targets, not published API guides. Packages appear in the selector when documentation is available.</p><ul>{plannedPackages.map(name => <li key={name}><code>{name}</code></li>)}</ul></details>}
      </div>
    </div>
  );
}
