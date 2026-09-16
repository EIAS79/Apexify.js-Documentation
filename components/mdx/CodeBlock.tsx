import type { ReactNode } from 'react';
import { StaticCodeBlock } from './StaticCodeBlock';

interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
  lang?: string;
  filename?: string;
  hideHeader?: boolean;
  /** When true (documentation pages), show “Open in Studio” for runnable TS/JS fences. */
  docsStudio?: boolean;
}

/**
 * Shared routed code block.
 *
 * DOC-11 deliberately keeps syntax rendering server/static and hydrates only the tiny
 * copy/Studio action island owned by StaticCodeBlock. The previous client-side Prism
 * renderer pulled the complete react-syntax-highlighter grammar bundle onto ordinary
 * documentation pages and produced a sustained mobile main-thread task. Plain code,
 * line numbers, filename/language context, copy, Studio handoff and accessible labeling
 * remain available without that client dependency.
 */
export function CodeBlock({
  children,
  className,
  lang,
  filename,
  hideHeader: _hideHeader = false,
  docsStudio = false,
}: CodeBlockProps) {
  return (
    <StaticCodeBlock
      className={className}
      lang={lang}
      filename={filename}
      docsStudio={docsStudio}
    >
      {children}
    </StaticCodeBlock>
  );
}
