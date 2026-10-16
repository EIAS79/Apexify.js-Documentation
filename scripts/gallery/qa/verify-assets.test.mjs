import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { verifyGalleryManifest } from './verify-assets.mjs';

const png = Buffer.alloc(32);
Buffer.from('89504e470d0a1a0a', 'hex').copy(png, 0);
png.write('IHDR', 12, 'ascii');
png.writeUInt32BE(1200, 16);
png.writeUInt32BE(630, 20);

const gif = Buffer.alloc(16);
gif.write('GIF89a', 0, 'ascii');
gif.writeUInt16LE(640, 6);
gif.writeUInt16LE(360, 8);

const mp4 = Buffer.alloc(20);
mp4.writeUInt32BE(20, 0);
mp4.write('ftyp', 4, 'ascii');
mp4.write('isom', 8, 'ascii');

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'apexify-gallery-qa-'));
  try {
    await mkdir(path.join(root, 'recipes'));
    await mkdir(path.join(root, 'public'));
    await writeFile(path.join(root, 'recipes', 'orbit.ts'), 'import { ApexPainter } from "apexify.js";\n');
    await writeFile(path.join(root, 'public', 'orbit.png'), png);
    await writeFile(path.join(root, 'public', 'motion.gif'), gif);
    await writeFile(path.join(root, 'public', 'orbit.mp4'), mp4);
    return await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const item = outputs => ({
  id: 'orbit',
  source: 'recipes/orbit.ts',
  outputs,
});
const image = { path: 'public/orbit.png', width: 1200, height: 630 };
const videoProbe = async () => ({ width: 1280, height: 720, duration: 3.2 });

test('passes bounded source and PNG geometry checks and reports SHA-256', async () => {
  await fixture(async root => {
    const result = await verifyGalleryManifest({ templates: [item([image])] }, { root });
    assert.equal(result.status, 'PASS');
    assert.equal(result.verifiedTemplates, 1);
    assert.equal(result.verifiedOutputs, 1);
    assert.match(result.files.find(file => file.role === 'output').sha256, /^[a-f0-9]{64}$/);
  });
});

test('verifies GIF dimensions and MP4 duration through a real-probe contract', async () => {
  await fixture(async root => {
    const result = await verifyGalleryManifest({
      templates: [item([
        { path: 'public/motion.gif', media: 'gif', width: 640, height: 360 },
        { path: 'public/orbit.mp4', media: 'video', width: 1280, height: 720, minDurationSeconds: 3 },
      ])],
    }, { root, probeVideo: videoProbe });
    assert.equal(result.status, 'PASS');
    assert.equal(result.verifiedOutputs, 2);
    assert.equal(result.files.find(file => file.media === 'video').duration, 3.2);
  });
});

test('blocks path traversal and absolute paths', async () => {
  await fixture(async root => {
    for (const bad of ['../secret.png', '/tmp/secret.png', 'public/../orbit.png']) {
      const result = await verifyGalleryManifest({
        templates: [item([{ path: bad }])],
      }, { root });
      assert.equal(result.status, 'FAIL', bad);
    }
  });
});

test('blocks source symlinks escaping the repository', async () => {
  await fixture(async root => {
    const external = path.join(os.tmpdir(), 'outside-apexify-gallery-' + process.pid + '.ts');
    try {
      await writeFile(external, 'external');
      await symlink(external, path.join(root, 'recipes', 'external.ts'));
      const result = await verifyGalleryManifest({
        templates: [{ id: 'unsafe', source: 'recipes/external.ts', outputs: [image] }],
      }, { root });
      assert.equal(result.status, 'FAIL');
      assert.match(result.errors.join(' '), /Symlink escapes/);
    } finally {
      await rm(external, { force: true });
    }
  });
});

test('rejects a missing source unless explicitly marked as output-only showcase', async () => {
  await fixture(async root => {
    const missing = await verifyGalleryManifest({ templates: [{
      id: 'orphan', outputs: [image],
    }] }, { root });
    assert.equal(missing.status, 'FAIL');
    const permitted = await verifyGalleryManifest({ templates: [{
      id: 'showcase', sourceKind: 'showcase', outputs: [image],
    }] }, { root });
    assert.equal(permitted.status, 'PASS');
  });
});

test('rejects zero duration, missing video stream and insufficient duration', async () => {
  await fixture(async root => {
    for (const probeVideo of [
      async () => ({ width: 1280, height: 720, duration: 0 }),
      async () => { throw new Error('MP4 has no video stream'); },
      async () => ({ width: 1280, height: 720, duration: 1 }),
    ]) {
      const result = await verifyGalleryManifest({
        templates: [item([{ path: 'public/orbit.mp4', minDurationSeconds: 3 }])],
      }, { root, probeVideo });
      assert.equal(result.status, 'FAIL');
    }
  });
});

test('rejects a wrong PNG size, corrupt header, and output media mismatch', async () => {
  await fixture(async root => {
    const wrongSize = await verifyGalleryManifest({ templates: [item([{
      ...image, width: 900,
    }])] }, { root });
    assert.equal(wrongSize.status, 'FAIL');
    await writeFile(path.join(root, 'public', 'orbit.png'), Buffer.from('not a PNG file'));
    const corrupt = await verifyGalleryManifest({ templates: [item([image])] }, { root });
    assert.equal(corrupt.status, 'FAIL');
    const mismatch = await verifyGalleryManifest({ templates: [item([{
      path: 'public/motion.gif', media: 'image',
    }])] }, { root });
    assert.equal(mismatch.status, 'FAIL');
  });
});

test('rejects duplicate template IDs and duplicate outputs within an entry', async () => {
  await fixture(async root => {
    const duplicates = await verifyGalleryManifest({
      templates: [item([image]), item([image])],
    }, { root });
    assert.equal(duplicates.status, 'FAIL');
    assert.match(duplicates.errors.join(' '), /Duplicate template ID/);
    const duplicateOutput = await verifyGalleryManifest({
      templates: [item([image, image])],
    }, { root });
    assert.equal(duplicateOutput.status, 'FAIL');
    assert.match(duplicateOutput.errors.join(' '), /Duplicate output path/);
  });
});

test('rejects invalid manifests and undersized file budget', async () => {
  await fixture(async root => {
    await assert.rejects(() => verifyGalleryManifest({}, { root }), /templates array/);
    const tooSmall = await verifyGalleryManifest({
      templates: [item([image])],
    }, { root, maxBytes: 10 });
    assert.equal(tooSmall.status, 'FAIL');
  });
});
