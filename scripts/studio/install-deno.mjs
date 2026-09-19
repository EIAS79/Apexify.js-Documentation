import { chmodSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { get } from 'node:https';
import { arch, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const vendor = join(root, 'vendor', 'studio-deno');
const denoPath = join(vendor, platform() === 'win32' ? 'deno.exe' : 'deno');
const version = process.env.STUDIO_DENO_VERSION || '2.4.5';

if (existsSync(denoPath)) {
  process.exit(0);
}

const target =
  platform() === 'linux' && arch() === 'x64'
    ? 'x86_64-unknown-linux-gnu'
    : platform() === 'linux' && arch() === 'arm64'
      ? 'aarch64-unknown-linux-gnu'
      : platform() === 'darwin' && arch() === 'arm64'
        ? 'aarch64-apple-darwin'
        : platform() === 'darwin' && arch() === 'x64'
          ? 'x86_64-apple-darwin'
          : platform() === 'win32' && arch() === 'x64'
            ? 'x86_64-pc-windows-msvc'
            : null;

if (!target) {
  console.warn(`[studio] Deno isolation runtime not installed on unsupported platform: ${platform()} ${arch()}`);
  process.exit(0);
}

mkdirSync(vendor, { recursive: true });
const archive = join(vendor, 'deno.zip');
const url = `https://github.com/denoland/deno/releases/download/v${version}/deno-${target}.zip`;

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
          reject(new Error('Deno download redirect limit exceeded.'));
          return;
        }
        download(new URL(response.headers.location, source).toString(), destination, redirects + 1)
          .then(resolvePromise, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Deno download failed with HTTP ${response.statusCode}`));
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

function extractZip() {
  if (platform() === 'win32') {
    const command = [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Expand-Archive -LiteralPath '${archive.replace(/'/g, "''")}' -DestinationPath '${vendor.replace(/'/g, "''")}' -Force`,
    ];
    const result = spawnSync('powershell.exe', command, { stdio: 'inherit' });
    return result.status === 0;
  }

  const result = spawnSync('unzip', ['-o', '-q', archive, '-d', vendor], { stdio: 'inherit' });
  return result.status === 0;
}

console.log(`[studio] installing Deno ${version} for same-origin Studio isolation`);

try {
  await download(url, archive);
  if (!extractZip()) {
    throw new Error('Could not extract the Deno runtime. Ensure unzip is installed on the build image.');
  }
  rmSync(archive, { force: true });
  if (platform() !== 'win32') chmodSync(denoPath, 0o755);
  console.log('[studio] installed isolated runtime:', denoPath);
} catch (error) {
  rmSync(archive, { force: true });
  console.error(
    '[studio] failed to install the same-origin Deno isolation runtime:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
