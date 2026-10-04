import fs from 'node:fs';
import path from 'node:path';
import { PARITY_STATUSES, type RuntimeParityRecord, type PublicSurfaceRecord } from './model';

const root = process.cwd();
const rawDomain =
  process.argv.find((item) => item.startsWith('--domain='))?.slice('--domain='.length) ??
  (() => {
    const index = process.argv.indexOf('--domain');
    return index >= 0 ? process.argv[index + 1] : null;
  })();

if (!rawDomain) throw new Error('Usage: npm run studio:parity:domain -- --domain <domain>');

const file = path.join(root, 'generated', 'studio', 'runtime-parity', 'domains', rawDomain + '.json');
if (!fs.existsSync(file)) throw new Error('[studio-parity] no generated domain artifact for ' + rawDomain);

const artifact = JSON.parse(fs.readFileSync(file, 'utf8')) as {
  domain: string;
  surfaces: PublicSurfaceRecord[];
  records: RuntimeParityRecord[];
};

const failures: string[] = [];
if (artifact.domain !== rawDomain) failures.push('domain identity mismatch');
if (!artifact.surfaces.length) failures.push('domain has no public surfaces');
for (const item of [...artifact.surfaces, ...artifact.records]) {
  if (!PARITY_STATUSES.includes(item.status)) failures.push(item.id + ': invalid status ' + item.status);
}
if (artifact.records.some((record) => !record.sourceFiles.length && !record.implementationFiles.length)) {
  failures.push('one or more recursive records have no source/implementation evidence');
}

if (failures.length) {
  for (const failure of failures) console.error('[studio-parity][' + rawDomain + '] ' + failure);
  process.exit(1);
}
console.log(
  '[studio-parity][' + rawDomain + '] verified ' +
    artifact.surfaces.length + ' surfaces and ' + artifact.records.length + ' recursive records.',
);
