'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  XMarkIcon,
  FolderIcon,
  DocumentTextIcon,
  BookOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

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
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        // Reset collapsed state when switching to mobile
        if (mobile) {
          setIsCollapsed(false);
        }
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
      
      // Close sidebar on mobile after clicking a file
      if (isMobile && onClose) {
        setTimeout(() => {
          onClose();
        }, 150);
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
        className={`group flex items-center gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm transition-all duration-150 ${
          level > 0 ? 'ml-6' : ''
        } ${
          active
            ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 font-semibold shadow-lg shadow-blue-500/30'
            : 'text-gray-300 hover:text-blue-300 hover:bg-slate-800/60'
        }`}
      >
        {/* MDX/MD File Icon Badge */}
        <div className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-mono font-bold transition-all duration-150 ${
          active 
            ? 'bg-white/20 text-white border border-white/30' 
            : 'bg-slate-800/60 text-gray-400 border border-slate-700/50 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/30'
        }`}>
          MD
        </div>
        <span>{file.name}</span>
      </Link>
    );
  };

  const renderFolder = (folder: DocFolder) => {
    const isExpanded = expanded[folder.name] ?? false;
    const hasActiveFile = folder.files.some(f => activeHash === f.filename);

    // Map folder names to emojis for better visual appeal
    const folderEmoji: Record<string, string> = {
      'Background': '🎨',
      'Charts': '📊',
      'Custom': '✨',
      'Extras': '🎯',
      'Image': '🖼️',
      'Text': '📝',
      'Video': '🎬',
    };

    const emoji = folderEmoji[folder.name] || '📁';

    return (
      <div key={folder.name} className="mb-1">
        <div className="flex items-center group">
          <button
            onClick={() => toggleExpanded(folder.name)}
            className="p-1 hover:bg-slate-800/60 rounded-lg transition-colors duration-150"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors duration-150" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors duration-150" />
            )}
          </button>
          <button
            onClick={() => toggleExpanded(folder.name)}
            className={`flex-1 flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm transition-all duration-150 text-left font-semibold ${
              hasActiveFile && isExpanded
                ? 'text-blue-300 bg-blue-900/40 border border-blue-700/30'
                : hasActiveFile
                ? 'text-blue-400 bg-blue-900/25'
                : 'text-gray-300 hover:text-blue-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-base">{emoji}</span>
            <FolderIcon className={`h-4 w-4 flex-shrink-0 transition-colors duration-150 ${
              hasActiveFile ? 'text-blue-400' : 'text-gray-500 group-hover:text-blue-400'
            }`} />
            <span>{folder.name}</span>
          </button>
        </div>
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-0.5 animate-fade-in">
            {folder.files.map((file) => renderFile(file, 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <aside className={`fixed left-0 top-16 bottom-0 h-[calc(100vh-4rem)] bg-slate-950/98 backdrop-blur-md border-r border-slate-800/50 overflow-y-auto transition-all duration-300 z-40 ${
        isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0'
      }`}>
        <div className="p-4">
          <div className="text-gray-400 text-base">Loading...</div>
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
          className="fixed left-4 top-24 z-[60] p-3 bg-slate-950 hover:bg-slate-900 rounded-lg border border-slate-800 transition-all duration-200 shadow-xl hover:scale-110 backdrop-blur-sm"
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-300 hover:text-white" />
        </button>
      )}
      
      <aside 
        data-sidebar="left"
        className={`fixed left-0 top-16 bottom-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/95 backdrop-blur-xl border-r border-slate-800/60 transition-all duration-300 z-40 shadow-xl lg:shadow-none ${
          isMobile
            ? isOpen
              ? 'w-64 translate-x-0 overflow-y-auto'
              : '-translate-x-full overflow-hidden'
            : isCollapsed
            ? 'w-0 translate-x-0 overflow-hidden border-r-0'
            : isOpen
            ? 'w-64 translate-x-0 overflow-y-auto'
            : '-translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'
        }`}>
        {/* Sidebar content - show when open (or when not collapsed on desktop) */}
        {((isMobile && isOpen) || (!isMobile && !isCollapsed && isOpen)) && (
          <div className="p-4">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                  Documentation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  v5.1.0
                </span>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors duration-150"
                  aria-label="Collapse sidebar"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 rotate-180 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Mobile close button */}
            {isMobile && (
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50 lg:hidden">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                    Documentation
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors duration-150"
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-white" />
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
