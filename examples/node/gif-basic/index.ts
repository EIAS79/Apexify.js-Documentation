import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApexPainter } from 'apexify.js';

const outputDir = process.env.APEXIFY_EXAMPLE_OUTPUT_DIR;
if (!outputDir) throw new Error('APEXIFY_EXAMPLE_OUTPUT_DIR is required.');

const painter = new ApexPainter({ type: 'buffer' });
const first = await painter.createCanvas({ width: 96, height: 64, colorBg: '#312e81' });
const second = await painter.createCanvas({ width: 96, height: 64, colorBg: '#be185d' });
const gif = await painter.createGIF(
  [
    { buffer: first.buffer, duration: 120 },
    { buffer: second.buffer, duration: 120 },
  ],
  { outputFormat: 'buffer', width: 96, height: 64, repeat: -1, quality: 20, skipResizeWhenDimensionsMatch: true },
);
if (!Buffer.isBuffer(gif)) throw new Error('Expected createGIF({ outputFormat: buffer }) to return a GIF Buffer.');

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'animation.gif'), gif);
await writeFile(join(outputDir, 'poster.png'), first.buffer);
console.log(JSON.stringify({ example: 'node.gif.basic', format: 'gif', width: 96, height: 64, bytes: gif.length, frames: 2 }));
