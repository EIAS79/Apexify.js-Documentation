import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const out = path.join(root, 'generated', 'docs-doc4');
const required = [
  'api-manifest.json',
  'api-search-index.json',
  'export-inventory.json',
  'type-graph.json',
  'option-inventory.json',
  'identity.json',
  'api-coverage.json',
  'option-coverage.json',
];

const missing = required.filter((name) => !fs.existsSync(path.join(out, name)));
if (missing.length === 0) {
  console.log('[doc4-ensure] generated API runtime data present');
  process.exit(0);
}

console.log(`[doc4-ensure] generating missing API runtime data: ${missing.join(', ')}`);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npm, ['run', 'docs:generate:doc4'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});
if (result.status !== 0) process.exit(result.status ?? 1);

for (const name of required) {
  if (!fs.existsSync(path.join(out, name))) {
    throw new Error(`[doc4-ensure] generator did not create ${name}`);
  }
}
