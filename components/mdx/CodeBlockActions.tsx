'use client';

import { useState } from 'react';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

export type StudioHandoffPayload = {
  name: string;
  ts: string;
  js: string;
  lang: 'ts' | 'js';
};

export function CodeBlockActions({
  code,
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

  return (
    <div className="apx-code-actions">
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
