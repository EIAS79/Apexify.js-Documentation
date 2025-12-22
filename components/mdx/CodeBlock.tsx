'use client';

import { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  lang?: string;
  filename?: string;
  hideHeader?: boolean;
}

export function CodeBlock({ children, className, lang, filename, hideHeader = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  let code = typeof children === 'string' 
    ? children 
    : Array.isArray(children)
    ? children.join('')
    : children?.toString() || '';
  
  code = code.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  
  const language = lang || className?.replace('language-', '') || 'text';

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
    <div className={`relative group ${hideHeader ? 'my-0' : 'my-4'}`}>
      <div className={`bg-gray-800 dark:bg-gray-800 ${roundedClass} border border-gray-700 dark:border-gray-700 ${borderClass} overflow-hidden shadow-lg transition-colors duration-300`}>
        {/* macOS-style window header */}
        {!hideHeader && (
          <div className="bg-gray-800/90 dark:bg-gray-800/90 px-4 py-3 border-b border-gray-700 dark:border-gray-700 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-2">
              {/* macOS window controls */}
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 transition-all duration-200 hover:brightness-110"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 transition-all duration-200 hover:brightness-110"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 transition-all duration-200 hover:brightness-110"></div>
              </div>
              {filename && (
                <span className="ml-3 text-xs text-gray-400 dark:text-gray-400 font-mono">{filename}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 dark:text-gray-400 uppercase font-medium">{normalizeLanguage(language)}</span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white transition-all duration-200 px-2 py-1 rounded hover:bg-gray-700 dark:hover:bg-gray-700"
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
        
        {/* Code content with Prism syntax highlighting */}
        <div className="relative bg-[#1f2937] dark:bg-[#1f2937] transition-colors duration-300">
          <SyntaxHighlighter
            language={normalizeLanguage(language)}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.5',
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
          
          {/* Copy button for when header is hidden */}
          {hideHeader && (
            <button
              onClick={copyToClipboard}
              className="absolute top-2 right-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white transition-all duration-200 px-2 py-1 rounded bg-gray-800/80 dark:bg-gray-800/80 hover:bg-gray-700 dark:hover:bg-gray-700"
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
          )}
        </div>
      </div>
    </div>
  );
}
