'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DocsSidebarSearch } from '@/components/docs/DocsSidebarSearch';
import type { DocumentationNavigationGroup } from '@/lib/docs/navigation';

const SIDEBAR_WIDTH_OPEN = 'w-[min(22rem,calc(100vw-2rem))] lg:w-80 xl:w-[22rem]';

export function RouteDocSidebar({
  groups,
  isOpen,
  onClose,
}: {
  groups: DocumentationNavigationGroup[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const visible = isOpen;

  return (
    <>
      {visible && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={onClose}
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-base) 60%, black)',
            backdropFilter: 'blur(4px)',
          }}
          aria-hidden
        />
      )}

      <aside
        data-sidebar="left"
        data-doc1-route-sidebar
        className={`fixed bottom-0 left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col overflow-hidden transition-transform duration-300 ${
          visible ? `${SIDEBAR_WIDTH_OPEN} translate-x-0` : '-translate-x-full lg:translate-x-0 lg:w-0'
        }`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-raised) 92%, transparent)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          borderRight: visible ? '1px solid var(--border-default)' : 'none',
          boxShadow: visible ? 'var(--shadow-md)' : 'none',
        }}
      >
        {visible && (
          <div className="apex-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
            <div className="min-w-0 px-3 pb-8 pt-4 sm:px-4">
              <div
                className="mb-3 flex items-center justify-between pb-3 lg:hidden"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Documentation
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-md transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <nav aria-label="Documentation" className="space-y-4">
                <DocsSidebarSearch />
                {groups.map((group) => (
                  <section key={group.id} aria-labelledby={`docs-nav-${group.id}`}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 px-2">
                      <h2
                        id={`docs-nav-${group.id}`}
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {group.label}
                      </h2>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
                        style={{
                          backgroundColor: 'var(--bg-sunken)',
                          color: 'var(--text-tertiary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {group.items.length}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors"
                            style={{
                              color: active ? 'white' : 'var(--text-secondary)',
                              background: active ? 'var(--gradient-sunset)' : 'transparent',
                              fontWeight: active ? 600 : 500,
                              boxShadow: active ? 'var(--glow-magenta)' : 'none',
                            }}
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: active
                                  ? 'rgba(255,255,255,0.95)'
                                  : 'var(--accent-iris)',
                                opacity: active ? 1 : 0.6,
                              }}
                            />
                            <span className="min-w-0 flex-1 leading-snug">
                              <span className="block">{item.title}</span>
                              <span
                                className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide"
                                style={{ color: active ? 'rgba(255,255,255,0.76)' : 'var(--text-muted)' }}
                              >
                                {item.package} · {item.stability}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}

                <div
                  className="mt-4 rounded-xl p-3 text-[11px] leading-relaxed"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-iris) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent-iris) 22%, transparent)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  DOC-1 is migrating the corpus in controlled slices. Unmigrated pages remain available through{' '}
                  <Link href="/docs#feature-guides-hub" style={{ color: 'var(--accent-iris)' }}>
                    legacy documentation
                  </Link>{' '}
                  until the later content-migration phase.
                </div>
              </nav>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
