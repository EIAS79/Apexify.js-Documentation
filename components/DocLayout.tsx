'use client';

import { ReactNode, useEffect, useState } from 'react';
import OnThisPage from './OnThisPage';
import { DocReadingProgress } from './docs/DocReadingProgress';
import { useSidebar } from '@/contexts/SidebarContext';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface DocLayoutProps {
  children: ReactNode;
  headings?: Heading[];
}

export default function DocLayout({ children, headings = [] }: DocLayoutProps) {
  const { sidebarOpen } = useSidebar();
  const hasToc = headings.length > 0;
  const [isDesktop, setIsDesktop] = useState(false);
  /** Desktop-only: hide the fixed “On this page” rail to give the article more width. */
  const [tocExpanded, setTocExpanded] = useState(true);

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 1024);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  /** Mirror of the sidebar's open state — only matters on desktop because the
   *  drawer is overlay-only on mobile. */
  const leftActive = isDesktop ? sidebarOpen : false;
  const rightRailOpen = isDesktop && hasToc && tocExpanded;
  /** Narrow gutter when TOC exists but is collapsed (room for the expand tab). */
  const rightRailCollapsed = isDesktop && hasToc && !tocExpanded;

  return (
    <div className="relative flex min-h-screen w-full min-w-0">
      <DocReadingProgress />

      {/*
        The right TOC is `position: fixed`, so it does not consume width in this
        flex row — <main> is effectively the only in-flow flex child. Do not use
        `w-full` on <main>: width: 100% + large horizontal margins makes the
        margin box wider than the viewport when the left sidebar is open, so
        article text slides under the fixed "On this page" rail. `flex-1 min-w-0`
        lets the flex algorithm assign a width that already fits between margins.

        `min-w-0` on the flex wrapper avoids the parent flexbox min-width:auto
        clamp that can block shrinking.

        Right margin: wide when the TOC rail is open (`w-64` + gutter), slim when
        the user collapses the rail (expand tab only).
      */}
      <main
        className={`relative flex-1 min-w-0 overflow-x-clip pt-16 transition-[margin] duration-300 ${
          leftActive ? 'lg:ml-80 xl:ml-[22rem]' : 'lg:ml-0'
        } ${
          rightRailOpen ? 'lg:mr-72 xl:mr-80' : rightRailCollapsed ? 'lg:mr-14 xl:mr-14' : 'lg:mr-0'
        }`}
      >
        <div className="mx-auto w-full min-w-0 max-w-[min(48rem,100%)] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10 xl:px-12">
          {children}
        </div>
      </main>

      <OnThisPage
        headings={headings}
        isDesktop={isDesktop}
        desktopTocExpanded={tocExpanded}
        onDesktopTocExpandedChange={setTocExpanded}
      />
    </div>
  );
}
