import type { ReactNode } from 'react';
import { ListBulletIcon } from '@heroicons/react/24/outline';
import type { DocumentationHeading } from '@/lib/docs/schema';
import type { DocumentationNavigationGroup } from '@/lib/docs/navigation';
import { AccessibleDrawer } from './AccessibleDrawer';
import { MobileDocsNavigationDrawer } from './MobileDocsNavigationDrawer';
import { DocsSidebarV2 } from '@/components/docs/navigation/DocsSidebarV2';
import { OnThisPageV2 } from '@/components/docs/navigation/OnThisPageV2';

export function DocsShell({ groups, headings, activePath, children }: {
  groups: DocumentationNavigationGroup[];
  headings: DocumentationHeading[];
  activePath: string;
  children: ReactNode;
}) {
  return (
    <div className="apx-doc-shell" data-doc2-shell>
      <main id="docs-content" tabIndex={-1} className="apx-doc-main lg:col-start-2 lg:row-start-1">
        <div className="apx-doc-mobile-bar" aria-label="Mobile documentation controls">
          <MobileDocsNavigationDrawer groups={groups} activePath={activePath} />
          {headings.length ? (
            <AccessibleDrawer
              label="On this page"
              triggerLabel="Open on this page navigation"
              side="bottom"
              closeEventName="apx-close-docs-toc"
              trigger={<><ListBulletIcon className="h-5 w-5" aria-hidden /><span>On this page</span></>}
            >
              <OnThisPageV2 headings={headings} id="docs-toc-drawer" />
            </AccessibleDrawer>
          ) : <span aria-hidden />}
        </div>
        <div className="apx-doc-content">{children}</div>
      </main>
      <aside className="apx-doc-sidebar lg:col-start-1 lg:row-start-1" aria-label="Documentation sidebar">
        <DocsSidebarV2 groups={groups} activePath={activePath} searchInputId="docs-sidebar-search-input" />
      </aside>
      <aside className="apx-doc-toc-rail lg:col-start-3 lg:row-start-1" aria-label="On this page rail">
        <OnThisPageV2 headings={headings} id="docs-toc-rail" />
      </aside>
    </div>
  );
}
