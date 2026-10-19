import { createHash } from 'node:crypto';
import {
  chmodSync, closeSync, createReadStream, createWriteStream, existsSync,
  mkdirSync, mkdtempSync, openSync, readFileSync, readSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { arch, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { downloadVerified } from './download-runtime.mjs';

export const runtime = JSON.parse(readFileSync(new URL('./ffmpeg-runtime.json', import.meta.url), 'utf8'));
const components = ['ffmpeg', 'ffprobe'];

async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export function verifyElf(path, architecture) {
  const fd = openSync(path, 'r');
  const header = Buffer.alloc(20);
  try {
    if (readSync(fd, header, 0, header.length, 0) !== header.length ||
        header.subarray(0, 4).toString('hex') !== '7f454c46' ||
        header[4] !== 2 || header[5] !== 1 ||
        header.readUInt16LE(18) !== ({ x64: 62, arm64: 183 })[architecture]) {
      throw new Error(`FFmpeg runtime is not a Linux ${architecture} ELF executable.`);
    }
  } finally { closeSync(fd); }
}

async function cachedPairValid(vendor, architecture) {
  try {
    const installed = JSON.parse(readFileSync(join(vendor, 'runtime.json'), 'utf8'));
    if (installed.version !== runtime.version || installed.architecture !== architecture) return false;
    for (const name of components) {
      if (installed[name]?.archiveSha256 !== runtime.targets[architecture][name].sha256 ||
          installed[name]?.gzipSha256 !== await digest(join(vendor, name + '.gz'))) return false;
    }
    // Raw binaries take precedence at runtime; they must not bypass the verified pair.
    return components.every((name) => !existsSync(join(vendor, name)));
  } catch { return false; }
}

/** Stage and validate both executables before replacing the deployable directory. */
export async function installFFmpeg({ vendor, architecture = arch(), download = downloadVerified }) {
  if (!runtime.targets[architecture]) throw new Error(`Unsupported FFmpeg architecture: ${architecture}`);
  if (await cachedPairValid(vendor, architecture)) {
    console.log(`[studio] verified cached FFmpeg ${runtime.version} (${architecture})`);
    return;
  }
  mkdirSync(dirname(vendor), { recursive: true });
  const stage = mkdtempSync(join(dirname(vendor), '.studio-ffmpeg-'));
  const installed = { version: runtime.version, architecture };
  try {
    for (const name of components) {
      const artifact = runtime.targets[architecture][name];
      const archive = join(stage, name + '.zip');
      const binary = join(stage, name);
      await download(artifact, archive);
      const fd = openSync(binary, 'w', 0o700);
      let extracted;
      try {
        // Extract only the expected entry, never archive-controlled filesystem paths.
        extracted = spawnSync('unzip', ['-p', archive, name], {
          stdio: ['ignore', fd, 'pipe'], timeout: 30_000, maxBuffer: 1024 * 1024,
        });
      } finally { closeSync(fd); }
      if (extracted.status !== 0) throw new Error(`Could not extract ${name}: ${extracted.error?.message || extracted.stderr}`);
      verifyElf(binary, architecture);
      chmodSync(binary, 0o755);
      if (architecture === arch()) {
        const check = spawnSync(binary, ['-version'], { encoding: 'utf8', timeout: 10_000 });
        if (check.status !== 0 || !check.stdout?.startsWith(`${name} version ${runtime.version}-static `)) {
          throw new Error(`Downloaded ${name} failed its version/execution check.`);
        }
      }
      const compressed = binary + '.gz';
      await pipeline(createReadStream(binary), createGzip({ level: 9 }), createWriteStream(compressed, { mode: 0o600 }));
      installed[name] = { archiveSha256: artifact.sha256, gzipSha256: await digest(compressed) };
      rmSync(archive);
      rmSync(binary);
    }
    writeFileSync(join(stage, 'runtime.json'), JSON.stringify(installed, null, 2) + '\n', { mode: 0o600 });
    rmSync(vendor, { recursive: true, force: true });
    renameSync(stage, vendor);
    console.log(`[studio] installed verified compressed FFmpeg ${runtime.version} (${architecture})`);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

async function main() {
  if (platform() !== 'linux' || !runtime.targets[arch()]) {
    console.log('[studio] bundled FFmpeg is installed only for Linux x64/arm64 builds; system FFmpeg may still be used locally.');
    return;
  }
  const systemPairAvailable = ['/usr/bin', '/usr/local/bin'].some((directory) =>
    components.every((name) => existsSync(join(directory, name))));
  if (process.env.CI === 'true' && process.env.VERCEL !== '1' && systemPairAvailable) {
    console.log('[studio] using system FFmpeg pair for CI Studio verification');
    return;
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  console.log(`[studio] installing pinned FFmpeg ${runtime.version} (${arch()}) from GitHub release assets`);
  await installFFmpeg({ vendor: join(root, 'vendor', 'studio-ffmpeg') });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('[studio] failed to install the Studio FFmpeg runtime:', error.message);
    process.exitCode = 1;
  });
}
