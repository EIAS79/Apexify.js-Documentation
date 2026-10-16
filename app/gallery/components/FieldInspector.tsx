'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { STUDIO_INCOMING_SNIPPET_KEY } from '@/lib/studio/studioConfig';
import { XMarkIcon, ArrowDownTrayIcon, ClipboardDocumentIcon, CheckIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import type { FieldEntry } from '@/lib/gallery/motion-field/catalog';
import { FieldPlayer } from './FieldMedia';
const FieldCode = dynamic(() => import('./FieldCode'), { loading: () => <p className="field-loading">Loading code display…</p> });
type Page = { label: string; language: string; code: string };
type SourceData = { pages: Page[]; outputs?: { src: string; label: string; media?: string }[]; sourceHref?: string; studio?: boolean };
const INSTALL = 'npm install github:EIAS79/Apexify.js#379a5248f09ed39c1b1734fe104b6bd73a77857f dejavu-fonts-ttf@2.37.3';

export default function FieldInspector({ item, motion, onClose }: { item: FieldEntry; motion: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<SourceData | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [output, setOutput] = useState(0);
  const [view, setView] = useState<'guide' | 'source'>('guide');
  const [copy, setCopy] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = old; previous?.focus(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    async function load() {
      try {
        const response = await fetch(item.source ?? `/api/gallery/source?id=${encodeURIComponent(item.id)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Source could not be loaded.');
        const loaded = item.source ? { pages: [{ label: `${item.id}.mjs`, language: 'javascript', code: await response.text() }] } : await response.json();
        if (!controller.signal.aborted) setData(loaded);
      } catch (reason) { if (!controller.signal.aborted) setError('Source could not be loaded. Try again.'); }
    }
    void load(); return () => controller.abort();
  }, [item.id, item.source, retry]);
  const active = data?.pages[page];
  const sourceOutput = data?.outputs?.[output];
  const display = sourceOutput ? { ...item, thumbnail: sourceOutput.src, poster: undefined, media: sourceOutput.media === 'video' ? 'video' as const : 'image' as const } : item;
  async function copyText(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setCopy(`${label} copied.`); }
    catch { setCopy('Clipboard unavailable. Select the text or download the source.'); }
  }
  function openStudio() {
    if (!active || !data?.studio) return;
    const lang = active.language === 'ts' ? 'ts' : 'js';
    const code = data.pages.filter(entry => entry.language === active.language).map(entry => entry.code).join('\n\n');
    try {
      localStorage.setItem(STUDIO_INCOMING_SNIPPET_KEY, JSON.stringify({ name: item.title, lang, ts: lang === 'ts' ? code : '', js: lang === 'js' ? code : '' }));
      router.push('/studio');
    } catch { setCopy('Studio transfer unavailable. Copy the source instead.'); }
  }
  return <dialog ref={dialog} className="field-dialog" aria-labelledby="field-inspector-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="field-dialog-inner">
      <header className="field-dialog-header"><div><p className="field-eyebrow">{item.kind} / {item.sourceLabel}</p><h2 id="field-inspector-title">{item.title}</h2></div><button className="field-icon" autoFocus aria-label="Close example" onClick={onClose}><XMarkIcon /></button></header>
      <div className="field-inspector-body">
        <div className="field-inspector-preview"><FieldPlayer key={`${item.id}-${output}`} item={display} motion={motion} onInspect={() => setView('source')} />
          {!!data?.outputs?.length && <label className="field-output-select">Output<select value={output} onChange={event => setOutput(Number(event.target.value))}>{data.outputs.map((asset, i) => <option key={asset.src} value={i}>{asset.label}</option>)}</select></label>}
          <p>{item.description}</p>
          <div className="field-proof"><span className="field-dot" />{item.source ? 'Source-backed Apexify rendering · 1200 × 675' : item.sourceLabel}</div>
          {item.output && <a className="field-text-link" href={item.output} download>Download original PNG <ArrowDownTrayIcon /></a>}
          {item.source && item.kind === 'template' && item.media === 'video' && <p className="field-note">The loop uses 48 calls to render(phase), encoded with FFmpeg. Run the file for the still image; the browser plays a rendered video.</p>}
          {item.docs && <a className="field-text-link" href={item.docs}>Read the related documentation <ArrowUpRightIcon /></a>}
        </div>
        <div className="field-inspector-code">
          <div className="field-segment" aria-label="Example view"><button aria-pressed={view === 'guide'} onClick={() => setView('guide')}>Walkthrough</button><button aria-pressed={view === 'source'} onClick={() => setView('source')}>Full source</button></div>
          {view === 'guide' ? <div className="field-guide">
            <h3>{item.source ? 'From a blank canvas to this.' : 'Understand the rendering recipe.'}</h3>
            {item.steps ? <ol>{item.steps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h4>{step.title}</h4><p>{step.detail}</p></div></li>)}</ol>
              : <p>This existing {item.kind === 'showcase' ? 'showcase is presented as a finished film. It does not include a runnable source recipe.' : 'example includes its published source. Open Full source to inspect the implementation and its dependencies.'}</p>}
            {!item.source && data?.sourceHref && <p className="field-note">This advanced recipe is source-backed, but may rely on the original Peak Lab project setup. Review the complete canonical source and required assets before executing locally.</p>}
            {item.source && <div className="field-setup"><h4>Run it locally</h4><p>Use Node.js 22+ and Git. In a new folder, install the exact runtime and fonts used for this output:</p><pre tabIndex={0}>{INSTALL}</pre><button className="field-text-link" onClick={() => copyText(INSTALL, 'Install command')}>Copy install command <ClipboardDocumentIcon /></button><p>Download the source into that folder, then run:</p><pre tabIndex={0}>node {item.id}.mjs</pre><p>Your PNG appears beside the script. No image assets or API keys are needed.</p>{item.media === 'video' && <><p>To reproduce the four-second loop, install FFmpeg on your PATH and run:</p><pre tabIndex={0}>node {item.id}.mjs --animate</pre><p>This renders all 48 frames before encoding an MP4. The extra bottom pixel is padding for video compatibility.</p></>}</div>}
            <button className="field-primary" onClick={() => setView('source')}>Read the full source <ArrowUpRightIcon /></button>
          </div> : <div className="field-source">
            {!data && !error && <p role="status">Loading source…</p>}
            {error && <div role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Retry source</button></div>}
            {data && !data.pages.length && <p>This showcase has no published source recipe. Explore Templates for complete runnable examples.</p>}
            {active && <><div className="field-source-toolbar"><label>Source file<select value={page} onChange={event => setPage(Number(event.target.value))}>{data?.pages.map((entry, i) => <option key={i} value={i}>{entry.label}</option>)}</select></label><button className="field-icon" aria-label="Copy source code" onClick={() => copyText(active.code, 'Source')}>{copy === 'Source copied.' ? <CheckIcon /> : <ClipboardDocumentIcon />}</button></div><FieldCode code={active.code} language={active.language} /></>}
            {data?.sourceHref && <a className="field-text-link" href={data.sourceHref} target="_blank" rel="noreferrer">Canonical recipe source <ArrowUpRightIcon /></a>}
          </div>}
          <div className="field-source-footer">{data?.studio && active && <button className="field-primary" onClick={openStudio}>Open in Studio <ArrowUpRightIcon /></button>}{item.source && <a className="field-primary" href={item.source} download={`${item.id}.mjs`}>Download source <ArrowDownTrayIcon /></a>}<span role="status">{copy}</span></div>
        </div>
      </div>
    </div>
  </dialog>;
}
