'use client';

import { useEffect, useMemo, useRef } from 'react';
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
    '.cm-content:focus-visible': {
      outline: '3px solid #a99cff',
      outlineOffset: '-3px',
    },
    '.cm-gutters': {
      backgroundColor: '#0d1117',
      borderRight: '1px solid rgba(240,246,252,0.14)',
      color: '#8b949e',
    },
    '.cm-gutterElement': {
      color: '#aeb8c8 !important',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#161b22',
      color: '#c9d1d9 !important',
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

export type EditorInsertRequest = {
  id: number;
  text: string;
};

export type CodeMirrorEditorProps = {
  value: string;
  language: InteractiveLanguage;
  onChange: (next: string) => void;
  readOnly?: boolean;
  fillParent?: boolean;
  ariaLabel?: string;
  insertRequest?: EditorInsertRequest | null;
};

export default function CodeMirrorEditor({
  value,
  language,
  onChange,
  readOnly = false,
  fillParent = false,
  ariaLabel = 'Code editor',
  insertRequest = null,
}: CodeMirrorEditorProps) {
  const viewRef = useRef<EditorView | null>(null);
  const lastInsertIdRef = useRef<number | null>(null);

  const extensions = useMemo(
    () => [
      javascript({ typescript: language === 'ts' }),
      interactiveTheme,
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
    ],
    [ariaLabel, language]
  );

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !insertRequest || lastInsertIdRef.current === insertRequest.id) return;
    lastInsertIdRef.current = insertRequest.id;

    const selection = view.state.selection.main;
    const from = selection.from;
    const to = selection.to;
    view.dispatch({
      changes: { from, to, insert: insertRequest.text },
      selection: { anchor: from + insertRequest.text.length },
      scrollIntoView: true,
    });
    view.focus();
  }, [insertRequest]);

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
        viewRef.current = view;
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
