'use client';

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import type { InteractiveLanguage } from '@/lib/docs/playground/contracts';

const interactiveTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0d1117',
      color: '#e6edf3',
    },
    '.cm-scroller': {
      backgroundColor: '#0d1117',
    },
    '.cm-content': {
      caretColor: '#f0f6fc',
    },
    '.cm-gutters': {
      backgroundColor: '#0d1117',
      borderRight: '1px solid rgba(240,246,252,0.14)',
      color: '#8b949e',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#161b22',
      color: '#c9d1d9',
    },
    '.cm-activeLine': { backgroundColor: '#161b22' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'rgba(88, 166, 255, 0.32) !important',
    },
    '.cm-cursor': { borderLeftColor: '#f0f6fc' },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(88, 166, 255, 0.24)',
      outline: '1px solid #79c0ff',
    },
  },
  { dark: true }
);

export type CodeMirrorEditorProps = {
  value: string;
  language: InteractiveLanguage;
  onChange: (next: string) => void;
  readOnly?: boolean;
  fillParent?: boolean;
  ariaLabel?: string;
};

export default function CodeMirrorEditor({
  value,
  language,
  onChange,
  readOnly = false,
  fillParent = false,
  ariaLabel = 'Code editor',
}: CodeMirrorEditorProps) {
  const extensions = useMemo(
    () => [
      javascript({ typescript: language === 'ts' }),
      interactiveTheme,
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
    ],
    [ariaLabel, language]
  );
  const layoutClass = fillParent
    ? 'h-full min-h-0 max-h-full flex-1 overflow-hidden [&_.cm-editor]:flex [&_.cm-editor]:h-full [&_.cm-editor]:min-h-0 [&_.cm-editor]:max-h-full [&_.cm-editor]:flex-col [&_.cm-scroller]:min-h-0 [&_.cm-scroller]:flex-1 [&_.cm-scroller]:overflow-auto'
    : 'min-h-[220px] flex-1 [&_.cm-editor]:min-h-[220px] [&_.cm-scroller]:min-h-0';

  return (
    <CodeMirror
      value={value}
      height="100%"
      className={layoutClass}
      theme="dark"
      extensions={extensions}
      onChange={onChange}
      onCreateEditor={(view) => {
        view.scrollDOM.tabIndex = 0;
        view.scrollDOM.setAttribute('aria-label', `${ariaLabel} scroll area`);
      }}
      readOnly={readOnly}
      editable={!readOnly}
      basicSetup={{ lineNumbers: true, foldGutter: true }}
      aria-label={ariaLabel}
    />
  );
}
