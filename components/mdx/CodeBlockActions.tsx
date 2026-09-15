'use client';

import Link from 'next/link';
import { useState } from 'react';

export type StudioHandoffPayload = {
  name: string;
  ts: string;
  js: string;
  lang: 'ts' | 'js';
};

export function CodeBlockActions({
  code,
  studioPayload,
  storageKey,
}: {
  code: string;
  studioPayload: StudioHandoffPayload | null;
  storageKey: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const persistStudioHandoff = () => {
    if (!studioPayload) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(studioPayload));
    } catch {
      // Studio remains directly navigable when storage is unavailable.
    }
  };

  return (
    <div className="flex items-center gap-2">
      {studioPayload ? (
        <Link
          href="/studio"
          prefetch={false}
          onClick={persistStudioHandoff}
          className="flex min-h-11 items-center rounded-lg border border-violet-400/50 px-3 py-1.5 text-xs text-violet-200 transition-colors duration-150 hover:border-violet-300 hover:bg-slate-700 hover:text-white"
          title="Open this snippet in Studio and run it"
        >
          Studio
        </Link>
      ) : null}
      <button
        type="button"
        onClick={copy}
        className="flex min-h-11 items-center rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-gray-200 transition-colors duration-150 hover:border-blue-400 hover:bg-slate-700 hover:text-white"
        aria-label={copied ? 'Code copied' : 'Copy code'}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
