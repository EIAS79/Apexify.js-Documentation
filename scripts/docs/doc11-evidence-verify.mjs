import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'generated', 'verification', 'doc-11');
const required = [
  'static-contracts.json',
  'media.json',
  'route-matrix.json',
  'accessibility.json',
  'keyboard.json',
  'mobile.json',
  'reduced-motion.json',
  'metadata-seo.json',
  'bundle.json',
  'cache-reliability.json',
  'seo-infrastructure.json',
  'browser-summary.json',
  'lighthouse-cwv.json',
];

const failures = [];
for (const name of required) {
  const file = path.join(DIR, name);
  if (!fs.existsSync(file)) {
    failures.push(`${name}: missing`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push(`${name}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
    continue;
  }
  if (!data.status) failures.push(`${name}: missing top-level status`);
  else if (data.status === 'FAIL') failures.push(`${name}: status FAIL`);
}

if (failures.length) {
  console.error('[DOC-11 evidence] FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[DOC-11 evidence] PASS files=${required.length}`);
