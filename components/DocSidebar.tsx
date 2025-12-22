'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DocFile {
  name: string;
  path: string;
  folder: string;
  filename: string;
}

interface DocFolder {
  name: string;
  path: string;
  files: DocFile[];
}

interface DocSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DocSidebar({ isOpen = true, onClose }: DocSidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeHash, setActiveHash] = useState<string>('');
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [rootFiles, setRootFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        if (data.docs) {
          setFolders(data.docs);
          if (data.docs.length > 0) {
            setExpanded({ [data.docs[0].name]: true });
          }
        }
        if (data.rootFiles) {
          setRootFiles(data.rootFiles);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading docs:', err);
        setLoading(false);
      });

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveHash(hash);
        setFolders(prev => {
          prev.forEach(folder => {
            const file = folder.files.find(f => f.filename === hash);
            if (file) {
              setExpanded(p => ({ ...p, [folder.name]: true }));
            }
          });
          return prev;
        });
      }

      const handleHashChange = () => {
        const hash = window.location.hash.slice(1);
        setActiveHash(hash);
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (hash && pathname === '/docs') {
        setActiveHash(hash);
      }
    }
  }, [pathname]);

  const toggleExpanded = (folderName: string) => {
    setExpanded((prev) => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const handleFileClick = (filename: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHash(filename);
    if (typeof window !== 'undefined') {
      window.location.hash = filename;
      window.dispatchEvent(new CustomEvent('docHashChange'));
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      if (window.innerWidth < 1024 && onClose) {
        onClose();
      }
    }
  };

  const renderFile = (file: DocFile, level: number = 0) => {
    const active = activeHash === file.filename;
    
    return (
      <Link
        key={file.filename}
        href={`/docs#${file.filename}`}
        onClick={(e) => handleFileClick(file.filename, e)}
        className={`block py-2 px-3 rounded-lg text-sm transition-all duration-200 ${
          level > 0 ? 'ml-4' : ''
        } ${
          active
            ? 'text-white bg-gradient-to-r from-blue-500 to-purple-500 font-medium shadow-md'
            : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800'
        }`}
      >
        {file.name}
      </Link>
    );
  };

  const renderFolder = (folder: DocFolder) => {
    const isExpanded = expanded[folder.name] ?? false;
    const hasActiveFile = folder.files.some(f => activeHash === f.filename);

    return (
      <div key={folder.name}>
        <div className="flex items-center">
          <button
            onClick={() => toggleExpanded(folder.name)}
            className="p-1.5 hover:bg-gray-800 rounded-lg mr-1 transition-colors duration-200"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400 transition-transform duration-200" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 transition-transform duration-200" />
            )}
          </button>
          <button
            onClick={() => toggleExpanded(folder.name)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all duration-200 text-left font-medium ${
              hasActiveFile && isExpanded
                ? 'text-blue-400 bg-blue-900/20'
                : hasActiveFile
                ? 'text-blue-400 bg-blue-900/10'
                : 'text-gray-300 hover:text-blue-400 hover:bg-gray-800'
            }`}
          >
            {folder.name}
          </button>
        </div>
        {isExpanded && (
          <div className="ml-2 mt-1 space-y-1 animate-fade-in">
            {folder.files.map((file) => renderFile(file, 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <aside className={`fixed left-0 top-16 bottom-0 h-[calc(100vh-4rem)] bg-gray-900/95 backdrop-blur-md border-r border-gray-800 overflow-y-auto transition-all duration-300 z-40 ${
        isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0'
      }`}>
        <div className="p-4">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Expand button when collapsed (floating icon) - OUTSIDE the sidebar */}
      {isCollapsed && !isMobile && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed left-4 top-24 z-[60] p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all duration-200 shadow-xl hover:scale-110 backdrop-blur-sm"
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-300 hover:text-white" />
        </button>
      )}
      
      <aside 
        data-sidebar="left"
        className={`fixed left-0 top-16 bottom-0 h-[calc(100vh-4rem)] bg-gray-900/95 backdrop-blur-md border-r border-gray-800 transition-all duration-300 z-40 shadow-lg lg:shadow-none ${
          isOpen && !isCollapsed
            ? 'w-64 translate-x-0 overflow-y-auto' 
            : isCollapsed && !isMobile
            ? 'w-0 translate-x-0 overflow-hidden border-r-0'
            : '-translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-r-0'
        }`}>
        {/* Collapse/Expand button (desktop only) - only show when not collapsed */}
        {!isCollapsed && isOpen && (
          <div className="p-4">
            <div className="hidden lg:flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                v5.1.0
              </span>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                aria-label="Collapse sidebar"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-400 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar content - only show when not collapsed */}
        {!isCollapsed && isOpen && (
          <div className="p-4">

            {/* Mobile close button */}
            {isMobile && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Documentation
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            )}

            <nav className="space-y-1">
              {/* Render root-level files first */}
              {rootFiles.map((file) => renderFile(file, 0))}
              
              {/* Render folders */}
              {folders.map((folder) => renderFolder(folder))}
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}
