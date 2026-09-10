import fs from 'node:fs';
const required=['generated/docs-doc5/example-manifest.json','generated/docs-doc5/example-coverage.json'];
for(const file of required) if(!fs.existsSync(file)) throw new Error(`DOC-5 generated data missing: ${file}. Run npm run docs:examples:manifest.`);
console.log('[doc5-ensure] generated example manifest present');
