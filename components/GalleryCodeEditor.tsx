'use client';

import dynamic from 'next/dynamic';
import type { OnMount } from '@monaco-editor/react';

const MonacoEditor = dynamic(
  async () => {
    const mod = await import('@monaco-editor/react');
    return mod.default;
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-xl border border-slate-700 bg-slate-900/90 animate-pulse min-h-[min(50vh,480px)] lg:min-h-[320px]" />
    ),
  }
);

export type GalleryCodeLanguage = 'typescript' | 'javascript';

type GalleryCodeEditorProps = {
  language: GalleryCodeLanguage;
  value: string;
  onChange: (value: string) => void;
};

/** Monaco VS Code–style editor — browser-only (dynamic import). */
export function GalleryCodeEditor({ language, value, onChange }: GalleryCodeEditorProps) {
  const handleMount: OnMount = (_editor, monaco) => {
    monaco.editor.defineTheme('gallery-slate', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f172a',
        'editorGutter.background': '#020617',
        'editor.lineHighlightBackground': '#1e293b55',
        'editorCursor.foreground': '#93c5fd',
        'editorWhitespace.foreground': '#334155',
      },
    });
    monaco.editor.setTheme('gallery-slate');
  };

  return (
    <div
      className="w-full rounded-xl border border-slate-700 overflow-hidden shadow-inner min-h-[min(50vh,480px)] lg:min-h-[320px]"
      style={{ height: 'min(50vh, 480px)' }}
    >
      <MonacoEditor
        height="100%"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          folding: true,
          bracketPairColorization: { enabled: true },
          renderLineHighlight: 'line',
          smoothScrolling: true,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
        }}
      />
    </div>
  );
}
