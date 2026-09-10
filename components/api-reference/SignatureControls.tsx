"use client";

import { Fragment, useState } from 'react';
import type { ApiSignatureRecord } from '@/lib/api-reference/schema';

const TOKEN_RE = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:class|interface|type|enum|const|let|var|function|constructor|readonly|private|protected|public|static|async|await|return|extends|implements|new|this|typeof|keyof|infer|in|is|as|void|never|unknown|any|string|number|boolean|object|undefined|null|true|false|Promise|Array|Record|Buffer)\b|\b\d+(?:\.\d+)?\b)/g;

function tokenClass(token: string): string {
  if (token.startsWith('//') || token.startsWith('/*')) return 'apx-api-token-comment';
  if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) return 'apx-api-token-string';
  if (/^\d/.test(token)) return 'apx-api-token-number';
  if (['true', 'false', 'null', 'undefined'].includes(token)) return 'apx-api-token-literal';
  return 'apx-api-token-keyword';
}

function HighlightedTypeScript({ code }: { code: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(code))) {
    if (match.index > last) {
      out.push(<Fragment key={`t-${key++}`}>{code.slice(last, match.index)}</Fragment>);
    }
    out.push(
      <span key={`t-${key++}`} className={tokenClass(match[0])}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < code.length) out.push(<Fragment key={`t-${key++}`}>{code.slice(last)}</Fragment>);
  return <>{out}</>;
}

export function OverloadTabs({
  overloads,
  active,
  onChange,
}: {
  overloads: ApiSignatureRecord[];
  active: number;
  onChange: (index: number) => void;
}) {
  if (overloads.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="API overloads"
      className="apx-api-overload-tabs"
      data-doc4-component="OverloadTabs"
    >
      {overloads.map((overload, index) => (
        <button
          key={overload.id}
          role="tab"
          aria-selected={index === active}
          tabIndex={index === active ? 0 : -1}
          aria-controls="api-signature-panel"
          onClick={() => onChange(index)}
          onKeyDown={(event) => {
            if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            let next = index;
            if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = overloads.length - 1;
            else next = (index + (event.key === 'ArrowRight' ? 1 : -1) + overloads.length) % overloads.length;
            onChange(next);
            (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
          }}
        >
          {overload.label}
        </button>
      ))}
    </div>
  );
}

export function SignatureControls({
  overloads,
  permalink,
}: {
  overloads: ApiSignatureRecord[];
  permalink: string;
}) {
  const [active, setActive] = useState(0);
  const current = overloads[Math.min(active, overloads.length - 1)];

  async function copy() {
    if (!current) return;
    await navigator.clipboard.writeText(current.text);
  }

  if (!current) return null;
  return (
    <div className="apx-api-signature" data-doc4-component="ApiSignature">
      <OverloadTabs overloads={overloads} active={active} onChange={setActive} />
      <div className="apx-api-signature__bar">
        <span>TypeScript</span>
        <div>
          <button type="button" onClick={copy} aria-label="Copy API signature">
            Copy
          </button>
          <a href={permalink} aria-label="Permalink to API signature">
            Permalink
          </a>
        </div>
      </div>
      <pre id="api-signature-panel" role="tabpanel" tabIndex={0} aria-label="TypeScript API signature">
        <code>
          <HighlightedTypeScript code={current.text} />
        </code>
      </pre>
    </div>
  );
}
