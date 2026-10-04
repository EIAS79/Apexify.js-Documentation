import fs from 'node:fs';
import path from 'node:path';
import { PARITY_STATUSES, type GapSummary } from './model';

const root = process.cwd();
const summaryFile = path.join(root, 'generated', 'studio', 'runtime-parity', 'gap-summary.json');

if (!fs.existsSync(summaryFile)) {
  throw new Error('[studio-parity] missing gap-summary.json; run npm run studio:parity:scan first.');
}

const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8')) as GapSummary;
const failures: string[] = [];

if (summary.phase !== 'STUDIO-PARITY-0') failures.push('unexpected phase: ' + summary.phase);
if (!summary.gates.baselineComplete) failures.push('scanner baseline gates are not complete');
if (!summary.gates.deepRecursiveTypeResolution) failures.push('deep recursive type resolution gate failed');
if (!summary.gates.surfaceReconciliationComplete) failures.push('legacy/runtime surface reconciliation is incomplete');
if (summary.counts.publicSurfaces <= 0) failures.push('no public runtime surfaces were inventoried');
if (summary.counts.recursiveRecords <= 0) failures.push('no recursive input/output records were inventoried');
if (summary.counts.status.FULL !== 0) {
  failures.push('bootstrap baseline promoted legacy evidence to FULL; STUDIO-PARITY-0 forbids this');
}
for (const status of Object.keys(summary.counts.status)) {
  if (!PARITY_STATUSES.includes(status as (typeof PARITY_STATUSES)[number])) {
    failures.push('unknown parity status in summary: ' + status);
  }
}

const pinDrift = summary.drift.find((item) => item.code === 'PARITY-RUNTIME-PIN-DRIFT');
if (!pinDrift && !summary.studio.runtimePinMatchesInstalledPackage) {
  failures.push('runtime/package pin mismatch exists but is not reported as explicit drift');
}

if (failures.length) {
  for (const failure of failures) console.error('[studio-parity] ' + failure);
  process.exit(1);
}

console.log(
  '[studio-parity] truthful baseline verified: ' +
    summary.counts.publicSurfaces + ' surfaces, ' +
    summary.counts.recursiveRecords + ' recursive records, ' +
    summary.drift.length + ' explicit drift findings.',
);
