'use client';

import { InteractiveCodeEditor } from '@/components/docs/playground/InteractiveCodeEditor';

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
}: {
  value: string;
  codeLang: 'ts' | 'js';
  onChange: (next: string) => void;
  fillParent?: boolean;
}) {
  return (
    <InteractiveCodeEditor
      value={value}
      language={codeLang}
      onChange={onChange}
      fillParent={fillParent}
      ariaLabel="Apexify source editor"
    />
  );
}
