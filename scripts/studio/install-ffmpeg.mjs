import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { get } from 'node:https';
import { arch, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const vendor = join(root, 'vendor', 'studio-ffmpeg');
const executableSuffix = platform() === 'win32' ? '.exe' : '';
const ffmpeg = join(vendor, 'ffmpeg' + executableSuffix);
const ffprobe = join(vendor, 'ffprobe' + executableSuffix);
const ffmpegGzip = ffmpeg + '.gz';
const ffprobeGzip = ffprobe + '.gz';

if (
  (existsSync(ffmpegGzip) && existsSync(ffprobeGzip)) ||
  (existsSync(ffmpeg) && existsSync(ffprobe))
) process.exit(0);

const systemPairAvailable = [
  ['/usr/bin/ffmpeg', '/usr/bin/ffprobe'],
  ['/usr/local/bin/ffmpeg', '/usr/local/bin/ffprobe'],
].some(([ffmpegPath, ffprobePath]) => existsSync(ffmpegPath) && existsSync(ffprobePath));

if (process.env.CI === 'true' && process.env.VERCEL !== '1' && systemPairAvailable) {
  console.log('[studio] using system FFmpeg pair for CI Studio verification');
  process.exit(0);
}

if (platform() !== 'linux' || !['x64', 'arm64'].includes(arch())) {
  console.log('[studio] bundled FFmpeg is installed only for Linux x64/arm64 builds; system FFmpeg may still be used locally.');
  process.exit(0);
}

const release = '6.0.1';
const target = arch() === 'arm64' ? 'arm64' : 'amd64';
const archiveName = `ffmpeg-${release}-${target}-static.tar.xz`;
const url = `https://johnvansickle.com/ffmpeg/old-releases/${archiveName}`;
const archive = join(vendor, archiveName);
const extractDir = join(vendor, 'extract');

mkdirSync(vendor, { recursive: true });
rmSync(extractDir, { recursive: true, force: true });
mkdirSync(extractDir, { recursive: true });

function download(source, destination, redirects = 0) {
  return new Promise((resolvePromise, reject) => {
    const request = get(source, { headers: { 'User-Agent': 'Apexify-Studio-Build' } }, (response) => {
      if (
        response.statusCode &&
        [301, 302, 303, 307, 308].includes(response.statusCode) &&
        response.headers.location
      ) {
        response.resume();
        if (redirects >= 5) {
          reject(new Error('FFmpeg download redirect limit exceeded.'));
          return;
        }
        download(new URL(response.headers.location, source).toString(), destination, redirects + 1)
          .then(resolvePromise, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`FFmpeg download failed with HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      response.on('end', async () => {
        try {
          const { writeFile } = await import('node:fs/promises');
          await writeFile(destination, Buffer.concat(chunks));
          resolvePromise();
        } catch (error) {
          reject(error);
        }
      });
      response.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function compressBinary(source, destination) {
  await pipeline(
    createReadStream(source),
    createGzip({ level: 9 }),
    createWriteStream(destination, { mode: 0o600 }),
  );
}

console.log(`[studio] installing pinned FFmpeg ${release} (${target}) for Studio video`);

try {
  await download(url, archive);
  const extracted = spawnSync('tar', ['-xJf', archive, '-C', extractDir], { stdio: 'inherit' });
  if (extracted.status !== 0) {
    throw new Error('Could not extract the FFmpeg archive. The build image must provide tar with xz support.');
  }

  const folder = readdirSync(extractDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(extractDir, entry.name))
    .find(
      (candidate) =>
        existsSync(join(candidate, 'ffmpeg')) &&
        existsSync(join(candidate, 'ffprobe')),
    );

  if (!folder) throw new Error('FFmpeg archive did not contain ffmpeg/ffprobe.');

  rmSync(ffmpeg, { force: true });
  rmSync(ffprobe, { force: true });
  rmSync(ffmpegGzip, { force: true });
  rmSync(ffprobeGzip, { force: true });

  await compressBinary(join(folder, 'ffmpeg'), ffmpegGzip);
  await compressBinary(join(folder, 'ffprobe'), ffprobeGzip);

  rmSync(archive, { force: true });
  rmSync(extractDir, { recursive: true, force: true });
  console.log('[studio] installed compressed Studio FFmpeg:', ffmpegGzip);
} catch (error) {
  rmSync(archive, { force: true });
  rmSync(extractDir, { recursive: true, force: true });
  rmSync(ffmpeg, { force: true });
  rmSync(ffprobe, { force: true });
  rmSync(ffmpegGzip, { force: true });
  rmSync(ffprobeGzip, { force: true });
  console.error(
    '[studio] failed to install the Studio FFmpeg runtime:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
