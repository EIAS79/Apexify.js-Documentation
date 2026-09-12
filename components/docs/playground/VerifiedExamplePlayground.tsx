'use client';

import { useMemo, useState } from 'react';
import { InteractiveCodeEditor } from './InteractiveCodeEditor';
import { InteractivePreview } from './InteractivePreview';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { InteractiveWorkspace } from './InteractiveWorkspace';
import { InteractiveErrorBoundary } from './InteractiveErrorBoundary';
import { createInteractiveSession, resetInteractiveSession, serializeInteractiveSession } from '@/lib/docs/playground/session';

export function VerifiedExamplePlayground({
  title,
  initialSource,
  previewUrl,
  previewAlt,
  sourceHash,
}: {
  title: string;
  initialSource: string;
  previewUrl?: string;
  previewAlt: string;
  sourceHash: string;
}) {
  const initial = useMemo(() => createInteractiveSession({ source: initialSource, language: 'ts', runtime: 'node', options: {}, layout: { activePanel: 'editor' } }), [initialSource]);
  const [session, setSession] = useState(initial);
  const [copied, setCopied] = useState(false);
  const diagnostics = useMemo(() => [{ id: 'doc5-provenance', severity: 'info' as const, message: 'Preview is DOC-5 verified output. Local source edits do not execute or replace verification evidence.', source: sourceHash, help: 'Use Studio only when a legitimate execution adapter is available.' }], [sourceHash]);

  const reset = () => setSession(resetInteractiveSession(initial));
  const copyShareState = async () => {
    try { await navigator.clipboard.writeText(serializeInteractiveSession(session)); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); }
  };

  return <section className="my-5 grid gap-3" data-doc8-representative-playground="verified-example">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{color:'var(--text-tertiary)'}}>Interactive documentation · Node example</p><h3 className="text-base font-semibold">{title}</h3></div>
      <div className="flex gap-2"><button type="button" onClick={reset} className="min-h-11 rounded-lg px-3 text-sm font-semibold" style={{border:'1px solid var(--border-default)',background:'var(--bg-raised)'}}>Reset source</button><button type="button" onClick={()=>void copyShareState()} className="min-h-11 rounded-lg px-3 text-sm font-semibold" style={{border:'1px solid var(--border-default)',background:'var(--bg-raised)'}}>{copied?'State copied':'Copy local state'}</button></div>
    </div>
    <InteractiveErrorBoundary label="Interactive example workspace">
      <InteractiveWorkspace editor={<InteractiveErrorBoundary label="Editor"><InteractiveCodeEditor value={session.source} language={session.language} onChange={source=>setSession(current=>({...current,source}))} ariaLabel={`${title} source editor`} /></InteractiveErrorBoundary>} preview={<InteractiveErrorBoundary label="Preview"><InteractivePreview status={previewUrl?'ready':'unsupported'} label={`${title} preview`} provenance="verified">{previewUrl?<div className="grid min-h-[220px] flex-1 place-items-center p-4">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={previewUrl} alt={previewAlt} className="max-h-[420px] max-w-full rounded-lg object-contain" /></div>:null}</InteractivePreview></InteractiveErrorBoundary>} diagnostics={<DiagnosticsPanel diagnostics={diagnostics}/>}/>
    </InteractiveErrorBoundary>
  </section>;
}
