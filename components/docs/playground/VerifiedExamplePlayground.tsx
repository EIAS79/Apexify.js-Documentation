'use client';

import { useMemo, useState } from 'react';
import { InteractiveCodeEditor } from './InteractiveCodeEditor';
import { InteractivePreview } from './InteractivePreview';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { InteractiveWorkspace } from './InteractiveWorkspace';
import { InteractiveErrorBoundary } from './InteractiveErrorBoundary';
import { createInteractiveSession, resetInteractiveSession } from '@/lib/docs/playground/session';
import { encodeShareLink } from '@/lib/studio/studioStorage';

type WorkbenchMode = 'ts' | 'preview' | 'both';

export function ExampleWorkbench({
  exampleId,
  title,
  initialSource,
  previewUrl,
  previewAlt,
  sourceHash,
}: {
  exampleId?: string;
  title: string;
  initialSource: string;
  previewUrl?: string;
  previewAlt: string;
  sourceHash: string;
}) {
  const initial = useMemo(
    () => createInteractiveSession({
      source: initialSource,
      language: 'ts',
      runtime: 'node',
      options: { exampleId: exampleId ?? null, sourceHash },
      layout: { activePanel: 'editor' },
    }),
    [exampleId, initialSource, sourceHash],
  );
  const [session, setSession] = useState(initial);
  const [mode, setMode] = useState<WorkbenchMode>('both');
  const [copied, setCopied] = useState(false);
  const diagnostics = useMemo(
    () => [{
      id: 'doc5-provenance',
      severity: 'info' as const,
      message: 'Preview is DOC-5 verified output. Editing source here does not execute code or alter verification evidence.',
      source: sourceHash,
      help: 'Open the current session in Studio when trusted-local execution is intentionally enabled.',
    }],
    [sourceHash],
  );

  const reset = () => setSession(resetInteractiveSession(initial));
  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(session.source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  const openInStudio = () => {
    const encoded = encodeShareLink({ name: title, ts: session.source, js: '', lang: 'ts' });
    window.location.assign(`/studio#snippet=${encodeURIComponent(encoded)}`);
  };

  const editor = (
    <InteractiveErrorBoundary label="Editor">
      <InteractiveCodeEditor
        value={session.source}
        language={session.language}
        onChange={(source) => setSession((current) => ({ ...current, source }))}
        ariaLabel={`${title} TypeScript source editor`}
      />
    </InteractiveErrorBoundary>
  );
  const preview = (
    <InteractiveErrorBoundary label="Preview">
      <InteractivePreview status={previewUrl ? 'ready' : 'unsupported'} label={`${title} preview`} provenance="verified">
        {previewUrl ? (
          <div className="grid min-h-[220px] flex-1 place-items-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={previewAlt} className="max-h-[420px] max-w-full rounded-lg object-contain" />
          </div>
        ) : null}
      </InteractivePreview>
    </InteractiveErrorBoundary>
  );

  return (
    <section className="apx-example-workbench my-6 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-raised)', boxShadow: 'var(--shadow-md)' }} data-post-doc12-workbench data-example-id={exampleId ?? undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-sunken)' }}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'color-mix(in srgb,var(--accent-magenta) 75%,var(--text-primary))' }}>Verified example workbench</p>
          <h3 className="mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Workbench view">
          {([['ts','TypeScript'],['preview','Preview'],['both','Both']] as const).map(([value,label]) => (
            <button key={value} type="button" role="tab" aria-selected={mode===value} onClick={() => setMode(value)} className="min-h-10 rounded-lg border px-3 text-xs font-bold" style={{ borderColor: mode===value?'var(--accent-iris)':'var(--border-default)', background: mode===value?'color-mix(in srgb,var(--accent-iris) 10%,var(--bg-raised))':'var(--bg-raised)', color: 'var(--text-primary)' }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5 sm:px-5" style={{ borderColor: 'var(--border-subtle)' }}>
        <button type="button" onClick={() => void copySource()} className="min-h-10 rounded-lg border px-3 text-xs font-bold" style={{ borderColor:'var(--border-default)', background:'var(--bg-raised)' }}>{copied?'Copied':'Copy code'}</button>
        <button type="button" onClick={reset} className="min-h-10 rounded-lg border px-3 text-xs font-bold" style={{ borderColor:'var(--border-default)', background:'var(--bg-raised)' }}>Reset</button>
        <button type="button" data-post-doc12-action="open-in-studio" onClick={openInStudio} className="min-h-10 rounded-lg border px-3 text-xs font-bold" style={{ borderColor:'var(--accent-iris)', background:'color-mix(in srgb,var(--accent-iris) 10%,var(--bg-raised))', color:'var(--text-primary)' }}>Open in Studio</button>
        <span className="ml-auto text-[10px] font-semibold" style={{ color:'var(--text-tertiary)' }}>Verified preview · local edits are not executed</span>
      </div>

      <InteractiveErrorBoundary label="Interactive example workspace">
        <div className="min-h-[280px] p-3 sm:p-4">
          {mode === 'both' ? (
            <InteractiveWorkspace editor={editor} preview={preview} diagnostics={<DiagnosticsPanel diagnostics={diagnostics} />} />
          ) : mode === 'ts' ? (
            <div className="grid min-h-[320px] gap-3"><div className="min-h-[280px] overflow-hidden">{editor}</div><DiagnosticsPanel diagnostics={diagnostics} /></div>
          ) : (
            <div className="grid min-h-[320px] gap-3"><div className="min-h-[280px] overflow-hidden">{preview}</div><DiagnosticsPanel diagnostics={diagnostics} /></div>
          )}
        </div>
      </InteractiveErrorBoundary>

      <div className="border-t px-4 py-2.5 text-[10px] leading-5 sm:px-5" style={{ borderColor:'var(--border-subtle)', color:'var(--text-tertiary)' }}>
        Provenance: <code>{exampleId ?? 'verified-example'}</code> · source <code>{sourceHash.slice(0, 12)}</code> · preview from DOC-5 verification artifacts.
      </div>
    </section>
  );
}

/** Compatibility export retained for DOC-8 callers and integrity checks. */
export function VerifiedExamplePlayground(props: Parameters<typeof ExampleWorkbench>[0]) {
  return <ExampleWorkbench {...props} />;
}
