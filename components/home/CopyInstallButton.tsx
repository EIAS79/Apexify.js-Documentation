'use client';

import { useState } from 'react';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';

export default function CopyInstallButton({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex max-w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left font-mono text-xs sm:text-sm"
      style={{
        borderColor: 'var(--border-default)',
        backgroundColor: 'var(--bg-sunken)',
        color: 'var(--text-secondary)',
      }}
      aria-label="Copy Apexify.js install command"
    >
      <span className="truncate"><span aria-hidden>$ </span>{command}</span>
      {copied ? <CheckIcon className="h-4 w-4 shrink-0" /> : <ClipboardIcon className="h-4 w-4 shrink-0" />}
      <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </button>
  );
}
