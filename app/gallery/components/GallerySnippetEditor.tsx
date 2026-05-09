'use client';

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

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
    ? // Parent must be flex + min-h-0 + overflow-hidden; scroll happens on .cm-scroller
      'h-full min-h-0 max-h-full flex-1 overflow-hidden [&_.cm-editor]:flex [&_.cm-editor]:h-full [&_.cm-editor]:min-h-0 [&_.cm-editor]:max-h-full [&_.cm-editor]:flex-col [&_.cm-scroller]:min-h-0 [&_.cm-scroller]:flex-1 [&_.cm-scroller]:overflow-auto'
    : 'flex-1 min-h-0 [&_.cm-editor]:min-h-[200px] [&_.cm-scroller]:min-h-0';

  return (
    <CodeMirror
      value={value}
      height="100%"
      className={layoutClass}
      theme="dark"
      extensions={[javascript({ typescript: codeLang === 'ts' })]}
      onChange={onChange}
      basicSetup={{ lineNumbers: true, foldGutter: true }}
    />
  );
}
