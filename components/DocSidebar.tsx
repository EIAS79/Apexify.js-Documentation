'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { resolveDocFilename } from '@/lib/doc-filename-aliases';

interface DocFile {
  name: string;
  path: string;
  folder: string;
  filename: string;
}

interface DocSubfolder {
  name: string;
  displayName: string;
  files: DocFile[];
}

interface DocFolder {
  name: string;
  displayName?: string;
  path: string;
  files: DocFile[];
  subfolders?: DocSubfolder[];
}

function subfolderKey(folderName: string, subName: string) {
  return `${folderName}::${subName}`;
}

function initialExpandedState(folderList: DocFolder[], hash: string) {
  const c = resolveDocFilename(hash);
  const expanded: Record<string, boolean> = {};
  const expandedSub: Record<string, boolean> = {};

  for (const folder of folderList) {
    const hit =
      folder.files.some((f) => f.filename === c) ||
      Boolean(folder.subfolders?.some((sub) => sub.files.some((f) => f.filename === c)));

    if (
      folder.name === '05-advanced' ||
      folder.name === '06-internals' ||
      folder.name === '07-contributor-notes'
    ) {
      expanded[folder.name] = hit;
    } else {
      expanded[folder.name] = true;
    }

    if (
      (folder.name === '03-feature-guides' || folder.name === '04-api-reference') &&
      folder.subfolders
    ) {
      for (const sub of folder.subfolders) {
        expandedSub[subfolderKey(folder.name, sub.name)] = true;
      }
    }
  }

  return { expanded, expandedSub };
}

interface DocSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/** Responsive width: readable labels on mobile overlay + wider xl desktop column */
const SIDEBAR_WIDTH_OPEN =
  'w-[min(22rem,calc(100vw-2rem))] lg:w-80 xl:w-96';

export default function DocSidebar({ isOpen = true, onClose }: DocSidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});
  const [activeHash, setActiveHash] = useState<string>('');
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [rootFiles, setRootFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const canonicalActive = resolveDocFilename(activeHash);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
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
      .then((res) => res.json())
      .then((data) => {
        if (data.docs) {
          setFolders(data.docs);
          const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
          const { expanded: ex, expandedSub: sub } = initialExpandedState(data.docs, hash);
          setExpanded(ex);
          setExpandedSub(sub);
        }
        if (data.rootFiles) {
          setRootFiles(data.rootFiles);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading docs:', err);
        setLoading(false);
      });

    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      setActiveHash(hash);

      const syncHashFromLocation = () => {
        const h = window.location.hash.slice(1);
        setActiveHash(h);
      };

      window.addEventListener('hashchange', syncHashFromLocation);
      window.addEventListener('docHashChange', syncHashFromLocation);
      return () => {
        window.removeEventListener('hashchange', syncHashFromLocation);
        window.removeEventListener('docHashChange', syncHashFromLocation);
      };
    }
  }, []);

  useEffect(() => {
    if (folders.length === 0) return;
    const c = canonicalActive;
    const adv = folders.find((f) => f.name === '05-advanced');
    const internal = folders.find((f) => f.name === '06-internals');
    const contrib = folders.find((f) => f.name === '07-contributor-notes');
    const openAdv = adv?.files.some((f) => f.filename === c) ?? false;
    const openInt = internal?.files.some((f) => f.filename === c) ?? false;
    const openCon = contrib?.files.some((f) => f.filename === c) ?? false;
    if (openAdv || openInt || openCon) {
      setExpanded((p) => ({
        ...p,
        ...(openAdv ? { '05-advanced': true } : {}),
        ...(openInt ? { '06-internals': true } : {}),
        ...(openCon ? { '07-contributor-notes': true } : {}),
      }));
    }
  }, [activeHash, folders, canonicalActive]);

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

  const toggleSubExpanded = (folderName: string, subName: string) => {
    const key = subfolderKey(folderName, subName);
    setExpandedSub((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileClick = (filename: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHash(filename);
    if (typeof window !== 'undefined') {
      window.location.hash = filename;
      window.dispatchEvent(new CustomEvent('docHashChange'));
      window.setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      if (isMobile && onClose) {
        window.setTimeout(() => {
          onClose();
        }, 150);
      }
    }
  };

  const renderFile = (file: DocFile, level: number = 0) => {
    const active = canonicalActive === file.filename;
    const tight = level > 0;

    return (
      <Link
        key={`${file.folder}-${file.filename}`}
        href={`/docs#${file.filename}`}
        onClick={(e) => handleFileClick(file.filename, e)}
        className={`group flex items-start gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-sm sm:text-[15px] transition-all duration-150 min-w-0 ${
          tight ? 'ml-1 sm:ml-2' : ''
        } ${
          active
            ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 font-semibold shadow-lg shadow-blue-500/30'
            : 'text-gray-300 hover:text-blue-300 hover:bg-slate-800/60'
        }`}
      >
        {!tight ? (
          <div
            className={`mt-0.5 flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded text-[10px] font-mono font-bold transition-all duration-150 flex-shrink-0 ${
              active
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-slate-800/60 text-gray-400 border border-slate-700/50 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/30'
            }`}
          >
            MD
          </div>
        ) : (
          <span
            className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              active ? 'bg-white/90' : 'bg-slate-500 group-hover:bg-blue-400'
            }`}
            aria-hidden
          />
        )}
        <span className="min-w-0 flex-1 leading-snug break-words text-left">{file.name}</span>
      </Link>
    );
  };

  const folderLabel = (folder: DocFolder) => folder.displayName ?? folder.name;

  const folderEmojiFor = (displayName: string) => {
    const map: Record<string, string> = {
      'Start Here': '🚀',
      'Beginner Guide': '📘',
      Recipes: '🍳',
      'Feature Guides': '📚',
      'API Reference': '📖',
      Advanced: '🧪',
      Internals: '🔧',
      'Contributor Notes': '🧑‍💻',
    };
    return map[displayName] ?? '📁';
  };

  const folderHasActive = (folder: DocFolder): boolean => {
    if (folder.files.some((f) => canonicalActive === f.filename)) return true;
    if (folder.subfolders) {
      return folder.subfolders.some((sub) => sub.files.some((f) => canonicalActive === f.filename));
    }
    return false;
  };

  const renderFolder = (folder: DocFolder) => {
    const isExpanded = expanded[folder.name] ?? false;
    const hasActiveFile = folderHasActive(folder);
    const label = folderLabel(folder);
    const emoji = folderEmojiFor(label);

    return (
      <div key={folder.name} className="mb-1">
        <div className="flex items-start group">
          <button
            type="button"
            onClick={() => toggleExpanded(folder.name)}
            className="mt-2 p-1 shrink-0 hover:bg-slate-800/60 rounded-lg transition-colors duration-150"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors duration-150" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors duration-150" />
            )}
          </button>
          <button
            type="button"
            onClick={() => toggleExpanded(folder.name)}
            className={`flex-1 flex items-start gap-2 py-2.5 px-2 sm:px-3 rounded-lg text-[15px] sm:text-base transition-all duration-150 text-left font-semibold min-w-0 ${
              hasActiveFile && isExpanded
                ? 'text-blue-300 bg-blue-900/40 border border-blue-700/30'
                : hasActiveFile
                  ? 'text-blue-400 bg-blue-900/25'
                  : 'text-gray-300 hover:text-blue-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden>
              {emoji}
            </span>
            <span className="min-w-0 flex-1 leading-snug break-words">{label}</span>
          </button>
        </div>
        {isExpanded && (
          <div className="ml-1 sm:ml-2 mt-1 space-y-0.5 animate-fade-in">
            {folder.files.map((file) => renderFile(file, 1))}
            {folder.subfolders?.map((sub) => {
              const sk = subfolderKey(folder.name, sub.name);
              const subEx = expandedSub[sk] ?? true;
              const subActive = sub.files.some((f) => canonicalActive === f.filename);
              return (
                <div key={sk} className="mb-2 min-w-0">
                  <div className="flex items-start gap-0 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSubExpanded(folder.name, sub.name)}
                      className="mt-1.5 p-1 shrink-0 hover:bg-slate-800/50 rounded-md"
                    >
                      {subEx ? (
                        <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-slate-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSubExpanded(folder.name, sub.name)}
                      className={`min-w-0 flex-1 text-left py-2 px-1 rounded-lg text-sm font-semibold leading-snug break-words ${
                        subActive ? 'text-blue-300 bg-blue-950/40' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sub.displayName}
                    </button>
                  </div>
                  {subEx && (
                    <div className="ml-2 sm:ml-3 space-y-0.5 border-l border-slate-800/80 pl-2 sm:pl-3">
                      {sub.files.map((file) => renderFile(file, 2))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <aside
        className={`fixed left-0 top-16 bottom-0 h-[calc(100vh-4rem)] bg-slate-950/98 backdrop-blur-md border-r border-slate-800/50 overflow-y-auto overflow-x-hidden transition-all duration-300 z-40 ${
          isOpen ? `${SIDEBAR_WIDTH_OPEN} translate-x-0` : '-translate-x-full lg:translate-x-0 lg:w-0'
        }`}
      >
        <div className="p-4">
          <div className="text-gray-400 text-base">Loading...</div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {isCollapsed && !isMobile && (
        <button
          type="button"
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
              ? `${SIDEBAR_WIDTH_OPEN} translate-x-0 overflow-y-auto overflow-x-hidden`
              : '-translate-x-full overflow-hidden'
            : isCollapsed
              ? 'w-0 translate-x-0 overflow-hidden border-r-0'
              : isOpen
                ? `${SIDEBAR_WIDTH_OPEN} translate-x-0 overflow-y-auto overflow-x-hidden`
                : '-translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'
        }`}
      >
        {((isMobile && isOpen) || (!isMobile && !isCollapsed && isOpen)) && (
          <div className="p-3 sm:p-4 overflow-x-hidden min-w-0">
            <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-blue-400" />
                <span className="text-base sm:text-lg font-bold text-gray-300 uppercase tracking-wider mr-1">
                  Documentation
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  v5.3.20
                </span>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors duration-150"
                  aria-label="Collapse sidebar"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 rotate-180 hover:text-white" />
                </button>
              </div>
            </div>

            {isMobile && (
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50 lg:hidden">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Documentation</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors duration-150"
                  aria-label="Close sidebar"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-white" />
                </button>
              </div>
            )}

            <nav className="space-y-1">
              {rootFiles.map((file) => renderFile(file, 0))}
              {folders.map((folder) => renderFolder(folder))}
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}
