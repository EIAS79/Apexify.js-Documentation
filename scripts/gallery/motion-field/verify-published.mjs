#!/usr/bin/env node
/**
 * Validate the exact committed source/PNG/video proof for the five Motion
 * Field Apexify.js templates. No npm runtime dependencies; read-only.
 *
 * Full visual/render equivalence additionally requires the package/fonts
 * and scripts/gallery/render-motion-field.mjs --check in a pinned environment.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open, readFile, stat } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const proofPath = join(root, 'lib/gallery/motion-field/render-proof.json');
const proof = JSON.parse(await readFile(proofPath, 'utf8'));
const errors = [];
let checked = 0;

function filePath(webPath) {
  if (typeof webPath !== 'string' || !webPath.startsWith('/gallery/motion-field/')) {
    throw new Error('Unexpected artifact URL ' + webPath);
  }
  const parts = webPath.slice(1).split('/');
  if (parts.some(part => part === '..' || part === '.' || part === '')) {
    throw new Error('Unsafe artifact URL ' + webPath);
  }
  const target = resolve(root, 'public', ...parts);
  if (!target.startsWith(join(root, 'public') + sep)) {
    throw new Error('Artifact path escaped public directory');
  }
  return target;
}

async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const block of createReadStream(file)) hash.update(block);
  return hash.digest('hex');
}

async function bytesAtStart(file, n = 32) {
  const fd = await open(file, 'r');
  try {
    const buffer = Buffer.alloc(n);
    const result = await fd.read(buffer, 0, n, 0);
    return buffer.subarray(0, result.bytesRead);
  } finally { await fd.close(); }
}

async function verify(webPath, expected, kind, dimensions) {
  const file = filePath(webPath);
  const details = await stat(file);
  if (!details.isFile() || details.size <= 0) throw new Error(webPath + ' missing or empty');
  if (details.size > 300 * 1024 * 1024) throw new Error(webPath + ' unexpectedly oversized');
  const bytes = await bytesAtStart(file);
  if (kind === 'png') {
    if (!bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ||
        bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Invalid PNG: ' + webPath);
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    if (width !== dimensions.width || height !== dimensions.height) {
      throw new Error('Incorrect PNG geometry: ' + webPath);
    }
  }
  if (kind === 'mp4') {
    if (bytes.toString('ascii', 4, 8) !== 'ftyp') throw new Error('Invalid MP4: ' + webPath);
    if (process.env.GALLERY_QA_REQUIRE_FFPROBE === '1') {
      const raw = execFileSync('ffprobe', ['-v','error','-show_entries',
        'format=duration:stream=codec_type,width,height', '-of','json',file], {
        encoding: 'utf8', timeout: 20000, maxBuffer: 65536,
      });
      const parsed = JSON.parse(raw);
      const video = parsed.streams?.find(stream => stream.codec_type === 'video');
      const duration = Number(parsed.format?.duration);
      if (!video || video.width !== dimensions.width ||
          video.height < dimensions.height || video.height > dimensions.height + 1 ||
          !Number.isFinite(duration) || duration <= 0) {
        throw new Error('Invalid video stream, dimensions or duration: ' + webPath);
      }
    }
  }
  const actual = await hashFile(file);
  if (actual !== expected) throw new Error('SHA256 mismatch for ' + webPath);
  checked++;
}

if (!Array.isArray(proof.recipes) || proof.recipes.length !== 5) {
  throw new Error('Expected provenance for precisely five original Motion Field recipes');
}
const ids = new Set();
for (const item of proof.recipes) {
  try {
    if (ids.has(item.id)) throw new Error('Duplicate recipe ID: ' + item.id);
    ids.add(item.id);
    if (!/^[a-z0-9-]+$/.test(item.id)) throw new Error('Invalid recipe ID');
    await verify(item.source, item.sourceSHA256, 'source', item);
    await verify(item.output, item.outputSHA256, 'png', item);
    // A WebP derivative must exist, but its encoding may be optimized separately.
    const webp = filePath('/gallery/motion-field/' + item.id + '.webp');
    const header = await bytesAtStart(webp, 12);
    if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP') {
      throw new Error('Missing or invalid published WebP: ' + item.id);
    }
    checked++;
    if (item.animation) {
      const videoPath = '/gallery/motion-field/' + item.id + '.mp4';
      await verify(videoPath, item.animation.videoSHA256, 'mp4', item);
      if (item.animation.frames !== 48 || item.animation.fps !== 12 || item.animation.seconds !== 4) {
        throw new Error('Unexpected Motion Field timeline contract: ' + item.id);
      }
    }
  } catch (error) {
    errors.push(item.id + ': ' + (error instanceof Error ? error.message : String(error)));
  }
}
const result = { status: errors.length ? 'FAIL' : 'PASS', recipes: proof.recipes.length, files: checked, errors };
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
