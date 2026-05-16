'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { resolveDocFilename } from '@/lib/doc-filename-aliases';
import {
  countSectionFiles,
  DocFile,
  DocFolder,
  DocSubfolder,
  sectionAccent,
} from '@/lib/docs-nav-utils';
import { SectionAccentIcon } from '@/components/docs/SectionAccentIcon';

/** Full path under the section, e.g. `video-ffmpeg` or `video-ffmpeg/options`. */
function subfolderKey(folderName: string, pathUnderSection: string) {
  return `${folderName}::${pathUnderSection}`;
}

/** Advanced docs use recursive topic trees (`scene/`, `composition/`, …) for both prefixes. */
function isRecursiveAdvancedDocs(folderName: string): boolean {
  return folderName === '04-advanced' || folderName === '05-advanced';
}

function subfolderContainsActiveDoc(sub: DocSubfolder, canonicalFilename: string): boolean {
  if (sub.files.some((f) => f.filename === canonicalFilename)) return true;
  return sub.subfolders?.some((s) => subfolderContainsActiveDoc(s, canonicalFilename)) ?? false;
}

function walkFeatureSubfoldersSetExpanded(
  folderName: string,
  sub: DocSubfolder,
  pathPrefix: string,
  expandedSub: Record<string, boolean>,
) {
  const segmentPath = pathPrefix ? `${pathPrefix}/${sub.name}` : sub.name;
  expandedSub[subfolderKey(folderName, segmentPath)] = true;
  sub.subfolders?.forEach((ch) =>
    walkFeatureSubfoldersSetExpanded(folderName, ch, segmentPath, expandedSub),
  );
}

function initialExpandedState(folderList: DocFolder[], hash: string) {
  const c = resolveDocFilename(hash);
  const expanded: Record<string, boolean> = {};
  const expandedSub: Record<string, boolean> = {};

  for (const folder of folderList) {
    const hit =
      folder.files.some((f) => f.filename === c) ||
      Boolean(folder.subfolders?.some((sub) => subfolderContainsActiveDoc(sub, c)));

    if (
      isRecursiveAdvancedDocs(folder.name) ||
      folder.name === '06-internals' ||
      folder.name === '07-contributor-notes'
    ) {
      expanded[folder.name] = hit;
    } else {
      expanded[folder.name] = true;
    }

    if (
      (folder.name === '03-feature-guides' ||
        folder.name === '04-api-reference' ||
        isRecursiveAdvancedDocs(folder.name)) &&
      folder.subfolders
    ) {
      if (folder.name === '03-feature-guides' || isRecursiveAdvancedDocs(folder.name)) {
        for (const sub of folder.subfolders) {
          walkFeatureSubfoldersSetExpanded(folder.name, sub, '', expandedSub);
        }
      } else {
        for (const sub of folder.subfolders) {
          expandedSub[subfolderKey(folder.name, sub.name)] = true;
        }
      }
    }
  }

  return { expanded, expandedSub };
}

interface DocSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SIDEBAR_WIDTH_OPEN = 'w-[min(22rem,calc(100vw-2rem))] lg:w-80 xl:w-[22rem]';

export default function DocSidebar({ isOpen = true, onClose }: DocSidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedSub, setExpandedSub] = useState<Record<string, boolean>>({});
  const [activeHash, setActiveHash] = useState<string>('');
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [rootFiles, setRootFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const canonicalActive = resolveDocFilename(activeHash);

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
      .then((res) => res.json())
      .then((data) => {
        if (data.docs) {
          setFolders(data.docs);
          const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
          const { expanded: ex, expandedSub: sub } = initialExpandedState(data.docs, hash);
          setExpanded(ex);
          setExpandedSub(sub);
        }
        if (data.rootFiles) setRootFiles(data.rootFiles);
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
        setActiveHash(window.location.hash.slice(1));
      };

      window.addEventListener('hashchange', syncHashFromLocation);
      window.addEventListener('docHashChange', syncHashFromLocation);
      return () => {
        window.removeEventListener('hashchange', syncHashFromLocation);
        window.removeEventListener('docHashChange', syncHashFromLocation);
      };
    }
  }, []);

  /** Auto-expand sections when the active doc lives under a collapsed branch. */
  useEffect(() => {
    if (folders.length === 0) return;
    const c = canonicalActive;
    const advSections = folders.filter((f) => isRecursiveAdvancedDocs(f.name));
    const internal = folders.find((f) => f.name === '06-internals');
    const contrib = folders.find((f) => f.name === '07-contributor-notes');
    const expandedAdvPatches: Record<string, boolean> = {};
    let openAdv = false;
    for (const adv of advSections) {
      const hit =
        adv.files.some((f) => f.filename === c) ||
        (adv.subfolders?.some((sub) => subfolderContainsActiveDoc(sub, c)) ?? false);
      if (hit) {
        openAdv = true;
        expandedAdvPatches[adv.name] = true;
      }
    }
    const openInt = internal?.files.some((f) => f.filename === c) ?? false;
    const openCon = contrib?.files.some((f) => f.filename === c) ?? false;
    if (openAdv || openInt || openCon) {
      setExpanded((p) => ({
        ...p,
        ...(openAdv ? expandedAdvPatches : {}),
        ...(openInt ? { '06-internals': true } : {}),
        ...(openCon ? { '07-contributor-notes': true } : {}),
      }));
    }
  }, [activeHash, folders, canonicalActive]);

  useEffect(() => {
    if (folders.length === 0) return;
    const c = canonicalActive;

    const expandNested = (section: '03-feature-guides' | '04-advanced' | '05-advanced') => {
      const folder = folders.find((f) => f.name === section);
      if (!folder?.subfolders?.length) return;

      const keysToOpen: string[] = [];
      const collect = (sub: DocSubfolder, prefix: string) => {
        const segmentPath = prefix ? `${prefix}/${sub.name}` : sub.name;
        if (subfolderContainsActiveDoc(sub, c)) {
          keysToOpen.push(subfolderKey(section, segmentPath));
        }
        sub.subfolders?.forEach((ch) => collect(ch, segmentPath));
      };
      folder.subfolders.forEach((sub) => collect(sub, ''));
      if (keysToOpen.length === 0) return;

      setExpandedSub((prev) => {
        const next = { ...prev };
        for (const k of keysToOpen) next[k] = true;
        return next;
      });
      setExpanded((p) => ({ ...p, [section]: true }));
    };

    expandNested('03-feature-guides');
    expandNested('04-advanced');
    expandNested('05-advanced');
  }, [canonicalActive, folders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (hash && pathname === '/docs') setActiveHash(hash);
    }
  }, [pathname]);

  const toggleExpanded = (folderName: string) =>
    setExpanded((prev) => ({ ...prev, [folderName]: !prev[folderName] }));

  const toggleSubExpanded = (folderName: string, pathUnderSection: string) => {
    const key = subfolderKey(folderName, pathUnderSection);
    setExpandedSub((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileClick = (filename: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHash(filename);
    if (typeof window !== 'undefined') {
      window.location.hash = filename;
      window.dispatchEvent(new CustomEvent('docHashChange'));
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      if (isMobile && onClose) {
        window.setTimeout(() => onClose(), 150);
      }
    }
  };

  const renderFile = (file: DocFile, level: number = 0, accentColor?: string) => {
    const active = canonicalActive === file.filename;
    const tight = level > 0;

    return (
      <Link
        key={`${file.folder}-${file.filename}`}
        href={`/docs#${file.filename}`}
        onClick={(e) => handleFileClick(file.filename, e)}
        className={`group relative flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
          tight ? 'ml-1 sm:ml-2' : ''
        }`}
        style={{
          color: active ? 'white' : 'var(--text-secondary)',
          background: active
            ? 'var(--gradient-sunset)'
            : 'transparent',
          fontWeight: active ? 600 : 500,
          boxShadow: active ? 'var(--glow-magenta)' : 'none',
        }}
      >
        <span
          className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full transition-all"
          aria-hidden
          style={{
            backgroundColor: active
              ? 'rgba(255,255,255,0.95)'
              : accentColor ?? 'var(--border-strong)',
            opacity: active ? 1 : 0.55,
          }}
        />
        <span className="min-w-0 flex-1 break-words leading-snug">{file.name}</span>
      </Link>
    );
  };

  const folderLabel = (folder: DocFolder) => folder.displayName ?? folder.name;

  const folderHasActive = (folder: DocFolder): boolean => {
    if (folder.files.some((f) => canonicalActive === f.filename)) return true;
    return folder.subfolders?.some((sub) => subfolderContainsActiveDoc(sub, canonicalActive)) ?? false;
  };

  const renderApiReferenceSubfolder = (folderName: string, sub: DocSubfolder, accentColor: string) => {
    const sk = subfolderKey(folderName, sub.name);
    const subEx = expandedSub[sk] ?? true;
    const subActive = sub.files.some((f) => canonicalActive === f.filename);
    return (
      <div key={sk} className="mb-1.5 min-w-0">
        <button
          type="button"
          onClick={() => toggleSubExpanded(folderName, sub.name)}
          className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[12px] font-semibold transition-colors"
          style={{
            color: subActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
            backgroundColor: subActive
              ? 'color-mix(in srgb, var(--accent-iris) 12%, transparent)'
              : 'transparent',
          }}
        >
          {subEx ? (
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 flex-1 break-words leading-snug">{sub.displayName}</span>
        </button>
        {subEx && (
          <div
            className="ml-2 mt-1 space-y-0.5 pl-2.5"
            style={{ borderLeft: '1px solid var(--border-subtle)' }}
          >
            {sub.files.map((file) => renderFile(file, 2, accentColor))}
          </div>
        )}
      </div>
    );
  };

  const renderFeatureGuideSubTree = (
    folderName: string,
    pathPrefix: string,
    sub: DocSubfolder,
    fileIndentLevel: number,
    accentColor: string,
  ): ReactNode => {
    const segmentPath = pathPrefix ? `${pathPrefix}/${sub.name}` : sub.name;
    const sk = subfolderKey(folderName, segmentPath);
    const subEx = expandedSub[sk] ?? true;
    const subActive = subfolderContainsActiveDoc(sub, canonicalActive);
    return (
      <div key={sk} className="mb-1.5 min-w-0">
        <button
          type="button"
          onClick={() => toggleSubExpanded(folderName, segmentPath)}
          className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[12px] font-semibold transition-colors"
          style={{
            color: subActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
            backgroundColor: subActive
              ? 'color-mix(in srgb, var(--accent-iris) 12%, transparent)'
              : 'transparent',
          }}
        >
          {subEx ? (
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 flex-1 break-words leading-snug">{sub.displayName}</span>
        </button>
        {subEx && (
          <div
            className="ml-2 mt-1 space-y-0.5 pl-2.5"
            style={{ borderLeft: '1px solid var(--border-subtle)' }}
          >
            {sub.files.map((file) => renderFile(file, fileIndentLevel, accentColor))}
            {sub.subfolders?.map((nested) =>
              renderFeatureGuideSubTree(folderName, segmentPath, nested, fileIndentLevel + 1, accentColor),
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFolder = (folder: DocFolder) => {
    const isExpanded = expanded[folder.name] ?? false;
    const hasActiveFile = folderHasActive(folder);
    const label = folderLabel(folder);
    const accent = sectionAccent(folder.name);
    const total = countSectionFiles(folder);

    return (
      <div key={folder.name} className="mb-1">
        <button
          type="button"
          onClick={() => toggleExpanded(folder.name)}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors"
          style={{
            color: hasActiveFile ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: hasActiveFile
              ? 'color-mix(in srgb, var(--accent-iris) 12%, transparent)'
              : 'transparent',
          }}
        >
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold"
            aria-hidden
            style={{
              background: hasActiveFile
                ? 'var(--gradient-sunset)'
                : `color-mix(in srgb, ${accent.color} 18%, transparent)`,
              color: hasActiveFile ? 'white' : accent.color,
              border: `1px solid color-mix(in srgb, ${accent.color} 35%, transparent)`,
              boxShadow: hasActiveFile ? 'var(--glow-magenta)' : 'none',
            }}
          >
            <SectionAccentIcon sectionName={folder.name} className="h-4 w-4 shrink-0" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-snug">
            {label}
          </span>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-sunken) 80%, transparent)',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {total}
          </span>
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} aria-hidden />
          ) : (
            <ChevronRightIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} aria-hidden />
          )}
        </button>
        {isExpanded && (
          <div className="mt-1 ml-1 space-y-0.5 sm:ml-2">
            {folder.files.map((file) => renderFile(file, 1, accent.color))}
            {folder.subfolders?.map((sub) =>
              folder.name === '03-feature-guides' || isRecursiveAdvancedDocs(folder.name)
                ? renderFeatureGuideSubTree(folder.name, '', sub, 2, accent.color)
                : renderApiReferenceSubfolder(folder.name, sub, accent.color),
            )}
          </div>
        )}
      </div>
    );
  };

  const visible = isMobile ? isOpen : isOpen;

  return (
    <>
      {isOpen && isMobile && (
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
        className={`fixed left-0 top-16 bottom-0 z-40 h-[calc(100vh-4rem)] transition-transform duration-300 ${
          visible ? `${SIDEBAR_WIDTH_OPEN} translate-x-0` : '-translate-x-full lg:translate-x-0 lg:w-0'
        }`}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-raised) 92%, transparent)',
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          borderRight: visible ? '1px solid var(--border-default)' : 'none',
          boxShadow: visible ? 'var(--shadow-md)' : 'none',
          overflow: visible ? 'auto' : 'hidden',
        }}
      >
        {visible && (
          <div className="min-w-0 px-3 pb-8 pt-4 sm:px-4">
            {isMobile && (
              <div
                className="mb-3 flex items-center justify-between pb-3"
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
            )}

            {loading ? (
              <div className="space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="h-9 animate-pulse rounded-xl"
                    style={{
                      backgroundColor: 'var(--bg-sunken)',
                      opacity: 1 - i * 0.08,
                    }}
                  />
                ))}
              </div>
            ) : (
              <nav className="space-y-1">
                {rootFiles.length > 0 && (
                  <div className="mb-2">
                    {rootFiles.map((file) => renderFile(file, 0, 'var(--accent-iris)'))}
                  </div>
                )}
                {folders.map((folder) => renderFolder(folder))}
              </nav>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
