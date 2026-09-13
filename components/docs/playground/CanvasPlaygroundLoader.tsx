'use client';

import { useEffect, useState, type ComponentType } from 'react';

export interface CanvasPlaygroundProps {
  title: string;
  initialSource: string;
  previewUrl?: string;
  previewAlt: string;
  sourceHash: string;
}

/**
 * Route-local activation boundary for the DOC-8 Canvas playground.
 *
 * The catch-all docs route may reference this tiny client module, but the
 * heavyweight interactive workspace is imported only after this component
 * actually mounts on /docs/node/canvas. Native import() is intentional here:
 * next/dynamic would register preload metadata for the whole catch-all route.
 */
export function CanvasPlaygroundLoader(props: CanvasPlaygroundProps) {
  const [Playground, setPlayground] = useState<ComponentType<CanvasPlaygroundProps> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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
  }, []);

  if (failed) {
    return (
      <section
        className="my-5 rounded-xl p-4 text-sm"
        style={{ border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}
        data-doc8-playground-loader="error"
        role="status"
      >
        The interactive example could not be loaded. The verified documentation content remains available above.
      </section>
    );
  }

  if (!Playground) {
    return (
      <section
        className="my-5 min-h-24 rounded-xl p-4 text-sm"
        style={{ border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}
        data-doc8-playground-loader="loading"
        aria-busy="true"
      >
        Loading interactive example…
      </section>
    );
  }

  return <Playground {...props} />;
}
