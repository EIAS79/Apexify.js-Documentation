'use client';

import {
  studioAssetsReferencedBySources,
  type StudioVirtualAsset,
} from '@/lib/studio/runtime/assets';
import type { StudioWorkspaceFile } from '@/lib/studio/runtime/workspace';
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

const STUDIO_BUSY_RETRY_DELAYS_MS = [450, 900, 1500] as const;
const HOSTED_STUDIO_PREVIEW_ASSET_BUDGET = 2.5 * 1024 * 1024;

function studioAssetBytes(assets: readonly StudioVirtualAsset[]) {
  return assets.reduce((sum, asset) => sum + Math.max(0, asset.size || 0), 0);
}

function studioBase64Bytes(base64: string) {
  const normalized = base64.replace(/\s+/g, '');
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - padding);
}

function studioAssetBlob(asset: StudioVirtualAsset) {
  const binary = atob(asset.base64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: asset.mime || 'application/octet-stream' });
}

async function compactStudioPreviewImage(
  asset: StudioVirtualAsset,
  maxDimension: number,
  quality: number,
): Promise<StudioVirtualAsset> {
  if (
    typeof document === 'undefined' ||
    typeof createImageBitmap === 'undefined' ||
    !/^image\/(?:png|jpe?g|webp)$/i.test(asset.mime) ||
    asset.size < 160 * 1024
  ) {
    return asset;
  }

  try {
    const bitmap = await createImageBitmap(studioAssetBlob(asset));
    try {
      const scale = Math.min(
        1,
        maxDimension / Math.max(1, bitmap.width, bitmap.height),
      );
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) return asset;
      context.drawImage(bitmap, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/webp', quality);
      const comma = dataUrl.indexOf(',');
      if (comma < 0) return asset;
      const base64 = dataUrl.slice(comma + 1);
      const size = studioBase64Bytes(base64);
      if (size >= asset.size) return asset;
      return {
        ...asset,
        name: asset.name.replace(/\.[^.]+$/, '') + '.webp',
        mime: 'image/webp',
        size,
        base64,
        metadata: {
          ...(asset.metadata ?? {}),
          width,
          height,
        },
      };
    } finally {
      bitmap.close();
    }
  } catch {
    return asset;
  }
}

async function prepareHostedStudioPreviewAssets(
  assets: readonly StudioVirtualAsset[],
): Promise<StudioVirtualAsset[]> {
  if (
    typeof window === 'undefined' ||
    studioAssetBytes(assets) <= HOSTED_STUDIO_PREVIEW_ASSET_BUDGET
  ) {
    return [...assets];
  }

  let prepared = await Promise.all(
    assets.map((asset) => compactStudioPreviewImage(asset, 1400, 0.76)),
  );
  if (studioAssetBytes(prepared) > HOSTED_STUDIO_PREVIEW_ASSET_BUDGET) {
    prepared = await Promise.all(
      prepared.map((asset) => compactStudioPreviewImage(asset, 960, 0.62)),
    );
  }
  return prepared;
}

function waitForRetry(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchStudioRunner(
  body: string,
  signal?: AbortSignal,
): Promise<Response> {
  let response: Response | null = null;
  for (let attempt = 0; attempt <= STUDIO_BUSY_RETRY_DELAYS_MS.length; attempt += 1) {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal,
    });
    if (response.status !== 429 || attempt === STUDIO_BUSY_RETRY_DELAYS_MS.length) {
      return response;
    }
    await waitForRetry(STUDIO_BUSY_RETRY_DELAYS_MS[attempt]!, signal);
  }
  return response!;
}

function diagnosticFromFailure(data: {
  error?: string;
  stderr?: string;
  exitCode?: number;
  runtimeDebug?: unknown;
}, status: number): InteractiveDiagnostic {
  const stderr = typeof data.stderr === 'string' ? data.stderr.trim() : '';
  let message = typeof data.error === 'string' ? data.error.trim() : '';
  if (stderr && message && !message.includes(stderr.slice(0, Math.min(100, stderr.length)))) {
    message = `${message}\n\n━━ stderr ━━\n${stderr}`;
  } else if (stderr && !message) {
    message = stderr;
  }

  if (data.runtimeDebug && typeof data.runtimeDebug === 'object') {
    let debugText = '';
    try {
      debugText = JSON.stringify(data.runtimeDebug, null, 2);
    } catch {
      debugText = String(data.runtimeDebug);
    }
    if (debugText) {
      message += `\n\n━━ runtime debug ━━\n${debugText}`;
    }
  }

  return {
    id: 'server-backed-execution',
    severity: 'error',
    message: message || `Execution failed (HTTP ${status}).`,
    code: typeof data.exitCode === 'number' ? `EXIT_${data.exitCode}` : `HTTP_${status}`,
    help: status === 503
      ? 'This source requires the built-in full Apexify runtime, but the same-origin isolation runtime is unavailable on this deployment.'
      : status === 429
        ? 'Studio automatically retried the busy runtime. Wait for the active render to finish, then retry if this message remains.'
        : status === 408
          ? 'The full runtime reached its execution ceiling. Prefer Studio-local frame extraction for uploaded video backgrounds.'
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
    const studioOptions = session.options as {
      studioAssets?: StudioVirtualAsset[];
      studioFiles?: StudioWorkspaceFile[];
    };
    const studioAssets = Array.isArray(studioOptions.studioAssets) ? studioOptions.studioAssets : [];
    const studioFiles = Array.isArray(studioOptions.studioFiles) ? studioOptions.studioFiles : [];
    const referencedStudioAssets = studioAssetsReferencedBySources(
      studioAssets,
      [session.source, ...studioFiles.map((file) => file.source)],
    );
    const hostedPreviewAssets = await prepareHostedStudioPreviewAssets(
      referencedStudioAssets,
    );

    const requestBody = JSON.stringify({
      code: session.source,
      lang: session.language,
      context: 'studio',
      assets: hostedPreviewAssets,
      files: studioFiles,
    });
    const response = await fetchStudioRunner(requestBody, signal);

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
      runtimeDebug?: unknown;
    };
    try {
      data = (await response.json()) as typeof data;
    } catch {
      const referencedBytes = studioAssetBytes(referencedStudioAssets);
      const transmittedBytes = studioAssetBytes(hostedPreviewAssets);
      const requestTooLarge = response.status === 413;
      return {
        status: 'error',
        diagnostics: [{
          id: requestTooLarge ? 'runner-request-too-large' : 'invalid-runner-response',
          severity: 'error',
          message: requestTooLarge
            ? referencedBytes > 0
              ? `The Studio runtime request was rejected as too large before execution (HTTP 413). Original referenced assets total ${(referencedBytes / (1024 * 1024)).toFixed(2)} MiB; the preview proxy transmitted ${(transmittedBytes / (1024 * 1024)).toFixed(2)} MiB. Reduce the source media if the deployment still rejects the preview request.`
              : 'The Studio runtime request was rejected as too large before execution (HTTP 413).'
            : `Execution failed (HTTP ${response.status}) because the response was not JSON.`,
          code: requestTooLarge ? 'HTTP_413' : `HTTP_${response.status}`,
          help: requestTooLarge
            ? 'Studio excludes unrelated shelf assets and automatically sends downscaled WebP proxies for large static image previews. Generated code and exported project assets still use the originals.'
            : 'Retry the execution. If the problem persists, inspect the runtime response and deployment logs.',
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
