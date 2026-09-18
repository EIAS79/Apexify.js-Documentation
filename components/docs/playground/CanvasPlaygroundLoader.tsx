'use client';

import { useEffect, useState, type ComponentType } from 'react';

export interface CanvasPlaygroundProps {
  exampleId?: string;
  title: string;
  initialSource: string;
  previewUrl?: string;
  previewAlt: string;
  sourceHash: string;
}

/**
 * Route-local activation boundary for the DOC-8 / post-DOC-12 workbench.
 * The heavy editor/workspace bundle is not imported until the user expands it.
 */
export function CanvasPlaygroundLoader(props: CanvasPlaygroundProps) {
  const [activated, setActivated] = useState(false);
  const [Playground, setPlayground] = useState<ComponentType<CanvasPlaygroundProps> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!activated || Playground || failed) return;
    let active = true;

    void import('./VerifiedExamplePlayground')
      .then(({ VerifiedExamplePlayground }) => {
        if (active) setPlayground(() => VerifiedExamplePlayground);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [activated, Playground, failed]);

  if (!activated) {
    return (
      <section
        className="my-6 overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--border-default)', background: 'var(--bg-raised)', boxShadow: 'var(--shadow-sm)' }}
        data-post-doc12-workbench="collapsed"
      >
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,.8fr)] sm:p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: 'color-mix(in srgb,var(--accent-magenta) 75%,var(--text-primary))' }}>Interactive example</p>
            <h3 className="mt-1 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{props.title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>Open the verified source and output side by side. The editor is deferred until requested; this documentation surface does not pretend to run Node code in the browser.</p>
            <button type="button" onClick={() => setActivated(true)} className="mt-4 min-h-11 rounded-lg px-4 text-sm font-bold" style={{ background:'var(--gradient-sunset)', color:'white', boxShadow:'var(--shadow-sm)' }}>Show code &amp; preview</button>
          </div>
          {props.previewUrl ? (
            <div className="grid min-h-[150px] place-items-center rounded-xl border p-3" style={{ borderColor:'var(--border-subtle)', background:'var(--bg-sunken)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={props.previewUrl} alt={props.previewAlt} className="max-h-48 max-w-full rounded-lg object-contain" loading="lazy" />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (failed) {
    return (
      <section className="my-5 rounded-xl p-4 text-sm" style={{ border:'1px solid var(--border-default)', background:'var(--bg-raised)' }} data-doc8-playground-loader="error" role="status">
        The interactive workbench could not be loaded. The verified documentation content remains available above.
      </section>
    );
  }

  if (!Playground) {
    return (
      <section className="my-5 min-h-24 rounded-xl p-4 text-sm" style={{ border:'1px solid var(--border-default)', background:'var(--bg-raised)' }} data-doc8-playground-loader="loading" aria-busy="true">
        Loading example workbench…
      </section>
    );
  }

  return <Playground {...props} />;
}
