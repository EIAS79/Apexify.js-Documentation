'use client';

import { ReactNode, useEffect, useState } from 'react';
import OnThisPage from './OnThisPage';

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
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    const checkSidebars = () => {
      const leftSidebar = document.querySelector('[data-sidebar="left"]');
      if (leftSidebar) {
        const classes = leftSidebar.className;
        const isCollapsed = classes.includes('w-0') && 
                          !classes.includes('-translate-x-full') &&
                          classes.includes('translate-x-0');
        setLeftCollapsed(isCollapsed);
      }

      const rightSidebar = document.querySelector('[data-sidebar="right"]');
      if (rightSidebar) {
        const classes = rightSidebar.className;
        const isCollapsed = classes.includes('w-0');
        setRightCollapsed(isCollapsed);
      }
    };

    checkSidebars();

    const observer = new MutationObserver(checkSidebars);

    const leftSidebar = document.querySelector('[data-sidebar="left"]');
    const rightSidebar = document.querySelector('[data-sidebar="right"]');
    
    if (leftSidebar) {
      observer.observe(leftSidebar, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: false 
      });
    }
    
    if (rightSidebar) {
      observer.observe(rightSidebar, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: false 
      });
    }

    const interval = setInterval(checkSidebars, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex min-h-screen relative">
      <main className={`flex-1 w-full transition-all duration-300 pt-16 ${
        leftCollapsed ? 'lg:ml-0' : 'lg:ml-64'
      } ${
        rightCollapsed ? 'lg:mr-0' : 'lg:mr-64'
      }`}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 xl:px-12 pt-8 pb-12 lg:pt-10 lg:pb-16">
          {children}
        </div>
      </main>
      <OnThisPage headings={headings} />
    </div>
  );
}
