/**
 * Extra motion demos — `createGIF` streaming (`onStart`) and `createVideo` + `createFromFrames`.
 * Runnable snippets executed via `galleryAssetRunner.ts` from `npm run gallery:build`; previews under `public/gallery-outputs/{gifs,videos}/`.
 */
import type { SpinWheelGalleryCard } from './spinWheelSnippets';

export const CONIC_DRIFT_GIF_TS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';
import path from 'path';

const painter = new ApexPainter();

const W = 480;
const H = 480;
const FRAMES = 22;

async function main() {
  const gifBytes = await painter.createGIF(undefined, {
    outputFormat: 'buffer',
    width: W,
    height: H,
    frameCount: FRAMES,
    repeat: 0,
    quality: 11,
    delay: 42,
    onStart: async () => {
      const out = [];
      for (let i = 0; i < FRAMES; i++) {
        const t = i / FRAMES;
        const spin = t * Math.PI * 2;
        const { buffer } = await painter.createCanvas({
          width: W,
          height: H,
          gradientBg: {
            type: 'linear',
            startX: 0,
            startY: 0,
            endX: W,
            endY: H,
            colors: [
              { stop: 0, color: '#020617' },
              { stop: 1, color: '#172554' },
            ],
          },
          bgLayers: [
            {
              type: 'gradient',
              blendMode: 'screen',
              opacity: 0.72,
              value: {
                type: 'conic',
                centerX: W * 0.52,
                centerY: H * 0.48,
                startAngle: spin * (180 / Math.PI),
                colors: [
                  { stop: 0, color: 'rgba(125, 211, 252, 0.55)' },
                  { stop: 0.25, color: 'rgba(167, 139, 250, 0.45)' },
                  { stop: 0.55, color: 'rgba(251, 113, 133, 0.42)' },
                  { stop: 1, color: 'rgba(125, 211, 252, 0.55)' },
                ],
              },
            },
            {
              type: 'gradient',
              blendMode: 'overlay',
              opacity: 0.4,
              value: {
                type: 'radial',
                colors: [
                  { stop: 0, color: 'rgba(253, 224, 71, 0.22)' },
                  { stop: 1, color: 'transparent' },
                ],
                startX: W * 0.35 + Math.cos(spin) * 40,
                startY: H * 0.32 + Math.sin(spin) * 36,
                startRadius: 0,
                endX: W * 0.35,
                endY: H * 0.32,
                endRadius: 240,
              },
            },
          ],
          noiseBg: { intensity: 0.055 },
        });
        out.push({ buffer, duration: 46 });
      }
      return out;
    },
  });

  return gifBytes;
}

(async () => {
  const result = await main();
  const out = path.join(process.cwd(), 'public', 'gallery-outputs', 'gifs', 'conic-drift.gif');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = Buffer.isBuffer(result) ? result : Buffer.from(result);
  fs.writeFileSync(out, buf);
})().catch(console.error);
`;

export const PULSE_BLOOM_MP4_TS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';
import path from 'path';

const painter = new ApexPainter();

const W = 480;
const H = 480;
const N = 20;
const FPS = 22;

async function main() {
  const frames = [];

  for (let i = 0; i < N; i++) {
    const phase = (i / N) * Math.PI * 2;
    const pulse = 0.62 + 0.38 * Math.sin(phase);
    const r = Math.min(W, H) * 0.42 * pulse;

    const { buffer } = await painter.createCanvas({
      width: W,
      height: H,
      gradientBg: {
        type: 'radial',
        colors: [
          { stop: 0, color: '#fefce8' },
          { stop: 0.35, color: '#fde047' },
          { stop: 0.65, color: '#ea580c' },
          { stop: 1, color: '#431407' },
        ],
        startX: W / 2,
        startY: H / 2,
        startRadius: 0,
        endX: W / 2,
        endY: H / 2,
        endRadius: r,
      },
      bgLayers: [
        {
          type: 'noise',
          intensity: 0.06 + 0.02 * Math.sin(phase * 2),
          blendMode: 'overlay',
        },
      ],
      patternBg: {
        type: 'dots',
        color: 'rgba(255, 255, 255, 0.06)',
        secondaryColor: 'rgba(127, 29, 29, 0.35)',
        size: 3,
        spacing: 16,
        rotation: (i * 6) % 360,
        blendMode: 'soft-light',
        opacity: 0.45,
      },
    });

    frames.push(buffer);
  }

  const mp4Path = path.join(process.cwd(), 'public', 'gallery-outputs', 'videos', 'pulse-bloom.mp4');
  fs.mkdirSync(path.dirname(mp4Path), { recursive: true });

  await painter.createVideo({
    source: path.join(process.cwd(), 'package.json'),
    createFromFrames: {
      frames,
      outputPath: mp4Path,
      fps: FPS,
      format: 'mp4',
      quality: 'medium',
      resolution: { width: W, height: H },
    },
  });
}

(async () => {
  await main();
})().catch(console.error);
`;

export const extraMotionGalleryItems: SpinWheelGalleryCard[] = [
  {
    id: 'motion-conic-drift-gif',
    title: 'Conic drift — streaming GIF encoder',
    category: 'gifs',
    description:
      '**Streaming GIF pipeline.** **`createGIF`** uses **`onStart`** to yield **`{ buffer, duration }[]`** frames—no scratch PNG directory—while the scene animates **`gradientBg`** and rotating conic **`bgLayers`**.\n\n**Takeaway:** Encoder-friendly loops for docs and landing spots that need motion without shipping video.',
    thumbnail: '/gallery-outputs/gifs/conic-drift.gif',
    thumbnailMedia: 'gif',
    featured: true,
    code: {
      ts: CONIC_DRIFT_GIF_TS,
      js: CONIC_DRIFT_GIF_TS,
    },
  },
  {
    id: 'motion-pulse-bloom-mp4',
    title: 'Pulse bloom — PNG frames → MP4',
    category: 'videos',
    description:
      '**Video via raw frame buffers.** **`createVideo`** plus **`createFromFrames`** feeds FFmpeg the same way as the spin MP4 demo, animating radial **`endRadius`** and a rotating **`patternBg`**.\n\n**Takeaway:** Requires **FFmpeg** wherever you run `npm run gallery:build`; ideal when you need smoother playback than GIF allows.',
    thumbnail: '/gallery-outputs/videos/pulse-bloom.mp4',
    thumbnailMedia: 'video',
    featured: true,
    code: {
      ts: PULSE_BLOOM_MP4_TS,
      js: PULSE_BLOOM_MP4_TS,
    },
  },
];
