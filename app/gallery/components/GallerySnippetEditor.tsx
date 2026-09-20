'use client';

import { InteractiveCodeEditor } from '@/components/docs/playground/InteractiveCodeEditor';
import type { EditorInsertRequest } from '@/components/docs/playground/CodeMirrorEditor';

/**
 * Compatibility wrapper retained because Gallery and Studio already import this name.
 * DOC-8 ownership lives in the shared docs/playground editor. Delete this wrapper once
 * callers migrate to InteractiveCodeEditor directly.
 */
export function GallerySnippetEditor({
  value,
  codeLang,
  onChange,
  fillParent = false,
  insertRequest = null,
}: {
  value: string;
  codeLang: 'ts' | 'js';
  onChange: (next: string) => void;
  fillParent?: boolean;
  insertRequest?: EditorInsertRequest | null;
}) {
  return (
    <div
      className={`gallery-snippet-editor-root ${
        fillParent ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'flex flex-col'
      }`}
    >
      <InteractiveCodeEditor
        value={value}
        language={codeLang}
        onChange={onChange}
        fillParent={fillParent}
        ariaLabel="Apexify source editor"
        insertRequest={insertRequest}
      />
    </div>
  );
}
