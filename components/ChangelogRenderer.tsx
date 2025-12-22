'use client';

import { useState } from 'react';
import { 
  BoltIcon, 
  CubeIcon, 
  WrenchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    added?: string[];
    fixed?: string[];
    changed?: string[];
    improved?: string[];
    enhanced?: string[];
    removed?: string[];
    [key: string]: string[] | undefined;
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
};

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  
  // Split by version headers
  const versionRegex = /^##\s+\[(.+?)\]\s*-\s*(.+?)$/gm;
  const matches = Array.from(content.matchAll(versionRegex));

  for (const match of matches) {
    const version = match[1];
    const date = match[2];
    const startIndex = match.index! + match[0].length;
    const nextMatch = matches[matches.indexOf(match) + 1];
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    const sectionContent = content.substring(startIndex, endIndex);

    // Determine release type from version
    const versionParts = version.split('.');
    let type: 'major' | 'minor' | 'patch' = 'patch';
    if (versionParts.length >= 1 && parseInt(versionParts[0]) > 0) {
      type = 'major';
    } else if (versionParts.length >= 2 && parseInt(versionParts[1]) > 0) {
      type = 'minor';
    }

    const changes: ChangelogEntry['changes'] = {};

    // Parse sections - handle emoji and text variations
    const sectionPatterns = [
      { key: 'added', regex: /###\s+.*?[✨➕]\s*Added\s*\n([\s\S]*?)(?=###|##|---|$)/i },
      { key: 'fixed', regex: /###\s+.*?[🐛🔧]\s*Fixed\s*\n([\s\S]*?)(?=###|##|---|$)/i },
      { key: 'changed', regex: /###\s+.*?[🔄⚡]\s*Changed\s*\n([\s\S]*?)(?=###|##|---|$)/i },
      { key: 'improved', regex: /###\s+.*?[🔧✨]\s*Improved\s*\n([\s\S]*?)(?=###|##|---|$)/i },
      { key: 'enhanced', regex: /###\s+.*?[✨🚀]\s*Enhanced\s*\n([\s\S]*?)(?=###|##|---|$)/i },
    ];

    const parseItems = (text: string): string[] => {
      const items: string[] = [];
      const lines = text.split('\n');
      let currentItem = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Handle list items (with or without markdown bold)
        if (trimmed.match(/^[-*]\s+/)) {
          if (currentItem) items.push(currentItem.trim());
          currentItem = trimmed.replace(/^[-*]\s+/, '');
        } else if (trimmed.startsWith('#####') || trimmed.startsWith('####')) {
          // Skip subheadings but keep current item if exists
          if (currentItem) {
            items.push(currentItem.trim());
            currentItem = '';
          }
        } else if (trimmed && !trimmed.startsWith('#') && currentItem) {
          // Continue item on next line
          currentItem += ' ' + trimmed;
        } else if (trimmed && !trimmed.startsWith('#')) {
          currentItem = trimmed;
        }
      }
      if (currentItem) items.push(currentItem.trim());
      return items.filter(item => item.length > 10); // Filter out very short items
    };

    for (const pattern of sectionPatterns) {
      const match = sectionContent.match(pattern.regex);
      if (match && match[1]) {
        const parsed = parseItems(match[1]);
        if (parsed.length > 0) {
          changes[pattern.key as keyof typeof changes] = parsed;
        }
      }
    }

    const totalChanges = Object.values(changes).reduce((sum, arr) => sum + (arr?.length || 0), 0);

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
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getTotalChanges = (changes: ChangelogEntry['changes']) => {
    return Object.values(changes).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => {
        const TypeIcon = typeConfig[entry.type].icon;
        const isExpanded = expanded[entry.version] ?? (index === 1); // Expand second entry by default
        const totalChanges = getTotalChanges(entry.changes);

        return (
          <div
            key={entry.version}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-3xl font-bold text-white">{entry.version}</h3>
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
              <div className="mt-6 space-y-6 pt-6 border-t border-slate-700/50 animate-fade-in">
                {Object.entries(entry.changes).map(([changeType, items]) => {
                  if (!items || items.length === 0) return null;
                  
                  const config = changeTypeConfig[changeType as keyof typeof changeTypeConfig];
                  if (!config) return null;

                  const Icon = config.icon;

                  return (
                    <div key={changeType} className="space-y-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <h4 className={`font-semibold ${config.color}`}>{config.label}</h4>
                      </div>
                      <ul className="space-y-2.5 ml-2">
                        {items.map((item, idx) => {
                          // Convert markdown bold to HTML
                          const htmlContent = item
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                            .replace(/`(.*?)`/g, '<code class="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded text-sm">$1</code>');
                          
                          return (
                            <li key={idx} className="flex items-start gap-3 text-gray-300 text-base leading-relaxed">
                              <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                              <span className="flex-1" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                            </li>
                          );
                        })}
                      </ul>
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
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

