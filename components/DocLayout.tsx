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
  const [hasToc] = useState<boolean>(headings.length > 0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const sync = () => setIsDesktop(window.innerWidth >= 1024);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  /** Mirror of the sidebar's open state — only matters on desktop because the
   *  drawer is overlay-only on mobile. */
  const leftActive = isDesktop ? sidebarOpen : false;
  const rightActive = isDesktop && hasToc;

  return (
    <div className="relative flex min-h-screen">
      <DocReadingProgress />

      {/*
        `min-w-0` is critical: as a flex child, <main> defaults to
        `min-width: auto`, which lets long unbreakable strings (inline
        code paths like `00-start-here/*.mdx`) push the main wider than
        its margin reservation, sliding article content under the right
        sidebar. With `min-w-0` the main is allowed to shrink to the
        space left by `lg:ml-80` + the right margin, and the inner article
        wraps properly within that box. `overflow-x-clip` is a safety net
        for any rare element that still refuses to wrap.

        Right margin is intentionally LARGER than the right sidebar's
        own width (`w-64` = 16rem). The extra 2rem at `lg` (4rem at `xl`)
        is dedicated gutter between the article column and the
        "On this page" rail — independent of whether the left sidebar
        is currently open or collapsed.
          - lg: mr = 18rem  → sidebar 16rem + 2rem gap
          - xl: mr = 20rem  → sidebar 16rem + 4rem gap
      */}
      <main
        className={`relative w-full flex-1 min-w-0 overflow-x-clip pt-16 transition-[margin] duration-300 ${
          leftActive ? 'lg:ml-80 xl:ml-[22rem]' : 'lg:ml-0'
        } ${rightActive ? 'lg:mr-72 xl:mr-80' : 'lg:mr-0'}`}
      >
        <div className="mx-auto w-full max-w-3xl min-w-0 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10 xl:px-12">
          {children}
        </div>
      </main>

      <OnThisPage headings={headings} />
    </div>
  );
}
