import fs from 'node:fs';
import path from 'node:path';
import type { GapSummary, ParityStatus } from './model';

const root = process.cwd();
const check = process.argv.includes('--check');
const dir = path.join(root, 'generated', 'studio', 'runtime-parity');
const summaryFile = path.join(dir, 'gap-summary.json');
const reconciliationFile = path.join(dir, 'surface-reconciliation.json');
const outFile = path.join(dir, 'BASELINE.md');

if (!fs.existsSync(summaryFile)) {
  throw new Error('[studio-parity] missing gap-summary.json; run npm run studio:parity:scan first.');
}

const summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8')) as GapSummary;
const reconciliation = fs.existsSync(reconciliationFile)
  ? JSON.parse(fs.readFileSync(reconciliationFile, 'utf8')) as {
      summary: Record<string, number>;
      legacy: Array<{ capability: string; result: string; runtimeSymbol: string | null; reason: string }>;
      runtimeOnly: Array<{ runtimeSymbol: string; result: string; reason: string }>;
    }
  : null;
const statusOrder: ParityStatus[] = [
  'FULL',
  'PARTIAL',
  'MISSING',
  'RUNTIME-ONLY',
  'CODE-ONLY',
  'EXCLUDED-WITH-REASON',
  'DEPRECATED-COMPAT',
  'DRIFT',
  'BLOCKED',
  'UNKNOWN',
];

const lines: string[] = [
  '# STUDIO-PARITY-0 — Deep Runtime Inventory Baseline',
  '',
  '> Generated deterministically from the pinned Apexify.js source checkout. Do not hand-edit.',
  '',
  '## Runtime identity',
  '',
  '- Runtime repository: `' + summary.runtime.repository + '`',
  '- Runtime commit: `' + summary.runtime.commit + '`',
  '- Runtime version: `' + String(summary.runtime.packageVersion ?? 'unknown') + '`',
  '- Studio dependency pin: `' + String(summary.studio.installedApexifyPin ?? 'missing') + '`',
  '- Runtime pin matches installed package: **' + (summary.studio.runtimePinMatchesInstalledPackage ? 'yes' : 'no') + '**',
  '',
  '## Inventory',
  '',
  '| Measure | Count |',
  '|---|---:|',
  '| Public surfaces | ' + summary.counts.publicSurfaces + ' |',
  '| Recursive input/output records | ' + summary.counts.recursiveRecords + ' |',
  '| Input records | ' + summary.counts.inputRecords + ' |',
  '| Output records | ' + summary.counts.outputRecords + ' |',
  '| Union variants | ' + summary.counts.unionVariants + ' |',
  '| Legacy capability rows imported as evidence | ' + summary.counts.legacyCapabilities + ' |',
  '| Legacy option paths | ' + summary.counts.legacyOptionPaths + ' |',
  '',
  '## Truthful status baseline',
  '',
  '| Status | Count |',
  '|---|---:|',
  ...statusOrder.map((status) => '| `' + status + '` | ' + (summary.counts.status[status] ?? 0) + ' |'),
  '',
  '**Important:** legacy “implemented/classified” evidence is intentionally not promoted to `FULL`.',
  '',
  '## Runtime / Studio drift',
  '',
];

if (summary.drift.length) {
  for (const item of summary.drift) {
    lines.push('- **' + item.severity.toUpperCase() + ' — ' + item.code + ':** ' + item.message);
  }
} else {
  lines.push('- No source-identity drift recorded.');
}

if (reconciliation) {
  const r = reconciliation.summary;
  lines.push(
    '',
    '## Public-surface reconciliation',
    '',
    '| Measure | Count |',
    '|---|---:|',
    '| Legacy capability rows | ' + (r.legacyRows ?? 0) + ' |',
    '| Current runtime surfaces | ' + (r.runtimeSurfaces ?? 0) + ' |',
    '| Exact matches | ' + (r.exactMatches ?? 0) + ' |',
    '| Codegen aliases | ' + (r.aliasMatches ?? 0) + ' |',
    '| Public-name drift / reachable aliases | ' + (r.publicNameDriftOrReachableAlias ?? 0) + ' |',
    '| Intentional hosted exclusions | ' + (r.intentionalHostedExclusions ?? 0) + ' |',
    '| Introspection / non-authorable legacy rows | ' + (r.introspectionOrNonauthorable ?? 0) + ' |',
    '| Removed from current runtime | ' + (r.removedFromCurrentRuntime ?? 0) + ' |',
    '| Legacy rows not on current public surface | ' + (r.legacyNotCurrentPublicSurface ?? 0) + ' |',
    '| Current runtime surfaces missing from legacy matrix | ' + (r.runtimeOnly ?? 0) + ' |',
    '',
    'Every non-exact row is retained in `surface-reconciliation.json` with an explicit reason and, where discoverable, a current runtime candidate.',
  );
}

lines.push('', '## Domains', '', '| Domain | Surfaces | Records | Status summary |', '|---|---:|---:|---|');
for (const [domain, domainSummary] of Object.entries(summary.domains)) {
  const statuses = Object.entries(domainSummary.status)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([status, count]) => status + '=' + count)
    .join(', ');
  lines.push('| `' + domain + '` | ' + domainSummary.surfaces + ' | ' + domainSummary.records + ' | ' + statuses + ' |');
}

lines.push(
  '',
  '## Phase-0 gates',
  '',
  ...Object.entries(summary.gates).map(([gate, value]) => '- [' + (value ? 'x' : ' ') + '] `' + gate + '`'),
  '',
  '## Interpretation',
  '',
  'This baseline proves inventory coverage and exposes drift. It does **not** claim domain parity.',
  'A record becomes `FULL` only in later STUDIO-PARITY phases after runtime semantics, controls, validation, preview, generated source, reverse reconciliation, persistence, and runtime-equivalence proof are all present.',
  '',
);

const rendered = lines.join('\n');
if (check) {
  if (!fs.existsSync(outFile)) throw new Error('[studio-parity] missing generated BASELINE.md');
  const current = fs.readFileSync(outFile, 'utf8').replace(/\r\n/g, '\n');
  if (current !== rendered) throw new Error('[studio-parity] generated BASELINE.md is stale');
} else {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outFile, rendered);
}
console.log('[studio-parity] ' + (check ? 'verified' : 'wrote') + ' generated/studio/runtime-parity/BASELINE.md');
