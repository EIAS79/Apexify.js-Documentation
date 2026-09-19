import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStaticImport from 'ffprobe-static';
import {
  wrapStudioSnippetForRunner,
} from '../lib/studio/runtime/wrapStudioSnippetForRunner';
import {
  detectStudioMedia,
  type StudioArtifactKind,
} from '../lib/studio/runtime/media';

type StudioAsset = {
  id: string;
  name: string;
  mime: string;
  size?: number;
  base64: string;
};

type RunRequest = {
  protocolVersion?: number;
  context?: string;
  lang?: string;
  code?: string;
  assets?: StudioAsset[];
};

type ManifestEntry = {
  id?: string;
  name?: string;
  path?: string;
  text?: string;
  mime?: string;
  kind?: StudioArtifactKind;
  metadata?: Record<string, unknown>;
};

type Manifest = {
  schemaVersion?: number;
  artifacts?: ManifestEntry[];
};

const here = dirname(fileURLToPath(import.meta.url));
const nodeModules = join(here, 'node_modules');
const denoPath = join(here, 'vendor', process.platform === 'win32' ? 'deno.exe' : 'deno');
const ffprobeModule = ffprobeStaticImport as unknown as { path?: string };
const ffmpegPath = ffmpegStatic || '';
const ffprobePath = ffprobeModule.path || '';
const apexifyHref = import.meta.resolve('apexify.js');

const PORT = Number(process.env.PORT || 10000);
const TOKEN = process.env.STUDIO_EXECUTOR_TOKEN || '';
const PACKAGE_PIN = 'github:EIAS79/Apexify.js#dbed9743353593eafae9a7b1c25312d7170a233b';

const LIMITS = Object.freeze({
  sourceChars: 280_000,
  requestBytes: 36 * 1024 * 1024,
  maxAssets: 12,
  assetBytes: 8 * 1024 * 1024,
  totalAssetBytes: 24 * 1024 * 1024,
  executionMs: 55_000,
  processOutputBytes: 1024 * 1024,
  outputBytes: 32 * 1024 * 1024,
  totalOutputBytes: 64 * 1024 * 1024,
  maxOutputs: 24,
  maxConcurrency: Math.max(1, Math.min(4, Number(process.env.STUDIO_EXECUTOR_CONCURRENCY || 1))),
  addressSpaceBytes: Math.max(
    1024 * 1024 * 1024,
    Number(process.env.STUDIO_EXECUTOR_ADDRESS_SPACE_BYTES || 2 * 1024 * 1024 * 1024),
  ),
});

let activeRuns = 0;

function json(res: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function authorized(req: IncomingMessage): boolean {
  if (!TOKEN) return false;
  const raw = req.headers.authorization || '';
  if (!raw.startsWith('Bearer ')) return false;
  const candidate = Buffer.from(raw.slice(7));
  const expected = Buffer.from(TOKEN);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

async function readBody(req: IncomingMessage): Promise<RunRequest> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > LIMITS.requestBytes) throw new Error('Request body exceeds the executor limit.');
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks, total).toString('utf8');
  return JSON.parse(raw) as RunRequest;
}

function safeAssetName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'asset.bin';
}

function validateAssets(value: unknown): StudioAsset[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('assets must be an array.');
  if (value.length > LIMITS.maxAssets) throw new Error('Too many Studio assets.');

  let total = 0;
  const ids = new Set<string>();
  return value.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Invalid Studio asset.');
    }
    const item = raw as Partial<StudioAsset>;
    if (
      typeof item.id !== 'string' ||
      !/^[A-Za-z0-9._-]{1,160}$/.test(item.id) ||
      typeof item.name !== 'string' ||
      !item.name ||
      typeof item.mime !== 'string' ||
      !item.mime ||
      typeof item.base64 !== 'string' ||
      !item.base64
    ) {
      throw new Error('Invalid Studio asset metadata.');
    }
    if (ids.has(item.id)) throw new Error('Duplicate Studio asset id.');
    ids.add(item.id);

    const bytes = Buffer.from(item.base64, 'base64');
    if (!bytes.length) throw new Error(`Studio asset ${item.name} is empty.`);
    if (bytes.length > LIMITS.assetBytes) throw new Error(`Studio asset ${item.name} is too large.`);
    total += bytes.length;
    if (total > LIMITS.totalAssetBytes) throw new Error('Combined Studio assets are too large.');

    return {
      id: item.id,
      name: item.name.slice(0, 240),
      mime: item.mime.slice(0, 160),
      size: bytes.length,
      base64: item.base64,
    };
  });
}

function rejectHostPersistence(code: string) {
  const patterns = [
    /\bpainter\s*\.\s*save\s*\(/,
    /\bpainter\s*\.\s*saveMultiple\s*\(/,
    /\bcreateAudio\s*\.\s*save\s*\(/,
  ];
  if (patterns.some((pattern) => pattern.test(code))) {
    throw new Error('Host persistence APIs are outside the Studio execution contract.');
  }
}

function materializeAssets(runDir: string, assets: StudioAsset[]) {
  const inputDir = join(runDir, 'inputs');
  mkdirSync(inputDir, { recursive: true });
  const refs = new Map<string, string>();
  const manifest: Array<{ id: string; name: string; mime: string; path: string }> = [];

  for (const asset of assets) {
    const path = join(inputDir, `${asset.id}-${safeAssetName(asset.name)}`);
    writeFileSync(path, Buffer.from(asset.base64, 'base64'), { mode: 0o600 });
    refs.set(`studio://asset/${asset.id}`, path);
    manifest.push({ id: asset.id, name: asset.name, mime: asset.mime, path });
  }
  return { refs, manifest };
}

function rewriteAssetReferences(source: string, refs: ReadonlyMap<string, string>): string {
  let resolved = source;
  for (const [reference, path] of refs) {
    resolved = resolved.split(reference).join(JSON.stringify(path).slice(1, -1));
  }
  return resolved;
}

function findCanvasNativeRoot(): string {
  const root = join(nodeModules, '@napi-rs');
  if (!existsSync(root)) return nodeModules;
  return realpathSync(root);
}

function allowedHosts(): string[] {
  const raw = process.env.STUDIO_EXECUTOR_ALLOWED_HOSTS || '';
  return [...new Set(
    raw
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter((host) => /^[a-z0-9.-]+(?::\d+)?$/.test(host)),
  )];
}

function pluginAllowlist(): string[] {
  return [...new Set(
    (process.env.STUDIO_EXECUTOR_PLUGIN_ALLOWLIST || '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(value)),
  )];
}

function assertImportsAllowed(code: string) {
  const allowedBare = new Set(['apexify.js', ...pluginAllowlist()]);
  const specifiers = [
    ...code.matchAll(/\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g),
    ...code.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((match) => match[1]!).filter(Boolean);

  for (const specifier of specifiers) {
    if (
      specifier.startsWith('node:') ||
      specifier.startsWith('./') ||
      specifier.startsWith('../') ||
      specifier.startsWith('file:')
    ) {
      continue;
    }
    if (/^https?:/i.test(specifier) || /^npm:/i.test(specifier) || !allowedBare.has(specifier)) {
      throw new Error(`Import "${specifier}" is not installed/allowed by the Studio executor.`);
    }
  }
}

function writeImportMap(runDir: string): string {
  const imports: Record<string, string> = {
    'apexify.js': apexifyHref,
    '@napi-rs/canvas': import.meta.resolve('@napi-rs/canvas'),
  };
  for (const plugin of pluginAllowlist()) {
    try {
      imports[plugin] = import.meta.resolve(plugin);
    } catch {
      throw new Error(`Configured Studio plugin "${plugin}" is not installed in the executor.`);
    }
  }
  const path = join(runDir, 'import-map.json');
  writeFileSync(path, JSON.stringify({ imports }, null, 2), { mode: 0o600 });
  return path;
}

function denoArgs(runDir: string, entry: string, importMap: string) {
  const readPaths = [
    runDir,
    realpathSync(nodeModules),
    '/usr/share/fonts',
    '/etc/fonts',
    '/etc/ssl/certs',
  ].filter((path) => existsSync(path));

  const envNames = [
    'APEXIFY_FFMPEG_PATH',
    'APEXIFY_FFPROBE_PATH',
    'APEXIFY_TEMP_DIR',
    'GALLERY_ERR',
    'STUDIO_ARTIFACT_DIR',
    'STUDIO_MANIFEST',
    'STUDIO_ASSET_MANIFEST',
  ];

  const args = [
    'run',
    '--quiet',
    '--no-prompt',
    '--cached-only',
    '--node-modules-dir=manual',
    `--import-map=${importMap}`,
    `--allow-read=${readPaths.join(',')}`,
    `--allow-write=${runDir}`,
    `--allow-env=${envNames.join(',')}`,
    `--allow-run=${[ffmpegPath, ffprobePath].filter(Boolean).join(',')}`,
    `--allow-ffi=${findCanvasNativeRoot()}`,
    '--v8-flags=--max-old-space-size=256',
  ];

  const hosts = allowedHosts();
  if (hosts.length) args.push(`--allow-net=${hosts.join(',')}`);

  args.push(entry);
  return args;
}

function safeSpawnEnv(runDir: string, artifactDir: string, manifestPath: string, assetManifest: string, errPath: string) {
  return {
    APEXIFY_FFMPEG_PATH: ffmpegPath,
    APEXIFY_FFPROBE_PATH: ffprobePath,
    APEXIFY_TEMP_DIR: join(runDir, 'apexify-tmp'),
    GALLERY_ERR: errPath,
    STUDIO_ARTIFACT_DIR: artifactDir,
    STUDIO_MANIFEST: manifestPath,
    STUDIO_ASSET_MANIFEST: assetManifest,
    DENO_DIR: join(here, '.deno-cache'),
    NO_COLOR: '1',
  };
}

function runSandbox(runDir: string, entry: string, importMap: string, assetManifest: string, artifactDir: string, manifestPath: string, errPath: string) {
  return new Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean }>((resolveRun, rejectRun) => {
    if (!existsSync(denoPath)) return rejectRun(new Error('Deno executor binary is not installed.'));
    if (!ffmpegPath || !existsSync(ffmpegPath)) return rejectRun(new Error('Pinned FFmpeg binary is unavailable.'));
    if (!ffprobePath || !existsSync(ffprobePath)) return rejectRun(new Error('Pinned ffprobe binary is unavailable.'));

    const args = denoArgs(runDir, entry, importMap);
    const prlimit = '/usr/bin/prlimit';
    if (process.platform === 'linux' && !existsSync(prlimit)) {
      return rejectRun(new Error('Linux executor requires /usr/bin/prlimit for CPU/memory bounds.'));
    }
    const command = process.platform === 'linux' ? prlimit : denoPath;
    const commandArgs =
      process.platform === 'linux'
        ? [
            `--as=${LIMITS.addressSpaceBytes}`,
            '--cpu=55',
            '--nofile=128',
            '--nproc=32',
            '--',
            denoPath,
            ...args,
          ]
        : args;

    const child = spawn(command, commandArgs, {
      cwd: runDir,
      env: safeSpawnEnv(runDir, artifactDir, manifestPath, assetManifest, errPath),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let killedForOutput = false;
    let timedOut = false;

    const append = (current: string, chunk: Buffer) => {
      const next = current + chunk.toString('utf8');
      if (Buffer.byteLength(next) > LIMITS.processOutputBytes) {
        killedForOutput = true;
        child.kill('SIGKILL');
        return next.slice(0, LIMITS.processOutputBytes);
      }
      return next;
    };

    child.stdout?.on('data', (chunk: Buffer) => { stdout = append(stdout, chunk); });
    child.stderr?.on('data', (chunk: Buffer) => { stderr = append(stderr, chunk); });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, LIMITS.executionMs);

    child.once('error', (error) => {
      clearTimeout(timer);
      rejectRun(error);
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (killedForOutput) stderr += '\nExecutor terminated the run because stdout/stderr exceeded the limit.';
      resolveRun({ exitCode: code, stdout, stderr, timedOut });
    });
  });
}

function artifactFromEntry(entry: ManifestEntry, artifactDir: string, index: number) {
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

  if (!entry.path) throw new Error(`Artifact ${id} has no content.`);
  const root = resolve(artifactDir);
  const file = resolve(entry.path);
  if (file !== root && !file.startsWith(root + sep)) throw new Error('Artifact escaped the run workspace.');

  const bytes = readFileSync(file);
  if (bytes.length > LIMITS.outputBytes) throw new Error(`Artifact ${name} exceeds the output limit.`);
  const detected = detectStudioMedia(bytes, name);
  return {
    artifact: {
      id,
      name,
      kind: entry.kind || detected.kind,
      mime: entry.mime || detected.mime,
      base64: bytes.toString('base64'),
      metadata: entry.metadata,
    },
    bytes: bytes.length,
  };
}

async function execute(body: RunRequest) {
  if (body.protocolVersion !== 1 || body.context !== 'studio') {
    throw new Error('Unsupported Studio executor protocol.');
  }
  if (body.lang !== 'ts' && body.lang !== 'js') throw new Error('lang must be ts or js.');
  if (typeof body.code !== 'string' || !body.code.trim()) throw new Error('Studio source is required.');
  if (body.code.length > LIMITS.sourceChars) throw new Error('Studio source exceeds the configured limit.');
  rejectHostPersistence(body.code);
  assertImportsAllowed(body.code);

  const assets = validateAssets(body.assets);
  const runDir = mkdtempSync(join(tmpdir(), 'apexify-studio-isolated-'));
  const artifactDir = join(runDir, 'artifacts');
  const manifestPath = join(runDir, 'studio-manifest.json');
  const assetManifestPath = join(runDir, 'studio-assets.json');
  const errPath = join(runDir, 'err.txt');
  const entry = join(runDir, 'snippet.ts');
  mkdirSync(artifactDir, { recursive: true });
  mkdirSync(join(runDir, 'apexify-tmp'), { recursive: true });

  try {
    const materialized = materializeAssets(runDir, assets);
    const importMap = writeImportMap(runDir);
    writeFileSync(
      assetManifestPath,
      JSON.stringify({ schemaVersion: 1, assets: materialized.manifest }, null, 2),
      { mode: 0o600 },
    );

    const code = rewriteAssetReferences(body.code, materialized.refs);
    writeFileSync(entry, wrapStudioSnippetForRunner(code, { apexifyImportHref: apexifyHref }), {
      mode: 0o600,
    });

    const started = Date.now();
    const result = await runSandbox(
      runDir,
      entry,
      importMap,
      assetManifestPath,
      artifactDir,
      manifestPath,
      errPath,
    );
    const elapsedMs = Date.now() - started;

    if (result.timedOut) {
      return { status: 408, body: { ok: false, error: 'Studio execution timed out.', elapsedMs } };
    }

    if (existsSync(errPath)) {
      const error = readFileSync(errPath, 'utf8').trim() || result.stderr.trim() || 'Studio execution failed.';
      return {
        status: 422,
        body: {
          ok: false,
          error: error.slice(0, LIMITS.processOutputBytes),
          stderr: result.stderr.trim().slice(0, LIMITS.processOutputBytes) || undefined,
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
    if (manifest.artifacts.length === 0) throw new Error('Studio execution returned no artifacts.');
    if (manifest.artifacts.length > LIMITS.maxOutputs) throw new Error('Studio output count exceeds the configured limit.');

    let totalBytes = 0;
    const outputs = manifest.artifacts.map((entry, index) => {
      const parsed = artifactFromEntry(entry, artifactDir, index);
      totalBytes += parsed.bytes;
      if (totalBytes > LIMITS.totalOutputBytes) throw new Error('Combined Studio outputs exceed the configured limit.');
      return parsed.artifact;
    });
    const primary = outputs[0];

    return {
      status: 200,
      body: {
        ok: true,
        runtime: 'isolated-remote',
        runtimeIdentity: {
          apexify: PACKAGE_PIN,
          deno: process.env.STUDIO_DENO_VERSION || '2.4.5',
        },
        elapsedMs,
        primaryArtifactId: primary?.id ?? null,
        outputs,
        mime: primary?.mime,
        base64: primary && 'base64' in primary ? primary.base64 : undefined,
        exitCode: result.exitCode ?? 0,
      },
    };
  } finally {
    rmSync(runDir, { recursive: true, force: true });
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'apexify-studio-executor',
      protocolVersion: 1,
      apexify: PACKAGE_PIN,
      isolation: 'deno-permissions+prlimit',
      networkHosts: allowedHosts(),
      pluginAllowlist: pluginAllowlist(),
    });
  }

  if (req.method !== 'POST' || req.url !== '/v1/run') {
    return json(res, 404, { ok: false, error: 'Not found.' });
  }
  if (!authorized(req)) return json(res, 401, { ok: false, error: 'Unauthorized.' });
  if (activeRuns >= LIMITS.maxConcurrency) {
    return json(res, 429, { ok: false, error: 'Executor is at its concurrency limit.' });
  }

  activeRuns += 1;
  try {
    const body = await readBody(req);
    const result = await execute(body);
    return json(res, result.status, result.body);
  } catch (error) {
    return json(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid Studio execution request.',
    });
  } finally {
    activeRuns = Math.max(0, activeRuns - 1);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    JSON.stringify({
      service: 'apexify-studio-executor',
      port: PORT,
      protocolVersion: 1,
      apexify: PACKAGE_PIN,
      deno: denoPath,
      ffmpeg: ffmpegPath,
      ffprobe: ffprobePath,
      networkHosts: allowedHosts(),
      pluginAllowlist: pluginAllowlist(),
      concurrency: LIMITS.maxConcurrency,
    }),
  );
});
