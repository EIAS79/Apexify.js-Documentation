import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'generated', 'docs-doc1');
const CHECK = process.argv.includes('--check');
const INDEX = path.join(DIR, 'index.json');

function digest(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

if (!fs.existsSync(DIR)) {
  throw new Error('[doc1-finalize] generated/docs-doc1 does not exist');
}

const files = fs
  .readdirSync(DIR)
  .filter((name) => name.endsWith('.json') && name !== 'index.json')
  .sort();

const index = {
  schemaVersion: 1,
  phase: 'DOC-1',
  files: files.map((name) => {
    const content = fs.readFileSync(path.join(DIR, name));
    return {
      name,
      bytes: content.byteLength,
      sha256: digest(content),
    };
  }),
};

const expected = `${JSON.stringify(index, null, 2)}\n`;
if (CHECK) {
  if (!fs.existsSync(INDEX) || fs.readFileSync(INDEX, 'utf8') !== expected) {
    throw new Error(
      '[doc1-finalize] generated/docs-doc1/index.json is stale; run npm run docs:finalize:doc1',
    );
  }
  console.log(`[doc1-finalize] verified ${files.length} evidence files.`);
} else {
  fs.writeFileSync(INDEX, expected);
  console.log(`[doc1-finalize] indexed ${files.length} evidence files.`);
}
