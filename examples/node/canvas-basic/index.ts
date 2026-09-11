import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApexPainter } from 'apexify.js';

const outputDir = process.env.APEXIFY_EXAMPLE_OUTPUT_DIR;
if (!outputDir) throw new Error('APEXIFY_EXAMPLE_OUTPUT_DIR is required.');

const painter = new ApexPainter({ type: 'buffer' });
const canvas = await painter.createCanvas({ width: 320, height: 180, colorBg: '#0f172a' });
if (!Buffer.isBuffer(canvas.buffer)) throw new Error('Expected createCanvas() to expose a PNG Buffer.');

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'canvas-basic.png'), canvas.buffer);
console.log(JSON.stringify({ example: 'node.canvas.basic', format: 'png', width: 320, height: 180, bytes: canvas.buffer.length }));
