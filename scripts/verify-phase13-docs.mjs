import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function fail(message) {
  throw new Error(`Phase 13 documentation verification failed: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function collectFiles(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function sameSet(actual, expected, label) {
  const a = sorted(actual);
  const e = sorted(expected);
  assert(JSON.stringify(a) === JSON.stringify(e), `${label} drifted.\nExpected: ${e.join(', ')}\nActual: ${a.join(', ')}`);
}

const expectedRuntimeExports = [
  'ApexPainter',
  'ApexifyAssetError',
  'ApexifyConfigError',
  'ApexifyDecodeError',
  'ApexifyError',
  'ApexifyExternalServiceError',
  'ApexifyInputError',
  'ApexifyPluginError',
  'ApexifyProcessError',
  'ApexifyRemoteFetchError',
  'ApexifyResourceLimitError',
  'DEFAULT_APEXIFY_RUNTIME_CONFIG',
  'configureApexifyRuntime',
  'getDefaultApexifyRuntimeConfig',
  'resetApexifyRuntimeConfig',
  'resolveApexifyRuntimeConfig',
];

const expectedPainterMethods = [
  'prepareForRender',
  'createCanvas',
  'createImage',
  'createText',
  'measureText',
  'createScene',
  'createTemplate',
  'use',
  'renderScene',
  'validateSceneRenderInput',
  'renderSceneToGIF',
  'renderSceneToVideoFrames',
  'createVideo',
  'videoPipeline',
  'getVideoInfo',
  'extractFrames',
  'extractAllFrames',
  'extractFrameAtTime',
  'extractFrameByNumber',
  'extractMultipleFrames',
  'createChart',
  'createComparisonChart',
  'createComboChart',
  'createGIF',
  'animate',
  'batch',
  'chain',
  'toOutput',
  'outPut',
  'save',
  'saveMultiple',
];

const expectedLimitKeys = [
  'maxCanvasDimension', 'maxTotalPixels', 'maxCollectionItems', 'maxBackgroundLayers', 'maxFiltersPerOperation',
  'maxSceneLayers', 'maxSceneTotalPixels', 'maxNestedSurfaces', 'maxSceneDepth', 'maxSceneImages', 'maxSceneTextLayers',
  'maxSceneCharts', 'maxTextLength', 'maxRemoteAssets', 'maxRemoteImageBytes', 'maxRemoteVideoBytes', 'maxImageSourceBytes',
  'maxDecodedImagePixels', 'maxDecodedImageFrames', 'maxSvgElements', 'maxGifFrames', 'maxGifDimension', 'maxGifResourceCost',
  'maxAudioDurationSeconds', 'maxAudioSampleRate', 'maxAudioChannels', 'maxAudioEvents', 'maxAudioLayers', 'maxAudioPartials',
  'maxAudioBytes', 'maxVideoDurationSeconds', 'maxVideoFps', 'maxVideoBitrateKbps', 'maxVideoOverlays', 'maxVideoMergeInputs',
  'maxVideoExtractedFrames', 'maxVideoAudioTracks', 'maxVideoPipelineLayers', 'maxBatchOperations', 'maxBatchConcurrency',
  'maxConcurrentRemoteFetches',
];

const esm = await import('apexify.js');
const cjs = require('apexify.js');
sameSet(Object.keys(esm), expectedRuntimeExports, 'ESM package-root runtime exports');
sameSet(Object.keys(cjs), expectedRuntimeExports, 'CommonJS package-root runtime exports');

const packageJsonPath = require.resolve('apexify.js/package.json');
const packageJson = JSON.parse(read(packageJsonPath));
assert(packageJson.name === 'apexify.js', 'installed package name is not apexify.js');
assert(packageJson.version === '6.0.0', `installed package version is ${packageJson.version}, expected staged 6.0.0`);
assert(packageJson.engines?.node === '22.x || 24.x || 26.x', `Node engine drifted: ${packageJson.engines?.node}`);
sameSet(Object.keys(packageJson.exports ?? {}), ['.', './types', './package.json'], 'package export subpaths');
const typesExport = packageJson.exports?.['./types'];
assert(typesExport && typeof typesExport === 'object', 'apexify.js/types export is missing');
assert(!('default' in typesExport), 'apexify.js/types unexpectedly exposes a runtime default target');

for (const method of expectedPainterMethods) {
  assert(typeof esm.ApexPainter.prototype[method] === 'function', `ApexPainter.prototype.${method} is missing`);
}

const painter = new esm.ApexPainter({ type: 'buffer' });
for (const property of ['assets', 'plugins', 'components', 'image', 'detect', 'path2d', 'pixels', 'output', 'createAudio', 'video']) {
  assert(painter[property] !== undefined, `painter.${property} is missing`);
}

const pluginInstall = painter.use({
  name: 'phase13-doc-verifier',
  async install(host) {
    await Promise.resolve();
    host.plugins.use('phase13-doc-verifier-api', { ok: true });
  },
});
assert(pluginInstall instanceof Promise, 'ApexPainter.use() is not Promise-returning');
await pluginInstall;
assert(painter.plugins.get('phase13-doc-verifier-api')?.ok === true, 'async plugin install did not complete before use() resolved');

const canvas = await painter.createCanvas({ width: 64, height: 32, colorBg: '#111827' });
assert(Buffer.isBuffer(canvas.buffer), 'createCanvas().buffer is not a Buffer');
assert(canvas.buffer.subarray(1, 4).toString('ascii') === 'PNG', 'createCanvas() did not produce PNG bytes');
assert(painter.output.dataURL(canvas.buffer).startsWith('data:image/png;base64,'), 'painter.output.dataURL() contract drifted');

sameSet(Object.keys(esm.DEFAULT_APEXIFY_RUNTIME_CONFIG.limits), expectedLimitKeys, 'RenderLimits keys');
assert(esm.DEFAULT_APEXIFY_RUNTIME_CONFIG.network.trustedNetworkAccess === false, 'trusted network access default is no longer false');
assert(esm.DEFAULT_APEXIFY_RUNTIME_CONFIG.cache.maxEntries === 128, 'cache maxEntries default drifted');
assert(esm.DEFAULT_APEXIFY_RUNTIME_CONFIG.cache.maxBytes === 128 * 1024 * 1024, 'cache maxBytes default drifted');
assert(esm.DEFAULT_APEXIFY_RUNTIME_CONFIG.ffmpeg.processTimeoutMs === 5 * 60_000, 'FFmpeg process timeout default drifted');

const docsDir = path.join(root, 'content', 'docs');
const mdxFiles = collectFiles(docsDir, (file) => file.endsWith('.mdx'));
const apiFiles = mdxFiles.filter((file) => file.includes(`${path.sep}04-api-reference${path.sep}`));
const activeFiles = mdxFiles.filter((file) => !file.includes(`${path.sep}05-internals${path.sep}`));
const legacyGettingStarted = path.join(root, 'app', 'docs', 'getting-started', 'page.tsx');
const activeCorpus = [...activeFiles, legacyGettingStarted].map(read).join('\n');
const apiCorpus = apiFiles.map(read).join('\n');

const requiredDocs = [
  'content/docs/04-api-reference/api-overview/api-reference.mdx',
  'content/docs/04-api-reference/api-overview/package-surface.mdx',
  'content/docs/04-api-reference/api-scene/api-new-apex-painter.mdx',
  'content/docs/04-api-reference/api-image/api-image-utilities.mdx',
  'content/docs/04-api-reference/api-lines-paths/api-create-path2d.mdx',
  'content/docs/04-api-reference/api-charts/api-create-chart.mdx',
  'content/docs/04-api-reference/api-gif/api-create-gif.mdx',
  'content/docs/04-api-reference/api-video/api-create-video.mdx',
  'content/docs/04-api-reference/api-audio/api-create-audio.mdx',
  'content/docs/04-api-reference/api-batch-save/api-batch.mdx',
  'content/docs/04-advanced/01-runtime-resource-governance.mdx',
  'content/docs/04-advanced/02-security-deployment.mdx',
  'content/docs/04-advanced/03-performance-memory.mdx',
  'content/docs/04-advanced/04-migration-v6.mdx',
];
for (const relative of requiredDocs) assert(fs.existsSync(path.join(root, relative)), `required Phase 13 page missing: ${relative}`);

for (const symbol of expectedRuntimeExports) {
  assert(apiCorpus.includes(symbol), `API reference does not mention runtime export ${symbol}`);
}
for (const method of expectedPainterMethods) {
  assert(apiCorpus.includes(method), `API reference does not mention ApexPainter method ${method}`);
}
for (const facetMethod of [
  'stitchImages', 'createCollage', 'compress', 'extractPalette', 'resize', 'imgConverter', 'effects', 'colorsFilter', 'colorAnalysis',
  'colorsRemover', 'removeBackground', 'blend', 'cropImage', 'masking', 'gradientBlend', 'validHex',
  'getData', 'setData', 'manipulate', 'getColor', 'setColor', 'anyRegion', 'distance',
  'dataURL', 'base64', 'arrayBuffer', 'listPresets', 'synth', 'preset', 'sequence', 'compose', 'mix',
  'loadImage', 'replaceImage', 'loadFont', 'replaceFont', 'loadPalette', 'replacePalette', 'loadValue', 'replaceValue',
  'unregisterImage', 'unregisterFont', 'unregisterPalette', 'resolve', 'isInstalled', 'listInstalled',
]) {
  assert(apiCorpus.includes(facetMethod), `API reference does not mention grouped/public method ${facetMethod}`);
}

assert(!/from\s+["']@apexify\//.test(activeCorpus), 'active docs import an unshipped @apexify/* package');
assert(!/from\s+["']apexify\.js\/(?!types(?:["']|$)|package\.json(?:["']|$))/.test(activeCorpus), 'active docs use an unsupported apexify.js deep import');
assert(!/Node\.js\s+16\.0\.0\s+or\s+higher/i.test(activeCorpus), 'active docs still claim Node.js 16+');
assert(!/Node(?:\.js)?\s+20\.x\s+(?:or\s+higher|required|supported)/i.test(activeCorpus), 'active docs still present Node 20 as current support');
assert(!/(^|[^A-Z_])FFMPEG_PATH\b/m.test(activeCorpus), 'active docs still use bare FFMPEG_PATH instead of APEXIFY_FFMPEG_PATH');
assert(!/(^|[^A-Z_])FFPROBE_PATH\b/m.test(activeCorpus), 'active docs still use bare FFPROBE_PATH instead of APEXIFY_FFPROBE_PATH');
assert(!/createCanvas\([^\n]*\)[\s\S]{0,120}(?:is|returns?)\s+(?:a\s+)?(?:base64|string|data URL)/i.test(activeCorpus), 'active docs still imply constructor output type changes createCanvas() return value');

const docsPackage = JSON.parse(read(path.join(root, 'package.json')));
const pin = docsPackage.dependencies?.['apexify.js'];
const pinMatch = /^github:EIAS79\/Apexify\.js#([0-9a-f]{40})$/.exec(pin ?? '');
assert(pinMatch, `docs dependency must pin apexify.js to an exact 40-character GitHub SHA; received ${pin}`);
const pinnedSha = pinMatch[1];
const lockText = read(path.join(root, 'package-lock.json'));
assert(lockText.includes(`github:EIAS79/Apexify.js#${pinnedSha}`), 'package-lock root spec does not match the exact Apexify pin');
assert(lockText.includes(`#${pinnedSha}`), 'package-lock resolved Apexify dependency does not match the exact pin');

const anchors = new Set();
for (const file of mdxFiles) {
  const text = read(file);
  anchors.add(path.basename(file, '.mdx'));
  for (const match of text.matchAll(/\{#([A-Za-z0-9_-]+)\}/g)) anchors.add(match[1]);
}
for (const file of mdxFiles) {
  const text = read(file);
  for (const match of text.matchAll(/\/docs#([A-Za-z0-9_-]+)/g)) {
    assert(anchors.has(match[1]), `${path.relative(root, file)} links to missing /docs#${match[1]} anchor`);
  }
}

console.log(`verify-phase13-docs: ${apiFiles.length} API-reference pages, ${mdxFiles.length} MDX pages, package ${packageJson.version}, pin ${pinnedSha.slice(0, 12)}… — PASS`);
