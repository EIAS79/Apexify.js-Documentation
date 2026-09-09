import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.doc2-runtime-evidence');
fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(path.join(ROOT, '.next'), { recursive: true, force: true });

const BASELINE = {
  startingSha: 'c3d0799b8fb67fd7c86d48aceaa8c88e5e3d649f',
  buildWallMs: 37079.165,
  routedManifestJsBytes: 1010958,
  sourceCssBytes: 24878,
};

const started = performance.now();
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const build = spawnSync(npmCommand, ['run', 'build'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});
const wallMs = performance.now() - started;
process.stdout.write(build.stdout ?? '');
process.stderr.write(build.stderr ?? '');
if (build.status !== 0) process.exit(build.status ?? 1);

const manifestPath = path.join(ROOT, '.next', 'app-build-manifest.json');
if (!fs.existsSync(manifestPath)) throw new Error('[doc2-measure] app-build-manifest is missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const pages = manifest.pages ?? {};
const catchAllKey = Object.keys(pages).find((key) => key.includes('/docs/[...slug]/page')) ?? Object.keys(pages).find((key) => key.includes('[...slug]'));
if (!catchAllKey) throw new Error('[doc2-measure] routed docs manifest key is missing');

function measureFiles(files) {
  return Array.from(new Set(files ?? [])).map((file) => {
    const full = path.join(ROOT, '.next', file);
    return { file, bytes: fs.existsSync(full) ? fs.statSync(full).size : 0 };
  });
}
const jsFiles = measureFiles(pages[catchAllKey]);
const routedManifestJsBytes = jsFiles.reduce((sum, file) => sum + file.bytes, 0);

const sourceCssFiles = ['app/globals.css', 'styles/docs-tokens.css', 'styles/docs-shell.css', 'styles/docs-prose.css'];
const sourceCss = sourceCssFiles.map((file) => ({ file, bytes: fs.statSync(path.join(ROOT, file)).size }));
const sourceCssBytes = sourceCss.reduce((sum, file) => sum + file.bytes, 0);

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(full) : [full];
  });
}
const compiledCss = walkFiles(path.join(ROOT, '.next', 'static', 'css'))
  .filter((file) => file.endsWith('.css'))
  .map((file) => ({ file: path.relative(path.join(ROOT, '.next'), file).replaceAll('\\', '/'), bytes: fs.statSync(file).size }))
  .sort((a, b) => a.file.localeCompare(b.file));
const compiledCssBytes = compiledCss.reduce((sum, file) => sum + file.bytes, 0);

const ansi = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
const output = `${build.stdout ?? ''}\n${build.stderr ?? ''}`.replace(ansi, '');
const routeLine = output.split(/\r?\n/).find((line) => line.includes('/docs/[...slug]')) ?? null;
function sizeToBytes(value) {
  const match = value?.trim().match(/^([\d.]+)\s*(B|kB|MB)$/i);
  if (!match) return null;
  const number = Number(match[1]);
  const unit = match[2].toLowerCase();
  return Math.round(number * (unit === 'mb' ? 1_000_000 : unit === 'kb' ? 1_000 : 1));
}
let firstLoadJsBytes = null;
if (routeLine) {
  const sizes = [...routeLine.matchAll(/([\d.]+\s*(?:B|kB|MB))/gi)].map((match) => match[1]);
  firstLoadJsBytes = sizeToBytes(sizes.at(-1));
}

const evidence = {
  schemaVersion: 1,
  phase: 'DOC-2',
  methodology: 'one clean Next.js production build; route JS measured from app-build-manifest; source and compiled CSS measured by file bytes',
  baseline: BASELINE,
  after: {
    buildWallMs: Number(wallMs.toFixed(3)),
    routedManifestJsBytes,
    firstLoadJsBytes,
    sourceCssBytes,
    compiledCssBytes,
  },
  delta: {
    buildWallMs: Number((wallMs - BASELINE.buildWallMs).toFixed(3)),
    buildPercent: Number((((wallMs / BASELINE.buildWallMs) - 1) * 100).toFixed(2)),
    routedManifestJsBytes: routedManifestJsBytes - BASELINE.routedManifestJsBytes,
    routedManifestJsPercent: Number((((routedManifestJsBytes / BASELINE.routedManifestJsBytes) - 1) * 100).toFixed(2)),
    sourceCssBytes: sourceCssBytes - BASELINE.sourceCssBytes,
    sourceCssPercent: Number((((sourceCssBytes / BASELINE.sourceCssBytes) - 1) * 100).toFixed(2)),
  },
  routeLine,
  files: { javascript: jsFiles, sourceCss, compiledCss },
};
fs.writeFileSync(path.join(OUT, 'build-bundle.json'), `${JSON.stringify(evidence, null, 2)}\n`);
console.log('[doc2-measure] ' + JSON.stringify(evidence.after));
