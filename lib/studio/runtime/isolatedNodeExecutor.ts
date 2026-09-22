import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import type { InteractiveArtifact } from '@/lib/docs/playground/contracts';
import { DOC8_RESOURCE_LIMITS } from '@/lib/docs/playground/contracts';
import { deriveStudioMediaMetadata, detectStudioMedia } from './media';
import type { StudioVirtualAsset } from './assets';
import { STUDIO_ASSET_LIMITS } from './assets';
import { wrapStudioSnippetForRunner } from './wrapStudioSnippetForRunner';
import type { StudioWorkspaceFile } from './workspace';

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
    runtimeDebug?: StudioRuntimeDebug;
  };
};

type StudioRuntimeDebug = {
  schemaVersion: 1;
  backend: 'same-origin-deno';
  deploymentCommit: string;
  deploymentEnvironment: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  apexifyPin: string;
  sysPermissionArg: string | null;
  envPermissionArg: string | null;
  ffiPermissionArg: string | null;
  denoRuntimeAvailable: boolean;
  denoBinaryExists: boolean;
  nativeCanvasEntryExists: boolean;
  nativeCanvasRootExists: boolean;
  sharpNativeRootExists: boolean;
  mediaCapabilityCreated: boolean;
  ffmpegProxyExists: boolean;
  ffprobeProxyExists: boolean;
  ffmpegBinaryAvailable: boolean;
  preflight?: {
    attempted: boolean;
    exitCode: number | null;
    timedOut: boolean;
    stdout: string;
    stderr: string;
  };
};

const APEXIFY_PIN = 'github:EIAS79/Apexify.js#dbed9743353593eafae9a7b1c25312d7170a233b';
const MEDIA_CAPABILITY_DIR = join(tmpdir(), 'apexify-studio-media-caps');

type StudioMediaCapability = {
  id: string;
  file: string;
  ffmpegProxy: string;
  ffprobeProxy: string;
  ffmpeg: string;
  ffprobe: string;
};

const EXECUTION_LIMITS = Object.freeze({
  processOutputBytes: Math.min(DOC8_RESOURCE_LIMITS.processBufferBytes, 2 * 1024 * 1024),
  v8HeapMb: 256,
  concurrency: 1,
});

let activeRuns = 0;

function projectRoot(): string {
  return process.cwd();
}

function packagedBinaryPath(group: 'studio-deno' | 'studio-ffmpeg', name: string): string {
  return join(projectRoot(), 'vendor', group, name);
}

function runtimeCacheRoot(): string {
  return join(tmpdir(), 'apexify-studio-runtime-v1');
}

function hydrateCompressedBinary(source: string, destination: string): string {
  if (existsSync(destination)) return realpathSync(destination);

  mkdirSync(resolve(destination, '..'), { recursive: true, mode: 0o700 });
  const temporary = destination + '.' + process.pid + '.tmp';

  try {
    const bytes = gunzipSync(readFileSync(source));
    writeFileSync(temporary, bytes, { mode: 0o700 });
    if (process.platform !== 'win32') chmodSync(temporary, 0o755);
    renameSync(temporary, destination);
  } finally {
    try {
      rmSync(temporary, { force: true });
    } catch {
      // best-effort temporary hydration cleanup
    }
  }

  return realpathSync(destination);
}

function denoBinary(): string {
  const executable = process.platform === 'win32' ? 'deno.exe' : 'deno';
  const raw = packagedBinaryPath('studio-deno', executable);
  if (existsSync(raw)) return realpathSync(raw);

  const compressed = raw + '.gz';
  if (existsSync(compressed)) {
    return hydrateCompressedBinary(
      compressed,
      join(runtimeCacheRoot(), 'deno-2.4.5-' + process.arch, executable),
    );
  }

  return raw;
}

function denoRuntimeAvailable(): boolean {
  const executable = process.platform === 'win32' ? 'deno.exe' : 'deno';
  const raw = packagedBinaryPath('studio-deno', executable);
  return existsSync(raw) || existsSync(raw + '.gz');
}

function apexifyEntry(): string {
  return join(projectRoot(), 'node_modules', 'apexify.js', 'dist', 'esm', 'index.js');
}

function nativeCanvasRoot(): string {
  return join(projectRoot(), 'node_modules', '@napi-rs');
}

function sharpNativeRoot(): string {
  return join(projectRoot(), 'node_modules', '@img');
}

function nativeCanvasEntry(): string {
  return join(projectRoot(), 'node_modules', '@napi-rs', 'canvas', 'index.js');
}

function defaultStudioFontPath(): string {
  return join(
    projectRoot(),
    'node_modules',
    'dejavu-fonts-ttf',
    'ttf',
    'DejaVuSans.ttf',
  );
}

function mediaProxyPaths(): { ffmpegProxy: string; ffprobeProxy: string } {
  return {
    ffmpegProxy: join(projectRoot(), 'scripts', 'studio', 'ffmpeg-proxy'),
    ffprobeProxy: join(projectRoot(), 'scripts', 'studio', 'ffprobe-proxy'),
  };
}

function mediaBinaryPairAvailable(): boolean {
  const suffix = process.platform === 'win32' ? '.exe' : '';
  const rawFfmpeg = packagedBinaryPath('studio-ffmpeg', 'ffmpeg' + suffix);
  const rawFfprobe = packagedBinaryPath('studio-ffmpeg', 'ffprobe' + suffix);

  if (
    (existsSync(rawFfmpeg) && existsSync(rawFfprobe)) ||
    (existsSync(rawFfmpeg + '.gz') && existsSync(rawFfprobe + '.gz'))
  ) {
    return true;
  }

  return [
    ['/usr/bin/ffmpeg', '/usr/bin/ffprobe'],
    ['/usr/local/bin/ffmpeg', '/usr/local/bin/ffprobe'],
    ['/opt/homebrew/bin/ffmpeg', '/opt/homebrew/bin/ffprobe'],
  ].some(([ffmpeg, ffprobe]) => existsSync(ffmpeg) && existsSync(ffprobe));
}

function mediaBinaryPair(): { ffmpeg: string; ffprobe: string } | null {
  const suffix = process.platform === 'win32' ? '.exe' : '';
  const rawFfmpeg = packagedBinaryPath('studio-ffmpeg', 'ffmpeg' + suffix);
  const rawFfprobe = packagedBinaryPath('studio-ffmpeg', 'ffprobe' + suffix);

  if (existsSync(rawFfmpeg) && existsSync(rawFfprobe)) {
    return { ffmpeg: realpathSync(rawFfmpeg), ffprobe: realpathSync(rawFfprobe) };
  }

  if (existsSync(rawFfmpeg + '.gz') && existsSync(rawFfprobe + '.gz')) {
    const cache = join(runtimeCacheRoot(), 'ffmpeg-6.0.1-' + process.arch);
    return {
      ffmpeg: hydrateCompressedBinary(rawFfmpeg + '.gz', join(cache, 'ffmpeg' + suffix)),
      ffprobe: hydrateCompressedBinary(rawFfprobe + '.gz', join(cache, 'ffprobe' + suffix)),
    };
  }

  const candidates = [
    { ffmpeg: '/usr/bin/ffmpeg', ffprobe: '/usr/bin/ffprobe' },
    { ffmpeg: '/usr/local/bin/ffmpeg', ffprobe: '/usr/local/bin/ffprobe' },
    { ffmpeg: '/opt/homebrew/bin/ffmpeg', ffprobe: '/opt/homebrew/bin/ffprobe' },
  ];

  for (const pair of candidates) {
    if (existsSync(pair.ffmpeg) && existsSync(pair.ffprobe)) {
      return { ffmpeg: realpathSync(pair.ffmpeg), ffprobe: realpathSync(pair.ffprobe) };
    }
  }

  return null;
}

function createMediaCapability(runDir: string): StudioMediaCapability | null {
  const binaries = mediaBinaryPair();
  const proxies = mediaProxyPaths();
  if (!binaries || !existsSync(proxies.ffmpegProxy) || !existsSync(proxies.ffprobeProxy)) {
    return null;
  }

  mkdirSync(MEDIA_CAPABILITY_DIR, { recursive: true, mode: 0o700 });
  const id = randomUUID();
  const file = join(MEDIA_CAPABILITY_DIR, `${id}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      {
        version: 1,
        runRoot: resolve(runDir),
        ffmpeg: binaries.ffmpeg,
        ffprobe: binaries.ffprobe,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );

  return {
    id,
    file,
    ffmpegProxy: realpathSync(proxies.ffmpegProxy),
    ffprobeProxy: realpathSync(proxies.ffprobeProxy),
    ...binaries,
  };
}

export function sameOriginStudioIsolationAvailable(): boolean {
  return (
    denoRuntimeAvailable() &&
    existsSync(apexifyEntry()) &&
    existsSync(nativeCanvasRoot()) &&
    existsSync(nativeCanvasEntry()) &&
    existsSync(defaultStudioFontPath())
  );
}

export function sameOriginStudioVideoAvailable(): boolean {
  const proxies = mediaProxyPaths();
  return Boolean(
    sameOriginStudioIsolationAvailable() &&
      mediaBinaryPairAvailable() &&
      existsSync(proxies.ffmpegProxy) &&
      existsSync(proxies.ffprobeProxy),
  );
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

function rewriteWorkspacePackageImports(source: string): string {
  const apexifyHref = pathToFileURL(apexifyEntry()).href;
  return source.replace(
    /(['"])apexify\.js\1/g,
    (_match, quote: string) => quote + apexifyHref + quote,
  );
}

function resolveWorkspaceSpecifier(
  specifier: string,
  workspaceFiles: ReadonlySet<string>,
): string {
  if (!specifier.startsWith('./')) return specifier;
  const requested = specifier.slice(2);
  const candidates = [
    requested,
    requested + '.ts',
    requested + '.js',
    requested + '.tsx',
    requested + '.jsx',
  ];
  const resolved = candidates.find((name) => workspaceFiles.has(name));
  return resolved ? './' + resolved : specifier;
}

function rewriteWorkspaceRelativeImports(
  source: string,
  workspaceFiles: ReadonlySet<string>,
): string {
  let output = source.replace(
    /(\bfrom\s*)(['"])(\.\/[^'"]+)\2/g,
    (_match, prefix: string, quote: string, specifier: string) =>
      prefix + quote + resolveWorkspaceSpecifier(specifier, workspaceFiles) + quote,
  );
  output = output.replace(
    /(\bimport\s*\(\s*)(['"])(\.\/[^'"]+)\2/g,
    (_match, prefix: string, quote: string, specifier: string) =>
      prefix + quote + resolveWorkspaceSpecifier(specifier, workspaceFiles) + quote,
  );
  output = output.replace(
    /(\bimport\s*)(['"])(\.\/[^'"]+)\2/g,
    (_match, prefix: string, quote: string, specifier: string) =>
      prefix + quote + resolveWorkspaceSpecifier(specifier, workspaceFiles) + quote,
  );
  return output;
}

function materializeWorkspaceFiles(runDir: string, files: readonly StudioWorkspaceFile[]): Set<string> {
  const names = new Set(files.map((file) => file.name));
  for (const file of files) {
    const target = join(runDir, file.name);
    const rewritten = rewriteWorkspacePackageImports(
      rewriteWorkspaceRelativeImports(file.source, names),
    );
    writeFileSync(target, rewritten, { mode: 0o600 });
  }
  return names;
}


function assertUserImportsAreSandboxCompatible(
  source: string,
  workspaceFiles: ReadonlySet<string>,
) {
  const staticImports = [...source.matchAll(/\bimport\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)];
  const dynamicImports = [...source.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)];
  const imports = [...staticImports, ...dynamicImports].map((match) => match[1]!).filter(Boolean);

  for (const specifier of imports) {
    if (specifier === 'apexify.js' || specifier.startsWith('node:')) continue;

    if (specifier.startsWith('./')) {
      const requested = specifier.slice(2);
      const candidates = [
        requested,
        requested + '.ts',
        requested + '.js',
        requested + '.tsx',
        requested + '.jsx',
      ];
      if (candidates.some((name) => workspaceFiles.has(name))) continue;
      throw new Error(
        `Studio project import "${specifier}" does not match an open sibling tab. Rename a tab to that filename or update the import.`,
      );
    }

    if (specifier.startsWith('../') || specifier.startsWith('file:') || specifier.startsWith('/')) {
      throw new Error(`Studio project import "${specifier}" escapes the isolated workspace.`);
    }

    throw new Error(
      `Package import "${specifier}" is not part of the same-origin Studio runtime. Use Apexify.js, node: built-ins, or Studio project files.`,
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
  const derived = deriveStudioMediaMetadata(bytes, detected);
  return {
    artifact: {
      id,
      name,
      kind: entry.kind ?? detected.kind,
      mime: entry.mime ?? detected.mime,
      base64: bytes.toString('base64'),
      metadata: { ...derived, ...(entry.metadata ?? {}) },
    },
    bytes: bytes.length,
  };
}

function safeEnvironment(
  runDir: string,
  artifactDir: string,
  manifestPath: string,
  assetManifest: string,
  errPath: string,
  media: StudioMediaCapability | null,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    NODE_ENV: 'production',
    GALLERY_ERR: errPath,
    STUDIO_ARTIFACT_DIR: artifactDir,
    STUDIO_MANIFEST: manifestPath,
    STUDIO_ASSET_MANIFEST: assetManifest,
    APEXIFY_TEMP_DIR: join(runDir, 'apexify-tmp'),
    // @napi-rs/canvas's generated native loader reads these variables even
    // when they are unset. Deno requires per-key env permission for that
    // read, so expose explicit empty values rather than widening env access.
    NAPI_RS_NATIVE_LIBRARY_PATH: '',
    NAPI_RS_FORCE_WASI: '',
    // @napi-rs/canvas reads this key during module initialization.
    // Disable host/system font scanning; Studio registers its bundled font explicitly.
    DISABLE_SYSTEM_FONTS_LOAD: '1',
    // Sharp 0.35.4 reads these during module initialisation/runtime platform detection.
    // Keep them explicit so the Studio sandbox never needs unrestricted env access.
    npm_package_config_libvips: '',
    npm_config_arch: process.arch,
    npm_config_platform: process.platform,
    npm_config_libc: '',
    CC: '',
    PKG_CONFIG_PATH: '',
    SHARP_IGNORE_GLOBAL_LIBVIPS: '1',
    SHARP_FORCE_GLOBAL_LIBVIPS: '',
    MALLOC_ARENA_MAX: '1',
    VIPS_CONCURRENCY: '1',
    DENO_DIR: join(runDir, 'deno-cache'),
    DENO_NO_UPDATE_CHECK: '1',
    NO_COLOR: '1',
  };

  if (media) {
    env.APEXIFY_FFMPEG_PATH = media.ffmpegProxy;
    env.APEXIFY_FFPROBE_PATH = media.ffprobeProxy;
    env.STUDIO_MEDIA_CAP_ID = media.id;
    // Vercel's Node executable is not guaranteed to live at /usr/bin/node.
    // Pass the exact trusted host Node binary into the fixed media proxy.
    env.STUDIO_MEDIA_NODE_PATH = process.execPath;
  }

  return env;
}

function denoArguments(
  runDir: string,
  entry: string,
  media: StudioMediaCapability | null,
): string[] {
  const root = projectRoot();
  const readPaths = [
    runDir,
    realpathSync(join(root, 'node_modules')),
    '/usr/share/fonts',
    '/etc/fonts',
  ].filter((path) => existsSync(path));

  const args = [
    'run',
    '--quiet',
    '--no-prompt',
    '--cached-only',
    '--node-modules-dir=manual',
    `--allow-read=${readPaths.join(',')}`,
    `--allow-write=${runDir}`,
    // executeDeno() replaces the child environment with safeEnvironment().
    // No host/Vercel secrets are inherited, so allowing env reads here only
    // permits libraries to inspect that sanitized environment or receive
    // undefined for absent keys instead of Deno NotCapable exceptions.
    '--allow-env',
    '--allow-ffi=' + [nativeCanvasRoot(), sharpNativeRoot()].join(','),
    // @napi-rs/canvas uses Node process.report while selecting its native binary.
    // Deno's process.report probes cpus + networkInterfaces + OS metadata.
    // Grant system introspection only; read/write/env/run/net remain separately constrained.
    '--allow-sys',
    `--v8-flags=--max-old-space-size=${EXECUTION_LIMITS.v8HeapMb}`,
  ];

  if (media) {
    args.push(`--allow-run=${media.ffmpegProxy},${media.ffprobeProxy}`);
  }

  args.push(entry);
  return args;
}

function executeDeno(
  runDir: string,
  entry: string,
  artifactDir: string,
  manifestPath: string,
  assetManifest: string,
  errPath: string,
  media: StudioMediaCapability | null,
): Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolveRun, rejectRun) => {
    const deno = denoBinary();
    const args = denoArguments(runDir, entry, media);

    const prlimit = '/usr/bin/prlimit';
    const usePrlimit =
      process.platform === 'linux' &&
      existsSync(prlimit) &&
      process.env.STUDIO_DISABLE_PRLIMIT !== '1';
    const command = usePrlimit ? prlimit : deno;
    const commandArgs =
      usePrlimit
        ? [
            '--cpu=55',
            '--nofile=128',
            // Deno/V8 plus native Canvas/Sharp/FFmpeg can create dozens of worker threads.
            // Keep a hard process/thread ceiling without starving runtime startup.
            '--nproc=256',
            // Do not apply RLIMIT_AS to Deno/V8. V8/Oilpan reserve large virtual
            // address ranges independently of committed memory, so a low address-space
            // ceiling can abort before user code runs even when the 256 MB V8 heap cap
            // and the Studio output/time/process limits are respected.
            '--',
            deno,
            ...args,
          ]
        : args;

    const child = spawn(command, commandArgs, {
      cwd: runDir,
      env: safeEnvironment(runDir, artifactDir, manifestPath, assetManifest, errPath, media),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let outputExceeded = false;

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes <= EXECUTION_LIMITS.processOutputBytes) stdout += chunk.toString('utf8');
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
      resolveRun({ exitCode: code, stdout, stderr, timedOut });
    });
  });
}

function studioRuntimeDebugBase(
  runDir: string,
  media: StudioMediaCapability | null,
): StudioRuntimeDebug {
  const args = denoArguments(runDir, join(runDir, 'snippet.ts'), media);
  const proxies = mediaProxyPaths();
  const deno = denoBinary();
  return {
    schemaVersion: 1,
    backend: 'same-origin-deno',
    deploymentCommit:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_REF ||
      process.env.GITHUB_SHA ||
      'unknown',
    deploymentEnvironment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    apexifyPin: APEXIFY_PIN,
    sysPermissionArg: args.find((arg) => arg === '--allow-sys' || arg.startsWith('--allow-sys=')) ?? null,
    envPermissionArg: args.find((arg) => arg === '--allow-env' || arg.startsWith('--allow-env=')) ?? null,
    ffiPermissionArg: args.find((arg) => arg === '--allow-ffi' || arg.startsWith('--allow-ffi=')) ?? null,
    denoRuntimeAvailable: denoRuntimeAvailable(),
    denoBinaryExists: existsSync(deno),
    nativeCanvasEntryExists: existsSync(nativeCanvasEntry()),
    nativeCanvasRootExists: existsSync(nativeCanvasRoot()),
    sharpNativeRootExists: existsSync(sharpNativeRoot()),
    mediaCapabilityCreated: Boolean(media),
    ffmpegProxyExists: existsSync(proxies.ffmpegProxy),
    ffprobeProxyExists: existsSync(proxies.ffprobeProxy),
    ffmpegBinaryAvailable: mediaBinaryPairAvailable(),
  };
}

async function runStudioRuntimePreflight(
  runDir: string,
  artifactDir: string,
  manifestPath: string,
  assetManifest: string,
  errPath: string,
  media: StudioMediaCapability | null,
): Promise<StudioRuntimeDebug['preflight']> {
  const entry = join(runDir, 'studio-runtime-preflight.ts');
  writeFileSync(
    entry,
    [
      "import * as os from 'node:os';",
      "const result = {",
      "  cpus: (() => { try { return { ok: true, count: os.cpus().length }; } catch (error) { return { ok: false, error: String(error) }; } })(),",
      "  networkInterfaces: (() => { try { return { ok: true, count: Object.keys(os.networkInterfaces()).length }; } catch (error) { return { ok: false, error: String(error) }; } })(),",
      "};",
      "console.log(JSON.stringify(result));",
    ].join('\n'),
    { mode: 0o600 },
  );

  try {
    const result = await executeDeno(
      runDir,
      entry,
      artifactDir,
      manifestPath,
      assetManifest,
      errPath,
      media,
    );
    return {
      attempted: true,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      stdout: result.stdout.trim().slice(0, 8_000),
      stderr: result.stderr.trim().slice(0, 8_000),
    };
  } catch (error) {
    return {
      attempted: true,
      exitCode: null,
      timedOut: false,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
    };
  } finally {
    try { rmSync(entry, { force: true }); } catch {}
  }
}


export async function runSameOriginIsolatedStudio(
  code: string,
  assets: readonly StudioVirtualAsset[],
  files: readonly StudioWorkspaceFile[] = [],
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
    const workspaceNames = new Set(files.map((file) => file.name));
    assertUserImportsAreSandboxCompatible(code, workspaceNames);
    for (const file of files) assertUserImportsAreSandboxCompatible(file.source, workspaceNames);
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
  const media = createMediaCapability(runDir);

  try {
    const materialized = materializeAssets(runDir, assets);
    const workspaceNames = materializeWorkspaceFiles(runDir, files);
    writeFileSync(
      assetManifestPath,
      JSON.stringify({ schemaVersion: 1, assets: materialized.manifest }, null, 2),
      { mode: 0o600 },
    );

    const executable = rewriteWorkspaceRelativeImports(
      rewriteAssetReferences(code, materialized.refs),
      workspaceNames,
    );
    writeFileSync(
      entry,
      wrapStudioSnippetForRunner(executable, {
        apexifyImportHref: pathToFileURL(apexifyEntry()).href,
        canvasImportHref: pathToFileURL(nativeCanvasEntry()).href,
        defaultFontPath: defaultStudioFontPath(),
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
      media,
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
      const runtimeDebug = studioRuntimeDebugBase(runDir, media);
      runtimeDebug.preflight = await runStudioRuntimePreflight(
        runDir,
        artifactDir,
        manifestPath,
        assetManifestPath,
        errPath,
        media,
      );
      return {
        status: 422,
        body: {
          ok: false,
          error: errorText.slice(0, EXECUTION_LIMITS.processOutputBytes),
          stderr: result.stderr.trim().slice(0, EXECUTION_LIMITS.processOutputBytes) || undefined,
          elapsedMs,
          exitCode: result.exitCode,
          runtimeDebug,
        },
      };
    }

    if (!existsSync(manifestPath)) {
      const runtimeDebug = studioRuntimeDebugBase(runDir, media);
      runtimeDebug.preflight = await runStudioRuntimePreflight(
        runDir,
        artifactDir,
        manifestPath,
        assetManifestPath,
        errPath,
        media,
      );
      return {
        status: 422,
        body: {
          ok: false,
          error: result.stderr.trim() || 'Studio execution produced no artifact manifest.',
          elapsedMs,
          exitCode: result.exitCode,
          runtimeDebug,
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
        runtimeDebug: studioRuntimeDebugBase(runDir, media),
      },
    };
  } finally {
    activeRuns = Math.max(0, activeRuns - 1);
    if (media) {
      try {
        rmSync(media.file, { force: true });
      } catch {
        // best-effort media capability cleanup
      }
    }
    try {
      rmSync(runDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup of the disposable Studio workspace
    }
  }
}
