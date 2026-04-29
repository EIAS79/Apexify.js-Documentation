/**
 * Spin-wheel demos (from repo `index.ts` GIF + `spin-wheel-video.ts` MP4), adapted for the gallery sandbox:
 * no `fs`/`path`/`import` — uses injected helpers (`galleryTmpPath`, `readGalleryTemp`, `randomInt`, …).
 * Smaller canvas + fewer frames so Run finishes in reasonable time (still requires FFmpeg on the server).
 */

/** Shared logic lives in these strings; JS duplicates TS (esbuild transpiles TS for Run TypeScript tab). */
const SPIN_WHEEL_GIF_TS = `const painter = new ApexPainter();

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

return await main();
`;

const SPIN_WHEEL_VIDEO_TS = `const painter = new ApexPainter();

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

  const mp4Path = galleryTmpPath('mp4');

  await painter.createVideo({
    source: galleryPackageJsonPath(),
    createFromFrames: {
      frames,
      outputPath: mp4Path,
      fps: VIDEO_FPS,
      format: 'mp4',
      quality: 'medium',
      resolution: { width: W, height: H },
    },
  });

  return readGalleryTemp(mp4Path);
}

return await main();
`;

const svgThumb = (label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#312e81"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="42%" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="22" text-anchor="middle">Spin wheel</text><text x="50%" y="58%" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="15" text-anchor="middle">${label}</text></svg>`
  )}`;

export type SpinWheelGalleryCard = {
  id: string;
  title: string;
  category: 'gifs' | 'videos';
  description: string;
  thumbnail: string;
  featured?: boolean;
  code: { ts: string; js: string };
};

export const spinWheelGalleryItems: SpinWheelGalleryCard[] = [
  {
    id: 'spin-wheel-gif',
    title: 'Spin wheel — animated GIF',
    category: 'gifs',
    description:
      'Same flow as `index.ts`: frames from ApexPainter, assembled with `createGIF` (`outputFormat: \'buffer\'`). Requires FFmpeg for palette steps used internally; Run returns a GIF blob shown in Output.',
    thumbnail: svgThumb('GIF preview • Run for animated output'),
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
      'Same flow as `spin-wheel-video.ts`: PNG frames → `createVideo` + `createFromFrames` (FFmpeg). Temp MP4 is read via sandbox helpers and returned as `video/mp4`. **Requires `ffmpeg` on the server PATH.** Vercel and many serverless hosts do not include FFmpeg — use local/VPS/Docker, or skip MP4 on those platforms.',
    thumbnail: svgThumb('MP4 • Run plays in Output'),
    featured: true,
    code: {
      ts: SPIN_WHEEL_VIDEO_TS,
      js: SPIN_WHEEL_VIDEO_TS,
    },
  },
];
