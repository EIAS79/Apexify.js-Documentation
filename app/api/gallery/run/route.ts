import { randomUUID } from 'crypto';
import { spawnSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join, resolve, sep } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { pathToFileURL } from 'url';
import 'apexify.js';
import { galleryRunnerNodePath } from '@/lib/gallery/core/runnerNodePath';
import {
  assertSnippetAllowed,
  detectImageMime,
  wrapSnippetForRunner,
} from '@/lib/gallery/core/wrapSnippetForRunner';
import {
  DOC8_RESOURCE_LIMITS,
  type InteractiveArtifact,
} from '@/lib/docs/playground/contracts';
import { detectStudioMedia } from '@/lib/studio/runtime/media';
import { wrapStudioSnippetForRunner } from '@/lib/studio/runtime/wrapStudioSnippetForRunner';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RunBody = {
  code?: string;
  lang?: string;
  context?: string;
};

type StudioManifestEntry = {
  id?: string;
  name?: string;
  path?: string;
  text?: string;
  mime?: string;
  kind?: InteractiveArtifact['kind'];
  metadata?: Record<string, unknown>;
};

type StudioManifest = {
  schemaVersion?: number;
  artifacts?: StudioManifestEntry[];
};

function isLocalRunnerEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_LOCAL_APEXIFY_CODE_RUN === 'true';
}

function remoteExecutorConfig(): { url: string; token?: string } | null {
  const raw = process.env.STUDIO_EXECUTOR_URL?.trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      return null;
    }
    return {
      url: parsed.toString().replace(/\/$/, ''),
      token: process.env.STUDIO_EXECUTOR_TOKEN?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

function availability() {
  if (isLocalRunnerEnabled()) {
    return { enabled: true, mode: 'trusted-local' as const };
  }
  if (remoteExecutorConfig()) {
    return { enabled: true, mode: 'isolated-remote' as const };
  }
  return { enabled: false, mode: 'unavailable' as const };
}

export async function GET() {
  return NextResponse.json(availability());
}

async function proxyToRemoteExecutor(body: RunBody, config: { url: string; token?: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOC8_RESOURCE_LIMITS.executionMs + 5_000);

  try {
    const response = await fetch(`${config.url}/v1/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
      body: JSON.stringify({
        code: body.code,
        lang: body.lang,
        context: 'studio',
        protocolVersion: 1,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Studio executor returned a non-JSON response.' },
        { status: 502 },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? `Studio executor request failed: ${error.message}`
            : 'Studio executor request failed.',
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

function runnerEnvironment(projectRoot: string, extra: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...extra,
    NODE_ENV: extra.NODE_ENV ?? 'development',
    NODE_PATH: galleryRunnerNodePath(projectRoot),
  };

  if (process.env.PATH) env.PATH = process.env.PATH;
  if (process.platform === 'win32' && process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;

  // FFmpeg custom-path settings are execution requirements, not application secrets.
  if (process.env.APEXIFY_FFMPEG_PATH) env.APEXIFY_FFMPEG_PATH = process.env.APEXIFY_FFMPEG_PATH;
  if (process.env.APEXIFY_FFPROBE_PATH) env.APEXIFY_FFPROBE_PATH = process.env.APEXIFY_FFPROBE_PATH;

  return env;
}

function parseStudioManifest(path: string): StudioManifest {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as StudioManifest;
  if (!raw || raw.schemaVersion !== 1 || !Array.isArray(raw.artifacts)) {
    throw new Error('Studio runner produced an invalid artifact manifest.');
  }
  return raw;
}

function artifactFromEntry(
  entry: StudioManifestEntry,
  artifactDir: string,
  index: number,
): { artifact: InteractiveArtifact; bytes: number } {
  const id = typeof entry.id === 'string' && entry.id ? entry.id : `artifact-${index + 1}`;
  const name = typeof entry.name === 'string' && entry.name ? entry.name : id;

  if (typeof entry.text === 'string') {
    const mime = entry.mime || (entry.kind === 'json' ? 'application/json' : 'text/plain');
    const kind = entry.kind === 'json' ? 'json' : 'text';
    return {
      artifact: {
        id,
        name,
        kind,
        mime,
        text: entry.text,
        metadata: entry.metadata,
      },
      bytes: Buffer.byteLength(entry.text),
    };
  }

  if (typeof entry.path !== 'string' || !entry.path) {
    throw new Error(`Studio artifact ${id} has neither file content nor text content.`);
  }

  const root = resolve(artifactDir);
  const file = resolve(entry.path);
  if (file !== root && !file.startsWith(root + sep)) {
    throw new Error(`Studio artifact ${id} escaped the artifact workspace.`);
  }

  const buf = readFileSync(file);
  if (buf.length > DOC8_RESOURCE_LIMITS.outputBytes) {
    throw new Error(`Studio artifact ${name} exceeds the per-artifact output limit.`);
  }

  const detected = detectStudioMedia(buf, name);
  return {
    artifact: {
      id,
      name,
      kind: entry.kind ?? detected.kind,
      mime: entry.mime ?? detected.mime,
      base64: buf.toString('base64'),
      metadata: entry.metadata,
    },
    bytes: buf.length,
  };
}

async function runStudioLocal({
  code,
  projectRoot,
  tsxCli,
  apexifyEsm,
}: {
  code: string;
  projectRoot: string;
  tsxCli: string;
  apexifyEsm: string;
}) {
  const dir = join(tmpdir(), `apexify-studio-run-${randomUUID()}`);
  const artifactDir = join(dir, 'artifacts');
  const manifestPath = join(dir, 'studio-manifest.json');
  const errPath = join(dir, 'err.txt');
  const entry = join(dir, 'snippet.ts');

  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(
    entry,
    wrapStudioSnippetForRunner(code, { apexifyImportHref: pathToFileURL(apexifyEsm).href }),
    'utf8',
  );

  const t0 = Date.now();

  try {
    const result = spawnSync(process.execPath, [tsxCli, entry], {
      encoding: 'utf8',
      cwd: dir,
      timeout: DOC8_RESOURCE_LIMITS.executionMs,
      maxBuffer: DOC8_RESOURCE_LIMITS.processBufferBytes,
      env: runnerEnvironment(projectRoot, {
        GALLERY_ERR: errPath,
        STUDIO_ARTIFACT_DIR: artifactDir,
        STUDIO_MANIFEST: manifestPath,
      }),
    });

    const elapsedMs = Date.now() - t0;

    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error.message, elapsedMs },
        { status: result.error.name === 'ETIMEDOUT' ? 408 : 422 },
      );
    }

    if (existsSync(errPath)) {
      const errTxt = readFileSync(errPath, 'utf8').trim();
      const stderr = result.stderr?.trim() ?? '';
      return NextResponse.json(
        {
          ok: false,
          error: errTxt || stderr || 'Runner failed',
          stderr: stderr || undefined,
          elapsedMs,
          exitCode: result.status ?? undefined,
        },
        { status: 422 },
      );
    }

    if (!existsSync(manifestPath)) {
      const stderr = result.stderr?.trim() ?? '';
      return NextResponse.json(
        {
          ok: false,
          error:
            stderr ||
            'No Studio artifacts were produced. Return the Apexify result from main() instead of saving to the host filesystem.',
          elapsedMs,
          exitCode: result.status ?? undefined,
        },
        { status: 422 },
      );
    }

    const manifest = parseStudioManifest(manifestPath);
    const entries = manifest.artifacts ?? [];

    if (entries.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'The snippet completed but returned no previewable artifact. Return the generated Buffer, media path, frame array, or metadata from main().',
          elapsedMs,
          exitCode: result.status ?? 0,
        },
        { status: 422 },
      );
    }

    if (entries.length > DOC8_RESOURCE_LIMITS.maxOutputs) {
      return NextResponse.json(
        { ok: false, error: 'Studio output count exceeds the configured limit.', elapsedMs },
        { status: 413 },
      );
    }

    const outputs: InteractiveArtifact[] = [];
    let totalBytes = 0;

    for (let index = 0; index < entries.length; index += 1) {
      const parsed = artifactFromEntry(entries[index]!, artifactDir, index);
      totalBytes += parsed.bytes;

      if (totalBytes > DOC8_RESOURCE_LIMITS.totalOutputBytes) {
        return NextResponse.json(
          { ok: false, error: 'Combined Studio outputs exceed the configured limit.', elapsedMs },
          { status: 413 },
        );
      }

      outputs.push(parsed.artifact);
    }

    const primary = outputs[0]!;

    return NextResponse.json({
      ok: true,
      outputs,
      primaryArtifactId: primary.id,
      mime: primary.mime,
      base64: primary.base64,
      elapsedMs,
      exitCode: result.status ?? 0,
      runtime: 'trusted-local',
    });
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort temporary workspace cleanup
    }
  }
}

async function runGalleryLocal({
  code,
  projectRoot,
  tsxCli,
  apexifyEsm,
}: {
  code: string;
  projectRoot: string;
  tsxCli: string;
  apexifyEsm: string;
}) {
  const dir = join(tmpdir(), `apexify-local-run-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });

  const outPath = join(dir, 'out.bin');
  const errPath = join(dir, 'err.txt');
  const entry = join(dir, 'snippet.ts');
  writeFileSync(
    entry,
    wrapSnippetForRunner(code, { apexifyImportHref: pathToFileURL(apexifyEsm).href }),
    'utf8',
  );

  const t0 = Date.now();

  try {
    const result = spawnSync(process.execPath, [tsxCli, entry], {
      encoding: 'utf8',
      cwd: dir,
      timeout: DOC8_RESOURCE_LIMITS.executionMs,
      maxBuffer: DOC8_RESOURCE_LIMITS.processBufferBytes,
      env: runnerEnvironment(projectRoot, {
        GALLERY_OUT: outPath,
        GALLERY_ERR: errPath,
      }),
    });

    const elapsedMs = Date.now() - t0;

    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error.message, elapsedMs },
        { status: result.error.name === 'ETIMEDOUT' ? 408 : 422 },
      );
    }

    if (existsSync(errPath)) {
      const errTxt = readFileSync(errPath, 'utf8').trim();
      const stderr = result.stderr?.trim() ?? '';
      return NextResponse.json(
        {
          ok: false,
          error: errTxt || stderr || 'Runner failed',
          stderr: stderr || undefined,
          elapsedMs,
          exitCode: result.status ?? undefined,
        },
        { status: 422 },
      );
    }

    if (!existsSync(outPath)) {
      const stderr = result.stderr?.trim() ?? '';
      return NextResponse.json(
        {
          ok: false,
          error: stderr || 'No output produced. main() must return a PNG or GIF Buffer.',
          stderr: stderr || undefined,
          elapsedMs,
          exitCode: result.status ?? undefined,
        },
        { status: 422 },
      );
    }

    const buf = readFileSync(outPath);
    if (buf.length > DOC8_RESOURCE_LIMITS.outputBytes) {
      return NextResponse.json(
        { ok: false, error: 'Output exceeds the DOC-8 limit.', elapsedMs },
        { status: 413 },
      );
    }

    const mime = detectImageMime(buf);
    if (mime === 'application/octet-stream') {
      return NextResponse.json(
        { ok: false, error: 'Gallery output is not a PNG or GIF buffer', elapsedMs },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      mime,
      base64: buf.toString('base64'),
      elapsedMs,
      exitCode: result.status ?? 0,
    });
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort temp cleanup
    }
  }
}

export async function POST(req: NextRequest) {
  let body: RunBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code : '';
  const context = body.context === 'studio' ? 'studio' : 'gallery';

  if (!code.trim()) {
    return NextResponse.json({ ok: false, error: 'Empty code' }, { status: 400 });
  }

  if (code.length > DOC8_RESOURCE_LIMITS.sourceChars) {
    return NextResponse.json({ ok: false, error: 'Source exceeds the Studio limit.' }, { status: 413 });
  }

  const blocked = assertSnippetAllowed(code);
  if (blocked) {
    return NextResponse.json({ ok: false, error: blocked }, { status: 400 });
  }

  const local = isLocalRunnerEnabled();
  const remote = remoteExecutorConfig();

  if (context === 'studio' && !local && remote) {
    return proxyToRemoteExecutor(body, remote);
  }

  if (!local) {
    return NextResponse.json(
      {
        ok: false,
        error:
          context === 'studio'
            ? 'The full Apexify Studio runtime is not connected on this deployment.'
            : 'Interactive code execution is unavailable on this deployment. Current docs use verified output instead.',
      },
      { status: 503 },
    );
  }

  const projectRoot = process.cwd();
  const tsxCli = join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const apexifyEsm = join(projectRoot, 'node_modules', 'apexify.js', 'dist', 'esm', 'index.js');

  if (!existsSync(tsxCli) || !existsSync(apexifyEsm)) {
    return NextResponse.json(
      { ok: false, error: 'Local runner dependencies are unavailable.' },
      { status: 500 },
    );
  }

  return context === 'studio'
    ? runStudioLocal({ code, projectRoot, tsxCli, apexifyEsm })
    : runGalleryLocal({ code, projectRoot, tsxCli, apexifyEsm });
}
