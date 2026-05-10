'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import DocSidebar from '@/components/DocSidebar';
import DocLayout from '@/components/DocLayout';
import { DocBreadcrumbs } from '@/components/docs/DocBreadcrumbs';
import { DocPager } from '@/components/docs/DocPager';
import { MDXContentRenderer } from './MDXContentRenderer';
import { useSidebar } from '@/contexts/SidebarContext';
import { resolveDocFilename } from '@/lib/doc-filename-aliases';
import { extractHeadingsFromMdxRaw } from '@/lib/docs-heading-utils';
import {
  DocFile,
  DocFolder,
  flattenDocs,
  findDocEntry,
  neighborsFor,
} from '@/lib/docs-nav-utils';

export default function DocsHome() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hashWarning, setHashWarning] = useState<string | null>(null);
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [rootFiles, setRootFiles] = useState<DocFile[]>([]);
  const [activeFilename, setActiveFilename] = useState<string>('start-here');
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  const flatDocs = useMemo(() => flattenDocs(folders, rootFiles), [folders, rootFiles]);
  const activeEntry = useMemo(
    () => findDocEntry(flatDocs, activeFilename),
    [flatDocs, activeFilename]
  );
  const neighbors = useMemo(
    () => neighborsFor(flatDocs, activeFilename),
    [flatDocs, activeFilename]
  );

  /** Fetch tree once for breadcrumb / pager metadata. */
  useEffect(() => {
    let cancelled = false;
    fetch('/api/docs')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d.docs)) setFolders(d.docs);
        if (Array.isArray(d.rootFiles)) setRootFiles(d.rootFiles);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadDoc = async () => {
      let hash = window.location.hash.slice(1);

      if (!hash) {
        const base = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, '', `${base}#start-here`);
        hash = 'start-here';
        window.dispatchEvent(new CustomEvent('docHashChange'));
      }

      const fetchName = resolveDocFilename(hash);
      setActiveFilename(fetchName);

      setLoading(true);
      try {
        const response = await fetch(`/api/docs?filename=${encodeURIComponent(fetchName)}`);
        const data = await response.json();

        if (data.content) {
          setContent(data.content);
          setHashWarning(null);
          return;
        }

        if (fetchName !== 'start-here') {
          const res2 = await fetch(`/api/docs?filename=${encodeURIComponent('start-here')}`);
          const data2 = await res2.json();
          if (data2.content) {
            const base = `${window.location.pathname}${window.location.search}`;
            window.history.replaceState(null, '', `${base}#start-here`);
            window.dispatchEvent(new CustomEvent('docHashChange'));
            setActiveFilename('start-here');
            setContent(data2.content);
            setHashWarning(`No documentation section matches "${hash}". Showing Start Here.`);
            return;
          }
        }

        setContent('');
        setHashWarning(null);
      } catch (error) {
        console.error('Error loading doc:', error);
        setContent('');
        setHashWarning(null);
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
    window.addEventListener('hashchange', loadDoc);
    return () => window.removeEventListener('hashchange', loadDoc);
  }, []);

  const headings = extractHeadingsFromMdxRaw(content);

  if (loading) {
    return (
      <>
        <DocSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <DocLayout headings={[]}>
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div
                className="h-12 w-12 animate-spin rounded-full"
                style={{
                  border: '3px solid color-mix(in srgb, var(--accent-iris) 25%, transparent)',
                  borderTopColor: 'var(--accent-iris)',
                }}
              />
              <div
                className="absolute inset-0 h-12 w-12 animate-spin rounded-full"
                style={{
                  border: '3px solid color-mix(in srgb, var(--accent-magenta) 22%, transparent)',
                  borderRightColor: 'var(--accent-magenta)',
                  animationDirection: 'reverse',
                  animationDuration: '1.4s',
                }}
              />
            </div>
            <p className="mt-6 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Loading documentation…
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              One moment.
            </p>
          </div>
        </DocLayout>
      </>
    );
  }

  if (!content) {
    return (
      <>
        <DocSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <DocLayout headings={[]}>
          <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
            <span
              aria-hidden
              className="mb-6 grid h-16 w-16 place-items-center rounded-2xl"
              style={{
                background: 'var(--gradient-sunset)',
                color: 'white',
                boxShadow: 'var(--glow-magenta)',
              }}
            >
              <ExclamationTriangleIcon className="h-8 w-8" />
            </span>
            <h1
              className="mb-3 text-3xl font-black sm:text-4xl text-grad-aurora"
            >
              Documentation unavailable
            </h1>
            <p className="mb-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <code style={{ color: 'var(--text-secondary)' }}>Start Here</code> could not be loaded. Confirm that{' '}
              <code style={{ color: 'var(--text-secondary)' }}>/api/docs</code> can read{' '}
              <code style={{ color: 'var(--text-secondary)' }}>content/docs</code>.
            </p>
            <Link
              href="/docs#start-here"
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.1rem' }}
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden />
              Retry Start Here
            </Link>
          </div>
        </DocLayout>
      </>
    );
  }

  return (
    <>
      <DocSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <DocLayout headings={headings}>
        <DocBreadcrumbs entry={activeEntry} />

        {hashWarning && (
          <div
            className="not-prose mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--warning) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning) 38%, transparent)',
              color: 'var(--text-primary)',
            }}
          >
            <ExclamationTriangleIcon
              className="h-5 w-5 shrink-0"
              style={{ color: 'var(--warning)' }}
              aria-hidden
            />
            <span>{hashWarning}</span>
          </div>
        )}

        {flatDocs.length === 0 && (
          <div
            className="not-prose mb-5 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-iris) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-iris) 26%, transparent)',
              color: 'var(--text-secondary)',
            }}
          >
            <BookOpenIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--accent-iris)' }} aria-hidden />
            <span>Indexing documentation…</span>
          </div>
        )}

        <div className="prose prose-xl max-w-none">
          <div className="markdown-content" data-doc-article>
            <MDXContentRenderer content={content} headings={headings} />
          </div>
          <DocPager neighbors={neighbors} />
        </div>
      </DocLayout>
    </>
  );
}
