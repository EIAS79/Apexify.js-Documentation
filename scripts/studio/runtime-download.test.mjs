import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer, get as httpGet } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { downloadVerified } from './download-runtime.mjs';
import { installFFmpeg, verifyElf } from './install-ffmpeg.mjs';

const payload = Buffer.from('pinned runtime fixture');
const artifact = {
  url: 'https://runtime.test/binary.zip', bytes: payload.length,
  sha256: createHash('sha256').update(payload).digest('hex'),
};

async function fixture(handler, run) {
  const root = await mkdtemp(join(tmpdir(), 'apexify-runtime-download-'));
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const options = {
    get(source, { signal }, callback) {
      return httpGet(`http://127.0.0.1:${server.address().port}${new URL(source).pathname}`, { signal }, callback);
    },
    retryDelayMs: 0, timeoutMs: 1000, onRetry() {},
  };
  try { await run(join(root, 'binary.zip'), options); }
  finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
}

test('follows HTTPS redirects and writes only checksum-matching bytes', async () => {
  await fixture((request, response) => {
    if (request.url === '/binary.zip') response.writeHead(302, { Location: '/asset' }).end();
    else response.end(payload);
  }, async (destination, options) => {
    await downloadVerified(artifact, destination, options);
    assert.deepEqual(await readFile(destination), payload);
  });
});

test('retries connection resets and server failures with a finite attempt count', async () => {
  let attempts = 0;
  await fixture((request, response) => {
    attempts += 1;
    if (attempts === 1) request.socket.destroy();
    else if (attempts === 2) response.writeHead(503).end();
    else response.end(payload);
  }, async (destination, options) => {
    await downloadVerified(artifact, destination, options);
    assert.equal(attempts, 3);
    assert.deepEqual(await readFile(destination), payload);
  });
});

test('rejects changed bytes without retrying or leaving an output file', async () => {
  let attempts = 0;
  await fixture((request, response) => { attempts += 1; response.end(Buffer.alloc(payload.length)); }, async (destination, options) => {
    await assert.rejects(downloadVerified(artifact, destination, options), /SHA-256/);
    assert.equal(attempts, 1);
    assert.equal(existsSync(destination), false);
  });
});

test('rejects oversized responses and removes the partial file', async () => {
  await fixture((request, response) => response.end(Buffer.alloc(payload.length + 1)), async (destination, options) => {
    await assert.rejects(downloadVerified(artifact, destination, options), /exceeds its pinned size/);
    assert.equal(existsSync(destination), false);
  });
});

test('rejects truncated transfers and removes their partial output', async () => {
  await fixture((request, response) => {
    response.writeHead(200, { 'Content-Length': payload.length + 10 });
    response.write(payload.subarray(0, 3));
    response.end();
  }, async (destination, options) => {
    await assert.rejects(downloadVerified(artifact, destination, { ...options, attempts: 1, timeoutMs: 50 }));
    assert.equal(existsSync(destination), false);
  });
});

test('times out a stalled connection and exhausts only the configured attempts', async () => {
  let attempts = 0;
  await fixture(() => { attempts += 1; }, async (destination, options) => {
    await assert.rejects(downloadVerified(artifact, destination, { ...options, attempts: 2, timeoutMs: 40 }));
    assert.equal(attempts, 2);
    assert.equal(existsSync(destination), false);
  });
});

test('does not retry HTTP 404 or accept a redirect to plain HTTP', async () => {
  let attempts = 0;
  await fixture((request, response) => { attempts += 1; response.writeHead(404).end(); }, async (destination, options) => {
    await assert.rejects(downloadVerified(artifact, destination, options), /HTTP 404/);
    assert.equal(attempts, 1);
  });
  await fixture((request, response) => response.writeHead(302, { Location: 'http://runtime.test/asset' }).end(), async (destination, options) => {
    await assert.rejects(downloadVerified(artifact, destination, { ...options, attempts: 1 }), /require HTTPS/);
  });
});

test('failed installation preserves the previous runtime and publishes no partial pair', async () => {
  const root = await mkdtemp(join(tmpdir(), 'apexify-runtime-install-'));
  const vendor = join(root, 'studio-ffmpeg');
  const { mkdir, readdir } = await import('node:fs/promises');
  await mkdir(vendor);
  await writeFile(join(vendor, 'ffmpeg.gz'), 'previous runtime');
  try {
    await assert.rejects(installFFmpeg({ vendor, architecture: 'x64', download: async () => { throw new Error('offline'); } }), /offline/);
    assert.equal(await readFile(join(vendor, 'ffmpeg.gz'), 'utf8'), 'previous runtime');
    assert.deepEqual(await readdir(root), ['studio-ffmpeg']);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('rejects executables built for another architecture before publishing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'apexify-runtime-elf-'));
  const binary = join(root, 'binary');
  const header = Buffer.alloc(20);
  header.write('\x7fELF'); header[4] = 2; header[5] = 1; header.writeUInt16LE(183, 18);
  await writeFile(binary, header);
  try {
    verifyElf(binary, 'arm64');
    assert.throws(() => verifyElf(binary, 'x64'), /not a Linux x64/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
