/**
 * Signal flow — a complete Apexify.js canvas recipe.
 * Node.js 22+; run the setup command shown in the gallery, then:
 *   node signal-flow.mjs
 * The PNG is written beside this file. No external images or services.
 * Fonts are resolved from the installed dejavu-fonts-ttf package.
 */
import { ApexPainter } from 'apexify.js';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import filePath from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const painter = new ApexPainter({ type: 'buffer' });
const WIDTH = 1200;
const HEIGHT = 675;

// 1. Personalize these values. Everything below is rendered from them.
export const settings = { title: 'SIGNAL', accent: '#d8ff55', line: '#b69ae8', density: 48 };

// Small helpers keep the composition readable. All drawing uses Apexify.
function text(value, x, y, size, color, bold = false) {
  return { type: 'text', texts: {
    text: value, x, y,
    font: { size, family: bold ? 'GalleryBold' : 'GalleryRegular',
      path: require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans' + (bold ? '-Bold' : '') + '.ttf') },
    fill: { color }, placement: { textBaseline: 'top' },
  } };
}
function path(points, color, width = 1, fill = false) {
  return { type: 'path',
    path: points.map(([x, y], i) => ({ type: i ? 'lineTo' : 'moveTo', x, y })),
    options: fill ? { fill: { color } } : { stroke: { color, width, lineCap: 'round' } },
  };
}
function circle(x, y, radius, colors) {
  return { type: 'image', images: { source: 'circle',
    x: x - radius, y: y - radius, width: radius * 2, height: radius * 2,
    shape: { gradient: { type: 'radial', startX: radius * .6, startY: radius * .4,
      endX: radius, endY: radius, endRadius: radius * 1.3,
      colors: colors.map((color, i) => ({ stop: i / (colors.length - 1), color })) } },
  } };
}
function rect(x, y, width, height, color) {
  return { type: 'image', images: { source: 'rectangle', x, y, width, height, shape: { color } } };
}
function footer(label) {
  return [path([[48, 620], [1152, 620]], '#34372f'),
    text('APEXIFY.JS  /  CANVAS COLLECTION', 48, 640, 11, '#93968b'),
    text(label, 880, 640, 11, '#93968b')];
}

// 2. Build layers in paint order: background, artwork, then typography.
// phase is a position in the loop (0–1); the default is the gallery poster.
export async function render(phase = 0, overrides = {}) {
  const config = { ...settings, ...overrides };
  const canvas = await painter.createCanvas({ width: WIDTH, height: HEIGHT, colorBg: '#10120f' });
  const layers = [{ type: 'imageBuffer', buffer: canvas.buffer, x: 0, y: 0 }];

  const turn = phase * Math.PI * 2;
  // Each line samples a sine wave. Change density for a different texture.
  for (let row = 0; row < config.density; row++) {
    const points = Array.from({ length: 181 }, (_, column) => {
      const x = column / 180 * 1200;
      const envelope = Math.sin(column / 180 * Math.PI);
      const y = 210 + row * 6 + Math.sin(x / 190 + row * .07 + turn) * 100 * envelope
        + Math.cos(x / 300 - row * .06 - turn) * 65;
      return [x, y];
    });
    layers.push(path(points, row % 9 === 0 ? config.accent : config.line, row % 9 === 0 ? 2 : .7));
  }
  layers.push(text('02 / GENERATIVE LINE SYSTEM', 48, 43, 13, '#b8bbaa'));
  layers.push(text(config.title, 42, 438, 109, '#eff0e9', true));
  layers.push(text('Frequency becomes form.', 780, 553, 19, config.accent));
  layers.push(...footer('PATHS / FRAME SEQUENCES'));

  // 3. Render every layer onto the canvas and return actual PNG bytes.
  return painter.renderScene({ width: WIDTH, height: HEIGHT, layers });
}

// 4. Save the output. Importing render() elsewhere does not write files.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = new URL('./signal-flow.png', import.meta.url);
  await writeFile(output, await render());
  console.log('Saved ' + fileURLToPath(output));

  // Optional: install FFmpeg, then run this file with --animate.
  // Render 48 real canvas frames at 12 fps to reproduce the gallery loop.
  if (process.argv.includes('--animate')) {
    const frames = await mkdtemp(filePath.join(tmpdir(), 'apexify-frames-'));
    try {
      for (let index = 0; index < 48; index++) {
        const frame = await render(index / 48);
        await writeFile(filePath.join(frames, `${String(index).padStart(3, '0')}.png`), frame);
      }
      const movie = fileURLToPath(new URL('./signal-flow.mp4', import.meta.url));
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12',
        '-i', filePath.join(frames, '%03d.png'), '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-movflags', '+faststart', movie]);
      console.log('Saved ' + movie);
    } finally { await rm(frames, { recursive: true, force: true }); }
  }
}
