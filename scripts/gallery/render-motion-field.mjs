/** Rebuild the gallery from its downloadable source, never from mock artwork. */
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = process.cwd();
const output = path.join(root, 'public/gallery/motion-field');
const ids = ['orbit-study', 'signal-flow', 'launch-card', 'data-pulse', 'prism-type'];
const proof = [];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const check = process.argv.includes('--check');
for (const id of ids) {
  const file = path.join(output, 'source', `${id}.mjs`);
  const { render } = await import(pathToFileURL(file).href);
  const png = await render();
  const second = await render();
  assert.equal(hash(png), hash(second), `${id} must be deterministic`);
  const meta = await sharp(png).metadata();
  assert.equal(meta.width, 1200); assert.equal(meta.height, 675);
  if (check) {
    assert.equal(hash(png), hash(await readFile(path.join(output, `${id}.png`))), `${id} displayed PNG drifted from source`);
  } else {
    await writeFile(path.join(output, `${id}.png`), png);
    await sharp(png).resize(960).webp({ quality: 90 }).toFile(path.join(output, `${id}.webp`));
  }
  const animated = ['orbit-study', 'signal-flow'].includes(id);
  if (animated && !check) {
    const frames = await mkdtemp(path.join(tmpdir(), 'gallery-frames-'));
    try {
      for (let index = 0; index < 48; index++) {
        await writeFile(path.join(frames, `${String(index).padStart(3, '0')}.png`), await render(index / 48));
      }
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(frames, '%03d.png'),
        '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19',
        '-movflags', '+faststart', path.join(output, `${id}.mp4`)]);
    } finally { await rm(frames, { recursive: true, force: true }); }
  }
  proof.push({ id, source: `/gallery/motion-field/source/${id}.mjs`, sourceSHA256: hash(await readFile(file)),
    output: `/gallery/motion-field/${id}.png`, outputSHA256: hash(png), width: meta.width, height: meta.height,
    ...(animated ? { animation: { frames: 48, fps: 12, seconds: 4, source: 'render(index / 48)', encoder: 'FFmpeg libx264', videoSHA256: hash(await readFile(path.join(output, `${id}.mp4`))) } } : {}) });
  console.log(`${id}: source/output parity passed${animated ? ' · 48 rendered frames' : ''}`);
}
if (!check) {
  await mkdir('lib/gallery/motion-field', { recursive: true });
  await writeFile('lib/gallery/motion-field/render-proof.json', JSON.stringify({ package: manifest.dependencies['apexify.js'], fonts: 'dejavu-fonts-ttf@2.37.3', recipes: proof }, null, 2) + '\n');
} else {
  const saved = JSON.parse(await readFile('lib/gallery/motion-field/render-proof.json', 'utf8'));
  assert.deepEqual(saved.recipes, proof, 'Source, output, or video verification hashes changed');
}

// Static posters prevent hidden films/GIFs from animating or downloading on browse.
const legacyPosters = [
  ['showcase-apexify-spectrum', 'public/brand/Apexify-Spectrum.mp4'],
  ['showcase-orbit-breaker', 'public/brand/Orbit-Breaker.mp4'],
  ['peak-22', 'public/gallery/peak-lab/22-streaming-gif.gif'],
  ['peak-23', 'public/gallery/peak-lab/23-animate.gif'],
];
if (!check) for (const [id, media] of legacyPosters) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', media, '-frames:v', '1', '-vf', 'scale=960:-1', path.join(output, `${id}.webp`)]);
}
