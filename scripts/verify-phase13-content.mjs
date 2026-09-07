import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collect(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

const mdx = collect(path.join(root, 'content', 'docs'), (f) => f.endsWith('.mdx'))
  .filter((f) => !f.includes(`${path.sep}05-internals${path.sep}`));
const tsx = [
  ...collect(path.join(root, 'app', 'docs'), (f) => f.endsWith('.tsx')),
  ...collect(path.join(root, 'components', 'home'), (f) => f.endsWith('.tsx')),
];
const files = [...mdx, ...tsx];

const rules = [
  ['unshipped @apexify/* import', /from\s+["']@apexify\//g],
  ['unsupported apexify.js deep import', /from\s+["']apexify\.js\/(?!types(?:["']|$)|package\.json(?:["']|$))/g],
  ['Node 16+ claim', /Node\.js\s+16\.0\.0\s+or\s+higher/gi],
  ['Node 20 current-support claim', /Node(?:\.js)?\s+20(?:\.x|\.\d+(?:\.\d+)?)?\s+(?:or\s+higher|required|supported)/gi],
  ['bare FFMPEG_PATH', /(?<![A-Z_])FFMPEG_PATH\b/g],
  ['bare FFPROBE_PATH', /(?<![A-Z_])FFPROBE_PATH\b/g],
  ['obsolete object-first createChart', /painter\.createChart\s*\(\s*\{/g],
  ['stale v5.4.5 hero', /v5\.4\.5\s*·\s*charts/gi],
  ['overbroad Rust implementation claim', /powered by Rust under the hood/gi],
  ['slides first-class renderer claim', /render charts, images, GIFs, slides and video/gi],
  ['incorrect createCanvas output conversion claim', /createCanvas\([^\n]*\)[\s\S]{0,120}(?:is|returns?)\s+(?:a\s+)?(?:base64|string|data URL)/gi],
];

const findings = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (const [label, regex] of rules) {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      const before = text.slice(0, match.index);
      const line = before.split(/\r?\n/).length;
      findings.push({ file: path.relative(root, file), line, label, excerpt: lines[line - 1]?.trim().slice(0, 180) ?? '' });
    }
  }
}

if (findings.length) {
  console.error(`Phase 13 stale-content audit found ${findings.length} issue(s):`);
  for (const f of findings) console.error(`- ${f.file}:${f.line} [${f.label}] ${f.excerpt}`);
  process.exit(1);
}

console.log(`verify-phase13-content: ${files.length} active documentation/site files scanned — PASS`);
