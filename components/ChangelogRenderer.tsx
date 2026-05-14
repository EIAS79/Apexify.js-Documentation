'use client';

import { useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  BoltIcon, 
  CubeIcon, 
  WrenchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
  CalendarIcon,
  PhotoIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CpuChipIcon,
  SparklesIcon,
  PaintBrushIcon,
  FilmIcon,
  CommandLineIcon,
  CodeBracketIcon,
  BeakerIcon,
  AdjustmentsHorizontalIcon,
  RectangleStackIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface SubsectionItem {
  content: string;
  subItems?: string[];
}

interface Subsection {
  title: string;
  items: SubsectionItem[];
}

interface ChangeSection {
  type: string;
  subsections: Subsection[];
  flatItems?: string[]; // For sections without subsections
}

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  /** Intro text, tables, or other content before the first ### section. */
  preamble?: string;
  changes: {
    added?: ChangeSection | string[];
    fixed?: ChangeSection | string[];
    changed?: ChangeSection | string[];
    improved?: ChangeSection | string[];
    enhanced?: ChangeSection | string[];
    removed?: ChangeSection | string[];
    features?: ChangeSection | string[];
    breaking?: ChangeSection | string[];
    migration?: ChangeSection | string[];
    deprecated?: ChangeSection | string[];
    security?: ChangeSection | string[];
    [key: string]: ChangeSection | string[] | undefined;
  };
}

interface ChangelogRendererProps {
  content: string;
}

const typeConfig = {
  major: {
    label: 'Major Release',
    icon: BoltIcon,
    color: 'bg-pink-500/20 border-pink-500/40 text-pink-400',
  },
  minor: {
    label: 'Minor Release',
    icon: CubeIcon,
    color: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  },
  patch: {
    label: 'Patch Release',
    icon: WrenchIcon,
    color: 'bg-green-500/20 border-green-500/40 text-green-400',
  },
};

const changeTypeConfig = {
  added: { label: 'Added', icon: PlusIcon, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  fixed: { label: 'Fixed', icon: CheckCircleIcon, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  changed: { label: 'Changed', icon: ExclamationTriangleIcon, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  improved: { label: 'Improved', icon: CheckCircleIcon, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  enhanced: { label: 'Enhanced', icon: BoltIcon, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  removed: { label: 'Removed', icon: XMarkIcon, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  features: { label: 'Features', icon: PlusIcon, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  breaking: {
    label: 'Breaking changes',
    icon: ExclamationTriangleIcon,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  migration: { label: 'Migration', icon: ArrowPathIcon, color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
  deprecated: { label: 'Deprecated', icon: XMarkIcon, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  security: { label: 'Security', icon: ShieldCheckIcon, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
};

// Function to get icon for subsection titles
function getSubsectionIcon(title: string) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('background') || lowerTitle.includes('bg')) {
    return PhotoIcon;
  }
  if (lowerTitle.includes('image') || lowerTitle.includes('photo') || lowerTitle.includes('picture')) {
    return PhotoIcon;
  }
  if (lowerTitle.includes('video') || lowerTitle.includes('frame') || lowerTitle.includes('media')) {
    return FilmIcon;
  }
  if (lowerTitle.includes('text') || lowerTitle.includes('font') || lowerTitle.includes('typography')) {
    return DocumentTextIcon;
  }
  if (lowerTitle.includes('chart') || lowerTitle.includes('graph') || lowerTitle.includes('plot')) {
    return ChartBarIcon;
  }
  if (lowerTitle.includes('line') || lowerTitle.includes('path') || lowerTitle.includes('draw')) {
    return PaintBrushIcon;
  }
  if (lowerTitle.includes('utility') || lowerTitle.includes('method') || lowerTitle.includes('function')) {
    return CommandLineIcon;
  }
  if (lowerTitle.includes('technical') || lowerTitle.includes('performance') || lowerTitle.includes('optimization')) {
    return CpuChipIcon;
  }
  if (lowerTitle.includes('documentation') || lowerTitle.includes('doc') || lowerTitle.includes('readme')) {
    return DocumentTextIcon;
  }
  if (lowerTitle.includes('filter') || lowerTitle.includes('effect') || lowerTitle.includes('enhancement')) {
    return SparklesIcon;
  }
  if (lowerTitle.includes('code') || lowerTitle.includes('api') || lowerTitle.includes('sdk')) {
    return CodeBracketIcon;
  }
  if (lowerTitle.includes('test') || lowerTitle.includes('experimental')) {
    return BeakerIcon;
  }
  if (lowerTitle.includes('setting') || lowerTitle.includes('config') || lowerTitle.includes('option')) {
    return AdjustmentsHorizontalIcon;
  }
  if (lowerTitle.includes('batch') || lowerTitle.includes('collection') || lowerTitle.includes('multiple')) {
    return RectangleStackIcon;
  }
  
  // Default icon
  return SparklesIcon;
}

function semverReleaseType(version: string): 'major' | 'minor' | 'patch' {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  if (!m) return 'patch';
  const minor = parseInt(m[2], 10);
  const patch = parseInt(m[3], 10);
  if (minor === 0 && patch === 0) return 'major';
  if (patch === 0) return 'minor';
  return 'patch';
}

/** First index in `block` where a recognised ### change section begins. */
function findFirstSectionHeaderIndex(block: string): number {
  const sectionLineRes = [
    /^#{3,4}\s+.*\bAdded\s*$/i,
    /^#{3,4}\s+.*\bFixed\s*$/i,
    /^#{3,4}\s+.*\bChanged\s*$/i,
    /^#{3,4}\s+.*\bImproved\s*$/i,
    /^#{3,4}\s+.*\bEnhanced\s*$/i,
    /^#{3,4}\s+.*\bRemoved\s*$/i,
    /^#{3,4}\s+.*\bDeprecated\s*$/i,
    /^#{3,4}\s+.*\bSecurity\s*$/i,
    /^#{3,4}\s+.*\bBreaking\s+changes\s*$/i,
    /^#{3,4}\s+.*\bMigration\s*$/i,
    /^#{3,4}\s+.*\bFeatures\s*$/i,
  ];
  let offset = 0;
  for (const line of block.split('\n')) {
    const t = line.trim();
    if (t) {
      for (const re of sectionLineRes) {
        if (re.test(t)) return offset;
      }
    }
    offset += line.length + 1;
  }
  return block.length;
}

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];

  const versionRegex = /^##\s+\[(.+?)\]\s*-\s*(.+?)$/gm;
  const versionMatches = Array.from(content.matchAll(versionRegex));

  for (const match of versionMatches) {
    const version = match[1];
    const date = match[2].trim();
    const startIndex = match.index! + match[0].length;
    const nextMatch = versionMatches[versionMatches.indexOf(match) + 1];
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    const fullBlock = content.substring(startIndex, endIndex).trim();

    const firstHdr = findFirstSectionHeaderIndex(fullBlock);
    const preamble = fullBlock.substring(0, firstHdr).trim();
    const sectionContent = fullBlock.substring(firstHdr).trim();

    const type = semverReleaseType(version);
    const changes: ChangelogEntry['changes'] = {};

    const sectionPatterns = [
      { key: 'added', regex: /^#{3,4}\s+.*\bAdded\s*$/gim },
      { key: 'fixed', regex: /^#{3,4}\s+.*\bFixed\s*$/gim },
      { key: 'changed', regex: /^#{3,4}\s+.*\bChanged\s*$/gim },
      { key: 'improved', regex: /^#{3,4}\s+.*\bImproved\s*$/gim },
      { key: 'enhanced', regex: /^#{3,4}\s+.*\bEnhanced\s*$/gim },
      { key: 'removed', regex: /^#{3,4}\s+.*\bRemoved\s*$/gim },
      { key: 'deprecated', regex: /^#{3,4}\s+.*\bDeprecated\s*$/gim },
      { key: 'security', regex: /^#{3,4}\s+.*\bSecurity\s*$/gim },
      { key: 'breaking', regex: /^#{3,4}\s+.*\bBreaking\s+changes\s*$/gim },
      { key: 'migration', regex: /^#{3,4}\s+.*\bMigration\s*$/gim },
      { key: 'features', regex: /^#{3,4}\s+.*\bFeatures\s*$/gim },
    ];

    interface SectionMatch {
      key: string;
      index: number;
      endIndex: number;
    }

    const allSectionMatches: SectionMatch[] = [];
    for (const pattern of sectionPatterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let sm: RegExpExecArray | null;
      while ((sm = regex.exec(sectionContent)) !== null) {
        allSectionMatches.push({
          key: pattern.key,
          index: sm.index + sm[0].length,
          endIndex: sm.index + sm[0].length,
        });
      }
    }

    allSectionMatches.sort((a, b) => a.index - b.index);

    for (let i = 0; i < allSectionMatches.length; i++) {
      const current = allSectionMatches[i];
      if (i < allSectionMatches.length - 1) {
        current.endIndex = allSectionMatches[i + 1].index;
      } else {
        const nextVersionMatch = sectionContent.substring(current.index).match(/^(---|##\s+\[)/m);
        current.endIndex = nextVersionMatch ? current.index + nextVersionMatch.index! : sectionContent.length;
      }
    }

    for (const sectionMatch of allSectionMatches) {
      const sectionText = sectionContent.substring(sectionMatch.index, sectionMatch.endIndex).trim();
      if (!sectionText) continue;

      const lines = sectionText.split('\n');
      const subsections: Subsection[] = [];
      let currentSubsection: Subsection | null = null;
      let currentItem: SubsectionItem | null = null;
      let flatItems: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const originalIndent = line.match(/^(\s*)/)?.[1].length || 0;

        if (!trimmed || trimmed.match(/^---+$/)) {
          if (currentItem) {
            if (currentSubsection) {
              currentSubsection.items.push(currentItem);
            } else {
              flatItems.push(currentItem.content);
            }
            currentItem = null;
          }
          continue;
        }

        const subsectionMatch = trimmed.match(/^#####\s+(.+)$/);
        if (subsectionMatch) {
          if (currentItem) {
            if (currentSubsection) {
              currentSubsection.items.push(currentItem);
            } else {
              flatItems.push(currentItem.content);
            }
            currentItem = null;
          }
          currentSubsection = {
            title: subsectionMatch[1],
            items: [],
          };
          subsections.push(currentSubsection);
          continue;
        }

        const listItemMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (listItemMatch) {
          if (currentItem) {
            if (currentSubsection) {
              currentSubsection.items.push(currentItem);
            } else {
              flatItems.push(currentItem.content);
            }
          }
          currentItem = {
            content: listItemMatch[1],
            subItems: [],
          };
        } else if (currentItem && originalIndent >= 2) {
          const subItemMatch = trimmed.match(/^[-*]\s+(.+)$/);
          if (subItemMatch) {
            if (!currentItem.subItems) currentItem.subItems = [];
            currentItem.subItems.push(subItemMatch[1]);
          } else if (trimmed) {
            if (currentItem.subItems && currentItem.subItems.length > 0) {
              const lastSubItem = currentItem.subItems[currentItem.subItems.length - 1];
              currentItem.subItems[currentItem.subItems.length - 1] = lastSubItem + ' ' + trimmed;
            } else {
              currentItem.content += ' ' + trimmed;
            }
          }
        } else if (currentItem && trimmed && !trimmed.startsWith('#')) {
          currentItem.content += ' ' + trimmed;
        }
      }

      if (currentItem) {
        if (currentSubsection) {
          currentSubsection.items.push(currentItem);
        } else {
          flatItems.push(currentItem.content);
        }
      }

      const changeKey = sectionMatch.key === 'features' ? 'added' : sectionMatch.key;
      if (subsections.length > 0) {
        const changeSection: ChangeSection = {
          type: changeKey,
          subsections: subsections,
        };
        const existing = changes[changeKey as keyof typeof changes];
        if (existing && Array.isArray(existing)) {
          changes[changeKey as keyof typeof changes] = changeSection;
        } else if (existing && !Array.isArray(existing)) {
          const existingSection = existing as ChangeSection;
          existingSection.subsections = [...existingSection.subsections, ...subsections];
        } else {
          changes[changeKey as keyof typeof changes] = changeSection;
        }
      } else if (flatItems.length > 0) {
        const validItems = flatItems.filter((item) => item.trim().length > 0);
        if (validItems.length > 0) {
          if (changes[changeKey as keyof typeof changes] && Array.isArray(changes[changeKey as keyof typeof changes])) {
            (changes[changeKey as keyof typeof changes] as string[]).push(...validItems);
          } else {
            changes[changeKey as keyof typeof changes] = validItems;
          }
        }
      }
    }

    const totalChanges = Object.values(changes).reduce((sum, changeData) => {
      if (!changeData) return sum;
      if (Array.isArray(changeData)) {
        return sum + changeData.length;
      }
      if (typeof changeData === 'object' && 'subsections' in changeData) {
        const section = changeData as ChangeSection;
        return sum + section.subsections.reduce((subSum, sub) => subSum + sub.items.length, 0);
      }
      return sum;
    }, 0);

    if (totalChanges > 0 || preamble.length > 0) {
      entries.push({
        version,
        date,
        type,
        changes,
        ...(preamble.length > 0 ? { preamble } : {}),
      });
    }
  }

  return entries;
}

const SECTION_DISPLAY_ORDER = [
  'added',
  'changed',
  'fixed',
  'breaking',
  'migration',
  'deprecated',
  'security',
  'removed',
  'improved',
  'enhanced',
];

function orderedChangeKeys(ch: ChangelogEntry['changes']): string[] {
  const keys = Object.keys(ch).filter((k) => ch[k as keyof typeof ch] != null);
  keys.sort((a, b) => {
    const ia = SECTION_DISPLAY_ORDER.indexOf(a);
    const ib = SECTION_DISPLAY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return keys;
}

export default function ChangelogRenderer({ content }: ChangelogRendererProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const entries = parseChangelog(content);

  const toggleExpand = (version: string) => {
    setExpanded(prev => ({ ...prev, [version]: !prev[version] }));
  };

  const formatDate = (dateStr: string) => {
    // Handle special date strings
    const trimmed = dateStr.trim();
    if (trimmed === 'Previous Release' || trimmed === 'Initial Major Release') {
      return trimmed;
    }
    try {
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) return trimmed;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return trimmed;
    }
  };

  const getTotalChanges = (changes: ChangelogEntry['changes']) => {
    return Object.values(changes).reduce((sum, changeData) => {
      if (!changeData) return sum;
      if (Array.isArray(changeData)) {
        return sum + changeData.length;
      }
      if (typeof changeData === 'object' && 'subsections' in changeData) {
        const section = changeData as ChangeSection;
        return sum + section.subsections.reduce((subSum, sub) => subSum + sub.items.length, 0);
      }
      return sum;
    }, 0);
  };

  if (entries.length === 0) {
    return (
      <div
        className="not-prose rounded-xl border px-6 py-10 text-center text-sm leading-relaxed"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}
      >
        <p>
          No changelog versions were parsed. Confirm{' '}
          <code className="rounded px-1.5 py-0.5 font-mono text-xs" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-sunken)' }}>
            content/docs/06-internals/changelog.mdx
          </code>{' '}
          includes the{' '}
          <code className="rounded px-1.5 py-0.5 font-mono text-xs" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-sunken)' }}>
            {'<!-- changelog-versions -->'}
          </code>{' '}
          marker before the first{' '}
          <code className="rounded px-1.5 py-0.5 font-mono text-xs" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-sunken)' }}>
            ## [5.4.0] - 2026-05-13
          </code>{' '}
          line, and that version lines use that format.
        </p>
      </div>
    );
  }

  const mdInline = {
    p: ({ children }: { children?: ReactNode }) => <span className="inline">{children}</span>,
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
        {children}
      </strong>
    ),
    code: ({ children }: { children?: ReactNode }) => (
      <code
        className="rounded px-1.5 py-0.5 font-mono text-sm"
        style={{
          backgroundColor: 'var(--bg-sunken)',
          color: 'var(--accent-magenta)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {children}
      </code>
    ),
  };

  const mdPreamble = {
    ...mdInline,
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="mt-6 mb-2 text-lg font-bold first:mt-0" style={{ color: 'var(--text-primary)' }}>
        {children}
      </h3>
    ),
    table: ({ children }: { children?: ReactNode }) => (
      <div className="my-4 overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
        <table className="min-w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: ReactNode }) => (
      <thead style={{ backgroundColor: 'var(--bg-sunken)', color: 'var(--text-secondary)' }}>{children}</thead>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th className="border-b px-3 py-2 font-semibold" style={{ borderColor: 'var(--border-subtle)' }}>
        {children}
      </th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="border-b px-3 py-2 align-top" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
        {children}
      </td>
    ),
    tr: ({ children }: { children?: ReactNode }) => <tr>{children}</tr>,
    tbody: ({ children }: { children?: ReactNode }) => <tbody>{children}</tbody>,
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mb-3 leading-relaxed last:mb-0" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </p>
    ),
  };

  return (
    <div className="not-prose space-y-4">
      {entries.map((entry, index) => {
        const TypeIcon = typeConfig[entry.type].icon;
        const isExpanded = expanded[entry.version] ?? index === 0;
        const totalChanges = getTotalChanges(entry.changes);

        return (
          <div
            key={entry.version}
            className="overflow-hidden rounded-2xl transition-shadow"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg-raised) 92%, transparent)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <button
              type="button"
              onClick={() => toggleExpand(entry.version)}
              className="flex w-full flex-col gap-3 p-5 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              style={{ color: 'var(--text-primary)' }}
              aria-expanded={isExpanded}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-2xl font-black tracking-tight sm:text-3xl">{entry.version}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:text-sm ${typeConfig[entry.type].color}`}
                  >
                    <TypeIcon className="h-4 w-4 shrink-0" aria-hidden />
                    {typeConfig[entry.type].label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{formatDate(entry.date)}</span>
                  <span aria-hidden className="opacity-40">
                    ·
                  </span>
                  <span className="tabular-nums">{totalChanges} items</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </span>
                <ChevronDownIcon
                  className="h-5 w-5 shrink-0 transition-transform duration-200"
                  style={{
                    color: 'var(--text-tertiary)',
                    transform: isExpanded ? 'rotate(180deg)' : undefined,
                  }}
                  aria-hidden
                />
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-8 border-t px-5 pb-6 pt-5 sm:px-6" style={{ borderColor: 'var(--border-subtle)' }}>
                {entry.preamble ? (
                  <div className="max-w-none text-sm leading-relaxed sm:text-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdPreamble}>
                      {entry.preamble}
                    </ReactMarkdown>
                  </div>
                ) : null}

                {orderedChangeKeys(entry.changes).map((changeType) => {
                  const changeData = entry.changes[changeType as keyof typeof entry.changes];
                  if (!changeData) return null;

                  const config =
                    changeTypeConfig[changeType as keyof typeof changeTypeConfig] ?? {
                      label: changeType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                      icon: DocumentTextIcon,
                      color: 'text-slate-400',
                      bgColor: 'bg-slate-500/10',
                    };

                  const Icon = config.icon;
                  const isStructured = changeData && typeof changeData === 'object' && 'subsections' in changeData;
                  const changeSection = isStructured ? (changeData as ChangeSection) : null;
                  const flatItems = !isStructured && Array.isArray(changeData) ? changeData : [];

                  return (
                    <div key={changeType} className="space-y-4">
                      <div
                        className={`inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 ${config.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${config.color}`} aria-hidden />
                        <h4 className={`text-base font-bold ${config.color}`}>{config.label}</h4>
                      </div>

                      {changeSection && changeSection.subsections.length > 0 ? (
                        <div className="ml-0 space-y-6 sm:ml-1">
                          {changeSection.subsections.map((subsection, subIdx) => {
                            const SubsectionIcon = getSubsectionIcon(subsection.title);
                            return (
                              <div key={subIdx} className="space-y-3">
                                <div
                                  className="flex items-center gap-2 border-b pb-2 text-base font-semibold"
                                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                                >
                                  <SubsectionIcon className="h-5 w-5 shrink-0" style={{ color: 'var(--text-tertiary)' }} aria-hidden />
                                  <h5>{subsection.title}</h5>
                                </div>
                                <ol className="ml-4 list-decimal space-y-3 sm:ml-6">
                                  {subsection.items.map((item, itemIdx) => (
                                    <li key={itemIdx} className="pl-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                      <div className="max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdInline}>
                                          {item.content}
                                        </ReactMarkdown>
                                      </div>
                                      {item.subItems && item.subItems.length > 0 && (
                                        <ul className="mt-2 ml-4 list-disc space-y-1.5 sm:ml-6">
                                          {item.subItems.map((subItem, subItemIdx) => (
                                            <li key={subItemIdx} className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdInline}>
                                                {subItem}
                                              </ReactMarkdown>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            );
                          })}
                        </div>
                      ) : flatItems.length > 0 ? (
                        <ul className="ml-2 list-disc space-y-3 sm:ml-4">
                          {flatItems.map((item, idx) => (
                            <li key={idx} className="pl-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              <div className="max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdInline}>
                                  {item}
                                </ReactMarkdown>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <a
          href="https://github.com/EIAS79/apexify.js"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--bg-sunken)',
            color: 'var(--text-secondary)',
          }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          <span className="font-medium">View on GitHub</span>
        </a>
      </div>
    </div>
  );
}
