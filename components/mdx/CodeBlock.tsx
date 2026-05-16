'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardIcon, CheckIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { composeStudioSnippetFromDocs, STUDIO_INCOMING_SNIPPET_KEY } from '@/lib/studio/studioConfig';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  lang?: string;
  filename?: string;
  hideHeader?: boolean;
  /** When true (documentation pages), show “Open in Studio” for runnable TS/JS fences. */
  docsStudio?: boolean;
}

export function CodeBlock({
  children,
  className,
  lang,
  filename,
  hideHeader = false,
  docsStudio = false,
}: CodeBlockProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  let code = typeof children === 'string' 
    ? children 
    : Array.isArray(children)
    ? children.join('')
    : children?.toString() || '';
  
  code = code.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  
  const language = lang || className?.replace('language-', '') || 'text';

  const studioPayload = docsStudio ? composeStudioSnippetFromDocs(code, language) : null;

  const openInStudio = () => {
    if (!studioPayload) return;
    try {
      localStorage.setItem(STUDIO_INCOMING_SNIPPET_KEY, JSON.stringify(studioPayload));
    } catch {
      /* ignore quota / privacy mode */
    }
    router.push('/studio');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizeLanguage = (lang: string) => {
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'tsx': 'tsx',
      'jsx': 'jsx',
    };
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const roundedClass = hideHeader ? 'rounded-b-lg' : 'rounded-lg';
  const borderClass = hideHeader ? 'border-t-0' : '';

  return (
    <div className={`relative group ${hideHeader ? 'my-0' : 'my-4 sm:my-6'}`}>
      <div className={`bg-slate-900 ${roundedClass} border-2 border-slate-800/80 ${borderClass} overflow-hidden shadow-2xl transition-colors duration-200`}>
        {/* macOS-style window header */}
        {!hideHeader && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-800/90 px-3 sm:px-4 py-2 sm:py-3 border-b-2 border-slate-800/80 flex items-center justify-between transition-colors duration-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {/* macOS window controls */}
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 transition-all duration-200 hover:brightness-110"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 transition-all duration-200 hover:brightness-110"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 transition-all duration-200 hover:brightness-110"></div>
              </div>
              {filename && (
                <span className="ml-3 text-xs text-blue-300 font-mono font-semibold">{filename}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 uppercase font-bold px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">{normalizeLanguage(language)}</span>
              {studioPayload && (
                <Link
                  href="/studio"
                  onClick={(e) => {
                    e.preventDefault();
                    openInStudio();
                  }}
                  className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-white transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-slate-700 border border-violet-500/35 hover:border-violet-400/60"
                  title="Open this snippet in Studio and run it"
                >
                  <RocketLaunchIcon className="h-3.5 w-3.5" aria-hidden />
                  <span>Studio</span>
                </Link>
              )}
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Code content — capped height so long snippets scroll inside the block */}
        <div className="relative bg-slate-950 transition-colors duration-200 overflow-x-auto overflow-y-auto max-h-[min(65vh,28rem)] max-w-full">
          <div className="p-3 sm:p-4 min-w-0">
          <SyntaxHighlighter
            language={normalizeLanguage(language)}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
                padding: 0,
              background: 'transparent',
                fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
                lineHeight: '1.6',
            }}
            showLineNumbers={true}
            lineNumberStyle={{
              color: '#6b7280',
              paddingRight: '1rem',
              minWidth: '2.5em',
              userSelect: 'none',
            }}
            codeTagProps={{
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                background: 'transparent',
              }
            }}
            PreTag="div"
          >
            {code}
          </SyntaxHighlighter>
          </div>
          
          {/* Toolbar when header is hidden */}
          {hideHeader && (
            <div className="absolute top-2 right-2 z-[1] flex flex-wrap items-center justify-end gap-2">
              {studioPayload && (
                <Link
                  href="/studio"
                  onClick={(e) => {
                    e.preventDefault();
                    openInStudio();
                  }}
                  className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-white transition-all px-2 py-1 rounded bg-gray-800/80 hover:bg-gray-700 border border-violet-500/35"
                  title="Open in Studio"
                >
                  <RocketLaunchIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>Studio</span>
                </Link>
              )}
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white transition-all duration-200 px-2 py-1 rounded bg-gray-800/80 dark:bg-gray-800/80 hover:bg-gray-700 dark:hover:bg-gray-700"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
