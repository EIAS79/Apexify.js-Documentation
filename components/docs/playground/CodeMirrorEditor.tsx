'use client';

import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import type { InteractiveLanguage } from '@/lib/docs/playground/contracts';

const interactiveTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'transparent' },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: '1px solid var(--border-subtle)',
      color: 'var(--text-muted)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'color-mix(in srgb, var(--bg-raised) 70%, transparent)',
      color: 'var(--text-secondary)',
    },
    '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--bg-raised) 48%, transparent)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'color-mix(in srgb, var(--accent-iris) 28%, transparent) !important',
    },
    '.cm-cursor': { borderLeftColor: 'var(--accent-magenta)' },
    '.cm-matchingBracket': {
      backgroundColor: 'color-mix(in srgb, var(--accent-iris) 28%, transparent)',
      outline: '1px solid var(--accent-iris)',
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
    () => [javascript({ typescript: language === 'ts' }), interactiveTheme],
    [language]
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
      readOnly={readOnly}
      editable={!readOnly}
      basicSetup={{ lineNumbers: true, foldGutter: true }}
      aria-label={ariaLabel}
    />
  );
}
