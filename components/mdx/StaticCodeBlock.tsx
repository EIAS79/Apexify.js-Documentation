import type { ReactNode } from 'react';
import { CodeBlockActions } from './CodeBlockActions';
import { composeStudioSnippetFromDocs, STUDIO_INCOMING_SNIPPET_KEY } from '@/lib/studio/studioConfig';

const CODE_SURFACE = '#050314';
const CODE_TEXT = '#f5f0ff';
const CODE_LINE_NUMBER = '#cbd5e1';

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
  const lines = code.split('\n');

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
          style={{ backgroundColor: CODE_SURFACE, color: CODE_TEXT }}
          tabIndex={0}
          role="group"
          aria-label={codeRegionLabel}
        >
          <pre
            className="m-0 min-w-max p-3 font-mono text-[clamp(0.7rem,2vw,0.875rem)] leading-[1.6] sm:p-4"
            style={{ backgroundColor: CODE_SURFACE, color: CODE_TEXT }}
          >
            <code style={{ backgroundColor: CODE_SURFACE, color: CODE_TEXT }}>
              {lines.map((line, index) => (
                <span
                  key={index}
                  className="block min-h-[1.6em]"
                  style={{ backgroundColor: CODE_SURFACE, color: CODE_TEXT }}
                >
                  <span
                    aria-hidden="true"
                    className="mr-4 inline-block min-w-[2.5em] select-none text-right"
                    style={{ backgroundColor: CODE_SURFACE, color: CODE_LINE_NUMBER }}
                  >
                    {index + 1}
                  </span>
                  <span style={{ backgroundColor: CODE_SURFACE, color: CODE_TEXT }}>{line || ' '}</span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
