/** Minimal Apexify snippet — runs on the server and returns a PNG buffer (same contract as gallery sandbox). */

export const STUDIO_STARTER_TS = `import { ApexPainter } from 'apexify.js';

async function main(): Promise<Buffer> {
  const painter = new ApexPainter();
  const canvas = await painter.createCanvas({
    width: 640,
    height: 360,
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#0f172a' },
        { stop: 1, color: '#4c1d95' },
      ],
      startX: 0,
      startY: 0,
      endX: 640,
      endY: 360,
    },
  });
  return canvas.buffer;
}
`;

export const STUDIO_STARTER_JS = `import { ApexPainter } from 'apexify.js';

async function main() {
  const painter = new ApexPainter();
  const canvas = await painter.createCanvas({
    width: 640,
    height: 360,
    gradientBg: {
      type: 'linear',
      colors: [
        { stop: 0, color: '#0f172a' },
        { stop: 1, color: '#4c1d95' },
      ],
      startX: 0,
      startY: 0,
      endX: 640,
      endY: 360,
    },
  });
  return canvas.buffer;
}
`;

export const STUDIO_STORAGE_KEY = 'apexify-studio-v1';
