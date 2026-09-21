import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const requireFromHere = createRequire(import.meta.url);
const requireFromPeakEngine = createRequire(path.join(root, '.peak-engine', 'package.json'));
let esbuild;
try {
  esbuild = requireFromHere('esbuild');
} catch {
  esbuild = requireFromPeakEngine('esbuild');
}
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
    .replace(/^const Apex:[^\n]*\n/gm, '')
    .replace(/^const ApexPainter:[^\n]*\n/gm, '')
    .replace(/^const ApexifyDecodeError:[^\n]*\n/gm, '')
    .replace(/const coverage:[\s\S]*?const p:[^\n]*\n/, "const makePainter = (options = undefined) => new ApexPainter(options);\n")
    .replace(/const C:\s*any\s*=\s*Object\.freeze/, 'const COLORS = Object.freeze')
    // The published Studio source must not depend on Peak Lab's CI-only
    // output/assets tree or on an env key intentionally hidden by the sandbox.
    .replace(
      /const ROOT:[^\n]*\nconst OUT:[^\n]*\nconst ASSETS:[^\n]*\n/,
      "const OUT = path.resolve('apexify-studio-output');\n",
    )
    .replace(
      /const fontFile:[^\n]*\nconst font:[^\n]*\n/,
      [
        "const FONT_FILES = { sans: 'DejaVuSans.ttf', bold: 'DejaVuSans-Bold.ttf', serif: 'DejaVuSerif.ttf', mono: 'DejaVuSansMono.ttf' };",
        "const fontFile = (style = 'sans') => path.join(process.cwd(), 'node_modules', 'dejavu-fonts-ttf', 'ttf', FONT_FILES[style]);",
        "const font = (size = 24, style = 'sans') => ({ size, path: fontFile(style), name: 'Peak-' + style, family: 'Peak-' + style });",
        "",
      ].join('\n'),
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


function stripLeadingComments(value) {
  let text = value.trimStart();
  while (true) {
    if (text.startsWith('//')) {
      const newline = text.indexOf('\n');
      text = newline >= 0 ? text.slice(newline + 1).trimStart() : '';
      continue;
    }
    if (text.startsWith('/*')) {
      const close = text.indexOf('*/');
      text = close >= 0 ? text.slice(close + 2).trimStart() : '';
      continue;
    }
    return text;
  }
}

function splitTopLevelDeclarations(source) {
  const declarations = [];
  let start = 0;
  let braces = 0;
  let parens = 0;
  let brackets = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  const push = (end) => {
    const code = source.slice(start, end).trim();
    if (code) declarations.push({ code, pos: start });
    start = end;
  };

  const beginsFunctionLike = () => {
    const head = stripLeadingComments(source.slice(start)).slice(0, 80);
    return /^(?:export\s+)?(?:(?:async\s+)?function|class)\b/.test(head);
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === '/' && next === '/') {
      lineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      escaped = false;
      continue;
    }

    if (ch === '{') braces++;
    else if (ch === '}') {
      braces = Math.max(0, braces - 1);
      if (braces === 0 && parens === 0 && brackets === 0 && beginsFunctionLike()) {
        push(i + 1);
      }
    } else if (ch === '(') parens++;
    else if (ch === ')') parens = Math.max(0, parens - 1);
    else if (ch === '[') brackets++;
    else if (ch === ']') brackets = Math.max(0, brackets - 1);
    else if (ch === ';' && braces === 0 && parens === 0 && brackets === 0) {
      push(i + 1);
    }
  }

  push(source.length);
  return declarations;
}

function declarationName(code) {
  const text = stripLeadingComments(code);
  const variable = text.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/);
  if (variable) return variable[1];

  const callable = text.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
  if (callable) return callable[1];

  const classLike = text.match(/^(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/);
  return classLike?.[1] ?? null;
}

function codeForIdentifierScan(source) {
  let output = '';
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') {
        lineComment = false;
        output += '\n';
      } else {
        output += ' ';
      }
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        output += '  ';
        blockComment = false;
        i++;
      } else {
        output += ch === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        output += ' ';
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        output += ' ';
        continue;
      }
      if (ch === quote) quote = null;
      output += ch === '\n' ? '\n' : ' ';
      continue;
    }

    if (ch === '/' && next === '/') {
      lineComment = true;
      output += '  ';
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      blockComment = true;
      output += '  ';
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      output += ' ';
      continue;
    }

    output += ch;
  }

  return output;
}

function collectIdentifiers(source, accepted) {
  const found = new Set();
  const scan = codeForIdentifierScan(source);
  for (const match of scan.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    if (accepted.has(match[0])) found.add(match[0]);
  }
  return found;
}

function buildHelperIndex(helperSections) {
  const source = [
    helperSections.core,
    helperSections.charts,
    helperSections.wav,
    helperSections.motion,
  ].join('\n\n');

  const entries = splitTopLevelDeclarations(source)
    .map((entry) => ({ ...entry, name: declarationName(entry.code), deps: new Set() }))
    .filter((entry) => entry.name);

  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const accepted = new Set(byName.keys());

  for (const entry of entries) {
    for (const dependency of collectIdentifiers(entry.code, accepted)) {
      if (dependency !== entry.name) entry.deps.add(dependency);
    }
  }

  return { entries, byName, accepted };
}

function helpersForRecipe(body, helperIndex) {
  const queue = [...collectIdentifiers(body, helperIndex.accepted)];
  const selected = new Set();

  while (queue.length) {
    const name = queue.shift();
    const entry = helperIndex.byName.get(name);
    if (!entry || selected.has(entry)) continue;

    selected.add(entry);
    for (const dependency of entry.deps) queue.push(dependency);
  }

  return [...selected]
    .sort((a, b) => a.pos - b.pos)
    .map((entry) => entry.code)
    .join('\n\n');
}

function simplifyRecipeReturnSaves(body) {
  return body.replace(
    /return\s*\[\s*await\s+save\(\s*(['"])[^'"]+\1\s*,\s*([A-Za-z_$][\w$]*)\s*\)\s*\]\s*;/g,
    'return $2;',
  );
}

function importsForStandalone(source) {
  const imports = [];
  const apexNamed = ['ApexPainter'];
  if (/\bApexifyDecodeError\b/.test(source)) apexNamed.push('ApexifyDecodeError');

  if (/\bApex\./.test(source)) imports.push("import * as Apex from 'apexify.js';");
  imports.push("import { " + apexNamed.join(', ') + " } from 'apexify.js';");

  const fsPromises = ['mkdir', 'writeFile', 'readFile', 'access']
    .filter((name) => new RegExp('\\b' + name + '\\b').test(source));
  if (fsPromises.length) {
    imports.push("import { " + fsPromises.join(', ') + " } from 'node:fs/promises';");
  }

  if (/\bfs\./.test(source)) imports.push("import * as fs from 'node:fs';");
  if (/\bpath\./.test(source)) imports.push("import path from 'node:path';");

  const urlImports = ['fileURLToPath', 'pathToFileURL']
    .filter((name) => new RegExp('\\b' + name + '\\b').test(source));
  if (urlImports.length) {
    imports.push("import { " + urlImports.join(', ') + " } from 'node:url';");
  }

  if (/\bassert\./.test(source)) imports.push("import assert from 'node:assert/strict';");

  return imports.join('\n');
}

function formatStandaloneModule(code, id) {
  try {
    return esbuild.transformSync(code, {
      loader: 'ts',
      format: 'esm',
      target: 'es2022',
      minify: false,
      legalComments: 'none',
    }).code.trim();
  } catch (error) {
    throw new Error(
      'Recipe ' + id + ' standalone code could not be formatted: ' +
      (error instanceof Error ? error.message : String(error)),
    );
  }
}

function makeStandaloneRecipeSource(block, id, helperIndex) {
  const rawBody = extractRecipeRunBody(block, id);
  const body = simplifyRecipeReturnSaves(rawBody);
  const helpers = helpersForRecipe(body, helperIndex);
  const supportAndBody = helpers + '\n\nasync function main() {\n' + body + '\n}';
  const imports = importsForStandalone(supportAndBody);

  const moduleCode =
    imports +
    '\n\nconst painter = new ApexPainter();\n\n' +
    (helpers ? helpers + '\n\n' : '') +
    'async function main() {\n' +
    body +
    '\n}\n';

  return formatStandaloneModule(moduleCode, id) + '\n\nreturn await main();';
}

function standalonePagesForRecipe(id, code, maxLines = 220) {
  const lines = code.trim().split(/\r?\n/);
  if (lines.length <= maxLines) {
    return [{ label: 'Recipe ' + id, language: 'ts', code }];
  }

  const chunks = [];
  for (let i = 0; i < lines.length; i += maxLines) {
    chunks.push(lines.slice(i, i + maxLines).join('\n'));
  }

  return chunks.map((chunk, index) => ({
    label: 'Recipe ' + id + ' - ' + (index + 1) + '/' + chunks.length,
    language: 'ts',
    code: chunk,
  }));
}

const source = await fs.readFile(sourcePath, 'utf8');
const sharedMatch = source.match(/import \* as ApexRuntime[\s\S]*?(?=\/\/ ===== EXAMPLE 01-canvas =====)/);
if (!sharedMatch) throw new Error('Peak Lab shared setup block not found');
const sharedCode = sharedMatch[0].trim();
const helperSections = splitSharedHelpers(sharedCode);
const helperIndex = buildHelperIndex(helperSections);

if (process.env.PEAK_LAB_VALIDATE_CODE === '1') {
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
    makeStandaloneRecipeSource(block, id, helperIndex);
  }
  console.log('Validated 26 standalone Peak Lab Gallery code recipes.');
  process.exit(0);
}

await fs.rm(publicDir, { recursive: true, force: true });
await fs.mkdir(publicDir, { recursive: true });

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

  const recipeSource = makeStandaloneRecipeSource(block, id, helperIndex);
  const recipePages = standalonePagesForRecipe(id, recipeSource);

  items.push({
    id: `peak-${id}`,
    category: 'advance',
    recipeId: id,
    title: meta.title,
    description: `${meta.description} Generated by Apexify Peak Lab recipe ${id}. The Gallery shows a standalone, readable recipe with only the helpers this piece actually uses.`,
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
    codePages: recipePages,
  });
}

const catalogSource = `/* AUTO-GENERATED by scripts/gallery/publish-peak-lab.mjs. Do not edit by hand. */
import type { CuratedGalleryCard } from '@/app/gallery/components/galleryHelpers';

export const peakLabSharedSetup = ${JSON.stringify(sharedCode)};

export const peakLabGalleryItems: CuratedGalleryCard[] = ${JSON.stringify(items, null, 2)};
`;
await fs.mkdir(path.dirname(generatedPath), { recursive: true });
await fs.writeFile(generatedPath, catalogSource);
console.log(`Published ${items.length} Peak Lab gallery recipes to ${path.relative(root, publicDir)}`);
