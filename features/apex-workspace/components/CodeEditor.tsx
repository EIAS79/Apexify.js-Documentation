"use client";
import dynamic from "next/dynamic";
import { javascript } from "@codemirror/lang-javascript";
import { CheckIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
const Editor = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => (
    <div className="aw-muted aw-editor-loading">Loading code editor…</div>
  ),
});
const extensions = [javascript({ typescript: true })];
export default function CodeEditor({
  source,
  onChange,
  onApply,
  onDownload,
  dirty,
  error,
}: {
  source: string;
  onChange: (source: string) => void;
  onApply: () => void;
  onDownload: () => void;
  dirty: boolean;
  error: string | null;
}) {
  return (
    <div className="aw-code">
      <div className="aw-code-toolbar">
        <span className={dirty ? "aw-source-dirty" : "aw-source-synced"}>
          {dirty ? "Unsynchronized edits" : "Synced with Visual & Graph"}
        </span>
        <span className="aw-code-language">TypeScript</span>
        <button
          className="aw-button aw-small"
          onClick={onApply}
          disabled={!dirty}
        >
          <CheckIcon />
          Apply code
        </button>
        <button
          title="Download source"
          aria-label="Download source"
          className="aw-icon-button"
          onClick={onDownload}
        >
          <ArrowDownTrayIcon />
        </button>
      </div>
      <div className="aw-editor">
        <Editor
          value={source}
          onChange={onChange}
          theme="dark"
          height="100%"
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
          }}
        />
      </div>
      {error ? (
        <p className="aw-code-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="aw-code-caption">
        Edit composition data to update every view. Custom program edits are
        preserved.
      </div>
    </div>
  );
}
