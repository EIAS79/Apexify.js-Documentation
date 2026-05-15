'use client';

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';

const studioTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.3)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255,255,255,0.04)',
      color: 'rgba(255,255,255,0.6)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'rgba(139, 92, 246, 0.25) !important',
    },
    '.cm-cursor': {
      borderLeftColor: 'rgba(236, 72, 153, 0.9)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(139, 92, 246, 0.3)',
      outline: '1px solid rgba(139, 92, 246, 0.5)',
    },
  },
  { dark: true }
);

export function GallerySnippetEditor({
  value,
  codeLang,
  onChange,
  /** Fill a bounded flex parent and scroll inside the editor (Code Studio). */
  fillParent = false,
}: {
  value: string;
  codeLang: 'ts' | 'js';
  onChange: (next: string) => void;
  fillParent?: boolean;
}) {
  const layoutClass = fillParent
    ? 'h-full min-h-0 max-h-full flex-1 overflow-hidden [&_.cm-editor]:flex [&_.cm-editor]:h-full [&_.cm-editor]:min-h-0 [&_.cm-editor]:max-h-full [&_.cm-editor]:flex-col [&_.cm-scroller]:min-h-0 [&_.cm-scroller]:flex-1 [&_.cm-scroller]:overflow-auto'
    : 'flex-1 min-h-0 [&_.cm-editor]:min-h-[200px] [&_.cm-scroller]:min-h-0';

  const extensions = useMemo(
    () => [javascript({ typescript: codeLang === 'ts' }), studioTheme],
    [codeLang]
  );

  return (
    <CodeMirror
      value={value}
      height="100%"
      className={layoutClass}
      theme="dark"
      extensions={extensions}
      onChange={onChange}
      basicSetup={{ lineNumbers: true, foldGutter: true }}
    />
  );
}
