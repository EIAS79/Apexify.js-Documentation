import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'content', 'docs');

function collect(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (full.endsWith('.mdx')) out.push(full);
  }
  return out;
}

const files = collect(docsRoot);
const anchors = new Set();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  anchors.add(path.basename(file, '.mdx'));
  for (const match of text.matchAll(/\{#([A-Za-z0-9_-]+)\}/g)) anchors.add(match[1]);
}

const findings = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\/docs#([A-Za-z0-9_-]+)/g)) {
    if (anchors.has(match[1])) continue;
    const line = text.slice(0, match.index).split(/\r?\n/).length;
    findings.push({ file: path.relative(root, file), line, anchor: match[1] });
  }
}

if (findings.length) {
  console.error(`Phase 13 link audit found ${findings.length} missing documentation anchor reference(s):`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} -> /docs#${finding.anchor}`);
  }
  process.exit(1);
}

console.log(`verify-phase13-links: ${files.length} MDX files and ${anchors.size} documentation anchors scanned — PASS`);
