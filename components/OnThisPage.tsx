'use client';

import { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface OnThisPageProps {
  headings: Heading[];
}

export default function OnThisPage({ headings }: OnThisPageProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -66%',
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      });
    };
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 lg:hidden bg-blue-500 text-white p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 hover:scale-110"
        aria-label="Toggle table of contents"
      >
        {isMobileOpen ? (
          <ChevronRightIcon className="h-6 w-6" />
        ) : (
          <ChevronLeftIcon className="h-6 w-6" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Expand button when collapsed (floating icon) - OUTSIDE the sidebar */}
      {isCollapsed && !isMobile && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed right-4 top-24 z-[60] p-3 bg-slate-950 hover:bg-slate-900 rounded-lg border border-slate-800 transition-all duration-200 shadow-xl hover:scale-110 backdrop-blur-sm"
          aria-label="Expand sidebar"
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-300 hover:text-white" />
        </button>
      )}

      <aside 
        data-sidebar="right"
        className={`fixed right-0 top-16 bottom-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/95 backdrop-blur-xl border-l border-slate-800/60 transition-all duration-300 z-40 shadow-xl lg:shadow-none ${
          isCollapsed 
            ? 'w-0 lg:w-0 overflow-hidden border-l-0' 
            : 'w-0 lg:w-64 overflow-y-auto'
        } ${isMobileOpen ? 'w-64 translate-x-0 overflow-y-auto' : 'translate-x-full lg:translate-x-0'}`}>

        {/* Sidebar content - only show when not collapsed */}
        {!isCollapsed && (
          <div className="p-4">
            {/* Collapse/Expand button (desktop only) */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <span className="text-blue-400">📑</span>
                ON THIS PAGE
              </h3>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 hover:bg-slate-950 rounded-lg transition-colors duration-200"
                aria-label="Collapse"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            {/* Mobile header */}
            <div className="flex lg:hidden items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-400 uppercase tracking-wider">
                ON THIS PAGE
              </h3>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 hover:bg-slate-950 rounded-lg transition-colors duration-200"
                aria-label="Close"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <nav className="space-y-1 animate-fade-in">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(heading.id);
                    if (isMobile) {
                      setIsMobileOpen(false);
                    }
                  }}
                  className={`block py-2.5 px-3 rounded-lg text-sm transition-all duration-150 ${
                    heading.level === 1 ? 'font-semibold' : heading.level === 2 ? 'ml-4 font-medium' : 'ml-6'
                  } ${
                    activeId === heading.id
                      ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 font-semibold shadow-lg shadow-blue-500/30'
                      : 'text-gray-400 hover:text-blue-300 hover:bg-slate-800/60'
                  }`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}
