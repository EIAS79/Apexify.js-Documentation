'use client';

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

export function GallerySnippetEditor({
  value,
  codeLang,
  onChange,
}: {
  value: string;
  codeLang: 'ts' | 'js';
  onChange: (next: string) => void;
}) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      className="flex-1 min-h-0 [&_.cm-editor]:min-h-[200px] [&_.cm-scroller]:min-h-0"
      theme="dark"
      extensions={[javascript({ typescript: codeLang === 'ts' })]}
      onChange={onChange}
      basicSetup={{ lineNumbers: true, foldGutter: true }}
    />
  );
}
