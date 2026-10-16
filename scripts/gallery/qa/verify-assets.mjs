#!/usr/bin/env node
/**
 * Gallery artifact preflight. Pure Node.js, no project runtime dependencies.
 * Verifies provenance paths, file signatures, dimensions and real MP4 duration.
 * It does NOT claim that a source file reproduces the same pixels: that must
 * be established by rendering and comparing the generated artifact separately.
 */
import { createReadStream } from 'node:fs';
import { open, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const DEFAULT_MAX_BYTES = 1024 * 1024 * 1024;
const extensions = { '.png': 'image', '.gif': 'gif', '.mp4': 'video' };

function assertSafeRelative(relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) ||
      relative.includes('\\') || relative.split('/').some(part => part === '..' || part === '')) {
    throw new Error('Unsafe repository-relative path: ' + String(relative));
  }
}

async function resolveFile(root, relative, maxBytes) {
  assertSafeRelative(relative);
  const absolute = path.resolve(root, relative);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error('Path escapes repository root: ' + relative);
  }
  const resolved = await realpath(absolute);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error('Symlink escapes repository root: ' + relative);
  }
  const info = await stat(resolved);
  if (!info.isFile() || info.size === 0 || info.size > maxBytes) {
    throw new Error('Missing, empty or oversized file: ' + relative + ' (' + info.size + ' bytes)');
  }
  return { absolute: resolved, size: info.size };
}

async function fingerprint(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function header(file, length = 32) {
  const handle = await open(file, 'r');
  try {
    const bytes = Buffer.alloc(length);
    const { bytesRead } = await handle.read(bytes, 0, length, 0);
    return bytes.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function imageInfo(bytes, kind) {
  if (kind === 'image') {
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ||
        bytes.toString('ascii', 12, 16) !== 'IHDR') {
      throw new Error('Invalid PNG signature/IHDR');
    }
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (kind === 'gif') {
    if (bytes.length < 10 || !['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) {
      throw new Error('Invalid GIF signature');
    }
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  if (kind === 'video') {
    if (bytes.length < 12 || bytes.toString('ascii', 4, 8) !== 'ftyp') {
      throw new Error('Invalid MP4 ftyp header');
    }
    return {};
  }
  throw new Error('Unsupported asset media type: ' + kind);
}

async function ffprobeVideo(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error', '-show_entries',
    'format=duration:stream=codec_type,width,height,duration', '-of', 'json', file,
  ], { timeout: 20000, maxBuffer: 65536 });
  const data = JSON.parse(stdout);
  const video = data.streams?.find(stream => stream.codec_type === 'video');
  if (!video) throw new Error('MP4 has no video stream');
  return {
    width: Number(video.width),
    height: Number(video.height),
    duration: Number(data.format?.duration ?? video.duration),
  };
}

function checkGeometry(info, expected, name) {
  if (!Number.isInteger(info.width) || info.width <= 0 ||
      !Number.isInteger(info.height) || info.height <= 0) {
    throw new Error(name + ' has invalid dimensions');
  }
  for (const axis of ['width', 'height']) {
    if (expected[axis] !== undefined && info[axis] !== expected[axis]) {
      throw new Error(name + ': expected ' + axis + ' ' + expected[axis] + ', got ' + info[axis]);
    }
  }
}

/**
 * @param {object} manifest - {templates:[{id,source?,sourceKind?,outputs:[{path,media?,width?,height?,minDurationSeconds?}]}]}
 * @param {object} options - {root?,maxBytes?,probeVideo?}
 */
export async function verifyGalleryManifest(manifest, options = {}) {
  const root = await realpath(path.resolve(options.root ?? process.cwd()));
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const probeVideo = options.probeVideo ?? ffprobeVideo;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Invalid maxBytes');
  if (!manifest || !Array.isArray(manifest.templates)) throw new Error('Manifest requires templates array');
  const report = { status: 'PASS', verifiedTemplates: 0, verifiedOutputs: 0, files: [], errors: [], warnings: [] };
  const ids = new Set();
  for (const item of manifest.templates) {
    const id = item?.id;
    const context = 'template ' + String(id);
    try {
      if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(id)) throw new Error('Invalid template ID');
      if (ids.has(id)) throw new Error('Duplicate template ID');
      ids.add(id);
      if (!Array.isArray(item.outputs) || !item.outputs.length) throw new Error('No declared outputs');
      if (!item.source && item.sourceKind !== 'showcase') {
        throw new Error('Missing source; only explicit output-only showcases may omit it');
      }
      if (item.source) {
        if (!/\.(?:js|mjs|ts|tsx)$/i.test(item.source)) throw new Error('Source must be JS/TS');
        const source = await resolveFile(root, item.source, maxBytes);
        report.files.push({ template: id, role: 'source', path: item.source, size: source.size,
          sha256: await fingerprint(source.absolute) });
      }
      const usedPaths = new Set();
      for (const output of item.outputs) {
        const relative = output?.path;
        if (usedPaths.has(relative)) throw new Error('Duplicate output path: ' + relative);
        usedPaths.add(relative);
        const ext = path.extname(relative ?? '').toLowerCase();
        const kind = extensions[ext];
        if (!kind) throw new Error('Only PNG, GIF, MP4 outputs are supported: ' + relative);
        if (output.media && output.media !== kind) throw new Error('Media/extension mismatch: ' + relative);
        const file = await resolveFile(root, relative, maxBytes);
        let info = imageInfo(await header(file.absolute), kind);
        if (kind === 'video') {
          try { info = await probeVideo(file.absolute); }
          catch (error) { throw new Error('ffprobe failed for ' + relative + ': ' + error.message); }
          if (!Number.isFinite(info.duration) || info.duration <= 0) {
            throw new Error('Video duration must be positive: ' + relative);
          }
          if (output.minDurationSeconds !== undefined &&
              info.duration < output.minDurationSeconds) {
            throw new Error('Video shorter than expected: ' + relative);
          }
        }
        checkGeometry(info, output, relative);
        report.files.push({ template: id, role: 'output', path: relative, media: kind,
          width: info.width, height: info.height, ...(kind === 'video' ? { duration: info.duration } : {}),
          size: file.size, sha256: await fingerprint(file.absolute) });
        report.verifiedOutputs++;
      }
      report.verifiedTemplates++;
    } catch (error) {
      report.errors.push(context + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  if (report.errors.length) report.status = 'FAIL';
  return report;
}

async function cli() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/gallery/qa/verify-assets.mjs --manifest <manifest.json> [--root <repo>] [--report <report.json>]');
    return;
  }
  const arg = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
  const manifestPath = arg('--manifest');
  if (!manifestPath) throw new Error('--manifest <manifest.json> is required');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const report = await verifyGalleryManifest(manifest, { root: arg('--root') ?? process.cwd() });
  console.log(JSON.stringify(report, null, 2));
  if (arg('--report')) await writeFile(arg('--report'), JSON.stringify(report, null, 2) + '\n');
  if (report.status === 'FAIL') process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().catch(error => { console.error('[gallery preflight] ' + error.message); process.exitCode = 1; });
}
