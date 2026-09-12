'use client';

import dynamic from 'next/dynamic';
import type { CodeMirrorEditorProps } from './CodeMirrorEditor';

const LazyCodeMirrorEditor = dynamic(() => import('./CodeMirrorEditor'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-[220px] flex-1 place-items-center rounded-lg p-4 text-sm"
      style={{ background: 'var(--bg-sunken)', color: 'var(--text-tertiary)' }}
    >
      Loading editor…
    </div>
  ),
});

export type InteractiveCodeEditorProps = CodeMirrorEditorProps;

/** Shared DOC-8 editor boundary. Heavy CodeMirror modules are loaded only for explicit interactive surfaces. */
export function InteractiveCodeEditor(props: InteractiveCodeEditorProps) {
  return (
    <div data-doc8-primitive="editor" className={props.fillParent ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'}>
      <LazyCodeMirrorEditor {...props} />
    </div>
  );
}
