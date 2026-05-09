/**
 * Normalize temp sandbox paths in runner stderr/stacks so users see `(sandbox)/snippet.ts`
 * instead of long OS temp paths.
 */
export function normalizeSandboxPaths(text: string): string {
  let s = text.replace(/\r\n/g, '\n');
  // Windows: drive letter path ending in apexify-gallery-<uuid>\
  s = s.replace(/(?:[A-Za-z]:)?[^:*?"<>|\n]*?apexify-gallery-[a-f0-9-]+\\/gi, '(sandbox)\\');
  // Unix: /tmp/apexify-gallery-<uuid>/
  s = s.replace(/(?:\/var\/folders\/[^/\s]+\/[^/\s]+\/)?T\/apexify-gallery-[a-f0-9-]+\//gi, '(sandbox)/');
  s = s.replace(/\/tmp\/apexify-gallery-[a-f0-9-]+\//gi, '(sandbox)/');
  return s;
}

export interface ParsedRunnerOutput {
  /** Short title for the failure */
  headline: string;
  /** Bullet hints pointing at cause / line */
  hints: string[];
  /** Full normalized output for the terminal body */
  terminalBody: string;
}

/**
 * Derive a readable headline + hints from tsx / Node / TypeScript diagnostics.
 */
export function parseStudioRunnerOutput(raw: string): ParsedRunnerOutput {
  const terminalBody = normalizeSandboxPaths(raw.trim());
  const hints: string[] = [];

  // TypeScript diagnostic: snippet.ts(15,10): error TS2322: ...
  const tsDiag = terminalBody.match(
    /snippet\.(?:ts|js)\((\d+),\s*(\d+)\):\s*error\s+(TS\d+):\s*([^\n]+)/i
  );
  if (tsDiag) {
    const [, line, col, code, msg] = tsDiag;
    const cleanMsg = msg.replace(/\s+$/, '').trim();
    return {
      headline: `${code}: ${cleanMsg.slice(0, 180)}${cleanMsg.length > 180 ? '…' : ''}`,
      hints: [
        `Location: line ${line}, column ${col} in your snippet (what you typed in the editor).`,
        `Cause: TypeScript rejected this before run — fix types or syntax at that line.`,
      ],
      terminalBody,
    };
  }

  let headline = 'Runtime or compile error';

  // snippet.ts:42 — message (tsx / esbuild style)
  const locPlain = terminalBody.match(/^snippet\.(?:ts|js):(\d+)(?::(\d+))?\s*[—:-]?\s*(.+)$/im);
  if (locPlain && !tsDiag) {
    const [, line, col, rest] = locPlain;
    const firstLine = rest.trim().split('\n')[0] ?? rest.trim();
    headline = firstLine.length > 160 ? `${firstLine.slice(0, 157)}…` : firstLine;
    hints.push(`Location: line ${line}${col ? `, column ${col}` : ''} in your snippet.`);
    if (firstLine.length < 400) {
      hints.push('Cause: see message above; stack lines below show how execution reached this point.');
    }
  }

  const errLine =
    terminalBody.match(/^Error:\s*(.+)$/m)?.[1]?.trim() ??
    terminalBody.match(/^(SyntaxError|TypeError|ReferenceError|RangeError):\s*(.+)$/m)?.[2]?.trim();

  if (errLine && headline === 'Runtime or compile error') {
    headline = errLine.length > 140 ? `${errLine.slice(0, 137)}…` : errLine;
  }

  const lineOnly = terminalBody.match(/snippet\.(?:ts|js):(\d+)(?::(\d+))?/);
  if (lineOnly && hints.length === 0) {
    hints.push(
      `Stack trace references line ${lineOnly[1]}${lineOnly[2] ? `, column ${lineOnly[2]}` : ''} of your snippet.`
    );
  }

  const caused = terminalBody.match(/^Caused by:\s*(.+)$/m);
  if (caused) {
    hints.push(`Caused by: ${caused[1].trim().slice(0, 220)}`);
  }

  if (hints.length === 0) {
    hints.push('Read the message and stack below — the first Error line usually states what broke.');
    hints.push('Paths shown as `(sandbox)/snippet.ts` are your submitted code in the runner.');
  }

  return { headline, hints: hints.slice(0, 5), terminalBody };
}
