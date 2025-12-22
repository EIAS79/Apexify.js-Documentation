'use client';

import { useEffect, useState } from 'react';
import DocSidebar from '@/components/DocSidebar';
import DocLayout from '@/components/DocLayout';
import { MDXContentRenderer } from './MDXContentRenderer';

export default function DocsHome() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasHash, setHasHash] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadDoc = async () => {
      let hash = window.location.hash.slice(1);
      
      if (!hash) {
        window.location.hash = '#Getting-started';
        hash = 'Getting-started';
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
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <div className="text-gray-600 dark:text-gray-400 mt-4">Loading...</div>
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
          <div className="text-center py-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Documentation Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400">The requested documentation page could not be found.</p>
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
