/**
 * Data pulse — a complete Apexify.js canvas recipe.
 * Node.js 22+; run the setup command shown in the gallery, then:
 *   node data-pulse.mjs
 * The PNG is written beside this file. No external images or services.
 * Fonts are resolved from the installed dejavu-fonts-ttf package.
 */
import { ApexPainter } from 'apexify.js';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const painter = new ApexPainter({ type: 'buffer' });
const WIDTH = 1200;
const HEIGHT = 675;

// 1. Personalize these values. Everything below is rendered from them.
export const settings = { title: 'A year in motion.', values: [42, 58, 51, 76, 83, 96], labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'], accent: '#d8ff55' };

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

  // These are illustrative sample values, not live product metrics.
  const maximum = Math.max(...config.values, 1);
  layers.push(text('04 / REPORT TEMPLATE · SAMPLE DATA', 48, 43, 13, '#b8bbaa'));
  layers.push(text(config.title, 45, 92, 60, '#eff0e9', true));
  layers.push(text('Give your numbers a point of view.', 48, 176, 19, '#a8ad9e'));
  for (let line = 0; line < 4; line++) {
    const y = 280 + line * 85;
    layers.push(path([[70, y], [1130, y]], '#30352b'));
  }
  config.values.forEach((value, index) => {
    const x = 100 + index * 175;
    const h = value / maximum * 265;
    const color = index === config.values.length - 1 ? config.accent : '#b49bd6';
    layers.push(rect(x, 535 - h, 100, h, color));
    layers.push(path([[x + 100, 535 - h], [x + 120, 520 - h], [x + 120, 520], [x + 100, 535]], '#5e4e74', 1, true));
    layers.push(path([[x, 535 - h], [x + 20, 520 - h], [x + 120, 520 - h], [x + 100, 535 - h]], '#e9ddff', 1, true));
    layers.push(text(String(value), x, 490 - h, 22, '#f1f2e9', true));
    layers.push(text(config.labels[index] ?? String(index + 1), x, 565, 13, '#a8ad9e'));
  });
  layers.push(...footer('REPORTS / SAMPLE VALUES'));

  // 3. Render every layer onto the canvas and return actual PNG bytes.
  return painter.renderScene({ width: WIDTH, height: HEIGHT, layers });
}

// 4. Save the output. Importing render() elsewhere does not write files.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = new URL('./data-pulse.png', import.meta.url);
  await writeFile(output, await render());
  console.log('Saved ' + fileURLToPath(output));
}
