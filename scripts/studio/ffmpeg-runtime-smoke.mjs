import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { installFFmpeg, runtime } from './install-ffmpeg.mjs';

if (process.platform !== 'linux' || !runtime.targets[process.arch]) {
  throw new Error('The bundled runtime smoke check requires Linux x64 or arm64.');
}
const vendor = resolve('vendor/studio-ffmpeg');
await installFFmpeg({ vendor });
const root = mkdtempSync(join(tmpdir(), 'apexify-ffmpeg-smoke-'));
try {
  for (const name of ['ffmpeg', 'ffprobe']) {
    const binary = join(root, name);
    writeFileSync(binary, gunzipSync(readFileSync(join(vendor, name + '.gz'))), { mode: 0o700 });
    chmodSync(binary, 0o755);
  }
  const ffmpeg = join(root, 'ffmpeg');
  const ffprobe = join(root, 'ffprobe');
  const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { timeout: 30_000, stdio: 'pipe' });
  const probe = (file) => JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { timeout: 10_000, encoding: 'utf8' }));
  const video = join(root, 'video.mp4');
  run(['-f', 'lavfi', '-i', 'testsrc=size=160x90:rate=10', '-f', 'lavfi', '-i', 'sine=frequency=1000:sample_rate=48000', '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', video]);
  const mp4 = probe(video);
  assert.equal(mp4.streams.find((stream) => stream.codec_type === 'video')?.codec_name, 'h264');
  assert.equal(mp4.streams.find((stream) => stream.codec_type === 'audio')?.codec_name, 'aac');
  assert.equal(mp4.streams.find((stream) => stream.codec_type === 'video')?.width, 160);
  assert.ok(Number(mp4.format.duration) >= 0.9 && Number(mp4.format.duration) < 1.2);
  const gif = join(root, 'animation.gif');
  run(['-f', 'lavfi', '-i', 'color=c=blue:s=64x64:r=5', '-t', '0.4', gif]);
  assert.equal(probe(gif).streams[0].codec_name, 'gif');
  const wav = join(root, 'audio.wav');
  run(['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '0.1', '-c:a', 'pcm_s16le', wav]);
  assert.equal(probe(wav).streams[0].sample_rate, '48000');
  console.log(`[studio] FFmpeg ${runtime.version} smoke passed: H.264/AAC MP4, animated GIF, PCM WAV, and FFprobe metadata`);
} finally { rmSync(root, { recursive: true, force: true }); }
