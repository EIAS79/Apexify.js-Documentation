import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { InteractiveArtifact } from '@/lib/docs/playground/contracts';
import { DOC8_RESOURCE_LIMITS } from '@/lib/docs/playground/contracts';
import { detectStudioMedia } from './media';
import type { StudioVirtualAsset } from './assets';
import { STUDIO_ASSET_LIMITS } from './assets';
import { wrapStudioSnippetForRunner } from './wrapStudioSnippetForRunner';

type ManifestEntry = {
  id?: string;
  name?: string;
  path?: string;
  text?: string;
  mime?: string;
  kind?: InteractiveArtifact['kind'];
  metadata?: Record<string, unknown>;
};

type Manifest = {
  schemaVersion?: number;
  artifacts?: ManifestEntry[];
};

export type IsolatedStudioRunResult = {
  status: number;
  body: {
    ok: boolean;
    error?: string;
    stderr?: string;
    elapsedMs?: number;
    exitCode?: number | null;
    runtime?: 'same-origin-isolated';
    runtimeIdentity?: {
      apexify: string;
      isolation: string;
    };
    outputs?: InteractiveArtifact[];
    primaryArtifactId?: string | null;
    mime?: string;
    base64?: string;
  };
};

const APEXIFY_PIN = 'github:EIAS79/Apexify.js#dbed9743353593eafae9a7b1c25312d7170a233b';

const EXECUTION_LIMITS = Object.freeze({
  processOutputBytes: Math.min(DOC8_RESOURCE_LIMITS.processBufferBytes, 2 * 1024 * 1024),
  v8HeapMb: 256,
  concurrency: 1,
});

let activeRuns = 0;

function projectRoot(): string {
  return process.cwd();
}

function denoBinary(): string {
  const executable = process.platform === 'win32' ? 'deno.exe' : 'deno';
  return join(projectRoot(), 'vendor', 'studio-deno', executable);
}

function apexifyEntry(): string {
  return join(projectRoot(), 'node_modules', 'apexify.js', 'dist', 'esm', 'index.js');
}

function nativeCanvasRoot(): string {
  return join(projectRoot(), 'node_modules', '@napi-rs');
}

export function sameOriginStudioIsolationAvailable(): boolean {
  return existsSync(denoBinary()) && existsSync(apexifyEntry()) && existsSync(nativeCanvasRoot());
}

function safeAssetName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'asset.bin';
}

function validateAssets(assets: readonly StudioVirtualAsset[]) {
  if (assets.length > STUDIO_ASSET_LIMITS.maxCount) {
    throw new Error('Studio asset count exceeds the configured limit.');
  }

  let total = 0;
  const ids = new Set<string>();
  for (const asset of assets) {
    if (!/^[A-Za-z0-9._-]{1,160}$/.test(asset.id)) throw new Error('Invalid Studio asset id.');
    if (ids.has(asset.id)) throw new Error('Duplicate Studio asset id.');
    ids.add(asset.id);

    const bytes = Buffer.from(asset.base64, 'base64');
    if (!bytes.length) throw new Error(`Studio asset ${asset.name} is empty.`);
    if (bytes.length > STUDIO_ASSET_LIMITS.maxBytesPerAsset) {
      throw new Error(`Studio asset ${asset.name} exceeds the per-asset limit.`);
    }
    total += bytes.length;
    if (total > STUDIO_ASSET_LIMITS.maxTotalBytes) {
      throw new Error('Combined Studio assets exceed the configured limit.');
    }
  }
}

function materializeAssets(runDir: string, assets: readonly StudioVirtualAsset[]) {
  const inputDir = join(runDir, 'studio-inputs');
  mkdirSync(inputDir, { recursive: true });

  const refs = new Map<string, string>();
  const manifest: Array<{ id: string; name: string; mime: string; path: string }> = [];

  for (const asset of assets) {
    const file = join(inputDir, `${asset.id}-${safeAssetName(asset.name)}`);
    writeFileSync(file, Buffer.from(asset.base64, 'base64'), { mode: 0o600 });
    refs.set(`studio://asset/${asset.id}`, file);
    manifest.push({ id: asset.id, name: asset.name, mime: asset.mime, path: file });
  }

  return { refs, manifest };
}

function rewriteAssetReferences(source: string, refs: ReadonlyMap<string, string>): string {
  let output = source;
  for (const [reference, file] of refs) {
    output = output.split(reference).join(JSON.stringify(file).slice(1, -1));
  }
  return output;
}

function assertUserImportsAreSandboxCompatible(source: string) {
  const staticImports = [...source.matchAll(/\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)];
  const dynamicImports = [...source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
  const imports = [...staticImports, ...dynamicImports].map((match) => match[1]!).filter(Boolean);

  for (const specifier of imports) {
    if (specifier === 'apexify.js' || specifier.startsWith('node:')) continue;
    if (specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('file:')) {
      throw new Error(
        `Studio does not expose arbitrary host files. Import "${specifier}" is not available; use Studio assets instead.`,
      );
    }
    throw new Error(
      `Package import "${specifier}" is not part of the same-origin Studio runtime. Use Apexify.js or inline the compatible plugin code.`,
    );
  }
}

function artifactFromEntry(
  entry: ManifestEntry,
  artifactDir: string,
  index: number,
): { artifact: InteractiveArtifact; bytes: number } {
  const id = typeof entry.id === 'string' && entry.id ? entry.id : `artifact-${index + 1}`;
  const name = typeof entry.name === 'string' && entry.name ? entry.name : id;

  if (typeof entry.text === 'string') {
    const mime = entry.mime || (entry.kind === 'json' ? 'application/json' : 'text/plain');
    return {
      artifact: {
        id,
        name,
        kind: entry.kind === 'json' ? 'json' : 'text',
        mime,
        text: entry.text,
        metadata: entry.metadata,
      },
      bytes: Buffer.byteLength(entry.text),
    };
  }

  if (!entry.path) throw new Error(`Studio artifact ${id} has no file content.`);
  const root = resolve(artifactDir);
  const file = resolve(entry.path);
  if (file !== root && !file.startsWith(root + sep)) {
    throw new Error(`Studio artifact ${id} escaped the run workspace.`);
  }

  const bytes = readFileSync(file);
  if (bytes.length > DOC8_RESOURCE_LIMITS.outputBytes) {
    throw new Error(`Studio artifact ${name} exceeds the per-artifact output limit.`);
  }

  const detected = detectStudioMedia(bytes, name);
  return {
    artifact: {
      id,
      name,
      kind: entry.kind ?? detected.kind,
      mime: entry.mime ?? detected.mime,
      base64: bytes.toString('base64'),
      metadata: entry.metadata,
    },
    bytes: bytes.length,
  };
}

function safeEnvironment(runDir: string, artifactDir: string, manifestPath: string, assetManifest: string, errPath: string) {
  return {
    GALLERY_ERR: errPath,
    STUDIO_ARTIFACT_DIR: artifactDir,
    STUDIO_MANIFEST: manifestPath,
    STUDIO_ASSET_MANIFEST: assetManifest,
    APEXIFY_TEMP_DIR: join(runDir, 'apexify-tmp'),
    DENO_DIR: join(runDir, 'deno-cache'),
    DENO_NO_UPDATE_CHECK: '1',
    NO_COLOR: '1',
  };
}

function denoArguments(runDir: string, entry: string): string[] {
  const root = projectRoot();
  const readPaths = [
    runDir,
    realpathSync(join(root, 'node_modules')),
    '/usr/share/fonts',
    '/etc/fonts',
  ].filter((path) => existsSync(path));

  const envNames = [
    'GALLERY_ERR',
    'STUDIO_ARTIFACT_DIR',
    'STUDIO_MANIFEST',
    'STUDIO_ASSET_MANIFEST',
    'APEXIFY_TEMP_DIR',
    'DENO_DIR',
    'DENO_NO_UPDATE_CHECK',
    'NO_COLOR',
  ];

  return [
    'run',
    '--quiet',
    '--no-prompt',
    '--cached-only',
    '--node-modules-dir=manual',
    `--allow-read=${readPaths.join(',')}`,
    `--allow-write=${runDir}`,
    `--allow-env=${envNames.join(',')}`,
    `--allow-ffi=${nativeCanvasRoot()}`,
    `--v8-flags=--max-old-space-size=${EXECUTION_LIMITS.v8HeapMb}`,
    entry,
  ];
}

function executeDeno(
  runDir: string,
  entry: string,
  artifactDir: string,
  manifestPath: string,
  assetManifest: string,
  errPath: string,
): Promise<{ exitCode: number | null; stderr: string; timedOut: boolean }> {
  return new Promise((resolveRun, rejectRun) => {
    const deno = denoBinary();
    const args = denoArguments(runDir, entry);

    const prlimit = '/usr/bin/prlimit';
    const command = process.platform === 'linux' && existsSync(prlimit) ? prlimit : deno;
    const commandArgs =
      command === prlimit
        ? [
            '--cpu=55',
            '--nofile=128',
            '--nproc=32',
            '--as=2147483648',
            '--',
            deno,
            ...args,
          ]
        : args;

    const child = spawn(command, commandArgs, {
      cwd: runDir,
      env: safeEnvironment(runDir, artifactDir, manifestPath, assetManifest, errPath),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let outputExceeded = false;

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > EXECUTION_LIMITS.processOutputBytes) {
        outputExceeded = true;
        child.kill('SIGKILL');
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes <= EXECUTION_LIMITS.processOutputBytes) stderr += chunk.toString('utf8');
      if (stderrBytes > EXECUTION_LIMITS.processOutputBytes) {
        outputExceeded = true;
        child.kill('SIGKILL');
      }
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, DOC8_RESOURCE_LIMITS.executionMs);

    child.once('error', (error) => {
      clearTimeout(timer);
      rejectRun(error);
    });

    child.once('close', (code) => {
      clearTimeout(timer);
      if (outputExceeded) stderr += '\nStudio terminated this run because process output exceeded the limit.';
      resolveRun({ exitCode: code, stderr, timedOut });
    });
  });
}

export async function runSameOriginIsolatedStudio(
  code: string,
  assets: readonly StudioVirtualAsset[],
): Promise<IsolatedStudioRunResult> {
  if (!sameOriginStudioIsolationAvailable()) {
    return {
      status: 503,
      body: {
        ok: false,
        error: 'The built-in isolated Studio runtime is unavailable on this deployment.',
      },
    };
  }

  if (activeRuns >= EXECUTION_LIMITS.concurrency) {
    return {
      status: 429,
      body: {
        ok: false,
        error: 'The Studio full runtime is busy. Retry this run in a moment.',
      },
    };
  }

  if (code.length > DOC8_RESOURCE_LIMITS.sourceChars) {
    return { status: 413, body: { ok: false, error: 'Studio source exceeds the configured limit.' } };
  }

  try {
    validateAssets(assets);
    assertUserImportsAreSandboxCompatible(code);
  } catch (error) {
    return {
      status: 400,
      body: { ok: false, error: error instanceof Error ? error.message : 'Invalid Studio request.' },
    };
  }

  activeRuns += 1;
  const runDir = mkdtempSync(join(tmpdir(), 'apexify-studio-isolated-'));
  const artifactDir = join(runDir, 'artifacts');
  const manifestPath = join(runDir, 'studio-manifest.json');
  const assetManifestPath = join(runDir, 'studio-assets.json');
  const errPath = join(runDir, 'err.txt');
  const entry = join(runDir, 'snippet.ts');

  mkdirSync(artifactDir, { recursive: true });
  mkdirSync(join(runDir, 'apexify-tmp'), { recursive: true });
  mkdirSync(join(runDir, 'deno-cache'), { recursive: true });

  try {
    const materialized = materializeAssets(runDir, assets);
    writeFileSync(
      assetManifestPath,
      JSON.stringify({ schemaVersion: 1, assets: materialized.manifest }, null, 2),
      { mode: 0o600 },
    );

    const executable = rewriteAssetReferences(code, materialized.refs);
    writeFileSync(
      entry,
      wrapStudioSnippetForRunner(executable, {
        apexifyImportHref: pathToFileURL(apexifyEntry()).href,
      }),
      { mode: 0o600 },
    );

    const started = Date.now();
    const result = await executeDeno(
      runDir,
      entry,
      artifactDir,
      manifestPath,
      assetManifestPath,
      errPath,
    );
    const elapsedMs = Date.now() - started;

    if (result.timedOut) {
      return {
        status: 408,
        body: { ok: false, error: 'Studio execution timed out.', elapsedMs },
      };
    }

    if (existsSync(errPath)) {
      const errorText = readFileSync(errPath, 'utf8').trim() || result.stderr.trim() || 'Studio execution failed.';
      return {
        status: 422,
        body: {
          ok: false,
          error: errorText.slice(0, EXECUTION_LIMITS.processOutputBytes),
          stderr: result.stderr.trim().slice(0, EXECUTION_LIMITS.processOutputBytes) || undefined,
          elapsedMs,
          exitCode: result.exitCode,
        },
      };
    }

    if (!existsSync(manifestPath)) {
      return {
        status: 422,
        body: {
          ok: false,
          error: result.stderr.trim() || 'Studio execution produced no artifact manifest.',
          elapsedMs,
          exitCode: result.exitCode,
        },
      };
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
    if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.artifacts)) {
      throw new Error('Studio execution produced an invalid artifact manifest.');
    }
    if (manifest.artifacts.length === 0) {
      throw new Error('Studio execution returned no artifacts.');
    }
    if (manifest.artifacts.length > DOC8_RESOURCE_LIMITS.maxOutputs) {
      throw new Error('Studio output count exceeds the configured limit.');
    }

    const outputs: InteractiveArtifact[] = [];
    let totalBytes = 0;
    for (let index = 0; index < manifest.artifacts.length; index += 1) {
      const parsed = artifactFromEntry(manifest.artifacts[index]!, artifactDir, index);
      totalBytes += parsed.bytes;
      if (totalBytes > DOC8_RESOURCE_LIMITS.totalOutputBytes) {
        throw new Error('Combined Studio outputs exceed the configured limit.');
      }
      outputs.push(parsed.artifact);
    }

    const primary = outputs[0] ?? null;
    return {
      status: 200,
      body: {
        ok: true,
        runtime: 'same-origin-isolated',
        runtimeIdentity: {
          apexify: APEXIFY_PIN,
          isolation: 'same-origin-deno-permissions',
        },
        elapsedMs,
        exitCode: result.exitCode ?? 0,
        outputs,
        primaryArtifactId: primary?.id ?? null,
        mime: primary?.mime,
        base64: primary?.base64,
      },
    };
  } catch (error) {
    return {
      status: 422,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : 'Studio isolated execution failed.',
      },
    };
  } finally {
    activeRuns = Math.max(0, activeRuns - 1);
    try {
      rmSync(runDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup of the disposable Studio workspace
    }
  }
}
