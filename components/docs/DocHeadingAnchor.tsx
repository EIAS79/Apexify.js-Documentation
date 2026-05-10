'use client';

import { useState } from 'react';
import { LinkIcon, CheckIcon } from '@heroicons/react/24/outline';

/**
 * Hover-only anchor button that copies a deep link to the current heading.
 * Used inside the MDX h2/h3 renderer.
 */
export function DocHeadingAnchor({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;
    const base = `${window.location.origin}${window.location.pathname}`;
    const docHash = window.location.hash || '';
    const docMatch = docHash.match(/^#([^?#]+)/);
    const docFile = docMatch ? docMatch[1] : '';
    const url = docFile ? `${base}#${docFile}?h=${id}` : `${base}#${id}`;
    void navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => {
        /* clipboard blocked */
      }
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? 'Link copied' : 'Copy link to section'}
      title={copied ? 'Link copied!' : 'Copy link to section'}
      className="not-prose ml-2 inline-grid h-7 w-7 shrink-0 place-items-center rounded-md align-middle opacity-0 transition-all group-hover:opacity-100 focus:opacity-100"
      style={{
        color: copied ? 'var(--success)' : 'var(--text-tertiary)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-raised)',
      }}
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <LinkIcon className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}
