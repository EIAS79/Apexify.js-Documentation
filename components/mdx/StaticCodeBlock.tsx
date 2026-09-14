import type { ReactNode } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeBlockActions } from './CodeBlockActions';
import { composeStudioSnippetFromDocs, STUDIO_INCOMING_SNIPPET_KEY } from '@/lib/studio/studioConfig';

const CODE_SURFACE = '#050314';

function normalizeLanguage(lang: string) {
  const langMap: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    tsx: 'tsx',
    jsx: 'jsx',
  };
  return langMap[lang.toLowerCase()] || lang.toLowerCase();
}

export function StaticCodeBlock({
  children,
  className,
  lang,
  filename,
  docsStudio = false,
}: {
  children?: ReactNode;
  className?: string;
  lang?: string;
  filename?: string;
  docsStudio?: boolean;
}) {
  let code = typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.join('')
      : children?.toString() || '';

  code = code.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  const language = lang || className?.replace('language-', '') || 'text';
  const normalizedLanguage = normalizeLanguage(language);
  const studioPayload = docsStudio ? composeStudioSnippetFromDocs(code, language) : null;
  const codeRegionLabel = filename ? `${filename} code example` : `${normalizedLanguage} code example`;

  return (
    <div className="relative my-4 group sm:my-6" data-doc11-static-code>
      <div className="overflow-hidden rounded-lg border-2 border-slate-800/80 bg-slate-900 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-800/80 bg-gradient-to-r from-slate-800 to-slate-800/90 px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            {filename ? <span className="ml-3 font-mono text-xs font-semibold text-blue-300">{filename}</span> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs font-bold uppercase text-emerald-300">{normalizedLanguage}</span>
            <CodeBlockActions code={code} studioPayload={studioPayload} storageKey={STUDIO_INCOMING_SNIPPET_KEY} />
          </div>
        </div>
        <div
          className="relative max-h-[min(65vh,28rem)] max-w-full overflow-x-auto overflow-y-auto"
          style={{ backgroundColor: CODE_SURFACE }}
          tabIndex={0}
          role="group"
          aria-label={codeRegionLabel}
        >
          <div className="min-w-0 p-3 sm:p-4">
            <SyntaxHighlighter
              language={normalizedLanguage}
              style={a11yDark}
              customStyle={{
                margin: 0,
                padding: 0,
                background: CODE_SURFACE,
                backgroundColor: CODE_SURFACE,
                fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
                lineHeight: '1.6',
                overflowX: 'visible',
                overflowY: 'visible',
              }}
              showLineNumbers
              lineNumberStyle={{
                color: '#b8c0cc',
                paddingRight: '1rem',
                minWidth: '2.5em',
                userSelect: 'none',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                  background: CODE_SURFACE,
                  backgroundColor: CODE_SURFACE,
                },
              }}
              PreTag="div"
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}
