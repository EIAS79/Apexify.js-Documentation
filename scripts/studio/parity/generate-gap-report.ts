import fs from 'node:fs';
import path from 'node:path';
import type { GapSummary, ParityStatus } from './model';

const root = process.cwd();
const check = process.argv.includes('--check');
const dir = path.join(root, 'generated', 'studio', 'runtime-parity');
const summaryFile = path.join(dir, 'gap-summary.json');
const reconciliationFile = path.join(dir, 'surface-reconciliation.json');
const outFile = path.join(dir, 'BASELINE.md');
const completionFile = path.join(dir, 'PHASE-0-COMPLETION.md');
const parityTestFile = path.join(root, 'scripts', 'studio', 'parity', 'parity-baseline.test.ts');

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
  '| Status | Public surfaces | Recursive records | Combined |',
  '|---|---:|---:|---:|',
  ...statusOrder.map((status) =>
    '| `' + status + '` | ' +
    (summary.counts.surfaceStatus[status] ?? 0) + ' | ' +
    (summary.counts.recordStatus[status] ?? 0) + ' | ' +
    (summary.counts.status[status] ?? 0) + ' |'
  ),
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

const declaredTests = fs.existsSync(parityTestFile)
  ? (fs.readFileSync(parityTestFile, 'utf8').match(/\btest\s*\(/g) ?? []).length
  : 0;
const completionStatus = summary.gates.baselineComplete ? 'COMPLETE' : 'BLOCKED';
const completionLines: string[] = [
  '# STUDIO-PARITY-0 — Completion Report',
  '',
  '> Deterministic Phase-0 closure report generated from the pinned runtime inventory.',
  '',
  '## Phase',
  '',
  '- Program: `STUDIO-PARITY`',
  '- Phase: `STUDIO-PARITY-0`',
  '- Status: **' + completionStatus + '**',
  '- Runtime repository: `' + summary.runtime.repository + '`',
  '- Runtime SHA: `' + summary.runtime.commit + '`',
  '- Runtime package version: `' + String(summary.runtime.packageVersion ?? 'unknown') + '`',
  '',
  '## Inventory result',
  '',
  '| Measure | Count |',
  '|---|---:|',
  '| Public/reachable runtime surfaces | ' + summary.counts.publicSurfaces + ' |',
  '| Recursive runtime records | ' + summary.counts.recursiveRecords + ' |',
  '| Input records | ' + summary.counts.inputRecords + ' |',
  '| Output records | ' + summary.counts.outputRecords + ' |',
  '| Union-variant records | ' + summary.counts.unionVariants + ' |',
  '| Legacy capability rows reconciled | ' + summary.counts.legacyCapabilities + ' |',
  '| Legacy option paths retained as evidence | ' + summary.counts.legacyOptionPaths + ' |',
  '',
  '## Status inspection',
  '',
  '| Status | Public surfaces | Recursive records |',
  '|---|---:|---:|',
  ...statusOrder.map((status) =>
    '| `' + status + '` | ' +
    (summary.counts.surfaceStatus[status] ?? 0) + ' | ' +
    (summary.counts.recordStatus[status] ?? 0) + ' |'
  ),
  '',
  'Phase 0 intentionally leaves `FULL=0`: classification or existence is not promoted to proven Studio parity. Later domain phases must earn `FULL` with UI/model/validation/preview/codegen/reconciliation/persistence/runtime-equivalence proof.',
  '',
  '## Source evidence',
  '',
  '| Evidence | Count |',
  '|---|---:|',
  '| Surfaces with multi-file implementation call graph | ' + summary.evidence.surfacesWithImplementationGraph + ' |',
  '| Surfaces reaching validator/assertion code | ' + summary.evidence.surfacesWithValidationGraph + ' |',
  '| Surfaces with literal runtime default evidence | ' + summary.evidence.surfacesWithLiteralDefaults + ' |',
  '| Surfaces reaching resource-limit assertions | ' + summary.evidence.surfacesWithResourceLimits + ' |',
  '| Surfaces reaching structured Apexify errors | ' + summary.evidence.surfacesWithStructuredErrors + ' |',
  '| Recursive records with resolved literal runtime defaults | ' + summary.evidence.recordsWithResolvedRuntimeDefault + ' |',
  '| Recursive records linked to runtime resource limits | ' + summary.evidence.recordsWithResourceLimits + ' |',
  '',
  'Core source-mapping gate proves `createCanvas`, `createImage`, `createText`, and `measureText` reach their real validator modules through TypeScript symbol/call relationships rather than filename/text matching.',
  '',
  '## Gaps and exclusions carried forward',
  '',
  '- `MISSING` surfaces: **' + (summary.counts.surfaceStatus.MISSING ?? 0) + '**; recursive records: **' + (summary.counts.recordStatus.MISSING ?? 0) + '**.',
  '- `PARTIAL` surfaces: **' + (summary.counts.surfaceStatus.PARTIAL ?? 0) + '**; recursive records: **' + (summary.counts.recordStatus.PARTIAL ?? 0) + '**.',
  '- `RUNTIME-ONLY` surfaces: **' + (summary.counts.surfaceStatus['RUNTIME-ONLY'] ?? 0) + '**; recursive records: **' + (summary.counts.recordStatus['RUNTIME-ONLY'] ?? 0) + '**.',
  '- `EXCLUDED-WITH-REASON` surfaces: **' + (summary.counts.surfaceStatus['EXCLUDED-WITH-REASON'] ?? 0) + '**; recursive records: **' + (summary.counts.recordStatus['EXCLUDED-WITH-REASON'] ?? 0) + '**.',
  '- `DEPRECATED-COMPAT` surfaces: **' + (summary.counts.surfaceStatus['DEPRECATED-COMPAT'] ?? 0) + '**; recursive records: **' + (summary.counts.recordStatus['DEPRECATED-COMPAT'] ?? 0) + '**.',
  '- `BLOCKED` recursive records: **' + (summary.counts.recordStatus.BLOCKED ?? 0) + '**; these are explicitly retained for later manual/domain audit rather than silently omitted.',
  '- `UNKNOWN` recursive records: **' + (summary.counts.recordStatus.UNKNOWN ?? 0) + '**; this is expected at Phase 0 because leaf-level functional parity has not yet been proven.',
  '',
  '## Drift and risks',
  '',
  ...summary.drift.map((item) => '- **' + item.severity.toUpperCase() + ' — ' + item.code + ':** ' + item.message),
  '',
  '- The Studio package dependency pin remains different from the audited runtime SHA; domain work must not silently use the older installed package as parity truth.',
  '- AST source evidence proves reachable implementation/validator/default/limit/error relationships, but semantic interactions and exact behavior still require each domain phase.',
  '- Recursive depth blocks are explicit and must be eliminated or justified before the final `STUDIO-PARITY-17` release gate.',
  '',
  '## Verification',
  '',
  '- `npm run studio:parity:scan` — deterministic baseline generation.',
  '- `npm run studio:parity:check` — regenerated-artifact and invariant verification.',
  '- `npm run studio:parity:test` — **' + declaredTests + '** declared Phase-0 regression tests.',
  '- `npm run studio:parity:typecheck` — isolated strict TypeScript verification for parity tooling.',
  '- CI gate: `Studio Parity 0 — Runtime Inventory` must pass generation, checks, tests, typecheck, and artifact publication.',
  '',
  '## Phase-0 gates',
  '',
  ...Object.entries(summary.gates).map(([gate, value]) => '- [' + (value ? 'x' : ' ') + '] `' + gate + '`'),
  '',
  '## Generated artifacts',
  '',
  '- `index.json`',
  '- `public-surface.json`',
  '- `runtime-source-map.json`',
  '- `surface-reconciliation.json`',
  '- `gap-summary.json`',
  '- `domains/*.json`',
  '- `BASELINE.md`',
  '- `PHASE-0-COMPLETION.md`',
  '',
  '## Next phase',
  '',
  'Proceed to **STUDIO-PARITY-1 — createCanvas complete recursive parity**. Phase 1 must consume this baseline and may not replace missing evidence with legacy classification claims.',
  '',
];
const completionRendered = completionLines.join('\n');
function writeOrCheck(file: string, value: string, label: string): void {
  if (check) {
    if (!fs.existsSync(file)) throw new Error('[studio-parity] missing generated ' + label);
    const current = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    if (current !== value) throw new Error('[studio-parity] generated ' + label + ' is stale');
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, value);
}

writeOrCheck(outFile, rendered, 'BASELINE.md');
writeOrCheck(completionFile, completionRendered, 'PHASE-0-COMPLETION.md');
console.log(
  '[studio-parity] ' + (check ? 'verified' : 'wrote') +
  ' generated/studio/runtime-parity/BASELINE.md and PHASE-0-COMPLETION.md',
);
