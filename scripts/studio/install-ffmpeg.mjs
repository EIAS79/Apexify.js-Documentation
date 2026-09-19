import { chmodSync, existsSync, mkdirSync, readdirSync, rmSync, renameSync } from 'node:fs';
import { get } from 'node:https';
import { arch, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const vendor = join(root, 'vendor', 'studio-ffmpeg');
const ffmpeg = join(vendor, platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const ffprobe = join(vendor, platform() === 'win32' ? 'ffprobe.exe' : 'ffprobe');

if (existsSync(ffmpeg) && existsSync(ffprobe)) process.exit(0);

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
  renameSync(join(folder, 'ffmpeg'), ffmpeg);
  renameSync(join(folder, 'ffprobe'), ffprobe);
  chmodSync(ffmpeg, 0o755);
  chmodSync(ffprobe, 0o755);
  rmSync(archive, { force: true });
  rmSync(extractDir, { recursive: true, force: true });
  console.log('[studio] installed Studio FFmpeg:', ffmpeg);
} catch (error) {
  rmSync(archive, { force: true });
  rmSync(extractDir, { recursive: true, force: true });
  console.error(
    '[studio] failed to install the Studio FFmpeg runtime:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
