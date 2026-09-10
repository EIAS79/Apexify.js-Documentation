'use client';

import { ReactNode, useEffect, useState } from 'react';
import OnThisPage from './OnThisPage';
import { DocReadingProgress } from './docs/DocReadingProgress';
import { useSidebar } from '@/contexts/SidebarContext';

interface Heading { id: string; text: string; level: number; }
interface DocLayoutProps { children: ReactNode; headings?: Heading[]; }

export default function DocLayout({ children, headings = [] }: DocLayoutProps) {
  const { sidebarOpen } = useSidebar();
  const hasToc = headings.length > 0;
  const [isDesktop, setIsDesktop] = useState(false);
  const [tocExpanded, setTocExpanded] = useState(true);

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 1024);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const leftActive = isDesktop ? sidebarOpen : false;
  const rightRailOpen = isDesktop && hasToc && tocExpanded;
  const rightRailCollapsed = isDesktop && hasToc && !tocExpanded;

  return (
    <div className="relative flex min-h-screen w-full min-w-0">
      <DocReadingProgress />
      <main
        id="docs-content"
        tabIndex={-1}
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
