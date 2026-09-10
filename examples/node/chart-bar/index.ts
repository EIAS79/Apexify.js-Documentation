import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApexPainter } from 'apexify.js';

const outputDir = process.env.APEXIFY_EXAMPLE_OUTPUT_DIR;
if (!outputDir) throw new Error('APEXIFY_EXAMPLE_OUTPUT_DIR is required.');

const painter = new ApexPainter({ type: 'buffer' });
const data = [
  { label: 'Docs', value: 72, xStart: 0, xEnd: 1, color: '#6366f1' },
  { label: 'API', value: 58, xStart: 1, xEnd: 2, color: '#8b5cf6' },
  { label: 'Gallery', value: 50, xStart: 2, xEnd: 3, color: '#ec4899' },
];
const png = await painter.createChart('bar', data, { dimensions: { width: 480, height: 320 } });
if (!Buffer.isBuffer(png)) throw new Error('Expected createChart() to return a PNG Buffer.');

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'chart-bar.png'), png);
console.log(JSON.stringify({ example: 'node.chart.bar', format: 'png', width: 480, height: 320, bytes: png.length }));
