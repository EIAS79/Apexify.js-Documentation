'use client';

import type { ReactNode } from 'react';
import DocLayout from '@/components/DocLayout';
import { useSidebar } from '@/contexts/SidebarContext';
import type { DocumentationHeading } from '@/lib/docs/schema';
import type { DocumentationNavigationGroup } from '@/lib/docs/navigation';
import { RouteDocSidebar } from './RouteDocSidebar';

export function RouteDocsFrame({
  groups,
  headings,
  children,
}: {
  groups: DocumentationNavigationGroup[];
  headings: DocumentationHeading[];
  children: ReactNode;
}) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  return (
    <>
      <RouteDocSidebar
        groups={groups}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <DocLayout headings={headings}>{children}</DocLayout>
    </>
  );
}
