'use client';

import { Bars3Icon } from '@heroicons/react/24/outline';
import type { DocumentationNavigationGroup } from '@/lib/docs/navigation';
import { DocsSidebarV2 } from '@/components/docs/navigation/DocsSidebarV2';
import { AccessibleDrawer } from './AccessibleDrawer';

export function MobileDocsNavigationDrawer({
  groups,
  activePath,
}: {
  groups: DocumentationNavigationGroup[];
  activePath: string;
}) {
  return (
    <AccessibleDrawer
      label="Documentation navigation"
      triggerLabel="Open documentation navigation"
      side="left"
      eventName="apx-open-docs-nav"
      trigger={<><Bars3Icon className="h-5 w-5" aria-hidden /><span>Navigation</span></>}
    >
      <DocsSidebarV2 groups={groups} activePath={activePath} searchInputId="docs-drawer-search-input" />
    </AccessibleDrawer>
  );
}
