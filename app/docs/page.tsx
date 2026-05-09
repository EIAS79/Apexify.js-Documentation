'use client';

import { useEffect, useState } from 'react';
import DocSidebar from '@/components/DocSidebar';
import DocLayout from '@/components/DocLayout';
import { MDXContentRenderer } from './MDXContentRenderer';
import { useSidebar } from '@/contexts/SidebarContext';
import { resolveDocFilename } from '@/lib/doc-filename-aliases';
import { extractHeadingsFromMdxRaw } from '@/lib/docs-heading-utils';

export default function DocsHome() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hashWarning, setHashWarning] = useState<string | null>(null);
  const { sidebarOpen, setSidebarOpen } = useSidebar();

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

    return () => {
      window.removeEventListener('hashchange', loadDoc);
    };
  }, []);

  const headings = extractHeadingsFromMdxRaw(content);

  if (loading) {
    return (
      <>
        <DocSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <DocLayout headings={[]}>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
              <div
                className="absolute inset-0 inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-r-purple-500"
                style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
              />
            </div>
            <div className="text-blue-300 font-semibold mt-6 text-lg">Loading documentation...</div>
            <div className="text-gray-500 text-sm mt-2">Please wait a moment</div>
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
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📚</div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
              Documentation unavailable
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Start Here could not be loaded. Check that /api/docs can read content/docs.
            </p>
            <a
              href="/docs#start-here"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-150 shadow-lg"
            >
              Retry Start Here
            </a>
          </div>
        </DocLayout>
      </>
    );
  }

  return (
    <>
      <DocSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <DocLayout headings={headings}>
        <div className="prose prose-xl dark:prose-invert max-w-none">
          {hashWarning ? (
            <div className="mb-4 rounded-lg border border-amber-500/35 bg-amber-950/35 px-4 py-3 text-amber-100 text-sm font-medium not-prose">
              {hashWarning}
            </div>
          ) : null}
          <div className="markdown-content" data-doc-article>
            <MDXContentRenderer content={content} headings={headings} />
          </div>
        </div>
      </DocLayout>
    </>
  );
}
