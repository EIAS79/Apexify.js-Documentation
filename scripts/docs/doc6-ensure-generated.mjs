import fs from 'node:fs';

const required = [
  'generated/docs-doc6/search-records.json',
  'generated/docs-doc6/search-index-manifest.json',
  'generated/docs-doc6/related-content.json',
  'generated/docs-doc6/search-source-checksums.json',
];
for (const file of required) {
  if (!fs.existsSync(file)) {
    throw new Error(`DOC-6 generated data missing: ${file}. Run npm run docs:search:build.`);
  }
}
console.log('[doc6-ensure] generated search artifacts present');
