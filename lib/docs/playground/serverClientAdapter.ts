'use client';

import {
  type ExecutionAdapter,
  type ExecutionResult,
  type InteractiveDiagnostic,
} from './contracts';

const ENDPOINT = '/api/gallery/run';

export type ServerExecutionAvailability = {
  enabled: boolean;
  mode: 'trusted-local' | 'unavailable';
};

export async function getServerExecutionAvailability(signal?: AbortSignal): Promise<ServerExecutionAvailability> {
  const response = await fetch(ENDPOINT, { signal });
  if (!response.ok) return { enabled: false, mode: 'unavailable' };
  const value = (await response.json()) as { enabled?: boolean; mode?: string };
  return {
    enabled: Boolean(value.enabled),
    mode: value.mode === 'trusted-local' ? 'trusted-local' : 'unavailable',
  };
}

function diagnosticFromFailure(data: {
  error?: string;
  stderr?: string;
  exitCode?: number;
}, status: number): InteractiveDiagnostic {
  const stderr = typeof data.stderr === 'string' ? data.stderr.trim() : '';
  let message = typeof data.error === 'string' ? data.error.trim() : '';
  if (stderr && message && !message.includes(stderr.slice(0, Math.min(100, stderr.length)))) {
    message = `${message}\n\n━━ stderr ━━\n${stderr}`;
  } else if (stderr && !message) {
    message = stderr;
  }
  return {
    id: 'server-backed-execution',
    severity: 'error',
    message: message || `Execution failed (HTTP ${status}).`,
    code: typeof data.exitCode === 'number' ? `EXIT_${data.exitCode}` : `HTTP_${status}`,
    help: status === 503
      ? 'Public arbitrary execution is intentionally unavailable. Use DOC-5 verified output or explicitly enabled trusted-local development execution.'
      : 'Fix the source or reset to the authoritative example before retrying.',
  };
}

export const currentNodeServerExecutionAdapter: ExecutionAdapter = {
  id: 'current-node-server-backed',
  runtime: 'node',
  mode: 'server-backed',
  async run({ session, signal }): Promise<ExecutionResult> {
    if (session.runtime !== 'node') {
      return {
        status: 'unsupported',
        diagnostics: [{
          id: 'unsupported-runtime',
          severity: 'info',
          message: `The current server-backed adapter cannot execute runtime ${session.runtime}.`,
        }],
      };
    }

    const started = performance.now();
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: session.source,
        lang: session.language,
        context: 'studio',
      }),
      signal,
    });

    let data: {
      ok?: boolean;
      mime?: string;
      base64?: string;
      error?: string;
      stderr?: string;
      exitCode?: number;
      elapsedMs?: number;
    };
    try {
      data = (await response.json()) as typeof data;
    } catch {
      return {
        status: 'error',
        diagnostics: [{
          id: 'invalid-runner-response',
          severity: 'error',
          message: `Execution failed (HTTP ${response.status}) because the response was not JSON.`,
        }],
        elapsedMs: Math.round(performance.now() - started),
      };
    }

    const elapsedMs = typeof data.elapsedMs === 'number'
      ? data.elapsedMs
      : Math.round(performance.now() - started);

    if (!response.ok || !data.ok) {
      return {
        status: response.status === 503 ? 'unsupported' : 'error',
        diagnostics: [diagnosticFromFailure(data, response.status)],
        elapsedMs,
      };
    }

    return {
      status: 'ready',
      output: {
        mime: data.mime ?? 'image/png',
        base64: data.base64 ?? '',
        provenance: 'server-generated',
      },
      diagnostics: [],
      elapsedMs,
    };
  },
};
