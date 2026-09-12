import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const root = path.resolve(arg('--root', process.cwd()));
const label = arg('--label', 'subject');
const out = path.resolve(arg('--out', path.join(process.cwd(), 'generated', 'docs-doc7', 'runtime', `${label}-build.json`)));
const nextDir = path.join(root, '.next');
fs.rmSync(nextDir, { recursive: true, force: true });

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const started = performance.now();
const build = spawnSync(command, ['run', 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
});
const buildWallMs = performance.now() - started;
if (build.status !== 0) process.exit(build.status ?? 1);

const appManifest = JSON.parse(fs.readFileSync(path.join(nextDir, 'app-build-manifest.json'), 'utf8'));
const pages = appManifest.pages ?? {};

function routeBytes(route) {
  const files = new Set(pages[route] ?? []);
  if (!files.size) {
    for (const [key, values] of Object.entries(pages)) {
      if (key === route || key.endsWith(route)) for (const file of values) files.add(file);
    }
  }
  if (!files.size) throw new Error(`[doc7-build] route ${route} not found in app-build-manifest for ${label}`);
  let bytes = 0;
  for (const file of files) {
    const absolute = path.join(nextDir, file);
    if (fs.existsSync(absolute)) bytes += fs.statSync(absolute).size;
  }
  return { bytes, files: [...files].sort() };
}

function collectFiles(directory, predicate, result = []) {
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(absolute, predicate, result);
    else if (predicate(absolute)) result.push(absolute);
  }
  return result;
}

const cssFiles = collectFiles(path.join(nextDir, 'static', 'css'), (file) => file.endsWith('.css'));
const publicFiles = collectFiles(path.join(root, 'public'), () => true);
const imageExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg']);
const mediaExt = new Set(['.gif', '.mp4', '.webm', '.wav', '.mp3', '.m4a', '.ogg']);
const sum = (files) => files.reduce((total, file) => total + fs.statSync(file).size, 0);

const evidence = {
  schemaVersion: 1,
  phase: 'DOC-7',
  label,
  methodology: 'Clean Next production build on the same CI runner; route JS from app-build-manifest; CSS and public asset bytes from built/repository files.',
  buildWallMs: Number(buildWallMs.toFixed(3)),
  homepageFirstLoadJsBytes: routeBytes('/page').bytes,
  galleryFirstLoadJsBytes: routeBytes('/gallery/page').bytes,
  cssBytes: sum(cssFiles),
  publicImageBytes: sum(publicFiles.filter((file) => imageExt.has(path.extname(file).toLowerCase()))),
  publicMediaBytes: sum(publicFiles.filter((file) => mediaExt.has(path.extname(file).toLowerCase()))),
  routes: {
    homepage: routeBytes('/page').files,
    gallery: routeBytes('/gallery/page').files,
  },
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(evidence, null, 2)}\n`);
console.log('[doc7-build]', JSON.stringify(evidence));
