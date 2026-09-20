import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.resolve(root, process.env.PEAK_LAB_SOURCE ?? 'scripts/gallery/Apexify-Peak-Lab.ts');
const inputDir = path.resolve(root, process.env.PEAK_LAB_OUTPUT ?? '.peak-engine/apexify-peak-output/output');
const publicDir = path.resolve(root, 'public/gallery/peak-lab');
const generatedPath = path.resolve(root, 'lib/gallery/generatedPeakLabCatalog.ts');

const OUTPUTS = {
  '01': ['01-canvas.png'],
  '02': ['02-image.png'],
  '03': ['03-text.png'],
  '04': ['04-paths.png'],
  '05': ['05-pixels.png', '05-field-source.png'],
  '06': ['06-shapes-and-hit-testing.png'],
  '07': ['07-filters.png'],
  '08': ['08-masks-and-warp.png'],
  '09': ['09-image-utilities.png', '09-alpha-cutout.png', '09-color-key-cutout.png', '09-stitch.png', '09-collage-grid.png', '09-collage-masonry.png', '09-collage-carousel.png'],
  '10': ['10-line-chart.png'],
  '11': ['11-bar-charts.png', '11-standard.png', '11-grouped.png', '11-stacked.png', '11-waterfall.png', '11-lollipop.png', '11-horizontal.png'],
  '12': ['12-circular-charts.png', '12-donut.png', '12-pie.png', '12-radar.png', '12-polar.png'],
  '13': ['13-comparison.png', '13-scatter.png', '13-combo.png'],
  '14': ['14-scenes.png', '14-scene-thumbnail.png'],
  '15': ['15-components.png'],
  '16': ['16-templates.png', '16-edition-1.png', '16-edition-2.png', '16-edition-3.png', '16-edition-4.png'],
  '17': ['17-assets-and-plugins.png'],
  '18': ['18-batch-and-chain.png', '18-identity-1.png', '18-identity-2.png', '18-identity-3.png', '18-identity-4.png', '18-identity-5.png', '18-identity-6.png'],
  '19': ['19-output.png'],
  '20': ['20-runtime.png'],
  '21': ['21-audio.png', '21-audio-presets.png'],
  '22': ['22-streaming-gif.gif', '22-gif-poster.png'],
  '23': ['23-animate.gif', '23-animate-poster.png'],
  '24': ['24-film.mp4', '24-scene.gif', '24-film-poster.png', '24-frame-49.png', '24-frame-at-1s.png', '24-frame-at-3s.png', '24-frame-at-5s.png'],
  '25': ['25-video-workbench.png', '25-thumbnail-sheet.png'],
  '26': ['26-capstone.png'],
};

const LENSES = {
  '01': ['composition','surface'], '02': ['image','composition'], '03': ['typography','composition'],
  '04': ['composition','advanced'], '05': ['image','advanced'], '06': ['image','advanced'],
  '07': ['image'], '08': ['image','advanced'], '09': ['image','composition'],
  '10': ['data'], '11': ['data'], '12': ['data'], '13': ['data'],
  '14': ['composition','advanced'], '15': ['composition'], '16': ['composition','advanced'],
  '17': ['advanced'], '18': ['composition','advanced'], '19': ['advanced'],
  '20': ['advanced'], '21': ['motion','advanced'], '22': ['motion'], '23': ['motion'],
  '24': ['motion','composition'], '25': ['motion','advanced'], '26': ['composition','data','advanced'],
};

const PRIMARY = {
  '01':'surface','02':'image','03':'typography','04':'advanced','05':'image','06':'advanced',
  '07':'image','08':'image','09':'image','10':'data','11':'data','12':'data','13':'data',
  '14':'composition','15':'composition','16':'composition','17':'advanced','18':'composition',
  '19':'advanced','20':'advanced','21':'motion','22':'motion','23':'motion','24':'motion',
  '25':'motion','26':'composition',
};

function mediaKind(file) {
  if (/\.mp4$/i.test(file)) return 'video';
  if (/\.gif$/i.test(file)) return 'gif';
  return 'image';
}

function titleFor(file) {
  return file
    .replace(/^\d{2}-/, '')
    .replace(/\.(png|gif|mp4|webp|jpg|jpeg)$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function chunkCode(code, maxLines = 58) {
  const lines = code.trim().split(/\r?\n/);
  const chunks = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join('\n'));
  }
  return chunks;
}

function extractMeta(block) {
  const match = block.match(/const meta:\s*any=\{id:'([^']+)',title:'([^']+)',category:'([^']+)',description:'([^']+)'\};/);
  if (!match) throw new Error('Peak Lab recipe metadata could not be parsed');
  return { id: match[1], title: match[2], category: match[3], description: match[4] };
}

function cleanDisplayTypeScript(code) {
  return code
    .replace(/:\s*any\[\]/g, '')
    .replace(/:\s*Promise<any>\b/g, '')
    .replace(/:\s*any\b/g, '')
    .replace(/\s+as\s+any\b/g, '')
    .replace(/\bC\./g, 'COLORS.')
    .replace(/\bp\./g, 'painter.')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractRecipeRunBody(block, id) {
  const match = block.match(/async function run\(\): Promise<any> \{([\s\S]*?)\n\}\n\nreturn \{meta,run\};/);
  if (!match) throw new Error(`Recipe ${id} run() body could not be parsed`);
  return cleanDisplayTypeScript(match[1]);
}

function splitSharedHelpers(sharedCode) {
  const markers = [
    ['charts', '// ===== SHARED: charts ====='],
    ['wav', '// ===== SHARED: wav ====='],
    ['motion', '// ===== SHARED: motion ====='],
  ];
  const positions = markers.map(([name, marker]) => ({ name, marker, at: sharedCode.indexOf(marker) }));
  if (positions.some((entry) => entry.at < 0)) throw new Error('Peak Lab helper section markers are incomplete');

  const coreEnd = positions[0].at;
  const chartsEnd = positions[1].at;
  const wavEnd = positions[2].at;

  let core = sharedCode.slice(0, coreEnd);
  core = core
    .replace(/^import[^\n]+\n/gm, '')
    .replace(/^export interface RecipeMeta[^\n]*\n/gm, '')
    .replace(/^export interface Recipe[^\n]*\n/gm, '')
    .replace(/const coverage:[\s\S]*?const p:[^\n]*\n/, '')
    .replace(/const C:\s*any\s*=\s*Object\.freeze/, 'const COLORS = Object.freeze')
    // The published Studio source must not depend on Peak Lab's CI-only
    // output/assets tree or on an env key intentionally hidden by the sandbox.
    .replace(
      /const ROOT:[^\n]*\nconst OUT:[^\n]*\nconst ASSETS:[^\n]*\n/,
      "const OUT = path.resolve('apexify-studio-output');\n",
    )
    .replace(
      /const fontFile:[^\n]*\nconst font:[^\n]*\n/,
      "const font = (size=24) => ({ size, family: 'DejaVu Sans' });\n",
    )
    // Return the real generated path so Studio can collect and preview it.
    .replace(
      /async function save\(name:[^\n]*\n?/,
      "async function save(name, buffer) { await mkdir(OUT,{recursive:true}); const file=path.join(OUT,name); await writeFile(file,buffer); return file; }\n",
    );

  return {
    core: cleanDisplayTypeScript(core),
    charts: cleanDisplayTypeScript(sharedCode.slice(positions[0].at + positions[0].marker.length, chartsEnd)),
    wav: cleanDisplayTypeScript(sharedCode.slice(positions[1].at + positions[1].marker.length, wavEnd)),
    motion: cleanDisplayTypeScript(sharedCode.slice(positions[2].at + positions[2].marker.length)),
  };
}

function makeRecipeDisplaySource(block, id) {
  const body = extractRecipeRunBody(block, id);
  return `import * as ApexRuntime from 'apexify.js';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const Apex = ApexRuntime;
const ApexPainter = ApexRuntime.ApexPainter;
const ApexifyDecodeError = ApexRuntime.ApexifyDecodeError;
const painter = new ApexPainter({ type: 'buffer' });

// This is the actual Peak Lab recipe.
// Supporting drawing/chart/audio helpers used by this recipe are on the next code pages.
async function main() {
${body.split('\n').map((line) => `  ${line}`).join('\n')}
}`;
}

function pagesForSection(label, code, maxLines = 58) {
  const chunks = chunkCode(code, maxLines);
  return chunks.map((chunk, index) => ({
    label: chunks.length === 1 ? label : `${label} · ${index + 1}/${chunks.length}`,
    language: 'ts',
    code: chunk,
  }));
}

function helperPagesForRecipe(body, helperSections) {
  const pages = [...pagesForSection('Helpers · Core', helperSections.core)];
  if (/\b(chartOptions|series)\b/.test(body)) pages.push(...pagesForSection('Helpers · Charts', helperSections.charts));
  if (/\b(parseWav|waveform)\b/.test(body)) pages.push(...pagesForSection('Helpers · Audio', helperSections.wav));
  if (/\b(motionScene|renderMotion)\b/.test(body)) pages.push(...pagesForSection('Helpers · Motion', helperSections.motion));
  return pages;
}

await fs.rm(publicDir, { recursive: true, force: true });
await fs.mkdir(publicDir, { recursive: true });

const source = await fs.readFile(sourcePath, 'utf8');
const sharedMatch = source.match(/import \* as ApexRuntime[\s\S]*?(?=\/\/ ===== EXAMPLE 01-canvas =====)/);
if (!sharedMatch) throw new Error('Peak Lab shared setup block not found');
const sharedCode = sharedMatch[0].trim();
const helperSections = splitSharedHelpers(sharedCode);

// Recipe 25 records per-operation failures so its report remains visible.
// Gallery publishing is stricter: never publish a source-backed run with
// hidden failed sub-operations.
try {
  const videoReport = JSON.parse(await fs.readFile(path.join(inputDir, '25-video-operations.json'), 'utf8'));
  const failedVideoOps = Array.isArray(videoReport)
    ? videoReport.filter((entry) => entry?.status === 'failed')
    : [];
  if (failedVideoOps.length > 0) {
    throw new Error(`Recipe 25 has failed operations: ${failedVideoOps.map((entry) => entry.operation).join(', ')}`);
  }
} catch (error) {
  if (error?.code === 'ENOENT') {
    throw new Error('Recipe 25 verification report is missing; refusing to publish an unverified gallery run.');
  }
  throw error;
}

const items = [];
for (let n = 1; n <= 26; n++) {
  const id = String(n).padStart(2, '0');
  const marker = new RegExp(`// ===== EXAMPLE ${id}-[^\\n]+ =====`);
  const markerMatch = marker.exec(source);
  if (!markerMatch) throw new Error(`Recipe ${id} marker not found`);
  const start = markerMatch.index;
  const tail = source.slice(start + markerMatch[0].length);
  const next = tail.search(/\/\/ ===== (?:EXAMPLE|OPT-IN)/);
  const end = next >= 0 ? start + markerMatch[0].length + next : source.length;
  const block = source.slice(start, end).trim();
  const meta = extractMeta(block);
  const files = OUTPUTS[id] ?? [];
  const copied = [];

  for (const file of files) {
    const from = path.join(inputDir, file);
    try {
      await fs.access(from);
    } catch {
      continue;
    }
    const dest = path.join(publicDir, file);
    await fs.copyFile(from, dest);
    copied.push(file);
  }

  if (copied.length === 0) {
    throw new Error(`Recipe ${id} produced none of its curated gallery outputs`);
  }

  const recipeSource = makeRecipeDisplaySource(block, id);
  const recipeBody = extractRecipeRunBody(block, id);
  const recipePages = pagesForSection(`Recipe ${id}`, recipeSource);
  const supportPages = helperPagesForRecipe(recipeBody, helperSections);
  const runPage = {
    label: 'Run',
    language: 'ts',
    code: 'return await main();',
  };

  items.push({
    id: `peak-${id}`,
    category: 'advance',
    recipeId: id,
    title: meta.title,
    description: `${meta.description} Generated by Apexify Peak Lab recipe ${id}. The code viewer opens on the readable recipe first; only the supporting helpers required by the recipe follow on later pages.`,
    thumbnail: `/gallery/peak-lab/${copied[0]}`,
    thumbnailMedia: mediaKind(copied[0]),
    outputs: copied.map((file) => ({
      src: `/gallery/peak-lab/${file}`,
      label: titleFor(file),
      media: mediaKind(file),
    })),
    lenses: LENSES[id] ?? ['advanced'],
    primaryLens: PRIMARY[id] ?? 'advanced',
    executionMode: 'studio',
    sourceKind: 'peak-lab',
    sourceHref: 'https://github.com/EIAS79/Apexify.js-Documentation/blob/main/scripts/gallery/Apexify-Peak-Lab.ts',
    codePages: [...recipePages, ...supportPages, runPage],
  });
}

const ts = `/* AUTO-GENERATED by scripts/gallery/publish-peak-lab.mjs. Do not edit by hand. */
import type { CuratedGalleryCard } from '@/app/gallery/components/galleryHelpers';

export const peakLabSharedSetup = ${JSON.stringify(sharedCode)};

export const peakLabGalleryItems: CuratedGalleryCard[] = ${JSON.stringify(items, null, 2)};
`;
await fs.mkdir(path.dirname(generatedPath), { recursive: true });
await fs.writeFile(generatedPath, ts);
console.log(`Published ${items.length} Peak Lab gallery recipes to ${path.relative(root, publicDir)}`);
