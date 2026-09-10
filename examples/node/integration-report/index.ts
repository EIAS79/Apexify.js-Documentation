import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ApexPainter } from 'apexify.js';
import { reportEntries } from './report-data.js';

const outputDir = process.env.APEXIFY_EXAMPLE_OUTPUT_DIR;
if (!outputDir) throw new Error('APEXIFY_EXAMPLE_OUTPUT_DIR is required.');

const painter = new ApexPainter({ type: 'buffer' });
const chartData = reportEntries.map((entry, index) => ({
  label: entry.label,
  value: entry.value,
  xStart: index,
  xEnd: index + 1,
  color: entry.color,
}));
const png = await painter.createChart('bar', chartData, { dimensions: { width: 640, height: 360 } });
const highest = [...reportEntries].sort((a, b) => b.value - a.value)[0]?.label ?? '';
const summary = { total: reportEntries.reduce((sum, entry) => sum + entry.value, 0), highest, entries: reportEntries.length };

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'report.png'), png);
await writeFile(join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ example: 'node.integration.report', outputs: ['report.png', 'summary.json'], summary }));
