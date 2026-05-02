/**
 * Spin-wheel demos — static source shown in the gallery. Run locally with Node + FFmpeg (MP4) / Apexify GIF encoder.
 * Output paths match `public/gallery-outputs/{gifs,videos}/`.
 */

import type { GalleryCardBase } from '../core/galleryTypes';

export const SPIN_WHEEL_GIF_TS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';
import path from 'path';
import { randomInt } from 'crypto';

const painter = new ApexPainter();

const W = 420;
const H = 420;
const NAMES = ['Ada', 'Bell', 'Edsger', 'Grace', 'Ken', 'Linus'];
const SLICE_COLORS = [
  '#e11d48',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#6366f1',
  '#a855f7',
  '#db2777',
  '#0d9488',
  '#2563eb',
];

const SPIN_FRAMES = 14;
const HOLD_FRAMES = 6;
const TOTAL_FRAMES = SPIN_FRAMES + HOLD_FRAMES;
const FULL_SPINS = 5;
const POINTER_ANGLE_RAD = 0;

let backdropCache = undefined;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function modAngle(rad) {
  const twoPi = Math.PI * 2;
  return ((rad % twoPi) + twoPi) % twoPi;
}

function wheelBackground() {
  return {
    width: W,
    height: H,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: W,
      endY: H,
      colors: [
        { stop: 0, color: '#0f172a' },
        { stop: 0.45, color: '#312e81' },
        { stop: 1, color: '#164e63' },
      ],
    },
    borderRadius: 0,
  };
}

async function getBackdropBuffer() {
  if (!backdropCache) {
    const { buffer } = await painter.createCanvas(wheelBackground());
    backdropCache = buffer;
  }
  return backdropCache;
}

function buildWheelSlices(names) {
  const n = names.length;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const R = Math.min(W, H) * 0.34;
  const slice = (Math.PI * 2) / n;
  const box = R * 2;

  const slices = [];

  for (let i = 0; i < n; i++) {
    const startAngle = -Math.PI / 2 + i * slice;
    const endAngle = -Math.PI / 2 + (i + 1) * slice;
    slices.push({
      source: 'pieSlice',
      x: cx - R,
      y: cy - R,
      width: box,
      height: box,
      shape: {
        fill: true,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
        centerX: cx,
        centerY: cy,
        radius: R,
        startAngle,
        endAngle,
      },
    });
  }

  slices.push({
    source: 'circle',
    x: cx - R,
    y: cy - R,
    width: box,
    height: box,
    shape: {
      fill: false,
      color: 'transparent',
      radius: R,
    },
    stroke: {
      width: 3,
      color: 'rgba(255, 255, 255, 0.92)',
      opacity: 1,
      borderRadius: 'circular',
    },
  });

  const hubR = 28;
  slices.push({
    source: 'circle',
    x: cx - hubR,
    y: cy - hubR,
    width: hubR * 2,
    height: hubR * 2,
    shape: {
      fill: true,
      color: '#fefce8',
      radius: hubR,
    },
    stroke: {
      width: 4,
      color: '#1e293b',
      opacity: 1,
      borderRadius: 'circular',
    },
  });

  return slices;
}

function segmentLabelTexts(names, thetaRad) {
  const n = names.length;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const slice = (Math.PI * 2) / n;
  const textRadius = Math.min(W, H) * 0.28;
  const fontSize = Math.max(12, Math.min(22, Math.floor(180 / n)));

  const texts = [];

  for (let i = 0; i < n; i++) {
    const mid = -Math.PI / 2 + (i + 0.5) * slice + thetaRad;
    const tx = cx + Math.cos(mid) * textRadius;
    const ty = cy + Math.sin(mid) * textRadius;
    const rotationDeg = (mid * 180) / Math.PI + 90;

    texts.push({
      text: names[i],
      x: tx,
      y: ty,
      font: { family: 'Arial', size: fontSize },
      bold: true,
      color: '#fefce8',
      textAlign: 'center',
      textBaseline: 'middle',
      rotation: rotationDeg,
      stroke: { color: '#0f172a', width: 2, opacity: 0.95 },
      shadow: {
        color: 'rgba(0,0,0,0.55)',
        offsetX: 2,
        offsetY: 3,
        blur: 6,
        opacity: 0.85,
      },
    });
  }

  return texts;
}

function winnerBanner(winnerName) {
  return {
    text: 'Winner: ' + winnerName + '!',
    x: W / 2,
    y: H - 52,
    font: { family: 'Arial', size: 28 },
    bold: true,
    color: '#fde047',
    textAlign: 'center',
    textBaseline: 'middle',
    stroke: { color: '#1e1b4b', width: 4, opacity: 1 },
    shadow: {
      color: 'rgba(0,0,0,0.65)',
      offsetX: 0,
      offsetY: 6,
      blur: 14,
      opacity: 1,
    },
  };
}

function pointerTriangle() {
  const cx = W / 2;
  const cy = H / 2 + 8;
  const R = Math.min(W, H) * 0.34;
  const tw = 32;
  const th = 42;
  const rimInset = 14;

  const tipX = cx + R - rimInset;
  const tipY = cy;
  const x = tipX - tw / 2 + th / 2;
  const y = tipY - th / 2;

  return {
    source: 'triangle',
    x,
    y,
    width: tw,
    height: th,
    rotation: -90,
    shape: {
      fill: true,
      color: '#fde047',
    },
    stroke: {
      width: 3,
      color: '#1e293b',
      opacity: 1,
    },
    shadow: {
      color: 'rgba(0,0,0,0.45)',
      offsetY: 8,
      blur: 12,
      opacity: 0.9,
      borderRadius: 'circular',
    },
  };
}

async function renderFrame(thetaRad, names, phase, winnerName) {
  const thetaDeg = (thetaRad * 180) / Math.PI;
  const cx = W / 2;
  const cy = H / 2 + 8;

  const bgBuf = await getBackdropBuffer();

  const wheelParts = buildWheelSlices(names);
  let buf = await painter.createImage(wheelParts, bgBuf, {
    isGrouped: true,
    groupTransform: {
      rotation: thetaDeg,
      pivotX: cx,
      pivotY: cy,
    },
  });

  buf = await painter.createText(segmentLabelTexts(names, thetaRad), buf);

  if (phase === 'hold') {
    buf = await painter.createText(winnerBanner(winnerName), buf);
  }

  buf = await painter.createImage(pointerTriangle(), buf);
  return buf;
}

async function main() {
  const names = NAMES.slice();
  const n = names.length;

  const winnerIdx = randomInt(0, n);
  const slice = (Math.PI * 2) / n;
  const pad = 0.07;
  const alongSlice = pad + (randomInt(0, 1000000) / 1000000) * (1 - 2 * pad);
  const alpha = -Math.PI / 2 + (winnerIdx + alongSlice) * slice;
  const stopAngle = FULL_SPINS * Math.PI * 2 + modAngle(POINTER_ANGLE_RAD - alpha);

  const gifBytes = await painter.createGIF(undefined, {
    outputFormat: 'buffer',
    width: W,
    height: H,
    frameCount: TOTAL_FRAMES,
    repeat: 0,
    quality: 10,
    delay: 30,
    onStart: async () => {
      await getBackdropBuffer();

      const frames = [];

      for (let i = 0; i < SPIN_FRAMES; i++) {
        const t = SPIN_FRAMES <= 1 ? 1 : i / (SPIN_FRAMES - 1);
        const theta = easeOutCubic(t) * stopAngle;
        const buffer = await renderFrame(theta, names, 'spin', names[winnerIdx]);
        frames.push({ buffer, duration: 38 });
      }

      const holdBuffer = await renderFrame(stopAngle, names, 'hold', names[winnerIdx]);
      for (let h = 0; h < HOLD_FRAMES; h++) {
        frames.push({ buffer: holdBuffer, duration: 110 });
      }

      return frames;
    },
  });

  return gifBytes;
}

(async () => {
  const result = await main();
  const out = path.join(process.cwd(), 'public', 'gallery-outputs', 'gifs', 'spin-wheel.gif');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = Buffer.isBuffer(result) ? result : Buffer.from(result as Uint8Array);
  fs.writeFileSync(out, buf);
})().catch(console.error);
`;

export const SPIN_WHEEL_VIDEO_TS = `import { ApexPainter } from 'apexify.js';
import fs from 'fs';
import path from 'path';
import { randomInt } from 'crypto';

const painter = new ApexPainter();

const W = 420;
const H = 420;
const NAMES = ['Ada', 'Bell', 'Edsger', 'Grace', 'Ken', 'Linus'];
const SLICE_COLORS = [
  '#e11d48',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#6366f1',
  '#a855f7',
  '#db2777',
  '#0d9488',
  '#2563eb',
];

const SPIN_FRAMES = 14;
const HOLD_FRAMES = 6;
const FULL_SPINS = 5;
const POINTER_ANGLE_RAD = 0;
const VIDEO_FPS = 24;

let backdropCache = undefined;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function modAngle(rad) {
  const twoPi = Math.PI * 2;
  return ((rad % twoPi) + twoPi) % twoPi;
}

function wheelBackground() {
  return {
    width: W,
    height: H,
    gradientBg: {
      type: 'linear',
      startX: 0,
      startY: 0,
      endX: W,
      endY: H,
      colors: [
        { stop: 0, color: '#0f172a' },
        { stop: 0.45, color: '#312e81' },
        { stop: 1, color: '#164e63' },
      ],
    },
    borderRadius: 0,
  };
}

async function getBackdropBuffer() {
  if (!backdropCache) {
    const { buffer } = await painter.createCanvas(wheelBackground());
    backdropCache = buffer;
  }
  return backdropCache;
}

function buildWheelSlices(names) {
  const n = names.length;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const R = Math.min(W, H) * 0.34;
  const slice = (Math.PI * 2) / n;
  const box = R * 2;

  const slices = [];

  for (let i = 0; i < n; i++) {
    const startAngle = -Math.PI / 2 + i * slice;
    const endAngle = -Math.PI / 2 + (i + 1) * slice;
    slices.push({
      source: 'pieSlice',
      x: cx - R,
      y: cy - R,
      width: box,
      height: box,
      shape: {
        fill: true,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
        centerX: cx,
        centerY: cy,
        radius: R,
        startAngle,
        endAngle,
      },
    });
  }

  slices.push({
    source: 'circle',
    x: cx - R,
    y: cy - R,
    width: box,
    height: box,
    shape: {
      fill: false,
      color: 'transparent',
      radius: R,
    },
    stroke: {
      width: 3,
      color: 'rgba(255, 255, 255, 0.92)',
      opacity: 1,
      borderRadius: 'circular',
    },
  });

  const hubR = 28;
  slices.push({
    source: 'circle',
    x: cx - hubR,
    y: cy - hubR,
    width: hubR * 2,
    height: hubR * 2,
    shape: {
      fill: true,
      color: '#fefce8',
      radius: hubR,
    },
    stroke: {
      width: 4,
      color: '#1e293b',
      opacity: 1,
      borderRadius: 'circular',
    },
  });

  return slices;
}

function segmentLabelTexts(names, thetaRad) {
  const n = names.length;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const slice = (Math.PI * 2) / n;
  const textRadius = Math.min(W, H) * 0.28;
  const fontSize = Math.max(12, Math.min(22, Math.floor(180 / n)));

  const texts = [];

  for (let i = 0; i < n; i++) {
    const mid = -Math.PI / 2 + (i + 0.5) * slice + thetaRad;
    const tx = cx + Math.cos(mid) * textRadius;
    const ty = cy + Math.sin(mid) * textRadius;
    const rotationDeg = (mid * 180) / Math.PI + 90;

    texts.push({
      text: names[i],
      x: tx,
      y: ty,
      font: { family: 'Arial', size: fontSize },
      bold: true,
      color: '#fefce8',
      textAlign: 'center',
      textBaseline: 'middle',
      rotation: rotationDeg,
      stroke: { color: '#0f172a', width: 2, opacity: 0.95 },
      shadow: {
        color: 'rgba(0,0,0,0.55)',
        offsetX: 2,
        offsetY: 3,
        blur: 6,
        opacity: 0.85,
      },
    });
  }

  return texts;
}

function winnerBanner(winnerName) {
  return {
    text: 'Winner: ' + winnerName + '!',
    x: W / 2,
    y: H - 52,
    font: { family: 'Arial', size: 28 },
    bold: true,
    color: '#fde047',
    textAlign: 'center',
    textBaseline: 'middle',
    stroke: { color: '#1e1b4b', width: 4, opacity: 1 },
    shadow: {
      color: 'rgba(0,0,0,0.65)',
      offsetX: 0,
      offsetY: 6,
      blur: 14,
      opacity: 1,
    },
  };
}

function pointerTriangle() {
  const cx = W / 2;
  const cy = H / 2 + 8;
  const R = Math.min(W, H) * 0.34;
  const tw = 32;
  const th = 42;
  const rimInset = 14;

  const tipX = cx + R - rimInset;
  const tipY = cy;
  const x = tipX - tw / 2 + th / 2;
  const y = tipY - th / 2;

  return {
    source: 'triangle',
    x,
    y,
    width: tw,
    height: th,
    rotation: -90,
    shape: {
      fill: true,
      color: '#fde047',
    },
    stroke: {
      width: 3,
      color: '#1e293b',
      opacity: 1,
    },
    shadow: {
      color: 'rgba(0,0,0,0.45)',
      offsetY: 8,
      blur: 12,
      opacity: 0.9,
      borderRadius: 'circular',
    },
  };
}

async function renderFrame(thetaRad, names, phase, winnerName) {
  const thetaDeg = (thetaRad * 180) / Math.PI;
  const cx = W / 2;
  const cy = H / 2 + 8;

  const bgBuf = await getBackdropBuffer();

  const wheelParts = buildWheelSlices(names);
  let buf = await painter.createImage(wheelParts, bgBuf, {
    isGrouped: true,
    groupTransform: {
      rotation: thetaDeg,
      pivotX: cx,
      pivotY: cy,
    },
  });

  buf = await painter.createText(segmentLabelTexts(names, thetaRad), buf);

  if (phase === 'hold') {
    buf = await painter.createText(winnerBanner(winnerName), buf);
  }

  buf = await painter.createImage(pointerTriangle(), buf);
  return buf;
}

async function main() {
  const names = NAMES.slice();
  const n = names.length;

  const winnerIdx = randomInt(0, n);
  const slice = (Math.PI * 2) / n;
  const pad = 0.07;
  const alongSlice = pad + (randomInt(0, 1000000) / 1000000) * (1 - 2 * pad);
  const alpha = -Math.PI / 2 + (winnerIdx + alongSlice) * slice;
  const stopAngle = FULL_SPINS * Math.PI * 2 + modAngle(POINTER_ANGLE_RAD - alpha);

  await getBackdropBuffer();

  const frames = [];

  for (let i = 0; i < SPIN_FRAMES; i++) {
    const t = SPIN_FRAMES <= 1 ? 1 : i / (SPIN_FRAMES - 1);
    const theta = easeOutCubic(t) * stopAngle;
    frames.push(await renderFrame(theta, names, 'spin', names[winnerIdx]));
  }

  const holdBuffer = await renderFrame(stopAngle, names, 'hold', names[winnerIdx]);
  for (let h = 0; h < HOLD_FRAMES; h++) {
    frames.push(holdBuffer);
  }

  const mp4Path = path.join(process.cwd(), 'public', 'gallery-outputs', 'videos', 'spin-wheel.mp4');
  fs.mkdirSync(path.dirname(mp4Path), { recursive: true });

  await painter.createVideo({
    source: path.join(process.cwd(), 'package.json'),
    createFromFrames: {
      frames,
      outputPath: mp4Path,
      fps: VIDEO_FPS,
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

export type SpinWheelGalleryCard = GalleryCardBase & {
  category: 'gifs' | 'videos';
  code: { ts: string; js: string };
};

export const spinWheelGalleryItems: SpinWheelGalleryCard[] = [
  {
    id: 'spin-wheel-gif',
    title: 'Spin wheel — animated GIF',
    category: 'gifs',
    description:
      '**GIF export from painted frames.** Builds each frame with ApexPainter (wheel slices + motion), then **`createGIF`** with **`outputFormat`** set to buffer-friendly output.\n\n**Takeaway:** Offline render writes to `public/gallery-outputs/gifs/spin-wheel.gif`; palette quantization may lean on FFmpeg internally depending on your environment.',
    thumbnail: '/gallery-outputs/gifs/spin-wheel.gif',
    thumbnailMedia: 'gif',
    featured: true,
    code: {
      ts: SPIN_WHEEL_GIF_TS,
      js: SPIN_WHEEL_GIF_TS,
    },
  },
  {
    id: 'spin-wheel-mp4',
    title: 'Spin wheel — MP4 video',
    category: 'videos',
    description:
      '**MP4 from sequential buffers.** Same spin artwork encoded with **`createVideo`** and **`createFromFrames`** so FFmpeg stitches timed frames without hand-exporting PNGs.\n\n**Takeaway:** Output lands at `public/gallery-outputs/videos/spin-wheel.mp4`; **`ffmpeg`** must be on `PATH` when you encode locally.',
    thumbnail: '/gallery-outputs/videos/spin-wheel.mp4',
    thumbnailMedia: 'video',
    featured: true,
    code: {
      ts: SPIN_WHEEL_VIDEO_TS,
      js: SPIN_WHEEL_VIDEO_TS,
    },
  },
];
