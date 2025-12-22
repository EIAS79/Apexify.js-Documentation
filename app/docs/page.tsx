'use client';

import { useEffect, useState } from 'react';
import DocSidebar from '@/components/DocSidebar';
import DocLayout from '@/components/DocLayout';
import { MDXContentRenderer } from './MDXContentRenderer';
import { useSidebar } from '@/contexts/SidebarContext';

export default function DocsHome() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasHash, setHasHash] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadDoc = async () => {
      let hash = window.location.hash.slice(1);
      
      if (!hash) {
        window.location.hash = '#Getting-Started';
        hash = 'Getting-Started';
      }
      
      if (hash === currentHash && content) {
        return;
      }
      
      setCurrentHash(hash);
      setHasHash(!!hash);

      setLoading(true);
      try {
        const response = await fetch(`/api/docs?filename=${hash}`);
        const data = await response.json();
        if (data.content) {
          setContent(data.content);
        } else {
          setContent('');
        }
      } catch (error) {
        console.error('Error loading doc:', error);
        setContent('');
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
    
    window.addEventListener('hashchange', loadDoc);
    
    const handleCustomHashChange = () => {
      loadDoc();
    };
    window.addEventListener('docHashChange', handleCustomHashChange);
    
    const interval = setInterval(() => {
      const newHash = window.location.hash.slice(1);
      if (newHash !== currentHash) {
        loadDoc();
      }
    }, 200);
    
    return () => {
      window.removeEventListener('hashchange', loadDoc);
      window.removeEventListener('docHashChange', handleCustomHashChange);
      clearInterval(interval);
    };
  }, [currentHash, content]);

  const headingMatches = content.matchAll(/^(#{1,3})\s+(.+)$/gm);
  const headings = Array.from(headingMatches).map((match) => ({
    id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    text: match[2],
    level: match[1].length,
  }));

  if (loading) {
    return (
      <>
        <DocSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <DocLayout headings={[]}>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
              <div className="absolute inset-0 inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-r-purple-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
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
              Documentation Not Found
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              The requested documentation page could not be found.
            </p>
            <a
              href="/docs#Getting-Started"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-150 shadow-lg"
            >
              Go to Getting Started
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
          <div className="markdown-content">
            <MDXContentRenderer content={content} />
          </div>
        </div>
      </DocLayout>
    </>
  );
}
