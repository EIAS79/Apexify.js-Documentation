'use client';

import { useState } from 'react';
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
  RectangleStackIcon
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
  changes: {
    added?: ChangeSection | string[];
    fixed?: ChangeSection | string[];
    changed?: ChangeSection | string[];
    improved?: ChangeSection | string[];
    enhanced?: ChangeSection | string[];
    removed?: ChangeSection | string[];
    features?: ChangeSection | string[];
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

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  
  // Split by version headers - format: ## [version] - date
  const versionRegex = /^##\s+\[(.+?)\]\s*-\s*(.+?)$/gm;
  const versionMatches = Array.from(content.matchAll(versionRegex));

  for (const match of versionMatches) {
    const version = match[1];
    const date = match[2].trim();
    const startIndex = match.index! + match[0].length;
    const nextMatch = versionMatches[versionMatches.indexOf(match) + 1];
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    let sectionContent = content.substring(startIndex, endIndex).trim();

    // Determine release type from version
    const versionParts = version.split('.');
    let type: 'major' | 'minor' | 'patch' = 'patch';
    const major = parseInt(versionParts[0]) || 0;
    const minor = parseInt(versionParts[1]) || 0;
    const patch = parseInt(versionParts[2]) || 0;
    
    if (major > 0 || (major === 0 && minor === 0 && patch === 0)) {
      type = 'major';
    } else if (minor > 0) {
      type = 'minor';
    } else {
      type = 'patch';
    }

    const changes: ChangelogEntry['changes'] = {};

    // Map emoji patterns to change types - handle both ### and #### headers
    const sectionPatterns = [
      { key: 'added', regex: /^#{3,4}\s+.*?(?:✨|➕)?\s*Added\s*$/mi },
      { key: 'fixed', regex: /^#{3,4}\s+.*?(?:🐛|🔧)?\s*Fixed\s*$/mi },
      { key: 'changed', regex: /^#{3,4}\s+.*?(?:🔄|⚡)?\s*Changed\s*$/mi },
      { key: 'improved', regex: /^#{3,4}\s+.*?(?:🔧|✨)?\s*Improved\s*$/mi },
      { key: 'enhanced', regex: /^#{3,4}\s+.*?(?:✨|🚀)?\s*Enhanced\s*$/mi },
      { key: 'removed', regex: /^#{3,4}\s+.*?(?:🗑️|➖)?\s*Removed\s*$/mi },
      { key: 'features', regex: /^###\s+Features\s*$/mi }, // Handle generic "Features" sections (map to added)
    ];

    // Find all section matches in order
    interface SectionMatch {
      key: string;
      index: number;
      endIndex: number;
    }
    
    const allSectionMatches: SectionMatch[] = [];
    for (const pattern of sectionPatterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags + 'g');
      let match;
      while ((match = regex.exec(sectionContent)) !== null) {
        allSectionMatches.push({
          key: pattern.key,
          index: match.index! + match[0].length,
          endIndex: match.index! + match[0].length,
        });
      }
    }

    // Sort by index
    allSectionMatches.sort((a, b) => a.index - b.index);

    // Determine end indices
    for (let i = 0; i < allSectionMatches.length; i++) {
      const current = allSectionMatches[i];
      if (i < allSectionMatches.length - 1) {
        current.endIndex = allSectionMatches[i + 1].index;
      } else {
        // Check for version headers and horizontal rules
        const nextVersionMatch = sectionContent.substring(current.index).match(/^(---|##\s+\[)/m);
        current.endIndex = nextVersionMatch ? current.index + nextVersionMatch.index! : sectionContent.length;
      }
    }

    // Parse each section
    for (const sectionMatch of allSectionMatches) {
      const sectionText = sectionContent.substring(sectionMatch.index, sectionMatch.endIndex).trim();
      if (!sectionText) continue;

      // Parse section with subsections
      const lines = sectionText.split('\n');
      const subsections: Subsection[] = [];
      let currentSubsection: Subsection | null = null;
      let currentItem: SubsectionItem | null = null;
      let flatItems: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const originalIndent = line.match(/^(\s*)/)?.[1].length || 0;

        // Skip empty lines and horizontal rules
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

        // Check for subsection header (#####)
        const subsectionMatch = trimmed.match(/^#####\s+(.+)$/);
        if (subsectionMatch) {
          // Save current item if exists
          if (currentItem) {
            if (currentSubsection) {
              currentSubsection.items.push(currentItem);
            } else {
              flatItems.push(currentItem.content);
            }
            currentItem = null;
          }
          // Start new subsection
          currentSubsection = {
            title: subsectionMatch[1],
            items: []
          };
          subsections.push(currentSubsection);
          continue;
        }

        // Check if this is a list item (starts with - or *)
        const listItemMatch = trimmed.match(/^[-*]\s+(.+)$/);
        if (listItemMatch) {
          // Save previous item
          if (currentItem) {
            if (currentSubsection) {
              currentSubsection.items.push(currentItem);
            } else {
              flatItems.push(currentItem.content);
            }
          }
          // Start new item
          currentItem = {
            content: listItemMatch[1],
            subItems: []
          };
        } else if (currentItem && originalIndent >= 2) {
          // Nested sub-item (indented with 2+ spaces)
          const subItemMatch = trimmed.match(/^[-*]\s+(.+)$/);
          if (subItemMatch) {
            if (!currentItem.subItems) currentItem.subItems = [];
            currentItem.subItems.push(subItemMatch[1]);
          } else if (trimmed) {
            // Continuation of sub-item or main item
            if (currentItem.subItems && currentItem.subItems.length > 0) {
              // Append to last sub-item
              const lastSubItem = currentItem.subItems[currentItem.subItems.length - 1];
              currentItem.subItems[currentItem.subItems.length - 1] = lastSubItem + ' ' + trimmed;
            } else {
              // Append to main item
              currentItem.content += ' ' + trimmed;
            }
          }
        } else if (currentItem && trimmed && !trimmed.startsWith('#')) {
          // Continuation of current item
          currentItem.content += ' ' + trimmed;
        }
      }

      // Save last item
      if (currentItem) {
        if (currentSubsection) {
          currentSubsection.items.push(currentItem);
        } else {
          flatItems.push(currentItem.content);
        }
      }

      // Build change section
      const changeKey = sectionMatch.key === 'features' ? 'added' : sectionMatch.key;
      if (subsections.length > 0) {
        // Has subsections - use structured format
        const changeSection: ChangeSection = {
          type: changeKey,
          subsections: subsections
        };
        // Merge if exists
        const existing = changes[changeKey as keyof typeof changes];
        if (existing && Array.isArray(existing)) {
          changes[changeKey as keyof typeof changes] = changeSection;
        } else if (existing && !Array.isArray(existing)) {
          // Merge subsections
          const existingSection = existing as ChangeSection;
          existingSection.subsections = [...existingSection.subsections, ...subsections];
        } else {
          changes[changeKey as keyof typeof changes] = changeSection;
        }
      } else if (flatItems.length > 0) {
        // No subsections - use flat list
        const validItems = flatItems.filter(item => item.length > 3);
        if (validItems.length > 0) {
          if (changes[changeKey as keyof typeof changes] && Array.isArray(changes[changeKey as keyof typeof changes])) {
            // Merge arrays
            (changes[changeKey as keyof typeof changes] as string[]).push(...validItems);
          } else {
            changes[changeKey as keyof typeof changes] = validItems;
          }
        }
      }
    }

    // Only add entry if it has changes - use same logic as getTotalChanges
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
    
    if (totalChanges > 0) {
      entries.push({ version, date, type, changes });
    }
  }

  return entries;
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
      <div className="text-center py-12 text-gray-400">
        <p>No changelog entries found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map((entry, index) => {
        const TypeIcon = typeConfig[entry.type].icon;
        const isExpanded = expanded[entry.version] ?? (index === 0); // Expand first entry by default
        const totalChanges = getTotalChanges(entry.changes);

        return (
          <div
            key={entry.version}
            className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 lg:p-8 hover:border-slate-600/50 transition-all duration-300 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-3xl lg:text-4xl font-bold text-white">{entry.version}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${typeConfig[entry.type].color}`}>
                    <TypeIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{typeConfig[entry.type].label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm">{formatDate(entry.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-1.5 border border-cyan-500/40 text-cyan-400 rounded-full text-sm font-medium hover:bg-cyan-500/10 transition-colors">
                  {totalChanges} changes
                </button>
                <button
                  onClick={() => toggleExpand(entry.version)}
                  className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-6 space-y-6 pt-6 border-t border-slate-700/50">
                {Object.entries(entry.changes).map(([changeType, changeData]) => {
                  if (!changeData) return null;
                  
                  const config = changeTypeConfig[changeType as keyof typeof changeTypeConfig];
                  if (!config) return null;

                  const Icon = config.icon;
                  const isStructured = changeData && typeof changeData === 'object' && 'subsections' in changeData;
                  const changeSection = isStructured ? changeData as ChangeSection : null;
                  const flatItems = !isStructured && Array.isArray(changeData) ? changeData : [];

                  return (
                    <div key={changeType} className="space-y-5">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.bgColor} border border-transparent`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <h4 className={`font-semibold text-base ${config.color}`}>{config.label}</h4>
                      </div>
                      
                      {changeSection && changeSection.subsections.length > 0 ? (
                        // Structured format with subsections
                        <div className="space-y-6 ml-2">
                          {changeSection.subsections.map((subsection, subIdx) => {
                            const SubsectionIcon = getSubsectionIcon(subsection.title);
                            return (
                            <div key={subIdx} className="space-y-3">
                              <div className="flex items-center gap-2 text-lg font-semibold text-gray-200 border-b border-slate-700/50 pb-2">
                                <SubsectionIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <h5>{subsection.title}</h5>
                              </div>
                              <ol className="space-y-3 ml-6 list-decimal">
                                {subsection.items.map((item, itemIdx) => (
                                  <li key={itemIdx} className="text-gray-300 leading-relaxed pl-2">
                                    <div className="prose prose-invert max-w-none">
                                      <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]} 
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                          p: ({ children }) => <span className="inline">{children}</span>,
                                          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                                          code: ({ children }) => (
                                            <code className="bg-slate-800/80 text-cyan-400 px-1.5 py-0.5 rounded text-sm font-mono">
                                              {children}
                                            </code>
                                          ),
                                        }}
                                      >
                                        {item.content}
                                      </ReactMarkdown>
                                    </div>
                                    {item.subItems && item.subItems.length > 0 && (
                                      <ul className="mt-2 ml-6 space-y-1.5 list-disc list-inside">
                                        {item.subItems.map((subItem, subItemIdx) => (
                                          <li key={subItemIdx} className="text-gray-400 text-sm">
                                            <ReactMarkdown 
                                              remarkPlugins={[remarkGfm]} 
                                              rehypePlugins={[rehypeRaw]}
                                              components={{
                                                p: ({ children }) => <span className="inline">{children}</span>,
                                                strong: ({ children }) => <strong className="text-gray-300 font-medium">{children}</strong>,
                                                code: ({ children }) => (
                                                  <code className="bg-slate-800/80 text-cyan-400 px-1 py-0.5 rounded text-xs font-mono">
                                                    {children}
                                                  </code>
                                                ),
                                              }}
                                            >
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
                        // Flat list format (no subsections)
                        <ul className="space-y-3 ml-2 list-disc list-inside">
                          {flatItems.map((item, idx) => (
                            <li key={idx} className="text-gray-300 leading-relaxed pl-2">
                              <div className="prose prose-invert max-w-none">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]} 
                                  rehypePlugins={[rehypeRaw]}
                                  components={{
                                    p: ({ children }) => <span className="inline">{children}</span>,
                                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                                    code: ({ children }) => (
                                      <code className="bg-slate-800/80 text-cyan-400 px-1.5 py-0.5 rounded text-sm font-mono">
                                        {children}
                                      </code>
                                    ),
                                  }}
                                >
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

      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <a
          href="https://github.com/EIAS79/apexify.js"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
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
