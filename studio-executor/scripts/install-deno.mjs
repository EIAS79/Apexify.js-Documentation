import { createWriteStream, chmodSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { get } from 'node:https';
import { arch, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const vendor = join(root, 'vendor');
const denoPath = join(vendor, process.platform === 'win32' ? 'deno.exe' : 'deno');
const version = process.env.STUDIO_DENO_VERSION || '2.4.5';

if (existsSync(denoPath)) {
  console.log('[studio-executor] Deno already installed:', denoPath);
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
          : null;

if (!target) {
  throw new Error(`Unsupported executor platform: ${platform()} ${arch()}`);
}

mkdirSync(vendor, { recursive: true });
const archive = join(vendor, 'deno.zip');
const url = `https://github.com/denoland/deno/releases/download/v${version}/deno-${target}.zip`;

function download(source, destination, redirects = 0) {
  return new Promise((resolvePromise, reject) => {
    const request = get(source, { headers: { 'User-Agent': 'Apexify-Studio-Executor' } }, (response) => {
      if (
        response.statusCode &&
        [301, 302, 303, 307, 308].includes(response.statusCode) &&
        response.headers.location
      ) {
        response.resume();
        if (redirects >= 5) return reject(new Error('Deno download redirect limit exceeded.'));
        return download(new URL(response.headers.location, source).toString(), destination, redirects + 1)
          .then(resolvePromise, reject);
      }
      if (response.statusCode !== 200) {
        response.resume();
        return reject(new Error(`Deno download failed with HTTP ${response.statusCode}`));
      }
      const out = createWriteStream(destination, { mode: 0o600 });
      response.pipe(out);
      out.on('finish', () => out.close(resolvePromise));
      out.on('error', reject);
    });
    request.on('error', reject);
  });
}

console.log('[studio-executor] downloading Deno', version);
await download(url, archive);

const zip = new AdmZip(archive);
zip.extractEntryTo(platform() === 'win32' ? 'deno.exe' : 'deno', vendor, false, true);
rmSync(archive, { force: true });
if (platform() !== 'win32') chmodSync(denoPath, 0o755);
console.log('[studio-executor] installed', denoPath);
