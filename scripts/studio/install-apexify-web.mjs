import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { get } from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const destination = join(root, 'vendor', 'apexify-web');
const sourceCommit = '45b9381c07b70bb16be456406940858af8ab699a';
const base = `https://raw.githubusercontent.com/EIAS79/Apexify.js/${sourceCommit}/packages/web`;

const files = [
  { path: 'package.json', blob: 'ecdde0366bfd302af6c9b08d004788298fe9db93' },
  { path: 'src/index.ts', blob: '88c60bbe95ce5d9818090a10c247f2e8f33ec8bf' },
  { path: 'src/studio-preview.ts', blob: '308331b6c2b9eb769c9114794824664fe881fa81' },
  { path: 'src/safe-preview-expression.ts', blob: 'cc7501d395eb8ce20707177c86e5f236c88f0e8b' },
];

function gitBlobSha(bytes) {
  const prefix = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return createHash('sha1').update(prefix).update(bytes).digest('hex');
}

function download(url, redirects = 0) {
  return new Promise((resolvePromise, reject) => {
    const request = get(
      url,
      { headers: { 'User-Agent': 'Apexify-Studio-Build' } },
      (response) => {
        if (
          response.statusCode &&
          [301, 302, 303, 307, 308].includes(response.statusCode) &&
          response.headers.location
        ) {
          response.resume();
          if (redirects >= 5) {
            reject(new Error('Apexify Web download redirect limit exceeded.'));
            return;
          }
          download(new URL(response.headers.location, url).toString(), redirects + 1)
            .then(resolvePromise, reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Apexify Web download failed with HTTP ${response.statusCode}: ${url}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => resolvePromise(Buffer.concat(chunks)));
        response.on('error', reject);
      },
    );
    request.on('error', reject);
  });
}

console.log(`[studio] installing @apexify/web source snapshot ${sourceCommit.slice(0, 12)}`);

try {
  await rm(destination, { recursive: true, force: true });
  for (const file of files) {
    const bytes = await download(`${base}/${file.path}`);
    const actual = gitBlobSha(bytes);
    if (actual !== file.blob) {
      throw new Error(
        `Integrity mismatch for @apexify/web/${file.path}: expected ${file.blob}, got ${actual}`,
      );
    }

    const target = join(destination, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }

  await writeFile(
    join(destination, 'SOURCE.json'),
    JSON.stringify(
      {
        package: '@apexify/web',
        repository: 'EIAS79/Apexify.js',
        commit: sourceCommit,
        files: Object.fromEntries(files.map((file) => [file.path, file.blob])),
      },
      null,
      2,
    ) + '\n',
  );

  console.log('[studio] installed @apexify/web:', destination);
} catch (error) {
  console.error(
    '[studio] failed to install pinned @apexify/web:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
