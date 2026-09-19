'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRightIcon, CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

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
    <div className="apx-code-actions">
      {studioPayload ? (
        <Link
          href="/studio"
          prefetch={false}
          onClick={persistStudioHandoff}
          className="apx-code-action apx-code-action--studio"
          title="Open this snippet in Studio"
        >
          Studio
          <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}

      <button
        type="button"
        onClick={copy}
        className="apx-code-action"
        aria-label={copied ? 'Code copied' : 'Copy code'}
      >
        {copied
          ? <CheckIcon className="h-3.5 w-3.5" aria-hidden />
          : <ClipboardDocumentIcon className="h-3.5 w-3.5" aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
