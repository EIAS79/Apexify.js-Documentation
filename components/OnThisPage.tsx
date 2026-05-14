'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bars3BottomRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface OnThisPageProps {
  headings: Heading[];
  /** lg+ viewport — from DocLayout resize listener. */
  isDesktop: boolean;
  /** When false on desktop, the fixed TOC rail slides off-screen and main gets a slimmer right margin. */
  desktopTocExpanded: boolean;
  onDesktopTocExpandedChange: (expanded: boolean) => void;
}

export default function OnThisPage({
  headings,
  isDesktop,
  desktopTocExpanded,
  onDesktopTocExpandedChange,
}: OnThisPageProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    const NAV_ANCHOR_PX = 100;
    const tocIds = new Set(headings.map((h) => h.id));

    const headingElementsInArticle = (): HTMLElement[] => {
      const root = document.querySelector('[data-doc-article]');
      if (!root) return [];
      const nodes = root.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id]');
      return Array.from(nodes).filter((el) => tocIds.has(el.id));
    };

    const updateActive = () => {
      const els = headingElementsInArticle();
      if (els.length === 0) {
        setActiveId((prev) => (prev === (headings[0]?.id ?? '') ? prev : (headings[0]?.id ?? '')));
        return;
      }
      let active = els[0].id;
      for (const el of els) {
        const top = el.getBoundingClientRect().top;
        if (top <= NAV_ANCHOR_PX) active = el.id;
      }
      setActiveId((prev) => (prev === active ? prev : active));
    };

    updateActive();
    requestAnimationFrame(() => requestAnimationFrame(updateActive));

    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);

    const resizeRoot = document.querySelector('[data-doc-article]');
    let ro: ResizeObserver | null = null;
    if (resizeRoot && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateActive());
      ro.observe(resizeRoot);
    }

    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
      ro?.disconnect();
    };
  }, [headings]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  };

  if (headings.length === 0) return null;

  const renderTocList = () => (
    <nav ref={railRef} className="relative" aria-label="On this page">
      {/* Inactive vertical rail */}
      <span
        aria-hidden
        className="absolute left-[0.4375rem] top-1.5 bottom-1.5 w-px"
        style={{ backgroundColor: 'var(--border-subtle)' }}
      />
      <ul className="relative space-y-0.5">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          const indent = heading.level === 1 ? 0 : heading.level === 2 ? 0.75 : 1.5;
          return (
            <li key={heading.id} style={{ paddingLeft: `${indent}rem` }}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(heading.id);
                  if (isMobile) setIsMobileOpen(false);
                }}
                className="group relative flex items-center gap-2 rounded-md py-1.5 pl-3 pr-2 text-[12px] transition-colors"
                style={{
                  color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: isActive || heading.level === 1 ? 600 : 500,
                }}
              >
                {/* Active dot — sits on the rail */}
                <span
                  aria-hidden
                  className="absolute -left-[0.0625rem] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all"
                  style={{
                    backgroundColor: isActive ? 'var(--accent-magenta)' : 'transparent',
                    boxShadow: isActive ? 'var(--glow-magenta)' : 'none',
                    transform: 'translate(calc(-50% + 0.4375rem), -50%)',
                  }}
                />
                <span className="min-w-0 flex-1 truncate leading-snug">{heading.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Mobile floating button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full transition-transform hover:scale-110 active:scale-95 lg:hidden"
        style={{
          background: 'var(--gradient-sunset)',
          color: 'white',
          boxShadow: 'var(--glow-magenta)',
        }}
        aria-label="On this page"
      >
        <Bars3BottomRightIcon className="h-5 w-5" aria-hidden />
      </button>

      {/* Mobile bottom sheet */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-base) 60%, black)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-hidden rounded-t-2xl lg:hidden"
            style={{
              backgroundColor: 'var(--bg-raised)',
              borderTop: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: 'var(--accent-magenta)' }}
              >
                On this page
              </p>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md"
                style={{ color: 'var(--text-tertiary)' }}
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(70vh - 3.25rem)' }}>
              {renderTocList()}
            </div>
          </div>
        </>
      )}

      <aside
        id="docs-on-this-page-aside"
        data-sidebar="right"
        className={`fixed right-0 top-16 bottom-0 z-30 hidden h-[calc(100vh-4rem)] w-64 overflow-hidden lg:block lg:transition-transform lg:duration-300 lg:ease-out ${
          isDesktop && !desktopTocExpanded ? 'lg:translate-x-full' : 'lg:translate-x-0'
        }`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-base) 70%, transparent)',
          backdropFilter: 'blur(12px) saturate(130%)',
          WebkitBackdropFilter: 'blur(12px) saturate(130%)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
        aria-hidden={isDesktop && !desktopTocExpanded}
      >
        <div className="h-full overflow-y-auto px-4 py-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.32em]"
              style={{ color: 'var(--accent-magenta)' }}
            >
              On this page
            </p>
            <button
              type="button"
              onClick={() => onDesktopTocExpandedChange(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-tertiary)' }}
              aria-expanded={desktopTocExpanded}
              aria-controls="docs-on-this-page-aside"
              title="Hide table of contents"
              aria-label="Collapse on this page sidebar"
            >
              <ChevronRightIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div id="docs-toc-rail">{renderTocList()}</div>
        </div>
      </aside>

      {/* Desktop: bring TOC back when collapsed */}
      {isDesktop && headings.length > 0 && !desktopTocExpanded && (
        <button
          type="button"
          onClick={() => onDesktopTocExpandedChange(true)}
          className="fixed right-0 top-28 z-[31] hidden h-28 w-10 items-center justify-center gap-1 rounded-l-xl border border-r-0 transition-colors hover:bg-white/5 lg:flex lg:flex-col"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-raised) 88%, transparent)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-md)',
          }}
          aria-label="Expand on this page sidebar"
          aria-controls="docs-on-this-page-aside"
          title="Show table of contents"
        >
          <Bars3BottomRightIcon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      )}
    </>
  );
}
