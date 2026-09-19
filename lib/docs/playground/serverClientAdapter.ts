'use client';

import type { StudioVirtualAsset } from '@/lib/studio/runtime/assets';
import {
  type ExecutionAdapter,
  type ExecutionResult,
  type InteractiveDiagnostic,
  type InteractiveArtifact,
} from './contracts';

const ENDPOINT = '/api/gallery/run';

export type ServerExecutionAvailability = {
  enabled: boolean;
  mode: 'trusted-local' | 'same-origin-isolated' | 'unavailable';
};

export async function getServerExecutionAvailability(signal?: AbortSignal): Promise<ServerExecutionAvailability> {
  const response = await fetch(ENDPOINT, { signal });
  if (!response.ok) return { enabled: false, mode: 'unavailable' };
  const value = (await response.json()) as { enabled?: boolean; mode?: string };
  return {
    enabled: Boolean(value.enabled),
    mode:
      value.mode === 'trusted-local'
        ? 'trusted-local'
        : value.mode === 'same-origin-isolated'
          ? 'same-origin-isolated'
          : 'unavailable',
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
      ? 'This source requires the built-in full Apexify runtime, but the same-origin isolation runtime is unavailable on this deployment.'
      : 'Fix the source or return a previewable Apexify artifact from main() before retrying.',
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
    const studioOptions = session.options as { studioAssets?: StudioVirtualAsset[] };
    const studioAssets = Array.isArray(studioOptions.studioAssets) ? studioOptions.studioAssets : [];

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: session.source,
        lang: session.language,
        context: 'studio',
        assets: studioAssets,
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
      outputs?: InteractiveArtifact[];
      primaryArtifactId?: string;
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

    const artifacts = Array.isArray(data.outputs) ? data.outputs : [];
    const primary =
      artifacts.find((artifact) => artifact.id === data.primaryArtifactId) ??
      artifacts[0];

    return {
      status: 'ready',
      output: {
        mime: primary?.mime ?? data.mime ?? 'application/octet-stream',
        base64: primary?.base64 ?? data.base64,
        provenance: 'server-generated',
        artifacts,
        primaryArtifactId: primary?.id ?? data.primaryArtifactId,
      },
      diagnostics: [],
      elapsedMs,
    };
  },
};
