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
      {/* Professional Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-navy-950 to-slate-900">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-purple-950/5"></div>
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <main className={`flex-1 w-full transition-all duration-300 pt-16 relative ${
        leftCollapsed ? 'lg:ml-0' : 'lg:ml-72'
      } ${
        rightCollapsed ? 'lg:mr-0' : 'lg:mr-64'
      }`}>
        <div className="w-full max-w-4xl pt-4 sm:pt-8 pb-8 sm:pb-12 lg:pt-12 lg:pb-20 lg:ml-[135px] lg:mr-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          {children}
        </div>
      </main>
      <OnThisPage headings={headings} />
    </div>
  );
}
