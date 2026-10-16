/**
 * Prism type — a complete Apexify.js canvas recipe.
 * Node.js 22+; run the setup command shown in the gallery, then:
 *   node prism-type.mjs
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
export const settings = { title: 'FORM', subtitle: 'FOLLOWS YOU.', accent: '#d8ff55' };

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

  // Repeated geometric panels build an architectural editorial composition.
  for (let i = 0; i < 11; i++) {
    const x = 590 + i * 43;
    const top = 100 + Math.sin(i * .65) * 80;
    layers.push(path([[x, top], [x + 150, top + 100], [x + 150, 550], [x, 450], [x, top]],
      i % 3 === 0 ? config.accent : i % 2 === 0 ? '#b99bdf' : '#353736', 1, true));
    layers.push(path([[x, top], [x + 150, top + 100], [x + 150, 550]], '#eeeee5', 1));
  }
  layers.push(text('05 / EDITORIAL SYSTEM', 48, 43, 13, '#b8bbaa'));
  layers.push(text(config.title, 42, 214, 116, '#f1f2e9', true));
  layers.push(text(config.subtitle, 50, 370, 33, config.accent, true));
  layers.push(text('Shapes. Rhythm. A different perspective.', 50, 550, 18, '#bfc3b5'));
  layers.push(...footer('TYPOGRAPHY / GEOMETRY'));

  // 3. Render every layer onto the canvas and return actual PNG bytes.
  return painter.renderScene({ width: WIDTH, height: HEIGHT, layers });
}

// 4. Save the output. Importing render() elsewhere does not write files.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = new URL('./prism-type.png', import.meta.url);
  await writeFile(output, await render());
  console.log('Saved ' + fileURLToPath(output));
}
